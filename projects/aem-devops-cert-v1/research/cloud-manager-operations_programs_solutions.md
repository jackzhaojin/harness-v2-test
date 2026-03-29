# Solution Configuration

**Topic ID:** cloud-manager-operations.programs.solutions
**Researched:** 2026-03-29T00:00:00Z

## Overview

In AEM as a Cloud Service, a "program" is the top-level organizational unit in Cloud Manager. Each program maps directly to a licensed set of AEM solutions and is configured with the solutions your organization has purchased. Solution configuration determines which AEM capabilities — Sites, Assets, Forms, and Screens — are provisioned and available in each environment within the program [1][2].

Solutions and their optional add-ons are configured through the **Solutions & Add-ons** tab in Cloud Manager, accessible both during initial program creation and later via **Edit Program**. The choice of solutions at the program level is not merely cosmetic: it determines what AEM product instances get provisioned, which AEM environments are created, and which product profiles are available to users [1][3]. You must select at least one solution to create any program; an empty program cannot exist [2].

AEM Screens is not a standalone solution — it is an add-on to AEM Sites. This distinction, along with which add-ons are tied to which solutions, is a frequent source of confusion and is regularly tested on certification exams [1].

## Key Concepts

- **Program** — The highest organizational unit in Cloud Manager. A tenant may have multiple programs, each representing a licensed AEM deployment. Programs contain one production environment, one stage environment, and one or more development environments [2].

- **Solutions** — The top-level AEM capabilities a program can include: **AEM Sites**, **AEM Assets**, **AEM Forms**, and **Edge Delivery Services** (EDS). Selecting a solution provisions the underlying AEM infrastructure (Author, Publish, Dispatcher) for that capability [2][3].

- **Add-ons** — Optional capabilities attached to a specific parent solution. Add-ons are revealed by clicking the chevron next to the solution name in the Solutions & Add-ons list [2]. Key mappings:
  - **AEM Sites add-ons**: Commerce (CIF), Screens
  - **AEM Assets add-ons**: Dynamic Media (Prime/Ultimate), Brand Portal, Content Hub, AEM Guides
  - **AEM Forms**: No sub-add-ons in the UI; enabling Forms activates Forms - Digital Enrollment and Forms - Communications [3]

- **Production Program** — Intended for live traffic. Requires selecting at least one solution. Has access to Security (HIPAA, WAF-DDOS) and SLA (99.9% or 99.99%) tabs depending on entitlements [2].

- **Sandbox Program** — Intended for training, demos, enablement, and POCs. **Sites, Assets, and Edge Delivery Services are pre-selected and cannot be deselected** [4]. Sandboxes have no SLA guarantees and are subject to operational restrictions absent in production programs.

- **Reference Demos Add-on** — A sandbox-only add-on under the Sites solution. Provides pre-built demo sites (e.g., We.Cafe). Enabling the Screens option under the Reference Demos Add-on adds Screens demo content [5].

- **Business Owner role** — Required to edit programs. This is the only role that can access the Edit Program function and make solution/add-on changes [6].

- **Changes take effect after next deployment** — Editing a program's solutions or add-ons does not apply changes immediately. The changes take effect only after the next pipeline deployment [6].

## Technical Details

### Configuring Solutions During Program Creation

When creating a **production program** in Cloud Manager [2]:

1. Log in at `my.cloudmanager.adobe.com`
2. Click **Add Program** → select **Set up for production**
3. On the **Solutions & Add-ons** tab:
   - Select one or more solutions (minimum one required)
   - Expand each solution's chevron to reveal and select add-ons
4. Optionally configure the **Security** tab (HIPAA, WAF-DDOS) and **SLA** tab (99.9% or 99.99%)
5. Click **Create** (or **Continue** to proceed through the wizard)

When creating a **sandbox program** [4]:
- Sites, Assets, and Edge Delivery Services are pre-selected and locked
- Add-ons such as Screens or Reference Demos can be optionally checked under the Sites chevron

### Enabling AEM Forms in Cloud Manager

The Forms solution has environment-type-specific configuration [3]:

```
Production environment:  select "Forms - Communications"
  → enables: Forms - Digital Enrollment + Forms - Communications Add-On

Sandbox environment:     select "Forms"
  → enables: Forms - Digital Enrollment + Forms - Communications Add-On
```

After selecting Forms and clicking Update, a **build pipeline must be run** for the solution to activate. Forms capabilities are not live until the pipeline succeeds [3].

### Dynamic Media Add-on

Dynamic Media can be added to programs with Assets, Assets Prime, Assets Ultimate, or Sites solutions [7]. When Dynamic Media is added to an existing program via Edit Program, **all existing environments in the program are restarted** and Dynamic Media is applied to them. New environments created after this point also automatically get Dynamic Media [7].

Dynamic Media is **not HIPAA-ready** and cannot be used in environments where Enhanced Security is enabled. Starting with the April 2025 AEM as a Cloud Service release, a technical restriction blocks Dynamic Media (Scene7) from being configured in Enhanced Security environments [7].

### Brand Portal Add-on

Brand Portal is an add-on under Assets, enabling secure asset distribution to external parties. As of current documentation, **Brand Portal is in maintenance mode** — all new product innovations are on Content Hub. New activations require contacting an Adobe representative [1].

Brand Portal is **not available with Assets Prime or Assets Ultimate**. Existing Assets as a Cloud Service customers with Brand Portal access can continue using it when transitioning to Assets Ultimate [1].

### Content Hub Add-on

Content Hub is enabled under the Assets solution. Enabling Content Hub creates a new instance in the **Adobe Admin Console** for managing Content Hub users. An important date-based gotcha: instances provisioned after August 14, 2024 use the suffix **"delivery"** instead of **"contenthub"** in the Admin Console product profile [8].

Content Hub consumes **one credit per environment** (Production, Stage, Development counts separately) [8].

### 99.99% SLA Requirements

If the SLA tab appears, the 99.99% tier is available for **Sites and Forms solutions only**. Activating 99.99% SLA requires [2]:
- An additional publish region entitlement
- Running a full-stack pipeline for activation
- At least one additional publish region must remain on the production/stage environment at all times
- Edge Delivery Services requires only license configuration (no region requirement)

### HIPAA Security Setting

HIPAA can only be configured at **program creation time**. It cannot be enabled or disabled after the program is created. This is a permanent, irreversible program-level setting [2].

## Common Patterns

**Pattern 1: Single-solution program for focused use cases**
An organization running a central DAM creates a program with Assets only. A separate program with Sites (and Commerce add-on) handles their storefront. This keeps environment lifecycles and pipelines independent [1].

**Pattern 2: Adding solutions post-creation**
A program was originally created with just Sites. The team later licenses Forms. The administrator logs into Cloud Manager, uses Edit Program, enables Forms under Solutions & Add-ons, clicks Update, then runs a pipeline. Forms features are not available until the pipeline completes [6].

**Pattern 3: Enabling Screens for digital signage**
Screens is enabled as an add-on under AEM Sites — not as a standalone solution. Navigate to Edit Program → Solutions & Add-ons → expand Sites → check Screens → Update. Run a pipeline to apply [1].

**Pattern 4: Sandbox with Reference Demos + Screens**
For a demo/training sandbox, expand Sites in the Solutions & Add-ons tab → check Reference Demos → also check Screens if digital signage demos are needed. The We.Cafe site template includes Screens demo content [5].

**Pattern 5: Dynamic Media addition to existing program**
Adding Dynamic Media to an existing production program causes environment restarts. Plan this change during a maintenance window to avoid disrupting live deployments [7].

## Gotchas

**Gotcha 1: Screens is NOT a standalone solution — it is an add-on under AEM Sites.**
To use Screens, you must first have the Sites solution enabled in your program. Screens appears as a checkbox under the Sites chevron, not as its own top-level option [1].

**Gotcha 2: Solution changes do NOT take effect immediately.**
After editing a program (adding/removing solutions or add-ons) and clicking Update, the changes only activate following the next pipeline deployment. If a question asks "what must happen after adding a solution to an existing program?", the answer is: run a deployment pipeline [6].

**Gotcha 3: Business Owner role is required to edit programs.**
Regular users, developers, and even deployment managers cannot edit programs. Only the Business Owner role grants this access [6].

**Gotcha 4: HIPAA is a one-time, permanent decision.**
HIPAA compliance can only be set during program creation. There is no way to enable or disable it afterward. This is a common trap in scenario questions that ask "what should be configured first?" [2].

**Gotcha 5: Sandbox program solutions are partially locked.**
When creating a sandbox, Sites, Assets, and Edge Delivery Services are auto-selected and cannot be removed. Add-ons like Screens and Reference Demos are optional and can be checked [4].

**Gotcha 6: Forms enablement differs by environment type.**
In a production environment, select "Forms - Communications" to get both Digital Enrollment and Communications. In a sandbox environment, select "Forms" to get the same capabilities. Using the wrong option in the wrong environment is a likely exam distractor [3].

**Gotcha 7: Brand Portal is in maintenance mode; Content Hub is the successor.**
Brand Portal is still accessible for existing customers but new feature development has stopped. Content Hub is the recommended replacement for asset distribution. Exam questions may test whether you know that Brand Portal is not available with Assets Prime or Assets Ultimate [1][8].

**Gotcha 8: Dynamic Media restarts all environments when added to an existing program.**
This is a disruptive operation. Selecting Dynamic Media in Edit Program is not a non-impacting change — it triggers environment restarts across all environments in the program [7].

**Gotcha 9: At least one solution is required; no empty programs.**
A program must have at least one solution selected. You cannot create a program without choosing at least one of Sites, Assets, Forms, or Edge Delivery Services [2].

**Gotcha 10: AEM Guides add-on is under Assets, not a standalone solution.**
To enable AEM Guides, select Assets in the Solutions & Add-ons tab, then expand it and check Guides. After saving, a pipeline must run to install Guides on any environment in the program [2].

## Sources

[1] **Programs and Program Types | Adobe Experience Manager**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/using-cloud-manager/programs/program-types
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Overview of program types, solutions-to-add-ons mapping (Commerce/Screens for Sites; Dynamic Media/Brand Portal for Assets), multi-program examples, Brand Portal maintenance mode status, sandbox vs production distinctions.

[2] **Create Production Programs | Adobe Experience Manager**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/using-cloud-manager/programs/creating-production-programs
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Step-by-step production program creation, minimum one solution requirement, chevron reveal for add-ons, Security tab (HIPAA permanent setting, WAF-DDOS), SLA tab (99.9% vs 99.99% requirements), Edge Delivery Services as a solution option.

[3] **How do I set up an AEM Forms as a Cloud Service environment? | Adobe Experience Manager**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/forms/setup-configure-migrate/setup-forms-cloud-service
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Forms enablement steps via Edit Program → Solutions & Add-ons tab; production vs sandbox environment selection difference ("Forms - Communications" vs "Forms"); pipeline run requirement to activate Forms.

[4] **Create Sandbox Programs | Adobe Experience Manager**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/using-cloud-manager/programs/creating-sandbox-programs
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Sandbox program defaults (Sites, Assets, Edge Delivery Services always pre-selected and cannot be deselected), sandbox purpose (training/demos/POCs), no SLA guarantees.

[5] **Create Program (Reference Demos Add-on) | Adobe Experience Manager**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/onboarding/demo-add-on/create-program
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: How to enable Reference Demos add-on under Sites in sandbox programs; enabling Screens add-on within Reference Demos; We.Cafe template for Screens demos.

[6] **Edit Programs | Adobe Experience Manager**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/using-cloud-manager/programs/editing-programs
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Business Owner role requirement; changes take effect only after next deployment (key gotcha); ability to add/remove solutions post-creation; sandbox deletion warning.

[7] **Enable Dynamic Media Prime and Ultimate | Adobe Experience Manager**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/assets/dynamicmedia/enable-dynamic-media-prime-and-ultimate
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: Dynamic Media enablement via Assets/Assets Prime/Assets Ultimate/Sites; environment restarts when Dynamic Media added to existing program; HIPAA/Enhanced Security incompatibility with Dynamic Media (Scene7) since April 2025.

[8] **Deploy Content Hub | Adobe Experience Manager**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/assets/content-hub/deploy-content-hub
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: Content Hub enablement under Assets in Solutions & Add-ons tab; Admin Console instance creation on enablement; suffix difference ("delivery" vs "contenthub") based on August 14, 2024 provisioning date; one credit per environment.
