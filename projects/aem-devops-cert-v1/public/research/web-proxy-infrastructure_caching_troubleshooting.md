# Cache Troubleshooting

**Topic ID:** web-proxy-infrastructure.caching.troubleshooting
**Researched:** 2026-03-29T00:00:00Z

## Overview

AEM Dispatcher cache troubleshooting is a critical skill for ensuring both performance and content freshness in AEM deployments. The Dispatcher is a caching and load-balancing tool that sits between end users and AEM publish instances. When caching behaves unexpectedly — either serving stale content or failing to cache at all — understanding the diagnostic tools and root causes is essential [1].

The primary debugging mechanism is the `X-Dispatcher-Info` request header combined with the `X-Cache-Info` response header. By sending a request with this header, operators can get a precise, machine-readable explanation of why the Dispatcher did or did not cache a response [2]. This is far more reliable than guessing based on log output alone and is a core tool for any AEM cache investigation.

Cache issues typically fall into two categories: content that is never cached (cache misses on every request) and content that is cached but not invalidated when it should be (stale content served after updates). Both require different diagnostic approaches — the former uses header inspection and configuration review, the latter involves analyzing `.stat` file timestamps, flush agent configuration, and `statfileslevel` settings [3].

## Key Concepts

- **`X-Dispatcher-Info` request header** — Sent with any HTTP request to trigger the Dispatcher to include cache debug information in the response. The header does not require a value; its mere presence activates the debug response [2].

- **`X-Cache-Info` response header** — The Dispatcher's reply when `X-Dispatcher-Info` is present in the request. Returns a human-readable string explaining the cache status, such as `cached`, `caching`, or `not cacheable: request contained a query string` [2][4].

- **`/info "1"` farm configuration** — A setting that must be explicitly enabled in the farm block of `dispatcher.any` for `X-Cache-Info` responses to work. It is disabled by default [2][4].

- **`X-Cache` header (CDN layer)** — Set by CDN services (e.g., Fastly on AEM as a Cloud Service), NOT by the Dispatcher itself. `X-Cache: HIT` means served from CDN; `X-Cache: MISS` means the CDN forwarded to the Dispatcher or origin [1][2].

- **`.stat` files** — Timestamp sentinel files created by the Dispatcher in cache directories. When a flush occurs, the `.stat` file modification time is updated. On subsequent requests, if the `.stat` file is newer than the cached file, the cached file is considered stale and discarded [3].

- **`/statfileslevel`** — Determines how many directory levels deep the Dispatcher creates `.stat` files during cache invalidation. Level 0 (docroot only) causes maximum over-invalidation; higher levels allow more granular invalidation [3].

- **`/ignoreUrlParams`** — Configuration that defines which query parameters are ignored when determining whether to cache a URL. Without this, any query string causes an automatic cache miss [1][4].

- **`/allowAuthorized`** — Controls whether authenticated requests (containing `Authorization` headers or login cookies) can be cached. Default is `0` (not allowed), causing all authenticated requests to bypass cache [4].

- **Flush agent (`CQ-Action`, `CQ-Handle`, `CQ-Path` headers)** — HTTP headers that tell the Dispatcher that an incoming POST to `/dispatcher/invalidate.cache` is a cache flush request rather than a content request [3].

- **`CQ-Action-Scope: ResourceOnly`** — A special header that prevents the Dispatcher from touching `.stat` files during a flush, useful for preventing unnecessary broad invalidations [3].

## Technical Details

### Enabling X-Dispatcher-Info Debug Headers

In `dispatcher.any`, within the farm block, add the `/info` property [2]:

```
/farm {
  /publishfarm {
    /info "1"
    # ... other farm configuration
  }
}
```

Then test with curl [2]:

```bash
curl -v -H "X-Dispatcher-Info: true" https://<dispatcher-host>/content/mysite/en.html
```

The response will include `X-Cache-Info` with one of these values [4]:

| `X-Cache-Info` Value | Meaning |
|---|---|
| `cached` | File is in cache and valid |
| `caching` | File is not cached yet; being cached now |
| `caching: stat file is more recent` | File cached but invalidated; being refreshed |
| `not cacheable: request contained a query string` | URL has query params without `/ignoreUrlParams` |
| `not cacheable: response contains no_cache` | AEM returned `Dispatcher: no-cache` or `Cache-Control: no-cache` |
| `not cacheable: request needed to be a GET or HEAD` | Non-GET/HEAD method (e.g., POST) |
| `not cacheable: authorization checker denied access` | Auth checker blocked access |
| `not cacheable: session is invalid` | Session manager governing farm; session expired |
| `not cacheable: response content length is zero` | Empty response body |
| `not cacheable: cache file path too long` | Combined docroot + URL exceeds max filename length |
| `not cacheable: no document root` | Farm missing `cache.docroot` setting |

### Log Level Debugging

For deeper diagnostic visibility, set the Dispatcher log level to trace (level 4) [1]:

```
# Apache httpd configuration
DispatcherLog "| /usr/apache/bin/rotatelogs logs/dispatcher.log%Y%m%d 604800"
```

Or set `DISP_LOG_LEVEL` environment variable for Docker-based AEM as a Cloud Service SDK [2]:

- **Level 3** — Debug: errors, warnings; useful during initial setup
- **Level 4** — Trace: logs forwarded headers and applied rules per request

### Conditions for Caching (ALL must be met)

**Request-side requirements** [4]:
- HTTP method is GET or HEAD only
- URL has a file extension (no bare directories)
- No query string, or all query params are listed in `/ignoreUrlParams`
- No `Authorization` header, or `/allowAuthorized "1"` is configured
- No `login-token` or `authorization` cookies (same allowAuthorized rule applies)

**Response-side requirements** [4]:
- HTTP status must be 200 OK
- Response body must be non-empty (content-length > 0)
- Response must not contain `Dispatcher: no-cache`, `Cache-Control: no-cache`, or `Pragma: no-cache` headers

### Manual Flush Testing

To diagnose flush agent issues, manually trigger a cache flush with curl [3]:

```bash
curl -H "CQ-Action: Activate" \
  -H "CQ-Handle: /content/mysite/en/page" \
  -H "CQ-Path: /content/mysite/en/page" \
  -H "Content-Length: 0" \
  -H "Content-Type: application/octet-stream" \
  -H "Host: flush" \
  http://<DISPATCHER_IP>/dispatcher/invalidate.cache
```

After the flush, verify `.stat` file timestamps were updated:

```bash
ls -la /var/www/html/content/.stat
```

### Layered Diagnostic Approach

Isolate the cache layer causing an issue by testing at each layer progressively [2]:

1. **Author (View as Published)** — Verify content is correct in AEM
2. **Direct Publish IP** — Bypass Dispatcher; confirms publish-side correctness
3. **Dispatcher URL** — Add `X-Dispatcher-Info: true` header; read `X-Cache-Info`
4. **CDN URL** — Observe `X-Cache` header for CDN HIT/MISS status

## Common Patterns

**Pattern 1: Diagnosing a cache miss on a new page**

Use curl with `X-Dispatcher-Info: true` to get `X-Cache-Info`. If the value is `not cacheable: request contained a query string`, inspect the URL or refer to marketing/analytics parameters appending to the URL. Add those params to `/ignoreUrlParams` in `dispatcher.any` [1][4].

**Pattern 2: Confirming cache is working after configuration change**

Make a first request (should return `caching`), then a second request (should return `cached`). If the second request still shows `caching`, there is likely a cache rules misconfiguration or the `/docroot` directory is not writable [4].

**Pattern 3: Stale content not being flushed**

Check that the publish-side replication flush agent is configured (not the author-side agent). Go to `http://localhost:4503/etc/replication/agents.publish/flush.html`. Confirm the Transport URI points to the correct Dispatcher IP and that the serialization type is `Dispatcher Flush`. Review `allowedClients` in `dispatcher.any` — if the publish server's IP is not listed, flush requests will be silently rejected [3].

**Pattern 4: Over-broad invalidation causing performance problems**

If every content update invalidates the entire cache, `statfileslevel` is likely set to `0`. Increase it to match the depth of your content tree. For example, content at `/content/brand/en/us/page.html` has depth 5, so setting `statfileslevel "4"` or `"5"` isolates flushes to the relevant subtree [3].

**Pattern 5: AEMaaCS CDN vs. Dispatcher confusion**

On AEM as a Cloud Service, check `X-Cache` first. If it returns `HIT`, the content is served by Fastly (CDN) and the Dispatcher is not involved. Check CDN cache headers (`Cache-Control`, `Surrogate-Control`) on the publish response to understand CDN TTLs. If `X-Cache` is `MISS`, the request reached the Dispatcher level — then use standard Dispatcher troubleshooting [1][2].

## Gotchas

**`X-Cache-Info` is not returned by default.** The `/info "1"` farm property must be explicitly set. Many engineers send `X-Dispatcher-Info` and get no response header, then assume it is broken. The real cause is a missing `/info "1"` in the farm block [2][4].

**`X-Cache` and `X-Cache-Info` are different headers set by different layers.** `X-Cache` is the CDN header (Fastly on AEMaaCS). `X-Cache-Info` is the Dispatcher header triggered by the `X-Dispatcher-Info` request header. These are frequently confused in exam scenarios and community threads [1][2].

**Publish flush agent vs. author flush agent.** Using the author-side flush agent can cause race conditions — the author flushes the Dispatcher cache before the content has been replicated to the publisher. Best practice is to configure the flush agent on the publisher side using the `On Receive` trigger, so the Dispatcher is only flushed after the publisher has the new content [3].

**Query strings are always a cache miss unless explicitly configured.** This catches many developers off guard when analytics parameters like `?utm_source=email` are appended by campaign tools. Every unique query string effectively creates a unique uncacheable URL unless those params are listed in `/ignoreUrlParams` [4].

**`statfileslevel "0"` invalidates everything.** Setting or leaving `statfileslevel` at 0 (the default) means any single page activation invalidates the entire cached site. In production, this setting should reflect the depth of the content tree to prevent over-invalidation [3].

**Authorization headers bypass cache by default.** Pages requested by logged-in users (with `Authorization` headers or `login-token` cookies) are never cached unless `/allowAuthorized "1"` is set. This is a security default, but it confuses developers who see authenticated users always hitting the publisher [4].

**Flush `403 Forbidden` errors.** If the flush agent test returns a 403, the publisher's IP is not in the `allowedClients` list in `dispatcher.any`. Update the `allowedClients` to include the publisher IP, or use a wildcard for internal networks [3].

**TTL-based caching creates `.ttl` marker files.** When `/enableTTL "1"` is set, the Dispatcher creates auxiliary files with `.ttl` extensions alongside cached files. If these marker files exist but are stale, the Dispatcher may serve content beyond its intended expiry or refuse to invalidate it through standard `.stat` mechanisms [1].

## Sources

[1] **Dispatcher Understanding Caching | Adobe Experience Manager Learn (AMS)**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-learn/ams/dispatcher/understanding-cache
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Cache directory structure (author vs publisher), query string handling, ServeOnStale, TTL-based invalidation via `.ttl` files, X-Cache header being CDN-only on AEMaaCS, log level environment variable for SDK.

[2] **Exploring AEM Request and Response Headers: Analysis of Browser, CDN and Dispatcher**
    URL: https://techrevel.blog/2023/09/05/exploring-aem-request-and-response-headers-analysis-of-browser-cdn-and-dispatcher/
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: X-Dispatcher-Info/X-Cache-Info header mechanism, /info "1" farm config requirement, curl testing examples, distinction between X-Cache (CDN) and X-Cache-Info (Dispatcher), Chrome DevTools and Postman debugging approaches, log level settings.

[3] **AEM Dispatcher Flushing | Adobe Experience Manager Learn**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-learn/ams/dispatcher/disp-flushing
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Flush agent configuration (CQ-Action, CQ-Handle, CQ-Path headers), publish vs author flush agent recommendation, .stat file mechanism and timestamp comparison, statfileslevel configuration, allowedClients for flush security, CQ-Action-Scope: ResourceOnly to prevent over-invalidation, curl command for manual flush testing.

[4] **Configure AEM Dispatcher | Adobe Experience Manager (Official Docs)**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-dispatcher/using/configuring/dispatcher-configuration
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Full list of X-Cache-Info response values and their meanings, complete set of caching conditions (request + response), /ignoreUrlParams, /allowAuthorized configuration, Dispatcher log levels (3=debug, 4=trace), trace logging in v4.2.0+.

[5] **Which Requests Does AEM Dispatcher Cache? | Adobe KCS (KA-17497)**
    URL: https://experienceleague.adobe.com/docs/experience-cloud-kcs/kbarticles/KA-17497.html
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: Definitive list of HTTP request and response requirements that must ALL be met for caching to occur, including URL format rules, HTTP method restrictions, status code requirements, and cookie-based auth bypass rules.
