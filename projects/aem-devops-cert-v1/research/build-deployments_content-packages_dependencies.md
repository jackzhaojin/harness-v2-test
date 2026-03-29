# Package Dependencies and Ordering

**Topic ID:** build-deployments.content-packages.dependencies
**Researched:** 2026-03-29T00:00:00Z

## Overview

AEM content package dependencies and install ordering govern how multi-module AEM projects are structured, deployed, and validated. Since AEM as a Cloud Service (AEMaaCS) enforces a strict separation between immutable code (`/apps`, `/libs`) and mutable content (`/content`, `/conf`, `/var`, etc.), the dependency model was formalized with the release of FileVault Package Maven Plugin 1.1.0+, which introduced three explicit package types — `application`, `content`, and `container` — each with enforced rules about what they may contain and what dependencies they may declare [1][2].

In this model, a single `container` package (typically named `all`) acts as the sole Cloud Manager deployment artifact, embedding all other packages [1]. The install ordering is deterministic: immutable code is applied first (including Oak indexes), followed by mutable content in three distinct phases during the deployment pipeline [3]. Understanding these rules is critical for the AEM DevOps Engineer exam, which tests both the conceptual model and the practical mechanics of how packages must be structured to pass Cloud Manager validation.

Dependency declarations affect whether packages install successfully. The rule that content packages should depend on the application packages that support them — but that bundles-only application packages must NOT be listed as dependencies — is a subtle and frequently tested gotcha [1].

## Key Concepts

- **Package Types** — Three types are enforced by FileVault 1.1.0+: `application` (immutable code under `/apps`), `content` (mutable content under `/content`, `/conf`, etc.), and `container` (wrapper only — embeds sub-packages and OSGi bundles, no regular nodes) [1][2].

- **Container (all) Package** — The single deployment artifact submitted to Cloud Manager. All other packages are embedded within it. The container package itself must NOT declare package dependencies and must NOT contain regular content nodes or use install hooks in AEMaaCS [1][2].

- **`<embeddeds>` vs `<subPackages>`** — In AEMaaCS, always use the FileVault Maven Plugin's `<embeddeds>` configuration, which requires explicit target paths. The older `<subPackages>` approach derives paths from artifact metadata and is not compatible with AEMaaCS; it remains valid for AEM 6.5 on-premise [1][4].

- **Embedding Target Path Convention** — Sub-packages are embedded at: `/apps/<app-name>-packages/(application|content|container)/install(.author|.publish)?`. Only `.author` and `.publish` run modes are supported for targeted installation scoping [1].

- **Dependency Direction** — Mutable content packages (`ui.content`) should declare a dependency on the immutable application package (`ui.apps`) that supports their rendering. Application packages depend only on other application packages. Container packages declare NO dependencies [1].

- **OSGi Bundle-Only Exception** — If an `application` package contains ONLY OSGi bundles (no JCR nodes), NO other package should declare a dependency on it, because it is not registered with AEM Package Manager and would result in an unsatisfied dependency causing install failure [1].

- **`repositoryStructurePackage`** — Required for all `application`-type packages. This FileVault Maven Plugin configuration enforces structural dependency correctness, preventing one code package from inadvertently overlaying another's paths [1].

- **`cloudManagerTarget`** — All packages except the container (`all`) package must set `<cloudManagerTarget>none</cloudManagerTarget>` in their Maven properties, preventing Cloud Manager from deploying individual sub-packages directly [1][3].

- **Oak Indexes as Code** — Although `/oak:index` paths are mutable at runtime, Oak indexes must be packaged as part of the immutable code deployment so they are installed and reindexed before mutable content packages are applied [3].

- **Repo Init** — The recommended mechanism for deploying mutable application content (service users, ACLs, baseline folder structures). Stored as OSGi factory configurations in `ui.config`, Repo Init runs at application startup and is idempotent [1][3].

## Technical Details

### Package Type Rules (FileVault 1.1.0+)

| Package Type | `packageType` value | May contain | May NOT contain | May declare deps? |
|---|---|---|---|---|
| Application | `application` | JCR nodes under `/apps`, components, HTL, client libs | Sub-packages, OSGi bundles/configs | Yes (on `application` only) |
| Content | `content` | JCR nodes under `/content`, `/conf`, `/var`, etc. | OSGi bundles/configs, sub-packages | Yes (on `application` or `content`) |
| Container | `container` | Sub-packages, OSGi bundles, OSGi configs | Regular JCR nodes, install hooks | NO |

Declaring the wrong `packageType` causes Cloud Manager validation to fail [2].

### Embedding Convention

The FileVault Maven Plugin `<embeddeds>` config places sub-packages in a "side-car" folder [1]:

```
/apps/<app-name>-packages/
  application/
    install/           # code packages -> both Author + Publish
    install.author/    # code packages -> Author only
    install.publish/   # code packages -> Publish only
  content/
    install/
    install.author/
    install.publish/
  container/
    install/           # third-party container packages
```

The container's `filter.xml` must include the root path [1]:

```xml
<filter root="/apps/my-app-packages"/>
```

### Dependency Declaration in POM

From the AEM project structure docs, the dependency model for a typical project [1]:

```
all (container)  -> no dependencies
  ui.apps (application)  -> no package dependencies
  ui.content (content)   -> depends on ui.apps
```

The `ui.content` dependency is declared in `filevault-package-maven-plugin` config:

```xml
<plugin>
  <groupId>org.apache.jackrabbit</groupId>
  <artifactId>filevault-package-maven-plugin</artifactId>
  <configuration>
    <dependencies>
      <dependency>
        <groupId>${project.groupId}</groupId>
        <artifactId>ui.apps</artifactId>
        <version>${project.version}</version>
      </dependency>
    </dependencies>
  </configuration>
</plugin>
```

### `repositoryStructurePackage` Configuration (application packages only)

```xml
<repositoryStructurePackages>
  <repositoryStructurePackage>
    <groupId>${project.groupId}</groupId>
    <artifactId>ui.apps.structure</artifactId>
    <version>${project.version}</version>
  </repositoryStructurePackage>
</repositoryStructurePackages>
```

This prevents code packages from colliding at paths like `/apps/my-app/components` [1].

### Deployment Sequence in AEMaaCS

Cloud Manager installs packages in a strict order [3]:

1. **Immutable code** — application packages via `/apps` (code image applied)
2. **Oak indexes** — deployed as code, reindexing completes before switchover
3. **Mutable content Phase 1 (pre-startup):** Index definition changes
4. **Mutable content Phase 2 (during startup):** New service users, ACLs, node types
5. **Mutable content Phase 3 (post-switchover):** All other content (templates, configuration, etc.)

### Alphabetical Order on Disk

For AEM instances that are NOT running, packages dropped into `crx-quickstart/install/` are installed at startup in alphabetical order. This applies to self-hosted AEM 6.5 but not AEMaaCS, which uses Cloud Manager pipeline ordering [4].

## Common Patterns

**Standard Multi-Module Project Structure** [1]:
- `all/` — container package, sole Cloud Manager target
- `core/` — Java OSGi bundle, packaged as JAR (embedded in `all`)
- `ui.apps/` — application package; components, HTL, client libs, OSGi configs, Oak indexes
- `ui.config/` — application package; OSGi factory configurations (repoinit scripts)
- `ui.content/` — content package; initial content, editable templates, context-aware configs

**Embedding a Third-Party Package (e.g., ACS AEM Commons)** [1][4]:
Embed the third-party container package in your own `all` container under `/apps/<app>-packages/container/install`:

```xml
<embedded>
  <groupId>com.adobe.acs</groupId>
  <artifactId>acs-aem-commons-all</artifactId>
  <type>zip</type>
  <target>/apps/my-app-packages/container/install</target>
</embedded>
```

**Author-Only vs Publish-Only Content** [1]:
Use install path suffixes to scope deployment:
- `/apps/my-app-packages/content/install.author` — author-only (e.g., workflow models, editor configs)
- `/apps/my-app-packages/content/install.publish` — publish-only (e.g., dispatcher configs, caching rules)

**Marking Non-Deployment Packages** [1][3]:
All sub-packages except `all` must opt out of Cloud Manager direct deployment:

```xml
<properties>
  <cloudManagerTarget>none</cloudManagerTarget>
</properties>
```

Verify after build at: `<module>/target/vault-work/META-INF/vault/properties.xml`

## Gotchas

**Container packages cannot declare dependencies.** This is explicitly prohibited in AEMaaCS. If a container-type package lists `<dependencies>`, validation fails. External container packages (e.g., third-party libraries) must be embedded inside your container, not referenced as dependencies [1][2].

**Do NOT use `<subPackages>` in AEMaaCS.** The `<subPackages>` configuration derives the install path from the artifact's own vault metadata, which bypasses the explicit `/apps/<app>-packages/` folder structure required by AEMaaCS. Use `<embeddeds>` with an explicit `<target>` path in all AEMaaCS projects. For AEM 6.5 on-premise, `<subPackages>` is still acceptable [1][4].

**OSGi bundle-only application packages must NOT be declared as dependencies.** If `ui.apps` (or any application package) contains only OSGi bundles and no JCR nodes, no other package should declare it as a dependency. OSGi bundles are not registered with AEM Package Manager; declaring a dependency on such a package results in an unsatisfied dependency and install failure [1].

**Mixed-type packages trigger Cloud Manager warnings.** A package that deploys to both `/apps` and `/content` (mixed immutable + mutable) is flagged as `MIXED` type. Cloud Manager installs only the mutable portion and logs a warning. This does not fail the pipeline but signals a structural violation [3].

**Oak indexes belong in code packages, not content packages.** Although `/oak:index` paths are technically mutable at runtime, they must be in `ui.apps` (application package) to ensure they are installed and reindexed before any mutable content packages apply. Placing Oak indexes in a content package breaks deployment ordering guarantees [1][3].

**Application packages should not depend on container packages.** Dependencies should only flow within the same type hierarchy: content depends on application. A package of one type should never depend on a container package, as containers are transparent wrappers [1].

**Overlaying existing paths causes silent failures.** If a package's workspace filter overlaps with a path already defined in another package, the later package's changes may be silently hidden by the overlay. The container's workspace filter must never overlap with the application package's filter [1][2].

**`<repositoryStructurePackage>` is required for application packages only.** Content packages do not need this. Omitting it from an application package means FileVault cannot verify structural dependencies are correct, potentially causing one code package to install over another's paths [1].

**No mutable content rollback.** Once mutable content packages are deployed via Cloud Manager, there is no automated rollback. Recovery options are limited to deploying a corrected version or restoring the environment from a point-in-time backup [3].

**Packages installed via Cloud Manager appear frozen.** Packages deployed by Cloud Manager appear in Package Manager UI with a `cp2fm` suffix and are in a frozen state — they cannot be reinstalled, rebuilt, or downloaded [3].

**AEM 6.5 vs AEMaaCS structural differences matter for the exam.** On AEM 6.5, `<subPackages>` is still commonly used and install hooks are supported. On AEMaaCS, `<embeddeds>` is required, install hooks on containers are banned, and package type enforcement is strict. Exam questions may test whether you can identify which approach applies to which platform [1][4].

## Sources

[1] **AEM Project Content Package Structure | Adobe Experience Manager**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/developing/aem-project-content-package-structure
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Package type rules (application/content/container), dependency direction rules, `<embeddeds>` vs `<subPackages>`, embedding path conventions, `repositoryStructurePackage`, `cloudManagerTarget`, container dependency prohibition, OSGi bundle exception, Oak indexes as code, filter.xml requirements, author/publish install path suffixes.

[2] **Content Package Type Validation Forces Rethink of Standard Project Structure | Bounteous**
    URL: https://www.bounteous.com/insights/2021/06/17/content-package-type-validation-forces-rethink-standard-project-structure-adobe/
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: Historical context on pre-2019 mixed packages, FileVault 1.1.0+ package type enforcement rationale, eight best practices for migration, common migration mistakes (wrong embedding, mixing runmodes across types, deploying sub-packages directly via Cloud Manager), directed acyclic dependency graph requirement.

[3] **Deploying to AEM as a Cloud Service | Adobe Experience Manager**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/deploying/overview
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Deployment sequence (immutable first, then 3-phase mutable install), Oak index reindexing before switchover, mixed-package warning behavior, no mutable content rollback, Repo Init timing, cp2fm frozen package state in Package Manager.

[4] **AEM `<subPackages>` vs `<embeddeds>` (Community + Official Docs)**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/developing/aem-project-content-package-structure
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: Technical difference between `<embeddeds>` (explicit target path) and `<subPackages>` (derived from artifact metadata), AEM 6.5 on-premise still supports `<subPackages>`, alphabetical install order for packages dropped to `crx-quickstart/install/` on non-running instances, third-party package embedding patterns.
