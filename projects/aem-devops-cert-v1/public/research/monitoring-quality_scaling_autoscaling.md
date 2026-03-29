# Autoscaling Behavior

**Topic ID:** monitoring-quality.scaling.autoscaling
**Researched:** 2026-03-29T00:00:00Z

## Overview

AEM as a Cloud Service (AEMaaCS) is built on a containerized, Kubernetes-based architecture that enables fully automatic scaling for both the Author and Publish tiers [1]. Unlike AEM 6.x on-premise or Adobe Managed Services (AMS) deployments — where scaling required manual infrastructure changes and planned maintenance windows — AEMaaCS uses an internal orchestration engine that continuously monitors service state and dynamically adjusts resources in real time [2]. Customers have no ability to configure scaling rules, set thresholds, or trigger scaling manually; it is entirely Adobe-managed [3].

The Publish tier scales based on end-user traffic, while the Author tier scales based on authoring activity [1]. Both tiers maintain a minimum of two pods for business continuity during deployments and maintenance tasks [1]. The Preview tier is an exception: it runs on a single node, is not highly available, and may experience downtime during deployments [1]. This three-tier model (Author, Publish, Preview) and the fully managed scaling model are frequently tested concepts in the AEM DevOps certification exam.

Understanding autoscaling in AEMaaCS also means understanding its architectural enablers: the subscription-based content distribution pipeline that decouples author from publish, binary-less architecture that keeps pod images small, and the golden master pattern that allows daily publish node recycling without downtime [4].

## Key Concepts

- **Orchestration Engine** — Adobe's internal system that constantly monitors the state of all AEMaaCS service instances and dynamically scales them up or down based on actual need [2]. The engine adjusts both the number of nodes and per-node resource allocations without customer involvement.

- **Horizontal Scaling** — Increasing or decreasing the number of nodes for a given service tier [2]. The Publish tier is the primary beneficiary: it is "not unusual to see this number expanding in periods of high traffic" beyond the two-node minimum [1].

- **Vertical Scaling** — Adjusting the allocated memory and CPU capacity for a fixed number of nodes [2]. Operates alongside horizontal scaling; both are controlled by the orchestration engine, not the customer.

- **Author Tier Scaling** — The Author tier runs as a cluster of two or more pods sharing a single content repository, and scales based on authoring activity [1]. The two-pod minimum ensures continuity during rolling deployments and maintenance tasks.

- **Publish Tier Scaling** — The Publish tier runs as a farm of two or more independent nodes (each with an AEM publisher plus Dispatcher). It scales with site traffic [1]. Author does not need to know how many publish nodes exist, enabling fast autoscaling [4].

- **Preview Tier** — Consists of a single AEM node used for pre-production quality assurance [1]. It is not autoscaled and may have occasional downtime during deployments. Not subject to the two-node minimum.

- **Golden Master** — A specialized publish node, never accessed by end users, from which all publish nodes are cloned [4]. Maintenance operations such as tar compaction run on the golden master's repository. This enables publish nodes to be recycled daily without any maintenance downtime.

- **Subscription-Based Content Distribution** — AEMaaCS uses Sling Content Distribution over a pipeline on Adobe I/O (outside AEM runtime) instead of traditional replication agents [4]. Content is pushed to queues that all publish nodes subscribe to — this decoupling is what makes fast horizontal autoscaling of the publish tier possible.

- **Binary-less Architecture** — All binary files (blobs) are uploaded and served directly from a cloud data store, bypassing the JVM in both Author and Publish nodes [4]. This keeps pod images small, which directly accelerates autoscaling speed when new pods are created.

- **Customer Scaling Control** — Customers cannot configure any scaling policies, hibernation schedules, or resource thresholds — for production or non-production environments [3]. Customers control only content, code, and application configuration.

## Technical Details

### Scaling Axes

The orchestration engine scales AEMaaCS instances on two independent axes [2]:

```
Vertical axis:
  - Adjust allocated memory per node
  - Adjust CPU capacity per node
  - Applied to a fixed number of nodes

Horizontal axis:
  - Increase or decrease the number of nodes
  - Applied per service tier (Author cluster, Publish farm)
```

Both axes can operate automatically (driven by the orchestration engine) or manually (by Adobe's operations team). Customers have no access to either lever [3].

### Tier Minimums and Topology

| Tier | Min Nodes | Topology | HA? | Scales On |
|------|-----------|----------|-----|-----------|
| Author | 2+ | Cluster (shared repository) | Yes | Authoring activity |
| Publish | 2+ | Farm (independent nodes) | Yes | Site traffic |
| Preview | 1 | Single node | No | Not autoscaled |

[1][2]

### Publish Node Lifecycle (Golden Master Pattern)

```
1. Golden Master node (never public-facing) holds the canonical content repository
2. All new publish nodes are cloned from the golden master
3. Maintenance tasks (compaction, cleanup) run on the golden master only
4. Regular publish nodes are recycled daily — no manual maintenance needed
5. When new nodes are added (scale-out), they self-configure automatically
   via the Sling Content Distribution subscription
```
[4]

### Scaling Enablers: Why Pods Can Scale Quickly

Three architectural choices make fast autoscaling possible [4]:
1. **Small pod images** — Binaries are in the cloud data store, not in the pod.
2. **Stateless publish nodes** — Content state is outside the pod; new nodes can subscribe to the queue immediately.
3. **Decoupled author/publish** — Author does not maintain a list of publish nodes; the subscription pipeline handles fan-out automatically.

### Internal Monitoring Metrics (Adobe-Side)

Adobe's internal monitors check hundreds of signals including [5]:
- CPU iowait percentage
- Instance redeployment frequency
- Disk usage
- Author repository size
- Backup operation success
- Replication queue health
- Data consistency and query performance

These signals inform the orchestration engine's scaling decisions, but they are not exposed as customer-configurable thresholds.

### Customer-Visible Monitoring (New Relic APM)

Customers have read-only access to a New Relic APM suite that shows [6]:
- JVM performance metrics (heap, garbage collection, thread count)
- Transaction times (average response time, slow transactions)
- External service response times
- Database calls
- HTTP error rates (4xx/5xx)

New Relic access in AEMaaCS is restricted to up to 30 read-only users [6]. Customers cannot set up alert conditions or modify dashboards through this integration.

## Common Patterns

**Traffic spike scenario — Publish tier.** When a marketing campaign drives a sudden traffic surge, the orchestration engine detects increased load on publish nodes and scales horizontally (adding nodes). Each new node clones from the golden master and immediately subscribes to the Sling Content Distribution queue. Because binaries are served from the cloud data store and not the node itself, node startup time is fast [1][4].

**Authoring activity — Author tier.** When a large team of authors is active (e.g., during a content migration or simultaneous multi-site authoring), the Author cluster may scale up additional pods. The shared content repository is accessed by all pods in the cluster. The minimum of two pods ensures that rolling deployments (which take one pod offline) do not interrupt authoring [1].

**Daily node recycling.** Each publish node is recycled (torn down and replaced) daily without customer awareness or downtime [4]. The golden master runs maintenance on its own repository; fresh publish nodes are created from it. This is invisible to end users because the Dispatcher cache serves most traffic.

**Non-production environments.** Development, stage, and QA environments also autoscale, but Adobe may scale them down aggressively or suspend them during extended inactivity. Customers cannot configure or prevent this [3].

## Gotchas

- **Customer has zero scaling control.** This is a very common exam trap. In AMS and AEM 6.x, scaling was customer-managed. In AEMaaCS, customers cannot set policies, thresholds, or hibernation schedules. Even for non-production environments, Adobe decides when to scale down [3].

- **Author scales on activity, Publish scales on traffic — not interchangeable.** These are distinct triggers. An exam question might ask "what drives autoscaling on the publish tier?" The correct answer is site traffic, not authoring activity.

- **Preview tier is NOT highly available.** It runs as a single node and may have downtime during deployments [1]. Exam questions may contrast the HA behavior of Author/Publish (two-node minimum) with Preview (single node, no HA guarantee).

- **Horizontal AND vertical scaling are both used.** It is a common misconception that AEMaaCS only scales horizontally. The orchestration engine manages both axes [2].

- **Sling Content Distribution replaces replication agents.** The publish tier can autoscale fast precisely because author does not maintain replication agent connections to each publish node [4]. If an exam question asks why publish scaling is decoupled from author, the answer is the subscription-based Sling Content Distribution pipeline over Adobe I/O.

- **Golden master is never end-user accessible.** It is a maintenance-only node. Exam questions may describe the golden master as "the publish node accessed by users for quality assurance" — this is incorrect; that is the Preview tier.

- **New Relic integration is read-only with no alert configuration.** If an exam question presents a scenario requiring custom alert rules or dashboard modifications, New Relic in AEMaaCS cannot do this natively [6]. Custom alerting requires a separate tool or New Relic account.

- **AEMaaCS is Kubernetes-based.** All instances must have identical configurations because the orchestration engine creates them equal [3]. Ad-hoc configuration or code changes outside the Cloud Manager pipeline are not supported — this is a fundamental architectural constraint, not a policy restriction.

## Sources

[1] **Introduction to the Architecture of Adobe Experience Manager as a Cloud Service**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/overview/architecture
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Tier topology (Author cluster, Publish farm, Preview single node), two-node minimums, scaling drivers (activity vs traffic), containerized Docker pod architecture, orchestration engine overview.

[2] **An Introduction to the Architecture of AEM as a Cloud Service — AEM Community**
    URL: https://aem.community/docs/aem/adobe-experience-cloud/aem-cloud/intro-to-the-architecture
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Vertical and horizontal scaling axes, orchestration engine behavior, all instances created equal with same default sizing, manual and automatic scaling modes.

[3] **AEM Cloud Service Autoscaling and Customer Control for Lower Environments — Adobe Experience League Community**
    URL: https://experienceleaguecommunities.adobe.com/t5/adobe-experience-manager/aem-cloud-service-autoscaling-and-customer-control-for-lower/m-p/751060
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Official Adobe response confirming customers cannot configure scaling rules; non-production environments scale down during inactivity; all scaling is Adobe-managed.

[4] **How does Content Publishing work in AEM as a Cloud Service? — Adobe Experience League**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-learn/cloud-service/developing/basics/content-publishing
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Sling Content Distribution replacing replication agents, golden master pattern, daily publish node recycling, binary-less architecture enabling fast autoscaling, subscription-based queue decoupling author from publish.

[5] **Infrastructure and Service Monitoring in AEM as a Cloud Service — Adobe Experience League**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/operations/monitoring
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: Hundreds of cloud-native monitors, internal metrics (CPU iowait, disk, replication queue, repository size, backup health), Service Edge Monitoring at five locations for production SLA, custom monitoring for customers with own CDN.

[6] **How to Use New Relic One to Monitor AEMaaCS Properties — Perficient / Observability in AEM as a Cloud Service — Medium**
    URL: https://blogs.perficient.com/2023/12/22/how-to-use-new-relic-one-to-monitor-aemaacs-properties/
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: New Relic APM integration built-in, read-only access for up to 30 users, JVM metrics (heap, GC, threads), transaction times, HTTP errors, custom dashboards for author and publish environments, no alert configuration capability.
