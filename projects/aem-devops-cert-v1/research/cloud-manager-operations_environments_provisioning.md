# Environment Provisioning

**Topic ID:** cloud-manager-operations.environments.provisioning
**Researched:** 2026-03-29T00:00:00Z

## Overview

Environment provisioning in Adobe Cloud Manager is the process by which AEM cloud environments — Author, Publish, and Dispatcher — are created and made available to teams working with AEM as a Cloud Service. During onboarding, Adobe automatically provisions the environments purchased (at minimum one production and one staging environment) and links them to a program in Cloud Manager [1]. For additional environments, users with the Business Owner role can add them through the Cloud Manager UI at `my.cloudmanager.adobe.com` [2].

Cloud Manager supports five distinct environment types — Production+Stage, Development, Rapid Development (RDE), Specialized Testing, and Sandbox — each with different sizing, capabilities, and permitted pipeline associations [3]. Understanding which environment type to use in a given scenario, along with the constraints around regions and resource allocation, is central to the AEM DevOps certification exam.

Environment provisioning is tightly coupled to program type (Production vs. Sandbox) and licensing entitlements. Sandbox programs get one development environment automatically; production programs support richer configurations including additional publish regions and auto-scaling [4]. The choice of primary cloud region is permanent — it cannot be changed after creation — making it a critical provisioning decision [2].

## Key Concepts

- **Production + Stage pair** — Production and staging environments are always created together as a linked pair [3]. You cannot create a production-only or staging-only environment. The staging environment has the same sizing as production and is used for performance, security, and UAT testing before promotion [3].

- **Development environment** — Created for development and testing, associated only with non-production pipelines. Development environments do NOT have the same sizing as stage/production and must NOT be used for performance or security tests [3].

- **Rapid Development Environment (RDE)** — A cloud-based AEM instance that allows direct CLI-based code deployment without running a full CI/CD pipeline. Every program is provisioned with one RDE by default; additional RDEs require licensing [5]. RDEs lack a preview tier and do not support the prerelease channel [5].

- **Specialized Testing Environment (STE)** — A newer environment type providing near-production conditions for stress testing and advanced validation. Only one STE is allowed per AEM program and it is licensed separately (available for AEM Sites, Assets, or Forms) [6].

- **Sandbox program** — Created for training, demos, POCs, and non-live-traffic scenarios. Automatically provisions one development environment, a production+stage pair, and a non-production pipeline. Sandbox environments have no auto-scaling, no SLA coverage, and are NOT suitable for performance/load testing [4].

- **Primary region** — Set at environment creation time. The primary region cannot be changed after creation [2]. Available regions are discoverable via the `http://ns.adobe.com/adobecloud/rel/regions` HAL link in the Cloud Manager API [3].

- **Additional publish regions** — Business Owner role can configure up to three additional publish regions (beyond primary) for production and staging environments to improve availability. Only applicable to AEM Sites and Forms; not available for Assets or sandbox programs [7]. Requires AEM release 12142 or higher [7].

- **Auto-scaling** — Cloud Manager triggers autoscaling automatically for Dispatcher/publish tier in production programs using horizontal scaling (1–10 additional Dispatcher/publish pairs). Sandbox environments do NOT support auto-scaling [4].

- **Environment composition** — Each environment consists of AEM Author, AEM Publish, and Dispatcher services. A preview service (extra publish service) is also included for each AEM as a Cloud Service environment [3].

## Technical Details

### Environment Type Comparison

| Type | Sizing | Pipeline | Preview Tier | Notes |
|------|--------|----------|-------------|-------|
| Production | Full | Production pipeline | Yes | Cannot be deleted |
| Stage | Same as Prod | Production pipeline | Yes | Always paired with Production |
| Development | Smaller | Non-production only | Yes | Can be deleted by Deployment Manager or Business Owner |
| RDE | Smaller | CLI only (no pipeline) | No | Reset to latest AEM version on demand |
| Specialized Testing | Near-production | Outside production pipeline | TBD | Max 1 per program; licensed separately |
| Sandbox | Minimal | Non-production auto-created | Limited | Auto-hibernates after 8 hrs inactivity |

### Creating an Environment

Only users with the **Business Owner** role can add or edit environments [2]. Steps [2][8]:

1. Log into Cloud Manager at `my.cloudmanager.adobe.com`
2. Select the target program
3. From Program Overview, select **Add Environment** on the Environments card
4. Choose environment type (Production+Stage, Development, RDE, Specialized Testing)
5. Enter environment name and description
6. Select a **Primary Region** — this cannot be changed after saving
7. Optionally configure additional publish regions (for Production+Stage)
8. Click **Save**

If the **Add Environment** option is greyed out (disabled), it is due to either insufficient permissions or lack of licensed entitlements [8].

### RDE CLI Deployment

RDE deployments bypass the CI/CD pipeline and use the AIO CLI [5]:

```bash
# Install tools
npm install -g @adobe/aio-cli
aio plugins:install @adobe/aio-cli-plugin-aem-rde

# Configure environment
aio config:set cloudmanager_orgid YOUR_ORG_ID
aio config:set cloudmanager_programid YOUR_PROGRAM_ID
aio config:set cloudmanager_environmentid YOUR_ENVIRONMENT_ID

# Deploy a content package
aio aem:rde:install project.all-1.0.0-SNAPSHOT.zip

# Reset RDE (removes all custom code/content, cycles to latest AEM)
aio aem:rde:reset
```

RDEs support deployment of: content packages, OSGi bundles and configurations, Apache/Dispatcher configs, front-end packages, and config pipeline YAML files [5].

### Additional Publish Regions

Additional publish regions apply only to production and staging environments. Changes made through the production environment automatically apply to the staging environment [7]. Key constraints:

- Maximum of 3 additional regions beyond primary
- Cannot add AND remove regions in the same transaction — must do separately [2]
- Requires the Business Owner role
- Advanced networking should be provisioned before adding additional regions; otherwise traffic routes through the primary region's proxy [7]
- Not available in sandbox programs [7]

### Sandbox Hibernation

Sandbox environments auto-hibernate after **8 hours of inactivity** (no requests to author, preview, or publish) [4]. Manual de-hibernation is triggered by accessing the environment in a browser, which shows a landing page with a Developer Console link. Sandbox programs are **deleted after 6 continuous months of hibernation** [4].

Deployments can still be run to hibernated environments; the deployed code becomes active once the environment is de-hibernated [4].

## Common Patterns

**Standard production program setup:** One production+stage pair is automatically provisioned during onboarding. Teams add development environments (one or more) for individual feature work. One RDE is provisioned per program for rapid iteration. If UAT or stress testing is needed outside the pipeline, an STE is licensed and provisioned [1][6].

**Multi-region availability:** For high-availability requirements (e.g., global Sites deployments), a Business Owner configures up to 3 additional publish regions after environment creation. Adobe CDN handles routing to the nearest region automatically; failover is transparent to users [7].

**Sandbox for POC/demos:** A sandbox program is created to demonstrate AEM features, run training sessions, or validate proof-of-concept scenarios. The sandbox automatically provisions a dev environment and production+stage pair. Teams understand there is no SLA and no auto-scaling, and plan accordingly [4].

**RDE for iterative development:** A developer validates new code locally against the AEM SDK, deploys directly to the RDE via `aio aem:rde:install`, iterates quickly, then commits to Git and runs the non-production pipeline to the cloud development environment. This is the recommended inner-loop workflow [5].

**Onboarding flow:** Adobe provisions environments automatically and sends the designated customer administrator a welcome email confirming access to Adobe Experience Cloud, AEM environments, Cloud Manager, and CSE contact information [1].

## Gotchas

- **Primary region is permanent.** Once you choose a primary region at environment creation, it cannot be changed. Choosing the wrong region requires deleting and recreating the environment (only possible for development environments; production/stage cannot be deleted in production programs) [2].

- **Production and staging MUST be a pair.** You cannot provision a production environment without a staging environment, nor a staging environment without production. They are always created and exist together [3].

- **Dev environments are smaller than stage/production.** A common mistake is running performance or security tests against a development environment, assuming it reflects production sizing. Only staging has production-equivalent sizing [3].

- **RDEs have no preview tier.** Unlike standard dev, stage, and production environments, RDEs do not include a preview service. If preview functionality is needed for testing, a regular development environment is required [5].

- **Sandbox auto-deletion after 6 months.** Sandbox programs enter hibernation after 8 hours of inactivity and are permanently deleted after 6 continuous months of hibernation. Teams using sandboxes for ongoing reference should schedule regular de-hibernation [4].

- **AEM updates differ by program type.** In production programs, AEM updates are automatically applied to dev, stage, and production. In sandbox programs, updates are NOT automatic — they must be triggered manually using a properly configured pipeline [4].

- **Additional publish regions require a transaction-per-action rule.** You cannot add one region and remove another in the same transaction. If you need to swap regions, you must add first (save), then remove (save separately) [2].

- **Advanced networking before additional regions.** If your program uses advanced networking, provision it BEFORE adding additional publish regions. Adding regions first causes their traffic to route through the primary region's proxy by default [7].

- **Add Environment may be disabled.** If the button is greyed out in Cloud Manager, it is either a permissions issue (user not in Business Owner role) or an entitlement issue (licensed environments exhausted) [8].

- **Sandbox programs have no SLA.** Environments in sandbox programs are not covered by any Adobe SLA for AEM Products or Services. This is a critical distinction from production programs [4].

- **Only Development environments can be deleted in production programs.** Production and staging environments in a production program cannot be deleted [3]. This prevents accidental loss of production infrastructure but means provisioning mistakes on stage/prod cannot be self-corrected.

## Sources

[1] **Environment Provisioning | Adobe Experience Manager (Cloud Manager for AMS)**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-manager/content/requirements/environment-provisioning
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Adobe auto-provisions environments during onboarding, welcome email to admin, CI/CD flow dev→stage→prod, AMS subscription minimum includes prod+stage.

[2] **Manage Environments | Adobe Experience Manager**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/using-cloud-manager/manage-environments
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Business Owner role required, environment types, adding environments, primary region cannot change, additional publish regions (up to 3), region change transaction rules, deletion permissions, preview service, IP allow lists.

[3] **Introduction to Cloud Manager | Adobe Experience Manager**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/onboarding/concepts/cloud-manager-introduction
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Four environment types (Prod+Stage, Dev, RDE, STE), sizing differences, production+stage must be pair, environment composition (Author, Publish, Dispatcher, Preview).

[4] **Introduction to Sandbox Programs | Adobe Experience Manager**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/using-cloud-manager/programs/introduction-sandbox-programs
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Sandbox auto-provisions dev environment and prod+stage, no auto-scaling, no SLA, hibernation after 8 hrs, deletion after 6 months hibernation, AEM updates not automatic for sandboxes, deployments can run while hibernated.

[5] **Rapid Development Environments | Adobe Experience Manager**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/developing/rapid-development-environments
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: RDE provisioning steps, CLI deployment commands, reset behavior, supported artifact types, no preview tier, 1 RDE per program by default, additional RDEs require licensing, 1 GB limit for content packages, recommended dev cycle.

[6] **Add a Specialized Testing Environment | Adobe Experience Manager**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/using-cloud-manager/specialized-test-environment
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: STE type, near-production conditions, max 1 STE per program, licensed separately for Sites/Assets/Forms, outside production deployment pipeline.

[7] **Additional Publish Regions | Adobe Experience Manager**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/operations/additional-publish-regions
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: Up to 3 additional regions, AEM Sites and Forms only, not Assets, not sandbox, requires AEM release 12142+, Business Owner role, advanced networking should precede region addition, Adobe CDN handles routing and failover.

[8] **Create Environments | Adobe Experience Manager**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/onboarding/journey/create-environments
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: Step-by-step environment creation flow, roles (Admin, Developer, User), greyed-out Add Environment causes (permissions or licensing), environment name/description/region fields.
