# Dispatcher Filters and Rules

**Topic ID:** web-proxy-infrastructure.dispatcher-config.filters
**Researched:** 2026-03-29T00:00:00Z

## Overview

AEM Dispatcher's `/filter` section is the primary request access control mechanism, determining which HTTP requests the Dispatcher processes and forwards versus which it rejects with a 404 response. If no `/filter` section exists, all requests are accepted by default — a dangerous state for any production system [1]. Filter rules are evaluated sequentially top-to-bottom, and the last matching rule determines the final outcome (allow or deny) [1].

The recommended architecture for any AEM Dispatcher configuration is an allowlist (deny-first) strategy: block everything by default, then explicitly permit only the paths, methods, selectors, extensions, and suffixes your application requires [2]. This model is more secure than a denylist approach because it limits exposure to unknown or unanticipated request patterns. Any URL not explicitly allowed results in a 404, rather than silently serving content that should be restricted.

Dispatcher 4.2.0 introduced a set of granular URL-component filter properties (`/path`, `/selectors`, `/extension`, `/suffix`) that supplement the earlier `/url`, `/method`, `/query`, and `/protocol` properties. These allow precise matching on individual URL parts, replacing the deprecated `/glob` approach which matched against the entire request line and is prone to security gaps [1][3].

## Key Concepts

- **`/type`** — Required in every filter rule. Value must be either `"allow"` or `"deny"`. Indicates the action taken when the rule's pattern matches an incoming request [4].
- **Last-matching-rule-wins** — AEM Dispatcher evaluates all filter rules sequentially. When multiple rules match a single request, the **last** matching rule takes effect. This is the opposite of "first match wins" systems like Apache `mod_rewrite` [1].
- **Allowlist (deny-first) strategy** — Start with a catch-all deny (`/type "deny" /url "*"`), then allow specific paths. Optionally end with backstop deny rules for known dangerous patterns. This is Adobe's recommended approach for publish farms [1][2].
- **`/glob` (deprecated)** — Matches the entire HTTP request line using glob syntax. Still functional but deprecated since Dispatcher 4.2.0 due to security risks from overly broad patterns. Should be avoided in new configurations [1][3].
- **Granular URL-component filters (Dispatcher 4.2.0+)** — `/path`, `/selectors`, `/extension`, `/suffix` allow filtering on specific URL segments instead of the whole request line. Preferred over `/glob` [1].
- **`/selectors` and `/suffix` default deny** — For publish farm configurations, both Sling selectors and Sling suffixes should be denied by default and individually allowlisted. Unrestricted selectors/suffixes can enable DoS attacks and disk exhaustion [3].
- **`/query` matching** — Rules containing `/query` only match requests that include a query string matching the pattern. Requests without any query string require separate allowance rules [1][4].
- **Regex vs. glob syntax** — Simple patterns use double quotes (`"pattern"`). POSIX Extended Regular Expressions use single quotes (`'pattern'`). Available from Dispatcher 4.2.0+. Wildcards in patterns: `*` (zero or more chars), `?` (single char), `[]` (character class) [1].
- **Numeric rule naming** — The official Dispatcher Optimizer Tool discourages purely numeric rule names (e.g., `/0001`) as they are meaningless in log files and prone to name clashes. Descriptive names improve debuggability [3].

## Technical Details

### Rule Syntax

Each filter rule is a named block within `/filter { }` in `dispatcher.any`:

```
# From Adobe official documentation [1]
/filter {
  /0001 { /type "deny" /url "*" }

  # Allow static assets by extension
  /0041 { /type "allow" /extension '(css|gif|ico|js|png|swf|jpe?g)' }

  # Allow content path
  /0023 { /type "allow" /url "/content*" }

  # Block feed selectors on JSON/XML (backstop deny)
  /0082 {
    /type "deny"
    /path "/content/*"
    /selectors '(feed|rss)'
    /extension '(json|xml)'
  }
}
```

### Filter Properties Reference

| Property | Available Since | Matches Against |
|---|---|---|
| `/type` | All versions | Required — `"allow"` or `"deny"` |
| `/glob` | All versions (deprecated) | Entire HTTP request line |
| `/url` | All versions | Full URL path |
| `/method` | All versions | HTTP verb (GET, POST, etc.) |
| `/query` | All versions | Query string portion |
| `/protocol` | All versions | HTTP/HTTPS protocol |
| `/path` | 4.2.0+ | URL path component |
| `/selectors` | 4.2.0+ | Sling selector portion |
| `/extension` | 4.2.0+ | File extension |
| `/suffix` | 4.2.0+ | URL suffix portion |

### Deny/Allow Precedence and Evaluation Order

The dispatcher processes all rules in order and applies the last matching rule [1]:

```
Request: GET /content/page.html

Rule 1: /type "deny" /url "*"          -> MATCHES -> current decision: deny
Rule 2: /type "allow" /url "/content*" -> MATCHES -> current decision: allow
Rule 3: /type "deny" /url "/content/admin*" -> NO MATCH

Final decision: ALLOW (last match was Rule 2)
```

This means more specific rules placed later in the file **override** earlier, more general rules. The common pattern is: deny all → allow specific → deny specific dangerous patterns (backstop).

### Recommended Publish Farm Filter Structure

The AEM Dispatcher Optimizer Tool (DOT) requires publish farms to start with a default deny set from the AEM 6.x archetype [3]:

```
/filter {
  # 1. Catch-all deny
  /0001 { /type "deny" /url "*" }

  # 2. Allow required content paths
  /0010 { /type "allow" /url "/content/*" }
  /0011 { /type "allow" /url "/etc/designs/*" }
  /0012 { /type "allow" /url "/etc/clientlibs/*" }

  # 3. Allow static asset extensions
  /0041 { /type "allow" /extension '(css|gif|ico|js|png|swf|jpe?g)' }

  # 4. Deny all Sling selectors by default (DOTRules:Disp-7)
  /0100 { /type "deny" /selectors "*" }

  # 5. Allow specific selectors
  /0110 { /type "allow" /selectors "model" /extension "json" }

  # 6. Deny all Sling suffixes by default (DOTRules:Disp-6)
  /0200 { /type "deny" /suffix "*" }

  # 7. Backstop: Block known dangerous patterns
  /0300 { /type "deny" /url "*.infinity.json" }
  /0301 { /type "deny" /url "*.tidy.json" }
  /0302 { /type "deny" /url "*CRXDE*" }
}
```

### CSRF Protection Filter

To support AEM's CSRF Protection Framework without bypassing it at the dispatcher [2]:

```
/csrfFilter { /type "allow" /url "/libs/granite/csrf/token.json" }
```

Additionally, add `CSRF-Token` to the `clientheaders` section.

### Query String Filtering Pattern

A rule with `/query` only matches requests that have a query string. Requests without query strings need separate handling [1][4]:

```
/filter {
  /0001 { /type "deny" /method "POST" /url "/etc/*" }
  # Allow GET to /etc/ with specific query parameter only
  /0002 { /type "allow" /method "GET" /url "/etc/*" /query "a=*" }
  # Note: GET /etc/something (no query string) is still denied by /0001
}
```

## Common Patterns

### Pattern 1: Author vs. Publish Filter Strategy

Author farms typically use a denylist approach (allow most, deny admin tools). Publish farms must use an allowlist (deny all, allow specific) [1][2]:

- **Author**: Allow `/content`, `/etc`, `/libs` broadly; deny `/crx/de`, `/system/console`, `/bin/wcm`
- **Publish**: Deny everything; allow only known public content paths and static assets

### Pattern 2: Precise Allowlist Rule (Preferred)

The Adobe Tech Blog recommends maximally precise allow rules that specify all URL components, leaving no room for URL injection [1]:

```
# Overly broad (risky): allows arbitrary selectors/suffixes
/bad-rule { /type "allow" /url "/content/app/*" }

# Precise (recommended): specifies all URL components
/good-rule {
  /type "allow"
  /url "/content/app/*"
  /selectors ""
  /extension "html"
  /suffix ""
}
```

### Pattern 3: Extension Allowlist for Static Assets

```
# Allow only known-safe file extensions [1]
/static-assets {
  /type "allow"
  /extension '(html|css|js|png|jpg|gif|ico|svg|woff|woff2|ttf|pdf)'
}
```

### Pattern 4: Blocking Known Dangerous URL Patterns

Standard security backstop rules that should be present in every publish farm [2][3]:

```
/block-infinity    { /type "deny" /url "*.infinity.json" }
/block-tidy        { /type "deny" /url "*.tidy.json" }
/block-sling-map   { /type "deny" /url "*.sling.json" }
/block-childrenlist { /type "deny" /url "*.childrenlist.json" }
/block-crxde       { /type "deny" /url "/crx/*" }
/block-libs        { /type "deny" /url "/libs/*" }
/block-system      { /type "deny" /url "/system/*" }
```

### Pattern 5: GraphQL / Headless AEM Filters

For AEM headless deployments using GraphQL persisted queries:

```
/graphql-persisted { /type "allow" /url "/graphql/execute.json/*" }
```

Block non-persisted (ad hoc) GraphQL queries entirely at the dispatcher for security.

## Gotchas

- **Last-match-wins (NOT first-match-wins)** — This is the most commonly confused aspect of Dispatcher filters. Unlike Apache `mod_rewrite` (first match wins), AEM Dispatcher applies the **last** matching rule. Placing a broad allow rule after a specific deny rule will override the deny. The official documentation states: "When multiple filter patterns apply to a request, the last applied filter pattern is effective." [1] Some third-party blogs incorrectly state "first match wins" — always defer to Adobe's official documentation [4].

- **`/glob` is deprecated but still works** — `/glob` will not cause immediate errors but is a security risk. The key danger: `glob "*"` in a filter allow rule is a common misconfiguration that grants access to everything, bypassing all deny rules placed before it [1][3].

- **`/query` rules don't match queryless requests** — If you add `/query "a=*"` to an allow rule, that rule only matches requests that have the `a` parameter. A request to the same URL without any query string will not match this rule and will fall through to whatever the prior matching rule decided [1].

- **Selector/suffix DoS vectors** — Sling's URL anatomy allows arbitrary selectors (e.g., `/content/page.infinity.tidy.json`) and suffixes. Without default-deny rules on `/selectors` and `/suffix`, attackers can craft URLs that force AEM to generate unique responses, bypassing Dispatcher cache and overwhelming the publish tier [3].

- **Regex requires single quotes, glob uses double quotes** — Mixing quotation style breaks the rule. `'(css|js)'` is a regex pattern; `"*.css"` is a glob pattern. Using double quotes around a regex-style string results in literal character matching, not regex evaluation [1].

- **Caching and filters interaction** — Filters operate between incoming requests and the cache lookup. Cached files bypass filter evaluation on subsequent requests. After changing filter rules, the Dispatcher cache must be purged to ensure deny rules apply to previously-cached content [4].

- **No selector ordering expression** — There is no way to express in a Dispatcher filter rule that selectors must appear in a specific order. If selector order matters, use `mod_rewrite` at the vhost level as a pre-filter [4].

- **Author farm should never be internet-facing** — Even with strict filters, the author instance should always sit behind a separate, more restrictive farm or be entirely unavailable from the public internet [2].

- **`/libs/granite/security/currentuser.json` must not be cached** — This path must be allowed through to the publish instance but explicitly excluded from the Dispatcher cache using `/rules` in the cache section [2].

## Sources

[1] **Configure AEM Dispatcher — Adobe Experience League**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-dispatcher/using/configuring/dispatcher-configuration
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Complete filter syntax reference, all filter properties, deny/allow precedence ("last applied filter pattern is effective"), glob deprecation, regex vs. glob quotation rules, query parameter matching behavior, and recommended configuration examples.

[2] **Dispatcher Security Checklist — Adobe Experience League**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-dispatcher/using/getting-started/security-checklist
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Allowlist strategy rationale, blocked URL patterns for admin paths, CSRF filter configuration, allowed exceptions for `/libs/` paths, and HTTPS/cache security recommendations.

[3] **AEM Dispatcher Optimizer Tool — Rules Documentation (Adobe GitHub)**
    URL: https://github.com/adobe/aem-dispatcher-optimizer-tool/blob/main/docs/Rules.md
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: DOTRules:Disp-4 (default deny set requirement), DOTRules:Disp-6 (suffix deny), DOTRules:Disp-7 (selector deny), allowlist philosophy, and filter structure for publish farms.

[4] **AEM Dispatcher Filter Section — JavaDoubts**
    URL: https://javadoubts.com/aem-dispatcher-filter-section/
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: `/type` as required attribute in all filter rules, filter property table, query string filtering patterns, cache interaction with filters, and selector ordering limitation.
