# Resource Resolver Configuration

**Topic ID:** aem-configuration.sling.resource-resolver
**Researched:** 2026-03-29T00:00:00Z

## Overview

The Apache Sling Resource Resolver is the core mechanism AEM uses to map incoming HTTP requests to JCR content nodes and to generate outbound URLs from resource paths [1]. Every request AEM handles passes through this resolution pipeline — the resolver converts a URL like `https://www.example.com/news` into an internal JCR path such as `/content/mysite/en/news`, then Sling selects the appropriate servlet or script to render it [2]. Without proper resolver configuration, AEM exposes `/content`-prefixed internal paths to end users, which is both unfriendly and a potential information leak.

There are three distinct mechanisms for controlling resolution: `/etc/map` node configurations, `sling:vanityPath` properties on content nodes, and `sling:alias` properties for name-level substitution [1]. Each operates differently in terms of scope, precedence, and use case. DevOps engineers must understand when to use each approach and how they interact — this is a heavily tested area in certification exams because incorrect precedence assumptions cause production defects that are hard to diagnose.

The configuration is split between OSGi settings (managed via `org.apache.sling.jcr.resource.internal.JcrResourceResolverFactoryImpl`) and JCR content under `/etc/map`. The OSGi settings control global behavior like search paths, vanity path enabling, and alias caching, while `/etc/map` holds the actual mapping rules [3].

## Key Concepts

- **Resource Resolver Factory (OSGi PID: `org.apache.sling.jcr.resource.internal.JcrResourceResolverFactoryImpl`)** — The central OSGi service governing all aspects of resource resolution. Contains properties for search paths, mapping location, vanity path behavior, and alias resolution [3][4].

- **`/etc/map` tree** — JCR node hierarchy that defines URL-to-resource mappings. Nodes in this tree use the `sling:Mapping` node type. The default location is `/etc/map`, but it can be overridden per run mode via `resource.resolver.map.location` [2][3].

- **`sling:match`** — Property on a `sling:Mapping` node that defines a partial regular expression for matching incoming requests. Required when the regex contains characters invalid in JCR node names (slashes, colons, brackets, asterisks). Replaces the node name as the matching criterion [1][2].

- **`sling:internalRedirect`** — Property causing Sling to internally rewrite the request path and continue resolution, without sending an HTTP redirect to the client. Supports multiple values tried sequentially [1].

- **`sling:redirect` + `sling:status`** — Property pair triggering an HTTP redirect response. `sling:status` defaults to 302 if not set; supported codes include 300, 301, 302, 303, 307, and 308 [1].

- **`sling:vanityPath`** — Property that can be placed on any content node to define a full alternative access path. Does not support regex. Managed through a cached lookup table in the resolver [1][3].

- **`sling:alias`** — Property providing an alternative *name* (not full path) for a resource at the same level in the hierarchy. Analogous to POSIX hard links — restricted to simple names, not paths. Multiple values allowed; the first is used for outgoing mapping [1].

- **Resolver vs. Mapping entries** — Two separate evaluation lists. *Resolver Map Entries* (used by `ResourceResolver.resolve()`) map URLs to resources. *Mapping Map Entries* (used by `ResourceResolver.map()`) map resource paths back to URLs. Both lists are evaluated top-down [2].

- **Namespace Mangling** — Automatic conversion of JCR namespace colons to underscores in URLs. For example, `jcr:content` becomes `_jcr_content`. Enabled by default to prevent issues with Dispatcher and file systems [3].

- **Resource Search Paths** — The ordered list of path prefixes Sling searches when resolving relative resource paths. Default: `/apps` then `/libs`. This ordering is what makes `/apps` overlays take precedence over `/libs` base components [3].

## Technical Details

### OSGi Configuration Properties

The OSGi PID `org.apache.sling.jcr.resource.internal.JcrResourceResolverFactoryImpl` exposes the following key properties [3][4]:

| Property | Default | Description |
|---|---|---|
| `resource.resolver.searchpath` | `/apps`, `/libs` | Ordered search paths for relative resolution |
| `resource.resolver.map.location` | `/etc/map` | JCR path to the mapping configuration tree |
| `resource.resolver.mapping` | — | Inline URL alias mappings (e.g., `/content:/ `) |
| `resource.resolver.map.observation` | — | JCR paths watched for live mapping updates |
| `resource.resolver.allow.direct` | `true` | Inject a direct 1:1 mapping entry at the start of the list |
| `resource.resolver.manglenamespaces` | `true` | Enable namespace mangling in URLs |
| `resource.resolver.optimize.alias.resolution` | `true` | Enable internal alias cache |
| `resource.resolver.vanitypath.maxEntries` | `-1` | Maximum cached vanity path entries (-1 = unlimited) |
| `resource.resolver.vanitypath.whitelist` | `/apps/`, `/libs/`, `/content/` | Path prefixes scanned for `sling:vanityPath` |
| `resource.resolver.vanitypath.blacklist` | `/content/usergenerated` | Path prefixes excluded from vanity path scanning |
| `resource.resolver.vanity.precedence` | `false` | Whether vanity paths take priority over `/etc/map` entries |
| `resource.resolver.enable.vanitypath` | `true` | Master switch to enable/disable vanity path processing |

**Critical setting for exam scenarios:** `resource.resolver.vanity.precedence` controls whether `sling:vanityPath` wins over `/etc/map`. The default is `false`, meaning `/etc/map` wins [3][4].

### `/etc/map` Node Structure

Nodes under `/etc/map` are organized by protocol and optionally host. The resolver constructs a virtual path of the form `{scheme}/{host}.{port}/{uri_path}` from each incoming request and matches it against the mapping tree [1].

The following example maps requests to `localhost:4503/` to the `/content/` subtree [2]:

```
/etc/map/
└── http/
    └── localhost_4503 (sling:Mapping)
        ├── sling:match = "localhost.4503/"
        └── sling:internalRedirect = "/content/"
```

For multi-domain virtual host mapping [5]:

```
/etc/map.prod.publish/
├── http/
│   ├── www.example1.com (sling:Mapping)
│   │   └── sling:internalRedirect = ["/content/example1/en"]
│   └── www.example2.com (sling:Mapping)
│       └── sling:internalRedirect = ["/content/example2/en"]
└── https/
    └── (same structure)
```

### Run-Mode-Specific Mapping Configuration

`/etc/map` itself does not honor OSGi run modes. The DevOps pattern is to create separate environment-specific map folders and point the OSGi configuration at the correct one per environment [5]:

Create separate folders:
- `/etc/map.dev.publish`
- `/etc/map.uat.publish`
- `/etc/map.stage.publish`
- `/etc/map.prod.publish`

Configure the run-mode-aware OSGi setting. Create an `sling:OsgiConfig` node at the path [5]:

```
/apps/mysite/config.publish/
└── org.apache.sling.jcr.resource.internal.JcrResourceResolverFactoryImpl
    └── resource.resolver.map.location = "/etc/map.prod.publish"
```

On AEM as a Cloud Service, you can use Cloud Manager environment variables:

```yaml
# In your OSGi config YAML:
resource.resolver.map.location: "$[env:ETC_MAP_PATH;default=/etc/map.publish]"
```

### Author vs. Publish Map Separation

The standard pattern is to keep author and publish mappings separate [2][5]:

- **Author**: Use default `/etc/map` (or no mapping if short URLs are not needed for authoring).
- **Publish**: Configure `/etc/map.publish` and set the `resource.resolver.map.location` in the publish run-mode OSGi config. This node must be replicated to publish.

### Vanity Path Configuration

`sling:vanityPath` is placed directly on a content node [1][3]:

```
/content/mysite/en/promotions/summer-sale
├── jcr:primaryType = cq:Page
├── sling:vanityPath = "/summer"
├── sling:redirect = true        (optional: triggers HTTP 301/302)
└── sling:redirectStatus = 301   (optional: defaults to 302)
```

When multiple nodes claim the same vanity path, `sling:vanityOrder` (Integer, higher wins) determines which takes precedence [1].

### Alias Configuration

`sling:alias` lives on the resource node and provides a name substitute during path traversal [1]:

```
/content/mysite/en/about-us
└── sling:alias = "about"
```

This makes the node accessible at both `/content/mysite/en/about-us` and `/content/mysite/en/about`. The alias cannot span hierarchy levels — it replaces only the node's own name segment.

### Debugging at the Felix Console

The JCR Resolver console at `/system/console/jcrresolver` allows testing both `ResourceResolver.resolve()` and `ResourceResolver.map()` interactively [1][2].

## Common Patterns

**Pattern 1: Remove `/content` from public URLs**
Configure `sling:internalRedirect` in `/etc/map` to strip the `/content/sitename` prefix. This is the most common production mapping pattern [2]:

```
/etc/map.publish/http/www.example.com (sling:Mapping)
├── sling:match = "www.example.com/"
└── sling:internalRedirect = "/content/example/en"
```

**Pattern 2: Vanity URLs for marketing campaigns**
Place `sling:vanityPath = "/promo-2026"` on a campaign page. This is simpler than creating `/etc/map` nodes for one-off URLs. Note that it requires `resource.resolver.enable.vanitypath = true` and the page must be under an allowed vanity path location [3].

**Pattern 3: Dispatcher integration**
Enable `DispatcherUseProcessedURL On` in the Apache/Dispatcher configuration so the Dispatcher passes the Sling-resolved (internal) path to the cache layer, not the original public URL [5].

**Pattern 4: Regex mapping with `sling:match`**
When mapping patterns require characters invalid in JCR node names (such as `/` or `:`), use a `sling:match` property instead of encoding the pattern in the node name [1]:

```
/etc/map/http/any-host (sling:Mapping)
├── sling:match = "(.+)/old-section/(.+)"
└── sling:internalRedirect = "/content/newsite/$1/migrated/$2"
```

Note: Wildcard regex in `/etc/map` disables reverse mapping (outgoing `ResourceResolver.map()`) for that entry.

## Gotchas

**Gotcha 1: Vanity paths do NOT support regex** [1][2]. `/etc/map` entries with `sling:match` do support regex. This is a classic exam distinction — if a scenario requires pattern-based URL rewriting, use `/etc/map` + `sling:match`, not `sling:vanityPath`.

**Gotcha 2: Default precedence is `/etc/map` > `sling:vanityPath`** [3][4]. By default, if both a `/etc/map` entry and a `sling:vanityPath` match the same URL, `/etc/map` wins. Set `resource.resolver.vanity.precedence = true` to flip this. Exam scenarios often test whether candidates know this default behavior.

**Gotcha 3: `sling:alias` is name-level only, not a full path** [1]. `sling:vanityPath` provides an entirely different path (e.g., `/promo` for `/content/site/campaigns/summer`). `sling:alias` only swaps the node's own name within its parent — it cannot create a path that looks structurally different.

**Gotcha 4: OSGi URL Mapping settings reset on restart** [3]. Changes made directly to URL Mappings in the Felix Console (`/system/console/configMgr`) may be overwritten by AEM on the next startup. Always persist configurations in the repository under `/apps/.../config/`.

**Gotcha 5: `/etc/map` does not honor run modes natively** [5]. You must create separate map folders per environment and use `resource.resolver.map.location` in run-mode-specific OSGi configs (e.g., `config.publish.prod`) to select the correct folder.

**Gotcha 6: Wildcard `/etc/map` entries break reverse mapping** [1]. If a `sling:internalRedirect` entry uses a regex with wildcards, `ResourceResolver.map()` will not use that entry for outgoing URL generation. Only regex entries with capturing groups can be used for reverse mapping (outgoing only).

**Gotcha 7: Vanity path scan scope** [3]. By default, Sling scans only `/apps/`, `/libs/`, and `/content/` for `sling:vanityPath`. Content outside these paths is silently ignored. The default denylist includes `/content/usergenerated` to prevent user-generated content from hijacking vanity paths — a security consideration.

**Gotcha 8: `sling:redirectStatus` vs. `sling:status`** [1]. For nodes in `/etc/map`, the redirect status property is `sling:status`. For `sling:vanityPath` on content nodes, the property is `sling:redirectStatus`. Same concept, different property names depending on context.

**Gotcha 9: Resource search paths affect overlay mechanics** [3]. The default search path order `/apps` then `/libs` is what makes component overlays work. Removing `/libs` from this list breaks all standard AEM components. Adding project paths at the beginning puts them ahead of `/apps`.

**Gotcha 10: `/etc/map.publish` must be replicated** [2][5]. Changes to `/etc/map.publish` on author are not automatically pushed to publish. They require explicit replication. This is a common operational oversight in DevOps scenarios.

## Sources

[1] **Apache Sling: Mappings for Resource Resolution**
    URL: https://sling.apache.org/documentation/the-sling-engine/mappings-for-resource-resolution.html
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Core architecture of resource resolution; all sling:mapping properties (sling:match, sling:redirect, sling:internalRedirect, sling:status); alias vs vanity path distinction; incoming and outgoing mapping evaluation; namespace mangling; security considerations; Felix console debugging.

[2] **Resource Mapping | Adobe Experience Manager (AEM 6.5)**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-65/content/implementing/deploying/configuring/resource-mapping
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: AEM-specific /etc/map configuration; /etc/map.publish for publish environments; node structure examples; Resolver Map vs Mapping Map entries; author/publish separation; replication requirements; Felix console usage.

[3] **OSGi Configuration Settings | Adobe Experience Manager (AEM 6.5)**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-65/content/implementing/deploying/configuring/osgi-configuration-settings
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Apache Sling Resource Resolver Factory OSGi property table; vanity path precedence default; allowed/denied vanity path locations; alias cache settings; namespace mangling; resource search paths; warning about Felix console changes being overwritten.

[4] **AEM OSGi Service Dive: Resource Resolver Factory (Medium / AEM Mastery)**
    URL: https://medium.com/aem-mastery/aem-osgi-service-dive-resource-resolver-factory-c2521f75be51
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: Detailed explanation of each OSGi property with practical implications; vanity path precedence behavior; alias resolution caching explanation; allow direct mapping description.

[5] **Configure Sling Mappings for Resource Resolution — Deep Dive (Albin's Blog)**
    URL: https://www.albinsblog.com/2020/07/configure-sling-mapping-for-resource-resolution-in-adobe-experience-manager.html
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: Run-mode-specific /etc/map folder naming convention; OSGi config node placement under /apps; AEM as a Cloud Service environment variable approach; Dispatcher DispatcherUseProcessedURL setting; multi-domain /etc/map structure examples.
