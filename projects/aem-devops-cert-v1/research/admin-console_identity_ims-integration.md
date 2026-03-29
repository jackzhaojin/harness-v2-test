# Adobe IMS Integration

**Topic ID:** admin-console.identity.ims-integration
**Researched:** 2026-03-29T00:00:00Z

## Overview

Adobe Identity Management System (IMS) is Adobe's centralized OAuth 2.0-based identity platform that provides a unified authentication and authorization layer across all Adobe Experience Cloud products, including AEM as a Cloud Service [1]. Rather than managing user identities on a per-application basis, IMS acts as the single authoritative source for who can access AEM Author environments — replacing the traditional AEM-local login model with redirected authentication via Adobe's IMS endpoint [2].

For AEM as a Cloud Service, IMS integration is pre-configured and mandatory for Author, Admin, and Developer users [1]. Administrators do not need to enable or configure the IMS connection itself — it is automatically set up when AEM environments are provisioned [3]. The Admin Console becomes the central management hub where system administrators add users, define user groups, assign product profiles, and configure SSO with a corporate identity provider (IdP). This consolidates all Experience Cloud access management into a single interface.

The IMS model matters for DevOps and certification contexts because it establishes the permission chain that flows from the Adobe Admin Console through IMS product profiles into AEM-level groups and ACLs. Understanding where each control point lives — and which objects should not be modified — is critical for both real-world deployments and exam scenarios.

## Key Concepts

- **IMS Organization** — The top-level entity in Adobe's identity system representing an enterprise customer. All Admin Console configurations, users, and product profiles belong to an IMS Org. Customer onboarding to an IMS Organization is a prerequisite to using IMS authentication with AEM [1].

- **Adobe Admin Console** — The web portal at `adminconsole.adobe.com` where system administrators manage user identities, group memberships, product profiles, and SSO configuration for all Adobe products including AEM as a Cloud Service [1][3].

- **IMS Authentication Flow** — When a user navigates to AEM Author, they are redirected to the Adobe IMS login portal. IMS authenticates the user (optionally delegating to a corporate IdP via SAML 2.0), then redirects back to AEM with an IMS bearer token [2]. All subsequent CRUD requests carry this bearer token in HTTP headers [1].

- **Product Profiles** — Admin Console objects that gate access to a specific AEM environment tier. Two profiles are auto-created per AEM environment: `AEM Administrators` (full admin access) and `AEM Users` (read-only/contributors access) [3][4]. Users must belong to at least one profile to log in.

- **IMS User Groups** — Logical groupings of users managed in Admin Console. They do NOT directly grant permissions in AEM — they are organizational containers. In AEM Cloud Service, IMS user groups cannot be assigned directly to product profiles [3][4].

- **Identity Types** — Adobe supports three identity types: Adobe ID (personal, minimal org control), Enterprise ID (org-owned, Adobe-hosted authentication, no SSO), and Federated ID (org-owned, SSO via SAML 2.0 to a corporate IdP) [5]. Only Enterprise ID and Federated ID are supported for AEM production use.

- **IMS Sync to AEM** — After authentication, IMS group memberships are synced into AEM as AEM groups. IMS-synced groups should then be added to local AEM groups where ACLs are defined — permissions are never applied directly to synced IMS groups [3][4].

- **Server-to-Server IMS Integrations** — AEM can integrate with other Adobe solutions (Analytics, Target) via OAuth Server-to-Server credentials configured in the Adobe Developer Console. The older JWT credential method is deprecated [6].

## Technical Details

### Authentication Flow (Step-by-Step)

1. User navigates to AEM Author URL and clicks "Sign in with Adobe."
2. Browser redirects to Adobe IMS (`ims-na1.adobelogin.com`).
3. User enters their email address.
4. If a **Federated ID** domain is configured, IMS initiates a SAML 2.0 request and redirects the user to the corporate IdP (e.g., Okta, ADFS, Shibboleth, Ping).
5. Corporate IdP authenticates the user and returns a SAML assertion to IMS.
6. IMS issues an OAuth access token and redirects the user back to AEM.
7. AEM validates the bearer token; IMS group memberships are synced into AEM [1][2].

### IMS Bearer Token Validation

For session management, the token is periodically re-validated. If the token was last checked more than 10 minutes ago, AEM makes an API call to IMS to validate the access token. If valid, the `token_last_check_time` is updated. If invalid, the session is terminated [1].

### Product Profile to AEM Permission Chain

```
Admin Console (IMS Organization)
  └── Product: AEM as a Cloud Service
        └── Product Profile: "AEM Administrators_<env>" or "AEM Users_<env>"
              └── Users assigned to profile
                    └── On login: synced into AEM as IMS groups
                          └── IMS groups added to AEM local groups
                                └── AEM local groups have CRX ACLs applied
```

- `AEM Administrators` product profile → syncs as AEM group → grants admin rights [3][4]
- `AEM Users` product profile → syncs into `contributors` AEM group → read-only access [3][4]

### Cloud Manager Product Profiles (Separate from AEM Profiles)

Cloud Manager has its own four profiles — Business Owner, Deployment Manager, Developer, Program Manager — which control pipeline and environment management permissions. These are distinct from AEM product profiles. Having Cloud Manager admin permissions does NOT grant access to AEM Author [4].

### IMS Integrations for Service-to-Service (S2S)

For integrating AEM with Adobe Analytics, Target, and other Adobe services programmatically:

1. Create OAuth Server-to-Server credentials in **Adobe Developer Console**.
2. In AEM, navigate to `Tools > Security > Adobe IMS Integration`.
3. Create a new configuration using credentials from Developer Console.
4. Migrate existing JWT configurations: change Authentication Type dropdown from JWT to OAuth.

Auto-provisioned JWT configurations (created by Adobe during environment setup) must NOT be manually migrated — Adobe handles those automatically [6].

### User Provisioning Methods

| Method | Use Case | Notes |
|--------|----------|-------|
| Manual (Admin Console UI) | Fewer than ~50 users | One-by-one email entry |
| Bulk CSV Upload | Medium-scale onboarding | CSV with attributes + group assignments |
| User Sync Tool (UST) | Enterprise scale | Syncs from Active Directory or OpenLDAP; one-way, directory → Admin Console |

## Common Patterns

**Pattern 1: Enterprise SSO with Federated ID**
Organizations with an existing corporate IdP (Okta, Azure AD, ADFS) configure Federated IDs. The domain (e.g., `company.com`) is claimed in Admin Console, a SAML 2.0 integration is set up with the IdP, and users authenticate via corporate credentials. AEM Authors log in with their existing company credentials — no separate Adobe password needed. This is the recommended pattern for most enterprise AEM deployments [5].

**Pattern 2: Layered Permission Management**
Best practice is to avoid assigning permissions directly to users or directly to synced IMS groups in AEM. Instead:
1. Create logical IMS user groups in Admin Console (e.g., "AEM-Content-Authors").
2. Assign users to those IMS groups.
3. In AEM, add the synced IMS group to a local AEM group (e.g., `dam-users`).
4. Apply ACLs only to the local AEM group.
This allows IMS groups to remain reusable across Experience Cloud products while AEM-specific permissions are managed separately [3][4].

**Pattern 3: Auto-Provisioned Profiles**
When a new AEM environment is provisioned via Cloud Manager, Admin Console automatically creates two product profiles: `AEM Administrators_<programID>_<envID>` and `AEM Users_<programID>_<envID>`. System admins then assign users to these profiles to enable AEM access [3].

## Gotchas

- **Never rename AEM product profiles.** Renaming `AEM Administrators` removes administrator rights from ALL assigned users. Renaming `AEM Users` can break login entirely for that profile. These are hardcoded system profile names [3][4].

- **IMS authentication is Author-only.** IMS authentication applies only to AEM Author, Admin, and Dev users. AEM Publish/Preview end-user authentication uses SAML 2.0 configured directly on AEM — NOT IMS. Confusing these two is a common exam trap [1][2].

- **Cloud Manager permissions ≠ AEM access.** A user can have full Cloud Manager admin rights and still be unable to log into AEM Author. AEM access requires membership in an AEM product profile (`AEM Users` or `AEM Administrators`) in Admin Console [4].

- **IMS user groups cannot be assigned to product profiles in AEM Cloud Service.** Unlike some other Adobe products, AEM as a Cloud Service does NOT support assigning IMS user groups directly to product profiles. Individual users must be added to product profiles [3][4].

- **Deleted Admin Console users retain AEM access until token expiry.** When an IMS user is removed from Admin Console, they are NOT immediately removed from AEM. Their session persists until the IMS token expires and is re-validated (typically within 10 minutes for active sessions, but the AEM user record is not automatically deleted) [3].

- **Sync debounce is ~10 minutes.** IMS group membership changes sync into AEM on the user's next login, but there is a debounce of roughly 10 minutes — rapid re-logins within that window may not pick up changes [3].

- **Adobe ID (personal) is not supported for AEM.** Personal Adobe IDs cannot be assigned to AEM product profiles. Only Enterprise ID and Federated ID are supported for AEM Author access [5][2].

- **JWT credentials for S2S integrations are deprecated.** Existing IMS integrations with other Adobe products using JWT must be migrated to OAuth Server-to-Server credentials. Auto-provisioned JWT configs (e.g., for Asset Compute, Smart Tags) are migrated by Adobe — do not manually migrate those [6].

- **IMS groups carry no AEM permissions by themselves.** A user synced into AEM via IMS group membership has no meaningful AEM permissions until that IMS group is explicitly added to a local AEM group that has ACLs applied. The IMS sync only brings the group into AEM's user repository, not its permission system [3][4].

## Sources

[1] **IMS Support for Adobe Experience Manager as a Cloud Service**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/security/ims-support
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Core IMS authentication flow, scope limitations (Author/Admin/Dev only), token validation behavior (10-minute check interval), user provisioning methods, IMS Organization prerequisites, and user group/product profile relationship.

[2] **Understanding Adobe IMS Authentication with AEM on Adobe Managed Services**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-learn/foundation/authentication/adobe-ims-authentication-technical-video-understand
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Step-by-step authentication flow (user click to token), three-tier permission model (Admin Console → sync layer → AEM), IMS groups mapped to AEM groups, and critical gotchas about direct permission assignment being discouraged.

[3] **Configuring Access to AEM as a Cloud Service — Overview**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-learn/cloud-service/accessing/overview
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: IMS user deletion behavior (token-expiry-based, not immediate), IMS user groups not granting direct permissions, best practices for layered permission management, group-to-product-profile limitation for AEM Cloud Service.

[4] **Adobe IMS Product Profiles and AEM**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-learn/cloud-service/accessing/adobe-ims-product-profiles
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Two auto-created product profiles per AEM environment, AEM Administrators vs AEM Users access levels, critical warning about profile renaming, IMS groups cannot be assigned to profiles, Cloud Manager permissions vs AEM access distinction.

[5] **Identity Overview — Adobe Enterprise**
    URL: https://helpx.adobe.com/enterprise/using/identity.html
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: Three identity types (Adobe ID, Enterprise ID, Federated ID), comparison of ownership/control/authentication for each, AEM support limitations for personal Adobe IDs, SAML 2.0 SSO requirements for Federated ID.

[6] **Setting Up IMS Integrations for AEM as a Cloud Service**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/security/setting-up-ims-integrations-for-aem-as-a-cloud-service
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: OAuth Server-to-Server credential setup in Adobe Developer Console, JWT deprecation and migration path, auto-provisioned JWT configurations that Adobe manages (should not be manually migrated), AEM navigation path for creating IMS integrations.

[7] **AEM as a Cloud Service Team and Product Profiles**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/onboarding/concepts/aem-cs-team-product-profiles
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: Cloud Manager profile roles (Business Owner, Deployment Manager, Developer, Program Manager), AEM environment-tier profiles (AEM Sites Content Managers, AEM Assets roles, AEM Forms roles), org-level vs environment-level profile hierarchy.
