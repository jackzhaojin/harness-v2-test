# Deployment Phase and Strategies

**Topic ID:** build-deployments.pipelines.deploy-phase
**Researched:** 2026-03-29T00:00:00Z

## Overview

The AEM as a Cloud Service deployment pipeline is the sole mechanism for moving code from Git repositories into running AEM environments [1]. Unlike older AEM versions where code could be deployed directly to a running instance, all code and immutable content must be committed to Git and deployed through Cloud Manager's pipeline [2]. This makes understanding the pipeline's deployment phases, gating mechanisms, and failure behaviors essential for the AEM DevOps Engineer certification.

A production pipeline executes three logical phases in sequence: **Stage Deployment**, **Stage Testing**, and **Production Deployment**. This structure ensures that the exact same build artifact progresses through staging validation and ultimately to production, preventing configuration drift between environments [1][2]. Within each phase, a well-defined sequence of steps governs how artifacts move through environments, and each step has its own failure modes, log sources, and remediation paths [3].

At the heart of all Cloud Service deployments is a **rolling deployment strategy** that guarantees zero downtime. New AEM nodes are started alongside existing nodes, health-checked, then gradually accept traffic while old nodes are removed [2]. This approach imposes important constraints on backward compatibility since both old and new versions of the application run concurrently during transitions [2]. For Adobe Managed Services (AMS) customers, a related but distinct **blue-green deployment** model applies specifically to publish and dispatcher tiers [5].

## Key Concepts

- **Three-phase production pipeline** — Stage Deployment, Stage Testing, and Production Deployment. Each phase contains discrete steps; a failure in any step halts the pipeline [1].
- **Rolling deployment** — New nodes start while old nodes still serve traffic. Old and new application code run simultaneously until new nodes pass health checks and assume all traffic [2]. This requires backward-compatible code changes.
- **Blue-green deployment (AMS only)** — Creates two identical publish/dispatcher environments (blue = current, green = new). Traffic switches to green when validated; blue is decommissioned. Applies only to AMS production publish and dispatcher — not the Author instance [5].
- **Build artifact promotion** — The same artifact built at stage is deployed to production; no rebuild occurs. Re-execution of a failed production deployment also copies artifacts rather than rebuilding [1][3].
- **Quality gates** — Code quality, security, and performance checks that must pass before promotion. Three severity tiers: Critical (pipeline terminates immediately and cannot be overridden), Important (pipeline pauses for manual override), and Informational (no impact on pipeline execution) [1][6].
- **Go-Live Approval** — A manual approval gate that appears before production deployment. Can be executed immediately ("Now") or scheduled for a future date/time in the user's timezone. Has a 14-day timeout [1][6].
- **Non-Intrusive Maintenance Updates (NIMU)** — Automatic AEM version updates applied without customer pipeline involvement. Enabled for all customers in 2024; customers can run pipelines even during an AEM update [1].
- **Mutable vs. immutable content** — Code/configuration is immutable (deployed via Cloud Manager from Git only); content is mutable (deployed during startup phases). Mutable content is never rolled back automatically on deployment failure [2].
- **Repoinit** — OSGi factory configurations that execute atomically at startup before application logic runs. Preferred for service users, ACLs, and path creation due to idempotency and validation properties [2].
- **Stage-only and prod-only pipelines** — Stage-only pipelines deploy to staging and stop without promoting to production. Prod-only pipelines reuse the most recent successful stage artifact, skipping the build phase entirely [6].

## Technical Details

### Full Production Pipeline Step Sequence

The full-stack production pipeline runs these steps in order [1][3][6]:

1. **Validation** — Confirms pipeline configuration, Git branch existence, and environment availability. Fails if environment is in a transitional state.
2. **Build & Unit Testing** — Runs `mvn clean package`. Tags the Git commit with an auto-generated release version. Artifacts are stored for reuse across stage and production.
3. **Code Scanning** — Static analysis using SonarQube with AEM-specific rules. Critical failures terminate immediately; important failures can be overridden.
4. **Build Images** — Converts Maven artifacts into Docker images and Kubernetes configurations combined with the current AEM release.
5. **Deploy to Stage** — Deploys generated images to the stage environment. Mutable content packages and indexes install in this step.
6. **Product Functional Testing** — Predefined Cloud Manager tests run against stage; non-skippable.
7. **Custom Functional Testing** — Customer-authored test JARs run; auto-passes if no JAR is present.
8. **Custom UI Testing** — Optional Selenium-based UI tests packaged in a Docker image; supports Java/Maven, Node/WebDriver.io, or any Selenium framework.
9. **Experience Audit** — Evaluates page performance scores (Lighthouse-based); always runs.
10. **Go-Live Approval (optional)** — Manual gate; 14-day timeout.
11. **Schedule Deployment (optional)** — Defer production go-live to a specified date/time.
12. **Deploy to Production** — Rolling deployment across all publishers and dispatchers.

### Rolling Deployment Mechanics (Production)

Production deployments proceed node-by-node to preserve availability [1][2]:

```
1. Deploy AEM packages to Author instance
2. Detach dispatcher1 from load balancer
3. Deploy AEM packages to publish1 (in parallel with dispatcher package to dispatcher1)
4. Flush Dispatcher cache on dispatcher1
5. Reattach dispatcher1 to load balancer
6. Detach dispatcher2 from load balancer
7. Deploy AEM packages to publish2 (in parallel with dispatcher package to dispatcher2)
8. Flush Dispatcher cache on dispatcher2
9. Reattach dispatcher2 to load balancer
10. Repeat for remaining publish/dispatcher pairs
```

During this entire process, old and new code versions run concurrently, so code must be backwards compatible [2].

### Rolling Deployment Internal Sequence (Node Level)

Within each node transition, the sequence is [2]:

```
Old nodes active → New release candidate built
  ↓
Index processing (new/modified indexes generated before traffic shift)
  ↓
New nodes start up (old nodes still serving traffic)
  ↓
Health checks run on new nodes
  ↓
New nodes accept traffic → Old nodes removed
  ↓
Mutable content deployed (post-switchover phase)
```

### Quality Gate Severity and Behavior

All quality gates are evaluated for code quality, security, and performance [1][6]:

| Severity | Pipeline Behavior | Override Allowed |
|---|---|---|
| Critical | Immediate termination | No |
| Important | Pipeline pauses, awaits manual decision | Yes (by Deployment Manager, Project Manager, or Business Owner) |
| Informational | No impact | N/A |

During pipeline configuration, Deployment Managers can pre-set behavior for Important failures [6]:

| Configuration Setting | Behavior |
|---|---|
| Ask every time (default) | Pipeline pauses for manual decision each time |
| Fail Immediately | Pipeline auto-cancels on first important failure |
| Continue Immediately | Pipeline auto-proceeds past important failures |

### Re-execution of Failed Production Deployments

If the production deployment step fails for transient reasons, re-execution is supported [1][3]:

- Triggers via Cloud Manager UI or API with trigger value `RE_EXECUTE`
- API method: PUT request to the HAL link `https://ns.adobe.com/adobecloud/rel/pipeline/reExecute` on the production deploy step; returns HTTP 201 on success
- Creates a new pipeline execution: Validation -> Build (copies artifacts, no rebuild) -> Deploy to Production
- Only available for the most recent execution and only when the production deployment step was the point of failure

### Timeout Policies

- Go-Live Approval and Schedule Deployment gates: **14-day timeout** [1][3]
- Blue-green green servers (AMS): must be added to production load balancer within **24 hours** or automatic rollback is triggered [5]
- Deploy-to step: custom OSGi startup code causing slow startup can exceed Cloud Manager's startup timeout, resulting in a "Failed" status even if the deployment eventually completes [3]

## Common Patterns

**Full-stack pipeline with Go-Live Approval.** Used for scheduled production releases requiring business stakeholder sign-off. Configure Go-Live Approval on the pipeline; the pipeline pauses after stage testing and waits for manual approval (up to 14 days). Useful for release trains and marketing-aligned launches [6].

**Stage-Only plus Prod-Only split pipelines.** Decouples stage validation from production promotion. A stage-only pipeline runs build and tests against stage. A separate prod-only pipeline is triggered manually, picking up the latest successful stage artifact and deploying only to production. Allows multiple stage validations before committing to production [6].

**Emergency hotfix deployment.** Emergency mode bypasses security and performance testing steps for critical production defects. Approval gates still execute. Use only when normal test cycle duration is unacceptable for the severity of the issue [6].

**Rollback via Git revert followed by pipeline re-run.** The recommended rollback procedure for a bad production deployment [2][4]:

```
1. git revert <bad-commit> on the pipeline's source branch
2. Push to Cloud Manager Git repository
3. Trigger a new full pipeline run
4. New pipeline deploys reverted code through full stage + production cycle
```

As a last resort (e.g., production is down and the full pipeline cycle is too slow), raise a P1 support ticket with Adobe to perform an environment-level restore from a data volume backup. This requires Adobe CSE involvement [2].

**Phase-specific failure analysis.** Each pipeline phase has a designated log source [3]:

| Phase | Log Source |
|---|---|
| Build & Unit Testing | Maven build log (downloadable from Cloud Manager) |
| Deploy to Stage/Production | `aemerror` log for Author/Publish (NOT the Cloud Manager "Download Log") |
| Build Images | Cloud Manager build log; test repoinit scripts locally on unpacked AEM |

## Gotchas

**The "Download Log" in Deploy-to is the wrong log for startup failures.** The log available via Cloud Manager's Deploy-to step download button is the CM deployment log, not the AEM `aemerror` log. Critical startup failures (OSGi bundle errors, repoinit failures) only appear in `aemerror`. This is a commonly tested distinction [3].

**Mutable content is never automatically rolled back.** If a deployment installs new mutable content structures and then fails or is reverted via Git, those structures persist in the JCR. Old code running after rollback must be compatible with any new content structures already created. The only remedy is a subsequent release fix or a full system restore [2][4].

**Rolling deployment requires backward-compatible code for the overlap period.** During a deployment, both old and new versions of code run simultaneously. Code that removes an API, changes a service user's permissions, or modifies an index definition without keeping the old definition can cause errors in the still-running old nodes. Adobe recommends spreading breaking changes across at least two releases [2].

**Blue-green is AMS only, not AEMaaCS.** AEM as a Cloud Service uses rolling deployments. The explicit "blue-green pipeline" (with the 24-hour green server window and separate identical environments) is an AMS-specific add-on feature. Do not confuse the terminology — the internal node-swap mechanism in AEMaaCS is sometimes described as "blue-green" colloquially but it is implemented as a rolling deployment [2][5].

**Pipeline holds older AEM version than the environment.** If an environment was updated to a newer AEM release after the pipeline was created, the pipeline's embedded AEM version may be older. This causes Deploy-to failures. The fix is to update the environment to the latest AEM release and re-run, or delete and recreate the pipeline [3].

**Repoinit scripts fail silently locally but fail hard in Build Images.** A malformed repoinit script may pass a local SDK quickstart but cause the Build Images phase to fail in Cloud Manager. Always test repoinit by deploying the OSGi configuration to an unpacked AEM instance locally and reviewing error logs [3].

**Including /var in content packages blocks subsequent deployments.** If mutable content packages deploy resources under `/var`, this causes blocked distribution queues and failed content activation approximately 60 minutes after deployment — not immediately. The fix is to remove `/var` resources from packages and use repoinit or author-only discrete packages instead [3].

**Re-execution copies artifacts and does not rebuild.** A re-executed production deployment uses the artifacts from the previous build; it does not trigger a new `mvn clean package`. This is intentional (ensures the same artifact that passed stage testing is promoted) but may confuse candidates who expect a full pipeline re-run [1][3].

**Important failures can be pre-configured to auto-continue or auto-fail.** Exam scenarios may describe a pipeline configured to "Continue Immediately" past Important failures — meaning important security findings are silently bypassed. This is a valid but risky configuration; candidates should recognize both the capability and the risk [6].

**Non-intrusive maintenance updates are separate from customer pipelines.** NIMU applies AEM version patches without running the customer's pipeline. Candidates sometimes confuse NIMU with the customer pipeline version update path. NIMU does not require customer action and does not block pipeline execution [1].

## Sources

[1] **Deploy Your Code | Adobe Experience Manager (Cloud Service)**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/using-cloud-manager/deploy-code
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Full pipeline step sequence, rolling deployment mechanics for production (dispatcher-by-dispatcher), Go-Live Approval and Schedule Deployment gates, 14-day timeout, NIMU introduction, re-execution trigger mechanism and API (RE_EXECUTE), build artifact promotion guarantee.

[2] **Deploying to AEM as a Cloud Service | Adobe Experience Manager**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/deploying/overview
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Rolling deployment node-level sequence, concurrent old/new version operation, backward compatibility requirements, immutable vs. mutable content classification, repoinit statements as preferred structural setup mechanism, two-release strategy for breaking changes, mutable content not rolled back on failure, OSGi config must be in source control not runtime console.

[3] **Code Deployment | Adobe Experience Manager (Cloud Manager)**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-manager/content/using/code-deployment
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Three-phase pipeline structure, re-execution availability constraints (most recent execution, production step only), 14-day timeout details, emergency pipeline mode, prod-only pipeline artifact reuse behavior.

[4] **Debugging AEM as a Cloud Service Build and Deployments**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-learn/cloud-service/debugging/debugging-aem-as-a-cloud-service/build-and-deployment
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Phase-by-phase failure analysis and resolutions: validation errors (environment state, missing branch, missing environment), build failures (Maven dependency, timing-sensitive tests, unsupported plugins), code scanning critical failures, Build Images failures (duplicate OSGi configs, malformed repoinit, Core Components version mismatch), Deploy-to failures (AEM version mismatch, startup timeout, /var in content packages), aemerror log guidance, rollback procedures.

[5] **Cloud Manager Blue-Green Deployment Model in AEM (AMS)**
    URL: https://www.tothenew.com/blog/cloud-manager-blue-green-deployment-model-in-aem-adobe-managed-service-ams-2/
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: Blue-green model mechanics, AMS-only scope (publish/dispatcher only, not Author), 24-hour green server availability window, automatic rollback if not promoted within 24 hours, production deployment duration (~3-4 hours), rollback via Git revert+redeploy or CSE data volume restore.

[6] **Using Adobe Cloud Manager - CI/CD Production Pipeline**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-learn/cloud-service/cloud-manager/cicd-production-pipeline
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Full pipeline step order, quality gate severity levels (Critical/Important/Informational), Go-Live Approval role requirements (Business Owner/Project Manager/Deployment Manager), Schedule Deployment option, Stage-Only and Prod-Only pipeline types, Emergency Mode, pipeline configuration for Important failure handling (Ask/Fail/Continue).
