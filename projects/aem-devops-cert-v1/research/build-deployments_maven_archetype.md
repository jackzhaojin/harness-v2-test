# AEM Project Archetype

**Topic ID:** build-deployments.maven.archetype
**Researched:** 2026-03-29T00:00:00Z

## Overview

The AEM Project Archetype is a Maven template maintained by Adobe that generates a minimal, best-practices-based Adobe Experience Manager project structure [1]. Running a single Maven command scaffolds all necessary modules, configurations, parent POM settings, and front-end tooling stubs — giving teams a compliant, deployment-ready starting point instead of assembling one by hand. It is the standard starting point for both AEM 6.5 on-premise/AMS projects and AEM as a Cloud Service projects, with behavior that adapts based on the `aemVersion` parameter [2].

As of early 2026 the latest release is version 56 (released October 2025) [2]. Adobe has noted that for brand new projects, Edge Delivery Services is now the recommended path, but the archetype remains the canonical approach for traditional AEM Sites/Commerce development and is central to the AEM DevOps certification exam [1][2].

The archetype enforces a clean separation between immutable code (deployed under `/apps`) and mutable content (deployed under `/content`, `/conf`, and similar paths). This separation is mandatory for AEM as a Cloud Service and drives the multi-module project structure [3].

## Key Concepts

- **Immutable vs. mutable content** — AEM as a Cloud Service enforces that `/apps` and `/libs` are read-only at runtime; everything else (`/content`, `/conf`, `/var`, `/oak:index`, etc.) is mutable. Code packages deploy to `/apps`; content packages deploy to mutable areas. A single package cannot span both [3].
- **`all` container package** — The single deployment artifact that embeds all subpackages (code, content, config). Cloud Manager deploys only the `all` package; all other subpackages must set `<cloudManagerTarget>none</cloudManagerTarget>` to prevent direct deployment [3].
- **`packageType` declaration** — Each module declares its type: `application` (immutable, e.g., `ui.apps`), `content` (mutable, e.g., `ui.content`), or `container` (the `all` package). Container packages must contain no direct code or content — only embedded subpackages [3].
- **`ui.apps.structure` (formerly `repository-structure`)** — An empty Maven module renamed in archetype 23 that defines the JCR root paths that `ui.apps` deploys into. It exists purely to resolve package installation ordering and must set `<cloudManagerTarget>none</cloudManagerTarget>` [4][5].
- **`ui.frontend` module** — Webpack-based front-end build system that compiles TypeScript, SASS, and JavaScript into client libraries consumed by `ui.apps`. Supports multiple modes: `general`, `react`, `angular`, and `decoupled` [1][2].
- **`ui.config` module** — Holds runmode-specific OSGi configurations. Separated from `ui.apps` starting with archetype 23 so that configuration-only changes can be deployed without rebuilding all of `ui.apps` [6].
- **Parent POM** — The root `pom.xml` is the parent POM that drives module ordering, manages shared dependencies (Uber-JAR, Core Components), and defines global properties like AEM host, port, and credentials used by all Maven profiles [7].
- **`aemVersion` parameter** — Controls which artifacts are included. Setting `cloud` omits the Core Components dependency (they ship with AEM as a Cloud Service out-of-the-box); setting `6.5.x` includes them explicitly [8].
- **`autoInstallPackage` Maven profile** — The default build profile defined in the parent POM for local development. Running `mvn clean install -PautoInstallPackage` builds and deploys the project to a locally running AEM instance [7].

## Technical Details

### System Requirements

The current archetype (v56) requires [2]:
- Java SE 11
- Maven 3.3.9+
- AEM as a Cloud Service (continual) or AEM 6.5.17.0+

### Generating a Project

The standard Maven invocation [1]:

```bash
mvn -B org.apache.maven.plugins:maven-archetype-plugin:3.2.1:generate \
  -D archetypeGroupId=com.adobe.aem \
  -D archetypeArtifactId=aem-project-archetype \
  -D archetypeVersion=56 \
  -D appTitle="My Site" \
  -D appId="mysite" \
  -D groupId="com.mysite" \
  -D aemVersion=cloud
```

For AEM 6.5 on-premise/AMS, change `aemVersion=6.5.17` (or the specific service pack target).

> Note: older archetype versions used `archetypeGroupId=com.adobe.granite.archetype`. The current group ID is `com.adobe.aem` [8].

### Key Archetype Properties

| Parameter | Default | Description |
|---|---|---|
| `appTitle` | (required) | Website title and component groups |
| `appId` | (required) | Technical name for folders, libraries, and Maven artifactId |
| `groupId` | (required) | Maven groupId and Java source package root |
| `aemVersion` | `cloud` | Target environment: `cloud` or `6.5.x` |
| `frontendModule` | `general` | Front-end build type: `general`, `none`, `react`, `angular`, `decoupled` |
| `language` | `en` | ISO 639-1 language code for content structure |
| `includeDispatcherConfig` | `y` | Include dispatcher config (cloud or AMS/on-prem based on `aemVersion`) |
| `datalayer` | `y` | Include Adobe Client Data Layer integration |
| `includeExamples` | `n` | Include component library example site |
| `includeCif` | `n` | Include Commerce Integration Framework |
| `includeFormscommunications` | `n` | Include Forms core components |
| `precompiledScripts` | `n` | Precompile server-side scripts (cloud only) |

Source: [2]

### Module Structure

The archetype generates the following Maven modules [6][7]:

| Module | Package Type | JCR Path(s) | Purpose |
|---|---|---|---|
| `core` | OSGi bundle (JAR) | Installed via `all` | Java: OSGi services, servlets, schedulers, request filters |
| `ui.apps` | `application` | `/apps`, `/etc` | Components, HTL scripts, clientlibs, templates (immutable) |
| `ui.content` | `content` | `/content`, `/conf` | Pages, assets, sample content, XF structures (mutable) |
| `ui.config` | `application` | `/apps/.../config.*` | Runmode-specific OSGi configurations |
| `ui.frontend` | (build artifact) | Feeds `ui.apps` | Webpack/SASS/TypeScript front-end build; outputs clientlibs |
| `ui.apps.structure` | (structure only) | `/apps` | Declares JCR root paths; no content; `cloudManagerTarget=none` |
| `all` | `container` | N/A | Embeds all subpackages; sole Cloud Manager deployment artifact |
| `dispatcher` | N/A | N/A | Dispatcher config files (cloud or AMS variant) |

Testing modules also generated: `it.tests` (integration), `ui.tests` (Selenium-based UI tests).

### Build and Deploy

```bash
# Local development deploy
mvn clean install -PautoInstallPackage

# Override AEM instance properties at build time
mvn -PautoInstallPackage clean install \
  -Daem.host=staging.example.com \
  -Dsling.password=stagingpasswd
```
Source: [7]

### Package Embedding Order in `all`

Subpackages embed in the container using structured install paths [3]:

```
/apps/<appId>-packages/application/install        → code packages
/apps/<appId>-packages/content/install            → content packages
/apps/<appId>-packages/container/install          → nested containers
/apps/<appId>-packages/application/install.author → author-only packages
/apps/<appId>-packages/application/install.publish → publish-only packages
```

## Common Patterns

**AEM as a Cloud Service project** — Set `aemVersion=cloud`. Core Components are provided out-of-the-box so the archetype omits that dependency. The dispatcher module generates cloud-native dispatcher configuration. Only the `all` package is deployed via Cloud Manager [1][3].

**AEM 6.5 AMS/on-premise project** — Set `aemVersion=6.5.17` (or target service pack). Core Components dependency is included explicitly. Dispatcher config targets AMS format. The Uber-JAR version in the parent POM should be updated to match the exact AEM version [7].

**SPA (Single Page App) project** — Use `frontendModule=react` or `frontendModule=angular`. This configures the front-end module as a React/Angular SPA wired into the AEM SPA Editor. `frontendModule=decoupled` uses the AEM as a Cloud Service frontend pipeline instead [8].

**Config-only deployment** — Since `ui.config` is a separate package, OSGi configuration changes can be deployed without a full `ui.apps` rebuild. In Cloud Manager, targeting only the `all` package still works because `all` embeds all subpackages [6].

**Production cleanup** — Before going to production, remove the `core.wcm.components.examples` dependency and subpackage inclusion from `all/pom.xml`. Example content is for development use only [7].

## Gotchas

**OSGi bundles and configs do NOT belong in `ui.apps`** — This trips up developers migrating from older AEM projects. In archetype 23+, OSGi configurations belong in `ui.config`, not `ui.apps`. Placing them in `ui.apps` forces a full rebuild of that package for every config change and can conflict with Cloud Service package type validation [4][5].

**`ui.apps.structure` must have `cloudManagerTarget=none`** — If this is not set, Cloud Manager will deploy the structure package directly, which will remove all defined filter roots from the repository. The structure package is purely a build artifact for package installation ordering — it should never actually be installed [4][5].

**Single package spanning `/apps` and `/content` is rejected by AEM as a Cloud Service** — A legacy package structure that mixes immutable and mutable paths in one content package works on AEM 6.5 but will fail on AEM Cloud Service with a validation error. This is the most common migration blocker from AEM 6.5 to Cloud Service [3].

**Core Components are OOTB on Cloud Service, not on 6.5** — When `aemVersion=cloud`, the archetype intentionally omits the Core Components Maven dependency because they are bundled with the platform. For `aemVersion=6.5.x`, they must be included. Confusing these causes either a redundant dependency (cloud) or missing components (6.5) [8].

**`frontendModule=decoupled` vs `react`/`angular`** — The `decoupled` option configures the project to use the AEM as a Cloud Service frontend pipeline (a Cloud-specific CI/CD mechanism), whereas `react` or `angular` set up the project for the AEM SPA Editor with the standard Maven build. They are not interchangeable [8].

**Old `archetypeGroupId` for versions before archetype 20** — Projects prior to archetype 20 used `com.adobe.granite.archetype` as the group ID. Current archetype (v56) uses `com.adobe.aem`. Attempting to use the old group ID will result in a resolution error [8].

**Interactive mode limitation** — In interactive Maven mode, properties with default values cannot be changed without dismissing the final confirmation prompt. Use `-B` (batch mode) with all required `-D` parameters to override defaults cleanly [2].

**Eclipse cannot use the archetype wizard** — The `archetype-post-generate.groovy` script required by the AEM archetype is not executed by Eclipse's Maven project wizard. Always generate from the command line, then import the project into Eclipse as an existing Maven project [2].

**Uber-JAR version must match AEM version** — The `<uber-jar.version>` in the parent POM should be updated to match the exact AEM target version. Mismatched versions cause compilation errors or runtime failures due to missing or changed APIs [7].

**Oak indexes are mutable but must deploy as code** — Although `/oak:index` is a mutable path, indexes must be deployed via code packages before mutable content packages. Cloud Manager requires full reindexing before switching code images. Deploying Oak indexes in `ui.content` is incorrect [3].

**`precompiledScripts` only works with `aemVersion=cloud`** — Attempting to enable server-side script precompilation for an AEM 6.5 target has no effect. This feature is Cloud Service-specific [8].

## Sources

[1] **AEM Project Archetype Overview - Adobe Experience League**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-core-components/using/developing/archetype/overview
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Core purpose, overview of what the archetype generates, Edge Delivery Services note, recommendation to use latest version.

[2] **adobe/aem-project-archetype - GitHub**
    URL: https://github.com/adobe/aem-project-archetype
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Latest version (v56), system requirements, full parameter table, known limitations (Windows, Eclipse, interactive mode), Maven generation command.

[3] **AEM Project Content Package Structure - Adobe Experience League**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/developing/aem-project-content-package-structure
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Immutable vs mutable areas, package types (application/content/container), Cloud Manager deployment rules, Oak index special case, embedding path structure, dependency ordering.

[4] **ui.apps.structure doesn't have a CloudManager by-pass defined - GitHub Issue**
    URL: https://github.com/adobe/aem-project-archetype/issues/635
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: Confirmation that `ui.apps.structure` must have `cloudManagerTarget=none` and the consequences of omitting it.

[5] **Content Package Type Validation Forces Rethink - Bounteous**
    URL: https://www.bounteous.com/insights/2021/06/17/content-package-type-validation-forces-rethink-standard-project-structure-adobe/
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: OSGi bundles not belonging in `ui.apps`, filter root gotchas, `mode=merge` issues, `cloudManagerTarget=none` importance.

[6] **Using the AEM Project Archetype - Adobe Experience League**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-core-components/using/developing/archetype/using
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Module table with responsibilities, `ui.config` separation rationale, Uber-JAR best practice, three testing levels, production cleanup recommendation.

[7] **Get started with AEM Sites - Project Setup - Adobe Experience League**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-learn/getting-started-wknd-tutorial-develop/project-archetype/project-setup
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Parent POM role, `autoInstallPackage` profile, Maven build and deploy commands, global property overrides, production cleanup of example content.

[8] **AEM Project Archetype Parameters - Community and GitHub**
    URL: https://github.com/adobe/aem-project-archetype
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: `aemVersion` cloud vs 6.5 differences (Core Components OOTB), `frontendModule` options (general/react/angular/decoupled), `precompiledScripts` cloud-only, old `archetypeGroupId` gotcha, `includeDispatcherConfig` behavior.
