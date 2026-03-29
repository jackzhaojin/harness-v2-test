# Adobe I/O Authentication Setup

**Topic ID:** cloud-manager-operations.api.authentication
**Researched:** 2026-03-29T00:00:00Z

## Overview

Adobe I/O authentication is the gateway to programmatic access to the Cloud Manager API. All API calls to Cloud Manager must be authenticated via a Bearer token plus two additional headers obtained from an Adobe Developer Console project [1][2]. The authentication mechanism has undergone a significant transition: the legacy Service Account (JWT) credential has been deprecated and fully retired as of June 30, 2025, with Adobe auto-converting any remaining JWT credentials by March 1, 2026 [3]. As of 2026, OAuth Server-to-Server is the only supported authentication method for Cloud Manager API integrations [2].

Setting up API access requires creating a project in the Adobe Developer Console (developer.adobe.com/console), adding the Cloud Manager API, selecting OAuth Server-to-Server authentication, and assigning one or more Cloud Manager Product Profiles [1][4]. The Product Profile chosen during setup directly controls which Cloud Manager API endpoints the integration can call — this is not just a formality but a hard permission boundary [4]. Understanding the relationship between Adobe Developer Console roles, Cloud Manager roles, and Product Profiles is a common point of confusion on the exam [1].

## Key Concepts

- **OAuth Server-to-Server credential** — The current and only supported method for Cloud Manager API authentication (as of June 30, 2025). Uses the OAuth 2.0 `client_credentials` grant type [2]. Does not require certificate management or private key downloads [3].

- **Service Account (JWT) credential** — The legacy method, fully deprecated. Could not be created after June 3, 2024; stopped working June 30, 2025 for certificates that expired; Adobe auto-converts all remaining JWT credentials by March 1, 2026 [3]. Exam questions still reference JWT to test whether candidates know it is deprecated.

- **Three required API headers** — Every Cloud Manager API call must include: `x-api-key` (Client ID), `x-gw-ims-org-id` (Organization ID), and `Authorization: Bearer {token}` [1][2]. These values are found in the Credentials section of the Adobe Developer Console project [1].

- **Product Profile** — Assigned during API integration creation; maps the integration to a specific Cloud Manager role (Business Owner, Deployment Manager, Program Manager, Developer). Only endpoints permitted by that role will respond successfully [4]. You can assign multiple profiles to one integration [4].

- **Technical Account** — A synthetic user automatically created in AEM Author when an OAuth Server-to-Server credential is configured and the API is successfully called. This account is associated with the assigned Product Profile's user groups [5].

- **API Developer role (Adobe Developer Console)** — An Adobe Admin Console role that permits a user to create integrations in the Adobe Developer Console. This is entirely separate from the "Developer" product profile in Cloud Manager, which grants development rights within Cloud Manager pipelines [1][4]. Granting one does NOT grant the other.

- **Token TTL** — Access tokens generated via OAuth Server-to-Server are valid for 24 hours [1][2]. Cloud Manager OAuth credentials do NOT support refresh tokens [4][6]; tokens must be regenerated programmatically when they expire.

- **Auto-generated projects** — When Cloud Manager provisions AEM as a Cloud Service environments, it auto-creates a read-only Adobe Developer Console project. Customers should not attempt to migrate these; Adobe handles migration automatically [3].

## Technical Details

### Creating an API Integration Project

Steps performed in the Adobe Developer Console [1][4]:

1. Navigate to `https://developer.adobe.com/console`
2. Create a new project (or open an existing one)
3. Click **Add to Project** > **API**
4. Under Experience Cloud, select **Cloud Manager**, click **Next**
5. Select **OAuth Server-to-Server** authentication
6. Select one or more **Product Profiles** to assign roles
7. Save; the Credentials overview page displays: `CLIENT_ID`, `CLIENT_SECRET`, `TECHNICAL_ACCOUNT_ID`, `TECHNICAL_ACCOUNT_EMAIL`, and `ORG_ID`

### Generating an Access Token Programmatically

Token endpoint [2]:

```
POST https://ims-na1.adobelogin.com/ims/token/v3
Content-Type: application/x-www-form-urlencoded
```

Required form parameters [2]:

```
client_id={CLIENT_ID}
client_secret={CLIENT_SECRET}
grant_type=client_credentials
scope={SCOPES}
```

Full cURL example [2]:

```bash
curl -X POST 'https://ims-na1.adobelogin.com/ims/token/v3' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'client_id={CLIENT_ID}&client_secret={CLIENT_SECRET}&grant_type=client_credentials&scope={SCOPES}'
```

The response includes an `expires_in` field (in seconds) [2]. Adobe recommends caching the token and reusing it until near expiry rather than generating a new one per request.

### Making an API Call

Every HTTP request to Cloud Manager must include all three headers [1]:

```bash
curl -X GET 'https://cloudmanager.adobe.io/api/programs' \
  -H 'x-api-key: {CLIENT_ID}' \
  -H 'x-gw-ims-org-id: {ORG_ID}' \
  -H 'Authorization: Bearer {ACCESS_TOKEN}'
```

The Developer Console also provides a **"View cURL command"** button and a **"Generate access token"** button for quick manual testing [1][2].

### Client Secret Rotation

OAuth Server-to-Server credentials use client secrets instead of certificates. Secrets can be rotated manually in the Developer Console UI or programmatically via the Adobe I/O Management API [2]. Required scopes for programmatic rotation:

```
AdobeID, openid, read_organizations, additional_info.projectedProductContext,
additional_info.roles, adobeio_api, read_client_secret, manage_client_secrets
```

[2]

### JWT Migration Steps (Historical Reference, Exam Relevant)

Three-step zero-downtime migration [3]:

1. **Add**: In Developer Console, add OAuth Server-to-Server credential alongside existing JWT credential
2. **Update & Verify**: Update application code to use new credential; both credentials function simultaneously during this window; system confirms new credential used for 24+ hours and old credential unused for 24+ hours
3. **Delete**: Delete the old JWT credential — this action is **irreversible** [3]

## Common Patterns

**Scripting / CI/CD**: Service Account (OAuth Server-to-Server) authentication is the recommended approach for pipeline automation and scripting, where no browser interaction is possible [4][6]. Store `CLIENT_ID`, `CLIENT_SECRET`, and `ORG_ID` as environment secrets; generate tokens at runtime via the IMS token endpoint [2].

**aio CLI**: The `aio-cli-plugin-cloudmanager` supports both browser-based and Service Account authentication [6]. Browser-based uses the logged-in user's permissions; Service Account (OAuth) uses the Technical Account's permissions, which may differ from the UI user's permissions. Use `--permissions` flag to check which Cloud Manager product profiles are required for a given command [6].

**Multiple Product Profiles**: An integration can be assigned multiple Cloud Manager product profiles to cover multiple roles. For example, assigning both "Developer" (read pipelines) and "Deployment Manager" (execute pipelines) allows a single integration to both query and trigger deployments [4].

**Separate credentials per environment**: Best practice is to use separate OAuth credentials for Development, Staging, and Production environments. Each credential maps to a separate Developer Console project and product profile set [2].

## Gotchas

- **JWT is dead — know the dates for the exam**: New JWT credentials could not be created after June 3, 2024. JWT credentials stopped working June 30, 2025. Adobe auto-converts remaining JWT to OAuth by March 1, 2026. Any exam question framing JWT as "an option to consider" is testing whether you know it is deprecated [3].

- **No refresh tokens with Cloud Manager OAuth**: Unlike some OAuth flows, the Cloud Manager OAuth Server-to-Server credential does NOT support refresh tokens [4][6]. This is a specific gotcha — you must regenerate access tokens when they expire (every 24 hours), not refresh them.

- **AEM Developer Console tokens cannot be used with Cloud Manager API**: Tokens generated in the AEM Developer Console (instance-level console) are NOT valid for the Cloud Manager API. You must use tokens generated via the Adobe Developer Console (developer.adobe.com/console) [1].

- **API Developer role vs Cloud Manager Developer role**: The "API Developer" role in Adobe Admin Console permits creating integrations in the Adobe Developer Console. The "Developer" product profile in Cloud Manager grants development rights within pipelines. They are completely separate — having one does not grant the other [1][4]. This is a frequently tested distinction.

- **Product Profile controls endpoint access**: Selecting the wrong Product Profile during integration setup is a common cause of 403 Forbidden errors. The "Developer" profile only allows fetching pipeline data; to trigger pipeline execution you need at least "Deployment Manager" [4][6].

- **Auto-generated projects are read-only**: Projects auto-created by Cloud Manager for AEM as a Cloud Service environments are marked read-only. Do not attempt to migrate these; Adobe handles the migration automatically [3].

- **Certificate rotation no longer needed**: With OAuth Server-to-Server, the annual certificate rotation required by JWT is eliminated. This simplifies maintenance significantly — but client secrets should still be rotated periodically as a security best practice [2][3].

- **Technical Account requires explicit permission grants**: The Technical Account user created by OAuth Server-to-Server setup is not automatically granted content access in AEM. Permissions must be explicitly granted via Product Profile and Services user group configuration [5].

## Sources

[1] **Authentication - Cloud Manager API (Adobe Developer)**
    URL: https://developer.adobe.com/experience-cloud/cloud-manager/guides/getting-started/authentication/authentication/
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Required API headers (x-api-key, x-gw-ims-org-id, Authorization), token generation via Developer Console, 24-hour token lifespan, AEM Developer Console token restriction, API Developer vs Cloud Manager Developer role distinction.

[2] **OAuth Server-to-Server Credential Implementation Guide (Adobe Developer)**
    URL: https://developer.adobe.com/developer-console/docs/guides/authentication/ServerToServerAuthentication/implementation
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Token endpoint URL, required POST parameters, cURL token generation example, token caching guidance, client secret rotation scopes, no-refresh-token limitation.

[3] **JWT Credentials Deprecation in Adobe Developer Console (Adobe Experience League)**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/security/jwt-credentials-deprecation-in-adobe-developer-console
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: JWT deprecation timeline (June 3 2024, June 30 2025, March 1 2026), three customer scenarios (AEM integrations, Cloud Manager APIs, auto-generated projects), auto-generated project migration handled by Adobe.

[4] **Creating an API Integration Project - Cloud Manager API (Adobe Developer)**
    URL: https://developer.adobe.com/experience-cloud/cloud-manager/guides/getting-started/create-api-integration/
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Step-by-step project creation, OAuth Server-to-Server selection, Product Profile role assignment, API Developer vs Cloud Manager Developer role distinction, no-refresh-token gotcha.

[5] **Generate Server-to-Server Access Token in App Builder (Adobe Experience League)**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-learn/cloud-service/developing/extensibility/app-builder/server-to-server-auth
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: Technical Account user creation upon API invocation, association with Product Profile user groups, permission verification via API credentials tab.

[6] **aio-cli-plugin-cloudmanager (GitHub / Adobe)**
    URL: https://github.com/adobe/aio-cli-plugin-cloudmanager
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: Browser-based vs Service Account authentication modes, --permissions flag usage, no-refresh-token confirmation, product profile requirements per command (Business Owner, Deployment Manager, Program Manager for pipeline operations).
