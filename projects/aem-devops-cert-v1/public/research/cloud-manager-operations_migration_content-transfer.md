# Content Transfer Tool

**Topic ID:** cloud-manager-operations.migration.content-transfer
**Researched:** 2026-03-29T00:00:00Z

## Overview

The Content Transfer Tool (CTT) is an Adobe-developed utility used to initiate migration of existing content from a source AEM instance (on-premise or AMS-hosted) to AEM as a Cloud Service (AEMaaCS) [1]. It is distributed as a standard AEM package via the Software Distribution Portal and integrates directly with Cloud Acceleration Manager (CAM) for orchestration, error handling, and reporting [1][2].

The tool operates in two main phases: **extraction** (pulling content from the source into a temporary cloud-hosted migration set) and **ingestion** (moving content from that migration set into the target AEMaaCS environment) [2]. A differential top-up feature allows subsequent transfers to carry only changed content, minimizing the content freeze period before go-live [3].

Understanding CTT is critical for the AEM DevOps Engineer exam because it is the primary, Adobe-recommended mechanism for production migrations. Exam questions focus heavily on the distinction between wipe vs. non-wipe ingestion modes, what CTT does and does not migrate, size/limit thresholds, and how to structure top-up transfers correctly.

## Key Concepts

- **Migration Set** — A temporary cloud storage area (Azure Blob, managed by Adobe) where extracted content is staged between the source and target AEMaaCS instance [1]. Maximum of 10 migration sets per CAM project, each requiring a unique name [1][4]. Expire after approximately 45 days of inactivity [3].

- **Extraction Phase** — Content is read from the live source AEM instance and uploaded to the migration set's cloud storage. Extraction runs on the active source instance without downtime [2]. Requires free disk space equal to approximately `data store size + node store size × 1.5` [3].

- **Ingestion Phase** — Content is pushed from the migration set into the target AEMaaCS environment. Author ingestion shuts down the entire Author deployment for the duration; Publish remains running [5]. Only members of the local AEM administrators group on the target can initiate ingestion [5].

- **Wipe Mode** — During ingestion, wipe mode deletes the entire existing target repository and replaces it with migration set data. Recommended for initial ingestion due to speed and cleanliness. Admin users lose group membership after a wipe and must be manually re-added [5].

- **Non-Wipe Mode** — During ingestion, existing target content is preserved as the base; migration set content is applied on top. Required for top-up (differential) ingestions. Still uses content replacement (not merge) for overlapping paths [5].

- **Differential Top-Up** — Transfers only content changed since the previous extraction. Requires that the content structure not change between the initial extraction and the top-up extraction [3][4]. For top-up ingestion, wipe mode must be disabled.

- **Extraction Key** — A credential used to authenticate the source AEM instance's connection to the migration set. Valid for 14 days from creation or last renewal; if expired, extraction cannot proceed [3][4].

- **Pre-Copy (AzCopy)** — An optional optimization for large repositories using S3 or Azure datastores. Dramatically reduces extraction time by bulk-copying blobs before the main CTT extraction runs. Can reduce 10-day transfers to under 10 hours for ~10 TB stores [2][5].

- **Cloud Acceleration Manager (CAM)** — The web interface through which migration sets are created and managed. CAM persists ingestion logs, provides validation and principal migration reports, and allows a single migration set to be ingested into multiple environments in parallel [1].

## Technical Details

### System Requirements

- Source AEM version: 6.3 or higher (6.5 strongly recommended) [4]
- Java: version 8 minimum [3]
- CTT tool version: 2.0.0 or higher (latest version always recommended) [4]
- Network: Source must reach `casstorageprod.blob.core.windows.net` (Azure Blob endpoint) [4]
- Installation directory: `crx-quickstart/cloud-migration` — must not be altered [3]

### Supported Repository / Datastore Types

| Datastore Type | Supported | Pre-Copy Available |
|----------------|-----------|-------------------|
| File Data Store | Yes | Yes |
| Amazon S3 | Yes | Yes (via AzCopy) |
| Shared S3 | Yes | Yes |
| Azure Blob Store | Yes | Yes (via AzCopy) |

### Size Limits [4]

| Metric | Limit |
|--------|-------|
| JCR nodes (Segment Store) | 750 million |
| Repository size – Author | 500 GB (online compacted) |
| Repository size – Publish | 50 GB (online compacted) |
| Total content (File Data Store) | 20 TB |
| Lucene Index size (total) | 25 GB (excludes `/oak:index/lucene` and `/oak:index/damAssetLucene`) |
| MongoDB node property value | 16 MB maximum |
| Migration sets per CAM project | 10 |

### Restricted / Non-Migratable Paths [4]

The following paths cannot be selected for migration:
- `/apps`, `/libs`, `/home`, and most `/etc` paths (immutable paths)
- `/etc` is partially allowed only for AEM Forms to AEM Forms as a Cloud Service migrations
- All other `/etc` content requires repository restructuring per Adobe guidelines

### Geographic Region Selection

When creating a migration set, select the geographic region closest to your target AEMaaCS environment. This affects where the temporary migration data is stored and directly impacts ingestion performance [2].

### Extraction Configuration

```
# Key options when creating migration set in CAM:
- Include Versions: optional (also pulls /var/audit for audit events)
- Content Paths: selected via UI browser or CSV upload (minimum 1 path)
- Excluded Paths: optional (e.g., /content/dam/catalogs)
- Geographic region: choose closest to target
```

After creating the migration set, copy the extraction key from the CAM interface, then run extraction from the source AEM instance [4].

### Ingestion Modes Comparison

| Mode | Use Case | Speed | Risk |
|------|----------|-------|------|
| Wipe enabled | Initial ingestion | Faster | Deletes all existing target content; admin must be re-added |
| Wipe disabled | Top-up differential ingestion | Slower | Overlapping paths replaced; non-overlapping preserved |

## Common Patterns

**Standard Migration Workflow:**
1. Run Revision Cleanup and datastore consistency checks on source [3]
2. Install CTT package on source AEM via Package Manager [4]
3. Create migration set in CAM, copy extraction key [4]
4. Run size check on source to verify disk space and limit compliance [3]
5. Start extraction — transfers content to migration set cloud storage [2]
6. Ingest with wipe mode enabled into Author first, then Publish [5]
7. Validate using CAM validation and principal migration reports [1]

**Top-Up (Differential) Transfer Pattern:**
1. After initial full ingestion, make incremental changes on source
2. Run extraction again on the same migration set (wipe option disabled on extraction)
3. Ingest into target with wipe mode **disabled** to preserve existing cloud content [3][5]
4. Repeat until content freeze, then perform final top-up before go-live

**Using Pre-Copy for Large Repositories (>200 GB):**
1. Set up AzCopy on the source machine
2. Run the pre-copy step to bulk-transfer large binary blobs to Azure
3. Then run normal CTT extraction (skips re-uploading already-copied blobs)
4. Pre-copy can be skipped on subsequent top-ups if migration set is under 200 GB [5]

**Handling Author Downtime:**
- Notify stakeholders before Author ingestion; Author is completely unavailable during ingestion [5]
- Ensure no Cloud Manager pipelines are running during ingestion [5]
- After wipe ingestion completes, immediately re-add admin users to the AEM administrators group [5]

## Gotchas

- **CTT cannot migrate between AEMaaCS environments.** It only works from on-premises/AMS sources to AEMaaCS. It cannot be used to copy from AEMaaCS Dev to AEMaaCS Stage or Prod. Use the **Content Copy Tool** for environment-to-environment transfers within AEMaaCS [6].

- **Users are NOT migrated, only groups.** Because AEMaaCS uses Adobe IMS for authentication, users are created automatically on first login. CTT migrates groups (tied to ACLs/CUGs) but not user accounts. Groups must additionally be created in IMS via Admin Console for IMS synchronization to work [1][6].

- **Groups not in ACLs/CUGs are not migrated.** Only groups referenced in Access Control Lists or Closed User Group policies on migrated content are included. Groups with no ACL/CUG association are silently skipped [1].

- **Wipe ingestion loses admin permissions.** After a wipe-enabled ingestion, admin users are removed from the administrators group. You cannot retrieve migration tokens or start new ingestions until admin membership is manually restored [5].

- **Extraction key expires in 14 days.** If the key expires before extraction completes or is retried, the extraction fails. Keys can be renewed at any time from CAM, but this is a common operational gotcha [3][4].

- **Migration sets expire in ~45 days.** An idle migration set will expire and all data is lost. Renew activity by editing the description, refreshing the extraction key, or running extraction/ingestion [3].

- **Top-up requires unchanged content structure.** If content nodes were moved or restructured between the initial extraction and the top-up extraction, the top-up will produce node UUID conflicts and may cause incorrect behavior [5].

- **Wipe mode replaces entire path subtrees, not just overlap.** If the migration set contains `/content/page1` and the destination has `/content/page1/product1`, the entire `page1` subtree is replaced — `product1` is deleted even if it was not in the migration set [5].

- **Author ingestion causes full downtime; Publish does not.** This is a common exam question. The Author deployment is completely scaled down during ingestion. Publish remains available but compaction is disabled [5].

- **Cannot target RDE or Preview environments.** Ingestion targets must be Author or Publish production environments in AEMaaCS. Rapid Development Environments (RDE) and Preview tiers are not supported ingestion targets [5].

- **MongoDB 16 MB property limit.** If source content has node property values exceeding 16 MB (common with stored binary data), ingestion will fail. Run the oak-run script pre-migration to identify and convert oversized properties to binary values [4].

- **10 migration set limit per CAM project.** If more than 10 migration sets are needed, a second CAM project must be created, which introduces governance complexity and risk of content overwrites [1][4].

- **Lucene index size cap of 25 GB** (excluding two primary indexes). Exceeding this requires index reduction before migration [4].

## Sources

[1] **Overview to Content Transfer Tool — Adobe Experience League**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/migration-journey/cloud-migration/content-transfer-tool/overview-content-transfer-tool
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Core overview of CTT purpose, two-phase architecture, migration set limits (10 per project, 45-day expiry), CAM integration features, group migration behavior, and differential top-up capability.

[2] **Content Migration using Content Transfer Tool — Adobe Experience Manager Learn**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-learn/cloud-service/migration/moving-to-aem-as-a-cloud-service/content-migration/content-transfer-tool
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Detailed extraction and ingestion phase mechanics, pre-copy optimization timing, geographic region selection for migration sets, and operational flow overview.

[3] **Guidelines and Best Practices for Content Transfer Tool — Adobe Experience League**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/migration-journey/cloud-migration/content-transfer-tool/guidelines-best-practices-content-transfer-tool
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Disk space formula (`data store size + node store size × 1.5`), revision cleanup recommendations, wipe mode guidance, extraction key validity (14 days), migration set expiry (~45 days), top-up structural constraints, and CAM installation directory requirements.

[4] **Prerequisites for Content Transfer Tool — Adobe Experience League**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/migration-journey/cloud-migration/content-transfer-tool/prerequisites-content-transfer-tool
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: AEM 6.3+ requirement, supported datastore types, all size/capacity limits (750M nodes, 500GB Author, 50GB Publish, 20TB total, 25GB Lucene, 16MB MongoDB), immutable path restrictions, network endpoint requirement, and oak-run pre-migration validation.

[5] **Ingesting Content into Cloud Service — Adobe Experience League**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/migration-journey/cloud-migration/content-transfer-tool/ingesting-content
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Wipe vs. non-wipe mode behavior (including path replacement semantics), Author downtime during ingestion, Publish availability, pre-copy requirements, admin permission loss after wipe, RDE/Preview environment restrictions, Cloud Manager pipeline conflict warning, node UUID conflict risk in top-ups.

[6] **AEM as a Cloud Service Content Migration FAQ — Adobe Experience Manager Learn**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-learn/cloud-service/migration/moving-to-aem-as-a-cloud-service/content-migration/faq
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: Clarification that CTT cannot migrate between AEMaaCS environments (use Content Copy Tool instead), confirmation that users are not migrated (IMS handles user creation on first login), Dynamic Media migration limitation, and asset reprocessing requirements post-ingestion.
