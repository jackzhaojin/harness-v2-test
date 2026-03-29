# Support Ticket Submission

**Topic ID:** admin-console.support.ticket-submission
**Researched:** 2026-03-29T00:00:00Z

## Overview

Adobe Admin Console serves as the central hub for enterprise and team support case management, enabling designated administrators to submit, track, and escalate support requests directly through the interface [1]. Only users with **System Administrator** or **Support Administrator** roles can access the Support tab and interact with Adobe Customer Care on behalf of their organization [2]. End users cannot submit support tickets directly — they must contact their organization's admin, who then creates the case.

Adobe uses a four-tier priority classification system (P1 through P4) that governs initial response time SLAs, routing, and escalation urgency [3]. The priority framework is tied directly to business impact, not just technical severity. For production-down P1 scenarios, Adobe mandates direct phone contact — not just web case submission — to ensure immediate engagement [1]. Support plan tier (Expert Success vs. Ultimate Success vs. legacy Enterprise/Online plans) determines response time guarantees, named contact limits, and escalation capabilities.

For AEM as a Cloud Service specifically, the Admin Console is the primary intake point for all product support requests. Cases are categorized under "Experience Cloud" when the product is AEM. Adobe's on-call support teams are automatically engaged for P1 service-edge monitoring alerts on AEM Cloud Service production environments [4].

## Key Concepts

- **Support tab access** — Only System Administrators and Support Administrators can see and use the Support tab in the Admin Console. Regular users must escalate to their admin to initiate a case [1][2].

- **P1 (Critical)** — Production system outage or extremely serious interruption. Requires immediate phone contact with Adobe Customer Care in addition to creating a web case. Under Enterprise/Expert plans: 30-minute initial response (24x7). Under Online plans: 1-hour initial response (24x7) [3].

- **P2 (Urgent)** — Serious interruption with major service degradation or potential data loss, enterprise-wide impact. Under Enterprise plans: 1-hour response (24x5). Under Online plans: 4-hour response (business hours) [3].

- **P3 (Important)** — Minor service degradation; a workaround exists. Under Enterprise plans: 2-hour response (business hours). Under Online plans: 6-hour response (business hours) [3].

- **P4 (Minor)** — General questions, API/integration questions, documentation requests, enhancement requests. Under Enterprise plans: 1-business-day response. Under Online plans: 3-business-day response [3].

- **Named Support Contacts** — Only designated named contacts can submit cases. Expert Success plans allow 4 named contacts per product; Ultimate Success plans allow up to 15 named contacts per product [2][5].

- **Case escalation** — If progress is unsatisfactory, any open case can be escalated via the "Escalate Case" button under the Actions tab. Both the support manager and the assigned Technical Support Engineer are notified [1][2].

- **Case reopening** — Closed cases can be reopened within 14 days of closure [1][2].

- **Expert Sessions** — 30-minute scheduled phone consultations on product how-to topics. Require 24-hour advance notice, available Monday–Friday, must provide three proposed time slots. Sessions are screen-share enabled and produce a case record [2].

- **AEM Cloud Service add-ons** — Expert Success and Ultimate Success customers with AEM Cloud Service can purchase the Advanced Cloud Support Add-on for specialized cloud guidance. Ultimate Success customers can also purchase a Designated Advanced Cloud Support Add-on for a dedicated named cloud expert [5].

## Technical Details

### Case Submission Workflow

To create a support case in the Admin Console [1][2]:

```
1. Sign into Admin Console (https://adminconsole.adobe.com)
2. Navigate to Support > Support Summary
3. Select the product category:
   - Administration
   - Creative Cloud
   - Document Cloud
   - Experience Cloud  ← use this for AEM issues
4. Click "Create Case"
5. Fill in:
   - Issue description
   - Priority (P1–P4)
   - Impact scope: Small (1-2 users) | Medium (specific group) | Large (most users)
6. Attach relevant files (under 50 MB; .dll and .exe files prohibited)
7. Submit — a case ID is assigned immediately
```

### Priority / Response Time SLA Table

Based on legacy Enterprise vs. Online plan tiers [3]:

| Priority | Definition | Online Plan Response | Enterprise Plan Response |
|----------|-----------|---------------------|-------------------------|
| P1 | Production down / significant data loss | 24x7 / 1 hour | 24x7 / 30 minutes |
| P2 | Major degradation / potential data loss | Business hours / 4 hours | 24x5 / 1 hour |
| P3 | Minor degradation / workaround exists | Business hours / 6 hours | Business hours / 2 hours |
| P4 | General question / enhancement request | Business days / 3 days | Business day / 1 day |

Note: "Ultimate Success" and "Expert Success" are Adobe's current plan naming conventions. The table above maps to older "Enterprise" and "Online" tier nomenclature used in Adobe's published data sheets.

### Escalation Process

```
1. In Admin Console, go to Support > Support Cases
2. Click the title of the case to open it
3. Click "Escalate Case" under the Actions tab
4. Fill in the reason for escalation and business impact
5. Click Submit
   → Both the Support Manager and assigned TSE are notified

Alternative: If "Escalate Case" button is unavailable,
call the phone number on your Support tab to arrange escalation verbally.
```

Under Ultimate Success plans, escalated cases are routed through cross-department escalation involving engineering, management, and support teams. The designated Support Services Manager (SSM) provides recurring status reviews [5].

### Notification Management

Cases can send email updates to up to 10 email addresses [1][2]. Attachments are accepted under 50 MB (per the Enterprise support page) or 20 MB (per the Experience Cloud support page) — see Gotchas section for the discrepancy.

### Live Chat

Available from the Support Summary page. Chat topic selection at the start determines routing. Post-chat, the conversation is automatically saved as a trackable case with a case ID [2].

## Common Patterns

**Scenario: Production AEM environment is down (P1)**
The correct workflow is: immediately call Adobe Customer Care using the phone number on the Admin Console Support tab AND simultaneously create a web case marked P1. Calling is not optional for P1 — Adobe's documentation explicitly states phone contact should accompany case submission for critical incidents [1].

**Scenario: AEM feature behaves unexpectedly but a workaround exists (P3)**
Submit as P3 via web form. Select "Experience Cloud" as the product category, describe the workaround in the case body to set accurate expectations. Expect response within business hours.

**Scenario: Developer needs integration guidance (P4)**
API questions and documentation requests are explicitly P4 scope. These are handled during business days with 1-3 day response depending on plan. Expert Sessions (30-minute phone consultations) are a better channel for how-to topics than opening a P4 case.

**Scenario: Case not progressing after several days (P3)**
Use the "Escalate Case" button in the Admin Console Actions tab. Provide detailed business impact justification in the escalation form. The TSE's manager is notified directly.

**Scenario: Administrator leaves the organization**
Named Support Contacts are managed via the Admin Console. Under Ultimate Success, one named contact can be designated as account administrator to self-service update the contact list [5].

## Gotchas

- **Phone contact is mandatory for P1** — Many candidates assume a web case submission is sufficient for P1. Adobe explicitly states that for P1 (Critical), you should call Adobe Customer Care directly. Web case creation alone is not the recommended action [1].

- **Support Admins vs. System Admins** — Both roles can submit tickets, but they are distinct roles. A Support Admin can only manage support cases; a System Admin can do everything including manage users and licenses. Only assigning Support Admin role (not full System Admin) follows least-privilege best practice [1][2].

- **"Escalate Case" button may not appear** — If the escalate button is not available on a case, the correct workaround is to call the support number on the Support tab. This is a documented edge case, not a permissions problem [1].

- **File attachment size discrepancy** — The Enterprise support documentation states files up to 50 MB are allowed [1], while the Experience Cloud support documentation states the limit is 20 MB [2]. The 20 MB figure appears to apply specifically to Experience Cloud product cases. Candidates may see either figure — default to the more restrictive 20 MB for AEM/Experience Cloud cases.

- **Closed case reopen window is 14 days** — After 14 days, you cannot reopen a case. You must create a new one. This is a commonly tested boundary condition [1][2].

- **Expert Sessions require 24-hour advance notice** — Cannot be requested same-day. Available Monday–Friday only, English language (additional languages for Enterprise/Teams: French, German, Japanese) [1][2].

- **End users cannot submit tickets** — Only System Admins and Support Admins can contact Adobe Customer Care directly. End users are explicitly blocked from the Support tab [1][2].

- **Named contact limits by plan** — Expert Success: 4 named contacts per product. Ultimate Success: up to 15 named contacts per product. Exceeding the limit requires plan upgrade or contact removal — you cannot bypass this [5].

- **Case categories matter for routing** — Submitting an AEM issue under "Administration" instead of "Experience Cloud" will delay routing to the correct team. Always select "Experience Cloud" for AEM-related cases [2].

- **P1 vs. P2 distinction in practice** — P1 = production down / complete outage. P2 = severe degradation but system still partially functional, or financial risk exists. This distinction determines whether 24x7 or 24x5 response applies and whether same-priority phone escalation is appropriate.

## Sources

[1] **Enterprise Support and Expert Sessions — Adobe Admin Console**
    URL: https://helpx.adobe.com/enterprise/using/support-for-enterprise.html
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Case creation workflow, P1-P4 definitions, escalation procedure via Admin Console, file attachment limits (50 MB), live chat behavior, Expert Session requirements, notification email limit (10 addresses), case reopening 14-day window.

[2] **Experience Cloud Support and Expert Sessions — Adobe Admin Console**
    URL: https://helpx.adobe.com/enterprise/using/support-for-experience-cloud.html
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Support Admin vs. System Admin access requirements, case categories (Administration/Creative Cloud/Document Cloud/Experience Cloud), file attachment limit for Experience Cloud (20 MB), Expert Session language availability, reopening cases within 14 days, chat auto-saves as case.

[3] **Enterprise Support Data Sheet — Adobe Experience League**
    URL: https://experienceleague.adobe.com/en/docs/support-resources/data-sheets/prior-plans/data-sheets/enterprise
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Detailed P1-P4 response time SLAs by plan tier (Online vs. Enterprise), named contact counts per plan, Named Support Engineer details, bi-annual service reviews.

[4] **Infrastructure and Service Monitoring in AEM as a Cloud Service**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/operations/monitoring
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: Service Edge Monitoring for production environments, automatic engagement of Adobe on-call teams for availability alerts, SLA tracking for Author and Publish tiers.

[5] **Adobe Expert Success and Ultimate Success Plans**
    URL: https://business.adobe.com/customers/consulting-services/premier-support.html
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: Named contact limits (4 for Expert Success, up to 15 for Ultimate Success), Support Services Manager (SSM) under Ultimate Success, AEM Cloud Service Advanced Cloud Support Add-on and Designated Advanced Cloud Support Add-on, cross-department escalation for Ultimate Success escalated cases.
