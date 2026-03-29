# New Relic Integration

**Topic ID:** monitoring-quality.performance-monitoring.new-relic
**Researched:** 2026-03-29T00:00:00Z

## Overview

New Relic One is the built-in application performance monitoring (APM) solution bundled with AEM as a Cloud Service. Every production program automatically receives a dedicated New Relic One sub-account provisioned by Adobe, providing teams with performance visibility into Author, Publish, and Preview services at no additional cost [1]. The integration is pre-instrumented — Adobe manages the Java agent deployment — so customers gain immediate access to transaction traces, JVM metrics, JCR query performance, and pre-built dashboards without any agent installation [2].

The offering is intentionally scoped for observability only. Unlike a full New Relic subscription, the bundled tier grants read-only access with no support for alerting, logging, or API integrations [1]. Adobe handles operational alerting separately through its own notification mechanisms. Understanding this scope limitation is critical for the exam — candidates are frequently tested on what AEM's New Relic offering does and does not include.

New Relic coexists with Dynatrace as AEM Cloud Service's two supported APM options, but they are mutually exclusive. Enabling Dynatrace causes the New Relic APM agent to stop collecting data entirely [3][4]. Teams must choose one or the other, and that choice has significant operational implications covered in detail below.

## Key Concepts

- **Sub-account model** — Adobe provisions a New Relic One sub-account per AEM program (not per environment). It is automatically created when a production program is provisioned, but requires explicit activation before data flows [1].
- **Pre-instrumented Java agent** — Adobe deploys and manages the New Relic Java APM agent. Customers cannot install custom agents or add custom instrumentation beyond what Adobe exposes [2].
- **Read-only access tier** — All users added to the sub-account receive "Restricted" access: they can view metrics and dashboards but cannot create alert policies, configure notification channels, or use API integrations [1].
- **30-user cap** — A maximum of 30 users can be added to the sub-account via Cloud Manager. Users added beyond this limit cannot be accommodated without Adobe support involvement [1].
- **90-day data retention** — APM data is retained for 90 days, giving a maximum lookback window for trend analysis [2].
- **30-day inactivity shutdown** — If no user logs in to the New Relic sub-account for 30 consecutive days, the APM agent automatically stops. Data collection does not resume until the sub-account is manually reactivated and a pipeline is re-run [1].
- **NRQL (New Relic Query Language)** — The query language used to build custom dashboards and ad-hoc investigations. It uses SQL-like syntax and can query JMX MBean metrics, transaction data, JVM stats, and more [2].
- **JMX MBeans exposure** — Adobe exposes AEM-specific JMX MBeans within New Relic, visible in pre-configured dashboards. These beans surface slow queries, JCR transaction metrics, workflow performance, and replication queue data [2].
- **Dynatrace mutual exclusivity** — Enabling Dynatrace on AEM Cloud Service stops the New Relic APM agent at the JVM level. This is by design; running both simultaneously causes conflicts [3][4].
- **Non-IMS login** — New Relic accounts use email/password authentication, not Adobe IMS SSO. Users receive a password-reset email when their account is created and must activate it through that link [1].

## Technical Details

### Activation Workflow

Activation requires a user with the **Business Owner** role in Cloud Manager [1]:

1. Log in to [my.cloudmanager.adobe.com](https://my.cloudmanager.adobe.com) and select the organization.
2. Navigate to the program's **Environments** card.
3. Click `...` and select **Activate New Relic**.
4. Run a pipeline for the target environment to successful completion.

> Critical: Simply clicking "Activate" is not sufficient. The pipeline run is required to push the activation configuration into the environment. Without a successful pipeline execution, the agent does not start transmitting data [1].

After activation, users are managed separately. Business Owner or Deployment Manager roles in Cloud Manager can add/remove users via the **Manage Users** option on the Environments card [1].

### User Account Activation

Each user receives an email from New Relic after being added. To activate the account [1]:

1. Click the link in the New Relic confirmation email.
2. On the New Relic sign-in page, click **Forgot your password?**
3. Enter the email address and select **Send my reset link**.
4. Follow the second email link to confirm the account.

> Note: Business Owners and Deployment Managers who manage New Relic users must also add themselves as users — their Cloud Manager role does not automatically grant them New Relic access [1].

### Pre-Built Dashboards

AEM Cloud Service ships with 4–5 pre-configured dashboards [2]:

- **Sites performance** — Page request throughput, response times, error rates
- **Assets** — Asset processing metrics
- **Index** — Index query performance and slow query reporting
- **JVM/Infrastructure** — Garbage collection, memory usage, thread pool utilization, CPU

Within each dashboard, widgets expose specific MBean-backed metrics. The slow queries widget, for example, surfaces JCR query execution times from the exposed MBeans, helping pinpoint inefficient Oak queries without writing any NRQL [2].

### Transaction Tracing

The APM agent provides method-level transaction traces for all inbound HTTP requests to AEM Author, Publish, and Preview tiers. A typical trace shows [2]:

- Total request duration
- Time breakdown by Java method and class
- External service call latencies
- JCR query execution times
- Component render timing

Clicking into a specific slow transaction reveals a flame-graph-style breakdown identifying which code path or external dependency consumed the most time. This is the primary tool for diagnosing performance regressions after code deployments.

### Custom Dashboards with NRQL

Users can create custom dashboards using NRQL queries [2]. Example pattern for querying slow JCR transactions:

```sql
SELECT average(duration)
FROM Transaction
WHERE appName = 'AEM-Publish-prod'
FACET name
SINCE 7 days ago
LIMIT 20
```

Existing dashboard widgets include their NRQL source, which users can copy and modify to build new widgets. Custom JMX MBean data does not appear in standard APM charts but is queryable via NRQL after selecting the appropriate metric name from the exposed beans [2].

### Dynatrace vs. New Relic Decision Matrix

| Dimension | New Relic (OOTB) | Dynatrace |
|---|---|---|
| Cost | Included with AEM Cloud Service | Requires separate Dynatrace license |
| Setup | Automatic, requires activation | Requires support ticket + credentials |
| Alerting | Not supported | Supported (Davis AI engine) |
| End-to-end tracing | Backend only | Full-stack including frontend |
| AI root cause | Not included | Davis AI (automated root cause) |
| Browser monitoring | Not included | Supported |
| Concurrency with New Relic | N/A | Disables New Relic agent |
| Custom instrumentation | Not supported | Supported |

Dynatrace activation requires submitting a support ticket with environment URL, environment ID, environment token, API access token, and the AEM environment IDs to monitor [4].

## Common Patterns

**Performance diagnosis after a code deployment:**
1. Open New Relic via the Environments card in Cloud Manager or directly at one.newrelic.com.
2. Navigate to APM > select the affected service (Author or Publish).
3. Filter transactions to the deployment window and compare to baseline (prior 7–14 days).
4. Click the slowest transactions to view traces; identify whether the bottleneck is in custom code, JCR queries, or external service calls.
5. If slow queries are the culprit, cross-check in the Index dashboard using the JMX-backed slow query widget.

**JVM health check for scaling decisions:**
Monitor the JVM dashboard during load testing or peak traffic. Garbage collection pause times exceeding 200–300ms repeatedly signal a need for heap tuning or horizontal scaling. Thread pool saturation in combination with high CPU is a leading indicator to scale out Author or Publish pods via Cloud Manager auto-scaling settings.

**Establishing baselines with NRQL:**
Teams should build custom dashboards tracking 7-day rolling averages for key metrics (response time, error rate, throughput) and pin these as the program's performance contract. When a deployment causes a 20%+ deviation, investigation begins in transaction traces.

**Recovering from an inactive sub-account:**
If the APM agent stopped due to 30 days of inactivity, data collection resumes only after re-activating the sub-account via Cloud Manager and re-running a full stack deployment pipeline for the affected environment [1].

## Gotchas

- **Alerting is not available in the OOTB tier.** Exam candidates frequently confuse this because New Relic natively supports alerting in its commercial product. For AEM Cloud Service, New Relic alerting is explicitly excluded. Adobe handles incident notification through its own user notification profiles, not via New Relic alert conditions [1][2].

- **Dynatrace disables New Relic silently at the JVM level.** When Dynatrace OneAgent is enabled, it dynamically disables the New Relic Java agent in the same JVM. No error is raised; data simply stops flowing. Teams that enable Dynatrace and then notice missing New Relic data should not assume a New Relic configuration problem [3][4].

- **Business Owner / Deployment Manager does NOT automatically get New Relic access.** These Cloud Manager roles manage the sub-account but do not automatically create a New Relic user for the role holder. They must explicitly add themselves as a user and activate via the New Relic email flow [1].

- **Pipeline run is required to complete activation.** Activating the sub-account in Cloud Manager UI is only step one. If a pipeline is not run to successful completion, the agent does not start. This is a common failure mode where teams activate the account and wait for data that never arrives [1].

- **Non-IMS authentication.** New Relic does not integrate with Adobe IMS/SSO. Every user must maintain a separate email+password for New Relic. Custom SSO configuration is not supported for Adobe-provisioned sub-accounts [1].

- **Data retention is 90 days, not 3 months exactly.** Some documentation mentions "three months" and some says "90 days." The operative number is 90 days — important for forensic investigations after security incidents or slow regressions [1][2].

- **Custom instrumentation is not allowed.** Because Adobe controls the Java agent, customers cannot add custom New Relic instrumentation annotations or YAML-based custom JMX configurations to extend what is captured. If a metric is not already exposed, it will not appear in New Relic. Dynatrace supports custom instrumentation if this is required [2][4].

- **One sub-account per program, not per environment.** Author, Publish, and Preview services appear as separate applications within the same sub-account. Teams sometimes expect separate accounts for prod vs. stage — those environments all share one sub-account but appear as distinct application names [1].

- **No frontend (browser) monitoring.** New Relic's Real User Monitoring (RUM) and browser agent are not included. Performance issues in JavaScript, Time-to-First-Byte, or CDN behavior are invisible to the OOTB New Relic integration [1][2].

## Sources

[1] **New Relic One | Adobe Experience Manager**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/using-cloud-manager/user-access-new-relic
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Official Adobe documentation covering sub-account activation steps, user management, role requirements, data retention, inactivity policy, feature limitations (no alerting/logging/API), user cap (30), non-IMS auth, pipeline run requirement, and Business Owner role nuances.

[2] **New Relic Essentials for AEM Cloud (Adobe Customer Success Webinar)**
    URL: https://experienceleague.adobe.com/en/docs/events/adobe-customer-success-webinar-recordings/2025/aem2025/new-relic-essentials-aem-cloud
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Pre-built dashboard categories, NRQL query patterns, JMX MBean visibility, transaction trace workflow, JVM monitoring metrics, data retention (90 days), inactivity policy, no custom instrumentation restriction, no frontend monitoring, practical troubleshooting workflow, and NRQL SQL-like syntax description.

[3] **AEM as a Cloud Service Release Notes 2024.1.0 | Adobe Experience Manager**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/release-notes/release-notes/2024/release-notes-2024-1-0
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: Confirmation that New Relic APM stops collecting data when Dynatrace is enabled; first official documentation of this mutual exclusivity.

[4] **Dynatrace | Adobe Experience Manager**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/using-cloud-manager/dynatrace
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: Dynatrace activation requirements (support ticket, environment credentials, API tokens), Dynatrace licensing model (Kubernetes full-stack container-based), confirmation that enabling Dynatrace disables New Relic, and comparison of Dynatrace features (Davis AI, frontend monitoring, custom instrumentation).
