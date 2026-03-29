# LDAP Integration (On-Premise)

**Topic ID:** admin-console.identity.ldap-integration
**Researched:** 2026-03-29T00:00:00Z

## Overview

LDAP (Lightweight Directory Access Protocol) integration in AEM on-premise allows organizations to authenticate users against a centralized directory service such as Microsoft Active Directory [1]. Rather than managing users exclusively within AEM's repository, credentials are validated against the LDAP server, while user account details are synchronized into the repository for permission assignment and group management [1]. This is a common enterprise pattern for on-premise AEM deployments where IT maintains an existing LDAP/Active Directory infrastructure.

AEM's LDAP integration is built on Apache Jackrabbit Oak's external authentication framework, introduced in AEM 6.x [1]. The implementation uses three cooperating OSGi configurations — an LDAP Identity Provider, a Synchronization Handler, and an External Login Module — which together define how users are located in LDAP, how they are synced into the AEM repository, and how the authentication chain is assembled [1][2]. This architecture allows for multiple concurrent LDAP configurations and is flexible enough to support complex enterprise directory structures.

Critically, LDAP integration is an on-premise-only capability. AEM as a Cloud Service (AEMaaCS) mandates Adobe IMS as its authentication layer and does not support direct LDAP connectivity [3]. Organizations migrating from on-premise to AEMaaCS must route LDAP/Active Directory users through Adobe IMS, typically via the Adobe User Sync Tool or identity federation through the Adobe Admin Console [3].

## Key Concepts

- **Apache Jackrabbit Oak LDAP Identity Provider (IDP)** — OSGi service (PID: `org.apache.jackrabbit.oak.security.authentication.ldap.impl.LdapIdentityProvider`) that defines the connection to the LDAP server, including hostname, port, bind credentials, user base DN, group base DN, and attribute mappings [1]. Each distinct LDAP source requires its own IDP configuration.

- **Apache Jackrabbit Oak Default Sync Handler** — OSGi service (PID: `org.apache.jackrabbit.oak.spi.security.authentication.external.impl.DefaultSyncHandler`) that governs how users and groups are pulled from the IDP into the AEM repository, including expiration intervals, auto-membership, property mappings, and group nesting depth [1][4].

- **Apache Jackrabbit Oak External Login Module** — OSGi service that wires the IDP and Sync Handler together and plugs into the JAAS authentication chain via a ranking and control flag [2]. It is the binding layer that makes LDAP credentials usable at login.

- **Bind DN / Bind Password** — Service account credentials used by AEM to connect to the LDAP server and perform searches. Requires a read-only service account with sufficient permissions to query user and group trees [1][2].

- **User Base DN / Group Base DN** — The directory subtrees (Distinguished Names) under which users and groups are searched. Incorrect DNs are one of the most common misconfiguration errors [1].

- **User Expiration Time (`user.expirationTime`)** — Controls how long a synchronized user is considered valid before AEM re-queries LDAP to refresh it. Default is `1h` [4]. Expired users are re-synced on next login.

- **Membership Nesting Depth (`user.membershipNestingDepth`)** — Controls how many levels of nested LDAP group membership are traversed. A value of `0` disables group membership lookup entirely; `1` syncs only direct group memberships [1][4].

- **`rep:externalId` property** — A repository property automatically attached to any user or group synchronized by the Sync Handler. Contains the originating IDP name. AEM uses this to track and purge users removed from external groups [1].

- **JAAS Control Flag** — Configures the External Login Module's behavior in the authentication chain. `SUFFICIENT` is the typical setting: if LDAP authentication succeeds, no further modules are consulted; if it fails, the chain falls through to local AEM authentication [2].

## Technical Details

### Three Required OSGi Configurations

All three configurations are created in the OSGi Web Console at `https://<host>:4502/system/console/configMgr` [1].

**1. LDAP Identity Provider**

```
Name:               ldap
Hostname:           ldap.example.com
Port:               389  (636 for LDAPS)
Use SSL:            false  (true for LDAPS)
Use TLS:            false  (true for STARTTLS)
Bind DN:            uid=admin,ou=system
Bind Password:      <secret>
Search Timeout:     60s
User Base DN:       ou=people,dc=example,dc=com
User Object Class:  person
User ID Attribute:  uid
Group Base DN:      ou=groups,dc=example,dc=com
Group Object Class: groupOfUniqueNames
Group Name Attr:    cn
Group Member Attr:  uniquemember
```
[2]

**2. Default Sync Handler**

```
Handler Name:            default
User Expiration Time:    1h
User Auto-Membership:    contributor
User Property Mapping:   rep:fullname=cn
User Path Prefix:        /ldap
User Membership Exp:     1h
Membership Nesting Depth: 1
Group Expiration Time:   1d
Group Path Prefix:       /ldap
```
[2][4]

**3. External Login Module**

```
JAAS Ranking:           50
Control Flag:           SUFFICIENT
Identity Provider Name: ldap
Sync Handler Name:      default
```
[2]

The External Login Module's `Identity Provider Name` and `Sync Handler Name` values must exactly match the `Name` fields set in the respective IDP and Sync Handler configurations [4].

### SSL/TLS Configuration

For LDAP over SSL (LDAPS), enable the `Use SSL` checkbox and set port `636`. For STARTTLS, enable `Use TLS` with port `389`. If using self-signed or internal CA certificates, the certificate must be imported into the JVM's truststore [1]:

```bash
keytool -import -alias internalCA -file <cert.pem> -keystore <path-to-cacerts>
```

**Warning:** Do not create LDAP SSL certificates with the Netscape comment option enabled. This causes SSL Handshake failures during authentication [1].

### Triggering Manual Synchronization

Users are synced automatically on first login. For bulk synchronization or administrative refresh, use the JMX console at `/system/console/jmx` and invoke the `syncAllExternalUsers()` method on the **External Identity Synchronization Management** MBean [1][3].

### Debug Logging

Enable debug-level loggers in the Sling Log Support console (`/system/console/slinglog`) [2]:

```
Logger: org.apache.jackrabbit.oak.security.authentication.ldap
File:   logs/ldap.log

Logger: org.apache.jackrabbit.oak.spi.security.authentication.external
File:   logs/external.log
```

### Multiple LDAP Configurations

To integrate with more than one LDAP server (e.g., different OUs or separate AD forests), create separate IDP and Sync Handler instances for each, each with a unique `Name` value. Each External Login Module instance binds one IDP to one Sync Handler [1].

## Common Patterns

**Pattern 1 — Active Directory integration for AEM Author.** The most common on-premise scenario. Configure the LDAP IDP pointing to an AD domain controller, bind with a read-only service account, set the User Base DN to the OU containing author users, and set `user.autoMembership` to `contributor` so all synced users get baseline author access. Group sync lets AD group memberships drive AEM group assignments [1][2].

**Pattern 2 — Layered LDAP + local authentication.** Set the External Login Module's control flag to `SUFFICIENT`. LDAP users authenticate against LDAP; if authentication fails (e.g., a local-only admin account), the chain falls through to AEM's built-in login. This preserves admin access even when LDAP is unreachable [2].

**Pattern 3 — Group-based permissions mapping.** Configure `user.membershipNestingDepth=1` to sync direct LDAP group memberships. Create corresponding AEM groups manually and assign ACLs. As users are added/removed from LDAP groups, their AEM group memberships update on next sync. Use `user.autoMembership` to force all LDAP users into a baseline AEM group [1][4].

**Pattern 4 — Property mapping from LDAP attributes.** Use the `user.propertyMapping` field to map LDAP attributes to AEM profile properties. For example, `rep:fullname=cn` copies the LDAP `cn` attribute to the AEM user's full name. Multiple mappings are comma-separated [4].

## Gotchas

- **LDAP is NOT supported in AEMaaCS.** AEM as a Cloud Service mandates Adobe IMS. The only supported path for LDAP/AD users in AEMaaCS is through the Adobe User Sync Tool, which syncs directory users into the Adobe Admin Console, where they then access AEM via IMS [3]. Exam scenarios that describe AEMaaCS will never have LDAP as the correct answer for authentication.

- **Groups are only synced in conjunction with user sync.** Groups are not synced independently. A group is synced only when a member user is synced. Deleting a synced user may be required to trigger a fresh group sync in some troubleshooting scenarios [1].

- **`membershipNestingDepth=0` disables all group sync.** A value of `0` means no group memberships are resolved, not that only top-level groups are synced. Use `1` for direct memberships, `2` or higher for nested groups [1][4].

- **Handler name must match exactly.** The `Sync Handler Name` in the External Login Module is case-sensitive and must exactly match the `handler.name` in the Default Sync Handler. A mismatch silently breaks group sync [4].

- **LDAP vs. SAML choice.** LDAP authenticates users directly against a directory (users need not be pre-created in AEM). SAML is an identity federation protocol primarily for web SSO; in AEM, SAML-authenticated users must exist in the AEM repository (auto-creation is supported) [5]. For on-premise networks with existing AD, LDAP is simpler. For cross-domain SSO, cloud, or MFA requirements, SAML or IMS is appropriate [3][5].

- **SSL certificate with Netscape comment option causes failures.** This is a specific and easily overlooked misconfiguration. If LDAP over SSL is failing with an SSL Handshake error, regenerate the certificate without the Netscape comment option [1].

- **User expiration does not mean account deletion.** When `user.expirationTime` elapses, the user's cached data in AEM is considered stale and is refreshed from LDAP on the next login — the account is not deleted. Deletion behavior on LDAP removal depends on `user.disableMissing` and related settings [4].

- **Dynamic membership vs. static membership.** The `user.dynamicMembership` property (default `false`) controls whether group membership is stored as a static JCR property or evaluated dynamically. Disabling dynamic membership and adding a leading `/` to path prefixes is a known fix for group sync issues in some AEM 6.4/6.5 configurations [1].

## Sources

[1] **Configuring LDAP with AEM 6 | Adobe Experience Manager**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-65/content/security/ldap-config
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Three required OSGi configurations, LDAP IDP fields, Sync Handler options, SSL/TLS setup, group sync behavior, rep:externalId property, debug logging, multiple LDAP configuration guidance, Netscape SSL certificate warning.

[2] **AEM LDAP Tutorial — Step 02: Configure LDAP Authentication in AEM | Adobe Marketing Cloud GitHub**
    URL: https://github.com/Adobe-Marketing-Cloud/aem-ldap-tutorial/blob/master/step-02/tutorial-02-configure-aem.md
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Concrete configuration values for IDP, Sync Handler, and External Login Module (with example SevenSeas directory). JAAS ranking and control flag values. Debug logging category names.

[3] **IMS Support for Adobe Experience Manager as a Cloud Service | Adobe Experience Manager**
    URL: https://experienceleague.adobe.com/docs/experience-manager-cloud-service/content/security/ims-support.html?lang=en
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: LDAP not supported in AEMaaCS, IMS as mandatory auth layer, Adobe User Sync Tool as workaround for LDAP/AD users in AEMaaCS, comparison table of AEMaaCS vs on-premise auth capabilities.

[4] **AEM LDAP Sync Handler OSGi Configuration Properties**
    URL: https://experienceleaguecommunities.adobe.com/t5/adobe-experience-manager/ldap-integration-with-aem-6-5-i-am-facing-issue-while/td-p/400067
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: Full OSGi config property names (user.expirationTime, user.membershipNestingDepth, user.dynamicMembership, user.disableMissing, group.expirationTime), PID name for DefaultSyncHandler, handler.name matching requirement.

[5] **AEM LDAP VS SAML VS Custom Login Module | Adobe Experience League Community**
    URL: https://experienceleaguecommunities.adobe.com/t5/adobe-experience-manager/aem-ldap-vs-saml-vs-custom-login-module/m-p/219280
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: Key distinction that LDAP users need not be pre-created in AEM repository (impersonation model), SAML users must exist in AEM (auto-creation supported), LDAP is best for on-premise closed networks, SAML for cloud/cross-domain/MFA scenarios.
