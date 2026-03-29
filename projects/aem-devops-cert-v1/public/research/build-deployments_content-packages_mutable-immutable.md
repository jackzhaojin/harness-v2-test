# Mutable vs Immutable Content

**Topic ID:** build-deployments.content-packages.mutable-immutable
**Researched:** 2026-03-29T00:00:00Z

## Overview

AEM as a Cloud Service (AEMaaCS) enforces a strict architectural boundary between two categories of repository content: immutable and mutable. This separation is a fundamental consequence of the containerized, cloud-native architecture — AEM instances are ephemeral and can be spun up or torn down at any time. Immutable content lives in `/apps` and `/libs` and is baked into the container image at build time [1]. Mutable content covers everything else (`/content`, `/conf`, `/var`, `/oak:index`, etc.) and persists in a shared Content Repository Service rather than in the individual container image [2].

This split exists because in AEMaaCS, code is never deployed directly to a running instance. All immutable content must flow through Git and Cloud Manager pipelines, which guarantees that every AEM container running a given release is byte-for-byte identical [1]. Mutable content, by contrast, can be modified at runtime — but this comes with an important constraint: once applied, mutable content changes cannot be rolled back automatically [3]. If a deployment introduces a bad mutable-content change, the only remedies are a follow-up release or a full point-in-time system restore.

Understanding this split is critical for exam success. Questions will present project structure scenarios and ask whether a given change is deployable through a code pipeline or must live in a content package. They may also ask what happens when a MIXED package is deployed, or when to use repoinit vs. a content package for provisioning service users or ACLs.

## Key Concepts

- **Immutable content** — Everything under `/apps` and `/libs`. Cannot be created, updated, or deleted at runtime after AEM starts [1]. Must be checked into Git and deployed via a Cloud Manager pipeline. Forms part of the container image itself.

- **Mutable content** — Everything outside `/apps` and `/libs`: `/content`, `/conf`, `/home`, `/var`, `/etc`, `/oak:index`, `/system`, `/tmp` [2]. Can be changed at runtime. Persists in the shared Content Repository Service, not in the ephemeral container image.

- **Package types** — AEMaaCS recognizes three valid `packageType` values: `application` (immutable code under `/apps`), `content` (mutable content), and `container` (the top-level `all` package that embeds others) [4]. The legacy MIXED type is disallowed — packages that contain both mutable and immutable content will only have the immutable portion installed, with the mutable portion silently dropped [1].

- **ui.apps** — The standard Maven module for immutable code: HTL templates, components, client libraries, OSGi bundle jars, overlays of `/libs`. Must set `packageType=application` [4].

- **ui.content** — The standard module for mutable content and configuration structures. Must set `packageType=content` [4].

- **ui.config** — The module for OSGi factory configurations including repoinit scripts. Logically part of the immutable code layer because configurations are run-mode-scoped and baked into the deployment [4].

- **Container (`all`) package** — The single artifact submitted to Cloud Manager. Sets `packageType=container` and uses `<embeddeds>` to include ui.apps, ui.content, and ui.config. Has no JCR content of its own and cannot use install hooks [4]. All other packages must include `<cloudManagerTarget>none</cloudManagerTarget>` in their properties so Cloud Manager ignores them as standalone deployments.

- **Repoinit (Repository Initialization)** — Apache Sling's preferred mechanism for provisioning mutable structures (service users, ACLs, paths, node types) as part of the application codebase. Repoinit scripts run at AEM startup, before most application code activates, so the provisioned structures are guaranteed to exist [3]. Operations are skipped if the state already matches (idempotent).

- **Oak indexes special case** — `/oak:index` is technically a mutable path, but Oak indexes must be deployed as code through Cloud Manager. This is because Cloud Manager must wait for full reindexing before switching traffic to a new code image [2][3].

- **`cp2fm` suffix** — Cloud Manager converts packages to Sling Feature Model format. Installed packages appear frozen in Package Manager UI with the `cp2fm` suffix and cannot be reinstalled, rebuilt, or downloaded [1].

## Technical Details

### Repository Path Classification

| Path | Type | Change at Runtime? | Deployed Via |
|---|---|---|---|
| `/apps` | Immutable | No | Cloud Manager pipeline only |
| `/libs` | Immutable | No | AEM product code only |
| `/content` | Mutable | Yes | Cloud Manager or Package Manager (runtime) |
| `/conf` | Mutable | Yes | Cloud Manager or Package Manager (runtime) |
| `/home` | Mutable | Yes | RepoInit preferred for service users |
| `/var`, `/etc`, `/tmp` | Mutable | Yes | Cloud Manager |
| `/oak:index` | Mutable (special) | Must deploy as code | Cloud Manager pipeline only |
| `/system` | Mutable | Yes | Cloud Manager |

### Package Type Enforcement

The FileVault Package Maven Plugin (v1.1.0+) validates `packageType` at build time. Cloud Manager will only install the immutable portion of a MIXED package and logs a warning [1]:

```
Generated content-package <PACKAGE_ID> located in file <PATH> is of MIXED type.
```

Each non-container package must declare its type in `pom.xml`:

```xml
<!-- ui.apps/pom.xml — immutable code -->
<plugin>
  <groupId>org.apache.jackrabbit</groupId>
  <artifactId>filevault-package-maven-plugin</artifactId>
  <configuration>
    <packageType>application</packageType>
  </configuration>
</plugin>

<!-- ui.content/pom.xml — mutable content -->
<plugin>
  <groupId>org.apache.jackrabbit</groupId>
  <artifactId>filevault-package-maven-plugin</artifactId>
  <configuration>
    <packageType>content</packageType>
  </configuration>
</plugin>
```

The `all` container uses embedded installation paths targeting [4]:
```
/apps/<app-name>-packages/(content|application|container)/install(.author|.publish)?
```

This ensures correct service-level targeting and separation.

### Repoinit OSGi Configuration

Repoinit scripts are stored as `scripts` arrays in `org.apache.sling.jcr.repoinit.RepositoryInitializer` OSGi factory configurations [5]. These live in `ui.config` under run-mode-specific folders (`config.author`, `config.publish`, `config.author.prod`, `config.publish.stage`, etc.).

The `.config` file format is preferred over `.cfg.json` because it supports multi-line strings without escaping [5]:

```
# ui.config/src/main/content/jcr_root/apps/my-app/config.author/
# org.apache.sling.jcr.repoinit.RepositoryInitializer~myapp-author.config

scripts=["
  create service user myapp-data-reader with path system/cq:services/myapp
  set principal ACL for myapp-data-reader
    allow jcr:read on /content/myapp
    allow jcr:read on /conf/myapp
  end
  create path (sling:Folder) /conf/myapp/settings
"]
```

Equivalent `.cfg.json` format (requires explicit `\n` escaping) [5]:

```json
{
  "scripts": [
    "create service user myapp-data-reader with path system/cq:services/myapp",
    "set ACL for myapp-data-reader\n  allow jcr:read on /content/myapp\n  allow jcr:read on /conf/myapp\nend"
  ]
}
```

Service users in AEMaaCS **must** be created under `system/cq:services` to support principal-based authorization [5].

**Principal ACLs vs. Repository ACLs**: Use `set principal ACL` instead of `set ACL on <path>`. Principal ACLs store permissions on the service user's own node, avoiding pollution of `/content/.../rep:policy` nodes and improving portability [5].

After creating a service user via repoinit, map it to your OSGi service using a `ServiceUserMapperImpl.amended` factory config [5]:

```json
// org.apache.sling.serviceusermapping.impl.ServiceUserMapperImpl.amended~myapp.cfg.json
{
  "user.mapping": [
    "myapp.core:dataReaderSubService=myapp-data-reader"
  ]
}
```

### Mutable Content Installation Sequence

Cloud Manager installs mutable content packages at three distinct points in a deployment [3]:

1. **Before application startup** — Index definitions are processed; new or modified Oak indexes trigger a full reindexing step. Traffic does not switch until reindexing is complete.
2. **During startup** — Service users, ACLs, and node types created via repoinit are provisioned by the OSGi framework during AEM startup.
3. **After switchover** — All other mutable content packages (folders, templates, context-aware configurations) are installed after the new code image is live.

### Blue-Green Deployment and Mutable Content Constraints

AEMaaCS uses a blue-green (rolling) deployment where both old and new code run simultaneously during the switchover window. Application code changes **cannot depend on general mutable content-package changes** at switchover time. Exceptions are limited to [3]:

- Service users and their ACLs (applied in phase 2, before traffic switch)
- Node type changes
- Index definition changes

For changes that would break backward compatibility, spread them across two releases: release 1 adds new structures alongside old ones; release 2 removes the old structures after the old code is fully retired [3].

### Frozen Packages in Package Manager

Any package installed by Cloud Manager appears in a frozen state in AEM's Package Manager UI [1]:
- Cannot be reinstalled, rebuilt, or downloaded
- Listed with a `cp2fm` suffix
- Visible for audit purposes only

### Oak Index Naming

Custom Oak indexes in AEMaaCS must follow naming patterns [2]:

- **Customized OOTB indexes**: `<indexName>-<productVersion>-custom-<customVersion>`
- **Fully custom indexes**: prefixed with your application namespace

Only Lucene indexes with `compatVersion = (Long)2` are supported. ACS Commons Ensure Oak Index is not compatible with AEMaaCS [2].

## Common Patterns

**Scenario 1 — Migrating from AEM 6.x to AEMaaCS**: Projects with a single "uber-package" must be split. The Repository Modernizer tool automates separation of code from content into the required multi-module Maven structure (ui.apps, ui.content, ui.config, all) [6].

**Scenario 2 — Provisioning service users**: Use repoinit in `ui.config` rather than a mutable content package for service users and ACLs. Repoinit runs at startup, is idempotent (operations are skipped if state already matches), and runs earlier in the lifecycle than content packages [3].

**Scenario 3 — Creating initial content structures**: For folder hierarchies under `/content` or `/conf` that are logically part of the application, prefer repoinit `create path` statements over a content package. These paths are guaranteed to exist before any bundle activates [3].

**Scenario 4 — Runtime content management**: Cloud Service's Package Manager can install packages at runtime, but only for mutable content (`/content`, `/conf`). It cannot install immutable content because `/apps` is write-locked at runtime [1].

**Scenario 5 — Environment-specific configurations**: Repoinit supports run-mode targeting. An OSGi config in `config.author.prod` only applies to production Author, enabling environment-specific security policies without multiple codebases [5].

**Scenario 6 — Groups vs. users**: Only groups integral to the application (e.g., workflow assignee groups) should be defined via repoinit. Organizational users and groups that are managed by business users should remain runtime-managed in AEM, not baked into the codebase [2].

## Gotchas

- **MIXED package silently drops mutable content**: If your package touches both `/apps` and `/content`, Cloud Manager installs only the `/apps` content. Your mutable changes are silently skipped — no hard error, only a warning log. Common gotcha for developers migrating AEM 6.x all-in-one packages [1].

- **`/oak:index` is mutable but behaves like immutable for deployment purposes**: Developers may assume that because `/oak:index` is not under `/apps`, they can manage indexes outside a code pipeline. This is wrong — indexes must be deployed via Cloud Manager, and Cloud Manager holds the deployment until reindexing completes. Indexes created at runtime will not survive a container restart [2].

- **Repoinit configs are NOT reverted on uninstall**: Removing a repoinit OSGi config from your codebase and redeploying does NOT clean up the provisioned resources (service users, paths, ACLs). Repoinit is additive-only [3]. Cleanup requires explicit `delete` or `remove` statements in a follow-up repoinit config.

- **File naming: tilde vs. dash separator**: The OSGi factory config filename must use `~` or `-` as the separator between the class name and your custom suffix (e.g., `org.apache.sling.jcr.repoinit.RepositoryInitializer~myapp.config`). Adobe recommends `~` [5].

- **Service users must be under `system/cq:services`**: Principal-based authorization only works for users under `/home/users/system/cq:services`. Creating a service user at any other path disables `set principal ACL` for that user [5].

- **No rollback for mutable content**: Unlike immutable code (which rolls back by reverting to the previous container image), mutable content changes applied by Cloud Manager cannot be automatically reversed [3]. A bad content package requires a hotfix release or a full point-in-time system restore.

- **`.cfg.json` vs. `.config` for repoinit — format exception**: Adobe recommends `.cfg.json` for all OSGi configs as the standard. Repoinit is explicitly an exception — `.config` format is recommended specifically because `scripts` is a multi-line array value that requires awkward JSON escaping in `.cfg.json` [4].

- **`<subPackages>` vs. `<embeddeds>` in the `all` container**: Modern AEMaaCS-compliant projects use `<embeddeds>` in the container's `pom.xml` to include subpackages, targeting explicit install paths under `/apps/<app>-packages/`. Legacy use of `<subPackages>` can cause installation path targeting issues [4].

- **Container packages must not contain direct content nodes or install hooks**: The `all` package can only embed subpackages and OSGi bundles. Adding JCR content directly to the container package, or using install hooks, violates the model and causes validation failures [4].

- **Blue-green switchover cannot depend on general mutable content changes**: Code that activates on switchover and requires a new mutable content structure (e.g., a new `/conf` path or a new editable template) will fail unless that structure is created by repoinit (which runs before switchover). This forces backward-compatible code design or use of repoinit for structural prerequisites [3].

## Sources

[1] **What is Mutable and Immutable content in AEM as a Cloud Service? — Adobe Experience League**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-learn/cloud-service/developing/basics/mutable-immutable
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Core definitions, path classifications, MIXED package behavior (mutable portion silently dropped), frozen/cp2fm packages in Package Manager, constraint that code is never deployed directly to a running instance.

[2] **AEM Project Structure — Adobe Experience Manager**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/developing/aem-project-content-package-structure
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Package type classifications (application, content, container), mandatory separation rules, standard module breakdown (ui.apps, ui.content, ui.config, all), embedded subpackage install paths, `cloudManagerTarget=none` requirement, Oak index naming conventions, groups vs users guidance.

[3] **Deploying to AEM as a Cloud Service — Adobe Experience League**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/deploying/overview
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Three-phase mutable content installation timing (before startup / during startup / after switchover), repoinit atomicity and idempotency, no-rollback constraint for mutable content, Oak index reindexing blocking traffic switchover, blue-green deployment compatibility requirements, multi-release strategy for breaking changes.

[4] **Content Package Type Validation Forces Rethink of Standard Project Structure — Bounteous**
    URL: https://www.bounteous.com/insights/2021/06/17/content-package-type-validation-forces-rethink-standard-project-structure-adobe/
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: FileVault Package Maven Plugin v1.1.0+ enforcement details, container-as-transparent-wrapper pattern, pom.xml structure changes, `<embeddeds>` vs `<subPackages>` distinction, `.config` vs `.cfg.json` file format recommendation for repoinit.

[5] **Creating AEM Service Users Using Sling Repo Initializer — Oshyn**
    URL: https://www.oshyn.com/blog/aem-service-users-sling-repo-initializer
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: RepositoryInitializer OSGi factory file naming convention (tilde separator), `.config` vs `.cfg.json` format for multi-line scripts, service user path requirement under `system/cq:services`, principal ACL vs. repository ACL syntax difference, ServiceUserMapperImpl mapping pattern.

[6] **AEM as a Cloud Service Code Refactoring Tool: Repository Modernizer — Adobe Tech Blog**
    URL: https://medium.com/adobetech/aem-as-a-cloud-service-code-refactoring-tool-repository-modernizer-40f780c495e9
    Accessed: 2026-03-29
    Relevance: background
    Extracted: Repository Modernizer tool context for automated migration from single-package AEM 6.x projects to multi-module AEMaaCS-compliant structure.
