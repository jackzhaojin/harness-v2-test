# Code Refactoring for AEMaaCS

**Topic ID:** `cloud-manager-operations.migration.code-refactoring`
**Researched:** 2026-03-29T00:00:00Z

## Overview

Migrating custom AEM code to AEM as a Cloud Service (AEMaaCS) is not a lift-and-shift operation — it requires deliberate refactoring to meet the platform's cloud-native constraints [1]. AEMaaCS runs on a containerized, immutable infrastructure where AEM instances are transient and can be created or destroyed at any time. This fundamentally changes how code, content, and configuration are structured, deployed, and managed [2]. Custom code that ran fine on AEM 6.x on-premise or on AMS may fail at deployment or at runtime because of deprecated APIs, incorrect package structure, or improperly defined indexes [3].

The refactoring process follows three broad areas: restructuring the repository to enforce the mutable/immutable content split, removing deprecated Java APIs and updating OSGi configuration formats, and converting custom Oak index definitions to AEMaaCS-compatible formats. Adobe provides a suite of automated refactoring tools (Repository Modernizer, Index Converter, Dispatcher Converter, AEM Modernization Tools) and an assessment tool (Best Practices Analyzer) to scope and execute this work [1]. Cloud Manager enforces compliance through its Code Quality pipeline step, which can pause or fail deployments if violations remain [5].

## Key Concepts

- **Mutable content** — Repository paths that can be changed at runtime: `/content`, `/conf`, `/var`, `/home`, `/oak:index`, and similar areas [2]. Stored in a shared Content Repository Service accessible to all AEM instances.

- **Immutable content** — Paths `/apps` and `/libs` that cannot be modified after AEM starts [2]. Changes to these paths can only be deployed via a Cloud Manager pipeline. Attempting to install a package that touches immutable paths via Package Manager will fail.

- **Repository Modernizer** — Adobe's tool that restructures an existing AEM Maven project to separate mutable and immutable content into the required packages: `ui.apps` (immutable code), `ui.content` (mutable content), and `ui.config` (OSGi configuration) [1].

- **Index Converter** — Migrates existing custom Oak (Lucene) index definitions to AEMaaCS-compatible definitions, applying cloud-specific naming conventions and validation rules [4].

- **Best Practices Analyzer (BPA)** — An AEM package installed on the source instance that scans for compatibility issues, deprecated APIs, unsupported configurations, and non-compliant packages, generating a report imported into Cloud Acceleration Manager [5].

- **`.cfg.json` OSGi format** — The only supported OSGi configuration file format in AEMaaCS. Legacy formats (`.cfg`, `.config`, XML `sling:OsgiConfig`) are superseded and must be converted [3].

- **OSGi environment variables** — Used in `.cfg.json` files to externalize secrets (`$[secret:key]`) and environment-specific values (`$[env:key]`) because custom run modes are not supported in AEMaaCS [3].

- **AEM SDK Build Analyzer Maven Plugin** — Integrates into Maven builds to detect deprecated Java API usage and OSGi configuration errors locally before code reaches Cloud Manager [3].

- **Blue-green deployment** — AEMaaCS deployment strategy enabling zero downtime; indexes must be fully built on the new (blue) environment before traffic switches [4].

## Technical Details

### Mutable vs. Immutable Package Structure

AEMaaCS enforces a hard separation of content and code. A single content package cannot deploy to both `/apps` and runtime-writable areas [2]. The required package structure is:

| Package | Type | Contents | Deploys To |
|---------|------|----------|------------|
| `ui.apps` | `application` | Components, HTL scripts, client libraries, `/libs` overlays, ACLs under `/apps` | `/apps` only |
| `ui.content` | `content` | `/conf` configurations, `/content` structures, tagging taxonomies, legacy `/etc` | Mutable paths |
| `ui.config` | `application` | OSGi `.cfg.json` files, Repo Init scripts | `ui.config` sub-path |
| `all` | container | Embeds all the above; the only package that Cloud Manager deploys directly | — |

All other packages must include `<cloudManagerTarget>none</cloudManagerTarget>` in their POM so Cloud Manager does not attempt to deploy them independently [2]. Packages must use `<embeddeds>` (not `<subPackages>`) to nest sub-packages within the `all` container [2].

The general dependency rule: `ui.content` must declare a dependency on `ui.apps`, ensuring code is installed before the content that depends on it [2].

### Deprecated Java APIs

Several Java APIs are being removed on a hard schedule [3]:

| API / Package | Replacement | Removal Date |
|---|---|---|
| `org.apache.sling.commons.auth*` | `org.apache.sling.auth` | Feb 26, 2026 |
| `org.eclipse.jetty.*` | OSGi Http Whiteboard | Feb 26, 2026 |
| `com.mongodb.*` | `org.mongodb:mongo-java-driver:3.12.7` | Feb 26, 2026 |
| `ch.qos.logback.*` | SLF4J with Log4J 2.x | Feb 26, 2026 |
| `com.google.common.*` (Guava) | JDK collections / Apache Commons 4 | Feb 26, 2026 |
| `org.apache.commons.lang*` | `org.apache.commons.lang3` | Sept 30, 2026 |
| `org.apache.commons.collections*` | `org.apache.commons.collections4` | Sept 30, 2026 |
| JavaScript Use API | Java Use API | Ongoing |
| Service Account (JWT) credentials | OAuth Server-to-Server credentials | Jan 1, 2025 (already removed) |

**Enforcement timeline** for the Feb 26, 2026 APIs [3]:
- Jan 26, 2026 — Actions Center notification emails begin
- Feb 26, 2026 — Cloud Manager pipelines **pause** during Code Quality step
- Mar 30, 2026 — Cloud Manager pipelines **fail**; deployments blocked

To detect usage locally, add the AEM SDK Build Analyzer Maven Plugin to `pom.xml`. After fixing, verify in Cloud Manager's Code Quality step output [3].

### OSGi Configuration Changes

AEMaaCS supports only `.cfg.json` format [3]. Example migration:

**Legacy `.config` format (not supported):**
```
com.example.MyService.config
service.url="https://api.example.com"
service.timeout=I"5000"
```

**AEMaaCS `.cfg.json` format:**
```json
// apps/example/config.publish/com.example.MyService.cfg.json
{
  "service.url": "$[env:SERVICE_URL;default=https://api.example.com]",
  "service.timeout": 5000
}
```

Run-mode folders supported: `config`, `config.author`, `config.publish`, `config.dev`, `config.stage`, `config.prod`. Custom run modes are not supported; use environment variables for any variation beyond author/publish/environment tier [3].

Secrets must use the syntax `$[secret:secretName]` and are injected through Cloud Manager's environment configuration, never hardcoded in config files [3].

### Index Management

AEMaaCS supports only Lucene indexes [4]. On-premise Property indexes and Solr indexes must be converted. Key rules:

- Index definitions must be stored at `ui.apps/src/main/content/jcr_root/_oak_index/` and deployed via Cloud Manager pipeline [4]
- Although `/oak:index` is technically a mutable path, indexes must be deployed as code so they are reindexed before content packages install [2]
- During blue-green deployment, Cloud Manager waits for complete reindexing before switching traffic [4]
- Index definitions cannot use nested subdirectory structures [4]

**Naming conventions** [4]:
- Customized OOTB index: `<ootb-index-name>-<version>-custom-<customVersion>` e.g., `damAssetLucene-2-custom-1`
- Fully custom index: `<prefix>.<customIndexName>-<version>-custom-<customVersion>` e.g., `wknd.adventures-1-custom-1`

The **Index Converter tool** handles this automatically for Lucene indexes under `/apps` or `/oak:index`. For OOTB indexes, it computes the delta (your customizations) and merges them into the current cloud version of that index [4].

If **Ensure Oak Index** (ACS AEM Commons feature) was used, those definitions must be converted first: change `jcr:primaryType` to `oak:QueryIndexDefinition`, remove OSGi-flagged properties, and delete the `/facets/jcr:content` subtree. Ensure Oak Index is not supported in AEMaaCS [4].

## Common Patterns

**Assessment before refactoring**: Run BPA on the source AEM instance before touching any code. BPA outputs a severity-ranked report (INFO, ADVISORY, MAJOR, CRITICAL). CRITICAL findings must be resolved; MAJOR findings should be addressed. Import the BPA report into Cloud Acceleration Manager (CAM) for planning [5].

**Running refactoring tools via Adobe I/O CLI**:
```bash
npm install -g @adobe/aio-cli
aio plugins:install @adobe/aio-cli-plugin-aem-cloud-service-migration

# Run Repository Modernizer
aio aem-migration:repository-modernizer

# Run Index Converter
aio aem-migration:index-converter
```

**Typical refactoring sequence** [1][2][4]:
1. Run BPA, import into CAM, prioritize findings
2. Run Repository Modernizer to split mutable/immutable content into correct packages
3. Run Index Converter to migrate custom Oak indexes
4. Run Dispatcher Converter for dispatcher configurations
5. Run AEM Modernization Tools for Classic UI → Touch UI, static → editable templates
6. Migrate OSGi configs from `.config`/`.xml` to `.cfg.json`
7. Remove or replace deprecated Java APIs (identified via SDK Build Analyzer Plugin)
8. Replace Service Account (JWT) credentials with OAuth Server-to-Server
9. Validate locally using AEM Cloud SDK, then push through Cloud Manager pipeline

**Repo Init for service users and ACLs**: In AEMaaCS, service users and baseline ACLs should be defined using Repo Init scripts in `ui.config`, not managed at runtime via Package Manager or Groovy scripts [2].

## Gotchas

**Package Manager cannot deploy to immutable paths**: Any package that writes to `/apps` or `/libs` will fail when installed via Package Manager in AEMaaCS. This is a hard failure, not a warning. Teams accustomed to deploying code via CRX/DE or Package Manager on-premise must fully switch to Cloud Manager pipelines [2].

**Mutable content cannot be rolled back**: After deploying mutable content changes, there is no rollback mechanism. If issues are detected, the only options are: a new forward-fix deployment or restoring the entire system to a pre-deployment state [2]. This makes testing mutable package changes critical before production deployment.

**Oak index updates cause pipeline delays**: When an index definition changes, Cloud Manager waits for complete reindexing before switching to the new code. For large repositories, this can cause pipeline timeouts. The pipeline can be rerun; indexing continues in the background [4].

**Copy index definitions from cloud instance, not SDK**: When customizing an OOTB index, always copy the base definition from a live AEMaaCS environment, not from the local SDK. SDK versions can lag behind production, and using a stale base definition can break functionality [4].

**Ensure Oak Index is not supported**: Many AEM 6.x implementations use the Ensure Oak Index feature from ACS AEM Commons. This entire pattern is unsupported in AEMaaCS and must be fully replaced with standard Oak index definitions before running the Index Converter [4].

**`.cfg.json` vs `.config` naming clash**: The `.cfg.json` extension is easy to mistype as `.config.json` (which is not valid). OSGi configuration files must follow the exact pattern: `<PID>.cfg.json` or `<PID>~<factory>.cfg.json` for factory configurations [3].

**No custom run modes**: AEM 6.x allowed arbitrary run modes like `config.local`, `config.integration`, `config.myEnv`. In AEMaaCS, only standard run modes (`config.author`, `config.publish`, `config.dev`, `config.stage`, `config.prod`) are supported. All environment-specific variation beyond these must use OSGi environment variables injected via Cloud Manager [3].

**SlingSettingsService run mode detection may behave differently**: Code that calls `SlingSettingsService.getRunModes()` to detect environment context at runtime will not work as expected since custom run modes are gone. Refactor to use Cloud Manager environment variables or OSGi configs [3].

**Java 11 → Java 21 migration**: Java 11 runtime is deprecated in AEMaaCS; Java 21 is now required. While code may still compile against Java 11, library versions must be updated to match Cloud Service requirements [3].

**BPA is not a one-time scan**: As code is refactored, new issues can surface. Run BPA iteratively throughout the refactoring phase, not just once at the start. A clean BPA report is a prerequisite for content migration [1].

## Sources

[1] **AEM as a Cloud Service: Step-by-Step Migration Guide — GSPANN**
    URL: https://www.gspann.com/resources/blogs/aem-as-a-cloud-service-step-by-step-migration-guide/
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: Overview of BPA, code refactoring tools table (Repository Modernizer, Dispatcher Converter, Index Converter, Asset Workflow Migration, AEM Modernization Tools), OSGi cfg.json format requirements, CI/CD model description.

[2] **AEM Project Structure | Adobe Experience Manager (Experience League)**
    URL: https://experienceleague.adobe.com/docs/experience-manager-cloud-service/content/implementing/developing/aem-project-content-package-structure.html?lang=en
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Mutable vs immutable path definitions, package types (ui.apps, ui.content, ui.config, all), cloudManagerTarget:none requirement, embeddeds vs subPackages rule, package dependency ordering, Oak index deployment as code, Repo Init pattern.

[3] **Deprecated and Removed Features and APIs | Adobe Experience Manager**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/release-notes/deprecated-removed-features
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Full table of deprecated Java APIs with removal dates (Feb 26, 2026 and Sept 30, 2026), OSGi cfg.json format requirement, enforcement timeline (pause Feb 26 / fail Mar 30), SDK Build Analyzer Plugin for detection, JWT → OAuth migration deadline, JavaScript Use API deprecation, Logback removal, Commons Lang/Collections version upgrades, Java 21 requirement.

[4] **Index Converter | Adobe Experience Manager (Experience League)**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/migration-journey/refactoring-tools/index-converter
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Index Converter scope (Lucene only, not nt:base), naming conventions for custom OOTB and fully custom indexes, Ensure Oak Index conversion steps, configuration parameters (aemVersion, paths), CLI invocation, blue-green deployment reindexing behavior, storage location in ui.apps at _oak_index.

[5] **Readiness and Best Practices Analyzer | Adobe Experience Manager**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-learn/cloud-service/migration/cloud-acceleration-manager/readiness-and-best-practice-analyzer
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: BPA severity levels (INFO, ADVISORY, MAJOR, CRITICAL), BPA integration with Cloud Acceleration Manager, Cloud Manager SonarQube + OakPAL code quality pipeline, Critical/Important/Moderate pipeline gate behaviors, SuppressWarnings for false positives, iterative BPA usage recommendation.
