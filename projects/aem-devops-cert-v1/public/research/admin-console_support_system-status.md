# System Status and Notifications

**Topic ID:** admin-console.support.system-status
**Researched:** 2026-03-29T00:00:00Z

## Overview

Adobe System Status (status.adobe.com) is the centralized portal for monitoring the real-time health of all Adobe cloud products and services, including Adobe Experience Manager as a Cloud Service [1]. The page surfaces both unplanned incidents (service outages, degradations) and planned maintenance events, distinguishing between them with color-coded severity indicators [5]. For AEM DevOps professionals, tracking system status is critical for distinguishing platform-level incidents from application-level issues during on-call scenarios.

AEM as a Cloud Service supplements the system status page with its own in-product notification framework. Adobe runs hundreds of cloud-native monitors 24/7/365 and provides multiple channels for alerting: the Actions Center within experience.adobe.com, email notifications via product profiles in Admin Console, and Cloud Manager in-app alerts [2][3]. Understanding which channel delivers which type of alert — and how to configure access — is directly testable on the AEM DevOps certification exam.

Maintenance windows in AEM as a Cloud Service are managed differently than traditional on-premise AEM. Adobe ships maintenance releases on a rolling cadence and provides mechanisms for customers to protect time-sensitive periods (quiet hours and update-free periods), but the advance notice window is short — typically only an hour or two [4]. This is a key distinction exam candidates must internalize.

## Key Concepts

- **Adobe System Status** — The canonical source at status.adobe.com for service availability and performance impact data across all Adobe products. Covers both ongoing incidents and historical events [1]. Navigate to Experience Cloud > Adobe Experience Manager to view AEM-specific status [6].

- **Incident vs. Maintenance event** — Incidents are unplanned service disruptions (color-coded orange for Minor, red for Major); Maintenance events are planned, color-coded blue [5]. The distinction matters for SLA calculations and for interpreting notification timing.

- **Severity levels on status.adobe.com** — Four states: Green (normal), Grey/Potential (investigated, non-impactful), Orange/Minor (minor issue), Red/Major (major issue), Blue/Maintenance (scheduled) [5]. Incidents can be dynamically escalated or de-escalated between minor and major.

- **Proactive Subscriptions** — Users can subscribe to email notifications for specific Adobe products, regions, and environments directly from status.adobe.com. Requires an Adobe account and whitelisting `message@adobe.com` to prevent spam filtering [1].

- **Notification Profiles (AEM-specific)** — Two Admin Console product profiles control who receives AEM incident and proactive email notifications: `Incident Notification - Cloud Service` and `Proactive Notification - Cloud Service`. These must be created with exact names [3].

- **Actions Center** — The in-product notification hub at experience.adobe.com/aem/actions-center/ that surfaces both operational incidents and proactive optimization recommendations. Scoped to production environments only [3].

- **Maintenance Releases** — AEM as a Cloud Service receives frequent maintenance updates. Advance notice is minimal (an hour or two), not weeks. Cloud Manager is the recommended monitoring point; an update appearing on dev signals upcoming stage/production updates [4].

- **Quiet Hours** — A per-program Cloud Manager setting that blocks automatic updates during a specified daily window (up to 8 hours). Requires Business Owner or Deployment Manager role [7].

- **Update-Free Periods** — Extended 7-day windows where no maintenance updates occur. Up to 3 allowed per 365-day rolling window, schedulable up to one year in advance, with mandatory one-week gaps between periods [7].

- **Adobe Status API** — A developer API at developer.adobe.com/adobe-status/ for programmatic access to real-time Adobe service status, filterable by Product, Region, Environment, Locale, and Event Type. Used for custom monitoring dashboards and integrations [8].

## Technical Details

### Status Page Navigation for AEM

To check AEM service status [6]:
1. Visit https://status.adobe.com
2. Select "Experience Cloud" from the top menu
3. Locate AEM services in two categories:
   - **Adobe Experience Manager**: includes Brand Portal, Cloud Manager, Dynamic Media
   - **Adobe Experience Manager as a Cloud Service**: includes Sites Delivery, Sites Management, Assets Cloud
4. Use "Filter By" to specify a date range for historical review
5. Click Major / Minor / Potential / Maintenance filter links to narrow results

### Subscribing to Proactive Notifications

Steps to subscribe at status.adobe.com [1]:
1. Navigate to https://status.adobe.com and click "Manage Subscriptions"
2. Sign in with Adobe credentials
3. Select the product (e.g., Experience Cloud > AEM as a Cloud Service)
4. Select the environment(s) to monitor
5. Confirm preferences
6. Whitelist `message@adobe.com` to ensure delivery

### Configuring AEM Notification Profiles in Admin Console

For AEM as a Cloud Service incident/proactive notifications [3]:
1. Access Admin Console at adminconsole.adobe.com
2. Under Cloud Manager, create two product profiles with these **exact** names:
   - `Incident Notification - Cloud Service`
   - `Proactive Notification - Cloud Service`
3. Assign users (individual Adobe IDs or groups) to the appropriate profiles
4. By default, assigned users receive notifications for all programs
5. Use custom READ permissions on specific programs to limit scope

### Planned Maintenance Notification Timing

For planned maintenance (CMR = Change Management Request approved) [5]:
- Notification sent up to **30 days in advance** when CMR is approved
- Adobe System Status updated simultaneously
- Urgent/unplanned CMRs appear on status.adobe.com immediately upon approval
- CSOs (Customer Service Outages) appear immediately when a Discovery/Investigation phase CSO is created at Sev 2 or higher

### Cloud Manager SLA Reporting

Three SLA metrics tracked in Cloud Manager production reports [2]:
- **End User Contract**: SLA defined in the Adobe contract for publish tier
- **AMS End User SLA**: Measured uptimes factoring vendor and Adobe-caused incidents
- **End User SLA**: Measured uptime **ignoring scheduled maintenance downtime** — the cleanest measure of unplanned impact

### Quiet Hours and Update-Free Periods Configuration

Both features configured via Cloud Manager: Activities > Automatic Updates > Update Options [7]:

| Feature | Max Duration | Limit | Advance Scheduling | Role Required |
|---|---|---|---|---|
| Quiet Hours | 8 hrs/day | Daily recurring | N/A | Business Owner / Deployment Manager |
| Update-Free Period | 7 days | 3 per 365 days | Up to 1 year | Business Owner / Deployment Manager |

Adobe also defines 2-3 annual platform-wide maintenance exclusion periods that cannot be used for update-free periods [7].

### Adobe Status API

The API at developer.adobe.com/adobe-status/ provides real-time event data filterable by [8]:
- Product and Product Offering
- Region
- Environment
- Locale
- Event Type (incident vs. maintenance)

Use case: integrate into internal monitoring dashboards or alerting pipelines to automate response to Adobe service disruptions.

## Common Patterns

**Scenario: On-call engineer receives a customer report of slow page loads.** The first step is to check status.adobe.com and filter to AEM as a Cloud Service. If a Minor or Major incident is listed, the issue is likely platform-level and the team should monitor for Adobe updates rather than debugging application code. If no incident is listed, investigate application-level causes.

**Scenario: Development team needs protection during a major product launch.** Configure an Update-Free Period in Cloud Manager for the 7 days surrounding the launch. Schedule it up to a year in advance. Also configure Quiet Hours for daily peak traffic windows. Both settings require Business Owner or Deployment Manager role.

**Scenario: Large organization needs multiple teams to receive status alerts for different programs.** Create the two Notification Profile product profiles in Admin Console and assign team members. Use custom READ permissions per program to limit each team's notification scope rather than flooding all users with all programs.

**Scenario: DevOps team wants automated Slack alerts for Adobe service incidents.** Use the Adobe Status API to poll for events filtered by AEM products and regions, then integrate with Slack. Alternatively, use Adobe I/O Events with a webhook for push-based delivery.

## Gotchas

- **Maintenance release advance notice is very short.** Exam candidates often assume maintenance windows are communicated days or weeks in advance like traditional enterprise software. For AEM as a Cloud Service maintenance releases, notice is only an hour or two [4]. Planned maintenance CMRs visible on status.adobe.com can be up to 30 days ahead, but maintenance *release* notifications in-product are near real-time.

- **Notification Profile names must be exact.** The product profiles in Admin Console must be named precisely `Incident Notification - Cloud Service` and `Proactive Notification - Cloud Service` — any typo breaks notification delivery [3]. This is a common admin mistake.

- **Actions Center is production-only.** Notifications in the Actions Center are limited to production environments. Incidents on development or staging environments do not surface there [3].

- **"End User SLA" excludes scheduled maintenance.** When calculating unplanned downtime, use the "End User SLA" metric in Cloud Manager reports, not the "AMS End User SLA." The AMS figure includes planned windows and can be misleading [2].

- **Update-Free Periods have a hard cap.** Only 3 update-free periods allowed per 365-day rolling window. Teams planning around many release events must prioritize carefully. The mandatory one-week gap between periods also limits back-to-back protection [7].

- **"Potential" severity does not mean an active incident.** The grey "Potential" state on status.adobe.com indicates Adobe investigated a possible disruption and determined it was non-impactful — the service is actually fine [5]. Confusing "Potential" with a minor active incident is a common mistake.

- **Proactive email subscriptions vs. Notification Profiles are separate systems.** Subscribing at status.adobe.com gives broad product-level alerts for anyone with an Adobe account. Notification Profiles in Admin Console are for AEM-specific operational alerts tied to specific programs and environments. These are not the same thing.

- **Cloud Manager dev environment as a leading indicator.** When a maintenance update appears available on the development environment in Cloud Manager, it signals that stage and production updates are coming next. This is the practical early-warning mechanism, not email alerts [4].

## Sources

[1] **Adobe System Status — Proactive Subscriptions Help**
    URL: https://status.adobe.com/help/proactivesubscriptions
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Subscription process, Adobe account requirement, whitelisting message@adobe.com, product/environment selection steps

[2] **Infrastructure and Service Monitoring in AEM as a Cloud Service**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/operations/monitoring
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: External availability monitoring (Service Edge, Custom Monitoring), internal module monitoring checks, SLA metric definitions (End User Contract, AMS End User SLA, End User SLA), five-location availability monitoring

[3] **Notification Profiles — AEM as a Cloud Service**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/onboarding/concepts/notification-profiles
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Exact product profile names, incident vs. proactive notification types, Admin Console assignment steps, Actions Center scope (production-only), 20+ notification types list

[4] **Maintenance Release Notifications for AEM as a Cloud Service (KBA)**
    URL: https://experienceleague.adobe.com/en/docs/experience-cloud-kcs/kbarticles/ka-23746
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Advance notice timing (hour or two, not weeks), Cloud Manager as notification hub, dev environment as leading indicator for stage/production updates

[5] **Adobe System Status FAQ**
    URL: https://experienceleague.adobe.com/en/docs/adobe-system-status/using/faq
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Color-coded severity levels (Green/Grey/Orange/Red/Blue), planned vs. urgent CMR notification timing (up to 30 days for planned), CSO appearance rules (Sev 2+), dynamic incident escalation

[6] **How to Check the Status of AEM-Related Services (KBA)**
    URL: https://experienceleague.adobe.com/en/docs/experience-cloud-kcs/kbarticles/ka-22310
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Step-by-step navigation on status.adobe.com for AEM, two AEM product categories (AEM and AEM as a Cloud Service), filter-by-date functionality

[7] **Quiet Hours and Update Free Periods — AEM as a Cloud Service**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/deploying/quiet-hours-update-free-periods
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Quiet hours max 8 hours/day, update-free period rules (7-day, max 3/year, 1-year advance scheduling, mandatory 1-week gap), Adobe annual exclusion periods (2-3/year), role requirements (Business Owner / Deployment Manager)

[8] **Adobe Status API Overview**
    URL: https://developer.adobe.com/adobe-status/
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: API filtering dimensions (Product, Region, Environment, Locale, Event Type), use case for custom monitoring dashboards and integrations
