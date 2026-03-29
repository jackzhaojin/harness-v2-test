# Dispatcher Farm Configuration

**Topic ID:** web-proxy-infrastructure.dispatcher-config.farm-files
**Researched:** 2026-03-29T00:00:00Z

## Overview

An AEM Dispatcher farm is the core configuration unit that governs how the Dispatcher handles incoming requests, proxies them to AEM publish instances, and caches the responses. Each farm is defined in a `*_farm.any` file and wired together under a top-level `dispatcher.any` file [1]. A single Dispatcher can host multiple farms simultaneously, enabling different caching, filtering, and routing strategies per domain, path prefix, or audience type [2].

Farm configuration encompasses five primary concerns: which render instances (AEM publishers) to forward uncached requests to (`/renders`), which incoming requests are permitted or denied (`/filter`), how cached content is stored and invalidated (`/cache`), which hostnames or URI patterns route to this farm (`/virtualhosts`), and which HTTP headers pass through to the render (`/clientheaders`) [1]. Understanding the interaction between these sections — especially the order of evaluation — is critical for both operational correctness and exam success.

In Adobe Managed Services (AMS) deployments, farm files follow a symlink pattern: files live in `available_farms/` and are activated by symlinks placed in `enabled_farms/`. This mirrors the Apache vhost convention and allows farms to be enabled/disabled without editing configuration [3].

## Key Concepts

- **Farm file** — A `.any` file describing one logical Dispatcher configuration unit. Named `FILENAME_farm.any` in AMS. Included via `dispatcher.any` [3]. All enabled farms must have unique names [4].

- **`/renders`** — Lists AEM publish instances that the Dispatcher proxies to. Supports multiple renders for load balancing. Key sub-properties: `/hostname`, `/port`, `/timeout` (connection timeout in ms, default 0 = indefinite), `/receiveTimeout` (response timeout, default 600000ms), `/secure` (enable HTTPS), `/always-resolve` (re-resolve hostname per request, v4.1.6+) [1].

- **`/filter`** — Controls which HTTP requests the Dispatcher accepts. All unmatched requests return 404. Uses last-match-wins semantics: the final matching rule governs the outcome [1]. Best practice is a deny-all-first (allowlist) strategy [4].

- **`/cache`** — Defines what is cached, where, and when to invalidate. Includes `/docroot` (cache directory on filesystem), `/rules` (which URLs are cacheable), `/invalidate` (which URL patterns get invalidated on content activation), `/statfileslevel`, `/gracePeriod`, `/serveStaleOnError`, and `/allowAuthorized` [1].

- **`/statfileslevel`** — Controls cache invalidation granularity. A numeric depth: Dispatcher creates `.stat` files at each directory level from the docroot up to this depth. When content activates, `.stat` files at the affected path and above are touched, invalidating only the portion of the cache that overlaps [1][4]. Setting this overrides the `/statfile` property entirely.

- **`/gracePeriod`** — Seconds a stale, auto-invalidated resource can still be served from cache after the last activation. Protects the publish tier from repeated rendering during burst activations. Recommended value is `>= 2` [4].

- **`/serveStaleOnError`** — When set to `"1"`, the Dispatcher continues serving the invalidated cached copy if the render returns HTTP 502/503/504 or times out. The client receives HTTP 111 (Revalidation Failed) [1].

- **`/virtualhosts`** — Hostname and optional scheme/URI patterns this farm accepts. Format: `[scheme://]host[/uri][*]`. Controls farm routing; farms are evaluated bottom-up in `dispatcher.any`, and within each farm's `/virtualhosts`, the most-specific match wins [1][4].

- **`/stickyConnectionsFor`** — Pins all requests from the same user within a specified path to the same render instance. Required for session-sensitive paths such as authenticated account pages [1].

## Technical Details

### Farm Structure

A complete farm skeleton looks like this [1]:

```
/farms {
  /publish {
    /clientheaders  { ... }
    /virtualhosts   { "www.example.com" }
    /renders {
      /rend01 {
        /hostname "aem-publish.internal"
        /port "4503"
        /timeout "0"
        /receiveTimeout "600000"
      }
    }
    /filter         { ... }
    /vanity_urls    { ... }
    /cache {
      /docroot "/var/www/html/cache"
      /statfileslevel "2"
      /gracePeriod "2"
      /serveStaleOnError "1"
      /allowAuthorized "0"
      /rules        { ... }
      /invalidate   { ... }
      /ignoreUrlParams { ... }
    }
    /statistics {
      /categories {
        /html  { /glob "*.html" }
        /others { /glob "*" }
      }
    }
    /stickyConnectionsFor "/content/secure"
    /health_check   { /url "/libs/granite/core/content/login.html" }
    /retryDelay "1"
    /numberOfRetries "5"
    /failover "1"
  }
}
```

### Filter Rules

Filters use last-match-wins semantics [1]. A typical allowlist pattern:

```
/filter {
  /0001 { /type "deny" /url "*" }                          # deny everything
  /0011 { /type "allow" /url "/content/*" }                # allow content tree
  /0021 { /type "allow" /extension "(css|js|png|gif|ico)" }# allow static assets
  /0031 { /type "deny" /path "/content/*"
          /selectors "(feed|rss|pages|blueprint|infinity|tidy)"
          /extension "(json|xml|html)" }                   # block dangerous selectors
  /0041 { /type "deny" /query "debug=*" }                  # block debug
  /0051 { /type "deny" /query "wcmmode=*" }                # block wcmmode
}
```

Filters support decomposed URL matching (path, selectors, extension, suffix, query) for fine-grained control, available from Dispatcher v4.2.0 [1]. The `glob` pattern applies to the entire request line and is an older, coarser approach.

### Cache Rules and `statfileslevel`

The `/cache/rules` block uses glob patterns to decide what is cacheable [1]:

```
/cache {
  /docroot "/var/www/html"
  /statfileslevel "2"
  /rules {
    /0000 { /glob "*" /type "deny" }
    /0001 { /glob "*.html" /type "allow" }
    /0002 { /glob "/content/dam/*" /type "allow" }
  }
  /invalidate {
    /0001 { /glob "*.html" /type "allow" }
  }
}
```

`/statfileslevel` depth reference (docroot = level 0) [1][4]:

| Level | `.stat` files created in |
|-------|--------------------------|
| 0 | docroot only — entire cache invalidated on any activation |
| 1 | docroot + `/content` |
| 2 | docroot + `/content` + `/content/mysite` |
| 3 | docroot + down to `/content/mysite/en` |

### ignoreUrlParams

Controls whether query strings prevent caching. Use an allowlist: ignore all params by default, then deny-ignore the ones that matter for cache keys [1][4]:

```
/ignoreUrlParams {
  /0001 { /glob "*" /type "allow" }         # ignore all params (cache regardless)
  /0002 { /glob "q" /type "deny" }          # do NOT ignore "q" — include in cache key
}
```

### Multi-Farm Setup for Multiple Domains

For multiple websites, define one farm per domain plus a dedicated cache invalidation farm [2]:

```
/farms {
  /flush {
    /virtualhosts   { "invalidation_only" }
    /renders        { /flush01 { /hostname "localhost" /port "80" } }
    /filter         { /0001 { /type "allow" /glob "*" } }
    /cache {
      /docroot "/var/www/html"
      /statfileslevel "2"
      /rules { /0001 { /glob "*" /type "allow" } }
    }
  }
  /sitea {
    /virtualhosts   { "www.sitea.com" }
    /cache { /docroot "/var/www/html/sitea" /statfileslevel "2" }
    ...
  }
  /siteb {
    /virtualhosts   { "www.siteb.com" }
    /cache { /docroot "/var/www/html/siteb" /statfileslevel "2" }
    ...
  }
}
```

Each domain farm gets its own `/docroot`, preventing cross-domain cache corruption. The flush farm's `/statfileslevel` must be high enough to create `.stat` files in each domain's docroot path [2].

### Failover and Load Balancing

When multiple renders are defined, the Dispatcher load-balances using the `/statistics` categories. The render with the lowest response-time score for the matched category is chosen [1]. Failover can be enabled with `/failover "1"`, causing requests to be re-sent to alternate renders on HTTP 503. Use `/retryDelay` and `/numberOfRetries` to tune retry behavior.

## Common Patterns

**Pattern 1: Secure vs. anonymous farm split.** Two farms are defined — one for public content (broad caching, `allowAuthorized "0"`) and one for authenticated paths (no caching, sticky connections). The authenticated farm's `/virtualhosts` uses a path prefix like `www.example.com/account/*` to capture only the secure section [1][2].

**Pattern 2: AMS symlink-based activation.** Farm files are authored in `available_farms/` and activated by creating symlinks in `enabled_farms/`. The naming convention `001_publish_farm.any`, `002_auth_farm.any` controls load order since Apache includes files alphabetically [3]. The number prefix ensures author farm rules are distinct from publish farm rules.

**Pattern 3: Domain-specific docroots.** When hosting multiple brands, each brand's farm points to a separate `/docroot` subtree. Combined with `statfileslevel "2"`, a content activation for `sitea` only touches `sitea`'s `.stat` files, leaving `siteb`'s cache intact [2].

**Pattern 4: TTL-based caching.** Setting `/cache/enableTTL "1"` allows the Dispatcher to honor `Cache-Control: max-age` and `Expires` headers from AEM, enabling time-based expiration independently of manual flush [1].

## Gotchas

**`/statfileslevel` vs. `/statfile` mutual exclusion.** Setting `/statfileslevel` entirely ignores the `/statfile` property. If you define both, only `statfileslevel` takes effect [4]. A common mistake is defining both expecting the statfile location to matter — it does not.

**`statfileslevel "0"` invalidates the entire cache.** Level 0 means a single `.stat` at the docroot. Any content activation touches that file and invalidates everything in the cache. This is catastrophic on large sites and is the default if not set. Always set to `>= 2` for publish farms [4].

**Last-match-wins for filters.** Unlike firewall rules (which are often first-match), Dispatcher filter evaluation applies the *last* matching rule. A broad allow rule placed after specific deny rules will override them [1]. This is the most commonly misunderstood behavior — put the deny rules at the bottom for patterns you never want to allow.

**Farm evaluation is bottom-up, virtualhost matching is top-down.** When selecting which farm handles a request, `dispatcher.any` farms are evaluated from bottom to top. Within the chosen farm, `/virtualhosts` entries are evaluated top to bottom. The fallback if nothing matches is the topmost virtualhost in the topmost farm [1][4].

**`/allowAuthorized "0"` (default) means authenticated requests are never cached.** Requests with `Authorization` headers or cookies that indicate authentication bypass the cache entirely. Setting `allowAuthorized "1"` caches them but also means any user could receive another user's cached, authenticated page — a serious security risk [1].

**`/stickyConnectionsFor` is path-prefix only.** It pins all requests *under* the specified path to one render. It does not support wildcards or multiple paths in a single directive (you need multiple `stickyConnectionsFor` directives or use the `stickyConnections` block in multi-path scenarios) [1].

**Filters have no effect on requests for the `.stat` file.** Requests that trigger cache invalidation (i.e., flush requests from the replication agent) targeting the `.stat` path are always rejected by filters. The flush farm must be configured separately [1].

**`/virtualhosts` scheme matching is optional.** Omitting the scheme matches both HTTP and HTTPS. Specifying `https://www.example.com` restricts the farm to HTTPS only. Forgetting the scheme on a farm intended for HTTPS-only traffic means it will also match unencrypted requests [1].

**`gracePeriod` protects renders but means stale content during bursts.** Setting `gracePeriod "2"` is a best-practice recommendation. However, during a large activation storm it means users may see content up to 2 seconds stale. Do not set a very large value on highly time-sensitive sites [4].

**AEMaaCS file ordering matters.** On AEM as a Cloud Service, vhost and farm files are loaded alphabetically. Naming custom files without a numeric prefix (e.g., `sitea.vhost` instead of `001_sitea.vhost`) can cause them to load after `default.vhost`, making `default.vhost` handle those requests first [3].

## Sources

[1] **Configure AEM Dispatcher — Adobe Experience League**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-dispatcher/using/configuring/dispatcher-configuration
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Full farm structure, /renders options, /filter syntax and last-match rule, /cache properties (docroot, statfileslevel, gracePeriod, serveStaleOnError, allowAuthorized, enableTTL, ignoreUrlParams), /virtualhosts format and matching algorithm, /statistics, /stickyConnectionsFor, failover and retry settings.

[2] **Use Dispatcher with Multiple Domains — Adobe Experience League**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-dispatcher/using/configuring/dispatcher-domains
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Multi-farm architecture (domain farms + dedicated invalidation farm), domain-specific docroots, statfileslevel requirements for cross-domain invalidation isolation, Sling mapping vs. web server URL rewriting comparison.

[3] **Explanation of Dispatcher Configuration Files (AMS) — Adobe Experience League**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-learn/ams/dispatcher/explanation-config-files
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: AMS symlink-based farm activation pattern (available_farms/ → enabled_farms/), naming conventions (_farm.any, .vhost, _rewrite.rules), alphabetical file-load ordering, vhost sub-include structure.

[4] **AEM Dispatcher Optimizer Tool — Rules.md (Adobe GitHub)**
    URL: https://github.com/adobe/aem-dispatcher-optimizer-tool/blob/main/docs/Rules.md
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: Best-practice rules: statfileslevel >= 2, gracePeriod >= 2, serveStaleOnError enabled, unique farm names, allowlist filter strategy, ignoreUrlParams allowlist, required deny patterns from AEM archetype.

[5] **AEM Dispatcher: Filters, ignoreUrlParams, virtualhosts, rewrites — TechRevel Blog**
    URL: https://techrevel.blog/2023/09/01/aem-dispatcher-filters-ignoreurlparams-virtualhosts-rewrites/
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: ignoreUrlParams allowlist configuration example, virtualhost matching order walk-through (bottom-up farms, top-down within farm), URL rewriting flags (R, L, NC, PT) and debug techniques.
