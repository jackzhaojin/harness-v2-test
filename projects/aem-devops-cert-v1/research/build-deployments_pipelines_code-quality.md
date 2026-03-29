# Code Quality Gates

**Topic ID:** build-deployments.pipelines.code-quality
**Researched:** 2026-03-29T00:00:00Z

## Overview

Code quality gates in AEM Cloud Manager act as automated checkpoints that enforce quality standards before code advances through a pipeline. They are not optional — failing a critical quality gate immediately stops deployment, and failing an important one pauses the pipeline until an authorized person makes a deliberate decision to override or abort. This makes code quality gates one of the most operationally significant parts of the AEM CI/CD pipeline [1].

The quality enforcement system combines three tools: **SonarQube** for static code analysis of Java source, **OakPAL** for content package structure validation, and the **Dispatcher Optimization Tool (DOT)** for dispatcher configuration checks [1][2]. Together these tools apply more than 100 rules, including generic Java standards and AEM-specific rules based on engineering best practices [1][2]. As of February 13, 2025, the SonarQube engine was upgraded to version 9.9.5 as part of Cloud Manager 2025.2.0 — a change that impacted existing quality gates and potentially blocked deployments for teams that had not prepared [3].

Understanding when a gate fails vs. pauses, what can be overridden and by whom, and which specific rules drive critical failures is essential for exam scenarios that present DevOps troubleshooting situations.

## Key Concepts

- **Three-tiered gate system** — Every quality check result falls into one of three categories: **Critical** (immediate pipeline failure, no override), **Important** (pipeline pauses, override permitted by deployment/project manager/business owner), or **Info** (informational, no pipeline impact) [1][4].

- **Code quality-only pipeline restriction** — In a pipeline where code quality is the *final* step (not followed by deployment), **Important failures cannot be overridden** [1]. This is a critical exam distinction from a full CI/CD pipeline where Important issues can be bypassed.

- **SonarQube** — Static analysis engine embedded in Cloud Manager, currently version 9.9. Checks security vulnerabilities, reliability, maintainability, coverage, and duplication. As of 2025.2.0, rule updates may trigger new failures in previously-passing pipelines [3].

- **OakPAL** — Content package validation framework that simulates content installation against a standalone Oak repository. Catches structural problems like deploying indexes in wrong packages, modifying `/libs`, or duplicate OSGi configurations [2].

- **Dispatcher Optimization Tool (DOT)** — Validates dispatcher configuration syntax and enforces cache best practices such as `statfileslevel >= 2` and `serveStaleOnError` enabled [2].

- **Security Rating threshold** — Security Rating below **B** is a **Critical** failure. Ratings are A (no vulnerabilities) through E (blocker vulnerability) [1][4].

- **Coverage threshold** — Unit test coverage below **50%** triggers an **Important** issue — not a Critical one [1].

- **False positive suppression** — Developers can annotate Java code with `@SuppressWarnings("squid:<ruleId>")` to suppress a specific SonarQube rule finding [1].

- **Pipeline failure behavior configuration** — For production pipelines, the Deployment Manager can set behavior to: "Ask every time" (default), "Fail Immediately", or "Continue Immediately" for Important failures [4].

- **PR Validation** — Cloud Manager supports pull request validation against quality thresholds before merging, available for Bitbucket and GitLab [1].

## Technical Details

### Quality Gate Metric Thresholds

The following thresholds apply to the Code Quality gate in Cloud Manager [1][4]:

| Metric | Failure Threshold | Severity |
|---|---|---|
| Security Rating | < B (any minor vulnerability) | Critical |
| Reliability Rating | < C (major bug present) | Important |
| Maintainability Rating | < A (>5% technical debt ratio) | Important |
| Coverage | < 50% | Important |
| Skipped Unit Tests | > 1 | Info |
| Open Issues | > 0 | Info |
| Duplicated Lines | > 1% | Info |
| Cloud Service Compatibility | > 0 issues | Info |

The Security Rating scale follows SonarQube conventions [1]:
- **A** = No vulnerabilities
- **B** = At least 1 minor vulnerability
- **C** = At least 1 major vulnerability
- **D** = At least 1 critical vulnerability
- **E** = At least 1 blocker vulnerability

### SonarQube Custom AEM Rules (Key Examples)

These AEM-specific rules are enforced on top of standard Java rules [2]:

**Security and Resource Management:**
- `ResourceResolver` must be closed via `close()` or try-with-resources — failing this causes memory leaks in clustered environments
- Dangerous thread methods (`Thread.stop()`, `Thread.interrupt()`) must be replaced with flag-based controls
- HTTP requests must define socket and connect timeouts (max 60 seconds recommended)
- Hardcoded `/apps` and `/libs` paths should use relative Sling search paths
- Hardcoded credentials flagged (rule `squid:S2068`)

**Logging Rules:**
- Exceptions should be logged OR thrown — never both (avoids duplicate log entries)
- GET/HEAD handlers must log at DEBUG/TRACE level, not INFO
- Never use `Exception.getMessage()` as the primary log parameter — pass the full exception object
- Stack traces must go through SLF4J — never `printStackTrace()`
- Catch blocks must log at WARN or ERROR level minimum

**Architecture Rules:**
- Servlet registration must use resource types, not hardcoded paths
- Sling Scheduler should be replaced with Sling Jobs (guaranteed execution)
- Deprecated AEM APIs annotated with `@Deprecated` must not be used

### OakPAL Critical Rules (August 2024+ Breaking Changes)

These OakPAL rules were enforced starting the Cloud Manager August 2024 release and cause pipeline failures [2]:

- **Search index in UI Content package** — `oak:QueryIndexDefinition` nodes cannot be deployed in the UI Content package; they must go in a dedicated package
- **Invalid `damAssetLucene` prefix** — Custom full-text index definitions of type `damAssetLucene` must be prefixed only with `damAssetLucene`
- **Duplicate property names in index definitions** — Index definitions cannot have properties with the same name
- **Implementing `@ProviderType` interfaces** — AEM API interfaces annotated `@ProviderType` are for use only, not implementation by custom code

**Additional OakPAL Rules:**
- No modification of nodes under `/libs` — absolute blocker
- `/config/` and `/install/` folders must contain only OSGi components (security requirement)
- Packages must not overlap content paths
- Classic UI configurations without Touch UI dialog flagged as Cloud Service incompatible
- Static templates and Foundation Components flagged for migration to editable templates and Core Components
- Reverse replication agents are unsupported in Cloud Service

**Index Definition Requirements [2]:**
- Must be direct children of `/oak:index`
- `compatVersion` property must be set to `2`
- All descendant nodes must be `nt:unstructured` type
- Must include an `indexRules` child with descendants
- Names must follow Cloud Service naming conventions
- Only `lucene` index type is supported
- Properties `seed`, `reindex`, `haystack0`, and `async-previous` are prohibited

### False Positive Suppression

The standard approach for suppressing SonarQube false positives in Java [1][2]:

```java
// Suppress a specific rule by rule key (SonarQube 9.x naming)
@SuppressWarnings("squid:S2068")
private static final String PASSWORD_PROPERTY_NAME = "service.password";

// For newer Java-prefixed rule identifiers
@SuppressWarnings("java:S106")
public void printOutput() { ... }

// Inline suppression for all rules on a single line
someStatement(); //NOSONAR
```

Use the rule ID found in the SonarQube finding details or the downloadable Excel rule reference file. Annotate at the narrowest scope possible (method vs. class level).

### Pipeline Failure Behavior Configuration

For production and deployment pipelines, the Deployment Manager can configure the "Important Metric Failures Behavior" setting [4]:

- **Ask every time** (default) — Requires manual intervention for any Important failure
- **Fail Immediately** — Pipeline is canceled automatically on any Important failure
- **Continue Immediately** — Pipeline auto-approves all Important failures and proceeds

This setting does not apply to code-quality-only pipelines, where Important failures are always terminal [1].

### SonarQube 9.9 Upgrade Path

Starting Cloud Manager 2025.2.0 (effective February 13, 2025), the embedded SonarQube was upgraded to 9.9.5.90363 [3]. Adobe provided an early opt-in mechanism before the mandatory upgrade date. Setting the pipeline text variable below enables the new rules for preview:

```
CM_BUILD_IMAGE_OVERRIDE = self-service-build:sonar-99-upgrade-java17or21
```

Adobe recommended creating a separate CI/CD Code Quality pipeline pointing to the same branch as the production pipeline to verify impact before the cutover date. This upgrade also enables Java 17 and Java 21 builds — when the build version is set to Java 17 or 21, the runtime deployed is Java 21 [3].

## Common Patterns

**Code quality-only pipeline for early feedback.** A development team runs a dedicated code-quality pipeline on every feature branch before it merges to main. This prevents quality regressions from reaching the production pipeline. Since Important failures cannot be overridden in a code-quality-only pipeline, this enforces stricter discipline at the branch level [1].

**Production pipeline with "Ask every time" (default).** The deployment manager receives a notification when Important issues arise, reviews them, and decides to override or reject. This is the standard pattern for production pipelines where business context determines whether to proceed despite a non-critical quality issue [4].

**ResourceResolver closure compliance.** Any code that opens a ResourceResolver must close it explicitly. The correct pattern uses try-with-resources [2]:

```java
// Compliant with AEM resource management rules
try (ResourceResolver resolver = resolverFactory.getServiceResourceResolver(params)) {
    // use resolver
}
// resolver automatically closed on block exit, including exceptions
```

Failing to close a ResourceResolver generates a code quality failure that can block deployment.

**Immutable vs. mutable content separation (OakPAL).** Content packages destined for `/apps` or `/libs` (immutable) must not include content from `/content` (mutable) in the same package. Separating these into distinct packages is an OakPAL requirement enforced at the pipeline level [2].

**External SonarQube integration for teams using Jenkins or Azure DevOps.** Teams can run SonarQube independently and gate deployment on quality gate status via webhook or API check [1]:

```bash
# Checking SonarQube quality gate status via API before deployment
SONAR_STATUS=$(curl -s -u "$SONAR_TOKEN:" \
  "$SONAR_URL/api/qualitygates/project_status?projectKey=$PROJECT_KEY" \
  | jq -r '.projectStatus.status')

if [ "$SONAR_STATUS" != "OK" ]; then
  echo "SonarQube quality gate FAILED. Aborting deployment."
  exit 1
fi
```

**PR validation before merge.** Cloud Manager supports configuring a PR validation pipeline against Bitbucket or GitLab branches, enforcing quality thresholds before code can be merged to main [1].

## Gotchas

**Critical vs. Important override confusion.** A common exam trap: only **Important** failures can be overridden — and only in standard production/deployment pipelines. Critical failures are never overridable by any role. Specifically, Security Rating < B is Critical and blocks absolutely [1].

**Code-quality-only pipeline override exception.** In a standard production pipeline, Important failures can be overridden. But in a code-quality-only pipeline, they cannot — because the quality check is the final step with no downstream deployment step to act as an approval gate. This is a frequently tested distinction [1].

**Security Rating < B is Critical, not Important.** Many developers assume security issues are Important (overridable). Security Rating below B is **Critical** — pipeline fails immediately with no override path. A single minor vulnerability drops the rating to B, which still passes. Any major vulnerability drops it to C — immediate Critical failure [1].

**Reliability Rating threshold is C, not B.** Security requires B or better (Critical gate). Reliability only requires C or better (Important gate). Maintainability requires A (Important gate). These different thresholds by rating type are a frequent source of confusion [1].

**OakPAL index rules became breaking in August 2024.** Before August 2024, deploying `oak:QueryIndexDefinition` in a UI Content package was flagged as a warning. After the August 2024 Cloud Manager release, it became a pipeline-breaking failure. Teams upgrading Cloud Manager mid-2024 must audit their package types [2].

**SonarQube 9.9 upgrade (Feb 2025) broke existing pipelines.** The upgrade introduced new rules that flag code that previously passed. Teams that ran the preview variable before the mandatory cutover avoided surprise failures. No customer action is required for the SonarQube upgrade itself — it happens automatically [3].

**Coverage threshold is 50%, not the Sonar Way 80%.** The AEM Cloud Manager default coverage threshold is 50% (Important), not the 80% sometimes cited for standalone SonarQube "Sonar Way" quality gates. This is an AEM-specific configuration [1].

**You cannot add custom SonarQube rules to Cloud Manager.** Unlike a self-hosted SonarQube instance, Cloud Manager does not allow injecting custom rules. Teams needing additional custom rules must run their own SonarQube instance in a parallel pipeline stage [1].

**`@ProviderType` interfaces must not be implemented, only used.** A subtle distinction — AEM APIs annotated `@ProviderType` can be called (used) in custom code but cannot be implemented (extended). When Adobe adds new methods to these interfaces, custom implementations break backwards compatibility. OakPAL flags implementations to prevent this [2].

**Logging both throwing and logging the same exception is flagged.** A very common AEM anti-pattern — `log.error("Error", e); throw e;` produces duplicate log output. SonarQube enforces: log OR throw, not both [2].

**Override roles are specific.** Only three roles can override Important failures: Deployment Manager, Project Manager, or Business Owner. A developer cannot perform this override even if they are certain a finding is a false positive [1].

## Sources

[1] **Code Quality Testing | Adobe Experience Manager (Cloud Service)**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/using-cloud-manager/test-results/code-quality-testing
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Three-tier severity system, quality gate metric thresholds, security rating grades A-E, false positive suppression via @SuppressWarnings, code quality-only pipeline override restriction, authorized override roles (Deployment Manager / Project Manager / Business Owner), PR validation for Bitbucket and GitLab.

[2] **Custom Code Quality Rules | Adobe Experience Manager (Cloud Manager)**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-manager/content/using/custom-code-quality-rules
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: AEM-specific SonarQube rules (ResourceResolver, logging, thread safety, servlet registration), OakPAL rules (index in content package, @ProviderType, /libs modification, OSGi config), Dispatcher Optimization Tool rules, Cloud Service compatibility checks, August 2024 breaking OakPAL changes for index definitions, index definition naming/structure requirements.

[3] **Release Notes for Cloud Manager 2025.2.0 | Adobe Experience Manager as a Cloud Service**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/release-notes/cloud-manager/2025/2025-2-0
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: SonarQube upgrade to 9.9.5.90363 effective February 13, 2025, Java 17/21 build compatibility (Java 21 runtime), preview mechanism via CM_BUILD_IMAGE_OVERRIDE variable, warning that existing quality gates may be impacted.

[4] **Code Quality Testing | Adobe Experience Manager (Cloud Manager standalone)**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-manager/content/using/code-quality-testing
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Quality gate metric thresholds table, pipeline failure behavior configuration options (Ask every time / Fail Immediately / Continue Immediately), security rating scale definitions, three-tier gate system details.
