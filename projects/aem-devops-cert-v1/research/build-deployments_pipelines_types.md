# Pipeline Types and Configuration

**Topic ID:** build-deployments.pipelines.types
**Researched:** 2026-03-29T00:00:00Z

## Overview

Adobe Experience Manager (AEM) Cloud Manager provides a set of CI/CD pipeline types designed to give teams fine-grained control over what gets deployed, how fast, and to which environment. Pipelines are the backbone of the AEM as a Cloud Service deployment model — they enforce quality gates, orchestrate staged rollouts, and decouple independent concerns like front-end code, Dispatcher configuration, and infrastructure-level YAML configs [1].

At the broadest level, pipelines divide into **Production** and **Non-Production** categories [1]. Production pipelines deploy through staging into production environments and support approval gates. Non-production pipelines run code-quality scans or deploy to lower-tier environments (dev, QA) for rapid iteration. Within these categories, pipelines are further typed by what they deploy: full-stack code, front-end only, Dispatcher/web tier config, or YAML-based infrastructure config [1][2].

Understanding when to use each pipeline type — and why you cannot mix certain types freely — is central to the AEM DevOps Engineer exam. Questions commonly present a team scenario (e.g., "front-end developer needs to iterate quickly without waiting for back-end builds") and ask which pipeline fits best, or ask about restrictions like "how many full-stack pipelines can be attached to a single environment."

## Key Concepts

- **Production Pipeline** — Orchestrates a full build, test, staging deployment, and production deployment sequence [1]. Requires pre-existing staging and production environments. Only one full-stack production pipeline per environment is allowed [1]. Supports manual approval gates and scheduled deployments to production.

- **Non-Production Pipeline** — Subdivided into Code Quality pipelines (build + scan, no deploy) and Deployment pipelines (build + deploy to dev/QA) [3]. No approval gates; supports Manual and On Git Changes triggers [3]. A single deployment pipeline per non-production environment [3].

- **Config Pipeline** — Deploys YAML configuration files (CDN rules, log forwarding, WAF rules, maintenance tasks) to target environments in minutes [4]. Configured as a "Targeted Deployment" in Cloud Manager — not Full Stack Code [4]. One config pipeline per environment maximum.

- **Full-Stack Pipeline** — The default pipeline type. Deploys back-end code, front-end code (as AEM client libraries), and HTTPD/Dispatcher config simultaneously [1]. Slower but comprehensive. If a dedicated web tier config pipeline exists for the same environment, the full-stack pipeline ignores the Dispatcher config [1].

- **Front-End Pipeline** — Deploys only JavaScript and CSS to the AEM distribution layer as themes [1]. Decoupled from back-end development cycles. Multiple front-end pipelines can run concurrently per program (up to 300 total pipelines per program) [1].

- **Web Tier Config Pipeline** — Deploys only HTTPD/Dispatcher configuration, taking minutes instead of the full-stack pipeline duration [1]. Requires AEM version 2021.12.6151 or newer and opt-in to flexible Dispatcher tools mode [1]. Not supported with private repositories [1].

- **Stage-Only / Production-Only Pipelines** — Decouple staging and production deployments. Stage-Only deploys to staging only. Production-Only deploys to production using artifacts from the most recent Stage-Only execution — no rebuild [5]. Only one of each allowed per program [5].

- **Pipeline Triggers** — Three options: **Manual** (user initiates via UI), **On Git Changes** (auto-triggers on branch commits), and **Scheduled** (production deployment timing gate) [2][3].

- **Smart Build** — A beta build strategy (introduced December 2025) that compiles only changed modules using module-level caching [6]. Available for Code Quality and Dev Deployment pipelines. Opt-in; not the default.

## Technical Details

### Pipeline Type Matrix

| Pipeline Type | Deploys Back-End | Deploys Front-End | Deploys Dispatcher | Deploys Config YAML | Max Per Environment |
|---|---|---|---|---|---|
| Full-Stack (Production) | Yes | Yes (as client libs) | Yes (if no web tier exists) | No | 1 |
| Full-Stack (Non-Prod) | Yes | Yes (as client libs) | Yes (if no web tier exists) | No | 1 |
| Front-End | No | Yes (theme JS/CSS) | No | No | Multiple |
| Web Tier Config | No | No | Yes | No | 1 |
| Config Pipeline | No | No | No | Yes (YAML) | 1 |
| Stage-Only | Yes | Yes | Yes | No | 1 per program |
| Production-Only | No (reuses artifacts) | No (reuses artifacts) | No (reuses artifacts) | No | 1 per program |

### Pipeline Triggers

For Production Pipelines, the **staging phase trigger** is configured as [2]:
- **Manual** — User clicks Run in Cloud Manager UI
- **On Git Changes** — Auto-triggers when commits land on the configured branch; manual runs remain available

For the **production deployment phase** (staging-to-production transition), the behavior is controlled by deployment options [2]:
- **Now** — Deploys immediately after staging tests pass
- **Scheduled (Date)** — Holds the pipeline; user sets a future date/time for production rollout
- **Go Live Approval** — Requires explicit manual approval by a Business Owner, Project Manager, or Deployment Manager role
- **Use CSE Oversight** — Engages a Customer Success Engineer to supervise the production push (options: "Any CSE" or "My CSE")
- **Stop Execution** — Aborts the deployment to production

Non-production pipelines support **Manual** and **On Git Changes** triggers only [3].

Production-Only pipelines do not support the "On Git Changes" trigger — they must be manually initiated [5].

### Config Pipeline YAML Schema

Config pipelines expect YAML files in a `config/` directory within the repository [4]. Files must follow this schema:

```yaml
kind: "LogForwarding"
version: "1"
metadata:
  envTypes: ["dev", "stage", "prod"]
data:
  splunk:
    default:
      enabled: true
      host: "splunk-host.example.com"
      token: "${{SPLUNK_TOKEN}}"
      index: "aem-prod"
      port: 8088
```

Three folder strategies exist for multi-environment configurations [4]:

```
# Strategy 1 — Single file, applies to all environments
config/
  cdn.yaml          # metadata.envTypes: [dev, stage, prod]

# Strategy 2 — Per-environment files
config/
  cdn-dev.yaml      # metadata.envTypes: [dev]
  cdn-prod.yaml     # metadata.envTypes: [prod]

# Strategy 3 — Per-environment folders (for branch-per-environment workflows)
config/
  dev/
    cdn.yaml
  prod/
    cdn.yaml
```

### Branch Configuration

Each Cloud Manager program gets a single Git repository that can contain unlimited branches [7]. At least one branch must exist before a pipeline can be created [3]. The recommended branch naming convention is `main` for the production branch and `develop` for ongoing development [7].

When configuring a pipeline, the branch is selected in the Source Code step via a searchable dropdown with auto-complete [2][3]. A "Refresh" option updates the list if a newly created branch does not appear [3].

### Metric Failure Behaviors (Production Pipeline)

When code quality metrics fail during a production pipeline run, three options control behavior [2]:
- **Ask Every Time** (default) — Pauses pipeline; manual decision required
- **Fail Immediately** — Auto-cancels the pipeline
- **Continue Immediately** — Auto-proceeds past the failure

### Web Tier and Front-End Pipeline Constraints

Web tier config pipelines and front-end pipelines cannot run simultaneously with the corresponding full-stack pipeline for the same environment [1]. Web tier and front-end pipelines also do not support private (external) Git repositories [1].

## Common Patterns

**Pattern 1 — Full-Stack for all-in-one deployments.** Teams without dedicated front-end or Dispatcher pipelines use a single full-stack pipeline for all changes. This is the default for new programs and adequate for smaller teams or less frequent deployments [1].

**Pattern 2 — Front-End pipeline for theme-only teams.** Front-end developers working on AEM Site Themes can independently deploy CSS/JS changes without triggering a full back-end rebuild. This is common in organizations with separate front-end and back-end squads [1].

**Pattern 3 — Web Tier Config pipeline for Dispatcher iteration.** When Dispatcher rules change frequently (e.g., CDN cache headers, rewrite rules), a dedicated web tier config pipeline lets ops teams push those changes in minutes, independent of application releases [1].

**Pattern 4 — Config pipeline for CDN/WAF rules.** WAF rules, traffic filter policies, and log forwarding settings change without requiring code deployments. Config pipelines let security or platform teams push YAML-based configurations to dev, stage, and prod on their own cadence [4].

**Pattern 5 — Stage-Only + Production-Only for decoupled release gates.** Teams doing extended UAT on staging without wanting to block code from reaching production adopt the stage-only/prod-only split. The prod-only pipeline reuses staging artifacts — no redundant rebuild [5].

**Pattern 6 — Scheduled production deployment.** When go-live must align with a marketing launch or business event, teams configure the "Scheduled" deployment option on the production pipeline to automatically promote at a pre-approved date and time [2].

## Gotchas

- **One full-stack pipeline per environment.** This is a hard limit. If you already have a full-stack pipeline on a dev environment, you cannot create another one — you would use Code Quality or front-end/web tier pipelines instead [1].

- **Full-stack ignores Dispatcher if web tier config pipeline exists.** Once a web tier config pipeline is added to an environment, the full-stack pipeline silently stops deploying Dispatcher changes. Teams that miss this often wonder why Dispatcher updates are not taking effect during full-stack deployments [1].

- **Config pipelines require "Targeted Deployment" selection.** When creating a config pipeline in Cloud Manager, you must specifically choose "Targeted Deployment" scope — not "Full Stack Code." Choosing the wrong scope is a common mistake [4].

- **Production-Only cannot use On Git Changes trigger.** Prod-only pipelines are always manually triggered. This differs from standard production pipelines, which can be set to auto-trigger on branch commits [5].

- **Prod-Only artifact risk.** Prod-only pipelines always use artifacts from the most recent successful stage-only execution. If a standard coupled production pipeline also deploys to staging, running a prod-only pipeline afterward could unintentionally deploy older artifacts to production. Adobe recommends discontinuing coupled pipelines once the stage/prod-only approach is adopted [5].

- **Stage-Only execution does not cancel.** Before stage/prod-only pipelines existed, stopping at the "Promote to Prod" gate in a standard pipeline marked the execution as canceled. Stage-only pipelines complete successfully without that stigma [5].

- **Smart Build is beta and opt-in.** Smart Build (incremental module caching) was introduced in Cloud Manager 2025.12.0 and is still in beta as of early 2026. It appears only for Code Quality and Dev Deployment pipelines, and requires contacting Adobe for access [6]. Do not assume it is available by default.

- **Web tier and front-end pipelines do not support private repos.** If a program uses an external (private) Git repository rather than Cloud Manager's built-in repo, web tier config and front-end pipelines are unavailable [1].

- **Non-production deployment pipelines: one per environment.** A single non-production environment can only have one deployment pipeline attached. Code Quality pipelines do not count against this limit [3].

- **Web tier config pipeline requires AEM 2021.12.6151+.** Older AEM versions cannot use web tier config pipelines. In scenarios describing an older environment, this pipeline type is not an option [1].

- **Pipeline cannot be created before at least one branch exists.** A pipeline setup will fail if the associated Git repository has no branches. This is a prerequisite enforced by Cloud Manager [3].

- **Scheduled deployment is a production-phase option, not a pipeline trigger.** "Scheduled" as a top-level trigger option applies to the production deployment gate — not to when the build starts. The build trigger is always either Manual or On Git Changes [2].

- **Go Live Approval roles are specific.** Only Business Owner, Project Manager, or Deployment Manager roles can approve production deployment. A Developer role cannot approve — a commonly tested distinction [2].

## Sources

[1] **Introduction to CI/CD Pipelines — Adobe Experience League**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/using-cloud-manager/cicd-pipelines/introduction-ci-cd-pipelines
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Pipeline type definitions (full-stack, front-end, web tier, config), restrictions (one full-stack per environment), web tier ignores Dispatcher when dedicated pipeline exists, private repo limitation, concurrent pipeline support, 300 pipeline program limit.

[2] **Add a Production Pipeline — Adobe Experience League**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-manager/content/using/pipelines/production-pipelines
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Staging trigger options (Manual, On Git Changes), production deployment options (Now, Scheduled, Go Live Approval, CSE Oversight, Stop Execution), metric failure behavior options, Dispatcher cache flush/invalidate config, performance test configuration, Go Live Approval role requirements.

[3] **Add a Non-Production Pipeline — Adobe Experience League**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-manager/content/using/pipelines/non-production-pipelines
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Non-production pipeline subtypes (Code Quality vs Deployment), trigger options, branch selection UI details, one deployment pipeline per non-production environment restriction, Smart Build limitation notes, prerequisite of at least one branch.

[4] **Use Config Pipelines — Adobe Experience League**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/operations/config-pipeline
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Config pipeline supported configuration types (CDN, WAF, log forwarding, maintenance tasks), YAML schema structure, three folder organization strategies, "Targeted Deployment" requirement, secrets handling (pipeline variables vs environment variables).

[5] **Split Stage-Only and Production-Only Pipelines — Adobe Experience League**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-manager/content/using/pipelines/stage-prod-only
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Stage-only and prod-only pipeline definitions, use cases, artifact reuse behavior, restriction (one of each per program), no "On Git Changes" trigger for prod-only, risk of artifact collision with coupled pipelines, stage-only execution completing without "canceled" status.

[6] **Cloud Manager 2025.12.0 Release Notes — Adobe Experience League**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/release-notes/cloud-manager/2025/2025-12-0
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: Smart Build feature introduction, beta status, scope (Code Quality and Dev Deployment pipelines only), opt-in requirement via Adobe contact.

[7] **Configuring Branches — Adobe Experience League**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-manager/content/getting-started/configuring-branches
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: One Git repo per program, multi-branch strategies, recommended `main` branch naming, develop-to-main merge workflow, HTTPS Git client support.
