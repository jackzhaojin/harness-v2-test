# AEM Log Types and Locations

**Topic ID:** monitoring-quality.log-analysis.log-types
**Researched:** 2026-03-29T00:00:00Z

## Overview

AEM as a Cloud Service (AEMaaCS) provides a structured logging system composed of distinct log types, each serving a specific diagnostic or audit purpose. Logs are grouped into three tiers: AEM application-level logs (`aemerror`, `aemrequest`, `aemaccess`), Apache HTTPD/Dispatcher logs (`httpdaccess`, `httpderror`, `aemdispatcher`) available only on the Publish tier, and CDN logs [1][2]. Understanding which log to consult for a given problem — and where logs are accessible — is a core operational skill tested in the AEM DevOps Engineer certification.

In AEMaaCS, the on-premise file path model (`/crx-quickstart/logs/`) is used only on the local SDK quickstart. In cloud environments, logs are accessed via Cloud Manager (UI download) or the Adobe I/O CLI (`aio` commands), not by direct file system access [1][3]. All log activity from multiple pods within a service is consolidated into a single logical log file, with pod identifiers embedded in each line for filtering [2].

A critical cloud-specific constraint shapes exam scenarios: **custom-named log files are not supported in AEMaaCS**. Any Java logging that is written to a custom log (e.g., `example.log`) will be invisible via Cloud Manager or the Adobe I/O CLI. All custom log output must be redirected to the default `error.log` [1][2].

## Key Concepts

- **`error.log` / `aemerror`** — The primary Java application log. Captures all Java log statements (DEBUG, INFO, WARN, ERROR) from the AEM runtime and custom application code. In AEMaaCS, this is the only accessible destination for custom Java logging; all Sling/OSGi loggers must be configured to write here [1][2].

- **`request.log` / `aemrequest`** — Logs every HTTP request to the AEM instance, recording both the incoming request and the outgoing response as two separate log lines per transaction [4]. Used for performance analysis (identifying slow requests) and debugging HTTP-level issues.

- **`access.log` / `aemaccess`** — A condensed HTTP access log that records each request as a single line (similar to Apache/Nginx Combined Log Format), including IP, status code, bytes transferred, and response time [4]. Used for traffic analysis. Requests served from Dispatcher cache or upstream CDN are **not** reflected here [1].

- **`audit.log`** — Tracks repository-level changes: page edits, asset operations, and replication events made by users or the system [4]. In AEMaaCS, audit events are stored as JCR nodes under `/var/audit` — not as a flat log file — and therefore cannot be forwarded to Splunk or other log aggregators [5].

- **Dispatcher logs** (`httpdaccess`, `httpderror`, `aemdispatcher`) — Available only on the **Publish** tier. `aemdispatcher` is especially important for debugging cache behavior (which URLs are cached/excluded). `httpderror` helps debug Apache module issues such as `mod_rewrite` rules [2].

- **CDN logs** — JSON-formatted logs produced by the Fastly CDN layer. Contain a `cache` field with values `HIT`, `MISS`, `PASS`, or `EXPIRED`, enabling cache hit ratio analysis [6]. Each globally distributed logging server generates a new file every few seconds; file format: `YYYY-MM-DDThhss.sss-uniqueid.log` [1].

- **Log consolidation (pods)** — In AEMaaCS, all pods in a service (Author or Publish) write to a single logical log file. Each log entry includes a pod identifier (format: `cm-p[ID]-e[ID]-aem-[service]-[pod-name]`) to enable pod-level filtering [2].

- **Log retention** — Logs in Cloud Manager are retained for a maximum of **seven days** [3].

- **Log level by environment** — Adobe recommends DEBUG for Development, WARN for Stage, and ERROR for Production [1][2]. Setting higher verbosity in production can flood logs and degrade AEM performance.

- **Log forwarding** — AEMaaCS supports forwarding `aemerror`, `aemrequest`, `aemaccess`, and CDN logs to external destinations (Splunk, Datadog, Elasticsearch, Azure Blob Storage, HTTPS endpoints). `audit.log` data stored in `/var/audit` (JCR) cannot be forwarded this way [1][5].

## Technical Details

### Local SDK Log Locations

On the local AEM SDK quickstart, logs reside at:

```
/crx-quickstart/logs/error.log      # Java application log
/crx-quickstart/logs/request.log    # HTTP request + response (two lines each)
/crx-quickstart/logs/access.log     # HTTP access summary (one line per request)
/crx-quickstart/logs/audit.log      # Repository audit trail
```

Dispatcher logs on the local SDK are accessed via Docker container commands, not a file path [2].

### Cloud Manager Log Names

In AEMaaCS cloud environments, log names differ from the local SDK file names [1][3]:

| Service     | Cloud Manager Log Name | Equivalent Local File         |
|-------------|------------------------|-------------------------------|
| author      | `aemerror`             | `error.log`                   |
| author      | `aemrequest`           | `request.log`                 |
| author      | `aemaccess`            | `access.log`                  |
| publish      | `aemerror`             | `error.log`                   |
| publish      | `aemrequest`           | `request.log`                 |
| publish      | `aemaccess`            | `access.log`                  |
| publish      | `cdn`                  | CDN JSON log                  |
| dispatcher  | `httpdaccess`          | Apache HTTPD access log       |
| dispatcher  | `httpderror`           | Apache HTTPD error log        |
| dispatcher  | `aemdispatcher`        | Dispatcher module log         |

### Accessing Logs via Adobe I/O CLI

```bash
# List available log options
aio cloudmanager:list-available-log-options --programId 5 1884

# Download a specific log file
aio cloudmanager:download-logs --programId 5 1884 author aemerror

# Tail a log in real-time
aio cloudmanager:tail-log --programId 5 1884 author aemerror
```

[3]

### OSGi Log Configuration (Git-managed)

Java log levels in AEMaaCS are configured via OSGi `.cfg.json` files stored in Git and deployed through Cloud Manager pipelines [1]:

```json
{
  "org.apache.sling.commons.log.names": ["com.example.myapp"],
  "org.apache.sling.commons.log.level": "DEBUG"
}
```

Key constraint: the `org.apache.sling.commons.log.file` property must NOT be changed — log output must remain directed to `logs/error.log` [1].

### `request.log` Format

Two log lines per HTTP transaction [4]:

```
-> GET /content/mysite/en.html HTTP/1.1
<- 200 text/html; charset=UTF-8 42ms
```

The `->` prefix marks an incoming request; `<-` marks the outgoing response with status, content type, and response time in milliseconds.

### `access.log` Format

One line per request in Combined Log Format [4]:

```
127.0.0.1 - admin [01/Jan/2024:12:00:00 +0000] "GET /content/mysite/en.html HTTP/1.1" 200 1234
```

### CDN Log Format (JSON)

CDN logs are JSON with a `cache` field indicating cache status [6]:

```json
{
  "timestamp": "2024-01-01T12:00:00Z",
  "url": "/content/mysite/en.html",
  "cache": "HIT",
  "status": 200,
  "ttfb": 12
}
```

Cache field values: `HIT` (served from CDN cache), `MISS` (fetched from origin), `PASS` (explicitly non-cacheable), `EXPIRED` (cache entry had expired).

### Audit Log in AEMaaCS

Audit events are not stored in a flat file but as JCR nodes under `/var/audit` [5]. They are accessible via the AEM UI at **Tools > Security > Audit Log** or via the Jackrabbit API. Default tracking covers:
- Page operations (create, edit, delete, activate/replicate)
- DAM/Asset operations
- Replication events

Not tracked by default: ACL changes, user/group management events [5].

## Common Patterns

**Scenario: Debugging a slow page response**
Consult `aemrequest` (request.log) — it logs both the request start and the response with timing. Slow responses show a high millisecond value on the `<-` response line. Cross-reference with `aemerror` to find any concurrent Java exceptions [2][4].

**Scenario: Investigating why a page is not being cached**
Check `aemdispatcher` (Dispatcher log) for cache exclusion messages and the `X-Cache` response header. A `MISS` or `PASS` value in CDN logs means the Dispatcher or CDN rejected caching. Requests that hit the Dispatcher cache will appear in `httpdaccess` but not in `aemaccess` (AEM Publish access log) [1][6].

**Scenario: Auditing which user deleted content**
Query the AEM audit log at **Tools > Security > Audit Log** in the AEM UI, or inspect JCR nodes under `/var/audit`. Note that ACL and user management changes are not captured here — those require an external IDP audit trail [5].

**Scenario: Analyzing CDN cache efficiency**
Download CDN logs from Cloud Manager and use Adobe's CDN Log Analysis Tooling (ELK, Splunk, or Jupyter Notebook) to compute the cache hit ratio. Adobe best practice is a cache hit ratio of 90% or higher [6].

**Scenario: Enabling verbose Java logging for a deployment**
Add an environment-specific OSGi config in Git (e.g., under `config.dev/`) that sets the target package to `DEBUG`, commit, and deploy via Cloud Manager pipeline. In production, keep log level at ERROR or WARN to avoid performance degradation [1].

## Gotchas

- **Custom log files are not accessible in cloud.** If you configure a Sling Logger to write to a custom filename (e.g., `logs/myapp.log`), that file will never appear in Cloud Manager. All logs must write to `logs/error.log` [1][2]. This is a very commonly tested constraint.

- **`access.log` does not capture cached requests.** Requests served from the Dispatcher cache or CDN never reach the AEM application layer, so they are absent from `aemaccess`. Traffic analysis from `aemaccess` alone undercounts actual user traffic; CDN logs are needed for full picture [1].

- **`request.log` produces two lines per request; `access.log` produces one.** Confusing these is a classic exam trick — `request.log` appears to have twice as many entries, but each pair is one transaction [4].

- **Audit log is a JCR store, not a file.** In AEMaaCS, `audit.log` (as known on-premise) does not exist as a file accessible via Cloud Manager. Audit data lives in the JCR at `/var/audit` and cannot be tailed or forwarded to Splunk via the standard log forwarding mechanism [5].

- **Audit log does not track ACL/user management events.** If an exam scenario asks about tracking user permission changes or group membership changes, the answer is not the audit log — it requires an external IDP [5].

- **Dispatcher logs exist only on Publish, not Author.** `httpdaccess`, `httpderror`, and `aemdispatcher` are available only for the Publish Dispatcher service. Authors have no Dispatcher in front of them [1][2].

- **`TRACE` log level is not supported in AEMaaCS cloud environments.** The maximum supported verbosity is `DEBUG`. Attempting to configure TRACE will have no effect [1].

- **Log retention is only 7 days in Cloud Manager.** If you need longer retention for compliance or investigation, you must configure log forwarding to an external SIEM (Splunk, Datadog, etc.) before that window expires [3].

- **Pod ID in log lines is important for debugging multi-pod issues.** When an issue only affects one pod out of a scaled set, the pod identifier in each log line (`cm-p[ID]-e[ID]-...`) is the way to isolate activity to the failing instance [2].

- **AEMaaCS audit log retention changed.** Adobe shifted from longer retention (previously discussed as years) to automatic purging, with retention as short as 7 days for some data. Compliance requirements demanding multi-year retention must be handled by externalizing audit events [5].

## Sources

[1] **Logging for AEM as a Cloud Service | Adobe Experience Manager**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/developing/logging
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Log types overview (AEM, Dispatcher, CDN), log level recommendations per environment, OSGi configuration constraints, custom log file restriction, TRACE level unsupported, log forwarding destinations.

[2] **Debugging AEM as a Cloud Service using logs | Adobe Experience Manager Learn**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-learn/cloud-service/debugging/debugging-aem-as-a-cloud-service/logs
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Cloud Manager log names per service (aemerror, aemrequest, aemaccess, httpdaccess, etc.), pod ID format and consolidation behavior, custom log file restriction confirmation, environment-specific OSGi variable approach, debugging approach for slow requests.

[3] **Access and Manage Logs | Adobe Experience Manager (Cloud Manager)**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/using-cloud-manager/manage-logs
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: 7-day retention policy, Cloud Manager UI download steps, Adobe I/O CLI commands for download and tail, Additional Publish Regions per-region log access.

[4] **AEM Logs in Detail — request.log, access.log, audit.log differences**
    URL: http://www.sgaemsolutions.com/2017/04/aem-logs-in-detail-part-1.html
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: request.log two-line-per-request format (-> and <- prefixes), access.log one-line Combined Log Format, audit.log Jackrabbit repository tracking behavior, on-premise file paths under /crx-quickstart/logs/.

[5] **AEMaaCS and Audit Log — Adobe Experience League Community**
    URL: https://experienceleaguecommunities.adobe.com/t5/adobe-experience-manager/aemaacs-and-audit-log/td-p/749087
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: Audit events stored as JCR nodes at /var/audit (not flat file), cannot be forwarded to Splunk, limited event coverage (no ACL/user management), retention change from multi-year to 7-day auto-purge, community recommendation to use external IDP for user audit trails.

[6] **CDN Cache Hit Ratio Analysis | Adobe Experience Manager Learn**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-learn/cloud-service/caching/cdn-cache-hit-ratio-analysis
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: CDN log JSON format, cache field values (HIT/MISS/PASS/EXPIRED), 90%+ cache hit ratio best practice, CDN Log Analysis Tooling (ELK, Splunk, Jupyter), CDN log file naming pattern (YYYY-MM-DDThhss.sss-uniqueid.log).
