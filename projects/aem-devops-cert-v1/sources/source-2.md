# Introduction to Cloud Manager for AEM (Adobe Managed Services)

**Source:** https://experienceleague.adobe.com/docs/experience-manager-cloud-manager/content/introduction.html
**Extraction ID Prefix:** EXT-2
**Extracted:** 2026-03-29T00:00:00Z
**Content Authority:** Official Adobe Experience League documentation (authoritative for certification exam purposes)

## Summary

Cloud Manager is Adobe's CI/CD platform purpose-built for Adobe Experience Manager (AEM) on Adobe Managed Services (AMS). It accelerates code delivery from months/weeks to days/hours through optimized pipelines, automated code quality scanning, performance testing, and security validation. The platform also offers optional advanced deployment features including autoscaling and blue/green deployments.

## Key Facts

- `EXT-2-fact-1`: Cloud Manager is specifically for AEM on Adobe Managed Services (AMS). AEM as a Cloud Service has completely separate Cloud Manager documentation and behavior.
- `EXT-2-fact-2`: Cloud Manager's CI/CD pipeline reduces time-to-market from months/weeks to days/hours.
- `EXT-2-fact-3`: Cloud Manager uses an open API approach, allowing integration with existing DevOps processes and tools without disrupting them.
- `EXT-2-fact-4`: Code scanning is performed before production deployment and includes three categories: code inspection, performance testing, and security validation.
- `EXT-2-fact-5`: Quality checks are always performed regardless of the deployment trigger (automatic or scheduled).
- `EXT-2-fact-6`: Cloud Manager supports two deployment trigger modes: automatic (triggered by specific events such as code commit) and scheduled (during specified timeframes such as outside business hours).
- `EXT-2-fact-7`: Application-specific KPIs can be defined in Cloud Manager, including peak page views per minute and expected page load response time.
- `EXT-2-fact-8`: Cloud Manager provides role and permission management for team members through a self-service interface.
- `EXT-2-fact-9`: Cloud Manager supports both Production Pipelines and Non-Production Pipelines as distinct configurable entities.
- `EXT-2-fact-10`: Autoscaling detects unusually high load and automatically provisions additional capacity within minutes.
- `EXT-2-fact-11`: Autoscaling adds capacity via horizontal scaling of 1 to 10 Dispatcher/publishing segment pairs.
- `EXT-2-fact-12`: Autoscaled capacity is provisioned in the same region and with the same specifications as existing infrastructure.
- `EXT-2-fact-13`: Autoscaled capacity must be manually scaled-in within a period of ten business days, as determined by the Adobe CSE.
- `EXT-2-fact-14`: Blue/green deployment creates two identical production environments to reduce downtime and risk during deployments.
- `EXT-2-fact-15`: Blue/green deployment is available only for Dispatcher/publisher pairs -- not for preview pairs.
- `EXT-2-fact-16`: Blue/green deployment requires additional validation of environments by Adobe CSE before it can be enabled.
- `EXT-2-fact-17`: Blue/green deployment is supported on both AWS and Azure.
- `EXT-2-fact-18`: Blue/green deployment is available only for production environments.
- `EXT-2-fact-19`: Blue/green deployment is NOT available to Assets-only customers.
- `EXT-2-fact-20`: In blue/green deployments, every iteration creates new publish and Dispatcher servers (transient instances), while the green load balancer created during setup is unchanging.

## Definitions

- `EXT-2-def-1`: **Cloud Manager** -- Adobe's CI/CD platform that enables developers to create impactful customer experiences through streamlined workflows, built upon Adobe Experience Manager best practices.
- `EXT-2-def-2`: **Blue/Green Deployment** -- A deployment strategy using two identical production environments (blue = existing, green = new) where traffic is switched from blue to green after validation, reducing downtime and deployment risk.
- `EXT-2-def-3`: **Autoscaling** -- An optional Cloud Manager feature that automatically detects increased capacity needs in production and provisions additional Dispatcher/publishing segments via horizontal scaling.
- `EXT-2-def-4`: **AMS (Adobe Managed Services)** -- The Adobe-managed hosting model for AEM, as distinct from AEM as a Cloud Service which is cloud-native.
- `EXT-2-def-5`: **CSE (Customer Success Engineer)** -- An Adobe technical resource responsible for advanced validation (e.g., enabling blue/green deployments) and manual scale-in operations after autoscaling events.

## Patterns and Best Practices

- `EXT-2-pattern-1`: **Blue/Green Deployment Flow** -- The blue/green deployment follows a 10-step process compared to standard deployment's simpler flow. It includes multiple pause points for testing and sign-off, each allowing up to 24 hours.

### Blue/Green vs Standard Deployment Comparison

| Step | Blue/Green Deployment | Standard Deployment |
|------|----------------------|---------------------|
| 1 | Deployment to author | Deployment to author |
| 2 | Pause for testing | -- |
| 3 | Green infrastructure created | -- |
| 4 | Deployment to green Publish/Dispatcher | Deployment to publisher |
| 5 | Pause for testing (up to 24 hours) | -- |
| 6 | Green added to production load balancer | -- |
| 7 | Blue removed from production load balancer | -- |
| 8 | Pause for final sign-off (up to 24 hours) | -- |
| 9 | Blue infrastructure terminated automatically | -- |
| 10 | Pipeline completes | -- |

- `EXT-2-pattern-2`: **Autoscaling Scope** -- Autoscaling applies only to the Dispatcher/publishing tier (not the author tier), using horizontal scaling rather than vertical scaling.
- `EXT-2-pattern-3`: **KPI-Driven Quality Gates** -- Cloud Manager allows definition of application-specific KPIs (peak page views/minute, page load response time) that serve as quality gates in the CI/CD pipeline.
- `EXT-2-pattern-4`: **Deployment Flexibility** -- Use automatic deployments for continuous delivery triggered by code commits, or scheduled deployments for controlled releases outside business hours. Both modes enforce the same quality checks.

## Important Warnings

- `EXT-2-warn-1`: This documentation covers Cloud Manager for AMS exclusively. AEM as a Cloud Service has a separate, different Cloud Manager. Confusing the two on a certification exam could lead to incorrect answers.
- `EXT-2-warn-2`: Autoscaling capacity scale-in is NOT automatic -- it requires manual intervention via the Adobe CSE within ten business days.
- `EXT-2-warn-3`: Blue/green deployment requires all Dispatcher/publish pairs to be identical within the environment. Mismatched configurations will prevent use of this feature.
- `EXT-2-warn-4`: Blue/green deployment is NOT available for Assets-only customers, even if they are on AMS with Cloud Manager.
- `EXT-2-warn-5`: Blue/green deployment is production-only. It cannot be used in staging or development environments.
- `EXT-2-warn-6`: Enabling blue/green deployments requires coordination with an Adobe CSE for additional environment validation -- it is not a self-service toggle.
