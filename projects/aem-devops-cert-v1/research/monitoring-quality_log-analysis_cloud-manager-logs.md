# Accessing Logs via Cloud Manager

**Topic ID:** monitoring-quality.log-analysis.cloud-manager-logs
**Researched:** 2026-03-29T00:00:00Z

## Overview

In AEM as a Cloud Service, logs are not accessible via the file system as they would be in on-premises or Managed Services deployments. Instead, Cloud Manager is the gateway for accessing, downloading, and streaming logs across Author, Publish, and Dispatcher services [1]. Cloud Manager aggregates logs from all pods in a given environment into a unified view, making it the primary operational touchpoint for debugging and monitoring [2].

Log access is available through two mechanisms: the Cloud Manager web UI for point-in-time downloads, and the Adobe I/O CLI (with Cloud Manager plugin) for programmatic download and real-time streaming (tailing) [1]. Beyond direct access, AEM as a Cloud Service supports self-service log forwarding to external systems such as Splunk, Datadog, Elasticsearch, and Azure Blob Storage via a `logForwarding.yaml` configuration file deployed through a dedicated Cloud Manager pipeline [3]. This external forwarding capability is essential for organizations with centralized observability platforms.

Log retention in Cloud Manager is limited to seven days [1]. This constraint, combined with the inability to SSH into running containers, makes log forwarding to external destinations a best practice for production environments requiring longer audit trails or real-time alerting.

## Key Concepts

- **Cloud Manager UI log access** — Navigate to the Environments card on the Overview page, select the ellipsis menu for an environment, and choose "Download Logs." A service dropdown lets you select Author, Publish, or Dispatcher [1]. Downloads are organized by day.

- **Adobe I/O CLI tailing** — Real-time log streaming is only available via CLI, not the UI. The command `aio cloudmanager:tail-log <ENV_ID> <SERVICE> <LOG_NAME>` streams logs as they are generated [2]. This is the primary tool for live debugging.

- **Available log types** — Three logical sets: AEM application logs (`aemerror`, `aemaccess`, `aemrequest`), Apache/Dispatcher logs (`httpdaccess`, `httperror`, `aemdispatcher`), and CDN logs (JSON format, available only via log forwarding or CLI tailing) [2][4].

- **Seven-day retention** — Cloud Manager retains log files for exactly seven days. Downloads older than seven days are not available through Cloud Manager [1].

- **Log forwarding** — Self-service configuration via `logForwarding.yaml` placed in the repo's `config/` folder and deployed via a targeted Config pipeline in Cloud Manager [3]. Supported destinations include Splunk, Datadog, Elasticsearch/OpenSearch, Azure Blob Storage, Amazon S3, HTTPS endpoint, New Relic, Dynatrace, and Sumo Logic.

- **Log enrichment** — All forwarded log entries are automatically enriched with four fields: `aem_env_id`, `aem_env_type`, `aem_program_id`, and `aem_tier` [3]. These are injected by the platform, not the application.

- **Advanced networking for log forwarding** — AEM and Dispatcher logs can be routed through dedicated egress IP or VPN by setting `aem.advancedNetworking: true` in the YAML config. CDN logs cannot use this option because they originate from Fastly, not AEM Cloud Service [3].

- **Custom log file restriction** — AEM as a Cloud Service does not support custom log file names. All custom log output must be written to `error.log` (i.e., configure loggers to write to the root or existing log files). Files like `saml.log` or `myapp.log` are not accessible [2].

## Technical Details

### Cloud Manager UI: Downloading Logs

Steps to download logs:
1. Log in at `my.cloudmanager.adobe.com` and select your organization and program.
2. Go to the **Environments** card on the Overview page.
3. Click the ellipsis (**...**) next to the target environment and select **Download Logs**.
4. In the Download Logs dialog, select the **Service** (Author, Publish, Dispatcher).
5. Click the download icon next to the desired log file [1].

If **Additional Publish Regions** are enabled, each region appears as a separate selectable option, allowing per-region log downloads [1].

### Adobe I/O CLI: Programmatic Access

The `aio-cli-plugin-cloudmanager` package enables both download and real-time tailing from the command line [2]:

```bash
# List available environments
aio cloudmanager:list-environments

# List available log options for a specific environment
aio cloudmanager:list-available-log-options <ENVIRONMENT_ID>

# Download logs (with optional DAYS parameter)
aio cloudmanager:download-logs --programId 5 <ENV_ID> author aemerror

# Tail logs in real time
aio cloudmanager:tail-log --programId 5 <ENV_ID> author aemerror
```

The `download-logs` command can fetch multiple days' worth of logs in a single operation. The `tail-log` command routes through Adobe's Splunk infrastructure internally, which can introduce occasional lag between log generation and display [2].

### Log Types Reference

| Service | Log Name | Content |
|---------|----------|---------|
| Author / Publish | `aemerror` | Java exceptions and application errors |
| Author / Publish | `aemaccess` | HTTP request summaries (method, path, status, timing) |
| Author / Publish | `aemrequest` | Full HTTP request + response details |
| Dispatcher (Publish) | `httpdaccess` | Apache HTTPD access log |
| Dispatcher (Publish) | `httperror` | Apache HTTPD error log |
| Dispatcher (Publish) | `aemdispatcher` | Dispatcher module log |
| CDN | (JSON) | Cache hit/miss, WAF rules, traffic filter matches [4] |

CDN logs are in JSON format and include fields like `timestamp`, `ttfb`, `cli_ip`, `cli_country`, `cache` (HIT/MISS/PASS), and `rules` [4].

### Log Forwarding Configuration

The `logForwarding.yaml` file is placed under a top-level `config/` folder in the repository and deployed via a **targeted Config pipeline** in Cloud Manager [3].

**Example Splunk configuration:**

```yaml
kind: "LogForwarding"
version: "1"
metadata:
  envTypes: ["stage", "prod"]
data:
  splunk:
    default:
      enabled: true
      host: "collector.xyz.com"
      port: 6580
      token: ${{YOUR_SPLUNK_TOKEN}}
      index: "aemaacs"
      aem:
        advancedNetworking: true
```

Secrets are stored as **Cloud Manager Secret Environment Variables** using `${{VARIABLE_NAME}}` syntax. The Service Applied field must be set to **"All"** to cover Author, Publish, and Preview tiers [3].

**Per-destination CDN support matrix (as of early 2026):**

| Destination | AEM Logs | Dispatcher Logs | CDN Logs |
|-------------|----------|-----------------|----------|
| Splunk | Yes | Yes | Yes |
| Datadog | Yes | Yes | Yes |
| Elasticsearch/OpenSearch | Yes | Yes | Yes |
| Azure Blob Storage | Yes | Yes | Yes |
| HTTPS | Yes | Yes | Yes |
| Amazon S3 | Yes | Yes | Planned |
| New Relic | Yes | Yes | Planned |
| Dynatrace | Yes | Yes | Planned |
| Sumo Logic | Yes | Yes | Planned |

Note: Sumo Logic requires an Enterprise subscription for index functionality [3].

### Recommended Log Levels by Environment

| Environment | Recommended Level |
|-------------|-------------------|
| Development | DEBUG |
| Stage | WARN |
| Production | ERROR |

Log levels are set via OSGi configurations in Git, deployed through Cloud Manager. **Do not** modify the default `org.apache.sling.commons.log.file` or `org.apache.sling.commons.log.pattern` values [4].

## Common Patterns

**Real-time debugging during deployment or smoke testing:** Use `aio cloudmanager:tail-log` against the Author or Publish `aemerror` log to watch for Java exceptions as code deploys or as test flows execute [2].

**CDN cache analysis:** Tail or forward CDN logs to Splunk and use the Adobe-provided CDN Analysis Tooling dashboards to track cache-hit ratio, 4xx/5xx error rates, and WAF activity [3].

**Multi-environment log aggregation:** Deploy `logForwarding.yaml` with `metadata.envTypes: ["stage", "prod"]` to forward logs from both Stage and Production to the same Splunk/Datadog workspace. Use the enriched `aem_env_type` and `aem_env_id` fields to filter per-environment in dashboards [3].

**Filtering by pod in high-scale environments:** Because multiple pods write to the consolidated log stream, use the Pod ID field in log entries to isolate output from a specific instance when debugging pod-level issues [2].

**Legacy Splunk migration to self-serve:** Organizations previously set up by Adobe Support can migrate by simply deploying the `logForwarding.yaml` via Cloud Manager pipelines. Duplicate logs may appear for a few hours during transition and will resolve automatically [3].

**S3 log batching:** Amazon S3 receives log entries in batches every 10 minutes per log file type — not in real time. Choose S3 for compliance/audit use cases, not for real-time alerting [3].

## Gotchas

**Tailing is CLI-only, not UI.** The Cloud Manager web UI only supports downloading logs as files. Real-time streaming (tailing) requires the Adobe I/O CLI with the Cloud Manager plugin. This is a commonly tested distinction [1][2].

**Seven-day retention cliff.** Cloud Manager only retains log files for seven days. If you need logs for an incident that happened 10 days ago and you have no external forwarding, they are gone. Log forwarding to an external destination must be configured proactively [1].

**CDN logs cannot use advanced networking / fixed egress IP.** CDN logs originate from Fastly's infrastructure, not AEM Cloud Service. Therefore, setting `aem.advancedNetworking: true` has no effect for CDN logs — they will always come from non-fixed IP ranges [3].

**Custom log files are not supported.** All custom application loggers must output to `error.log` (mapped to `aemerror`). Any logger configured to write to a named file like `myapp.log` or `saml.log` will produce output that is inaccessible via Cloud Manager or tailing [2].

**Splunk: do not enable indexer acknowledgement.** Enabling indexer acknowledgement on the Splunk HEC will cause "Data channel is missing" errors from Adobe's source Splunk instance during log forwarding [3].

**Splunk: externally-valid SSL required.** The Splunk HEC endpoint must use an externally valid SSL certificate. Self-signed certificates are not accepted [3].

**Tailing lag due to internal Splunk routing.** Log entries displayed via `aio cloudmanager:tail-log` are routed through Adobe's own Splunk infrastructure. Occasional lags between event generation on AEM and appearance in the terminal are expected [2].

**Secret variable "Service Applied" must be set to "All".** Log forwarding tokens/secrets stored as Cloud Manager environment variables must have the Service Applied field set to "All" — otherwise Author, Publish, or Preview tiers may fail to authenticate with the external system [3].

**Log forwarding not available on Sandbox programs.** Self-service log forwarding is not supported for sandbox programs. It requires a production program or a non-sandbox environment [4].

**OSGi log pattern changes are prohibited.** Custom Sling logging configurations must not change the `org.apache.sling.commons.log.file` property or the default log pattern. Changes to these will likely be overridden by the platform [4].

## Sources

[1] **Access and Manage Logs | Adobe Experience Manager**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/using-cloud-manager/manage-logs
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: UI download steps, available log types per service, seven-day retention, Additional Publish Regions support, API/CLI access overview.

[2] **Debugging AEM as a Cloud Service using Logs | Adobe Experience League**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-learn/cloud-service/debugging/debugging-aem-as-a-cloud-service/logs
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: aio CLI commands for tail-log and download-logs, log type reference per service, environment-level log level recommendations, custom log file restriction, multi-pod log aggregation, internal Splunk routing lag note.

[3] **Log Forwarding for AEM as a Cloud Service | Adobe Experience Manager**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/developing/log-forwarding
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Full destination support matrix (Splunk, Datadog, S3, Azure Blob, Elasticsearch, HTTPS, New Relic, Dynatrace, Sumo Logic), logForwarding.yaml syntax, secret variable pattern, advanced networking for log forwarding, CDN logs fixed-IP limitation, Splunk SSL and indexer acknowledgement gotchas, S3 batching frequency, legacy migration process, log enrichment fields.

[4] **Logging for AEM as a Cloud Service | Adobe Experience Manager**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/developing/logging
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: CDN log JSON format fields, three-tier log categorization (AEM/Dispatcher/CDN), OSGi configuration restrictions, log level by environment type, sandbox program restriction for log forwarding.
