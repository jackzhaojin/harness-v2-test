# CDN and Load Balancing

**Topic ID:** monitoring-quality.scaling.cdn-configuration
**Researched:** 2026-03-29T00:00:00Z

## Overview

AEM as a Cloud Service (AEMaaCS) includes an Adobe-managed CDN powered by Fastly that is always active and cannot be removed [1]. This CDN sits at the outermost layer of the delivery architecture, reducing latency by serving cacheable content from global Points of Presence (POPs) close to the end user. Below the CDN sits the AEM Dispatcher (Apache with `mod_dispatcher`), which acts as a secondary caching layer in front of the AEM Publish tier [2]. The Publish tier runs as a farm of AEM publisher instances — each paired with an Apache Dispatcher — that scales dynamically during traffic spikes with a minimum of two pods for business continuity [3].

Load balancing in AEMaaCS is built into the architecture: access to both the Author and Publish tiers always happens via a load balancer that stays in sync with the currently active node of each tier [3]. The Dispatcher itself also acts as a Layer 7 caching and load balancing layer that handles content-aware routing, instant failover, and the ability to withstand traffic spikes [2]. Customers who want to use their own CDN (BYOCDN) can do so, but they must point it to the Adobe-managed Fastly CDN — they cannot replace Fastly, only layer on top of it [1].

Configuration of the CDN layer is done via YAML files (`cdn.yaml`) deployed through Cloud Manager's Config Pipeline. This enables self-service management of traffic filtering, request/response transformations, redirects, origin selectors, and cache purge tokens — all without a full-stack deployment [4].

## Key Concepts

- **Adobe-Managed CDN (Fastly)** — Always present and cannot be disabled. Serves as the primary caching layer at the edge. Every AEMaaCS environment gets a default CDN ingress at `publish-p<PROGRAM_ID>-e<ENV-ID>.adobeaemcloud.com` [1].

- **Dispatcher** — Secondary caching layer using Apache HTTP Server with `mod_dispatcher`. Acts as a reverse proxy and cache for the Publish tier. While the CDN is now the primary cache, Dispatcher remains important because CDN caches are per datacenter — Dispatcher ensures caching coverage within the same data center [2].

- **Load Balancer** — Routes incoming traffic to active Author and Publish tier nodes. Provides instant failover and handles auto-scaling events transparently [3].

- **BYOCDN (Bring Your Own CDN)** — Customers with an existing CDN infrastructure can place it in front of Adobe's Fastly CDN. The customer CDN must point to the Adobe CDN ingress domain, pass the `X-AEM-Edge-Key` header, and forward the `X-Forwarded-Host` header [1].

- **X-AEM-Edge-Key** — A shared secret HTTP header that authenticates requests from a customer-managed CDN to Adobe's Fastly CDN. Configured in Cloud Manager as a pipeline secret and referenced in `cdn.yaml` [5].

- **Config Pipeline** — A Cloud Manager pipeline type that deploys YAML configuration files (CDN rules, WAF rules, etc.) to target environments. Takes approximately 1-2 minutes; does NOT require a full-stack deployment. Has a 100 KB cumulative file size limit [4].

- **Surrogate-Control vs Cache-Control** — `Cache-Control` controls both browser and CDN caching. `Surrogate-Control` controls only the CDN TTL (Fastly-specific), independently of browser caching. When present, `Surrogate-Control` takes precedence over `Cache-Control` at the CDN layer [6].

- **Origin Selectors** — CDN-level rules that route requests to different backends (non-AEM origins, Edge Delivery, custom domains). Origins cannot use `.adobeaemcloud.com` domains to prevent request loops [4].

- **Cache Purge API** — AEMaaCS supports three CDN cache purge types: single URL, surrogate key (bulk), and full purge. Requires an API token configured in `cdn.yaml` and sent as the `X-AEM-Purge-Key` header [7].

- **Marketing Query Parameter Stripping** — For environments created October 2023 onwards, the CDN automatically strips common marketing query parameters (`utm_*`, `gclid`, `fbclid`, etc.) by default to improve cache hit ratios [8].

## Technical Details

### Request Flow

```
User Browser
   → Customer CDN (optional BYOCDN)
   → Adobe CDN (Fastly) — edge caching, WAF, traffic rules
   → AEM Dispatcher — secondary cache (per datacenter)
   → AEM Publish — origin, renders content
```

### cdn.yaml Structure

All CDN configuration lives in `/config/cdn.yaml` in the Cloud Manager repository root [4].

```yaml
kind: "CDN"
version: "1"
data:
  authentication:
    authenticators:
      - name: purge-auth
        type: purge
        purgeKey1: ${{CDN_PURGEKEY_031224}}
        purgeKey2: ${{CDN_PURGEKEY_021225}}
    rules:
      - name: purge-auth-rule
        when: { reqProperty: tier, equals: "publish" }
        action:
          type: authenticate
          authenticator: purge-auth
```

Secrets are referenced with `${{SECRET_NAME}}` syntax and stored as Cloud Manager pipeline secret variables [5].

### Origin Selectors (Path-Based Routing)

Route different URL paths to different backends from a single CDN [4]:

```yaml
originSelectors:
  rules:
    - name: blog-route
      when: { reqProperty: path, like: /blog* }
      action:
        type: selectOrigin
        originName: WORDPRESS-BLOG
  origins:
    - name: WORDPRESS-BLOG
      domain: myblog.example.com
      forwardHost: false
```

### Cache Headers Reference

| Header | Controls | Typical Use |
|---|---|---|
| `Cache-Control: max-age=N` | Browser + CDN TTL | Same TTL for both |
| `Surrogate-Control: max-age=N` | CDN TTL only | Different CDN vs browser TTL |
| `Cache-Control: private` | Disables all shared caching | Personalized content |
| `stale-while-revalidate=N` | Serve stale while background refresh | Improves resilience |
| `stale-if-error=N` | Serve stale when origin is down | Availability during outages |

Default CDN TTL if no cache headers are set: **10 minutes (600 seconds)** [8].

### CDN Cache Purge API Call

```
PURGE /content/my-page.html HTTP/1.1
Host: www.mysite.com
X-AEM-Purge-Key: <PURGE_API_TOKEN>
X-AEM-Purge: soft
```

Purge types:
- **Single URL**: `PURGE` a specific path
- **Surrogate key**: `X-AEM-Purge: all` with `Surrogate-Key: <key>` header — bulk invalidates all resources tagged with that key
- **Full purge**: Clears all cached resources [7]

### BYOCDN Required Headers

When using a customer CDN in front of Adobe Fastly, the customer CDN must send three critical headers [1][5]:

1. `Host` — Points to the Adobe CDN ingress domain (`publish-p<ID>-e<ID>.adobeaemcloud.com`)
2. `X-Forwarded-Host` — Contains the actual website domain (for vhost resolution in AEM)
3. `X-AEM-Edge-Key` — The shared secret that authenticates the customer CDN

### CDN Rule Evaluation Order

Rules in `cdn.yaml` evaluate in this sequence [4]:

```
Traffic Filters → Request Transformations → Origin Selectors → Response Transformations → Redirects
```

## Common Patterns

### Pattern 1: Different CDN and Browser TTLs

When pages should be cached for 1 hour at the CDN but only 5 minutes in browsers [6]:

```apache
<LocationMatch "^/content/.*\.(html)$">
  Header set Cache-Control "max-age=300"
  Header set Surrogate-Control "max-age=3600"
  Header set Age 0
</LocationMatch>
```

### Pattern 2: BYOCDN Setup Flow

1. Get the Adobe CDN ingress domain from Cloud Manager (environment details)
2. Configure customer CDN origin to point to the ingress domain
3. Generate an `X-AEM-Edge-Key` secret (minimum 32 bytes, use `openssl rand -hex 32`)
4. Store the key as a Cloud Manager pipeline secret variable
5. Deploy `cdn.yaml` referencing the key with `${{SECRET_NAME}}` syntax
6. Configure customer CDN to include `X-AEM-Edge-Key` header on all requests to Adobe CDN
7. Debug using `x-aem-debug: edge=true` request header — response headers will confirm `byocdn=true` [5]

### Pattern 3: Geo-Based Redirects

Route users to locale-specific pages based on country [4]:

```yaml
data:
  experimental_redirects:
    rules:
      - name: homepage-redirect-us
        when:
          allOf:
            - reqProperty: clientCountry
              in: [US, CA]
            - { reqProperty: path, equals: "/" }
        action:
          type: redirect
          location: https://mysite.com/en/home
```

### Pattern 4: Load Balancing During Deployment

During a rolling deployment to the Publish tier (typically 2+ pods), AEMaaCS deploys **one publish instance at a time** to maintain availability. The load balancer routes traffic away from the pod being updated, so end users experience no downtime. The DevOps engineer must ensure Dispatcher cache is warmed or configured to serve stale content during the update window [2][3].

## Gotchas

- **Fastly cannot be removed.** Customers often ask whether they can swap out Adobe's CDN entirely for their own. The answer is no — BYOCDN adds a layer on top of Adobe's CDN, it does not replace it [1].

- **BYOCDN blocks geolocation headers.** When a customer CDN sits in front of Fastly, `x-aem-client-country` and `x-aem-client-continent` reflect the location of the customer CDN server, not the end user's actual location. The customer CDN is responsible for forwarding true geolocation data [5].

- **Origins cannot use `.adobeaemcloud.com` domains in origin selectors.** Attempting to proxy directly to an `adobeaemcloud.com` domain in an origin selector rule causes a request loop and is explicitly blocked by AEM [4].

- **BYOCDN is only supported for the Publish and Preview tiers** — not in front of the Author tier. Attempting to set up a customer CDN in front of Author is unsupported [1].

- **Config Pipeline requires Targeted Deployment.** When creating the Cloud Manager pipeline for CDN config, select "Targeted Deployment" — not "Full Stack Code." Using Full Stack Code will deploy the entire application, not just the config [4].

- **100 KB config file size limit.** The cumulative size of `cdn.yaml` (combined with traffic filter rules) cannot exceed 100 KB. For complex rule sets, this can become a constraint [4].

- **Hard CDN purge can cause outages.** A hard purge makes content immediately unavailable until the origin can serve it. On high-traffic sites, this can cause origin overload. Default is soft purge (serve stale while re-fetching) — prefer this unless content must be immediately updated [7].

- **Header placement mistake in BYOCDN.** A common misconfiguration is accidentally placing required request headers (like `X-AEM-Edge-Key`) in response headers instead of request headers. Debug with `x-aem-debug: edge=true` to confirm headers are arriving correctly [5].

- **Marketing parameters — environment date dependency.** Marketing query parameter stripping (utm_*, gclid, fbclid) is only automatic in environments created after October 2023. Older environments need explicit CDN rules to strip these parameters for better cache hit ratios [8].

- **`Vary` header abuse kills cache hit ratio.** Setting `Vary` on response headers with many possible values (like `User-Agent`) creates unique cache entries per variation, dramatically reducing cache effectiveness. Only use `Vary` on headers with tightly controlled value sets [8].

- **Exam scenario — load balancing during deployment:** The correct answer for "how to ensure site availability during a production deployment" is to deploy to one publish instance at a time (rolling update), not to take the entire publish tier offline [2].

## Sources

[1] **CDN in AEM as a Cloud Service — Adobe Experience League**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/content-delivery/cdn
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Core architecture overview, Fastly as mandatory CDN, BYOCDN support/restrictions, X-AEM-Edge-Key overview, BYOCDN limitations for Author tier, ingress domain format

[2] **Introduction to the Architecture of Adobe Experience Manager as a Cloud Service — Adobe Experience League**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/overview/architecture
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Publish tier farm architecture, Dispatcher role, load balancer position in architecture, minimum two-pod business continuity requirement, rolling deployment behavior

[3] **System Architecture — AdobeDocs DeepWiki**
    URL: https://deepwiki.com/AdobeDocs/experience-manager-cloud-service.en/1.1-system-architecture
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: Load balancer routing to Author/Publish tiers, Layer 7 load balancing, Dispatcher as load balancer, auto-scaling behavior

[4] **Configuring Traffic at the CDN — Adobe Experience League**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/content-delivery/cdn-configuring-traffic
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: cdn.yaml structure and kind/version fields, CDN rule types (request/response transforms, origin selectors, redirects), evaluation order, 100 KB size limit, config pipeline setup, origin selector restrictions (.adobeaemcloud.com domains blocked), YAML examples

[5] **Configuring CDN Credentials and Authentication — Adobe Experience League**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/content-delivery/cdn-credentials-authentication
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: X-AEM-Edge-Key mechanism and configuration, purge API token (purgeKey1/purgeKey2), basic authentication, secret variable syntax (${{...}}), minimum 32-byte key recommendation, debug header (x-aem-debug: edge=true), BYOCDN header configuration (X-Forwarded-Host, Host, X-AEM-Edge-Key), geolocation header behavior in BYOCDN

[6] **Caching in AEM as a Cloud Service — Adobe Experience League**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/content-delivery/caching
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Cache-Control vs Surrogate-Control distinction, default TTL for HTML (5 min browser, same at CDN), client-side library immutable caching, stale-while-revalidate/stale-if-error directives, Dispatcher vhost mod_headers configuration, blob storage caching by program creation date

[7] **Purging the CDN Cache — Adobe Experience League**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/content-delivery/cdn-cache-purge
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Three purge types (single URL, surrogate key, full purge), hard vs soft purge behavior, PURGE HTTP method syntax, X-AEM-Purge-Key header requirement, outage risk from hard purge on high-traffic sites

[8] **AEM Publish Service Caching — Adobe Experience League**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-learn/cloud-service/caching/publish
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: Default 10-minute CDN TTL when no cache headers set, marketing query parameter stripping (October 2023 environment cutoff), Vary header cache hit ratio impact, cache key based on full URL including query parameters

[9] **Configuration Examples for Adobe Managed CDN on AEM as a Cloud Service — Arbory Digital Blog**
    URL: https://blog.arborydigital.com/en/blog/config-examples-for-managed-cdn-on-aem-as-a-cloud-service
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: Path-based origin selector YAML examples, geo-redirect patterns, URL transformation with regex capture groups, /systemready path gotcha for functional tests, RDE testing workflow for CDN configs

[10] **Troubleshooting BYOCDN Integration in AEMaaCS — AEM Concepts**
    URL: https://aemconcepts.com/home/troubleshooting-byocdn-integration-in-aemaacs/
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: Common BYOCDN header misconfiguration (request vs response headers), Surrogate-Control: max-age=0 pattern to bypass Fastly caching while preserving customer CDN caching, geolocation responsibility in BYOCDN setups
