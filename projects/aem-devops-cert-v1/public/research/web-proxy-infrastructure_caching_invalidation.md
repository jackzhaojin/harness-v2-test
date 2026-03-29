# Cache Invalidation Strategies

**Topic ID:** web-proxy-infrastructure.caching.invalidation
**Researched:** 2026-03-29T00:00:00Z

## Overview

AEM Dispatcher cache invalidation is the mechanism for marking cached content as stale and ensuring users receive up-to-date content after a publish event. Rather than deleting cached files immediately, the Dispatcher relies on `.stat` files — empty marker files whose timestamps signal whether surrounding cached content is still valid [1]. When content is activated, the system updates `.stat` file timestamps along the content's directory path; any cached file older than its nearest `.stat` file is considered stale and re-fetched from the Publish tier on the next request [2].

Two distinct operations are frequently conflated: **invalidation** marks cached files as stale without deleting them (files remain on disk but are ignored), while **flush** typically means the full delete-and-optionally-recache cycle initiated from a Publish replication agent [3]. Understanding this distinction is critical on the exam, as flush agents configured on Author vs. Publish behave differently and carry specific race condition risks.

The invalidation architecture exists on a spectrum from broad (a single `.stat` file at docroot invalidating the entire cache) to targeted (ResourceOnly flushes that bypass `.stat` files entirely). Choosing the right strategy depends on content volume, update frequency, multi-site structure, and performance requirements [1][4].

## Key Concepts

- **.stat files** — Empty timestamp files stored in cache directories. The Dispatcher compares a cached file's modification time against its nearest `.stat` file; if the `.stat` file is newer, the cached file is treated as invalid and re-fetched [1][2]. Files are not deleted — they become "stale" in-place.

- **/statfileslevel** — Controls the directory depth at which `.stat` files are created, from docroot (level 0) downward. Higher levels allow more granular, targeted invalidation; level 0 invalidates the entire cache on any update [1][3]. Common recommendations: level 1 per brand, level 2 per country, level 3 per language.

- **Flush Agent** — A replication agent configured to send HTTP invalidation requests to the Dispatcher at `/dispatcher/invalidate.cache`. Can be configured on Author or Publish; **Publish-side flush agents are recommended** to avoid race conditions [2][3].

- **Auto-Invalidation** — A configuration-driven mechanism that automatically marks related cached files as stale when content is published. Configured via the `/invalidate` block in the farm file, which uses glob patterns to define which file types are subject to invalidation [1][2].

- **CQ-Action-Scope: ResourceOnly header** — When this header is included in a flush request, the Dispatcher flushes only the targeted resource without touching any `.stat` files, leaving the broader cache undisturbed [1][2]. Useful for independently-managed resources like generated JSON files.

- **/gracePeriod** — Defines the number of seconds a stale, auto-invalidated resource may still be served from cache after the last activation event. Prevents repeated full-cache churn during batch activations; recommended value is 2 seconds [4].

- **/enableTTL** — When set to `1`, the Dispatcher respects `Cache-Control` / `Expires` HTTP headers from the backend. Creates `.ttl` auxiliary files with future-dated timestamps. With Dispatcher 4.3.5+, both TTL expiry and stat-file invalidation rules are evaluated [4][5].

- **ACS Dispatcher Flush Rules** — An ACS AEM Commons feature enabling smart, dependency-aware flush schemes. Maps replication events at source paths (e.g., `/content/dam/products`) to targeted invalidation of specific content paths (e.g., `/content/my-site/en/products`) [6].

- **serveStaleOnError** — When enabled, the Dispatcher serves stale content instead of an error when the backend (Publish) returns 5xx or a connection timeout, responding with HTTP 111 (Revalidation Failed) [4].

## Technical Details

### Stat File Mechanism

`.stat` files are empty timestamp files maintained in the cache directory hierarchy. When content is published, stat files along the path from docroot to the configured `statfileslevel` depth are "touched" (timestamps updated) [1]. On the next request for any file in those directories, the Dispatcher compares the file's modification time against the nearest `.stat` file. If the `.stat` file is newer, the cached file is considered invalid and re-fetched from Publish [2].

### statfileslevel Configuration

The `/statfileslevel` property in the farm configuration controls stat file depth [1]:

```apache
/cache {
  /statfileslevel "3"
  ...
}
```

- **Level 0**: One `.stat` file at docroot. Any content update invalidates the entire cache across all sites.
- **Level 1**: `.stat` files at `/content/<brand>/`. Update to brand A does not affect brand B.
- **Level 2**: `.stat` files at `/content/<brand>/<country>/`. Per-country isolation.
- **Level 3**: `.stat` files at `/content/<brand>/<country>/<language>/`. Per-language isolation.

If the updated file's actual folder depth is lower than `statfileslevel`, only that folder's `.stat` file is updated. Files in nested subdirectories remain valid [3].

### Auto-Invalidation Configuration

Configured in the farm's `/cache` section using glob patterns [1]:

```apache
/cache {
  /invalidate {
    /0000 { /glob "*" /type "deny" }
    /0001 { /glob "*.html" /type "allow" }
  }
}
```

This restricts auto-invalidation to HTML files only. Other file types (images, CSS, JS) remain cached until explicitly flushed. To exclude specific paths from auto-invalidation [1]:

```apache
/invalidate {
  /0000 { /glob "*" /type "allow" }
  /0002 { /glob "/content/we-retail/us/products/*" /type "deny" }
}
```

### Flush Agent HTTP Headers

Flush requests sent to `/dispatcher/invalidate.cache` include specific headers [2][3]:

| Header | Purpose |
|---|---|
| `CQ-Action` | `Activate` or `Delete` based on the replication event |
| `CQ-Handle` | Full JCR path of the item being flushed (e.g., `/content/mysite/en/page`) |
| `CQ-Path` | Directory path for the flush operation |
| `CQ-Action-Scope` | If set to `ResourceOnly`, bypasses `.stat` file updates |
| `Host` | Targets the "flush" virtual host in Apache config |

### Trusted IP (allowedClients)

The Dispatcher only accepts flush requests from IPs listed in the `allowedClients` section of the invalidation config [3]:

```apache
/allowedClients {
  /0001 { /glob "10.43.0.*" /type "allow" }
}
```

If a flush request comes from an unlisted IP, it is rejected with a log entry: `Flushing rejected from <IP>` [3].

### TTL-Based Invalidation (/enableTTL)

```apache
/cache {
  /enableTTL "1"
  /headers {
    "Cache-Control"
    "Expires"
  }
}
```

When `enableTTL "1"` is set, the Dispatcher creates `.ttl` files with modification times set to the cache expiry date derived from `Cache-Control: max-age=` or `Expires` headers [4][5]. When the current time passes that timestamp, the resource is considered stale. With Dispatcher 4.3.5+, both TTL and stat-file rules are evaluated: if the TTL hasn't expired, the stat-file rules still apply, meaning stat-based invalidation can purge files before their TTL expires [4].

### gracePeriod Configuration

```apache
/cache {
  /gracePeriod "2"
}
```

During batch activations (e.g., Tree Activation), multiple invalidation events fire in rapid succession. Without `gracePeriod`, each event triggers a full re-fetch cycle. With `gracePeriod "2"`, stale content continues to be served for up to 2 seconds, collapsing multiple invalidations into one [4].

## Common Patterns

**Multi-site statfileslevel tuning**: For a site at `/content/brand/country/language/page`, set `statfileslevel "3"` or `"4"` to isolate cache invalidation at the language level. This prevents a French site update from invalidating German content [1][3].

**Publish-side flush agent (recommended pattern)**: Configure a replication agent on the Publish instance to fire on `onReceive`. This ensures: (1) content is fully replicated to Publish before the Dispatcher cache is invalidated, and (2) no race condition where the Dispatcher re-fetches stale content from Publish [2][3].

**Restricting invalidation to HTML only**: Use the `/invalidate` glob rules to deny all file types except `.html`. Static assets (images, fonts, CSS, JS) have their own explicit flush paths and should not be swept up in page-level invalidations [3].

**ResourceOnly flush for independent resources**: For dynamically generated JSON or XML feeds that update on their own schedule, send `CQ-Action-Scope: ResourceOnly` in the flush request. This flushes only that resource without resetting the `.stat` file hierarchy [1][2].

**ACS Flush Rules for dependency-aware invalidation**: When a DAM asset update (e.g., a product image) should only invalidate specific content pages referencing it (not the whole site), configure ACS Dispatcher Flush Rules to map `/content/dam/products/*` replication events to targeted invalidation of `/content/mysite/en/products` [6].

**Graceful invalidation with gracePeriod + batch publish**: During large content migrations or tree activations, set `/gracePeriod "2"` to absorb repeated invalidation spikes. This is especially relevant on high-traffic sites where the cost of cache-miss floods is significant [4].

**TTL-based invalidation for AEM as a Cloud Service**: In AEMaaCS environments or when using a CDN layer, configure `enableTTL "1"` and send appropriate `Cache-Control: max-age=` headers from the Publish tier. This allows disabling Dispatcher flush agents entirely for TTL-governed content [4][5].

## Gotchas

**Author vs. Publish flush agent race condition**: If a flush agent is configured on Author rather than Publish, the invalidation request can reach the Dispatcher before the new content is fully replicated to Publish. The next request then retrieves the old content from Publish and caches it again. Always prefer Publish-side flush agents [2][3].

**statfileslevel "0" invalidates everything**: Any content update touches the single docroot `.stat` file, cascading to the entire cache. This is the default in many older configurations and is a common source of performance problems in multi-site deployments [1][3].

**Auto-invalidation vs. flush**: These are separate mechanisms. Auto-invalidation (via `/invalidate` glob rules) marks `.stat` files as stale when content is published. Manual flush (via replication agent) deletes cached files explicitly. A misconfigured `/invalidate` block allowing only `*.html` means that if a DAM asset is published, its cached renditions are NOT auto-invalidated — they require an explicit flush [2][3].

**TTL and stat files interact since Dispatcher 4.3.5**: Before 4.3.5, enabling `enableTTL` caused the Dispatcher to ignore stat-file invalidation for TTL-governed files. From 4.3.5 onward, both are evaluated. This means older documentation about "TTL overrides stat files" is incorrect for modern deployments [4].

**ACS Flush Rules: deploy on Publish, NOT Author (AEM 6.5)**: The ACS Flush Rules feature must run on Publish for AEM 6.5 on-premise because it catches Sling Distribution events. Running it on Author in AEM 6.5 causes the same Author-side race condition. In AEM as a Cloud Service, deploy on Author because there is no separate Publish-side replication [6].

**CQ-Action-Scope: ResourceOnly does NOT update .stat files**: If you use ResourceOnly to flush a page's HTML file, the `.stat` file is not touched. This means other cached files in the same directory tree are NOT invalidated. This is correct behavior for independent resources, but incorrect if you intended to invalidate related pages [1][2].

**serveStaleOnError and HTTP 111**: When `serveStaleOnError` is enabled and the backend is unavailable, the Dispatcher returns stale content with a `111` status code appended. Monitoring systems that only check for 2xx/3xx will miss this degraded state [4].

**Flush requests need matching virtual host**: The `Host` header in the flush request must match a virtual host configured in Apache. If there is a mismatch, the flush silently fails — no `.stat` file is updated and no error is logged at the Dispatcher level [3].

**statfileslevel too deep causes performance overhead**: Setting `statfileslevel` to a very high value (e.g., 10) causes the Dispatcher to traverse deep directory trees during every flush operation. This increases I/O overhead and can degrade performance on large caches [3].

## Sources

[1] **Invalidate Cached Pages From AEM | Adobe Experience Manager**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-dispatcher/using/configuring/page-invalidate
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Core mechanism of .stat files, statfileslevel behavior, CQ-Action-Scope: ResourceOnly header, auto-invalidation /invalidate configuration patterns, flush agent configuration steps.

[2] **AEM Dispatcher Flushing | Adobe Experience Manager (AMS)**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-learn/ams/dispatcher/disp-flushing
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Publish vs. Author flush agent recommendation, trusted IP (allowedClients) configuration, invalidation rules for HTML-only flushing, HTTP headers used in flush requests (CQ-Action, CQ-Handle, CQ-Path), stat file timestamp comparison mechanics.

[3] **Deep-dive into AEM Dispatcher's Cache Flush Strategies**
    URL: https://techrevel.blog/2023/08/28/deep-dive-into-aem-dispatchers-cache-flush-strategies/
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: statfileslevel depth recommendations by site structure, farm configuration examples, enableTTL and .ttl file mechanics, allowedClients configuration, X-Dispatcher-Info debugging headers, graceful invalidation with TTL.

[4] **AEM Dispatcher gracePeriod, enableTTL, serveStaleOnError Configuration**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-dispatcher/using/configuring/dispatcher-configuration
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: gracePeriod behavior and recommended value of 2 seconds, enableTTL mechanics and .ttl file creation, serveStaleOnError behavior and HTTP 111 status, Dispatcher 4.3.5+ combined TTL + stat-file invalidation logic, Cache-Control header caching configuration.

[5] **aem-dispatcher-experiments: enableTTL | Adobe GitHub**
    URL: https://github.com/adobe/aem-dispatcher-experiments/blob/main/experiments/enableTTL/README.md
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: enableTTL minimum Dispatcher version (4.1.11), .ttl file future-dated timestamp mechanics, disabling flush agents when TTL is fully adopted, interaction between TTL and stat-file invalidation pre/post Dispatcher 4.3.5.

[6] **ACS AEM Commons: Dispatcher Flush Rules**
    URL: https://adobe-consulting-services.github.io/acs-aem-commons/features/dispatcher-flush-rules/index.html
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: Smart/targeted flush via regex-mapped source-to-target path rules, deployment differences between AEM 6.5 (Publish) and AEMaaCS (Author), race condition warning when running on Author in AEM 6.5, prop.rules.resource-only for ResourceOnly flush agents, one-to-many flushing since v1.9.2.
