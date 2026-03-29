# Package Structure and Filters

**Topic ID:** build-deployments.content-packages.structure
**Researched:** 2026-03-29T00:00:00Z

## Overview

AEM content packages are ZIP files that hold JCR repository content serialized in "vault" (FileVault) format. Each package is defined by a set of metadata files in `META-INF/vault/` and a `jcr_root/` directory that mirrors the repository tree. The most critical control file is `filter.xml`, which defines the workspace filter — the list of JCR paths the package owns and manages. Understanding how filters work is fundamental to ensuring packages install predictably and do not accidentally overwrite or delete content they should not touch [1][2].

AEM as a Cloud Service (AEMaaCS) elevated package structure from a best practice to a hard requirement. A package may no longer mix content from immutable regions (`/apps`, `/libs`) with mutable regions (`/content`, `/conf`, `/var`). Packages that violate this rule are flagged as `MIXED` type, and Cloud Manager silently drops the immutable content, deploying only the mutable portion [3]. This makes correct `packageType` declaration and careful `filter.xml` scoping a critical deployment concern. The `packageType` property in `properties.xml` controls which type a package is (`application`, `content`, or `container`), and the FileVault Package Maven Plugin validates this at build time [3][4].

The practical effect is that modern AEM projects separate into at least three distinct packages: `ui.apps` (application code, `packageType=application`), `ui.content` (mutable content/config, `packageType=content`), and `all` (container, `packageType=container`) that embeds the others [3][4]. The `filter.xml` file controls not only what is packaged but also how it is imported through import modes (`replace`, `merge`, `update`, and property-level variants). The interaction between filter roots, include/exclude patterns, import modes, and package types forms the bulk of exam-relevant content in this area.

## Key Concepts

- **Workspace Filter** — The `filter.xml` loaded by FileVault at `META-INF/vault/filter.xml`. Defines what JCR paths are in scope for import and export. All nodes covered by a filter root but absent from the package are deleted from the repository on install when using the default `replace` mode [1][2].

- **Filter Root** — The mandatory `root` attribute on a `<filter>` element is an absolute JCR path. Everything under that path is included by default, subject to include/exclude child rules [1].

- **Include/Exclude Rules** — Optional child elements of `<filter>` that refine which descendants are in scope. Patterns are Java regular expressions matched against the full JCR path. The **last matching rule wins** — evaluation is sequential and the final match determines inclusion or exclusion [1][2].

- **First-Pattern Default Inversion** — When the first child of a `<filter>` is `<include>`, the implicit default for non-matching paths becomes "excluded." When the first child is `<exclude>`, the implicit default becomes "included" [1][2].

- **Import Mode** — The `mode` attribute on `<filter>` controls install-time behavior: `replace` (overwrite or delete existing content — the default), `merge`/`merge_properties` (only add new content, never delete), and `update`/`update_properties` (update and add, but never delete). The `_properties` variants introduced in FileVault 3.5.0 are more predictable and preferred over the older `merge` and `update` modes [1][5].

- **packageType** — Declared in `META-INF/vault/properties.xml`. Accepted values are `application` (immutable code in `/apps`), `content` (mutable content in `/content`, `/conf`), `container` (wraps sub-packages and bundles only, no direct content nodes), and `mixed` (legacy, invalid for AEMaaCS) [3][4].

- **Mutable vs. Immutable Split** — `/apps` and `/libs` are immutable at runtime. `/content`, `/conf`, `/var`, `/etc`, and `/oak:index` are mutable. A single package must not straddle both regions in AEM as a Cloud Service [3].

- **Non-overlapping filter roots** — Filter roots across packages of different types must never overlap. Application and content package filters must cover disjoint sets of JCR paths. Container packages should not overlap with application package filters [3][4].

- **Container Package (`all`)** — The only package that should be submitted to Cloud Manager. All others set `<cloudManagerTarget>none</cloudManagerTarget>` in their Maven plugin config. The container embeds sub-packages at paths like `/apps/<app>-packages/(application|content)/install[.author|.publish]` [3][4].

- **matchProperties** — Available since FileVault 3.1.28. Setting `matchProperties="true"` on an include/exclude element changes pattern matching to target property paths instead of node paths, enabling selective property-level filtering within a node [1].

- **acHandling property** — Controls how ACLs are handled during install. Set in `properties.xml`. ACL behavior is governed by `acHandling` alone, not by the `mode` attribute on `<filter>` elements. The default value is `ignore`, which means ACLs in a package are not applied unless this property is explicitly set [5][6].

## Technical Details

### Package Directory Layout

A content package ZIP contains [1][2]:

```
<package>.zip
|-- META-INF/
|   |-- MANIFEST.MF                     (informational only)
|   `-- vault/
|       |-- filter.xml                  (workspace filter — REQUIRED)
|       |-- properties.xml              (package metadata — REQUIRED)
|       |-- config.xml                  (aggregate manager config)
|       |-- settings.xml                (workspace settings)
|       `-- nodetypes.cnd               (CND for custom node types)
`-- jcr_root/
    `-- apps/
        `-- my-site/...                 (mirrored JCR content)
```

Content nodes are serialized as JCR Document View XML files (`.content.xml`) using `<jcr:root .../>` elements [2]:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<jcr:root xmlns:sling="http://sling.apache.org/jcr/sling/1.0"
          xmlns:jcr="http://www.jcp.org/jcr/1.0"
          jcr:primaryType="sling:Folder"/>
```

`properties.xml` is the authoritative metadata source for Package Manager [6]. The `definition/.content.xml` under vault duplicates this data into the `/etc/packages` node structure, but `properties.xml` governs actual install behavior.

### filter.xml Structure

The basic structure from official FileVault documentation [1]:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<workspaceFilter version="1.0">
  <!-- Simple root — includes all descendants -->
  <filter root="/apps/my-site"/>

  <!-- With include/exclude rules (regex patterns) -->
  <filter root="/content/my-site">
    <exclude pattern="/content/my-site/jcr:content/.*"/>
    <include pattern="/content/my-site/pages(/.*)?"/>
  </filter>

  <!-- Mode control — never delete existing nodes -->
  <filter root="/etc/map" mode="merge"/>

  <!-- Cleanup — remove stale node, skip type auto-detection -->
  <filter root="/apps/old-location" type="cleanup"/>
</workspaceFilter>
```

All mode values must be lowercase [1].

### Include/Exclude Pattern Evaluation

Patterns are Java regular expressions evaluated in sequential order. The **last matching pattern determines inclusion or exclusion** [1][2]:

```xml
<!-- First rule is exclude → default is include for all other paths -->
<filter root="/content/site">
  <exclude pattern="/content/site/temp(/.*)?"/>
  <include pattern="/content/site/temp/keep-this"/>
</filter>
```

In this example, `/content/site/temp/keep-this` is included (last matching rule wins), while all other nodes under `/content/site/temp/` are excluded. Everything else under `/content/site` is included (because the first rule is `<exclude>`, so the default is include).

### Import Modes Compared

From the FileVault import mode documentation [5]:

| Mode | Add New | Update Existing | Delete Covered-But-Absent |
|------|---------|-----------------|---------------------------|
| `replace` (default) | Yes | Yes (overwrite) | Yes |
| `merge` / `merge_properties` | Yes | No | No |
| `update` / `update_properties` | Yes | Yes | No |

Note: `merge` and `update` are documented as having many unpredictable edge cases. Prefer `merge_properties` and `update_properties` in current FileVault versions [1][5].

### Package Type Rules (AEMaaCS)

The three valid types and their restrictions, enforced by `filevault-package-maven-plugin` [3][4]:

| packageType | Allowed Content | Typical Filter Paths | Install Hooks |
|-------------|----------------|----------------------|---------------|
| `application` | HTL, client libs, overlays, ACLs. No bundles, no sub-packages | `/apps`, `/libs` | Yes |
| `content` | Mutable content and configurations. No bundles, no sub-packages | `/content`, `/conf` | Yes |
| `container` | Sub-packages and OSGi bundles/configs only. No direct content nodes | `/apps/*-packages/...` | No |
| `mixed` | Anything (legacy, invalid for Cloud Service) | Any | Yes |

Container packages embed sub-packages at specific install paths for run-mode targeting [3]:

- `/apps/<app>-packages/application/install` — deploys to Author and Publish
- `/apps/<app>-packages/application/install.author` — Author only
- `/apps/<app>-packages/application/install.publish` — Publish only

### Property-Level Filtering

Available since FileVault 3.1.28 [1]:

```xml
<!-- Exclude only the jcr:lastModified property, not the node itself -->
<filter root="/content/my-site">
  <exclude pattern="/content/my-site/jcr:content/jcr:lastModified"
           matchProperties="true"/>
</filter>
```

## Common Patterns

**Standard AEM Cloud Service project structure** aligned to package types [3][4]:

- `ui.apps/filter.xml` roots at `/apps/<project>` with `packageType=application`
- `ui.content/filter.xml` roots at `/content/<project>` and `/conf/<project>` with `packageType=content`
- `ui.config` — OSGi configurations and repoinit scripts embedded in `all`
- `all/filter.xml` includes only the embed install path folders with `packageType=container`
- No filter roots overlap between packages

**Protecting authored content during code deployments** using `mode="merge"` on content package filters to prevent code deployments from deleting authored nodes [1]:

```xml
<filter root="/content/site/en" mode="merge"/>
```

**Excluding transient or generated nodes** such as compiled client libraries or cache nodes from being packaged:

```xml
<filter root="/apps/site">
  <exclude pattern="/apps/site/clientlibs/cache(/.*)?"/>
</filter>
```

**Environment-specific content** by targeting sub-packages to specific tiers using `.author` or `.publish` sub-folders inside the container embed path. The container `filter.xml` must explicitly include these folder paths [3].

**Dependency declaration** in `properties.xml` ensures correct installation order. The format is `<group>:<name>:<version>` [6]:

```xml
<entry key="dependencies">my-group:ui.apps:1.0.0</entry>
```

## Gotchas

- **Last match wins, NOT first match.** Most developers expect first-match semantics (as in Apache Dispatcher rules). FileVault is last-match [1][2]. A trailing `<include>` after several `<exclude>` entries will override the exclusions for that path.

- **First pattern inverts the default.** An `<include>` as the first child element means the default for all non-matching paths is "excluded." An `<exclude>` first means the default is "included." This is counter-intuitive and a common source of missing or extra nodes in packages [1][2].

- **`replace` mode silently deletes uncovered nodes.** In `replace` mode (the default), if a JCR node falls under a filter root but is not present in the package ZIP, it is deleted from the repository on install. This is how stale nodes are cleaned up — but also the most common cause of accidental content deletion [1][2].

- **Mixed packages fail silently on Cloud Service.** If a package contains both `/apps/...` and `/content/...` paths, Cloud Manager reports a `MIXED` type and installs only the mutable content, silently dropping immutable content. There is no build failure — just missing deployment [3].

- **Regex, not glob.** Patterns use Java regular expressions, not filesystem globs. The pattern `/apps/site/.*` does not match the root node itself — use `/apps/site(/.*)?` to match both the root and all descendants [1][2].

- **Subtree traversal blocked by non-matching intermediate.** If a filter excludes `/content/site/en`, FileVault will not traverse into `/content/site/en/pages` even if you have an include rule for it, because the intermediate node is not traversed during export [1].

- **`merge` and `update` modes have unpredictable edge cases.** Use `merge_properties` and `update_properties` instead in current FileVault versions [1][5].

- **ACL handling is NOT controlled by filter `mode`.** The `mode` attribute on `<filter>` has no effect on access control lists. ACL import behavior is controlled exclusively by the `acHandling` property in `properties.xml`. The default value for `acHandling` is `ignore` — meaning ACLs in the package are not applied at all unless explicitly configured [5][6].

- **Container packages cannot have install hooks.** Unlike `application` and `content` packages, `container` packages are prohibited from using install hooks in AEM as a Cloud Service [3][4].

- **Filter roots must not overlap between container and application packages.** If the container's `filter.xml` includes a path that also appears in `ui.apps`, validation fails. The container filter should only reference the embed install path folders [4].

- **`cloudManagerTarget` must be `none` on all non-container packages.** Cloud Manager by default harvests all Maven-produced packages and attempts to deploy them. Only the `all` container should be deployed. Every other package module must explicitly opt out with `<cloudManagerTarget>none</cloudManagerTarget>` [3][4].

- **Parent nodes not in the filter are auto-created with `nt:folder` on install.** A filter starting at `/apps/mysite/components` will auto-create `/apps/mysite` as `nt:folder` if it does not exist. The auto-created node type may not be correct, causing downstream Sling resolution issues [1].

## Sources

[1] **Workspace Filter — Apache Jackrabbit FileVault**
    URL: https://jackrabbit.apache.org/filevault/filter.html
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Full filter.xml specification — filter elements, mode attribute values (replace/merge/merge_properties/update/update_properties), include/exclude rules, last-match-wins semantics, first-pattern default inversion, matchProperties attribute, type=cleanup, ancestor node auto-creation behavior, export traversal caveat, XML schema validation

[2] **AEM FileVault Package Filter Community Discussion — Adobe Experience League**
    URL: https://experienceleaguecommunities.adobe.com/t5/adobe-experience-manager/aem-vault-package-filter-xml-query/td-p/372542
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: Community confirmation of last-match semantics, first-pattern default behavior examples, regex-not-glob clarification, subtree traversal blocking behavior

[3] **AEM Project Structure — Adobe Experience Manager as a Cloud Service**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/developing/aem-project-content-package-structure
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Package type rules (application/content/container/mixed), mutable vs immutable split, Cloud Manager deployment rules, cloudManagerTarget=none requirement, embed install path conventions (.author/.publish), container package restrictions (no install hooks), filter overlap prohibition

[4] **Content Package Type Validation Forces Rethink of AEM Project Structure — Bounteous**
    URL: https://www.bounteous.com/insights/2021/06/17/content-package-type-validation-forces-rethink-standard-project-structure-adobe/
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: Legacy mixed package pitfalls, FileVault Plugin v1.1.0 enforcement of package types, non-overlapping filter root convention, only container packages deploying through Cloud Manager, Maven module restructuring requirements

[5] **Import Mode — Apache Jackrabbit FileVault**
    URL: https://jackrabbit.apache.org/filevault/importmode.html
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: All five import modes behavior table (replace/update/merge/update_properties/merge_properties), ACL import mode isolation from filter mode attribute, authorizable handling per mode, predictability of _properties variants vs older modes

[6] **Content Package Properties — Apache Jackrabbit FileVault**
    URL: https://jackrabbit.apache.org/filevault/properties.html
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: acHandling (default: ignore), packageType values, requiresRoot, requiresRestart, dependencies format (group:name:version), subPackageHandling, allowIndexDefinitions, vault.feature.stashPrincipalPolicies
