# TTL and Cache Headers

**Topic ID:** web-proxy-infrastructure.caching.ttl-configuration
**Researched:** 2026-03-29T00:00:00Z

## Overview

AEM as a Cloud Service implements a multi-layer caching architecture: browser, CDN (Adobe-managed Fastly), Dispatcher, and AEM Publish origin. Controlling cache lifetime (TTL) at each layer requires deliberate HTTP response header configuration [1][2]. Without explicit headers, the platform applies default TTLs that may be either too short (causing excess origin load) or too long (serving stale content after publishes) [1].

The three primary mechanisms for controlling cache lifetime are: `Cache-Control` (browser + CDN), `Surrogate-Control` (CDN only), and Dispatcher's `enableTTL` directive (Dispatcher only). Each has a distinct scope and priority, and misunderstanding which header governs which layer is a common source of certification exam errors [2][3]. For AEM on-premise and AMS deployments using AEM 6.5, Dispatcher TTL configuration through `enableTTL` is the primary mechanism; for AEM as a Cloud Service, CDN-layer header control via `Surrogate-Control` is central [1][4].

The `stale-while-revalidate` and `stale-if-error` directives extend basic TTL semantics by allowing cached responses to continue serving during background revalidation or origin outages, improving perceived performance without increasing staleness risk significantly [2][3].

## Key Concepts

- **`Cache-Control: max-age`** — Instructs both the browser and the CDN how long to cache a response in seconds. When `Surrogate-Control` is also present, the CDN ignores `Cache-Control` and uses `Surrogate-Control` instead [1][2].

- **`Surrogate-Control: max-age`** — CDN-only directive that controls Adobe-managed Fastly cache duration independently from browser cache. Preferred when browser and CDN TTLs must differ [1][2]. Important: `Surrogate-Control` is specific to the Adobe-managed CDN. If a customer-managed CDN sits in front, a different header (e.g., `CDN-Cache-Control` for Cloudflare) may be required [1].

- **`stale-while-revalidate`** — Allows the cache to serve a stale (expired) response while simultaneously fetching a fresh version in the background. Prevents cache misses from causing visible latency [2][3].

- **`stale-if-error`** — Allows the cache to serve a stale response when the origin returns an error during revalidation. Improves availability during origin failures [2][3].

- **`s-maxage`** — A standard `Cache-Control` directive targeting shared caches (CDNs) only, overriding `max-age` for CDNs while leaving browser behavior unchanged. An alternative to `Surrogate-Control` when vendor-neutral headers are preferred [4][5].

- **Dispatcher `enableTTL`** — Configuration property (`/enableTTL "1"`) that enables Dispatcher to honor TTL from `Cache-Control` or `Expires` headers. Creates a `.ttl` file alongside cached content with a future modification timestamp. Available in Dispatcher 4.1.11+ [4][6].

- **Default AEM Cloud Service TTLs** — HTML/text: 5 minutes; client libraries (JS/CSS): 30 days (immutable); images/DAM assets: 10 minutes; persisted GraphQL queries: 2 hours [1].

- **CDN caching exclusions** — Responses with `Cache-Control: private`, `no-cache`, or `no-store` are never cached by the CDN. Responses with a `Set-Cookie` header are also excluded [1].

## Technical Details

### Cache Header Priority (CDN Layer)

The CDN (Fastly) applies this priority order when evaluating cache headers [1][2]:

1. `Surrogate-Control` — takes precedence when present
2. `Cache-Control` — used when `Surrogate-Control` is absent
3. `Expires` — fallback when neither of the above is set

### Dispatcher `enableTTL` Configuration

Enable in `dispatcher.any` [4][6]:

```apache
/cache {
    /enableTTL "1"
}
```

When enabled, Dispatcher creates a companion `.ttl` file with a modification timestamp equal to the expiry date from the response headers. Requests arriving after that timestamp trigger a fresh fetch from origin. Key version note: Dispatcher 4.3.5+ accounts for both TTL expiry AND `statfiles`-based invalidation rules. Earlier versions (4.1.11–4.3.4) only respect TTL and ignore flush-based invalidation for TTL-managed files [4].

To cache the `Cache-Control` response header through the Dispatcher (so the CDN downstream receives it), add it to the `/cache/headers` section [6]:

```apache
/cache {
    /headers {
        "Cache-Control"
        "Content-Disposition"
        "Content-Type"
        "Expires"
        "Last-Modified"
    }
}
```

### Apache `mod_headers` Configuration (Dispatcher vhost)

The recommended approach for AEM as a Cloud Service is to set headers in the Dispatcher vhost using Apache `mod_headers`. This is deployed via Cloud Manager's Web Tier Config Pipeline [2][3]:

```apache
# Different TTLs for browser vs CDN
<LocationMatch "^/content/.*\.(html)$">
    Header unset Cache-Control
    Header unset Surrogate-Control
    Header unset Expires
    Header set Cache-Control "max-age=300"
    Header set Surrogate-Control "max-age=43200"
    Header set Age 0
</LocationMatch>
```

Full example with stale directives [2][3]:

```apache
<LocationMatch "^/content/.*\.(html)$">
    Header set Cache-Control "max-age=300, stale-while-revalidate=3600, stale-if-error=43200"
    Header set Surrogate-Control "max-age=43200, stale-while-revalidate=43200, stale-if-error=43200"
    Header set Age 0
</LocationMatch>
```

### Setting Headers in Java Code

For author-side or dynamic caching requirements, headers can be set in Sling servlets/filters [2]:

```java
response.setHeader("Cache-Control", "max-age=600, stale-while-revalidate=3600");
response.setHeader("Surrogate-Control", "max-age=3600, stale-while-revalidate=3600, stale-if-error=43200");
```

### Content-Type-Specific TTL Recommendations [1][5]

| Content Type | Browser TTL | CDN TTL | stale-while-revalidate |
|---|---|---|---|
| HTML pages | 5 min (300s) | 12 hours (43200s) | 1 hour (3600s) |
| Mutable JS/CSS (clientlibs) | 12 hours (43200s) | 12 hours | 12 hours |
| Immutable JS/CSS (hashed) | 30 days (2592000s) | 30 days | 12 hours |
| DAM assets | 24 hours (86400s) | 24 hours | 12 hours |
| Persisted GraphQL queries | — | 2 hours (default) | configurable |

## Common Patterns

**Scenario 1: HTML pages need different browser and CDN TTLs.**
Use `Surrogate-Control` for a long CDN TTL (12h) and `Cache-Control` for a short browser TTL (5 min). This allows the CDN to serve the page efficiently from the edge while ensuring browsers pick up changes relatively quickly after a CDN purge [1][2].

**Scenario 2: Client library (JS/CSS) caching.**
Immutable client libraries use content-hash-based URLs. Set `Cache-Control: max-age=2592000, immutable` so both browser and CDN cache indefinitely. When the code changes, a new URL is generated, automatically invalidating the cache [5]:

```apache
<LocationMatch "^/etc.clientlibs/.*\.(js|css|ttf|woff2)$">
    Header set Cache-Control "max-age=2592000, stale-while-revalidate=43200, stale-if-error=43200, public, immutable"
</LocationMatch>
```

**Scenario 3: TTL-based Dispatcher invalidation (AEM 6.5 / AMS).**
When using `enableTTL "1"` in Dispatcher, flush agents can be disabled for TTL-managed content, simplifying the invalidation architecture. This is especially useful when content is published frequently on a schedule rather than on-demand [4][6].

**Scenario 4: Adding `stale-while-revalidate` as a starting point.**
Adobe recommends adding a 30-minute `stale-while-revalidate` to all cache headers as a baseline. This prevents thundering herd problems at TTL expiry while keeping content reasonably fresh [1].

## Gotchas

- **`Surrogate-Control` silently overrides `Cache-Control` at the CDN.** If both are set, the CDN uses `Surrogate-Control` exclusively for its own TTL. A common mistake is setting a long `Cache-Control` max-age expecting the CDN to use it, while a conflicting `Surrogate-Control` with a short value overrides it [1][2].

- **`Surrogate-Control` is Adobe-managed CDN specific.** For customer-managed CDN deployments (Cloudflare, Akamai, Fastly self-managed), a different proprietary header may be required (e.g., `CDN-Cache-Control` for Cloudflare). The `Surrogate-Control` header is not a universal standard [1].

- **`enableTTL` with Dispatcher 4.3.5+ changes invalidation semantics.** Before 4.3.5, enabling TTL caused Dispatcher to ignore `.stat`-based flush invalidation entirely for TTL-managed files. Post-4.3.5, both mechanisms are respected (TTL AND stat-file invalidation). This means an older Dispatcher will NOT flush TTL-managed content when a page is published [4].

- **Sibling page staleness with `enableTTL`.** When TTL-based caching is active on Dispatcher, publishing one page does not refresh sibling pages or related pages — they only update when their individual TTLs expire. Traditional flush-based invalidation propagates changes more broadly. This is a commonly tested scenario [4][6].

- **`s-maxage` vs `Surrogate-Control`.** Both target CDNs only, but `s-maxage` is a standard RFC directive inside `Cache-Control`, while `Surrogate-Control` is a separate header. When `Surrogate-Control` is present, it takes precedence over `s-maxage` at the Adobe CDN [3].

- **`Set-Cookie` headers disable CDN caching.** Any response that sets a cookie (including session cookies from login state detection) will not be cached by the CDN, even if `Cache-Control` is set correctly. A common gotcha in personalization scenarios [1].

- **`Vary` header causes cache fragmentation.** Adding `Vary: User-Agent` or `Vary: Accept-Language` causes the CDN to maintain separate cache entries per header value, dramatically reducing cache hit ratio. Only use `Vary: Accept-Encoding` (for gzip) in most cases [1].

- **AEM default HTML TTL is 5 minutes.** Without explicit header configuration, HTML content is cached for only 5 minutes at both browser and CDN. This is intentional as a safe default but may cause performance issues at scale. Always configure explicit TTLs for production [1].

- **`Age 0` header in vhost config.** When setting cache headers in the Dispatcher vhost, include `Header set Age 0` to reset the age counter. Without this, downstream caches may see an artificially reduced effective TTL [2][3].

- **`private` in Cache-Control disables CDN caching entirely.** AEM Author instances set `Cache-Control: private` by default for all responses to prevent CDN caching of authoring content. Adobe recommends against enabling CDN caching on Author [2].

## Sources

[1] **Caching in AEM as a Cloud Service — Adobe Experience League**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/content-delivery/caching
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Default TTL values, Cache-Control vs Surrogate-Control priority, CDN caching exclusions (Set-Cookie, private, no-cache), Vary header warnings, stale-while-revalidate recommendations, marketing parameter stripping behavior

[2] **How to Enable CDN Caching — Adobe Experience Manager Learn**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-learn/cloud-service/caching/how-to/enable-caching
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: mod_headers configuration patterns, Surrogate-Control CDN-specificity, stale-while-revalidate and stale-if-error examples, Java code approach for headers, Cloud Manager deployment path

[3] **Deciphering AEM Cache Puzzle: Browser, CDN (Revalidation), and Dispatcher**
    URL: https://techrevel.blog/2024/04/22/deciphering-aem-cache-puzzle-browser-cdn-revalidation-and-dispatcher/
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: Four-tier cache architecture overview, s-maxage vs Surrogate-Control comparison, stale-while-revalidate usage examples, header applicability table (CDN vs Dispatcher vs Browser)

[4] **AEM Dispatcher enableTTL Experiment — Adobe GitHub**
    URL: https://github.com/adobe/aem-dispatcher-experiments/blob/main/experiments/enableTTL/README.md
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: enableTTL configuration steps, .ttl file creation mechanism, version differences (4.3.5 change), sibling-page staleness gotcha, flush agent disablement when using TTL

[5] **Setting Up Effective Caching Rules for AEM Cloud — Rebellion Design**
    URL: https://www.thisisarebellion.com/blog-articles/aem-in-depth-setting-up-effective-caching-rules-for-the-cloud/
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: Per-content-type Cache-Control values with s-maxage and stale-while-revalidate, immutable resource patterns, vhost file location (dispatcher/src/conf.d/available_vhosts/)

[6] **Configure AEM Dispatcher — Adobe Experience League**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-dispatcher/using/configuring/dispatcher-configuration
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: /enableTTL property configuration, /cache/headers section for passing headers downstream, Dispatcher version requirements (4.1.11+), interaction with statfiles-based invalidation
