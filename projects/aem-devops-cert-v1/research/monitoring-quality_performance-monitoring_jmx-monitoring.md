# JMX and MBean Monitoring

**Topic ID:** monitoring-quality.performance-monitoring.jmx-monitoring
**Researched:** 2026-03-29T00:00:00Z

## Overview

Java Management Extensions (JMX) is a Java standard that provides an architecture for managing and monitoring resources dynamically at runtime. In Adobe Experience Manager, JMX is the primary internal mechanism for exposing runtime state — heap memory, thread activity, session counts, replication queue depth, Oak index health, and much more — through objects called Managed Beans (MBeans) [1]. These MBeans are registered with an MBean Server and are accessible both through the built-in AEM Web Console JMX tab and through external monitoring tools that speak the JMX protocol, such as JConsole, SolarWinds, Hyperic, or Zabbix [2].

AEM's JMX surface covers three layers: the underlying JVM (Platform MXBeans exposed by the JDK), the OSGi framework (Felix and Sling MBeans), and AEM/CRX application-level services (Granite, Jackrabbit Oak, replication agents, workflow engines) [1][2]. Each MBean exposes a set of typed attributes — read-only or read-write — and callable operations, making it possible to both observe and manipulate running services without a restart. For exam purposes, understanding which MBean covers which metric, the URL patterns used to reach them, and the alert thresholds that signal problems is critical.

In AEM as a Cloud Service (AEMaaCS), the JMX console is blocked at the infrastructure level, meaning the entire on-premise workflow shifts to Adobe-managed alternatives [4]. This on-premise vs. cloud distinction is a frequently tested gotcha on the DevOps Engineer Expert exam.

## Key Concepts

- **MBean (Managed Bean)** — A Java object registered with the JMX MBean Server that exposes typed attributes and invokable operations representing runtime state or configuration of a single service [1]. AEM, Jackrabbit Oak, Apache Felix, and Apache Sling all register MBeans automatically at startup.

- **JMX Console URL** — The primary entry point for browser-based MBean access in AEM is `/system/console/jmx` (full URL: `http://localhost:4502/system/console/jmx`). Each row in the table corresponds to one registered MBean [1].

- **Aries JMX Whiteboard** — The OSGi module responsible for auto-discovering OSGi services that implement `javax.management.DynamicMBean` and registering them with the platform MBean Server. Developers simply register an OSGi service with the `jmx.objectname` property and the whiteboard handles the rest [3].

- **Platform MXBeans** — JDK-standard MBeans covering JVM internals: `java.lang:type=Memory` (heap/non-heap), `java.lang:type=Threading` (thread counts, deadlock detection), and `java.lang:type=GarbageCollector` (GC pause stats) [2].

- **Oak Repository Statistics** — The MBean at object name `org.apache.jackrabbit.oak:id=7,name="OakRepository Statistics",type="RepositoryStats"` exposes session counts, node cache metrics, and observation queue lengths as time-series data (per-second, per-minute, per-hour) [2].

- **IndexStats MBeans** — Oak exposes one IndexStats MBean per indexing lane (`async`, `fulltext-async`, `async-reindex`). The `Done` and `LastIndexedTime` timestamps are the key attributes; if either is more than 45 minutes old, the asynchronous indexer is considered stale or failing [1].

- **Replication Agent MBeans** — Auto-created when a replication agent is defined. Object name pattern: `com.adobe.granite.replication:type=agent,id="<AGENT_NAME>"`. Key attributes: `QueueBlocked` (boolean) and `QueueNumEntries` (integer) [2].

- **Health Check MBeans** — Each Sling health check registered in the Operations Dashboard also appears as a JMX MBean under the `org.apache.sling.healthcheck` domain. They expose a `Result` attribute that returns OK, WARN, or CRITICAL [2].

- **Custom MBeans** — Developers can expose custom service state by implementing `DynamicMBean`, annotating the interface with `com.adobe.granite.jmx.annotation` annotations (`@Description`, `@Impact`, `@Name`), and registering the service with `jmx.objectname` via SCR/OSGi Component annotations [3].

- **Remote JMX Access** — Disabled by default for security. Enabling it requires JVM startup flags (`-Dcom.sun.management.jmxremote.port=<port>`). Strongly discouraged in production without SSL and authentication enabled [1].

## Technical Details

### JMX Console and Object Name Patterns

Each MBean is uniquely identified by an object name following the pattern `<domain>:<key-properties>`. The AEM JMX console URL reflects this pattern directly:

```
# Memory monitoring
/system/console/jmx/java.lang:type=Memory

# Thread monitoring
/system/console/jmx/java.lang:type=Threading

# Replication agent monitoring
/system/console/jmx/com.adobe.granite.replication:type=agent,id="publish"

# Oak repository stats
/system/console/jmx/org.apache.jackrabbit.oak:id=7,name="OakRepository Statistics",type="RepositoryStats"

# Sling health checks
/system/console/jmx/org.apache.sling.healthcheck:name=replicationQueue,type=HealthCheck
```
[1][2]

### Key MBeans and Monitoring Thresholds

The following table summarizes the critical MBeans tracked on the AEM DevOps certification exam [2]:

| MBean | Object Name | Alert Threshold | Scope |
|---|---|---|---|
| JVM Heap Memory | `java.lang:type=Memory` | Heap or non-heap > 75% of max | All servers |
| JVM Threads | `java.lang:type=Threading` | Thread count > 150% of baseline | All servers |
| Replication Queue | `com.adobe.granite.replication:type=agent,id="<name>"` | `QueueBlocked=true` or `QueueNumEntries` > 150% baseline | Author + Publish |
| Oak Sessions | OakRepository Statistics | Open sessions > 150% of baseline (50% above baseline) | All servers |
| Observation Queue | Oak EventListener MBean | `ObservationQueueMaxLength` > 10,000 | All servers |
| Health Checks | `org.apache.sling.healthcheck:name=*` | Status != OK | Per check scope |

### IndexStats MBean for Async Index Monitoring

To detect stale Oak indexes, navigate to the IndexStats MBeans and inspect the `Done` and `LastIndexedTime` timestamps [1]:

```
# Check async indexing lane
/system/console/jmx  → IndexStats → "async"

# Check fulltext-async indexing lane
/system/console/jmx  → IndexStats → "fulltext-async"
```

If `Done` or `LastIndexedTime` is more than 45 minutes in the past, the index is stale. The `abortAndPause()` operation can be invoked on the IndexStats MBean to halt runaway reindexing [1].

### Workflow MBeans

The `com.adobe.granite.workflow:type=Maintenance` MBean provides key operations for managing workflow instances at runtime [1]:

```
listRunningWorkflowsPerModel   – returns count per model
returnFailedWorkflowCount      – count of failed instances
terminateFailedInstances       – terminates + optionally restarts
retryFailedWorkItems           – retries failed work item steps
purgeCompleted                 – removes old completed records
```

### Repository Backup/GC Operations

The `com.adobe.granite:type=Repository` MBean exposes operational commands including `startBackup`, `cancelBackup`, `runDataStoreGarbageCollection`, and `startTarOptimization` [1].

### Creating a Custom MBean

The recommended pattern uses Granite annotations and OSGi service registration [3]:

```java
// 1. Define the management interface
@Description("My service statistics")
public interface MyServiceMBean {
    @Description("Current queue depth")
    int getQueueDepth();

    @Description("Clear the queue")
    @Impact(INFO)
    void clearQueue();
}

// 2. Implement using AnnotatedStandardMBean
public class MyService extends AnnotatedStandardMBean
        implements MyServiceMBean, DynamicMBean {
    // implementation
}

// 3. Register as OSGi service with jmx.objectname
@Component(immediate = true)
@Property(name = "jmx.objectname", value = "com.example:type=MyService")
@Service(value = DynamicMBean.class)
public class MyServiceMBean extends AnnotatedStandardMBean { ... }
```

The Aries JMX Whiteboard automatically picks up any OSGi service registered as `DynamicMBean` and registers it with the MBean Server [3].

### Remote JMX Configuration

To allow external monitoring tools (Zabbix, SolarWinds) to connect via JMX, add the following JVM startup flags [1]:

```
-Dcom.sun.management.jmxremote
-Dcom.sun.management.jmxremote.port=<port>
-Dcom.sun.management.jmxremote.ssl=false
-Dcom.sun.management.jmxremote.authenticate=false
```

This is insecure without SSL and authentication. Never use these flags with `authenticate=false` on production systems [1].

## Common Patterns

**Baseline-first monitoring** — Most JMX thresholds are expressed relative to a baseline rather than as absolute values. Capture memory, thread count, session count, and queue depth during normal operation first, then set alerts at 150% of that baseline for threads/queues and 50% above baseline for sessions [2].

**Health checks as MBean proxies** — Rather than directly monitoring low-level MBeans, many teams rely on the Sling health check MBeans (`org.apache.sling.healthcheck`) which aggregate signals from multiple sources into a single OK/WARN/CRITICAL result. These health checks also surface in the Operations Dashboard, giving a unified view [2].

**JConsole for local development troubleshooting** — When the AEM web UI is inaccessible (e.g., authentication bundle failure), connect JConsole directly to the AEM JVM by running `jconsole` and selecting AEM from the Local Process list. From there, navigate to `osgi.core/bundleState` to inspect bundle state and invoke OSGi operations without the web UI [5].

**Detecting replication failures early** — Monitor `QueueBlocked` (boolean) as a binary alert. When it flips to `true`, the replication target is down or unreachable. Pair with `QueueNumEntries` trending above 150% of baseline for early warning before the queue fully blocks [2].

**Observation queue overflow as content ingestion indicator** — During heavy asset ingestion, the Oak Observation Queue (`ObservationQueueMaxLength`) can exceed 10,000. In normal operation this value should eventually return to zero. A persistently high value indicates downstream observers (search indexing, workflows) cannot keep pace [2].

**Third-party integration via shell scripts** — For monitoring platforms that cannot connect directly via JMX protocol, shell scripts can query MBean data via HTTP from the JMX console and reformat it as needed [2].

## Gotchas

**AEMaaCS blocks the JMX console entirely** — On AEM as a Cloud Service, `/system/console/jmx` returns 403. The JMX console, Felix OSGi console, and CRXDe Lite are all blocked in staging and production. Monitoring in AEMaaCS uses New Relic One APM (bundled with the product) and the Developer Console (read-only, for bundle/component state) [4]. Exam questions that describe a cloud scenario and ask how to check memory usage or session counts should point to New Relic, not JMX.

**Replication agents do not exist in AEMaaCS** — The `com.adobe.granite.replication` MBeans only apply to AEM on-premise and AEM Managed Services. AEMaaCS uses Sling Distribution, not classic replication agents, so the replication queue MBeans are irrelevant in the cloud context [4].

**Remote JMX is disabled by default** — A common mistake is assuming remote JMX access works out-of-the-box. It requires explicit JVM startup flags and is a security risk if SSL/auth are not configured. On-premise production systems typically keep this disabled and use in-process monitoring tools instead [1].

**ObservationQueueMaxLength > 10,000 is a problem, not just a warning** — The threshold is specifically 10,000 (not "elevated" or "above average"). In normal operation this must eventually return to zero. A persistent value above 10,000 requires investigation [2].

**IndexStats "stale" threshold is 45 minutes** — The commonly recalled figure for a stale async index is when `Done` or `LastIndexedTime` is more than 45 minutes in the past. Confusing this with other thresholds (e.g., the 75% memory threshold or 150% queue threshold) is a source of exam errors [1].

**75% heap threshold is for heap AND non-heap** — The memory alarm triggers when either heap or non-heap exceeds 75% of its configured maximum. Non-heap (Metaspace) leaks are just as important to watch as heap [2].

**JConsole itself consumes significant resources** — Running JConsole on the same host as AEM is not recommended for production because it competes for the same JVM resources. Use it on a remote monitoring host pointing at the AEM server [1].

**Health check MBeans vs. Operations Dashboard** — The Operations Dashboard and the JMX health check MBeans expose the same underlying checks. They are not separate systems. The MBeans are how external monitoring tools can query health check status programmatically [2].

## Sources

[1] **Monitoring Server Resources Using the JMX Console | Adobe Experience Manager 6.5**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-65/content/sites/administering/operations/jmx-console
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: JMX console URL, MBean domains (workflow maintenance, repository, replication, Sling engine), remote JMX configuration warnings, JConsole usage, IndexStats 45-minute threshold, abortAndPause() operation.

[2] **Best Practices to Monitor Assets Deployment | Adobe Experience Manager 6.5**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-65/content/assets/administer/assets-monitoring-best-practices
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Specific MBean object names and URLs for memory, threading, replication, Oak repository stats, and all health check MBeans. Alert thresholds (75% memory, 150% thread/queue, 50% session baseline, 10,000 observation queue). Baseline monitoring methodology.

[3] **Integrating Services with the JMX Console | Adobe Experience Manager 6.5**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-65/content/implementing/developing/platform/jmx-integration
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Custom MBean creation pattern, AnnotatedStandardMBean class, Granite annotation package (`@Description`, `@Impact`, `@Name`), OSGi service registration with `jmx.objectname` property, Aries JMX Whiteboard auto-registration, programmatic multi-instance registration via BundleContext.

[4] **JMX Monitoring in AEM as Cloud Service | Adobe Experience League Community**
    URL: https://experienceleaguecommunities.adobe.com/t5/adobe-experience-manager/jmx-monitoring-in-aem-as-cloud-service/td-p/570310
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: AEMaaCS blocks JMX console (403), Felix OSGi console blocked in staging/production, New Relic One APM as the replacement monitoring surface, Developer Console as read-only alternative, multi-instance JMX aggregation challenge, absence of classic replication agents in AEMaaCS.

[5] **Bringing AEM Back to Life with JConsole | DanKlco.com**
    URL: https://danklco.com/posts/2021-09-bringing-aem-back-to-life-with-jconsole/
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: Practical JConsole usage for AEM troubleshooting when web UI is unavailable. OSGi bundleState MBean for bundle inspection. Filesystem grep technique for locating bundle IDs. Real-world scenario of recovering from auth bundle failure via JMX.
