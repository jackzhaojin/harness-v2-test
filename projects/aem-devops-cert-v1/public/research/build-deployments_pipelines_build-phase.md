# Build Phase Analysis

**Topic ID:** build-deployments.pipelines.build-phase
**Researched:** 2026-03-29T00:00:00Z

## Overview

The Cloud Manager build phase is the foundational step in the AEM CI/CD pipeline where source code from a configured Git branch is compiled, unit-tested, and packaged before being combined with an AEM release image. Cloud Manager executes `mvn clean package` against the root `pom.xml` of the repository, requiring the project to follow Apache Maven conventions [1]. Understanding what happens at each sub-step — Build & Unit Testing, Code Scanning, and Build Images — is critical both for real-world troubleshooting and for certification exam scenarios.

The build phase runs in an isolated, ephemeral Linux container (Ubuntu 22.04) with Apache Maven 3.9.4 installed, and by default uses Oracle JDK 8 unless explicitly overridden [3]. Most common build failures are reproducible locally; the exceptions are failures related to unreachable private Maven repositories or Cloud Manager-specific runtime conditions [1]. Adobe Cloud Manager's build pipeline is idempotent in terms of artifact reuse: if a prior pipeline run used the same Git commit hash, build and code quality steps may be skipped entirely and the prior artifacts reused [2].

Build optimization is an active area of development for Cloud Manager. A new "Smart Build" feature compiles only changed modules using module-level caching, significantly reducing build times for large repositories [4]. The combination of artifact reuse, Smart Build, and proper Java version configuration (Java 21 recommended) gives teams the primary levers for build performance improvement.

## Key Concepts

- **Build & Unit Testing Step** — The step where Maven runs `mvn clean package`, compiling source code and executing unit tests. This is the only step whose logs can be tailed in real time via the Adobe IO CLI [5]. Errors here are almost always reproducible locally.
- **Code Scanning Step** — Static analysis using Java and AEM-specific SonarQube rules. Critical security violations cause immediate pipeline termination and cannot be overridden. Non-critical (Important and Info level) failures can be overridden by users with Deployment Manager, Project Manager, or Business Owner roles [6].
- **Build Images Step** — Combines the build artifacts with the AEM release to produce a deployable container image. Failures here (repoinit issues, duplicate OSGi configs, Core Components version mismatches) are distinct from compile errors and require different troubleshooting [1].
- **Build Artifact Reuse** — When the same Git commit hash is detected across pipeline executions within the same program, Cloud Manager skips build and code quality steps and reuses artifacts from the prior run — even across different branches [2]. The variable `CM_DISABLE_BUILD_REUSE=true` disables this behavior while still storing new artifacts.
- **`.cloudmanager/java-version` file** — A file committed to the Git repository specifying which Oracle JDK (11, 17, or 21) Cloud Manager should use. Accepted values are `11`, `17`, or `21`. Java 8 is no longer supported for AEM Cloud Service projects. Maven Toolchains were removed as of Cloud Manager 2025.06.0 [3].
- **`CM_BUILD` environment variable** — Always set to `true` inside Cloud Manager build containers, enabling Maven profiles to conditionally enable/disable behavior when running in CI versus on a developer workstation [2].
- **Smart Build (module-level caching)** — A new build strategy (configurable per pipeline) that only recompiles changed modules rather than the entire repository. Applies to full-stack, code-quality, and stage-only pipelines [4].
- **Quality Gate Tiers** — Three tiers: Critical (immediate failure, no override), Important (pause with override option for authorized roles), and Info (non-blocking) [6].

## Technical Details

### Build Environment

The Cloud Manager build environment specifications [3]:

| Component | Value |
|---|---|
| OS | Ubuntu 22.04 (Linux) |
| Maven | Apache Maven 3.9.4 |
| Default JDK | Oracle JDK 8u401 (deprecated for AEM Cloud) |
| Available JDKs | 8u401, 11.0.22, 17.0.10, 21.0.4 |
| Recommended JDK | Java 21 (preferred), 17, or 11 |
| Pre-installed tools | bzip2, unzip, libpng, imagemagick, graphicsmagick |

### Exact Maven Execution Commands

Cloud Manager runs these three commands in sequence during the Build & Unit Testing step [3]:

```bash
mvn --batch-mode org.apache.maven.plugins:maven-dependency-plugin:3.1.2:resolve-plugins
mvn --batch-mode org.apache.maven.plugins:maven-clean-plugin:3.1.0:clean
mvn --batch-mode org.jacoco:jacoco-maven-plugin:prepare-agent package
```

The JaCoCo agent is injected automatically (third command) to capture code coverage data. This data feeds the coverage metric in the Code Scanning step. This is important to know when diagnosing why coverage reports are present even when no explicit JaCoCo config exists in the project POM.

### Setting Java Version

Create a file at `.cloudmanager/java-version` in your Git repository branch containing only the version number. No other text should appear in the file [3]:

```
21
```

This overrides the default JDK 8 and sets `JAVA_HOME` accordingly. Note: Maven Toolchains (`maven-toolchains-plugin` and `toolchains.xml`) were removed in Cloud Manager 2025.06.0 and will now cause pipelines to fail with `Cannot find matching toolchain definitions` [3].

### Maven Profile for Cloud Manager Detection

Use the `CM_BUILD` variable to activate profiles only within Cloud Manager builds [2]:

```xml
<!-- Active ONLY in Cloud Manager -->
<profile>
  <activation>
    <property>
      <name>env.CM_BUILD</name>
    </property>
  </activation>
  <!-- Cloud Manager-specific config -->
</profile>

<!-- Active ONLY on local developer workstation -->
<profile>
  <activation>
    <property>
      <name>!env.CM_BUILD</name>
    </property>
  </activation>
  <!-- Local dev config -->
</profile>
```

### Password-Protected Maven Repositories

Store credentials as secret pipeline variables and reference them in `.cloudmanager/maven/settings.xml` within the Git repository [2]:

```xml
<settings>
  <servers>
    <server>
      <id>my-private-repo</id>
      <username>${env.REPO_USER}</username>
      <password>${env.REPO_PASSWORD}</password>
    </server>
  </servers>
</settings>
```

Server IDs beginning with `adobe` or `cloud-manager` are reserved and must not be used [2].

### Code Quality Gate Thresholds

Critical thresholds (immediate failure, cannot be overridden) [6]:

- Security Rating: must be B or better
- Page Request Error Rate: must be less than 2%
- CPU Utilization: must be less than 80%
- Disk I/O Wait Time: must be less than 50%

Non-critical (Important) thresholds — can be overridden by Deployment Manager, Project Manager, or Business Owner [6]:

- Reliability Rating: C or better
- Maintainability Rating: A (<=5% remediation cost ratio)
- Code Coverage: greater than 50%
- 95th Percentile Response Time: must meet defined program KPI

### Pipeline Variables Relevant to Build Phase

| Variable | Effect |
|---|---|
| `CM_BUILD` | Always `true` in Cloud Manager; use to activate Maven profiles |
| `CM_DISABLE_BUILD_REUSE` | Set to `true` to prevent reusing prior artifacts; artifacts still stored |
| `BRANCH` | Git branch name being built |
| `CM_PIPELINE_ID` | ID of the currently executing pipeline |

### Plugin Minimum Versions for Java 17/21

Required plugin upgrades when moving to Java 17 or 21 [3]:

| Plugin | Minimum Version |
|--------|----------------|
| `bnd-maven-plugin` | 6.4.0 |
| `aemanalyser-maven-plugin` | 1.6.16 |
| `maven-bundle-plugin` | 5.1.5 |

Runtime library minimums also required: ASM >= 9.5, Groovy >= 4.0.22, Aries SPIFly >= 1.3.6 [3].

## Common Patterns

**Troubleshooting a Maven Build Failure** — When a build fails in the Build & Unit Testing step, the first action is to reproduce the failure locally using `mvn clean package`. If it fails locally, fix it there. If it only fails in Cloud Manager, check: (1) private repository reachability from Cloud Manager's network, (2) authentication credentials for password-protected repos, (3) whether any Maven plugin is unsupported in Cloud Manager's environment [1].

**Investigating Build Images Step Failures** — Unlike compile errors, Build Images failures appear after code has compiled. Download the build image log from Cloud Manager. Common causes: (1) duplicate OSGi configurations across embedded packages (look for packages lacking `<cloudManagerTarget>none</cloudManagerTarget>` in their pom.xml), (2) malformed repoinit scripts — validate them locally in the AEM SDK, (3) Core Components version mismatch between what the code deploys and what exists in the non-production environment [1].

**Reading Build Logs via Adobe IO CLI** — Tail build logs in real time using the aio CLI [5]:

```bash
# Install and configure
npm install -g @adobe/aio-cli
aio plugins:install @adobe/aio-cli-plugin-cloudmanager

# List pipelines and start
aio cloudmanager:program:list-pipelines
aio cloudmanager:pipeline:create-execution [PIPELINE_ID]

# Tail the Build & Unit Testing log
aio cloudmanager:execution:tail-step-log [PIPELINE_ID]
```

Note: Only the Build & Unit Testing step can be tailed. Code quality and deployment step logs are not accessible via tail [5].

**Handling Code Scanning Failures** — Download the CSV report from Cloud Manager using the "Download Details" button. Critical (Security Rating) failures must be fixed — they cannot be overridden regardless of role. Important-level failures (Reliability, Maintainability, Coverage) can be bypassed by authorized roles through the Cloud Manager UI. Info-level items like skipped tests and duplicate lines are non-blocking [6].

**Optimizing Build Times** — Three approaches in order of effectiveness: (1) Enable Smart Build mode on the pipeline to compile only changed modules, (2) rely on build artifact reuse across pipelines using the same commit (automatic, no config needed), (3) upgrade to Java 21 for JVM performance improvements [3][4].

**Diagnosing ui.frontend Build Failures from Stale Cache** — When the `ui.frontend` module fails in Cloud Manager but succeeds locally, suspect stale cached artifacts [7]:
1. Set pipeline variable `CM_DISABLE_BUILD_REUSE=true` to force a clean build.
2. Add Maven lifecycle steps to delete `ui.frontend/dist`, `ui.frontend/target`, and `ui.frontend/node_modules/.cache` before the main build.
3. Upgrade `frontend-maven-plugin` from 1.12.0 to 1.15.0 or higher.
4. Pin Node and NPM versions explicitly in the plugin configuration.
5. Generate and commit `package-lock.json` by running `npm install` locally [8].

## Gotchas

- **Maven Toolchains removed in 2025.06.0** — If your project uses `maven-toolchains-plugin` or a committed `toolchains.xml`, it will fail with `Cannot find matching toolchain definitions` after Cloud Manager 2025.06.0. Migrate to `.cloudmanager/java-version` immediately [3].

- **Artifact reuse ignores pipeline variables** — When Cloud Manager detects the same commit hash, it reuses artifacts regardless of any pipeline variable changes EXCEPT `CM_DISABLE_BUILD_REUSE`. If you change pipeline variables (e.g., feature flags or environment-specific settings) without changing code, your build will still reuse old artifacts unless you explicitly disable reuse [2].

- **Artifact reuse is cross-branch** — Reuse happens across branches within the same program. A commit built on branch `feature-x` can have its artifacts reused by a production pipeline on `main` if they share the same commit hash. This is by design but can catch teams off guard [2].

- **Code quality pipeline overrides work differently** — In a code-quality-only pipeline, Important-level failures cannot be overridden because the code quality step is the final step. In a full-stack pipeline, Important failures can be overridden because additional steps follow. This distinction is commonly tested [6].

- **Only Build & Unit Testing can be tailed** — Despite deployments taking 45+ minutes, you cannot tail the code quality step, deployment step, or functional test step via CLI. These logs are available for download after completion but not in real time [5].

- **`system` scope in Maven is not supported** — Using `<scope>system</scope>` and `<systemPath>` in your POM to reference local JARs is not supported in Cloud Manager. Third-party JARs must be in a registered Maven repository or committed as a local file-system Maven repository to SCM [1].

- **Java 21 upgrade requires plugin updates** — Upgrading to Java 21 requires updating: `bnd-maven-plugin` to 6.4.0+, `aemanalyser-maven-plugin` to 1.6.16+, `maven-bundle-plugin` to 5.1.5+, and removing `maven-scr-plugin` (not compatible with Java 17/21). Also: `maven-enforcer-plugin`'s `requireJavaVersion` rule will fail because Cloud Manager runs Maven with one JDK but may compile with another — remove this check from your POM [3].

- **HTTPS required for Maven repositories** — Maven 3.8.1+ (used by Cloud Manager) blocks HTTP repository connections. All Maven repository URLs in `pom.xml` must use HTTPS [3].

- **Build Images step vs Build & Unit Testing step** — Repoinit script errors and OSGi config conflicts appear in Build Images logs, not in the Maven build log. Developers sometimes look at the wrong log when these failures occur [1].

- **JaCoCo is automatically injected — do not add it again** — Cloud Manager injects the JaCoCo agent via its own Maven command. Adding JaCoCo explicitly to your POM can cause duplicate agent configuration and coverage reporting conflicts. The coverage is automatically captured without any POM changes.

- **Unpinned Node/NPM causes non-deterministic failures** — If `frontend-maven-plugin` does not pin Node and NPM versions and `package-lock.json` is not committed, environment updates can silently break builds that previously succeeded. The symptom is `SyntaxError: Unexpected token` in frontend dependency code [8].

- **Network-protected Maven repositories are not supported** — Cloud Manager can use password-protected repos via `settings.xml` but cannot reach repos protected by IP allowlists or VPN. Projects using private Nexus/Artifactory behind firewalls will fail with dependency resolution errors that appear as Cloud Manager-specific failures [2].

## Sources

[1] **Debugging AEM as a Cloud Service – Build and Deployment**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-learn/cloud-service/debugging/debugging-aem-as-a-cloud-service/build-and-deployment
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Build & Unit Testing step behavior, Code Scanning step, Build Images step failure scenarios (duplicate OSGi configs, repoinit issues, Core Components version mismatch, /var content packages), deploy-to failures.

[2] **Project Setup – Cloud Manager | Adobe Experience Manager**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/using-cloud-manager/create-application-project/setting-up-project
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Build artifact reuse mechanics and cross-branch behavior, `CM_DISABLE_BUILD_REUSE` variable, `CM_BUILD` environment variable, Maven profile activation, password-protected repository configuration, cloudManagerTarget settings.

[3] **Build Environment of Cloud Manager | Adobe Experience Manager**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/using-cloud-manager/create-application-project/build-environment-details
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: OS and JDK versions, Maven version, exact Maven commands Cloud Manager runs, pre-installed tools list, `.cloudmanager/java-version` file usage, Maven Toolchains deprecation (2025.06.0), required plugin version updates for Java 21, HTTPS repository requirement, SonarQube 9.9 compatibility with Java 17/21.

[4] **Faster AEM Cloud Builds: How Module Caching Changes the Game**
    URL: https://www.aemtutorial.info/2025/11/faster-aem-cloud-builds-how-module.html
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: Smart Build feature description, Full Build vs Smart Build pipeline configuration options, module-level caching behavior, applicable pipeline types.

[5] **How to Tail & View Cloud Manager Build Logs for AEM as a Cloud Service and AMS**
    URL: https://blog.arborydigital.com/en/blog/tailing-logs-aem-cloud-service-with-adobe-io
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: Adobe IO CLI setup, log tailing commands, limitation that only Build & Unit Testing step can be tailed in real time, list of CLI commands for pipeline management.

[6] **Code Quality Testing | Adobe Experience Manager Cloud Manager**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-manager/content/using/code-quality-testing
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Three-tiered quality gate structure (Critical/Important/Info), specific metric thresholds for critical vs non-critical failures, override rules, distinction between code-quality-only pipeline overrides vs full-stack pipeline overrides.

[7] **Pipeline Build Fails Due to Stale Cache and Outdated frontend-maven-plugin in AEMaaCS**
    URL: https://experienceleague.adobe.com/en/docs/experience-cloud-kcs/kbarticles/ka-27902
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: Root cause of stale cache reuse with ui.frontend module, frontend-maven-plugin version 1.12.0 vs. 1.15.0+ requirement, CM_DISABLE_BUILD_REUSE resolution, specific cache directories to clean (dist, target, node_modules/.cache), SCSS reference errors from reverted files.

[8] **Pipeline Build Fails from Unpinned Node/NPM and Missing package-lock.json in AEM Cloud Manager**
    URL: https://experienceleague.adobe.com/en/docs/experience-cloud-kcs/kbarticles/ka-27922
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: Symptoms of unpinned Node/NPM (SyntaxError: Unexpected token), resolution steps (pin versions in frontend-maven-plugin, generate and commit package-lock.json), non-deterministic failure pattern triggered by environment updates.
