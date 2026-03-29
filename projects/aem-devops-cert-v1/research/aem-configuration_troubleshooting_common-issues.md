# Common AEM Issues and Resolutions

**Topic ID:** aem-configuration.troubleshooting.common-issues
**Researched:** 2026-03-29T00:00:00Z

## Overview

Adobe Experience Manager (AEM) is a complex, OSGi-based CMS built on Apache Jackrabbit Oak and Apache Sling. Because it layers a content repository, bundle runtime, replication system, and application server into a single process, failures at any layer can cascade into visible production symptoms. The four most exam-relevant problem categories are: repository inconsistencies (TarMK segment corruption), OSGi bundle and service failures, replication queue blockages, and Java heap/memory exhaustion [1][2].

Each category has a distinct diagnostic path, a characteristic error message, and a set of remediation commands that a DevOps engineer must know. Repository issues are typically identified by `SegmentNotFoundException` in the error log and resolved with the `oak-run` toolset applied offline. Bundle failures surface in the Felix OSGi Console as bundles stuck in the `Installed` or `Resolved` state, and are fixed by resolving missing dependencies or supplying the required OSGi configuration. Memory issues require heap dump analysis using Eclipse MAT and JVM parameter tuning [1][3][4].

Understanding which tool to use, in what order, and against which AEM console endpoint is central to the AEM DevOps Engineer Expert certification exam. Scenario questions typically present an error symptom (a stack trace, a console state, an ops-team complaint) and ask what the correct next step is — not just what the problem is.

## Key Concepts

- **TarMK (Segment Store)** — The default on-premises persistence mechanism. Content is stored as small binary segments in `.tar` files under `/crx-quickstart/repository/segmentstore`. When segments go missing or become unreadable, Oak throws `SegmentNotFoundException` and the instance may fail to start [3].

- **oak-run** — A command-line utility that must match the Oak core version of the AEM installation. Used offline for repository checks (`check`), revision revert (`journal.log` edit), checkpoint cleanup (`checkpoints rm-unreferenced`), and offline compaction (`compact`) [3].

- **OSGi Bundle States** — A bundle progresses through: `Installed` → `Resolved` → `Active`. An `Installed` bundle has unresolved Java import dependencies; a `Resolved` bundle has satisfied class dependencies but has not yet started (often because a required OSGi service is missing or the configuration policy is `REQUIRE` but no config file is present) [5][6].

- **OSGi Component States** — Distinct from bundle states. `Active` = running. `No Config` = component requires a configuration object (`configurationPolicy = REQUIRE`) but none is present. `Unsatisfied` = a required `@Reference` service is not registered anywhere in the container. `Disabled` = explicitly deactivated [6].

- **Runmode-Specific OSGi Configuration** — Configurations live under `/apps/<project>/osgiconfig/config.<runmode>/` as `.cfg.json` files named by PID (the OSGi component's full Java class name). AEM selects the config with the highest number of matching runmode segments [6].

- **Replication Queue** — Operates FIFO. A single failed item blocks all subsequent items. Blocked queues show in red at `/etc/replication/agents.author.html`. Root causes range from a disabled agent to `jcr:namespaceManagement` privilege missing on the replication user [7].

- **Heap Memory Monitoring** — Checked at `/system/console/memoryusage`. For TarMK instances, Tenured Generation above 3 GB is a warning sign. For MongoMK, it may indicate in-memory cache over-configuration. `OutOfMemoryError: Java heap space` requires heap dump analysis; simply increasing `-Xmx` without fixing the root cause is only a temporary measure [4].

- **Eclipse MAT (Memory Analyzer Tool)** — Primary tool for analyzing `.hprof` heap dump files. The `Leak Suspects` report and `Thread Details` view identify the objects retaining the most memory and the code path that created them [4].

## Technical Details

### Repository Inconsistency: SegmentNotFoundException

The `SegmentNotFoundException` error indicates Oak cannot locate a required segment. This can stem from interrupted compaction, hardware failure, or unclean JVM shutdown [2][3].

**Resolution sequence (must be performed offline — AEM must be stopped):**

```bash
# Step 1: Download matching oak-run jar
# https://mvnrepository.com/artifact/org.apache.jackrabbit/oak-run
# Version must match AEM's Oak core version

# Step 2: Back up the segment store
cp -r ./crx-quickstart/repository/segmentstore/ ./segmentstore-backup/

# Step 3: Find the last good revision
java -Xmx6000m -jar oak-run-*.jar check --bin=-1 /path/to/crx-quickstart/repository/segmentstore
# Look for: "Found latest good revision afdb922d-...:234880"

# Step 4: Revert journal.log to that revision
# Edit ./crx-quickstart/repository/segmentstore/journal.log
# Delete all lines after the identified good revision

# Step 5: Remove .bak files
rm ./crx-quickstart/repository/segmentstore/*.bak

# Step 6: Remove orphaned checkpoints
java -Xmx6000m -jar oak-run-*.jar checkpoints /path/to/segmentstore rm-unreferenced

# Step 7: Run offline compaction
java -Xmx6000m -jar oak-run-*.jar compact /path/to/segmentstore/

# Step 8: Start AEM and wait for indexing to complete
```

If `oak-run check` outputs `"No good revision found"`, manual node removal or Adobe Customer Care is the next step [3].

### OSGi Bundle Failures

Bundles are diagnosed at `/system/console/bundles` (Bundles tab) and components at `/system/console/components` (Components tab) [5][6].

**Resolving `Installed` (unresolved imports):**
- Compile against the latest `com.adobe.aem:aem-sdk-api` Maven dependency.
- Verify no transitive Maven dependency introduces a conflicting package version.
- Check the bundle's `MANIFEST.MF` `Import-Package` header for version range mismatches.

**Resolving `No Config` component state:**
- Create a `<PID>.cfg.json` file in the appropriate runmode config folder:
  ```
  /apps/<project>/osgiconfig/config/
  /apps/<project>/osgiconfig/config.author/
  /apps/<project>/osgiconfig/config.publish.prod/
  ```
- The PID is the OSGi component's full Java class name.

**Resolving `Unsatisfied` component state:**
- Click the component in the Components Console to see the References section.
- Identify which `@Reference` service is missing, then trace why that service's own component is not active (often another `No Config` or `Unsatisfied` upstream).

**Install folder depth rule:** OSGi bundles placed under `/apps` in a folder named `install` are only auto-installed if the folder depth is 4 or fewer path segments from the repository root. For example, `/apps/siteA/install/foo.jar` installs, but `/apps/sites/siteA/jars/install/foo.jar` does not [5].

### Memory Issues

```
# JVM flags for AEM production
-Xms2048m -Xmx8192m
-XX:+HeapDumpOnOutOfMemoryError
-XX:HeapDumpPath=/path/to/dumps/
```

Heap status: `/system/console/memoryusage` [4].

If Tenured Generation stays high after clicking "Run Garbage Collector," generate a heap dump:
```bash
# Find the AEM PID
jps -l
# or
ps -ef | grep java

# Generate heap dump manually
jmap -dump:format=b,file=/path/to/heapdump.hprof <PID>
```

Open `heapdump.hprof` in Eclipse MAT → run `Leak Suspects` report → inspect `Thread Details` for the object with the largest Retained Heap Size [4].

**Buffered image cache (AEM Assets):** Adobe recommends setting the maximum buffered image cache to 2–10% of total heap size to prevent `OutOfMemoryError` during asset uploads [4].

### Replication Queue Blockage

Replication agents: `/etc/replication/agents.author.html`

**Unblock sequence (apply in order, check between each step):**
1. Disable the agent → re-enable it.
2. Restart `com.day.cq.cq-replication` bundle in the Felix Console.
3. Restart `org.apache.sling.event` bundle.
4. Restart `org.apache.felix.eventadmin` bundle.
5. As a last resort, manually delete the first blocked item from the queue and wait 30 seconds [7].

**AEMaaCS:** Use Tools > Deployment > Distribution UI to identify and remove blocking queue items.

## Common Patterns

**Debugging a production outage step-by-step:**
1. Check AEM error log (`crx-quickstart/logs/error.log`) for the characteristic error message.
2. Open the appropriate console:
   - Repository issue → `/system/console/bundles` + check for TarMK errors in the log
   - Bundle issue → `/system/console/bundles` and `/system/console/components`
   - Memory issue → `/system/console/memoryusage`
   - Replication issue → `/etc/replication/agents.author.html`
3. Apply the targeted fix; avoid blanket restarts as the first action.
4. Collect thread dumps (`jstack <pid>`) when high CPU or hanging threads are suspected [1][2].

**OSGi configuration for AEMaaCS runmodes:**
The runmode naming convention `config.<service>.<environment_type>` (e.g., `config.author.prod`) is strictly enforced on AEMaaCS. The configuration with the highest number of matching runmode segments wins for the entire PID — you cannot split a single PID's properties across two config folders [6].

**Async indexing monitoring via JMX:**
Navigate to the JMX console and inspect the async indexer MBean. Key fields:
- `FailingSince`: when indexing first started failing
- `LastError`: stack trace of the failure (empty if not failing)
- `LastIndexedTime`: if more than 5 minutes in the past, indexing is running too slowly [1].

## Gotchas

- **oak-run version mismatch**: Using an oak-run jar that does not match the Oak core version bundled in AEM will produce cryptic errors or silently corrupt the operation. Always check the Oak version in the AEM Felix Console before downloading oak-run [3].

- **Online vs. offline compaction**: The `oak-run compact` command is an **offline** operation — AEM must be stopped. Running online compaction under load via JMX/Maintenance Tasks is a separate mechanism and is appropriate for scheduled maintenance windows, not emergency recovery [3].

- **`Resolved` vs. `Installed` bundle states**: These are commonly confused on exams. `Installed` = class-level dependency unresolved (import package missing). `Resolved` = class dependencies satisfied but the bundle is not yet active (often because a required OSGi service is not present, or the configuration policy is `REQUIRE` and no config file exists). The fix differs: `Installed` requires a Maven/dependency fix; `Resolved` often requires an OSGi config file or activating a dependent service [5][6].

- **`No Config` is not an error**: A component in `No Config` state is working as designed — the developer annotated the component with `configurationPolicy = REQUIRE`. The ops fix is to supply a `.cfg.json` configuration file, not to restart the bundle [6].

- **Replication user privileges**: A blocked replication queue caused by `jcr:namespaceManagement` privilege is easy to miss because it only manifests when namespace information is being replicated. Check the Transport tab of the replication agent for the configured user and verify that user has `jcr:namespaceManagement` at the repository root on the publish instance [7].

- **Increasing heap is not a fix for memory leaks**: Heap leaks show monotonically growing retained heap in successive dumps. Increasing `-Xmx` only delays the `OutOfMemoryError`. The actual fix requires identifying and resolving the leak (e.g., unclosed JCR sessions, unclosed ResourceResolvers) via Eclipse MAT [4].

- **Install folder depth rule in AEM**: Placing a bundle at a path deeper than 4 segments from the repository root inside an `install` folder silently skips installation. No error is logged. This is a common reason a bundle appears to deploy but is never seen in the Felix Console [5].

- **TarMK corruption and FileDatastore**: In TarMK setups without a FileDatastore, if corruption is in binaries, the standard oak-run approach may not work. A patched version (`oak-run-1.2.18-NPR-17596`) must be used to skip unreadable binaries and replace them with zero-byte placeholders [3].

## Sources

[1] **How to analyze common critical AEM issues**
    URL: https://experienceleague.adobe.com/en/docs/experience-cloud-kcs/kbarticles/ka-17457
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Six major issue categories (Sites performance, Assets performance, Memory, Indexing, Replication, TarMK corruption), diagnostic tools (thread dumps, heap dumps, JMX async indexer metrics), and resolution approaches.

[2] **Troubleshooting Adobe Experience Manager**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-65/content/sites/administering/operations/troubleshoot
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Thread dump collection via `jstack`, unclosed JCR session as OOM cause, OSGi bundle and console navigation, memory usage diagnostics.

[3] **Fix inconsistencies in repository when SegmentNotFound reported in AEM 6.x**
    URL: https://experienceleague.adobe.com/en/docs/experience-cloud-kcs/kbarticles/ka-16542
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Full 7-step oak-run recovery procedure: backup, check, journal.log revert, .bak removal, checkpoint cleanup, offline compaction. Also: special case for TarMK without FileDatastore using patched oak-run NPR-17596.

[4] **Analyze Memory Problems (AEM)**
    URL: https://experienceleague.adobe.com/en/docs/experience-cloud-kcs/kbarticles/ka-17482
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Heap monitoring via `/system/console/memoryusage`, tenured generation threshold for TarMK (3 GB), manual heap dump with `jmap`, Eclipse MAT Leak Suspects report, `-XX:+HeapDumpOnOutOfMemoryError` flag, buffered image cache recommendation (2–10% of heap).

[5] **Issues with OSGi bundle states in AEM**
    URL: https://experienceleague.adobe.com/en/docs/experience-cloud-kcs/kbarticles/ka-25706
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Bundle state meanings (Active, Resolved, Fragment), Fragment bundle host-attachment requirement, install folder depth rule (≤4 segments from root), resolution steps for Resolved and Installed states.

[6] **Debugging AEM SDK using the OSGi web console**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-learn/cloud-service/debugging/debugging-aem-sdk/osgi-web-consoles
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: OSGi component states (Active, Satisfied, No Config, Unsatisfied, Disabled), difference between Bundles and Components consoles, runmode-based config folder naming convention, PID-based config file naming, AEMaaCS runmode restrictions.

[7] **Replication queue issues**
    URL: https://experienceleague.adobe.com/en/docs/experience-cloud-kcs/kbarticles/ka-17467
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: FIFO queue semantics, blocked queue diagnosis at `/etc/replication/agents.author.html`, ordered unblock sequence (disable/enable → bundle restart → event bundle restart → manual queue item deletion), `jcr:namespaceManagement` privilege requirement for replication user, AEMaaCS Distribution UI approach.
