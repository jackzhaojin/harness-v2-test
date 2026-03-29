# Log Forwarding and Splunk Integration

**Topic ID:** monitoring-quality.log-analysis.splunk-integration
**Researched:** 2026-03-29T00:00:00Z

## Overview

AEM as a Cloud Service provides a self-service log forwarding mechanism that routes logs from author, publish, dispatcher, and CDN tiers to external destinations such as Splunk, Azure Blob Storage, Datadog, Elasticsearch/OpenSearch, Amazon S3, HTTPS endpoints, New Relic, Dynatrace, and Sumo Logic [1]. The configuration is declared in a YAML file (`logForwarding.yaml`) committed to Git and deployed through a Cloud Manager config pipeline — the same pipeline infrastructure used for CDN rules, maintenance tasks, and traffic filter rules [1][3].

Before self-service was introduced, organizations had to open Adobe Support tickets to enable log forwarding. That legacy model still exists for customers already using it, but Adobe recommends migrating to the self-serve YAML approach, particularly when setting up new environments, changing Splunk endpoints or credentials, or when CDN log forwarding (not available in the legacy model) is required [1]. Choosing a log destination is a scenario-driven decision: Splunk is best for real-time dashboards and operational alerting, while Amazon S3 targets long-term archival and compliance [4].

The configuration requires secrets management discipline because tokens and passwords must never be stored in Git — they are referenced via `${{VARIABLE_NAME}}` placeholders and declared as Cloud Manager Secret Environment Variables, applied to the **All** service tier to cover author, publish, and preview [1].

## Key Concepts

- **Self-service model** — Log forwarding is configured entirely through Git-managed YAML files and deployed via Cloud Manager targeted deployment pipelines, replacing the old support-ticket workflow [1].
- **`logForwarding.yaml`** — The YAML configuration file with `kind: LogForwarding` and `version: "1"`. Placed in the `config/` folder and deployed via a Config pipeline; not a Full Stack or Web Tier pipeline [1][3].
- **Supported destinations** — Splunk, Azure Blob Storage, Datadog, Elasticsearch/OpenSearch, Amazon S3, HTTPS, New Relic, Dynatrace, and Sumo Logic. CDN log forwarding is currently supported only for Azure Blob, Datadog, Elasticsearch/OpenSearch, HTTPS, and Splunk — not Amazon S3, New Relic, Dynatrace, or Sumo Logic as of early 2026 [1].
- **Splunk HEC (HTTP Event Collector)** — The integration mechanism. AEM forwards logs to a Splunk HEC endpoint using a bearer token. Requires an externally-valid (non-self-signed) SSL certificate on the HEC endpoint [2].
- **Advanced Networking** — An optional routing mode where AEM logs are routed through a dedicated egress IP or VPN, controlled per-destination via the `aem.advancedNetworking: true` property. CDN logs cannot use advanced networking because they are sent directly from Fastly rather than from AEM [1].
- **Secret variables** — Tokens and credentials are referenced as `${{SPLUNK_TOKEN}}` in YAML and stored as Cloud Manager pipeline secret variables. Mandatory (not optional) for log forwarding configurations [1].
- **Sandbox restriction** — Log forwarding is not supported in sandbox program environments [1].
- **One config pipeline per environment** — Only a single targeted config pipeline can exist per environment. Full Stack and Web Tier pipelines cannot deploy `logForwarding.yaml` [1][3].
- **Sourcetype metadata** — All forwarded log entries are enriched with `aem_env_id`, `aem_env_type`, `aem_program_id`, and `aem_tier` fields to distinguish multi-program or multi-environment log streams [1].

## Technical Details

### Splunk Configuration

The following YAML configures Splunk as the default forwarding destination [1]:

```yaml
kind: "LogForwarding"
version: "1"
metadata:
  envTypes: ["stage", "prod"]
data:
  splunk:
    default:
      enabled: true
      host: "splunk-host.example.com"
      token: "${{SPLUNK_TOKEN}}"
      index: "aemaacs"
```

To route AEM/Dispatcher logs separately from CDN logs into different Splunk indexes, use granular overrides [1]:

```yaml
data:
  splunk:
    default:
      enabled: true
      host: "splunk-host.example.com"
      token: "${{SPLUNK_TOKEN}}"
      index: "aemaacs"
    cdn:
      enabled: true
      index: "aemaacs_cdn"
    aem:
      enabled: false
```

The default port for Splunk is 443. Non-standard ports require Advanced Networking (Flexible Egress for any non-standard port; Dedicated Egress if a fixed IP is also required) [1].

### Splunk HEC Setup Requirements

On the Splunk side [2]:

1. Create a dedicated index (Settings → Indexes).
2. Add an HTTP Event Collector pointing to that index (Settings → Data Inputs → HTTP Event Collector).
3. Configure SSL on the HEC with an externally-valid certificate — self-signed is rejected by Adobe.
4. Edit `{splunk_install_dir}/etc/apps/splunk_httpinput/local/inputs.conf`:

```
[http]
disabled = 0
port = 443
serverCert = /path/to/fullchain.pem
privKeyPath = /path/to/privkey.pem
```

Note: Splunk Web UI and Splunk HEC have entirely separate SSL configurations [2].

### Azure Blob Storage Configuration

Used when Azure is the preferred storage layer, often as an intermediary before SIEM ingestion [1]:

```yaml
kind: "LogForwarding"
version: "1"
data:
  azureBlob:
    default:
      enabled: true
      storageAccountName: "example_acc"
      container: "aem_logs"
      sasToken: "${{AZURE_BLOB_SAS_TOKEN}}"
```

The SAS token must be created from the **Shared Access Signature** page (not the Shared Access Token page), with Allowed Resources set to **Object and Container**, and permissions including **Read, Write, Add, List, Create** [1].

### Elasticsearch Configuration

```yaml
data:
  elasticsearch:
    default:
      enabled: true
      host: "example.com"
      user: "${{ELASTICSEARCH_USER}}"
      password: "${{ELASTICSEARCH_PASSWORD}}"
      pipeline: "ingest pipeline name"
```

Use deployment credentials (not account-level credentials). An optional ingest pipeline can route entries to different indexes via Painless script [1].

### Datadog Configuration

```yaml
data:
  datadog:
    default:
      enabled: true
      host: "http-intake.logs.datadoghq.eu"
      token: "${{DATADOG_API_KEY}}"
      tags:
        tag1: value1
```

Use the API Key directly — do not use the Cloud integration. Source tags are set automatically based on log type [1].

### Available Log Types

Log types that can be forwarded per service tier [1]:

| Tier | Log Names |
|------|-----------|
| Author | `aemerror`, `aemrequest`, `aemaccess` |
| Publish | `aemerror`, `aemrequest`, `aemaccess` |
| Dispatcher | `httpdaccess`, `httpderror`, `aemdispatcher` |
| CDN | CDN access logs (Fastly-sourced) |

### Advanced Networking Port Matrix

| Scenario | Advanced Networking Needed |
|----------|---------------------------|
| Port 443, no fixed IP | None |
| Port 443, fixed IP needed | Dedicated Egress |
| Non-standard port, no fixed IP | Flexible Egress |
| Non-standard port, fixed IP needed | Dedicated Egress |

### Config Pipeline Deployment

For non-RDE environments, create a **Targeted Deployment** pipeline in Cloud Manager. Full Stack and Web Tier pipelines do not deploy config files [3]. There is a maximum of one config pipeline per environment [3]. For Rapid Development Environments (RDEs), deploy with the CLI tooling instead of a pipeline.

## Common Patterns

**Splunk for operations teams**: Splunk HEC + dedicated index + real-time dashboard is the standard pattern for teams needing live alerting, CDN traffic monitoring, WAF insights, and cache-hit ratio tracking. Adobe's GitHub repository provides pre-built Splunk dashboard templates (CDN Cache Hit Ratio, CDN Traffic, WAF) [1].

**Azure Blob as SIEM bridge**: Organizations on Microsoft Azure commonly forward logs to Azure Blob Storage first, then use Azure Event Hub, Azure Data Factory, or a Logic App to ingest into Azure Log Analytics Workspace or Microsoft Sentinel. Azure Log Analytics is not a native direct-destination in AEM's log forwarding feature [1].

**Granular routing for cost control**: Using the `cdn` and `aem` sub-keys under a destination, teams can split CDN logs and AEM logs into different indexes or even different destinations, enabling cost optimization (e.g., CDN logs to cheap S3 storage, AEM error logs to Splunk) [1].

**Secrets rotation pattern**: SAS tokens for Azure Blob have expiry dates — a common operational issue is log delivery silently stopping after SAS token expiry. Teams set calendar reminders and Cloud Manager variable updates as part of their rotation procedures [1].

**Multi-environment targeting with `envTypes`**: Using `metadata.envTypes: ["prod"]` targets only production; `["stage", "prod"]` targets both. This avoids forwarding dev/sandbox noise to paid SIEM tools [1][3].

## Gotchas

**Indexer Acknowledgement causes "Data channel is missing" error**: When configuring the Splunk HEC, leaving "Enable indexer acknowledgement" checked causes a `Data channel is missing` error when Adobe tries to push logs. It must be unchecked [2].

**Self-signed SSL certificate is silently rejected**: Adobe requires an externally-valid SSL certificate for the Splunk HEC endpoint. Self-signed certificates fail without a clear error message. Use Let's Encrypt or a CA-signed cert [2].

**Splunk Web and Splunk HEC have separate SSL configs**: Configuring HTTPS for the Splunk web UI does not configure it for the HEC. Edit `inputs.conf` for the HEC separately [2].

**Full Stack pipeline cannot deploy `logForwarding.yaml`**: Only a targeted deployment config pipeline works. Using the wrong pipeline type results in the config file being ignored [3].

**CDN logs cannot use Advanced Networking VPN**: CDN logs originate from Fastly infrastructure, not from AEM Cloud Service, so they cannot be routed through VPN-based Advanced Networking. AEM and dispatcher logs can use Advanced Networking, but CDN logs cannot [1].

**Sandbox programs are excluded entirely**: Log forwarding is unsupported for sandbox program environments. Attempting to configure it will not work [1].

**Duplicate logs during legacy migration**: When deploying a `logForwarding.yaml` to an environment that was previously configured via Adobe Support, duplicate logs can appear for a few hours during the transition period [1].

**Sourcetype values can shift after migration**: If you were using the legacy Adobe-configured Splunk integration, the Splunk sourcetype field values may change when switching to self-service. Splunk searches or alerts tied to specific sourcetype values will need updating [1].

**Amazon S3 does not support CDN logs yet**: S3 is listed as "Future" for CDN log support. If CDN logs must be forwarded, use Splunk, Azure Blob, Datadog, Elasticsearch/OpenSearch, or HTTPS instead [1].

**SAS token expiry causes silent log delivery stop**: Azure Blob SAS tokens have an expiry date. After expiry, log delivery stops without an explicit alert. Monitor token validity proactively [1].

**RDE log forwarding uses CLI, not pipeline**: Rapid Development Environments do not use Cloud Manager pipelines for config deployment. Use the `aio aem:rde:inspect` CLI commands to deploy `logForwarding.yaml` to an RDE [3].

**Secrets must use `${{VARIABLE_NAME}}` double-brace syntax**: Single braces or direct values in YAML are not treated as Cloud Manager variables. The double-brace syntax `${{VAR}}` is mandatory for secret resolution [1].

## Sources

[1] **Log Forwarding for AEM as a Cloud Service | Adobe Experience Manager**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/developing/log-forwarding
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Full configuration schema for all destinations (Splunk, Azure, Datadog, Elasticsearch, S3, HTTPS), secrets management pattern, advanced networking port matrix, log type table, CDN log limitations, sandbox restriction, migration duplicate-log warning, sourcetype change warning, granularity override syntax, and log entry metadata fields.

[2] **Using Splunk for Log Search & Monitoring on AEM as a Cloud Service | Arbory Digital**
    URL: https://blog.arborydigital.com/en/blog/splunk-setup-aem-cloud-service-aemaacs
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Splunk HEC setup steps, externally-valid SSL certificate requirement, indexer acknowledgement gotcha, separate SSL configs for Splunk Web vs HEC, inputs.conf configuration, and practical capacity guidance for free vs paid Splunk tiers.

[3] **Use Config Pipelines | Adobe Experience Manager**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/operations/config-pipeline
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Config pipeline deployment requirements, one pipeline per environment constraint, Full Stack pipeline exclusion, targeted deployment pipeline creation, RDE CLI deployment method, and `${{VARIABLE_NAME}}` secrets syntax.

[4] **Log Forwarding in AEM as a Cloud Service – Splunk vs S3 | AEM Tutorial**
    URL: https://www.aemtutorial.info/2025/11/log-forwarding-in-aem-as-cloud-service.html
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: Scenario-based comparison of Splunk (real-time monitoring) vs Amazon S3 (long-term compliance archival), configuration structural differences between the two destinations.
