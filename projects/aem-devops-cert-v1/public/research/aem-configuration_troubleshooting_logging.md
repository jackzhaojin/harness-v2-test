# Logging Configuration and Analysis

**Topic ID:** aem-configuration.troubleshooting.logging
**Researched:** 2026-03-29T00:00:00Z

## Overview

Logging in Adobe Experience Manager (AEM) is built on the Apache Sling logging framework, which itself is based on Apache Log4j/Logback [1]. The system routes log messages through a three-stage pipeline: an OSGi service generates a log message, a Logging Logger formats the message, and a Logging Writer persists it to a physical file [1][2]. Understanding this three-component model is essential for the exam because configuration questions almost always map to one of these three layers — the global root logger, a per-logger factory, or a per-writer factory.

AEM ships with several pre-configured log files — most notably `error.log`, `request.log`, and `access.log` — stored under `crx-quickstart/logs/` [3]. Each file captures a different dimension of runtime activity: application events, HTTP request/response pairs, and HTTP access records respectively. Because these files grow continuously, AEM provides two built-in log rotation strategies (scheduled and size-based) that are controlled through OSGi configuration [1].

AEM as a Cloud Service introduces important restrictions on top of the on-premise model: custom log files are not supported, the default `Apache Sling Logging Configuration` root level must remain at INFO, and all Java logs must write to `logs/error.log` to be accessible via Cloud Manager [4]. These cloud-specific rules are high-value exam topics because they represent common real-world mistakes.

## Key Concepts

- **Apache Sling Logging Configuration (Global)** — PID `org.apache.sling.commons.log.LogManager`. Controls the root logger: default log level (INFO), central log file path, rotation strategy, and number of old generations to retain [1][2]. All loggers inherit these settings unless overridden by a factory config.

- **Apache Sling Logging Logger Configuration (Factory)** — PID `org.apache.sling.commons.log.LogManager.factory.config`. Creates per-package/per-service loggers. Defines log level, target file, logger names (Java package or class), and message pattern [1][2]. Multiple factory instances can coexist — one per custom component or package.

- **Apache Sling Logging Writer Configuration (Factory)** — PID `org.apache.sling.commons.log.LogManager.factory.writer`. Controls file rotation and retention for a given log file. A Logger and its Writer are linked by sharing the same `org.apache.sling.commons.log.file` path [1]. If no matching Writer exists, AEM auto-creates one with daily rotation defaults.

- **Log Levels** — In ascending severity: TRACE → DEBUG → INFO → WARN → ERROR → FATAL. The default root level is INFO [2][3]. Higher levels are inclusive: setting TRACE captures all lower-severity messages too [3].

- **Scheduled Rotation** — Triggered by setting `org.apache.sling.commons.log.file.size` to a `java.text.SimpleDateFormat` pattern such as `'.'yyyy-MM-dd` for daily rotation [1][2]. When using this mode, the `file.number` property is ignored because files are named by date rather than numbered index.

- **Size-Based Rotation** — Triggered by setting `org.apache.sling.commons.log.file.size` to a numeric value with an optional multiplier (K, KB, M, MB, G, GB) [1][2]. The `file.number` property then controls how many numbered backup files to retain (e.g., `5` keeps files `0`–`4`).

- **error.log** — The primary application log. Captures DEBUG, INFO, WARN, ERROR, and FATAL messages from AEM's OSGi components and custom code. On AEM Cloud Service it is the only log file visible in Cloud Manager [4].

- **request.log** — Records every HTTP request and its corresponding response as two separate log entries per request (a request record and a response record). Used for performance analysis: response times, concurrent request counts, and slow request detection [3][5].

- **access.log** — Records each HTTP transaction in a single combined line (Apache/NCSA format): IP, method, resource, status code, content length, referrer, and user agent [3]. Contains half the number of lines of `request.log` for the same traffic volume.

- **Cloud Manager Log Names** — On AEM Cloud Service the log identifiers differ: `aemerror`, `aemaccess`, `aemrequest` for Author/Publish; `httpdaccess`, `httperror`, `aemdispatcher` for the Publish Dispatcher tier [4].

## Technical Details

### OSGi Configuration Properties

**Global Logger (`org.apache.sling.commons.log.LogManager`)**

| Property | Description | Default |
|---|---|---|
| `org.apache.sling.commons.log.level` | Root log level | `info` |
| `org.apache.sling.commons.log.file` | Log file path | `logs/error.log` |
| `org.apache.sling.commons.log.file.size` | Rotation trigger (pattern or size) | `'.'yyyy-MM-dd` |
| `org.apache.sling.commons.log.file.number` | Backup generations to keep | `5` |
| `org.apache.sling.commons.log.pattern` | MessageFormat pattern | *(timestamp, level, thread, class, message)* |

**Logger Factory (`org.apache.sling.commons.log.LogManager.factory.config`)**

| Property | Type | Description |
|---|---|---|
| `org.apache.sling.commons.log.level` | String | `trace`, `debug`, `info`, `warn`, `error` |
| `org.apache.sling.commons.log.file` | String | Target log file path |
| `org.apache.sling.commons.log.names` | String[] | Java package or class names to capture |
| `org.apache.sling.commons.log.pattern` | String | MessageFormat pattern |

**Writer Factory (`org.apache.sling.commons.log.LogManager.factory.writer`)**

| Property | Type | Description |
|---|---|---|
| `org.apache.sling.commons.log.file` | String | Must match the Logger's `log.file` value |
| `org.apache.sling.commons.log.file.number` | Long | Backup count for size-based rotation |
| `org.apache.sling.commons.log.file.size` | String | Rotation: date pattern or size (e.g., `10MB`) |

[Source: 1, 2]

### Creating a Custom Logger via Repository Config

Create an OSGi config node under `/apps/<project>/config/` [1]:

```
Node name: org.apache.sling.commons.log.LogManager.factory.config-myapp
Node type: sling:OsgiConfig

Properties:
  org.apache.sling.commons.log.level = "debug"
  org.apache.sling.commons.log.file = "logs/myapp.log"
  org.apache.sling.commons.log.names = ["com.example.myapp"]
```

Create a matching Writer node [1]:

```
Node name: org.apache.sling.commons.log.LogManager.factory.writer-myapp
Node type: sling:OsgiConfig

Properties:
  org.apache.sling.commons.log.file = "logs/myapp.log"
  org.apache.sling.commons.log.file.number = 5
  org.apache.sling.commons.log.file.size = "10MB"
```

### JSON Format (AEM Cloud Service / AEM 6.5+)

```json
{
  "org.apache.sling.commons.log.names": ["com.example.myapp"],
  "org.apache.sling.commons.log.level": "debug",
  "org.apache.sling.commons.log.file": "logs/error.log"
}
```

Note: On Cloud Service, the `org.apache.sling.commons.log.file` must always be `logs/error.log` [4].

### Sling Log Support Dashboard

Access at `http://localhost:4502/system/console/slinglog` to add new loggers dynamically during development. Changes made here do not persist across restarts unless also saved as OSGi config nodes [1].

### request.log Entry Format

Two lines per request [3][5]:
```
# Request line
[timestamp] [request-id] -> METHOD /path HTTP/1.x

# Response line
[timestamp] [request-id] <- status-code mime-type [response-time]ms
```

The `request-id` resets to 0 on AEM restart or Service Pack installation [5].

### access.log Entry Format (NCSA Combined Log)

One line per request [3]:
```
IP - user [timestamp] "METHOD /path HTTP/1.x" status-code content-length "referrer" "user-agent"
```

### Analyzing request.log for Slow Requests

Common Linux commands for performance troubleshooting [5]:

```bash
# Find requests taking over 10 seconds (5-digit ms)
grep -E "[0-9]{5}ms" request.log

# Find requests taking over 100 seconds (6-digit ms)
grep -E "[0-9]{6}ms" request.log

# Count accesses per hour
awk '{print $1}' request.log | cut -c1-13 | sort | uniq -c

# Statistical analysis with datamash (min/mean/median/max response time)
grep " <- " request.log | awk '{print $NF}' | sed 's/ms//' | datamash min 1 mean 1 median 1 max 1
```

Maximum concurrent connections for Jetty in AEM defaults to 200; performance degradation typically starts around 170+ concurrent requests [5].

## Common Patterns

**Pattern 1: Debug logging for a specific package during development**

Create a Logger factory config pointing `com.example.myapp` to `logs/error.log` at DEBUG level. Once debugging is complete, delete or update the config back to INFO to prevent disk saturation and performance degradation [2][4].

**Pattern 2: Isolating a component's output to a separate file**

Create a Logger factory config with a custom file path (`logs/myapp.log`) and a matching Writer factory config. Both configs must reference the same file path. Use the OSGi Console at `/system/console/configMgr` or create JCR config nodes under `/apps/<project>/config/` [1].

**Pattern 3: Run-mode-specific logging for Cloud Service environments**

Use run mode folders in the project: `config.author/`, `config.publish/`, `config.dev/`, etc. Deploy via Cloud Manager. This enables DEBUG logging on dev environments without affecting stage (WARN) or production (ERROR) [4].

**Pattern 4: Environment-variable-parameterized log levels (Cloud Service)**

Use environment-specific variables (set via Adobe I/O CLI with Cloud Manager plugin) as placeholders in OSGi configurations. This allows dynamic log level changes without a full code deployment [4].

**Pattern 5: Performance triage with request.log**

When a page is consistently slow: (1) search `request.log` for 5-digit ms entries for that URL, (2) check concurrent request count at that timestamp, (3) compare with other pages to isolate whether it is a general load issue or page-specific, (4) verify Dispatcher caching — repeated requests to cacheable `.html` URLs with 200 status codes indicate cache miss problems [3][5].

**Pattern 6: Monitoring via Cloud Manager**

On AEM Cloud Service, download logs by day using Cloud Manager's "Download Logs" action, or tail live with:

```bash
aio cloudmanager:tail-logs <ENVIRONMENT_ID> <SERVICE> <LOG_NAME>
# Example:
aio cloudmanager:tail-logs 12345 author aemerror
```

[Source: 4]

## Gotchas

**Gotcha 1 — Cloud Service forbids custom log files.** On AEM as a Cloud Service, `org.apache.sling.commons.log.file` in any Logger config must point to `logs/error.log`. Custom log file names (e.g., `logs/myapp.log`) will not appear in Cloud Manager downloads or `aio` tail commands [4]. This is a common misconception for developers migrating from AEM 6.x.

**Gotcha 2 — Scheduled rotation ignores `file.number`.** When `org.apache.sling.commons.log.file.size` is set to a `SimpleDateFormat` pattern (e.g., `'.'yyyy-MM-dd`), the `file.number` property has no effect because old files are identified by their date suffix, not a numeric index [1][2]. Only size-based rotation uses the `file.number` counter.

**Gotcha 3 — Logger and Writer must share the exact same file path string.** The linking between a Logger factory config and a Writer factory config is based on an exact string match of `org.apache.sling.commons.log.file`. A mismatch causes AEM to silently auto-create a default Writer with daily rotation, bypassing your custom Writer settings [1].

**Gotcha 4 — request.log request-id reset on restart/Service Pack install.** The request ID counter resets to 0 when AEM is restarted or a Service Pack is applied. If you analyze a request.log that spans a restart, concurrent-request counts and correlations between request/response pairs will be incorrect. Always split analysis at the point where request-id = 0 reappears [5].

**Gotcha 5 — Do not change the global root log level on Cloud Service.** The Apache Sling Logging Configuration's `org.apache.sling.commons.log.level` must remain at INFO in AEM Cloud Service environments. Only per-package Logger factory configs should be adjusted to DEBUG. Changing the global root to DEBUG causes severe performance degradation and generates enormous log volume [4].

**Gotcha 6 — access.log vs. request.log line counts.** `access.log` has half the entries of `request.log` for the same traffic because access.log uses the combined NCSA format (one line per transaction), while request.log writes two separate lines — one when the request arrives and one when the response is sent [3]. Exam questions may test this distinction.

**Gotcha 7 — TRACE level not supported on Cloud Service.** Cloud Service caps maximum verbosity at DEBUG. TRACE-level log configurations are not supported and will be silently elevated or ignored [4].

**Gotcha 8 — Dynamic Sling Log Dashboard changes are non-persistent.** Additions made via `http://localhost:4502/system/console/slinglog` are lost on restart. For persistent custom loggers, changes must be committed as OSGi config nodes in the repository under `/apps/<project>/config/` [1].

**Gotcha 9 — `request.log` is NOT available on AEM Cloud Service as a separate file.** On Cloud Service the equivalent is `aemrequest` (accessible via Cloud Manager). The on-premise `crx-quickstart/logs/request.log` path does not exist in cloud pod environments [4].

## Sources

[1] **Logging | Adobe Experience Manager 6.5**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-65/content/implementing/deploying/configuring/configure-logging
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Three-component logging pipeline, OSGi PID names for global/logger/writer configs, key property names and default values, log rotation strategies (scheduled vs size-based), custom logger creation steps via OSGi Console and JCR nodes.

[2] **Apache Sling Logging Documentation**
    URL: https://sling.apache.org/documentation/development/logging.html
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Canonical definition of Logger vs. Writer distinction, BundleContext property names, Logback XML integration, scheduled rotation behavior (SimpleDateFormat pattern), size-based rotation multipliers (K, KB, M, MB, G, GB).

[3] **Working with Logs | AEM 6.5 Troubleshooting**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-65/content/sites/administering/operations/troubleshooting
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Key log files list (error.log, request.log, access.log, audit.log, etc.), log level hierarchy, access.log format description (one line vs request.log two lines), performance troubleshooting workflow using request.log.

[4] **Logging for AEM as a Cloud Service**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/developing/logging
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Cloud Service log name identifiers (aemerror, aemaccess, aemrequest, httpdaccess, httperror, aemdispatcher), restriction on custom log files, requirement to write all Java logs to error.log, TRACE level restriction, run-mode config folder approach for per-environment log levels, environment-variable parameterization, Adobe I/O CLI log tail command.

[5] **Examples of request.log analysis | Adobe Experience Cloud KCS**
    URL: https://experienceleague.adobe.com/en/docs/experience-cloud-kcs/kbarticles/ka-21309
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Practical grep/awk/datamash commands for slow request detection, concurrent request analysis, request-id reset behavior on restart/Service Pack install, Jetty default 200 concurrent connection limit, traffic pattern analysis.
