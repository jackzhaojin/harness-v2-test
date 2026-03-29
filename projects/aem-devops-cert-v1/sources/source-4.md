# Moving to AEM as a Cloud Service

**Source:** https://experienceleague.adobe.com/docs/experience-manager-learn/cloud-service/migration/moving-to-aem-as-a-cloud-service.html
**Extraction ID Prefix:** EXT-4
**Extracted:** 2026-03-29T00:00:00Z
**Authority:** Official Adobe Experience League documentation (authoritative for certification exam)

> **Note on source availability:** The original URL returned a 404. Content was extracted and validated from the canonical Adobe Experience League documentation covering the same subject area:
> - https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/migration-journey/getting-started
> - https://experienceleague.adobe.com/en/docs/experience-manager-learn/cloud-service/migration/moving-to-aem-as-a-cloud-service/bpa-and-cam
> - https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/migration-journey/cloud-migration/best-practices-analyzer/overview-best-practices-analyzer
> - https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/migration-journey/cloud-migration/content-transfer-tool/overview-content-transfer-tool
> - https://experienceleague.adobe.com/en/docs/experience-manager-learn/cloud-service/migration/moving-to-aem-as-a-cloud-service/repository-modernization
> - https://experienceleague.adobe.com/en/docs/experience-manager-learn/cloud-service/migration/moving-to-aem-as-a-cloud-service/dispatcher

## Summary

This source covers the end-to-end migration journey to AEM as a Cloud Service, spanning four sequential migration phases (Readiness, Implementation, Go-Live, Post-Go-Live/Optimization) and the key toolchain used throughout: Best Practices Analyzer (BPA), Cloud Acceleration Manager (CAM), Content Transfer Tool (CTT), Bulk Import Service, Repository Modernizer, Dispatcher Converter Tool, Index Converter, and AEM Modernization Tools. The central architectural requirement is strict separation of mutable and immutable content, which underpins all code restructuring, deployment patterns, and runtime constraints in AEM Cloud Service.

---

## Key Facts

- `EXT-4-fact-1`: The migration journey to AEM as a Cloud Service consists of four sequential phases: **Readiness, Implementation, Go-Live, and Post-Go-Live** (also called Optimization).
- `EXT-4-fact-2`: **Cloud Manager is the sole deployment mechanism** for AEM as a Cloud Service — no other deployment method is available.
- `EXT-4-fact-3`: Replication agents are replaced by **Sling Content Distribution** in AEM as a Cloud Service.
- `EXT-4-fact-4`: DAM Update Asset Workflow is replaced by **Asset Compute Service** in AEM as a Cloud Service.
- `EXT-4-fact-5`: **CRX/DE Lite** is accessible only in development environments, not in staging or production.
- `EXT-4-fact-6`: AEM as a Cloud Service includes a **built-in CDN**; using a custom CDN requires Adobe Support approval.
- `EXT-4-fact-7`: Only out-of-the-box run modes are supported; **custom run modes are prohibited** in AEM as a Cloud Service.
- `EXT-4-fact-8`: Author tier authentication uses **Adobe IMS**; Publish tier supports SAML and other integrations.
- `EXT-4-fact-9`: **File I/O operations are not recommended** in AEM as a Cloud Service due to container volatility (ephemeral filesystem).
- `EXT-4-fact-10`: The **Best Practices Analyzer (BPA)** is supported on AEM version **6.1 and higher**.
- `EXT-4-fact-11`: The **Content Transfer Tool (CTT)** supports source systems running **AEM 6.3 or later**.
- `EXT-4-fact-12`: The CTT spawns its own Java process requiring up to **4 GB of heap memory** for extraction.
- `EXT-4-fact-13`: For proof-of-migration, Adobe recommends transferring at least **25% of the content or at least 1 terabyte** using a production content clone.
- `EXT-4-fact-14`: Content top-up migrations should avoid exceeding **48 hours** of content extraction and ingestion (recommended for weekend execution windows).
- `EXT-4-fact-15`: CTT ingestion will **fail** if JCR node names exceed **150 characters**.
- `EXT-4-fact-16`: CTT ingestion will **fail** if individual nodes are larger than **16 MB**.
- `EXT-4-fact-17`: CTT ingestion will **fail** if assets shift paths between migration iterations.
- `EXT-4-fact-18`: During CTT ingestion, **Author instances scale down** while Publish instances remain operational.
- `EXT-4-fact-19`: Content must not be **moved** on either source or destination during CTT ingestion; new content may be added, edited, or deleted but not relocated.
- `EXT-4-fact-20`: Only **Lucene indexes** are supported in AEM as a Cloud Service; property indexes and Solr indexes must be converted using the Index Converter tool.
- `EXT-4-fact-21`: Custom Oak index definitions follow a versionable naming scheme that always increments forward, appending `-custom-#` to base names (e.g., `damAsset-lucene-6-custom-1`).
- `EXT-4-fact-22`: Index definitions must be deployed via CI/CD pipeline to `/apps/cq:Indexes`; no index manager UI is available.
- `EXT-4-fact-23`: Content packages for Oak index definitions require `noIntermediateSaves` set to **true**.
- `EXT-4-fact-24`: Subdirectories within Oak index paths are **not supported**.
- `EXT-4-fact-25`: AEM as a Cloud Service uses a **blue-green deployment model** enabling zero-downtime updates and fast rollback. Content indexing occurs before the green environment becomes active.
- `EXT-4-fact-26`: The **Bulk Import Service** supports **Azure Blob Storage** and **Amazon S3** as source storage.
- `EXT-4-fact-27`: The Bulk Import Service can filter assets by file size or MIME type and supports **dry runs** to preview asset count and estimated import time.
- `EXT-4-fact-28`: The Bulk Import Service handles duplicate assets through configurable modes: **skip existing, replace, or create new versions**.
- `EXT-4-fact-29`: AEM Modernization Tools v2.0 uses **Sling Job Scheduler** for asynchronous processing; jobs with over **500 items** automatically split into buckets.
- `EXT-4-fact-30`: The Dispatcher Converter tool removes non-compliant files (author/non-published hosts) and reorganizes configurations into cloud-compatible structure.
- `EXT-4-fact-31`: The Dispatcher SDK performs **three-phase validation**: (1) configuration validation against organizational rules, (2) Apache syntax verification via Docker, (3) immutability file checks.
- `EXT-4-fact-32`: Writing to immutable repository paths (`/libs` and `/apps`) at runtime **results in errors**.
- `EXT-4-fact-33`: Direct Publish repository modifications are restricted (except the `/home` directory).
- `EXT-4-fact-34`: **Reverse replication** functionality is **not supported** in AEM as a Cloud Service.
- `EXT-4-fact-35`: Long-running jobs such as Sling Schedulers and cron jobs should be migrated to **Adobe Developer services**.
- `EXT-4-fact-36`: The maximum number of **migration sets per CAM project is 10**; each requires a unique name.
- `EXT-4-fact-37`: Migration sets expire after approximately **45 days of inactivity**; activity (edit, extraction, or ingestion) resets the expiry.
- `EXT-4-fact-38`: CTT supports **differential top-ups** — transferring only changes since the last extraction — to reduce content freeze periods before go-live.
- `EXT-4-fact-39`: For top-up extractions, the **overwrite option must be disabled**; for top-up ingestions, the **wipe option must be disabled**.
- `EXT-4-fact-40`: The Dispatcher **Flexible Mode** is enabled by including an "opt-in use sources directly" file; it allows multiple virtual host definitions and per-host custom rewrite rule files.
- `EXT-4-fact-41`: BPA analyzes five categories: **application functionality, repository items, legacy interfaces, deployment configuration, and feature compatibility** (superseded or unsupported in cloud).
- `EXT-4-fact-42`: BPA reports are uploaded to CAM for analysis. CAM is accessed at `experience.adobe.com > Experience Manager > Cloud Acceleration Manager`.
- `EXT-4-fact-43`: CTT provides "a self-service way to extract a migration set once and ingest it into **multiple environments in parallel**" with persistent ingestion logs for troubleshooting.

---

## Definitions

- `EXT-4-def-1`: **Best Practices Analyzer (BPA)** — An automated assessment tool available from the Software Distribution Portal that evaluates an AEM instance against five categories: application functionality, moved repository items, legacy UI dialogs, deployment/configuration issues, and unsupported/replaced features. Produces a report uploadable to Cloud Acceleration Manager.
- `EXT-4-def-2`: **Cloud Acceleration Manager (CAM)** — Adobe's cloud-based application that guides IT teams through the entire migration journey. Accepts BPA report uploads and provides readiness assessment, migration complexity scoring, implementation guidance, and go-live checklists. Accessed via experience.adobe.com.
- `EXT-4-def-3`: **Content Transfer Tool (CTT)** — Adobe's primary content migration solution distributed as a standard AEM package via the Software Distribution Portal. Operates in two phases: extraction (source → Azure Blob Storage migration set) and ingestion (Azure Blob Storage migration set → target AEM Cloud Service instance).
- `EXT-4-def-4`: **Migration Set** — A cloud storage area (Azure Blob Storage) provided by Adobe to temporarily store content being transferred by CTT. Maximum 10 per CAM project; expires after ~45 days of inactivity.
- `EXT-4-def-5`: **Bulk Import Service** — A native AEM as a Cloud Service feature for importing assets from cloud storage providers (Azure Blob Storage, Amazon S3) directly into AEM DAM. Accessible via Tools > Assets > Bulk Import.
- `EXT-4-def-6`: **Repository Modernizer** — An Adobe I/O CLI plugin that automates restructuring of legacy AEM Maven codebases by separating code into immutable (ui.apps) and mutable (ui.content) packages. Requires YAML configuration with Maven coordinates.
- `EXT-4-def-7`: **Immutable Content** — Code and configurations baked into Docker images, located in `/libs` and `/apps` directories. Cannot be modified during runtime; changes require a Cloud Manager pipeline deployment.
- `EXT-4-def-8`: **Mutable Content** — Content residing in `/content`, `/conf`, `/oak:index`, and system/temp directories that can be modified through authoring, Package Manager, or deployment pipelines.
- `EXT-4-def-9`: **Dispatcher Converter Tool** — A migration tool that converts existing Dispatcher configurations to AEM as a Cloud Service-compatible structure, including separation of farm files into sub-directives and creation of Apache environment variables.
- `EXT-4-def-10`: **Index Converter Tool** — A tool that automates transformation of Oak index definitions from property indexes or Solr indexes to Lucene indexes for AEM as a Cloud Service compatibility.
- `EXT-4-def-11`: **AEM Modernization Tools** — A suite of four tools (Page Structure Converter, Component Converter, Policy Importer, All-in-One Converter) that update legacy AEM pages from static templates and Foundation Components to editable templates, Core WCM Components, and Layout Containers.
- `EXT-4-def-12`: **Differential Top-Up** — A CTT feature that transfers only content changed since the previous extraction, used to reduce freeze windows before go-live.
- `EXT-4-def-13`: **Dispatcher SDK** — A bundle included with the AEM SDK providing a baseline dispatcher configuration, a three-phase validator tool, and a Docker image for local testing and debugging.

---

## Patterns and Best Practices

- `EXT-4-pattern-1`: **Author-to-Author, Publish-to-Publish migration** — Content must be migrated between matching tiers only. Never migrate author content to publish or vice versa.
- `EXT-4-pattern-2`: **Proof-of-migration before initial migration** — Transfer at least 25% of content or 1 TB from a production clone to validate timelines and identify issues before the real migration.
- `EXT-4-pattern-3`: **Code freeze during Maven restructuring** — Adobe recommends implementing a code freeze period until Maven project restructuring is complete to reduce pipeline failures during transition.
- `EXT-4-pattern-4`: **Modernized AEM package structure** — Projects must follow a five-module hierarchy: `ui.frontend` (JS/CSS), `ui.apps` (immutable code, Oak indexes, components, overlays, ACLs), `ui.config` (OSGi configurations, repo init scripts), `ui.content` (mutable content from `/content` and `/conf`), and `all` (container package holding all deployable artifacts).
- `EXT-4-pattern-5`: **Run actual migration on production instances, not clones** — While proof-of-migration uses production clones, the actual go-live migration must run against real production instances.
- `EXT-4-pattern-6`: **Frequent incremental top-ups** — After initial migration, schedule smaller, frequent content synchronization runs rather than large infrequent ones to minimize pre-go-live content freeze duration.
- `EXT-4-pattern-7`: **Pre-migration repository cleanup** — Perform revision cleanup, data store garbage collection, data consistency verification, user/group cleanup, and asset processing completion before initiating content transfer.
- `EXT-4-pattern-8`: **Copy latest index definition from AEM Cloud Service dev environment** — Always base custom index definitions on the latest cloud environment definitions, not local SDK copies, as SDKs may lack current features or properties.
- `EXT-4-pattern-9`: **Dispatcher Flexible Mode (recommended)** — Use flexible mode over legacy mode by including an `opt-in use sources directly` file, enabling multiple virtual hosts with individual rewrite rule files and per-farm sub-files.
- `EXT-4-pattern-10`: **Three-step readiness assessment** — (1) Assess cloud service readiness with BPA and CAM, (2) Review resource planning and team structure, (3) Establish KPIs aligned with business objectives.
- `EXT-4-pattern-11`: **Install BPA on a production environment clone** — Never run BPA directly on the production instance to avoid performance impact.

---

## Important Warnings

- `EXT-4-warn-1`: CTT ingestion fails on JCR nodes with names exceeding **150 characters**, individual nodes larger than **16 MB**, or assets that shift paths between migration iterations. All three must be remediated before migration.
- `EXT-4-warn-2`: Content must not be **moved** on source or destination during CTT ingestion. New content may be added/edited/deleted but must not be relocated.
- `EXT-4-warn-3`: Writing to immutable repository paths (`/libs` and `/apps`) at runtime results in **errors** in AEM as a Cloud Service.
- `EXT-4-warn-4`: Staging and production environments do not provide CRX/DE Lite access, limiting direct developer troubleshooting on those tiers.
- `EXT-4-warn-5`: **Reverse replication, custom run modes, and most file I/O operations** are not supported in AEM as a Cloud Service.
- `EXT-4-warn-6`: The Dispatcher legacy mode enforces strict file naming — only **one rewrite rules file** permitted (must be named `rewrite.rules`); farm files require specifically named sub-files.
- `EXT-4-warn-7`: Assets missing original renditions and folders lacking `jcr:content` nodes are flagged by BPA as health concerns; while they do not block ingestion, they should be addressed pre-migration.
- `EXT-4-warn-8`: Repository Modernizer requires accurate YAML configuration with Maven coordinates from existing `pom.xml`; inaccurate configuration causes downstream build errors.
- `EXT-4-warn-9`: Migration sets are limited to **10 per CAM project**. Exceeding this limit requires deleting existing migration sets before creating new ones.
- `EXT-4-warn-10`: For top-up extractions, **overwrite must be disabled**; for top-up ingestions, **wipe must be disabled** — enabling either in the wrong direction overwrites migrated data.
- `EXT-4-warn-11`: Windows users must ensure dispatcher symlinks use **Linux-compatible references** (not Windows shortcuts) for cloud deployment to succeed.
- `EXT-4-warn-12`: Certain dispatcher configuration files are immutable and cannot be modified by development teams; attempting to change them fails the immutability validation phase.

---

## Architecture and Migration Tools Summary

| Tool | Purpose | Source Compatibility | Distribution |
|------|---------|---------------------|--------------|
| Best Practices Analyzer (BPA) | Automated readiness assessment | AEM 6.1+ | Software Distribution Portal |
| Cloud Acceleration Manager (CAM) | Migration planning and guidance portal | N/A (cloud app) | experience.adobe.com |
| Content Transfer Tool (CTT) | Content migration (extraction + ingestion) | AEM 6.3+ | Software Distribution Portal |
| Bulk Import Service | Asset import from cloud storage | Azure Blob, Amazon S3 | Native in AEMaaCS |
| Repository Modernizer | Code restructuring (mutable/immutable separation) | Legacy Maven projects | Adobe I/O CLI plugin |
| Dispatcher Converter | Dispatcher config restructuring | Legacy Dispatcher configs | Modernization Tools suite |
| Index Converter | Oak index migration to Lucene | Property/Solr indexes | Modernization Tools suite |
| AEM Modernization Tools | Page/component/policy conversion | Static templates, Foundation Components | AEM Package Manager |

---

## Notable Architectural Changes

| Area | On-Premise / AMS | AEM as a Cloud Service |
|------|-----------------|----------------------|
| Deployment | Manual / scripts | Cloud Manager Pipeline (sole mechanism) |
| Content Distribution | Replication agents | Sling Content Distribution |
| Asset Processing | DAM Update Asset Workflow | Asset Compute Service |
| Author Authentication | Various | Adobe IMS (mandatory) |
| Publish Authentication | Various | SAML / other integrations |
| CDN | Customer-managed | Built-in (custom requires Adobe Support) |
| Run Modes | Custom allowed | Only out-of-box supported |
| Developer Tools | CRX/DE on all tiers | CRX/DE in dev only |
| Search Indexes | Lucene, Property, Solr | Lucene only |
| Long-Running Jobs | Sling Scheduler, cron | Adobe Developer services |
| File System | Persistent | Ephemeral (container volatility) |
| Reverse Replication | Supported | Not supported |
| Repository Paths | Mutable at runtime | /libs and /apps immutable at runtime |
