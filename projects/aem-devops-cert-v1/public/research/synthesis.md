# Synthesis Report

**Generated:** 2026-03-29T00:00:00Z
**Research files analyzed:** 52
**Total topics covered:** 52

---

## Cross-cutting Themes

### Theme 1: Mutable vs. Immutable Content Split

- **Appears in:** `cloud-manager.environments.mutable-immutable`, `cloud-manager.packages.structure`, `cloud-manager.packages.dependencies`, `cloud-manager.deploy.deploy-phase`, `cloud-manager.environments.repoinit`, `cloud-manager.dispatcher.configuration`
- **Core concept:** In AEMaaCS, `/apps` and `/libs` are immutable (baked into the container image and deployed as application packages). `/content`, `/conf`, `/var`, and `/home` are mutable (persisted in the Content Repository Service, surviving deployments). This split fundamentally shapes how packages are designed, deployed, and rolled back.
- **Why it matters:** Every package-related exam question assumes this split. It explains why there is no mutable rollback in AEMaaCS, why repoinit must be used for ACL provisioning, why `cp2fm` must be run on legacy packages, and why three-phase deployment exists (the mutable phase must run in sequence relative to the immutable deployment). Getting this wrong causes deployment failures and security misconfigurations.

### Theme 2: Cloud Manager as the Single Control Plane

- **Appears in:** `cloud-manager.pipelines.full-stack-pipeline`, `cloud-manager.pipelines.frontend-pipeline-config`, `cloud-manager.pipelines.config-pipeline`, `cloud-manager.environments.environment-types`, `cloud-manager.deploy.deploy-phase`, `monitoring-quality.log-analysis.cloud-manager-logs`, `admin-console.support.system-status`, `monitoring-quality.scaling.autoscaling`
- **Core concept:** Every operational action in AEMaaCS flows through Cloud Manager: pipeline execution, environment provisioning, log access, update scheduling, secret variable management, and CDN/log-forwarding config deployment. Cloud Manager is not just a CI/CD tool — it is the administration interface.
- **Why it matters:** Exam scenarios that involve "how would you deploy X" or "how would you access Y" almost always have Cloud Manager in the answer. Log forwarding, CDN rules, quiet hours, update-free periods, and environment creation all live in Cloud Manager. Engineers who try to configure these outside Cloud Manager (e.g., directly in AEM) will fail in AEMaaCS.

### Theme 3: IMS Identity Chain — Admin Console to ACL

- **Appears in:** `admin-console.identity.ims-integration`, `admin-console.identity.federated-sso`, `admin-console.identity.user-group-sync`, `admin-console.identity.ldap-integration`, `cloud-manager.environments.repoinit`
- **Core concept:** The identity chain in AEMaaCS is: Federated IdP (SAML 2.0) → Adobe IMS → Admin Console Product Profiles → AEM login trigger → Oak Sync Handler → AEM groups → ACLs (assigned to AEM-native groups, not synced IMS groups). Each link in this chain has specific rules: product profiles must not be renamed; IMS groups do not grant AEM access by themselves; ACLs must live on AEM-native groups; the sync is login-triggered with a ~10-minute debounce.
- **Why it matters:** The identity chain is tested from multiple angles: "Why can a user log into Admin Console but not AEM?" (missing product profile), "Why did a permission change not take effect?" (debounce, or ACL on IMS group not AEM group), "How do you configure SSO?" (Federated ID, SAML 2.0, ACS URL, Entity ID). This chain connects three separate research domains.

### Theme 4: Configuration-as-Code via YAML + Config Pipeline

- **Appears in:** `monitoring-quality.log-analysis.cloud-manager-logs`, `monitoring-quality.scaling.cdn-configuration`, `cloud-manager.pipelines.config-pipeline`, `cloud-manager.environments.repoinit`, `cloud-manager.networking.advanced-networking`
- **Core concept:** AEMaaCS externalizes infrastructure configuration into versioned YAML files deployed through Cloud Manager's Config Pipeline: `logForwarding.yaml` (log destinations), `cdn.yaml` (CDN rules, WAF, BYOCDN auth, cache purge tokens), `envVarsConfig.yaml` (environment variables), and repoinit scripts (ACLs and service users). These are deployed in ~1-2 minutes without a full-stack deployment.
- **Why it matters:** Exam questions about "how would you change X without a code deployment" point to the Config Pipeline. Candidates must know which YAML file controls which capability, the `kind`/`version` YAML envelope structure, the `${{SECRET_NAME}}` secret variable syntax, and the 100KB cumulative size limit.

### Theme 5: Rolling Deployment and Backward Compatibility

- **Appears in:** `cloud-manager.deploy.deploy-phase`, `cloud-manager.packages.mutable-immutable`, `monitoring-quality.scaling.cdn-configuration`, `monitoring-quality.scaling.autoscaling`, `cloud-manager.packages.dependencies`
- **Core concept:** AEMaaCS deploys via node-by-node rolling update (not full blue-green switchover). During the deployment window, old and new code coexist. This requires all code changes to be backward-compatible: no breaking API changes, no schema migrations without migration scripts, and content packages deployed in dependency order. The three-phase mutable deployment (pre-startup, during-startup, post-switchover) is the mechanism that enforces sequencing.
- **Why it matters:** The exam tests this with questions about deployment order, availability during deployment, and why certain changes require careful sequencing. The Dispatcher `stale-while-revalidate` and autoscaling minimum-two-pods requirement are both downstream consequences of the rolling deployment model.

### Theme 6: No Customer Control Over Scaling

- **Appears in:** `monitoring-quality.scaling.autoscaling`, `monitoring-quality.scaling.cdn-configuration`, `cloud-manager.environments.environment-types`
- **Core concept:** AEMaaCS auto-scales are fully Adobe-managed. Customers configure nothing about pod count, threshold triggers, or scaling policies. Author scales on authoring activity; Publish scales on traffic. Preview is a single node (no HA). The CDN (Fastly) is also Adobe-managed and cannot be removed or replaced.
- **Why it matters:** Exam distractors will offer "configure auto-scaling thresholds in Cloud Manager" as a wrong answer. Knowing that the correct answer for scaling questions is always "Adobe manages this automatically" is high-value. The corollary — BYOCDN layers on top of Fastly, does not replace it — is a separate but related point.

### Theme 7: Code Quality Gate Blocking

- **Appears in:** `cloud-manager.pipelines.code-quality`, `cloud-manager.pipelines.full-stack-pipeline`, `cloud-manager.pipelines.config-pipeline`, `cloud-manager.deploy.build-phase`
- **Core concept:** Cloud Manager enforces three quality scanners: SonarQube (v9.9.5) for code quality metrics, OakPAL for Oak repository compatibility, and the Dispatcher Optimization Tool (DOT) for dispatcher config validation. Findings are tiered as Critical, Important, and Informational. Critical findings block the pipeline and cannot be overridden (especially Security Rating below B). Important findings can be overridden by a Deployment Manager.
- **Why it matters:** The exam tests which severity level blocks the pipeline, which role can override, and which tool catches which type of issue. OakPAL catching index violations and DOT catching dispatcher filter errors are common scenario questions.

### Theme 8: Log Access, Forwarding, and Retention

- **Appears in:** `monitoring-quality.log-analysis.cloud-manager-logs`, `monitoring-quality.log-analysis.log-types`, `monitoring-quality.observability.new-relic`
- **Core concept:** Cloud Manager retains logs for 7 days. Log tailing is CLI-only (Adobe I/O CLI), not available in the UI. Custom log files are not supported — all logs must write to `error.log`. Log forwarding (`logForwarding.yaml`) supports Splunk, Elasticsearch, Azure Monitor, HTTPS, and Datadog. The audit log (`/var/audit`) is JCR-based, not a file, and cannot be forwarded. TRACE log level is not supported.
- **Why it matters:** "Where do you look for AEM application errors?" (`aemerror`) and "How do you stream logs?" (Adobe I/O CLI) are directly testable. The 7-day retention limit drives the case for log forwarding. The audit log's non-forwardable nature is a commonly tested gotcha.

### Theme 9: Dispatcher Caching + CDN Caching (Two-Layer Cache)

- **Appears in:** `monitoring-quality.scaling.cdn-configuration`, `cloud-manager.dispatcher.configuration`, `cloud-manager.dispatcher.cache-invalidation`, `cloud-manager.dispatcher.filters`
- **Core concept:** AEMaaCS has two mandatory caching layers: Adobe CDN (Fastly) at the edge and Dispatcher (Apache + `mod_dispatcher`) per-datacenter. They serve different scopes and use different invalidation mechanisms. `Cache-Control` governs both browser and CDN; `Surrogate-Control` governs CDN-only TTL. Dispatcher invalidates via stat files (`statfileslevel`). CDN invalidates via PURGE API or `X-AEM-Purge-Key` header.
- **Why it matters:** Exam questions about cache invalidation, TTL configuration, and "content not updating after publish" scenarios require knowing both layers. The distinction between CDN hard vs. soft purge, and the risk of full CDN purge causing origin overload, are direct exam topics.

### Theme 10: Service Users and Least-Privilege Access

- **Appears in:** `cloud-manager.environments.repoinit`, `cloud-manager.osgi.service-user-mapping`, `cloud-manager.environments.mutable-immutable`, `admin-console.identity.user-group-sync`
- **Core concept:** AEMaaCS forbids `admin` session usage in code. All OSGi services that access the repository must use a dedicated service user, mapped via `ServiceUserMapperImpl.amended` OSGi config, with ACLs provisioned via repoinit. Service users live under `/system/cq:services/` by convention and must have the minimum required permissions.
- **Why it matters:** Service user mapping is tested as a prerequisite to understanding resource resolver, OSGi bundle security, and content package ACL deployment. Forgetting service user mapping is the most common cause of `LoginException` in AEMaaCS service bundles.

---

## Knowledge Gaps

| Topic ID | Topic Title | Gap Description | Sources Consulted | Severity |
|----------|-------------|-----------------|-------------------|----------|
| cloud-manager.environments.rde | Rapid Development Environments (RDE) | No dedicated research file exists for RDE. RDE is mentioned peripherally in environment-types but lacks coverage of the `aio aem:rde:*` CLI commands, deployment model (no pipeline required), and reset behavior. Missing comparison of RDE vs. Dev environment for iterative development scenarios. | environment-types [mentions RDE], no dedicated file | high |
| cloud-manager.networking.sling-content-distribution | Sling Content Distribution (SCD) | SCD is referenced in autoscaling as the replacement for replication agents in AEMaaCS but has no dedicated file. Missing coverage of distribution queues, `DistributionAgent` OSGi configs, `ForwardDistributionAgent`, and how SCD differs from classic replication in troubleshooting scenarios. | autoscaling [references SCD], no dedicated file | high |
| cloud-manager.pipelines.waf-traffic-filtering | WAF and Traffic Filtering Rules | Traffic filter rules and WAF (Web Application Firewall) rules are referenced in cdn-configuration as part of `cdn.yaml` but have no dedicated research file. Missing: WAF rule syntax, traffic filter vs. WAF distinction, rate limiting configuration, IP block rules, and the difference between `blockList` and `allowList` actions. | cdn-configuration [references traffic filters], no dedicated file | high |
| cloud-manager.testing.functional-ui-testing | Functional and UI Testing in Pipelines | Code quality covers SonarQube/OakPAL/DOT but not the functional testing or UI testing stages that run in the Full-Stack pipeline. Missing: custom functional test framework (JUnit + HTTP client), `maven-failsafe-plugin`, UI testing with Selenium/Cypress, `JAVA_V11` environment variable for test containers, and when tests block vs. warn. | full-stack-pipeline [mentions tests exist], code-quality [does not cover test frameworks], no dedicated file | medium |
| cloud-manager.environments.environment-variables | Environment Variable Management | Environment variables are referenced in multiple files (CDN config secrets, log forwarding secrets) using `${{SECRET_NAME}}` syntax but there is no dedicated file covering the full variable management API: Cloud Manager UI path, `aio cloudmanager:set-environment-variables`, variable types (plain vs. secret), per-service targeting (author/publish/preview), and variable name constraints. | cloud-manager-logs [references secrets], cdn-configuration [references secrets], no dedicated file | medium |
| cloud-manager.deploy.go-live-checklist | Go-Live Process and Checklist | Deploy-phase mentions the 14-day Go-Live approval window and the Production Deployment approval step but there is no dedicated file covering the full go-live process: BPA pre-migration assessment, content freeze requirements, DNS cutover, SSL certificate provisioning via Cloud Manager, CDN domain mapping, and post-go-live verification. | deploy-phase [mentions go-live approval], no dedicated file | medium |
| admin-console.identity.enterprise-id-vs-federated | Enterprise ID vs. Federated ID Comparison in AEM Context | federated-sso covers Federated ID thoroughly. ims-integration and user-group-sync cover IMS mechanics. But there is no file that clearly maps which AEM environments support which identity types (AEMaaCS Author = Federated ID + Enterprise ID; AEM Managed Services = same; AEM 6.5 on-premise = local + LDAP + SAML). The matrix of "which identity type in which deployment model" is implicit across multiple files but never stated directly. | federated-sso, ims-integration, user-group-sync, ldap-integration | medium |
| monitoring-quality.observability.dynatrace | Dynatrace Integration | New Relic file mentions "Dynatrace is mutually exclusive with New Relic" but there is no dedicated file for Dynatrace integration, setup steps, or feature comparison vs. New Relic in an AEMaaCS context. Missing: Dynatrace APM agent installation, dashboards, and alerting capabilities for AEM. | new-relic [one-line reference], no dedicated file | low |
| cloud-manager.packages.content-fragments-and-assets | Content Fragments and Asset Package Handling | Package structure and mutable/immutable files cover the mechanics of content packages but do not address the specific challenges of packaging Content Fragments (`/content/dam/.../jcr:content`) for deployment vs. authoring. Missing: whether Content Fragments should be in content packages at all vs. authored in-place, handling of `/conf/global/settings/dam/cfm/` schema packages. | package-structure, mutable-immutable | low |

---

## Conflicting Information

### Conflict 1: File Attachment Size Limit for Support Tickets

- **Topics involved:** `admin-console.support.ticket-submission`
- **Source citations:** [2] Adobe Experience Cloud Support Documentation vs. [4] Adobe Experience League Customer Support Guide from ticket-submission research
- **Conflict:** Two sources within the ticket-submission research file give different file attachment size limits: one states 50MB (Enterprise support plan) and another states 20MB (Experience Cloud portal). The research file flags this as a discrepancy.
- **Resolution:** The 20MB limit is more likely the current enforced limit for the web-based Experience Cloud support portal. The 50MB figure may apply to email or legacy portal submissions. For exam purposes, use 20MB when asked about the Experience Cloud portal; neither figure is likely to be tested numerically.

### Conflict 2: "Three Months" vs "90 Days" for New Relic Retention

- **Topics involved:** `monitoring-quality.observability.new-relic`
- **Source citations:** Multiple sources within new-relic research
- **Conflict:** Some sources in the new-relic research state "three months" retention and others state "90 days." While these are arithmetically equivalent, the exam may test the specific wording used in official documentation.
- **Resolution:** Use "90 days" when answering exam questions — this is the canonical phrasing in Adobe's official documentation for New Relic data retention in AEMaaCS.

### Conflict 3: Audit Log Retention and Accessibility

- **Topics involved:** `monitoring-quality.log-analysis.log-types`, `monitoring-quality.log-analysis.cloud-manager-logs`
- **Source citations:** log-types [1][3] (JCR-based, not forwardable) vs. cloud-manager-logs [supplementary sources]
- **Conflict:** The audit log is documented as JCR-based at `/var/audit` and therefore not forwardable via `logForwarding.yaml`. However, some supplementary sources suggest audit events can be forwarded via Adobe I/O Events (a separate mechanism). These are not conflicting in a strict sense — the JCR audit log cannot be forwarded, but audit events can be pushed via a different mechanism.
- **Resolution:** For the exam: the audit log at `/var/audit` is JCR-based and cannot be forwarded via the Cloud Manager log forwarding mechanism. If a question asks about streaming audit events, Adobe I/O Events is a separate capability and not part of the `logForwarding.yaml` system.

### Conflict 4: `subPackages` vs `embeddeds` for AEMaaCS

- **Topics involved:** `cloud-manager.packages.dependencies`, `cloud-manager.packages.structure`
- **Source citations:** dependencies [1][2] (embeddeds required for AEMaaCS) vs. structure [supplementary]
- **Conflict:** The dependencies file states that `<embeddeds>` must be used in AEMaaCS instead of `<subPackages>`. Some older references and community tutorials still show `<subPackages>` patterns. The research file is clear: `<subPackages>` is for AEM 6.5; `<embeddeds>` is for AEMaaCS.
- **Resolution:** For the exam, which is AEMaaCS-focused: `<embeddeds>` is always correct; `<subPackages>` is an AEM 6.5 pattern. This is an exam trap — older documentation still shows `<subPackages>` and candidates with AEM 6.5 experience may default to it incorrectly.

### Conflict 5: IMS Groups in Product Profiles (AEMaaCS Limitation)

- **Topics involved:** `admin-console.identity.user-group-sync`, `admin-console.identity.ims-integration`
- **Source citations:** user-group-sync [5] vs. admin console UI behavior
- **Conflict:** The user-group-sync file notes that AEMaaCS does not officially support assigning IMS user groups directly to product profiles (only individual users), but the Admin Console UI may not block this assignment. The behavior when groups are assigned to profiles in AEMaaCS is documented as "undefined."
- **Resolution:** The exam answer is: add individual users to product profiles; do not assign IMS groups to AEMaaCS product profiles. Group memberships flow into AEM through the login-triggered sync, not through product profile assignment.

---

## Topic Relationships

### Dependency Graph

The following tree shows prerequisite relationships. Topics listed under another are best studied after their parent.

```
AEMaaCS Architecture Fundamentals
  └── Mutable vs. Immutable Content Split
        ├── Package Structure (filter.xml, workspace filters)
        │     ├── Package Dependencies (embeddeds vs subPackages)
        │     │     └── Three-Phase Mutable Deployment
        │     └── Package Types (application/content/container)
        ├── Repoinit (ACL-as-code, service users)
        │     └── Service User Mapping (OSGi ServiceUserMapperImpl)
        │           └── Resource Resolver (loginService, ResourceResolverFactory)
        └── Cloud Manager Environments (Dev/Stage/Prod/RDE, environment types)

Cloud Manager Pipelines
  └── Full-Stack Pipeline (build → code quality → deploy)
        ├── Build Phase (Maven, archetype, profiles)
        │     ├── Frontend Module Structure (ui.frontend, Webpack, clientlibs)
        │     └── Frontend Pipeline Config (npm build, dist/, CDN delivery URLs)
        ├── Code Quality (SonarQube, OakPAL, DOT, severity tiers)
        └── Deploy Phase (rolling, three-phase, production approval)
              └── Config Pipeline (cdn.yaml, logForwarding.yaml, secrets)

OSGi Framework
  └── OSGi Configuration (factory configs, run-mode targeting)
        └── OSGi Annotations (SCR, DS, @Component, @Reference)
              └── Sling Models (@Model, @Inject, @ValueMapValue, adaptables)

Identity and Access
  └── IMS Integration (mandatory AEMaaCS layer, product profiles)
        ├── Federated SSO (SAML 2.0, Federated ID, ACS URL, certificate mgmt)
        │     └── User/Group Sync (login-triggered, debounce, IMS→AEM groups)
        │           └── LDAP Integration (on-premise only, three OSGi configs)
        └── Admin Console Support (ticket submission, system status, notification profiles)

Content Delivery
  └── CDN Configuration (Fastly, BYOCDN, cdn.yaml, Surrogate-Control)
        ├── Dispatcher Configuration (farm files, filters, rewrites, validation)
        │     ├── Dispatcher Caching (stat files, statfileslevel, Flush agent)
        │     └── Dispatcher Filters (allow/deny, /type required, security rules)
        └── Autoscaling (Adobe-managed, Author/Publish/Preview topology)

Monitoring and Observability
  └── Log Types (aemerror, aemrequest, audit, dispatcher logs)
        ├── Cloud Manager Logs (7-day retention, CLI tailing, logForwarding.yaml)
        └── New Relic (sub-account, read-only, 30-user cap, 90-day retention)
              └── Health Checks (HealthCheck interface, hc.tags, Operations Dashboard)
```

### Independent Topics

The following topics can be studied in any order without strict prerequisites:

- `admin-console.support.ticket-submission` — Procedural knowledge, no technical prerequisites
- `admin-console.support.system-status` — Independent operational reference
- `cloud-manager.environments.environment-types` — Contextual background, no deep prerequisites
- `monitoring-quality.observability.new-relic` — Standalone observability tooling
- `cloud-manager.deploy.go-live` — Procedural go-live process (light technical prerequisites)

---

## Priority Rankings

| Priority | Topic ID | Topic Title | Rationale |
|----------|----------|-------------|-----------|
| critical | cloud-manager.environments.mutable-immutable | Mutable vs. Immutable Split | Foundation for all package, deployment, and repoinit questions. Appears in 6+ topic areas. Directly tested in every deployment scenario. |
| critical | cloud-manager.packages.structure | Content Package Structure (filter.xml) | filter.xml syntax, last-match-wins, import modes, and workspace filters appear in nearly every package scenario question. |
| critical | cloud-manager.packages.dependencies | Package Dependencies (embeddeds vs subPackages) | The embeddeds-vs-subPackages distinction is a high-frequency AEMaaCS-specific trap for AEM 6.5 engineers. Container package structure is foundational. |
| critical | admin-console.identity.user-group-sync | User and Group Synchronization | Spans identity + permissions + Admin Console. Directly named in the exam domain description. Connects IMS, product profiles, AEM groups, and ACLs. |
| critical | cloud-manager.pipelines.full-stack-pipeline | Full-Stack Pipeline | The primary pipeline type; tests code quality integration, deployment phases, and approval gates. High exam domain weight (CD = 33%). |
| critical | cloud-manager.deploy.deploy-phase | Deployment Phase (Rolling Deployment) | Rolling deployment mechanics, three-phase mutable deploy, backward compatibility requirement, and production approval are all high-frequency exam content. |
| critical | admin-console.identity.ims-integration | IMS Integration | Mandatory AEMaaCS authentication layer. Tested from multiple angles: product profile management, Cloud Manager vs AEM access, never rename profiles. |
| critical | monitoring-quality.scaling.cdn-configuration | CDN Configuration | CDN is tested heavily: Fastly mandatory, BYOCDN mechanics, cdn.yaml, Surrogate-Control vs Cache-Control, Config Pipeline deployment. |
| high | cloud-manager.environments.repoinit | Repository Initialization (Repoinit) | Service users, ACL-as-code, and deployment via package — all testable. Intersects mutable/immutable, package structure, and identity. |
| high | cloud-manager.pipelines.code-quality | Code Quality Gates | SonarQube/OakPAL/DOT, severity tiers, Critical vs Important, Security Rating <B, override authority. Directly tested in pipeline scenario questions. |
| high | cloud-manager.dispatcher.configuration | Dispatcher Configuration | Farm files, filters (/type required), rewrite rules, local validation. High exam weight; Dispatcher is core AEM infrastructure. |
| high | cloud-manager.dispatcher.caching | Dispatcher Caching | stat files, statfileslevel, Flush agent, TTL configuration. Cache invalidation is a high-frequency exam topic. |
| high | admin-console.identity.federated-sso | Federated SSO | SAML 2.0 setup, Federated ID requirement, Azure AD gotchas, certificate rotation. Named explicitly in exam domain description. |
| high | cloud-manager.osgi.configuration | OSGi Configuration | Run-mode targeting, factory configs, `.config` vs `.cfg.json` formats. Prerequisite for service user mapping, Sling Models, and deployment. |
| high | monitoring-quality.log-analysis.cloud-manager-logs | Cloud Manager Log Access | 7-day retention, CLI-only tailing, logForwarding.yaml, secrets syntax. Tested in "how do you access logs" scenarios. |
| high | monitoring-quality.log-analysis.log-types | Log Types Reference | Which log file for which use case, dispatcher-only logs, audit log non-forwardability. Tested in diagnostics scenarios. |
| high | cloud-manager.environments.environment-types | Environment Types | Dev/Stage/Prod/RDE topology, sandbox vs production programs. Context for all deployment and pipeline questions. |
| high | cloud-manager.packages.mutable-immutable | Package Types (application/content/container) | Package type classification, MIXED invalid for AEMaaCS, FileVault 1.1.0+ enforcement. |
| medium | cloud-manager.pipelines.frontend-pipeline-config | Frontend Pipeline Config | npm build, dist/, CDN delivery URLs, SiteConfig Sling nodes. Relevant for front-end-focused scenarios. |
| medium | cloud-manager.frontend.module-structure | Frontend Module Structure | ui.frontend, Webpack configs, aem-clientlib-generator, allowProxy. Prerequisite for frontend pipeline questions. |
| medium | cloud-manager.osgi.sling-models | Sling Models | @Model, @Inject, ResourceSuperType, adaptables. Java development pattern questions. |
| medium | cloud-manager.osgi.resource-resolver | Resource Resolver | loginService, ResourceResolverFactory, service user pattern. Required for secure service development. |
| medium | monitoring-quality.scaling.autoscaling | Autoscaling | Adobe-managed, no customer control, Author/Publish/Preview topologies, golden master. |
| medium | cloud-manager.deploy.build-phase | Build Phase (Maven) | Maven archetype, build profiles, `autoInstallSinglePackage`, `cloudManagerTarget`. |
| medium | admin-console.identity.ldap-integration | LDAP Integration | On-premise only. Exam will test LDAP vs. IMS choice. Three OSGi configs, JAAS SUFFICIENT. |
| medium | monitoring-quality.observability.new-relic | New Relic Integration | Sub-account, 30-user cap, 90-day retention, Dynatrace mutual exclusion. |
| medium | monitoring-quality.observability.health-checks | Health Checks | HealthCheck interface, hc.tags gotcha, Cloud Manager Health Assessment. |
| medium | admin-console.support.system-status | System Status and Notifications | Notification profile exact names, Actions Center, Quiet Hours, Update-Free Periods. |
| medium | cloud-manager.dispatcher.filters | Dispatcher Filters | Allow/deny rules, /type required, URL-based vs. path-based filtering. |
| medium | cloud-manager.packages.maven | Maven Configuration for Packages | filevault-package-maven-plugin, bnd-maven-plugin, repositoryStructurePackage. |
| low | admin-console.support.ticket-submission | Support Ticket Submission | P1-P4 priorities, roles, named contacts. Operational procedure, tested lightly. |
| low | cloud-manager.pipelines.config-pipeline | Config Pipeline | Pipeline type for YAML configs. Covered sufficiently in cdn-configuration and log-forwarding contexts. |
| low | monitoring-quality.observability.dynatrace | Dynatrace Integration | Mentioned as mutually exclusive with New Relic; no dedicated file; unlikely to be tested in depth. |

---

## Recommended Order

The following sequence accounts for prerequisites, exam domain weights, and study strategy (foundational → high-weight → edge cases).

**Phase 1: Architecture Foundations (study first — everything else depends on these)**

1. `cloud-manager.environments.mutable-immutable` — The single most important conceptual foundation
2. `cloud-manager.environments.environment-types` — Context for all pipeline and deployment questions
3. `admin-console.identity.ims-integration` — Authentication foundation for all identity questions
4. `cloud-manager.osgi.configuration` — OSGi is the glue layer; required before Sling Models, resource resolver, repoinit

**Phase 2: Package and Deployment Mechanics (high exam weight — CD domain = 33%)**

5. `cloud-manager.packages.structure` — filter.xml, workspace filters, import modes
6. `cloud-manager.packages.mutable-immutable` — Package type classification
7. `cloud-manager.packages.dependencies` — embeddeds vs subPackages, container structure
8. `cloud-manager.environments.repoinit` — Service users and ACL-as-code
9. `cloud-manager.osgi.service-user-mapping` — Service user OSGi mapping pattern
10. `cloud-manager.deploy.build-phase` — Maven build configuration
11. `cloud-manager.deploy.deploy-phase` — Rolling deployment, three-phase mutable, production approval

**Phase 3: Pipeline Types and Quality Gates (high exam weight)**

12. `cloud-manager.pipelines.full-stack-pipeline` — Primary pipeline type, end-to-end flow
13. `cloud-manager.pipelines.code-quality` — SonarQube/OakPAL/DOT, severity tiers, override rules
14. `cloud-manager.pipelines.config-pipeline` — YAML config deployment, cdn.yaml, logForwarding.yaml
15. `cloud-manager.frontend.module-structure` — ui.frontend, Webpack, clientlib generation
16. `cloud-manager.pipelines.frontend-pipeline-config` — Frontend pipeline requirements

**Phase 4: Content Delivery and Caching (high exam weight)**

17. `monitoring-quality.scaling.cdn-configuration` — Fastly, BYOCDN, cdn.yaml, cache headers
18. `cloud-manager.dispatcher.configuration` — Farm files, vhosts, local validation
19. `cloud-manager.dispatcher.caching` — stat files, statfileslevel, Flush agent
20. `cloud-manager.dispatcher.filters` — Allow/deny filter rules, security patterns
21. `monitoring-quality.scaling.autoscaling` — Adobe-managed scaling, pod topology

**Phase 5: Identity and Access Control (medium-high exam weight — Configure AEM domain = 18%)**

22. `admin-console.identity.user-group-sync` — Login-triggered sync, IMS groups vs. ACLs
23. `admin-console.identity.federated-sso` — SAML 2.0, Federated ID, certificate management
24. `admin-console.identity.ldap-integration` — On-premise only, three OSGi configs, JAAS

**Phase 6: Monitoring, Logging, and Observability**

25. `monitoring-quality.log-analysis.log-types` — All log files and their sources
26. `monitoring-quality.log-analysis.cloud-manager-logs` — Log access, retention, forwarding
27. `monitoring-quality.observability.new-relic` — New Relic sub-account, limits, exclusivity
28. `monitoring-quality.observability.health-checks` — HealthCheck interface, AEMaaCS specifics
29. `admin-console.support.system-status` — Notification profiles, Quiet Hours, status.adobe.com

**Phase 7: Java Development Patterns (medium weight, prerequisite-heavy)**

30. `cloud-manager.osgi.sling-models` — @Model, adaptables, injection
31. `cloud-manager.osgi.resource-resolver` — Resource resolver factory, service users in code

**Phase 8: Operational Procedures (low priority — scan for exam traps)**

32. `admin-console.support.ticket-submission` — P1-P4, roles, named contacts
33. `cloud-manager.packages.maven` — Plugin configuration details
34. Remaining specialized files — review for edge cases and gotchas

**Phase 9: Fill Known Gaps (requires additional research)**

35. RDE (Rapid Development Environment) — `aio aem:rde:*` CLI commands, no-pipeline deployment
36. Sling Content Distribution — Distribution queues, ForwardDistributionAgent, troubleshooting
37. WAF and Traffic Filtering Rules — `cdn.yaml` traffic filter syntax, rate limiting, IP blocking
38. Functional and UI Testing — JUnit framework, maven-failsafe-plugin, test container specifics
