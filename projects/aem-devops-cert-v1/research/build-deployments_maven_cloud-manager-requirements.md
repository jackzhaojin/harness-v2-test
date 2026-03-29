# Cloud Manager Maven Requirements

**Topic ID:** build-deployments.maven.cloud-manager-requirements
**Researched:** 2026-03-29T00:00:00Z

## Overview

Adobe Cloud Manager builds AEM projects using Apache Maven in an isolated, stateless Linux (Ubuntu 22.04) build environment [1]. Every build runs in a clean container with no state carried between executions, which means all dependencies must be properly declared in `pom.xml` and fetched at build time [1]. The build environment ships with Apache Maven 3.9.4, multiple JDK versions (8, 11, 17, 21), and Node.js 18 for front-end pipelines [1][2].

Understanding Cloud Manager's Maven requirements is critical for AEM DevOps engineers because misconfigurations are a common cause of build failures. Key areas include: the correct JDK selection mechanism (using `.cloudmanager/java-version` rather than Maven Toolchains), specifying `cloudManagerTarget` in content package plugins to control what gets deployed, configuring `CM_BUILD`-gated Maven profiles for environment-specific behavior, and using the `frontend-maven-plugin` to pin the Node.js version used for `ui.frontend` builds [1][2][3][4].

Cloud Manager has evolved significantly — Maven Toolchains support was removed in 2025.06.0, Java 17/21 became the preferred build targets in 2025, and Maven moved to HTTPS-only artifact repositories as of 2023.10.0 [1][2]. Exam questions frequently test awareness of these breaking changes.

## Key Concepts

- **`pom.xml` at Git root** — Cloud Manager requires a `pom.xml` file at the root of the Git repository branch used by the pipeline. Sub-modules and nested modules are supported [3].
- **Deployable package discovery** — Cloud Manager scans for `.zip` content package files in `target` directories of any sub-module. No explicit listing is required; all packages found are candidates for deployment unless excluded [3][4].
- **`cloudManagerTarget` property** — To skip deployment of a content package (e.g., test-only packages or sub-packages repackaged by the `all` container), set `cloudManagerTarget=none` in the package plugin's `<properties>` block [4]. Only the container (`all`) package should deploy; all others should carry this setting.
- **`.cloudmanager/java-version` file** — The mechanism to select which JDK (11, 17, or 21) Maven runs with. A plain text file in the Git repo containing only the version number. Maven Toolchains no longer work and will cause build failure [1][2].
- **`CM_BUILD` environment variable** — Always set to `true` inside Cloud Manager builds. Used to activate Maven profiles conditionally — use `env.CM_BUILD` to activate Cloud Manager-specific behavior and `!env.CM_BUILD` to activate local/developer-only behavior [1][3].
- **`frontend-maven-plugin`** — The `com.github.eirslett` plugin used to install and run Node.js/npm within Maven builds. Node.js version is pinned in `pom.xml` via `<nodeVersion>` and `<npmVersion>` tags inside the plugin's `<configuration>` [2].
- **HTTPS-only Maven repositories** — As of Maven 3.8.1 (shipped in Cloud Manager 2023.10.0+), `http://` mirrors are blocked by default. All artifact repositories in `pom.xml` or `settings.xml` must use `https://` [1][2].
- **`adobe-public` Maven profile** — Automatically included via Cloud Manager's system-level `settings.xml`. Provides access to the public Adobe artifact repository. No explicit configuration needed in project `pom.xml` [1][2].
- **Build artifact reuse** — Cloud Manager reuses build artifacts across pipelines within the same program when the same Git commit is detected. Set the `CM_DISABLE_BUILD_REUSE` pipeline variable to `true` to force a rebuild [3].
- **`cloudManagerOriginalVersion` property** — The original `pom.xml` version is always available as this Maven property, even after Cloud Manager modifies the version for staging/production deploys [5].

## Technical Details

### JDK Selection via `.cloudmanager/java-version`

Create a plain-text file at `.cloudmanager/java-version` in the Git repository branch. The file must contain only the version number with no other content:

```
21
```

Accepted values: `21` (preferred), `17`, `11`. The value `8` is accepted in Cloud Manager Classic but is no longer supported for AEM Cloud Service [1][2].

When Java 17 or 21 is selected, the runtime deployed to AEM also runs Java 21 [1]. Update these Maven plugins to minimum versions for Java 17/21 compatibility [1]:

| Plugin | Minimum Version |
|--------|----------------|
| `bnd-maven-plugin` | 6.4.0 |
| `aemanalyser-maven-plugin` | 1.6.16 |
| `maven-bundle-plugin` | 5.1.5 |
| `org.ow2.asm` | 9.5 |
| Groovy packages | 4.0.22 |
| Aries SPIFly | 1.3.6 |

### Maven Toolchains — Removed in 2025.06.0

Any `maven-toolchains-plugin` configuration in `pom.xml` will cause the pipeline to fail with:

```
Cannot find matching toolchain definitions
```

Remove `org.apache.maven.plugins:maven-toolchains-plugin` entries and any committed `toolchains.xml` files. Switch to `.cloudmanager/java-version` for JDK selection [1][2].

### Content Package Deployment Control

To prevent a sub-package from being deployed independently (only the `all` container should deploy):

```xml
<!-- Using filevault-package-maven-plugin -->
<plugin>
  <groupId>org.apache.jackrabbit</groupId>
  <artifactId>filevault-package-maven-plugin</artifactId>
  <extensions>true</extensions>
  <configuration>
    <properties>
      <cloudManagerTarget>none</cloudManagerTarget>
    </properties>
  </configuration>
</plugin>

<!-- Using content-package-maven-plugin -->
<plugin>
  <groupId>com.day.jcr.vault</groupId>
  <artifactId>content-package-maven-plugin</artifactId>
  <extensions>true</extensions>
  <configuration>
    <properties>
      <cloudManagerTarget>none</cloudManagerTarget>
    </properties>
  </configuration>
</plugin>
```

[4]

### Node.js Configuration via `frontend-maven-plugin`

In the `ui.frontend` module's `pom.xml` (or in the reactor `pom.xml`), declare the `frontend-maven-plugin` with pinned Node.js and npm versions [2]:

```xml
<plugin>
  <groupId>com.github.eirslett</groupId>
  <artifactId>frontend-maven-plugin</artifactId>
  <version>1.11.3</version>
  <configuration>
    <nodeVersion>v18.18.2</nodeVersion>
    <npmVersion>9.8.1</npmVersion>
    <installDirectory>${project.basedir}/.generator</installDirectory>
  </configuration>
</plugin>
```

The plugin downloads and installs the specified Node.js version into the project directory at build time. Cloud Manager's build environment provides Node.js 18 natively for front-end pipelines; keep the `nodeVersion` in sync with this [1][2].

### CM_BUILD Profile Activation Pattern

```xml
<profile>
  <id>cloud-manager-only</id>
  <activation>
    <property>
      <name>env.CM_BUILD</name>
    </property>
  </activation>
  <!-- Cloud Manager-specific configuration -->
</profile>

<profile>
  <id>local-dev-only</id>
  <activation>
    <property>
      <name>!env.CM_BUILD</name>
    </property>
  </activation>
  <!-- Local developer-only configuration -->
</profile>
```

[1][3]

### Password-Protected Repositories

Credentials are stored as pipeline secret variables and referenced in `.cloudmanager/maven/settings.xml` (not committed `settings.xml`) [3]:

```xml
<server>
  <id>my-private-repo</id>
  <username>${env.REPO_USERNAME}</username>
  <password>${env.REPO_PASSWORD}</password>
</server>
```

Server IDs beginning with `adobe` or `cloud-manager` are reserved and must not be used for custom repositories [3].

### Maven Version Requirements

The standard Cloud Manager build invokes Maven with three commands in sequence [1][2]:

1. `mvn --batch-mode org.apache.maven.plugins:maven-dependency-plugin:3.1.2:resolve-plugins`
2. `mvn --batch-mode org.apache.maven.plugins:maven-clean-plugin:3.1.0:clean -Dmaven.clean.failOnError=false`
3. `mvn --batch-mode org.jacoco:jacoco-maven-plugin:prepare-agent package`

### Project Version Format for Staging/Production

For Cloud Manager to merge the generated version into the project version (rather than overwriting it), the top-level `pom.xml` `<version>` element must satisfy all three conditions [5]:

1. Exactly three segments (e.g., `1.0.0`)
2. Not a SNAPSHOT version
3. Statically set (not computed)

Example: original `1.0.0` + generated `2024.926.121356.0000020490` → `1.0.0.2024_0926_121356_0000020490`

## Common Patterns

**AEM Project Archetype structure**: The standard AEM Maven project has a reactor `pom.xml` at root with sub-modules: `core` (Java bundles), `ui.apps`, `ui.content`, `ui.config`, `ui.frontend` (Node.js), and `all` (container). The `all` package is the only one that should deploy to Cloud Manager — all others use `cloudManagerTarget=none` [4].

**Environment-variable-gated Node.js build**: Some teams put the `ui.frontend` build inside a Maven profile gated on `env.CM_BUILD` so that local Maven builds skip the Node.js compilation step (which requires Node.js installed locally). This speeds up local development iterations [1][3].

**Keeping local and Cloud Manager Node.js versions in sync**: Pin the `<nodeVersion>` in `frontend-maven-plugin` to match Node.js 18.x (the version Cloud Manager provides natively). This prevents build environment mismatches [1][2].

**Custom build environment tooling**: Additional system packages (e.g., `imagemagick`, `graphicsmagick`) are available in the build container. If custom tools are needed, install them via `apt-get` within a Maven profile that runs a shell execution plugin [1].

**Pipeline variable injection**: Sensitive values (API keys, repository credentials) are injected as pipeline variables and referenced in `pom.xml` as `${env.VARIABLE_NAME}`. Regular variables are available as environment variables; encrypted secrets are available only during the build phase and not in test phases [1][3].

## Gotchas

- **Maven Toolchains removed** — As of Cloud Manager 2025.06.0, any `maven-toolchains-plugin` in `pom.xml` causes an immediate build failure. This is a breaking change that affects projects migrating from older Cloud Manager setups [1][2].

- **`requireJavaVersion` in `maven-enforcer-plugin`** — Cloud Manager uses a different JDK to run the Maven process versus the JDK used to compile code. This causes `RequireJavaVersion` rules in `maven-enforcer-plugin` to fire warnings or failures. The fix is to remove `requireJavaVersion` from enforcer configurations, or to set the JDK version globally via `.cloudmanager/java-version` [2][4].

- **HTTP repositories blocked** — Any `pom.xml` or `settings.xml` repository URL using `http://` will fail since Maven 3.8.1 (Cloud Manager 2023.10.0+). Must use `https://` [1][2].

- **Default JDK is still JDK 8** — Without a `.cloudmanager/java-version` file, Cloud Manager Classic defaults to JDK 8. For AEM Cloud Service, this must be explicitly overridden. Not setting the file means compiling against an unsupported JDK for modern AEM [1][2].

- **Deploying only the `all` package** — A common mistake is forgetting to set `cloudManagerTarget=none` on sub-packages. This causes multiple packages to deploy independently, potentially in the wrong order (package deployment order is not guaranteed) [3][4].

- **SNAPSHOT versions get overwritten** — If the top-level `pom.xml` has a `-SNAPSHOT` version, Cloud Manager's generated version overwrites it entirely rather than merging. The merged format (which preserves the original version) requires exactly three segments, no SNAPSHOT suffix, and a static value [5].

- **Java 21 runtime impact** — When `.cloudmanager/java-version` is set to `17` or `21`, the AEM runtime also runs Java 21. This can cause issues with `MaxPermSize` JVM flags (which were removed in Java 8+) and some translation features (XLIFF, Hebrew/Indonesian/Yiddish I18n) [1].

- **Network-protected artifact repositories not supported** — Repositories requiring VPN or IP allowlisting cannot be reached from the Cloud Manager build container. Only password-protected repositories (accessed via credentials) are supported [3].

- **`CM_DISABLE_BUILD_REUSE` for pipeline debugging** — By default, Cloud Manager reuses build artifacts when the same commit is built again across pipelines. If a pipeline is producing stale artifacts, set `CM_DISABLE_BUILD_REUSE=true` as a pipeline variable [3].

- **SonarQube version tied to JDK selection** — Java 17/21 builds use SonarQube 9.9 automatically. Java 8/11 builds use an older SonarQube. Introduced in Cloud Manager 2025.1.0 [1].

## Sources

[1] **Build Environment of Cloud Manager (AEM as a Cloud Service)**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/using-cloud-manager/create-application-project/build-environment-details
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: JDK version selection via `.cloudmanager/java-version`, Maven version (3.9.4), standard build commands, Node.js 18 availability, environment variables (CM_BUILD, BRANCH, CM_PIPELINE_ID), plugin version requirements for Java 17/21, Maven Toolchains removal, SonarQube version tie-in, MaxPermSize gotcha.

[2] **The Build Environment (Cloud Manager Classic / AMS)**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-manager/content/getting-started/project-creation/build-environment
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Maven 3.9.4, JDK options (8, 11, 17, 21) for Cloud Manager Classic, `.cloudmanager/java-version` mechanism, Maven Toolchains removal (2025.06.0), HTTPS-only repository enforcement, Node.js 18 for front-end pipelines, maven-enforcer requireJavaVersion issue, frontend-maven-plugin Node.js version pinning.

[3] **Project Setup — Cloud Manager (AEM as a Cloud Service)**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/using-cloud-manager/create-application-project/setting-up-project
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: pom.xml at Git root requirement, content package discovery via `target/*.zip`, CM_BUILD profile activation, password-protected repository configuration via `.cloudmanager/maven/settings.xml`, reserved server ID prefixes, CM_DISABLE_BUILD_REUSE variable, network-protected repositories unsupported.

[4] **Set Up Your Project — Cloud Manager Classic**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-manager/content/getting-started/project-creation/project-setup
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: `cloudManagerTarget=none` pattern for content-package-maven-plugin and filevault-package-maven-plugin, maven-enforcer-plugin requireJavaVersion warning, content package deployment ordering not guaranteed.

[5] **Maven Project Version Handling (AEM as a Cloud Service)**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/using-cloud-manager/managing-code/project-version-handling
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: Three-segment version format requirement for version merging, SNAPSHOT version overwrite behavior, `cloudManagerOriginalVersion` Maven property, version merge output format.
