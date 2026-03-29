# AEM Dispatcher Overview

**Source:** https://experienceleague.adobe.com/docs/experience-manager-dispatcher/using/dispatcher.html
**Extraction ID Prefix:** EXT-3
**Extracted:** 2026-03-29T00:00:00Z
**Content Authority:** Official Adobe Experience League documentation (authoritative for certification exam)

## Summary

Dispatcher is Adobe Experience Manager's caching and load-balancing tool that sits between the internet and AEM publish (or author) instances. It operates as a module on an enterprise-class web server (Apache or IIS), caching content as static files, serving cacheable requests without contacting AEM, and distributing load across multiple AEM instances. This page provides a high-level architectural overview of Dispatcher's caching, load-balancing, security, and invalidation mechanisms — all core topics for the AEM DevOps Engineer Expert certification.

## Key Facts

- `EXT-3-fact-1`: The Dispatcher is both a **caching tool** and a **load-balancing tool** — it is not solely a cache or solely a load balancer.
- `EXT-3-fact-2`: Dispatcher works with supported enterprise web servers, specifically **Apache** and **IIS** (Internet Information Services).
- `EXT-3-fact-3`: Dispatcher is independent of AEM versions — it works across different AEM releases.
- `EXT-3-fact-4`: Only **GET** or **HEAD** (for the HTTP header) request methods are cacheable by Dispatcher.
- `EXT-3-fact-5`: Dispatcher always requests a document directly from AEM (bypasses cache) when the request URI contains a question mark `?`, indicating a dynamic page (e.g., search results).
- `EXT-3-fact-6`: Dispatcher does **not** cache a request when the **file extension is missing** — the web server needs the extension to determine the document type (MIME type).
- `EXT-3-fact-7`: Dispatcher does **not** cache a request when the **authentication header is set** (this behavior is configurable).
- `EXT-3-fact-8`: Dispatcher stores cached documents in the **document root** of the web server as static files, matching the URL structure of the original request.
- `EXT-3-fact-9`: Without HTTP Header Caching configuration, Dispatcher stores only the HTML code and **omits response headers** — this causes problems if pages use different encodings (e.g., multilingual sites).
- `EXT-3-fact-10`: The primary configuration file for Dispatcher is **`dispatcher.any`**.
- `EXT-3-fact-11`: A separate configuration file **`author_dispatcher.any`** is used for author-side Dispatcher deployments.
- `EXT-3-fact-12`: Dispatcher can cache author instance content to improve the authoring experience, but this must **NOT** be used with **AEM Touch UI**.
- `EXT-3-fact-13`: Performance optimization guidance: prioritize good caching before implementing load balancing — "good caching may increase the load balancer's performance, or render load balancing unnecessary."
- `EXT-3-fact-14`: Using multiple Dispatcher instances is a rare configuration and must be considered carefully — an extra Dispatcher can **increase load** on publish instances and "easily decrease performance in most applications."
- `EXT-3-fact-15`: There are **two primary cache update methods**: (1) Content Updates (file deletion) and (2) Auto-Invalidation (statfile timestamp comparison).
- `EXT-3-fact-16`: **Content Update** behavior — deletes modified files AND all files that start with the same handle. Example: updating `/en/index.html` removes all files starting with `/en/index.`.
- `EXT-3-fact-17`: **Auto-Invalidation** does NOT physically delete files — it touches the statfile to update its timestamp; the Dispatcher then compares cached document dates against the statfile timestamp to determine freshness.
- `EXT-3-fact-18`: Dispatcher maintains **internal statistics** about how fast each AEM instance processes documents per document category, and uses these to distribute load efficiently.
- `EXT-3-fact-19`: Dispatcher works alongside CDN infrastructure (e.g., Akamai, CloudFront). CDN cache control can use expiration headers, explicit configuration, manual invalidation, or API-based purging.

## Definitions

- `EXT-3-def-1`: **Dispatcher** — Adobe Experience Manager's caching and/or load-balancing tool that operates as a module on an enterprise-class web server, combining static web server capabilities with dynamic AEM content management.
- `EXT-3-def-2`: **Statfile** — A special file whose timestamp indicates the date of the last content change. Dispatcher "touches" (updates the timestamp of) the statfile whenever content is updated. Cached documents are compared against this timestamp to determine freshness.
- `EXT-3-def-3`: **Auto-Invalidation** — A cache invalidation mechanism where Dispatcher automatically flags parts of the cache as outdated after an update, without physically deleting the cached files. It compares the cached document date against the statfile timestamp.
- `EXT-3-def-4`: **Sticky Connections** — A load-balancing feature that ensures a user's personalized content is composed on the same AEM publish instance across requests. Restricts optimization capability and typically requires caching to be switched off for those pages.
- `EXT-3-def-5`: **Permission-Sensitive Caching** — A Dispatcher security feature that checks user permissions before serving cached content, ensuring cached pages are only served to authorized users.
- `EXT-3-def-6`: **Document Root** — The directory on the web server where Dispatcher stores its cache files, mirroring the URL structure of cached content. Must reside on local filesystem, not NAS.

## Patterns and Best Practices

- `EXT-3-pattern-1`: **Cache invalidation via content updates** follows a three-step process: (1) delete the modified files from the cache, (2) delete all files that start with the same handle (e.g., deleting `/en/index.html` also removes `/en/index.*`), (3) touch the statfile to update its timestamp.
- `EXT-3-pattern-2`: **Auto-invalidation freshness check** works in two steps: (1) check if the cached document is subject to auto-invalidation, (2) compare the cached document's last-modified date against the statfile timestamp to decide whether to re-request from AEM.
- `EXT-3-pattern-3`: **Load balancing with Dispatcher** distributes computational load across multiple AEM instances, providing increased processing power and fail-safe coverage (if one instance becomes unavailable, requests route to others).
- `EXT-3-pattern-4`: **CDN integration** — When Dispatcher is used with a CDN, the CDN sits in front of Dispatcher as the outermost caching layer. Cache control with CDN is managed via: (a) explicit configuration by MIME type, extension, or request type, (b) HTTP headers (`Expires:` and `Cache-Control:`), (c) manual invalidation through CDN interface, (d) API-based invalidation (REST/SOAP).
- `EXT-3-pattern-5`: **Author Dispatcher deployment** requires a seven-step process: (1) install Dispatcher on a web server, (2) test against a working publish instance first, (3) verify TCP/IP connection to the author instance, (4) replace `dispatcher.any` with `author_dispatcher.any`, (5) modify `/hostname`, `/port`, and `/docroot` settings, (6) delete existing cache files, (7) restart the web server.
- `EXT-3-pattern-6`: **Statfile per language folder** — Language-specific directory structures (e.g., `/en/`, `/fr/`) can each contain individual statfiles, enabling granular invalidation scoping.
- `EXT-3-pattern-7`: **Cache location** — The Dispatcher cache must be stored on the **local filesystem** of the web server, not on network-attached storage. Avoid NAS for the document root.
- `EXT-3-pattern-8`: Invalidate the cache after **feature pack deployment** to prevent serving outdated files.

## Important Warnings

- `EXT-3-warn-1`: **Do NOT cache author instance content when using AEM Touch UI.** If author caching was previously enabled, it must be disabled and all existing cache contents must be deleted.
- `EXT-3-warn-2`: **Network-Attached Storage (NAS) causes performance degradation** when used as the Dispatcher document root. When NAS is shared between multiple web servers, intermittent file locks can occur during replication actions.
- `EXT-3-warn-3`: **Sticky connections typically require disabling caching** for the affected pages. For most pages using sticky connections, caching must be switched off, which limits optimization.
- `EXT-3-warn-4`: **Multiple Dispatcher instances can decrease performance.** Adding an extra Dispatcher increases load on available publish instances rather than reducing it.
- `EXT-3-warn-5`: **Author Dispatcher flushing agent must be deleted or disabled** when reconfiguring from a publish-facing to an author-facing Dispatcher setup. Failing to do so may cause incorrect cache invalidation behavior.
- `EXT-3-warn-6`: **HTTP Header Caching must be explicitly enabled** in Dispatcher configuration. By default, Dispatcher only caches HTML content and omits HTTP response headers, which causes problems when pages use different character encodings.
- `EXT-3-warn-7`: Requests with query strings (containing `?`) are **never cached** by default — they are always forwarded to AEM. This is a common exam gotcha.

## Configuration Reference

### What Gets Cached vs. What Does Not

| Condition | Cached? |
|-----------|---------|
| GET request, has file extension, no `?`, no auth header | Yes |
| Request URI contains `?` (query string) | No |
| Request has no file extension | No |
| Request has authentication headers (default config) | No |
| HEAD request (for HTTP headers) | Yes (configurable) |
| POST request | No |
| Author instance content (Touch UI) | No (must not cache) |

### Author Instance Dispatcher Setup (7 Steps)

1. Install Dispatcher on Apache or IIS
2. Test Dispatcher against a working publish instance
3. Verify TCP/IP connectivity to the author instance
4. Replace `dispatcher.any` with `author_dispatcher.any`
5. Modify `/hostname`, `/port`, and `/docroot` values to point to author
6. Delete all existing cache files
7. Restart the web server
