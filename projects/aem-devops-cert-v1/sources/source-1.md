# Adobe Experience Manager as a Cloud Service -- Documentation Hub

**Source:** https://experienceleague.adobe.com/docs/experience-manager-cloud-service.html
**Extraction ID Prefix:** EXT-1
**Extracted:** 2026-03-29T00:00:00Z
**Content Authority:** Official Adobe documentation (Experience League) -- highest weight for certification exam preparation.

## Summary

This is the primary documentation hub for Adobe Experience Manager (AEM) as a Cloud Service, covering architecture, deployment, CI/CD pipelines, CDN, Dispatcher, identity management, indexing, maintenance tasks, and environment variables. AEM as a Cloud Service is a cloud-native, auto-scaling platform built on containerized microservices with rolling deployments, immutable code infrastructure, and a fully managed CDN. Content was extracted from the hub page and its key sub-pages to capture the depth required for DevOps Engineer Expert certification.

## Key Facts

- `EXT-1-fact-1`: AEM as a Cloud Service delivers four cloud characteristics: Always On (no downtime), Always at Scale (auto-scaling), Always Current (CI updates several times monthly), Always Evolving (daily improvements).
- `EXT-1-fact-2`: A tenant (IMS organization) can have multiple Programs in Cloud Manager, each licensed independently. Programs combine solutions like AEM Sites, AEM Assets, and AEM Forms with add-ons (Commerce, Screens, Dynamic Media, Brand Portal).
- `EXT-1-fact-3`: Four environment types exist: Production, Stage, Development, and RDE (Rapid Development Environment).
- `EXT-1-fact-4`: Stage environments are coupled 1:1 with production, have identical sizing, and maintain content sync with production using self-service copy.
- `EXT-1-fact-5`: Development environments go through the same deployment pipelines with the same quality gates as stage/production but have smaller sizing.
- `EXT-1-fact-6`: RDE (Rapid Development Environment) enables rapid iterations without formal deployment pipelines.
- `EXT-1-fact-7`: The AEM Author cluster runs a minimum of two pods for business continuity during maintenance tasks or deployments.
- `EXT-1-fact-8`: The AEM Publish farm runs a minimum of two pods and scales dynamically during high-traffic periods. Each publisher is coupled with an Apache Dispatcher instance.
- `EXT-1-fact-9`: The Preview tier runs on a single AEM node; occasional downtime during deployments is expected.
- `EXT-1-fact-10`: AEM Author, Preview, and Publish tiers are implemented as Docker containers managed by a Container Orchestration Service for dynamic pod scaling.
- `EXT-1-fact-11`: Files are uploaded directly to the Cloud Data Store, bypassing the JVM. This enables smaller nodes and faster autoscaling.
- `EXT-1-fact-12`: Content publishing uses a "publish and subscribe" pattern with cloud-based content queues, decoupling the author tier from the publish node count.
- `EXT-1-fact-13`: Application code and configuration are completely separated from content, are immutable, and are baked into baseline images.
- `EXT-1-fact-14`: Cloud Manager is the sole mechanism for deploying code to dev, stage, and production environments. Code is never deployed directly to a running AEM instance.
- `EXT-1-fact-15`: Rolling deployments mean there is no downtime for author or publish services during updates.
- `EXT-1-fact-16`: Maintenance Updates are released daily (bug fixes and security patches). Feature Updates are released monthly on a predictable schedule.
- `EXT-1-fact-17`: Cloud Manager automatically rolls back staging if production updates fail, ensuring environment parity.
- `EXT-1-fact-18`: The Web Console for managing OSGI bundles is no longer available in AEM as a Cloud Service; a read-only Developer Console replaces it.
- `EXT-1-fact-19`: The classic UI is no longer available; the authoring UI is purely touch-enabled.
- `EXT-1-fact-20`: Adobe IDs are required for author tier access, managed through Adobe Admin Console using IMS for SSO.
- `EXT-1-fact-21`: Maximum of 300 pipelines per program across all pipeline types.
- `EXT-1-fact-22`: At any time, there can only be one full-stack pipeline per environment.
- `EXT-1-fact-23`: At any time, there can only be one web tier config pipeline per environment.
- `EXT-1-fact-24`: Multiple front-end pipelines can run concurrently (Deployment Manager role required).
- `EXT-1-fact-25`: If a web tier config pipeline exists for an environment, the full-stack pipeline ignores Dispatcher configurations.
- `EXT-1-fact-26`: Web tier config pipelines require AEM version 2021.12.6151.20211217T120950Z or newer and flexible mode Dispatcher tools enabled.
- `EXT-1-fact-27`: Config pipelines deploy in minutes and support traffic filter rules, WAF rules, request/response transformations, origin selectors, client-side redirects, error pages, and authentication.
- `EXT-1-fact-28`: Edge Delivery Configuration Pipelines apply configuration to all registered Edge Delivery Sites domains -- not separated by dev/stage/prod.
- `EXT-1-fact-29`: The Deployment Manager role is required to configure or run pipelines.
- `EXT-1-fact-30`: Environment variables are limited to 200 per environment, with a maximum of 100 characters per variable name (alphanumeric and underscores only).
- `EXT-1-fact-31`: Environment variable changes take effect immediately without requiring code changes or redeployment.
- `EXT-1-fact-32`: Secrets cannot be used with Dispatcher; only regular environment variables are supported. Variables cannot function within `IfDefine` directives.
- `EXT-1-fact-33`: Pipeline variables are separate from environment variables and are exposed only during the build phase.
- `EXT-1-fact-34`: AEM as a Cloud Service supports only Lucene-type indexes for direct customer management. Custom analyzers are not supported; only standard (shipped) analyzers are permitted.
- `EXT-1-fact-35`: Lucene index `async` properties can be configured as `[async]`, `[async,nrt]`, or `[fulltext-async]`.
- `EXT-1-fact-36`: Index deployments use a rolling model with two index sets coexisting (old and new version) for zero-downtime updates.
- `EXT-1-fact-37`: Introducing new indexes on the `dam:Asset` nodetype (particularly fulltext indexes) is strongly discouraged due to conflicts with product features.
- `EXT-1-fact-38`: Unused custom indexes become eligible for garbage collection after a 7-day grace period following removal.
- `EXT-1-fact-39`: Deployments may be prevented if custom indexes cause total index size to increase by more than 100%.
- `EXT-1-fact-40`: The Adobe CDN ingress endpoint follows the pattern: `publish-p<PROGRAM_ID>-e<ENV-ID>.adobeaemcloud.com`.
- `EXT-1-fact-41`: The managed CDN automatically adds geolocation headers: `x-aem-client-country` (ISO 3166-1 Alpha-2) and `x-aem-client-continent` (AF, AN, AS, EU, NA, OC, SA).
- `EXT-1-fact-42`: Use the `x-aem-debug: edge=true` header to verify CDN configuration details.
- `EXT-1-fact-43`: Purge task configurations must be committed to source control and deployed via Cloud Manager config pipelines. Purging is currently disabled by default.
- `EXT-1-fact-44`: Legacy environments retain extended defaults (7-year retention) to prevent unexpected purging.
- `EXT-1-fact-45`: Once deployed, purge configuration nodes cannot be removed without causing config pipeline failure.
- `EXT-1-fact-46`: Maintenance windows support three scheduling options: Daily, Weekly (weekdays 1-7), and Monthly (first or last week).
- `EXT-1-fact-47`: Maintenance task configuration paths follow: `/conf/global/settings/granite/operations/maintenance/granite_[daily|weekly|monthly]`.
- `EXT-1-fact-48`: Logs in AEM as a Cloud Service are retained for **seven days**.
- `EXT-1-fact-49`: OSGi variable names must be **2-100 characters**, match pattern `[a-zA-Z_][a-zA-Z_0-9]*`, and must not use reserved prefixes `INTERNAL_`, `ADOBE_`, `CONST_`, or `AEM_`.
- `EXT-1-fact-50`: Programs created after **May 2022** (program ID > 65000) cache blob content by default; older programs (ID <= 65000) do not cache blobs by default.
- `EXT-1-fact-51`: For environments created after **October 2023**, the CDN automatically removes common marketing query parameters (e.g., `utm_.*`, `gclid`, `_ga`). This can be disabled via CDN config: `removeMarketingParams: false`.
- `EXT-1-fact-52`: Default HTML/text cache TTL is **5 minutes** at the browser. JavaScript/CSS (immutable) caches for **30 days** both at browser and CDN. Client libraries with hash-versioned URLs can be cached **indefinitely**.
- `EXT-1-fact-53`: Adobe's CDN does NOT flush when Dispatcher is invalidated. "The Adobe-managed CDN respects TTLs." CDN cache purge requires explicit API tokens or TTL expiry.
- `EXT-1-fact-54`: Sling Content Distribution (SCD) API is the **preferred** cache invalidation method from the Author tier: supports deduplication, "at least once" delivery guarantee. Replication API (from Publish tier): "best effort," no deduplication.
- `EXT-1-fact-55`: Responses with `Set-Cookie` headers are **never cached** by the CDN.
- `EXT-1-fact-56`: RDE content package sync limit is **1 GB**. RDEs reset to the latest AEM version when cycled. RDEs have no preview tier. AEM Forms RDEs lack Document of Record and Communication API support.
- `EXT-1-fact-57`: IMS authentication applies to **Author, Admin, and Dev users only** -- not external end users or site visitors. Enterprise or Federated IDs are required for SSO; personal Adobe IDs are not supported.
- `EXT-1-fact-58`: Package Manager UI has a **timeout of 10 minutes maximum** per installation request. There is no rollback mechanism for mutable content packages once deployed.
- `EXT-1-fact-59`: Repoinit statements are preferred over mutable packages for service users, groups, ACLs, path creation, and node type definitions. They execute atomically at OSGi configuration registration.
- `EXT-1-fact-60`: AEM as a Cloud Service uses Oak's **composite node store feature** to allow multiple repository versions to coexist during rolling updates. New version uses its own `/libs`; both versions share the mutable content repository.

## Definitions

- `EXT-1-def-1`: **IMS (Identity Management System)** -- Adobe's centralized authentication system providing SSO across cloud applications; uses OAuth protocol between AEM and Adobe's IMS endpoint.
- `EXT-1-def-2`: **Immutable Content** -- Application code, OSGI configurations, index definitions, service users, and ACLs that must be checked into Git and deployed through Cloud Manager.
- `EXT-1-def-3`: **Mutable Content** -- Folder hierarchies, editable templates, context-aware configurations (`/conf`), and scripts that are deployed post-switchover.
- `EXT-1-def-4`: **RDE (Rapid Development Environment)** -- An environment type that enables rapid iterations by syncing local changes via command-line tools without formal deployment pipelines. Not designed for high workloads.
- `EXT-1-def-5`: **Flexible Mode (Dispatcher)** -- The recommended Dispatcher configuration mode (default since AEM archetype 28+) with no limitations on file structure under the rewrites folder. Activated via `opt-in/USE_SOURCES_DIRECTLY` folder structure.
- `EXT-1-def-6`: **Repoinit (Repository Initialization)** -- OSGI factory configuration statements that create content structures at startup; atomic, fast operations suitable for service users, groups, ACLs, and path creation.
- `EXT-1-def-7`: **Config Pipeline** -- A pipeline type that deploys YAML-based configurations for CDN settings, traffic filter rules, WAF rules, log forwarding, and maintenance tasks in minutes.
- `EXT-1-def-8`: **Rolling Update** -- Deployment pattern where new version nodes start while old version nodes serve traffic; health checks validate readiness before cutting over, ensuring zero downtime.
- `EXT-1-def-9`: **Composite Node Store** -- Oak repository feature allowing multiple AEM versions to coexist during rolling deployments by letting the new version own its `/libs` while sharing the mutable repository.
- `EXT-1-def-10`: **Surrogate-Control header** -- HTTP header for controlling CDN caching independently from browser caching. Enables different TTLs at CDN vs. browser layers.
- `EXT-1-def-11`: **Sling Content Distribution (SCD)** -- Preferred mechanism for cache invalidation from the Author tier; supports deduplication and provides "at least once" delivery guarantee.

## Code Examples

### `EXT-1-code-1`: OSGI run mode configuration folder naming convention

```
/apps/example/config/           # applies to all run modes
/apps/example/config.author/    # author only
/apps/example/config.publish/   # publish only
/apps/example/config.author.dev/  # author + dev environment
/apps/example/config.publish.prod/ # publish + production environment
/apps/example/config.rde/       # RDE-specific
```

### `EXT-1-code-2`: OSGi secret and environment variable placeholder syntax in .cfg.json

```json
{
  "mySecretProperty": "$[secret:SECRET_VAR_NAME]",
  "myEnvProperty": "$[env:ENV_VAR_NAME]",
  "myEnvWithDefault": "$[env:ENV_VAR_NAME;default=fallbackValue]"
}
```

Variable naming constraints: 2-100 chars, `[a-zA-Z_][a-zA-Z_0-9]*`, no `INTERNAL_`, `ADOBE_`, `CONST_`, or `AEM_` prefixes.

### `EXT-1-code-3`: Required Dispatcher cache rule for invalidation to work

```
/0000 { /glob "*" /type "allow" }
```

Vhosts must handle requests from: `127.0.0.1`, `localhost`, `*.local`, `*.adobeaemcloud.com`, `*.adobeaemcloud.net`

### `EXT-1-code-4`: Cloud Manager CLI commands for log access

```bash
# Download logs
aio cloudmanager:download-logs <programId> <environmentId> <service> <logName>

# Tail/stream logs in real-time
aio cloudmanager:tail-log <programId> <environmentId> <service> <logName>

# List available log options
aio cloudmanager:list-available-log-options <programId> <environmentId>
```

### `EXT-1-code-5`: Available log types per service

```
Author:     aemerror, aemrequest, aemaccess
Publish:    aemerror, aemrequest, aemaccess
Dispatcher: httpderror, aemdispatcher, httpdaccess
```

### `EXT-1-code-6`: Customer-managed CDN configuration headers required

```
Host: <Adobe default domain>
X-Forwarded-Host: <actual domain>
X-AEM-Edge-Key: <provisioned via Cloud Manager>
SNI: <must match Adobe CDN ingress certificate SANs>
```

Origin: `publish-p<PROGRAM_ID>-e<ENV-ID>.adobeaemcloud.com`

## Patterns and Best Practices

- `EXT-1-pattern-1`: **Code Repository Types** -- AEM supports five code source types: full-stack (server-side Java + OSGi), front-end (client-side JS/CSS/HTML), web tier (Dispatcher config), configuration (CDN + maintenance), and edge delivery (Edge Delivery client-side code).
- `EXT-1-pattern-2`: **Run Mode Configuration** -- OSGI configuration supports environment-specific run modes with format `<service>.<environment>` (e.g., `author.dev`, `publish.prod`). Services: `author`, `publish`. Environments: `dev`, `rde`, `stage`, `prod`.
- `EXT-1-pattern-3`: **Backwards-Compatible Deployments** -- Rolling deployments require backwards-compatible code since old and new versions operate simultaneously. Service users/ACLs changes should be spread across two releases. Old versions use old indexes; new versions use new indexes.
- `EXT-1-pattern-4`: **Environment Variable Integration** -- OSGi configurations reference environment variables via Maven syntax `${env.VARIABLE_NAME}` in `pom.xml`, avoiding hardcoded passwords and enabling environment-specific adaptation.
- `EXT-1-pattern-5`: **CDN Origin Configuration for Customer CDN** -- When using a customer-managed CDN pointing to Adobe, set SNI to Adobe CDN ingress, Host header to Adobe default domain, `X-Forwarded-Host` with actual domain, and include `X-AEM-Edge-Key` header provisioned via Cloud Manager.
- `EXT-1-pattern-6`: **Index Naming Convention** -- OOTB indexes (e.g., `/oak:index/cqPageLucene-2`), customized OOTB indexes append `-custom-N` (e.g., `/oak:index/damAssetLucene-8-custom-1`), fully custom indexes use prefix format (e.g., `/oak:index/acme.product-1-custom-2`).
- `EXT-1-pattern-7`: **Index Definition Deployment** -- Index definitions deploy as content packages requiring FileVault Maven plugin version 1.3.2+ with `noIntermediateSaves=true` and `allowIndexDefinitions=true` in package metadata.
- `EXT-1-pattern-8`: **Maintenance Task Configuration** -- Configurations must be committed to source control and deployed via Cloud Manager rather than using the legacy Tools > Operations UI. Adobe reserves authority to override settings for performance.
- `EXT-1-pattern-9`: **IMS User Provisioning** -- Three methods: manual addition via Admin Console (fewer than 50 users), bulk CSV upload for batch creation, and User Sync Tool (UST) for automated one-way synchronization with enterprise Active Directory or OpenLDAP.
- `EXT-1-pattern-10`: **Third-Party Package Integration** -- Third-party packages should be hosted in remote Maven repositories and referenced in `pom.xml`. If local storage is necessary, use file-system Maven repositories committed to SCM.
- `EXT-1-pattern-11`: **Pipeline selection by change type** -- Use Config pipelines for CDN/WAF/log-forwarding changes (minutes), Web Tier Config pipeline for Dispatcher-only changes (minutes), Full-Stack pipeline for combined back-end + front-end changes.
- `EXT-1-pattern-12`: **RDE-first validation workflow** -- Validate code on RDE first (fast, no quality gates), then deploy to Cloud Development via non-production pipeline (quality gates), then to staging and prod.
- `EXT-1-pattern-13`: **Cache invalidation channel selection** -- Prefer SCD API from Author tier (deduplication, "at least once"). Use Replication API from Publish tier only when SCD unavailable (best-effort, no deduplication).
- `EXT-1-pattern-14`: **Cache header layering** -- Add `stale-while-revalidate` for background refresh and `stale-if-error` for fallback during origin errors.

## Important Warnings

- `EXT-1-warn-1`: Code is never deployed directly to a running AEM instance. Cloud Manager is the sole deployment mechanism. Using Package Manager in cloud environments installs only mutable content; immutable portions are silently ignored.
- `EXT-1-warn-2`: It is not possible to limit deployment to a specific environment. This ensures automated test runs always occur.
- `EXT-1-warn-3`: Index changes require special handling during rolling deployments -- the new version cannot accept traffic until the new index is fully generated. Rolling deployment is blocked until indexing completes.
- `EXT-1-warn-4`: Customers cannot add arbitrary Apache modules to the Dispatcher. AEM supports 26+ modules including `mod_rewrite`, `mod_proxy`, `mod_headers`, and `mod_security`. The `mod_ssl` module is limited to the `SSLProxyEngine` directive only.
- `EXT-1-warn-5`: Changing the name of the AEM Administrators product profile in Admin Console removes administrator rights from all users assigned to that profile.
- `EXT-1-warn-6`: IMS authentication applies exclusively to Author, Admin, and Dev users -- not external end users or site visitors. Only Enterprise or Federated IDs support SSO; personal Adobe IDs are not permitted.
- `EXT-1-warn-7`: When pointing a customer CDN to Adobe's managed CDN, the CDN's IPs must be included in the IP Allow List. Failure causes 403 errors.
- `EXT-1-warn-8`: Geolocation headers from a customer-managed CDN reflect the CDN proxy location, not the actual client origin. Customer CDN implementations should manage these headers independently.
- `EXT-1-warn-9`: Common CDN errors: 421 errors indicate Host/SNI mismatch with certificate SANs; redirect loops are caused by conflicting CDN rules and AEM redirect logic; 403 responses suggest incomplete header configuration.
- `EXT-1-warn-10`: OSGI tokens should be referenced directly from code rather than using the `getRunModes` method.
- `EXT-1-warn-11`: Deployed purge configuration nodes cannot be removed without causing config pipeline failure. Plan purge configurations carefully before initial deployment.
- `EXT-1-warn-12`: Deployments may be blocked if custom indexes cause total index size to increase by more than 100%.
- `EXT-1-warn-13`: Secrets (environment variable type) cannot be used with Dispatcher configurations and cannot function within `IfDefine` directives.
- `EXT-1-warn-14`: There is **no rollback mechanism** for mutable content packages once deployed. Only immutable code deployments can be reverted via Cloud Manager.
- `EXT-1-warn-15`: The User Sync Tool (UST) is **one-way only** -- data flows from Active Directory/OpenLDAP to Admin Console only. Changes made in Admin Console UI are not propagated back to the directory.
- `EXT-1-warn-16`: Responses with `Set-Cookie` headers are never cached by the CDN. Any response setting a cookie is served from origin, bypassing CDN caching entirely.
- `EXT-1-warn-17`: "There are subtle operational differences between how the application behaves on a local machine versus the Adobe Cloud." Always validate in RDE or dev environment before staging/prod.

## Cache TTL Reference Table

| Content Type | Browser TTL | CDN TTL |
|---|---|---|
| HTML/Text (default) | 5 minutes | Mirrors browser |
| JavaScript/CSS (immutable) | 30 days | 30 days |
| Client libraries (hash-versioned) | Indefinitely | Indefinitely |
| Blob (programs post-May 2022, ID > 65000) | Respects auth context | By program age |
| Blob (programs pre-May 2022, ID <= 65000) | No default caching | No default caching |

## Pipeline Types Reference Table

| Pipeline Type | Scope | Max per Env | Deploy Speed | Min AEM Version |
|---|---|---|---|---|
| Full-Stack | Back-end + front-end + web tier | 1 | Standard | Any |
| Front-End | Client-side static assets | Multiple (300 total/program) | Faster | Any |
| Web Tier Config | HTTPD/Dispatcher configs | 1 | Minutes | 2021.12.6151 |
| Config | CDN, WAF, log forwarding, maintenance | Multiple | Minutes | Any |

## Log Types Reference

| Service | Log Name | Content |
|---|---|---|
| Author | aemerror | Application errors |
| Author | aemrequest | Request tracking |
| Author | aemaccess | Access/audit log |
| Publish | aemerror | Application errors |
| Publish | aemrequest | Request tracking |
| Publish | aemaccess | Access/audit log |
| Dispatcher | httpderror | Web server errors |
| Dispatcher | aemdispatcher | Dispatcher-specific log |
| Dispatcher | httpdaccess | Web server access log |

**Log retention:** 7 days. Access via Cloud Manager UI or `aio cloudmanager:download-logs` / `aio cloudmanager:tail-log` CLI commands.
