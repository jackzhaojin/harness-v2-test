# Program Types and Lifecycle

**Topic ID:** cloud-manager-operations.programs.types
**Researched:** 2026-03-29T00:00:00Z

## Overview

Adobe Cloud Manager organizes AEM as a Cloud Service deployments into two distinct program types: **sandbox** and **production**. Programs are the highest level of organizational unit in Cloud Manager, grouping environments, pipelines, and repositories that correspond to a licensed business initiative [1]. Understanding the difference between these two types is critical — they are not interchangeable, and the consequences of misconfiguring or misusing them (particularly around lifecycle management) are frequently tested in certification exams.

Sandbox programs are designed for non-production use cases such as training, demos, proof of concept, and enablement [2]. They come with auto-provisioned resources and have a managed lifecycle including automatic hibernation and eventual deletion. Production programs, by contrast, require intentional setup by users in appropriate roles, support live traffic, carry SLA guarantees, and are subject to much stricter controls around modification and deletion [3].

The lifecycle of a sandbox program is uniquely governed by an inactivity-based hibernation and deletion policy, making it distinctly different from production programs which have no concept of hibernation. Exam questions often test whether candidates understand which program type supports which feature, and what happens when a sandbox environment is left inactive.

## Key Concepts

- **Sandbox Program** — A non-production program automatically provisioned with AEM Sites, Assets, and Edge Delivery Services, along with a sample git repository and one development environment [2]. Intended for training, demos, enablement, and POCs. Not meant to carry live traffic.

- **Production Program** — A program for users ready to deploy code handling live traffic [3]. Requires the Business Owner role to create; supports full SLA guarantees, auto-scaling, custom domains, IP Allow Lists, and advanced networking.

- **Auto-Creation in Sandbox** — When a sandbox program is created, Cloud Manager automatically adds Sites, Assets, and Edge Delivery Services; provisions a git repository with a sample project based on the AEM Project Archetype; creates one development environment; and creates a non-production pipeline [2].

- **Hibernation** — Sandbox environments automatically enter hibernation after **8 hours of inactivity** (defined as no requests to the author, preview, or publish services) [4]. Hibernation is exclusive to sandbox programs — production environments never hibernate.

- **Auto-Deletion** — A sandbox program is automatically deleted after **6 continuous months** of being in hibernation mode [4]. The program can be recreated after deletion.

- **De-Hibernation** — A hibernated environment can be manually de-hibernated via the Developer Console. Any user with a product profile granting AEM as a Cloud Service access can de-hibernate a sandbox environment [4]. Only a user with the Developer role can de-hibernate (in some documentation contexts, this is clarified as Developer Console access for sandbox being open to all users).

- **Developer Console Access Differences** — In production programs, Developer Console access requires the "Cloud Manager - Developer Role" in Adobe Admin Console. In sandbox programs, any user with a product profile giving AEM access can use the Developer Console [1][2].

- **Program Deletion** — Only sandbox programs can be deleted (Business Owner role required). Production programs cannot be deleted [5].

- **SLA Tiers** — Production programs support 99.9% (standard) and 99.99% (premium) uptime. The 99.99% SLA requires additional publish regions and full stack pipeline activation [3]. Sandbox programs have no SLA coverage.

## Technical Details

### Sandbox Auto-Provisioned Resources

When a sandbox program is created, Cloud Manager automatically provisions [2]:
- Solutions: AEM Sites, AEM Assets, Edge Delivery Services (included by default, cannot be removed)
- A Git repository with a sample project based on AEM Project Archetype
- One development environment
- One non-production pipeline deploying to the development environment

### Production Program Creation Requirements

Production programs require [3]:
- Business Owner role in Cloud Manager
- At least one solution selected (e.g., Edge Delivery Services)
- A Go-Live date (informational, triggers best-practice guidance)
- Optionally: security settings (HIPAA enablement — permanent once set, WAF-DDOS protection), SLA tier selection

### Sandbox Limitations vs. Production

| Feature | Sandbox | Production |
|---|---|---|
| Live traffic | No | Yes |
| Auto-scaling | No | Yes |
| Custom domains & IP Allow Lists | No | Yes |
| Additional publish regions | No | Yes |
| Advanced networking (VPN, dedicated egress) | No | Yes |
| Automatic AEM updates | No (manual only) | Yes |
| Technical support | No (except program creation issues) | Yes |
| Hibernation | Yes (after 8h inactivity) | No |
| SLA | None | 99.9% or 99.99% |
| Can delete entire program | Yes | No |
| Can delete prod/stage environments | Yes | No |

### Hibernation Lifecycle

```
Active Environment
     |
     | (8 hours of inactivity — no requests to author/preview/publish)
     v
Hibernated State
     |
     | (6 continuous months of hibernation)
     v
Auto-Deleted (program removed)
```

- Data persists through hibernation [4]
- AEM upgrades can be applied to hibernated environments; they take effect upon de-hibernation [4]
- When a user accesses a hibernated environment, they see a landing page explaining the hibernated status [4]

### Manual Hibernation and De-Hibernation Steps

**To manually hibernate:**
1. Log into Cloud Manager at `my.cloudmanager.adobe.com`
2. Select the sandbox program
3. Navigate to the Environments card → Developer Console
4. Click "Hibernate" and confirm [4]

**To de-hibernate:**
1. Log into Cloud Manager → select the hibernated sandbox program
2. Open Developer Console
3. Click "De-Hibernate" and confirm
4. Environment becomes active once the process completes [4]

### Deletion Procedures

**Delete an entire sandbox program (Business Owner role required):**
1. Log into Cloud Manager → select the program
2. Click the program name in the upper-left
3. Select "Delete Program" [5]
- This removes all associated environments and pipelines [5]

**Delete individual environments (sandbox only):**
- Business Owner or Deployment Manager can delete production and stage environments within a sandbox program [5]
- From the Overview screen → Environments card → ellipsis menu → Delete
- Development environments can also be deleted this way [5]

**Production program environments:** Production and staging environments in a production program **cannot be deleted** under any circumstances [5].

## Common Patterns

**Sandbox for onboarding:** New AEM teams commonly create a sandbox program to explore the platform before committing to a production program. The auto-provisioned Sites/Assets/Edge Delivery Services and sample code allow immediate exploration without requiring architectural decisions [2].

**Re-activating a hibernated sandbox:** A common developer workflow is to log into a sandbox that has gone dormant (after an 8-hour quiet period), encounter the hibernation landing page, and use the Developer Console link on that page to de-hibernate the environment. No admin intervention is needed [4].

**Preventing accidental deletion:** Since sandboxes are auto-deleted after 6 months of continuous hibernation, teams that want to retain sandbox environments (even unused) should schedule periodic de-hibernation activities to reset the 6-month clock. Any activity that sends requests to author/preview/publish will prevent or exit hibernation.

**SLA upgrade path:** A production program starts with the standard 99.9% SLA. To upgrade to 99.99%, the Business Owner must edit the program and configure the SLA tab — but this requires an additional publish region entitlement to be available in the organization [3].

**Editing a production program:** Solutions can be added to an existing production program (e.g., adding Sites to an Assets-only program), but changes only take effect after the next deployment. Edits are accessible via the program name dropdown → "Edit program" [5].

## Gotchas

- **Production programs cannot be deleted** — this is a hard rule and a common exam trap. Only sandbox programs can be deleted. If you need to remove a production program, you must contact Adobe support [5].

- **Production/staging environments in a production program cannot be deleted** — contrast with sandbox programs where Business Owner and Deployment Manager roles can delete prod/staging environments [5].

- **Sandbox is not just "smaller" production** — It's a fundamentally different program type with different rules. Many features available in production (custom domains, IP Allow Lists, additional publish regions, advanced networking, auto-scaling) are completely unavailable in sandbox — not just limited [2].

- **AEM updates are NOT automatic in sandbox** — Unlike production programs where Adobe automatically manages AEM updates, sandbox programs require manual triggering of updates. However, the update CAN be applied while the environment is hibernated and will be visible after de-hibernation [4].

- **Developer Console access is broader in sandbox** — In production, only users with "Cloud Manager - Developer Role" can access Developer Console. In sandbox, any user with an AEM product profile can access it. This is a commonly confused distinction [1][2].

- **The 6-month deletion clock resets only on de-hibernation** — The clock for auto-deletion counts 6 months of *continuous* hibernation. Any de-hibernation event resets this counter. Dormant sandboxes that a team "forgot about" can disappear without warning if no one de-hibernates them in 6 months.

- **Deletion removes pipelines too** — Deleting a sandbox program removes all environments AND pipelines. If there are custom pipeline configurations, they will be lost [5].

- **HIPAA enablement is permanent** — When creating a production program, enabling HIPAA on the Security tab cannot be undone after program creation. This is a one-way configuration [3].

- **Go-Live date is informational only** — It does not enforce any restrictions or trigger automated processes; it only surfaces best-practice guidance on the Program Overview page [3].

- **De-hibernation role confusion** — The documentation states that the Developer Console for sandbox is accessible to "any user with a product profile giving them access to AEM as a Cloud Service," suggesting broader de-hibernation access than production environments where the Developer role is required [4].

## Sources

[1] **Programs and Program Types | Adobe Experience Manager**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/using-cloud-manager/programs/program-types
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Core definitions of program types, organizational hierarchy (Tenant → Programs → Environments), Developer Console access differences between sandbox and production.

[2] **Introduction to Sandbox Programs | Adobe Experience Manager**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/using-cloud-manager/programs/introduction-sandbox-programs
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Sandbox purpose, auto-creation features (Sites/Assets/Edge Delivery Services, git repo, dev environment, non-production pipeline), full list of limitations vs. production programs.

[3] **Create Production Programs | Adobe Experience Manager**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/using-cloud-manager/programs/creating-production-programs
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Production program creation steps, solution options, Security tab (HIPAA, WAF-DDOS), SLA tier configuration (99.9% vs 99.99%), Go-Live date behavior.

[4] **Hibernate and De-Hibernate Sandbox Environments | Adobe Experience Manager**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/using-cloud-manager/programs/hibernating-environments
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Hibernation trigger (8 hours inactivity), auto-deletion (6 months continuous hibernation), manual hibernation/de-hibernation steps, data persistence during hibernation, AEM upgrade behavior during hibernation, landing page behavior.

[5] **Edit Programs | Adobe Experience Manager**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/using-cloud-manager/programs/editing-programs
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Role requirements for editing (Business Owner), deletion rules (only sandbox programs can be deleted), step-by-step deletion procedure, production program environment deletion restrictions, pipeline removal on program deletion.
