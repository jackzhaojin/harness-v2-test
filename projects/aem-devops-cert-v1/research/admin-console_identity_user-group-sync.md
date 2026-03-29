# User and Group Synchronization

**Topic ID:** admin-console.identity.user-group-sync
**Researched:** 2026-03-29T00:00:00Z

## Overview

Adobe Experience Manager as a Cloud Service (AEMaaCS) delegates user identity management to Adobe's Identity Management System (IMS), surfaced through the Adobe Admin Console [1]. The Admin Console acts as the single control plane for provisioning users, defining product profiles, and organizing users into groups — all of which then synchronize into AEM upon user login [2]. This architecture decouples "who can log in" (managed in Admin Console via IMS) from "what they can do" (managed in AEM via AEM-native groups and ACLs).

Understanding the sync model is critical for DevOps engineers because it determines how access is rolled out consistently across Dev, Stage, and Production environments. The sync is not instantaneous — it is login-triggered with a debounce window managed by the Apache Jackrabbit Oak Default Sync Handler [3]. Misunderstanding the sync timing or the direction of permission assignment (IMS vs. AEM groups) is a frequent source of access misconfiguration in production environments.

The AEM DevOps Engineer exam (ADO-E106) directly tests this domain under "Configure Adobe Experience Manager," specifically: "Determine the correct method to configure federated SSO and sync Adobe Experience Manager users and groups" [4].

## Key Concepts

- **Adobe IMS (Identity Management System)** — Adobe's centralized identity platform that manages users, groups, and product profiles across all Adobe Experience Cloud products. AEM delegates authentication entirely to IMS [1].

- **Product Profiles** — The primary mechanism that grants users access to an AEM environment. When a new AEM environment is provisioned, two profiles are automatically created: **AEM Users** and **AEM Administrators** [2]. A user must be a member of one of these profiles to log into AEM at all.

- **IMS User Groups** — Logical groupings of users in the Admin Console. They do not grant AEM access or permissions on their own, but when users log in, their IMS group memberships are mirrored into AEM as AEM groups [5]. They serve as the bridge between organizational identity structures and AEM permission assignments.

- **Login-Triggered Sync** — IMS user attributes, group memberships, and product profile assignments are only synced to AEM when a user logs in. Changes made in Admin Console are NOT pushed to AEM in real-time [2][3].

- **Oak Default Sync Handler** — The Apache Jackrabbit Oak OSGi service (`DefaultSyncHandler`) that governs how external identity data (from IMS) is written into the AEM repository. It controls expiry times, membership nesting depth, and dynamic membership [3].

- **Sync Debounce (~10 minutes)** — If a user logs in again within approximately 10 minutes of a prior login, IMS changes are NOT re-synced. This is a built-in throttle in the Oak Default Sync Handler [2][5].

- **Permissions Are AEM-Local** — Permissions (ACLs) must be assigned to AEM-native groups, not directly to the synced IMS groups. The recommended pattern is: IMS group → added as member of AEM group → AEM group has ACLs [5][1].

- **AEM Administrators Profile Warning** — Renaming the "AEM Administrators" product profile in Admin Console removes administrator rights from all users in that profile immediately [6].

## Technical Details

### Product Profile Auto-Creation

When a new AEM environment is provisioned, the following product profiles are automatically created per tier (author and publish) [6]:

| Profile | AEM Access Level | AEM Group Mapped |
|---|---|---|
| AEM Administrators | Full admin access | AEM administrators group |
| AEM Users | Read-only access | AEM Contributors group |
| AEM Sites Content Managers | Controlled Sites author access | Auto-created service group |
| AEM Assets Collaborator / Power User | Asset-specific roles | Auto-created service groups |

For an organization with 3 environments (Dev, Stage, Prod), this generates **6 base product profiles** (2 per environment, author side alone).

### IMS-to-AEM Sync Flow

```
User logs in to AEM Author
  ↓
IMS token contains: user attributes, group memberships, product profile memberships
  ↓
Oak Default Sync Handler checks if sync is needed (debounce ~10 min)
  ↓
IMS users created/updated in AEM repository at /home/users/...
IMS groups mirrored as AEM groups at /home/groups/...
User added to each corresponding AEM group
  ↓
AEM evaluates ACLs based on AEM group memberships
```

The sync is **unidirectional** — from IMS into AEM [5][7]. Changes made directly to users or groups in AEM's User Admin (/libs/granite/security/content/useradmin.html) that conflict with IMS will be overwritten on the next login.

### Oak Default Sync Handler Key Properties [3]

| Property | Default | Effect |
|---|---|---|
| `user.expirationTime` | 1h | How long a synced user remains valid before re-validation |
| `user.membershipExpTime` | 1h | How frequently group memberships are refreshed |
| `group.expirationTime` | 1d | How long a synced group remains valid |
| `user.membershipNestingDepth` | 0 | Depth of nested group sync (0 = direct memberships only) |
| `user.dynamicMembership` | false | If true, uses dynamic group resolution instead of static sync |

### Permission Assignment Pattern (Recommended)

```
Admin Console
  └── IMS User Group: "marketing-authors"
        └── (synced into AEM as) AEM Group: "marketing-authors"
              └── added as member of AEM Group: "content-authors"
                    └── ACLs: /content/marketing → allow jcr:read, jcr:write
```

This pattern keeps IMS groups as agnostic organizational units and concentrates all AEM-specific permissions in AEM-native groups [5][1].

### User Sync Tool (UST)

For organizations using Active Directory or LDAP, the User Sync Tool (distributed via Adobe's GitHub) synchronizes directory users and groups into the Admin Console [7]. Key behaviors:

- Sync is **one-way**: AD/LDAP → Admin Console. Changes made in Admin Console are not pushed back to the directory [7].
- Operates via the Adobe User Management API (UMAPI).
- Supports dynamic group mapping via regex patterns in `user-sync-config.yml`.
- Requires registration as an Adobe Developer client (UMAPI credentials).

## Common Patterns

**Pattern 1: Environment-Specific Permission Mapping**
Create IMS user groups that are environment-agnostic (e.g., `aem-content-authors`) and assign them to appropriate AEM groups on each environment using runmode-specific repo-init scripts. This ensures consistent sync across Dev, Stage, and Prod without duplicate Admin Console configuration [5].

**Pattern 2: Layered Group Membership**
```
IMS Group: "editorial-team"
  └── synced as AEM Group: "editorial-team"
        └── member of AEM Group: "dam-users" (OOTB)
        └── member of AEM Group: "content-editors" (custom, with ACLs)
```
This gives the editorial team DAM access + custom content editing permissions without touching the synced IMS group [5].

**Pattern 3: Bulk Onboarding via CSV**
For organizations with fewer than 50 AEM users and no AD/LDAP integration, bulk user addition to product profiles is done via CSV upload in the Admin Console. This avoids the User Sync Tool overhead while maintaining centralized control [7].

**Pattern 4: Repo-Init for Permission Consistency**
Use Apache Sling Repo Init (`repoinit`) scripts in AEM to define ACLs as code, deployed via Cloud Manager pipelines. This ensures permissions are consistent across all environments without manual post-sync steps [8].

## Gotchas

**1. IMS Groups DO NOT grant AEM access — Product Profiles do.**
A user can be in an IMS group and still be unable to log into AEM if they are not also in an AEM product profile. This is the single most commonly confused distinction [2][5].

**2. Never assign ACLs directly to synced IMS groups in AEM.**
Synced IMS groups are organizational, not environment-specific. Assigning permissions to them directly bypasses the recommended decoupled pattern and makes IMS groups AEM-environment-aware, which breaks reusability across Experience Cloud products [5].

**3. Sync only happens on login, with a ~10-minute debounce.**
If you add a user to an IMS group and they log in within 10 minutes of a prior login, the new group membership will NOT be reflected in AEM. You must either wait for the debounce window or force a sync via the JMX console [2][3].

**4. IMS groups CANNOT be nested into product profiles in AEMaaCS.**
Unlike AEM 6.x Managed Services, AEM as a Cloud Service does not officially support assigning IMS user groups directly to product profiles. Users must be added to product profiles individually [5]. The Admin Console UI may not block this, but sync behavior is undefined.

**5. Renaming the "AEM Administrators" profile breaks admin access immediately.**
The exact string "AEM Administrators" is what drives the AEM administrators group assignment. Renaming it, even with good intentions, instantly removes admin rights for all users in that profile [6].

**6. Cross-product profile noise (pre-2025 behavior).**
Before ~2025, ALL IMS group memberships (including Photoshop, Stock, and other non-AEM products) were synced into AEM as groups, creating significant noise. As of ~2025, only AEM-relevant groups and profiles are synced [5]. If your deployment relies on cross-product group sync as a feature (e.g., Adobe Stock groups to gate AEM Assets access), this behavior has changed and must be reconfigured.

**7. IMS group name changes have downstream AEM effects.**
When an IMS user group is renamed in Admin Console, a new AEM group with the new name is created on next login, but the old AEM group (with any custom permissions assigned to it) remains orphaned. ACLs assigned to the old group name are silently no longer applied [5].

**8. Cloud Manager profiles alone are insufficient.**
Users who have Cloud Manager roles (Business Owner, Deployment Manager, Developer) cannot log into AEM Author unless they are also added to an AEM product profile (AEM Users or AEM Administrators). Cloud Manager access and AEM service access are separate [6].

## Sources

[1] **AEM Users, Groups and Permissions | Adobe Experience Manager**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-learn/cloud-service/accessing/aem-users-groups-and-permissions
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: IMS-to-AEM sync mechanics, permission assignment best practices, intermediary AEM group pattern, debounce timing, unidirectional sync behavior.

[2] **Adobe IMS Product Profiles and AEM | Adobe Experience Manager**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-learn/cloud-service/accessing/adobe-ims-product-profiles
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Auto-created product profiles per environment (AEM Users, AEM Administrators), access levels per profile, environment-to-profile mapping (6 profiles for 3 environments), IMS group limitation on product profiles.

[3] **Jackrabbit Oak Default Sync Handler Documentation**
    URL: https://jackrabbit.apache.org/oak/docs/security/authentication/external/defaultusersync.html
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Oak Default Sync Handler configuration properties — user.expirationTime, user.membershipExpTime, group.expirationTime, user.membershipNestingDepth, user.dynamicMembership and their defaults.

[4] **Adobe Experience Manager DevOps Engineer Certification — ReviewNPrep**
    URL: https://reviewnprep.com/blog/quick-guide-to-adobe-experience-manager-devops-engineer-certification/
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: Exam structure (54 questions, 108 min, 65% pass), domain coverage including federated SSO and user/group sync under "Configure Adobe Experience Manager" (18% weight).

[5] **Adobe IMS User Groups and AEM | Adobe Experience Manager**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-learn/cloud-service/accessing/adobe-ims-user-groups
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: IMS groups as organizational (not permission) units, how groups sync into AEM as AEM groups on login, recommended nested permissions pattern, IMS group name change consequences, pre-/post-2025 cross-product sync behavior change.

[6] **AEM as a Cloud Service Team and Product Profiles | Adobe Experience Manager**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/onboarding/concepts/aem-cs-team-product-profiles
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Full list of auto-created product profiles (Sites Content Managers, Assets Collaborator, Power User, Forms profiles), Cloud Manager vs AEM service profile distinction, AEM Administrators renaming warning.

[7] **Adobe IMS Authentication and Admin Console Support for AEM Managed Services | Adobe Experience Manager**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-65/content/security/ims-config-and-admin-console
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: User Sync Tool overview (one-way AD/LDAP → Admin Console), UMAPI registration requirement, group sync triggered only on login, Federated ID / SAML 2.0 support.

[8] **IMS Support for Adobe Experience Manager as a Cloud Service | Adobe Experience Manager**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/security/ims-support
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: OAuth authentication flow, three user onboarding methods, Oak Default Sync Handler as the sync engine, repo-init for permission-as-code deployment across environments.
