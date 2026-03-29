# AEM Health Checks

**Topic ID:** monitoring-quality.performance-monitoring.health-checks
**Researched:** 2026-03-29T00:00:00Z

## Overview

AEM Health Checks are a system monitoring framework built on Apache Sling (and now transitioning to Felix) Health Checks that allow operators and developers to assess the runtime health of an AEM instance [1]. The framework exposes health status through multiple interfaces: a Touch UI Operations Dashboard, JMX MBeans, HTTP endpoints (JSON/HTML/TXT), and OSGi consoles [1][2]. Each health check is an OSGi service that implements the `HealthCheck` interface, executes a discrete condition check, and returns a `Result` carrying a status and optional diagnostic messages [3].

Health checks are central to AEM operations because they provide both human-readable (dashboard cards) and machine-readable (HTTP/JMX) views of system health, enabling integration with external monitoring tools like Nagios or load balancer health probes [4][5]. AEM ships with a substantial set of out-of-the-box (OOTB) checks covering query performance, replication queues, disk space, log errors, security posture, and more [1]. Developers can extend the system by writing custom health checks and grouping related checks into composite health checks using tags [2][3].

Health checks are a primary mechanism in the Operations Dashboard at Tools > Operations > Health Reports [1]. Understanding how OOTB checks work, how to implement custom checks, and how tags drive composite aggregation is directly exam-relevant for the AEM DevOps Engineer Expert certification.

## Key Concepts

- **HealthCheck interface** — All health checks (OOTB and custom) implement `org.apache.sling.hc.api.HealthCheck` (or `org.apache.felix.hc.api.HealthCheck` post-migration), which defines a single `execute()` method returning a `Result` [3].

- **Result.Status values** — Health checks return one of three statuses: `OK`, `WARN`, or `CRITICAL`. A composite health check returns `OK` only if every aggregated individual check also returns `OK` [1][2].

- **hc.tags** — A multi-value OSGi service property (`String[]`) that assigns tags to a health check. Tags are the primary mechanism for grouping, filtering, and composite aggregation [2][3].

- **filter.tags** — A property specific to **Composite Health Checks** that specifies which tags to aggregate. The composite collects all individual checks whose `hc.tags` match any tag in `filter.tags` [2].

- **hc.name** — The display name of the health check, shown in the Operations Dashboard card and used in JMX MBean naming [3].

- **hc.mbean.name** — An optional property that makes health check results accessible via JMX. If set, the check is exposed as an MBean under the `org.apache.sling.healthcheck` domain [3][1].

- **Composite Health Check** — An aggregating check implemented via `org.apache.sling.hc.core.impl.CompositeHealthCheck` factory. It uses `filter.tags` to collect matching individual checks and rolls up to a single status [2].

- **Operations Dashboard** — The primary UI at `Tools > Operations > Health Reports` (direct URL: `/libs/granite/operations/content/healthreports/healthreportlist.html`) that renders health check results as status cards [1].

- **Health Check Servlet** — An optional HTTP endpoint (disabled by default) that exposes health check results in JSON, JSONP, HTML, or TXT formats. Configured with OSGi PID `org.apache.sling.hc.core.impl.servlet.HealthCheckExecutorServlet` with `servletPath=/system/health` [3][4].

- **Sling vs. Felix** — The Sling Health Check runtime (`org.apache.sling.hc.*`) is **deprecated** and superseded by Felix Health Checks (`org.apache.felix.hc.*`). AEM 6.5 still primarily uses Sling; migration is in progress [3].

## Technical Details

### HealthCheck Interface

The core interface is minimal [3]:

```java
public interface HealthCheck {
    public Result execute();
}
```

The `execute()` method should complete quickly. Checks requiring external system access should use `hc.async.cronExpression` for asynchronous scheduled execution [3].

### OSGi Service Properties

All health checks are registered as OSGi services with the following properties [3]:

| Property | Type | Purpose |
|---|---|---|
| `hc.name` | String | Display name in dashboard/JMX |
| `hc.tags` | String[] | Tags for filtering and composite aggregation |
| `hc.mbean.name` | String | JMX MBean name (optional) |
| `hc.async.cronExpression` | String | Cron schedule for async execution |
| `hc.resultCacheTtlInMs` | Long | Per-check TTL override (default: 2000ms) |
| `hc.warningsStickForMinutes` | Long | Persist WARN/CRITICAL status across executions |

### Custom Health Check Implementation

```java
@Component(service = HealthCheck.class,
property = {
    HealthCheck.NAME + "=My Custom Check",
    HealthCheck.TAGS + "=custom,production",
    HealthCheck.MBEAN_NAME + "=myCustomHealthCheckMBean"
})
public class MyCustomHealthCheck implements HealthCheck {
    @Override
    public Result execute() {
        FormattingResultLog resultLog = new FormattingResultLog();
        // perform check logic
        if (conditionOk) {
            return new Result(Result.Status.OK, "All conditions met");
        } else {
            resultLog.critical("Condition X failed: {}", detail);
            return new Result(resultLog);
        }
    }
}
```
[1][2]

### Adding Custom HC to the Operations Dashboard

Create a node of type `nt:unstructured` at `/apps/granite/operations/config/hc` (or `/apps/settings/granite/operations/hc` in newer AEM versions) with properties [1]:

- `sling:resourceType` = `granite/operations/components/mbean`
- `resource` = `/system/sling/monitoring/mbeans/org/apache/sling/healthcheck/HealthCheck/{hc.mbean.name}`

### Composite Health Check Configuration (OSGi)

Navigate to `/system/console/configMgr` and find **Apache Sling Composite Health Check**. Key properties [2]:

| Property | Purpose |
|---|---|
| `hc.name` | Name of the composite group |
| `hc.tags` | Tags assigned to this composite (if it participates in a higher-level composite) |
| `hc.mbean.name` | MBean name for the composite |
| `filter.tags` | Tags to aggregate — collects all checks matching any of these tags |

Two default composite checks ship with AEM: **System Checks** and **Security Checks** [2].

### Health Check Servlet (HTTP Endpoint)

Disabled by default. Enable by creating an OSGi config with PID `org.apache.sling.hc.core.impl.servlet.HealthCheckExecutorServlet` and setting `servletPath=/system/health` [3][4].

Example URL with tag filtering [4]:

```
/system/health?tags=client,author&combineTagsWithOr=false&httpStatus=WARN:418&httpStatus=ERROR:500&format=json
```

Key URL parameters:
- `tags` — comma-separated list of tags to filter checks
- `combineTagsWithOr` — `true` (OR logic) or `false` (AND logic) for tag combination
- `httpStatus` — map a health status to a specific HTTP response code (e.g., `WARN:418`)
- `format` — `html`, `json`, `jsonp`, `txt`

**Default HTTP response codes**: `200` if ALL checks return OK; `503` if any check returns CRITICAL [4][5].

### Tag Filtering Syntax (Negative Tags)

The `HealthCheckFilter` supports negative tag syntax: `-security,sling` selects all health checks with the `sling` tag but **not** the `security` tag [3].

### Felix Console Access

All registered health checks are visible at `/system/console/healthcheck` without any extra configuration [1][2].

### HC Executor Configuration

Global execution settings via `org.apache.sling.hc.core.impl.executor.HealthCheckExecutorImpl` [3]:

- `timeoutInMs` — default 2000ms per check
- `longRunningFutureThresholdForCriticalMs` — default 300000ms (5 min); checks exceeding this become CRITICAL
- `resultCacheTtlInMs` — default 2000ms result caching

## Common Patterns

**Scenario: Proactive monitoring with Nagios or PagerDuty.** Enable the Health Check Servlet at `/system/health`. Configure a Nagios script that calls the endpoint with relevant tags (e.g., `?tags=production&format=json`), maps exit codes to Nagios convention (0=OK, 1=WARN, 2=CRITICAL), and pages the NOC on CRITICAL status. This is the recommended AMS monitoring integration pattern [4].

**Scenario: Load balancer health probe.** The AMS Dispatcher setup includes CGI-bin scripts that proxy to AEM health check endpoints. The five scripts (`checkauthor`, `checkpublish`, `checkeither`, `checkboth`, `healthy`) allow fine-grained control over which backend failure causes the dispatcher to be removed from load balancer rotation. A 503 response from the health endpoint signals unhealthy; 200 signals healthy [5].

**Scenario: Custom security audit check.** Implement a custom `HealthCheck` with `hc.tags=security`. It will automatically aggregate under the OOTB **Security Checks** composite (which uses `filter.tags=security`) without any additional configuration [1][2].

**Scenario: Dashboard card for a new composite group.** Register an `org.apache.sling.hc.core.impl.CompositeHealthCheck` OSGi config with `hc.name=My App Checks`, `hc.mbean.name=myAppChecks`, and `filter.tags=myapp`. Tag custom health checks with `hc.tags=myapp`. Then create the dashboard node at `/apps/granite/operations/config/hc/myAppChecks` pointing to the MBean [1][2].

**Scenario: Async check for expensive operations.** For health checks that query external systems or run expensive computations, set `hc.async.cronExpression=0 0/5 * * * ?` to execute every 5 minutes asynchronously. The cached last result is served for subsequent synchronous requests [3].

## Gotchas

**FormattingResultLog WARN auto-promotion.** When using `FormattingResultLog`, adding ANY log message automatically promotes the Result to WARN unless the entry is explicitly logged at info level or the final Result status is explicitly set to OK. This is a common implementation mistake that causes false WARN states [2][3].

**Dashboard node path discrepancy.** Older AEM 6.x documentation references `/apps/granite/operations/config/hc` while newer documentation (AEM 6.5) refers to `/apps/settings/granite/operations/hc`. Both paths may work depending on the AEM version — verify with the target instance [1].

**Health Check Servlet is disabled by default.** The HTTP endpoint at `/system/health` does NOT exist until explicitly enabled via OSGi configuration. Many ops teams miss this and cannot integrate with external monitoring tools [3][4].

**Servlet has no access control.** By design, the Health Check Servlet performs no authentication. This means it can detect authentication system failures — but it also means the endpoint should be protected at the network/dispatcher level in production [3].

**filter.tags vs hc.tags confusion.** `hc.tags` is on the individual check (what tags it belongs to). `filter.tags` is on the composite check (what tags it should collect). Mixing these up is the #1 configuration error in composite check setup [2][3].

**Sling vs. Felix deprecation.** The Sling HC runtime (`org.apache.sling.hc.*`) is deprecated; Felix Health Checks (`org.apache.felix.hc.*`) is the current standard. In AEM 6.5 and AEM as a Cloud Service contexts, exam questions may reference both. Key migration change: `@SlingHealthCheck` annotation replaced by Felix annotation; `hc.warningsStickForMinutes` renamed to `hc.keepNonOkResultsStickyForSec` with unit change from minutes to seconds [3].

**AEM as a Cloud Service.** The traditional Sling Health Check Operations Dashboard is NOT available on AEM as a Cloud Service. AEMCS uses Cloud Manager's Health Assessment reports instead [1][6].

**Composite returns CRITICAL if any child is CRITICAL.** A composite health check rolls up to the worst status of its children — not a majority vote. One CRITICAL child means the entire composite is CRITICAL [1][2].

**Negative tags require no space.** The negative tag syntax is `-tagname` (hyphen immediately before the tag, no space). A query like `?tags=-security,sling` selects checks with tag `sling` but NOT `security` [3].

## Sources

[1] **Operations Dashboard | Adobe Experience Manager 6.5**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-65/content/sites/administering/operations/operations-dashboard
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: OOTB health check list, Operations Dashboard access paths, composite health check configuration, custom HC dashboard node creation, status states (OK/WARN/CRITICAL), MBean access domain, default composite groups (System Checks, Security Checks).

[2] **AEM Health Checks Tags Configuration (Adobe Experience League)**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-65/content/sites/administering/operations/operations-dashboard
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: hc.tags vs filter.tags distinction, composite health check configuration via OSGi (PID: org.apache.sling.hc.core.impl.CompositeHealthCheck), how aggregation works, auto-registration behavior for tagged checks.

[3] **Apache Sling Health Check Tools (Deprecated) & Migration Guide**
    URL: https://sling.apache.org/documentation/bundles/sling-health-check-tool-deprecated.html
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: HealthCheck interface definition, all OSGi service properties (hc.name, hc.tags, hc.mbean.name, hc.async.cronExpression, hc.resultCacheTtlInMs, hc.warningsStickForMinutes), HC Executor configuration, HTTP servlet configuration, negative tag syntax, CORS behavior, access control note, Felix migration property renaming.

[4] **Monitoring AEM in Adobe Managed Services with Sling Health Checks | DanKlco.com**
    URL: https://danklco.com/posts/2018-09-monitoring-aem-ams-sling-health-checks/
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: Health Check Servlet URL parameters (tags, combineTagsWithOr, httpStatus, format), Nagios integration script pattern, HTTP 200/503 response behavior, practical AMS monitoring setup.

[5] **AMS Dispatcher Health Check | Adobe Experience Manager**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-learn/ams/dispatcher/health-check
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: Five AMS CGI-bin health check scripts (checkauthor, checkpublish, checkeither, checkboth, healthy), load balancer integration, HTTP 503 response for unhealthy state, cron-based monitoring with RELOAD_MODE.

[6] **System live monitoring with Apache Sling health checks tools | Axamit**
    URL: https://axamit.com/blog/adobe-experience-manager/health-check/
    Accessed: 2026-03-29
    Relevance: background
    Extracted: Practical health check configuration examples, FormattingResultLog WARN auto-promotion behavior, cache TTL configuration, overview of HC Executor settings.
