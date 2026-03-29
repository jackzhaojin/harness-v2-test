# URL Rewrite Rules

**Topic ID:** web-proxy-infrastructure.dispatcher-config.rewrite-rules
**Researched:** 2026-03-29T00:00:00Z

## Overview

Apache `mod_rewrite` is the primary URL manipulation mechanism at the AEM Dispatcher layer. Rewrite rules intercept incoming HTTP requests before they reach AEM Publish, allowing the Dispatcher to transform public-facing "short" URLs into the internal JCR content paths that AEM understands. For example, a request for `/aboutus` can be silently mapped to `/content/we-retail/us/en/about-us.html` — the visitor never sees the internal path [1][2].

This matters because AEM stores content under `/content/<project>/<...>` paths, but exposing those paths publicly is considered poor practice for both user experience and security. URL rewrite rules serve three main purposes: **vanity URLs** (memorable shortcuts for marketing campaigns or editorial convenience), **canonicalization** (ensuring only one authoritative URL exists per resource, critical for SEO), and **redirects** (sending browsers and search engine crawlers to new locations when content moves) [3][4].

In AEM as a Cloud Service and AMS deployments, rewrite rules live in `conf.d/rewrites/rewrite.rules` within the Dispatcher project and are version-controlled, deployed via Cloud Manager pipelines [5]. Understanding when to handle URL manipulation at the Dispatcher vs. at the Sling/AEM level is a heavily tested distinction in the AEM DevOps certification.

## Key Concepts

- **RewriteEngine On** — Must be explicitly enabled inside `<IfModule mod_rewrite.c>` blocks within the VirtualHost configuration; without it no rules fire [2][4].

- **RewriteRule pattern substitution flags** — Each `RewriteRule` takes a regex pattern, a substitution string, and optional `[flags]`. Flags control whether the result is a redirect visible to the browser (`R`), a silent server-side pass-through (`PT`), case-insensitive matching (`NC`), query string preservation (`QSA`), or rule-chain termination (`L`) [4][6].

- **RewriteCond** — A conditional guard placed before a `RewriteRule`. Multiple conditions default to AND logic; `[OR]` flag makes them OR. Used to match on server variables like `%{HTTP_HOST}`, `%{REQUEST_URI}`, or `%{HTTP:X-Forwarded-Proto}` [2][4].

- **PT (Pass Through) flag** — Passes the rewritten URI back to Apache's URL mapping phase so that other modules (Aliases, ScriptAliases) can evaluate it. PT implies L. Critical when rules must hand off to Dispatcher's own request routing [4][6].

- **R=301 vs R=302** — `R=301` is a permanent redirect (search engines update their index); `R=302` is temporary (search engines keep the original URL). Omitting the code defaults to `302`. Certification questions frequently test which code to use for SEO vs. maintenance scenarios [4][6].

- **Content-path masking** — The canonical AEM pattern: strip `/content/<site>/` from outgoing URLs (via Sling Mapping) and prepend it back via `mod_rewrite` for inbound requests. Dispatcher-level rewriting means the cache stores content at the short path, so invalidation signals also arrive with the short path — this avoids the cache-miss problem that Sling Mappings alone can cause [3].

- **default_rewrite.rules vs rewrite.rules** — In AEM as a Cloud Service, `default_rewrite.rules` is Adobe-managed (immutable); customer rules belong exclusively in `rewrite.rules`. Editing the immutable file has no effect and will cause validation failures in Cloud Manager [5].

- **RewriteMap** — A lookup file or program that maps keys to values, enabling bulk redirects without listing thousands of individual `RewriteRule` directives. Integrates with ACS AEM Commons Redirect Map Manager for no-restart, author-managed redirect lists [2][7].

## Technical Details

### Enabling the Module and Basic Setup

```apache
# Typically placed in the VirtualHost conf that includes rewrite.rules
<IfModule mod_rewrite.c>
    RewriteEngine On
    # Debug logging (development only) — AEMaaCS uses REWRITE_LOG_LEVEL in global.vars
    # RewriteLog "logs/rewrite.log"
    # RewriteLogLevel 9
</IfModule>
```

In AEM as a Cloud Service, set `REWRITE_LOG_LEVEL trace2` in `conf.d/variables/global.vars` to capture rewrite debug output in `/etc/httpd/logs/httpd_error.log` [8].

### Content-Path Masking (Most Common AEM Pattern)

This pattern strips the `/content/<site>/` prefix from public URLs and re-adds it before passing requests to AEM Publish [2][3]:

```apache
# Block known AEM system paths from being rewritten
RewriteCond %{REQUEST_URI} !^/apps
RewriteCond %{REQUEST_URI} !^/bin
RewriteCond %{REQUEST_URI} !^/content
RewriteCond %{REQUEST_URI} !^/etc
RewriteCond %{REQUEST_URI} !^/home
RewriteCond %{REQUEST_URI} !^/libs
RewriteCond %{REQUEST_URI} !^/saml_login
RewriteCond %{REQUEST_URI} !^/system
RewriteCond %{REQUEST_URI} !^/tmp
RewriteCond %{REQUEST_URI} !^/var
# Only rewrite requests for files with HTML/image extensions
RewriteCond %{REQUEST_URI} \.(html|jpg|jpeg|png|svg)$
# Map short path to full AEM content tree
RewriteRule ^/(.*)$ /content/${CONTENT_FOLDER_NAME}/$1 [PT,L]
```

The `PT,L` flags pass the rewritten path to Apache's next processing phase (allowing Dispatcher to cache it) and stop further rule evaluation [9].

### Vanity URL Mapping

```apache
# Map memorable short path to full AEM content path — from Adobe Experience League [1]
RewriteRule ^/aboutus /content/we-retail/us/en/about-us.html [PT,L,NC]
```

`NC` (No Case) ensures `/AboutUs`, `/ABOUTUS`, and `/aboutus` all resolve correctly [1].

### Canonicalization: www to non-www (from Adobe WKND Reference Implementation)

```apache
# Redirect www to root domain — permanent 301 [9]
RewriteCond %{HTTP_HOST} ^www\.wknd\.site$ [NC]
RewriteRule ^(.*)$ https://wknd.site%{REQUEST_URI} [R=301,L,E=cdncache:1]

# Route root requests to locale homepage without X-Forwarded-Proto
RewriteCond %{REQUEST_URI} ^/$
RewriteCond %{HTTP:X-Forwarded-Proto} !https
RewriteRule ^(/)$ /us/en.html [R=301,L,E=cdncache:1]
```

### Trailing Slash and Extension Handling

```apache
# Remove trailing slash [2]
RewriteRule ^(.+)/$ $1 [R=301,L]

# Append .html before passing to AEM Publish
RewriteCond %{REQUEST_URI} !^/$
RewriteRule ^/(.*)/$ /$1.html [PT,L,QSA]
```

Note: Dispatcher does not cache responses for URLs without a file extension. Appending `.html` via rewrite before passing to the backend ensures caching works correctly [2].

### File Structure in AEM Cloud Service

```
dispatcher/
  src/
    conf.d/
      rewrites/
        default_rewrite.rules   ← Adobe-managed (immutable, do not edit)
        rewrite.rules           ← Customer rules go here
    conf.dispatcher.d/
      ...
  opt-in/
    USE_SOURCES_DIRECTLY        ← Enables "flexible mode" (Archetype 28+)
```

In flexible mode, multiple `.rules` files are allowed under `conf.d/rewrites/`, but sub-folders are not supported in AEM as a Cloud Service [5].

## Common Patterns

**Pattern 1: Domain-Specific Asset Routing**
Use `RewriteCond %{SERVER_NAME}` combined with `RewriteRule` to serve different `robots.txt`, `sitemap.xml`, or `favicon.ico` based on which domain received the request. Common in multi-brand Dispatcher setups where a single Dispatcher serves multiple sites [9].

**Pattern 2: Protocol Enforcement (HTTPS)**
```apache
RewriteCond %{HTTP:X-Forwarded-Proto} !https
RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [R=301,L]
```
AEM as a Cloud Service CDN terminates TLS upstream, so the `X-Forwarded-Proto` header rather than `%{HTTPS}` must be used to detect the original protocol [5].

**Pattern 3: RewriteMap for Bulk Redirects**
Define a lookup file and reference it in rules — avoids thousands of individual `RewriteRule` directives [7]:
```apache
RewriteMap redirect_301 dbm:/etc/httpd/conf.d/rewrites/301_map.db
RewriteRule ^(.+)$ ${redirect_301:$1|} [R=301,L]
```
ACS AEM Commons Redirect Map Manager automates generation of these map files from JCR content without requiring an Apache restart [7].

**Pattern 4: Environment-Specific Variables**
Use `${CONTENT_FOLDER_NAME}` and similar variables defined in `conf.d/variables/global.vars` so the same `rewrite.rules` file works across dev, stage, and prod without changes [9].

**Pattern 5: Vanity URL Files Per Domain**
Create separate vanity rewrite files (e.g., `examplevanity_rewrite.rules`) and include them inside the relevant `.vhost` file to scope vanity URLs to a specific domain rather than all sites served by the Dispatcher [1].

## Gotchas

**`PT` is implied in `.htaccess` but NOT in VirtualHost context.** When rules are placed directly in a VirtualHost configuration (the AEM standard), `PT` must be explicitly specified or Apache treats the substitution as a filesystem path, causing file-not-found errors for valid URLs [6].

**Do not rewrite `/dispatcher/invalidate.cache`.** If this path is accidentally captured by a catch-all rewrite rule, the Dispatcher cache will never be invalidated when content is published, leading to stale content. Always add a `RewriteCond %{REQUEST_URI} !^/dispatcher/` guard before catch-all rules [5].

**Dispatcher vanity URL feature vs. mod_rewrite vanity rules conflict.** AEM's built-in vanity URL mechanism (`/vanity_urls` block in dispatcher.any) and Apache `mod_rewrite` vanity rules can conflict. If a `mod_rewrite` rule prepends `/content/<project>` to all unknown paths, AEM's own vanity paths will never match because they arrive at AEM already prefixed. Use one method consistently per site [1].

**`R` alone defaults to `302` (temporary).** A common exam gotcha: `[R,L]` issues a 302, NOT a 301. This is incorrect for permanent SEO-critical moves. Always specify `[R=301,L]` for permanent redirects [6].

**`QSA` must be explicit** — without it, any query string on the original request is silently discarded by the rewritten URL. This breaks forms, pagination, and analytics parameters [4][6].

**`default_rewrite.rules` immutability in Cloud Service.** Editing this file locally appears to work but changes are discarded at deployment time in AEM as a Cloud Service. Cloud Manager validation will flag it as an error. All custom rules must live in `rewrite.rules` [5].

**Sling Mapping + Dispatcher Rewrite = cache invalidation mismatch.** If Sling Mapping is used to rewrite outgoing URLs in AEM (so links render with short paths) AND mod_rewrite is used to expand short paths back to `/content/...` for the backend, the Dispatcher cache stores content under the short path but invalidation requests from AEM arrive with the full `/content/...` path. This mismatch means cache entries are never invalidated. Use one system (Sling OR Dispatcher) as the single source of truth for path mapping [3].

**`NC` flag does not stop processing** — unlike `L`, `NC` only affects the pattern match of the current rule. The next rules in the file still evaluate. Always pair with `L` when a match should be terminal [6].

**`RewriteLog` and `RewriteLogLevel` are Apache 2.2 directives.** In Apache 2.4 (used by modern AEM Dispatcher), use `LogLevel rewrite:trace2` or the AEMaaCS `REWRITE_LOG_LEVEL` variable instead. Using old directives causes Apache startup failure [8].

## Sources

[1] **AEM Dispatcher Vanity URLs Feature — Adobe Experience League**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-learn/ams/dispatcher/disp-vanity-url
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Vanity URL configuration, mod_rewrite vs. AEM built-in comparison, PT/L/NC flags, `/vanity_urls` block config, delay parameter, namespace collision gotcha, per-domain vanity files pattern.

[2] **AEM Dispatcher: What Are AEM Dispatcher Rewrite Rules? — Axamit**
    URL: https://axamit.com/blog/adobe-experience-manager/what-are-dispatcher-rewrite-rules/
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: RewriteEngine setup, content-path exclusion pattern, trailing-slash handling, extension-appending rules, cache-caching extension requirement.

[3] **AEM URL Shortening: Sling Mappings vs Dispatcher Rewrites — Meticulous Digital**
    URL: https://meticulous.digital/blog/f/aem-url-shortening-sling-mappings-vs-dispatcher-rewrites
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Cache invalidation mismatch problem with mixed Sling+Dispatcher approach, AEM-awareness trade-offs, vanity path conflict when mod_rewrite prepends /content, recommendation for choosing one system.

[4] **AEM Dispatcher: Filters, ignoreUrlParams, VirtualHosts, Rewrites — TechRevel**
    URL: https://techrevel.blog/2023/09/01/aem-dispatcher-filters-ignoreurlparams-virtualhosts-rewrites/
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Flag descriptions (R, L, NC, PT), practical examples (lowercase rewrite, extension swap, path masking, root routing), debug logging via REWRITE_LOG_LEVEL.

[5] **URL Redirects — Adobe Experience League**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-learn/foundation/administration/url-redirection
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Six redirect solution comparison (CDN, BYOCDN, mod_rewrite, ACS Redirect Map, ACS Redirect Manager, page property), default_rewrite.rules immutability, Cloud Manager pipeline deployment, /dispatcher/invalidate.cache gotcha.

[6] **RewriteRule Flags — Apache HTTP Server 2.4 Official Documentation**
    URL: https://httpd.apache.org/docs/2.4/rewrite/flags.html
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Authoritative flag definitions: R (default 302), L, PT (implies L, implied in .htaccess but not VirtualHost), NC, QSA behavior (discards query string without flag), flag combination semantics.

[7] **Redirect Map Manager — ACS AEM Commons**
    URL: https://adobe-consulting-services.github.io/acs-aem-commons/features/redirect-map-manager/index.html
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: RewriteMap integration, no-restart redirect management, DBM map file generation from JCR vanity paths, separation of permanent vs temporary redirect maps.

[8] **Dispatcher Tips and Tricks on AEM as a Cloud Service — Adobe Tech Blog**
    URL: https://medium.com/adobetech/dispatcher-tips-and-tricks-on-aem-as-a-cloud-service-ddb9d4341f5d
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: REWRITE_LOG_LEVEL variable usage, Apache 2.4 logging directive change (RewriteLog deprecated), debug output location.

[9] **WKND Reference Implementation rewrite.rules — Adobe GitHub**
    URL: https://github.com/adobe/aem-guides-wknd/blob/main/dispatcher/src/conf.d/rewrites/rewrite.rules
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: www-to-non-www redirect with R=301/E=cdncache, root-path-to-locale-homepage redirect with X-Forwarded-Proto condition, content-path rewrite with 10 system path exclusions, domain-specific asset serving pattern, Cache-Control header for CDN.
