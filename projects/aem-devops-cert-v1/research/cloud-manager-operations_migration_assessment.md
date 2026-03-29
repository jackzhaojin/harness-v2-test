# Migration Assessment Tools

**Topic ID:** cloud-manager-operations.migration.assessment
**Researched:** 2026-03-29T00:00:00Z

## Overview

Adobe provides a suite of purpose-built tools to assess, plan, and execute migration from on-premises or Adobe Managed Services (AMS) AEM deployments to AEM as a Cloud Service (AEMaaCS). The three primary tools are the **Best Practices Analyzer (BPA)**, **Cloud Acceleration Manager (CAM)**, and **Repository Modernizer**. Together they address the full lifecycle from initial readiness assessment through code restructuring [1][2][3].

BPA is the entry point of any migration. It scans a running AEM instance, identifies patterns incompatible with AEMaaCS, and generates a findings report ranked by severity. That report is then uploaded into CAM, which acts as the overarching project management layer — organizing the migration into Readiness, Implementation, and Go-Live phases and providing visual dashboards and task guidance [1][2]. Repository Modernizer is a separate code-transformation utility that restructures legacy AEM Maven project packages into the mutable/immutable content separation required by AEMaaCS [3].

Understanding when each tool is used and what it produces is critical for the exam. BPA tells you what needs to change; CAM tells you how to manage the change; Repository Modernizer makes the structural code changes. They are used in sequence, not interchangeably [1][3].

## Key Concepts

- **Best Practices Analyzer (BPA)** — A package installed on a source AEM instance (6.1+) that scans the JCR repository, OSGi configurations, custom code packages, and content structures without modifying anything. It generates a report of findings organized by category and severity [1][4].

- **Cloud Acceleration Manager (CAM)** — A free, cloud-hosted Adobe application accessed through experience.adobe.com. It serves as the migration project management hub. The BPA report is its primary input, but it also contains planning resources, a trendline view for comparing successive BPA runs, and links to other migration tools [2].

- **Repository Modernizer** — A Node.js-based CLI utility (also invokable via Adobe I/O CLI) that restructures AEM Maven projects from the legacy 6.x layout to the AEMaaCS-required separation of mutable content (`ui.content`) and immutable code (`ui.apps`) into discrete packages, with a container `all` package [3].

- **BPA Upload Key** — A key generated inside a CAM project (Best Practices Analysis tile) that allows BPA to automatically push report data to CAM over the network. Without it, reports must be manually downloaded as CSV and uploaded; manual uploads are capped at ~200 MB, whereas automatic upload via the key has no such limit [4][5].

- **Finding Severity Levels** — BPA classifies each finding as CRITICAL, MAJOR, ADVISORY, or INFO. CRITICAL findings must be resolved before migrating; MAJOR findings should be resolved; ADVISORY findings warrant investigation; INFO findings are informational only [4].

- **BPA Finding Categories** — Findings use short category codes: PCX (page complexity/sub-nodes), ACX (asset content validation), REP (repository items requiring relocation), DM (Dynamic Media compatibility), NCC (non-compatible code), OID (Oak index definitions), WRK (workflow), URS (unsupported repository structure), FORM (AEM Forms), MSM (Multi-Site Manager) [4].

- **CAM Migration Phases** — CAM structures the journey as three UI phases: Readiness (BPA-driven assessment), Implementation (code refactoring and content transfer), and Go-Live (final migration and monitoring). A Post-Go-Live optimization stage follows [2].

- **Immutable vs Mutable Repository** — AEMaaCS enforces a strict split: `/apps` and `/libs` are immutable (read-only at runtime); `/content`, `/conf`, `/var`, `/oak:index`, etc. are mutable. Repository Modernizer enforces this split in the codebase [3].

- **Pattern Detector** — The underlying engine BPA is built on. BPA is an evolution of the older Pattern Detector tool with additional cloud-specific patterns added. Knowing that BPA supersedes and extends the Pattern Detector is exam-relevant [4].

## Technical Details

### Best Practices Analyzer

BPA is downloaded as a ZIP from the Adobe Software Distribution portal and installed via Package Manager on the source AEM instance. Access requires admin rights [4].

```
Navigation path: AEM > Tools > Operations > Best Practices Analyzer
```

To generate a report:
1. Navigate to the BPA tool in the AEM UI.
2. Click "Generate Report." On AEM 6.3 and below, a lightweight mode is available to limit performance impact.
3. (Optional) Provide the BPA Upload Key from CAM to automatically push to CAM. Otherwise, download as CSV for manual upload.
4. Report generation time varies from minutes to hours based on repository size [4].

The CSV export contains columns: code, type, subtype, importance, identifier, message, context. An HTTP API also exposes results at `/apps/best-practices-analyzer/analysis/` in JSON, CSV, or TSV [4].

BPA findings by category code and what they indicate:

| Code | Category | What It Flags |
|------|----------|---------------|
| PCX  | Page Complexity | Pages with excessive sub-nodes causing performance risk |
| ACX  | Asset Content | Missing asset originals or broken binary references |
| REP  | Repository Items | Content/nodes that must move to a supported path |
| DM   | Dynamic Media | DM configurations incompatible with AEMaaCS |
| NCC  | Non-Compatible Code | APIs or packages deprecated or removed in AEMaaCS |
| OID  | Oak Index | Custom Oak index definitions needing conversion |
| WRK  | Workflow | Workflow models requiring migration |
| URS  | Unsupported Repo Structure | Content in locations not permitted in AEMaaCS |
| FORM | AEM Forms | Forms features needing attention |
| MSM  | Multi-Site Manager | MSM-specific compatibility issues |

### Cloud Acceleration Manager (CAM)

CAM is accessed at experience.adobe.com > Experience Manager > Cloud Acceleration Manager. After creating a project, the Readiness Phase presents two tiles [2]:

- **Best Practices Analysis** tile — Upload or auto-sync BPA reports; view findings with filtering by severity, subtype, or count; compare multiple BPA runs using the Trendline view; export as PDF.
- **Planning and Setup** tile — Links to sizing guidance, provisioning docs, and change management resources.

The **Trendline view** is a key feature: when multiple BPA reports are uploaded to the same CAM project (representing successive remediation cycles), the trendline shows whether finding counts are decreasing over time [2].

The Implementation Phase in CAM surfaces additional tools: Content Transfer Tool, Repository Modernizer (via the Refactoring Job tab), Index Converter, Dispatcher Converter, and AEM Modernization Tools.

### Repository Modernizer

Repository Modernizer is a Node.js utility requiring Node.js 10.0+ [3]. It can be run two ways:

```bash
# Option 1: Via Adobe I/O CLI plugin (recommended)
aio aem-migration:repository-modernizer

# Option 2: Standalone
npx @adobe/aem-cloud-service-source-migration repository-modernizer
```

Configuration is defined in `aem-migration-config.yaml` under the `repositoryModernizer:` key, specifying project types and parent POM details [3].

**Supported project types:**

| Type | Description |
|------|-------------|
| SINGLE_PROJECT | Single-module Maven project |
| MULTI_PROJECT | Multimodule without common parent POM |
| NESTED_PROJECT | Multimodule with common parent POM |
| MONOLITHIC_PROJECT | Main project with subprojects |

**Output package structure produced:**

```
project/
  all/          # Container package (embeds ui.apps, ui.config, ui.content)
  ui.apps/      # Code only — deploys to /apps (immutable)
  ui.config/    # OSGi configurations
  ui.content/   # Content/config — deploys to /content, /conf, /home
```

Findings are reported with priorities: CRITICAL (must fix to build), HIGH (prevents functional breaks), NORMAL (completeness), LOW (informational). Error codes run from RM-100 to RM-122+ [3].

In CAM's Implementation Phase, Repository Modernizer is also available as a **Refactoring Job** — users upload their project ZIP and trigger the job without any local CLI setup [3].

## Common Patterns

**Pattern 1: Sequential tool usage in a migration project**

The standard migration workflow runs BPA first, reviews results in CAM, remediates code issues, re-runs BPA, and only proceeds to Repository Modernizer after CRITICAL and MAJOR findings are addressed:

```
1. Install BPA on source AEM Author (Stage clone preferred)
2. Generate BPA report + auto-upload to CAM via upload key
3. Review findings in CAM Readiness > Best Practices Analysis
4. Prioritize CRITICAL findings for immediate remediation
5. Re-run BPA after fixes; compare trendline in CAM
6. Run Repository Modernizer to restructure Maven project
7. Validate restructured project in a Cloud Manager pipeline
```

**Pattern 2: Iterative BPA reporting throughout a project**

Adobe recommends running BPA at least every 8-12 months even outside of active migrations to prevent technical debt accumulation. During active migration projects, teams typically run BPA after each major remediation sprint and upload all reports to the same CAM project to use the trendline feature [1][4].

**Pattern 3: Using CAM Refactoring Jobs vs. local CLI**

For teams without Node.js tooling available, CAM's Refactoring Job tab provides Repository Modernizer as a browser-driven service — upload a ZIP of the project, trigger the job, download the modernized output. This avoids local environment setup and is the path Adobe recommends for most customers [3].

## Gotchas

- **BPA vs. Pattern Detector confusion** — The Pattern Detector is the older AEM 6.x upgrade assessment tool. BPA supersedes and extends it for AEMaaCS migration. BPA actually bundles a version of Pattern Detector internally. On the exam, if asked which tool assesses readiness for AEMaaCS migration, the answer is BPA (not Pattern Detector) [4].

- **Manual upload size limit** — Manually uploading a BPA CSV report to CAM is limited to approximately 200 MB. Large enterprise repositories can generate reports exceeding this size; those environments must use the BPA Upload Key for automated upload. Forgetting to generate the upload key in CAM before running BPA is a common mistake [4][5].

- **BPA does not modify anything** — BPA runs in read-only mode and never modifies repository content or configurations. It is safe to run on Production Author, but Adobe still recommends Stage to avoid performance impact during the analysis [4].

- **AEM 6.1 special requirement** — On AEM 6.1 only, a `repository-reader-service` system user must be manually created and added to the administrators group before BPA installation. This step is not required on 6.2+ [4].

- **Repository Modernizer is not an assessment tool** — Its role in the migration journey is often confused with BPA. BPA assesses and identifies problems; Repository Modernizer transforms code structure. Repository Modernizer is used during the Implementation Phase, not Readiness [3].

- **Package Manager cannot deploy immutable content in AEMaaCS** — Any legacy package that mixes code (`/apps`) with mutable content (`/content`, `/conf`) will fail to install in AEMaaCS. Repository Modernizer resolves this by separating them. This is the core reason the tool exists [3].

- **CAM is free but requires an Adobe representative for access** — CAM is a free application, but access is typically provisioned through an Adobe account team. It is not self-service sign-up from the Adobe catalog [2].

- **BPA trendline requires multiple uploads to the same project** — The trendline feature in CAM only works when multiple distinct BPA reports are uploaded to the same CAM project. Running BPA twice but uploading to different projects will not generate a comparative view [2].

- **Repository Modernizer creates ui.config as a separate package** — Some teams expect only ui.apps and ui.content. The three-package output (ui.apps, ui.config, ui.content) inside an `all` container is the correct AEMaaCS structure based on AEM Archetype 24+. Mixing OSGi configs into ui.apps is a legacy practice [3].

## Sources

[1] **Overview to Best Practices Analyzer — Adobe Experience Manager**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/migration-journey/cloud-migration/best-practices-analyzer/overview-best-practices-analyzer
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Overview of BPA purpose, benefits for estimating migration time and cost, relationship to CAM, and five main finding area categories.

[2] **Readiness Phase in Cloud Acceleration Manager — Adobe Experience Manager**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/migration-journey/cloud-acceleration-manager/using-cam/cam-readiness-phase
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: CAM Readiness Phase structure (Best Practices Analysis + Planning and Setup tiles), BPA integration workflow, trendline feature, upload key mechanism, PDF export, and the three CAM phases overview.

[3] **Repository Modernizer — Adobe Experience Manager**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/migration-journey/refactoring-tools/repo-modernizer
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Repository Modernizer purpose, package structure (ui.apps/ui.config/ui.content/all), supported project types (SINGLE, MULTI, NESTED, MONOLITHIC), Node.js requirement, configuration via aem-migration-config.yaml, CAM Refactoring Job tab automation, and findings priority levels (CRITICAL/HIGH/NORMAL/LOW).

[4] **Using Best Practices Analyzer — Adobe Experience Manager**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/migration-journey/cloud-migration/best-practices-analyzer/using-best-practices-analyzer
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: BPA installation steps, admin-only requirement, AEM 6.1 special user setup, severity levels (CRITICAL/MAJOR/ADVISORY/INFO), finding category codes (PCX/ACX/REP/DM/NCC/OID/WRK/URS/FORM/MSM), HTTP API endpoints, CSV export format, Stage environment recommendation, and report generation time considerations.

[5] **Set Up Your BPA and CAM Project — Adobe Experience Manager**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-learn/cloud-service/migration/moving-to-aem-as-a-cloud-service/bpa-and-cam
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: Step-by-step BPA and CAM setup workflow including Software Distribution download process, CAM project creation wizard, BPA upload key retrieval, ~200 MB manual upload cap, and recommendation to run BPA on a production clone.
