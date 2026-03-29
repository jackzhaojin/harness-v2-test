# Federated SSO Configuration

**Topic ID:** admin-console.identity.federated-sso
**Researched:** 2026-03-29T00:00:00Z

## Overview

Federated SSO in the Adobe Admin Console allows enterprises to connect their own identity providers (IdPs) to Adobe products using the SAML 2.0 protocol. With this setup, authentication stays with the organization's IdP while Adobe handles only authorization — Adobe never stores user passwords [1][2]. This is the required identity model for enabling Single Sign-On: you must use Federated ID accounts; neither Adobe ID nor Enterprise ID supports SSO [2][3].

The flow works as a standard SAML 2.0 exchange: the service provider (Adobe) sends an authentication request to the IdP, the IdP authenticates the user and issues a signed SAML assertion, and Adobe validates that assertion to grant access [1]. Adobe supports any SAML 2.0-compliant IdP, including Microsoft Azure AD, ADFS, Okta, Ping Federate, OneLogin, Google Workspace, Shibboleth, and InCommon [1][2]. For Azure AD and Google specifically, Adobe offers purpose-built connectors that simplify setup beyond the generic SAML flow [2].

For AEM Cloud Service, authentication is pre-wired through Adobe Identity Management System (IMS) using Federated ID — admins do not configure raw SAML on the AEM tier; they configure it once in the Admin Console and all connected Adobe services inherit it [4]. AEM Managed Services supports Federated ID and Enterprise ID but not personal Adobe IDs [4].

## Key Concepts

- **Federated ID** — Account type created and owned by the organization, authenticated via the organization's SAML2 IdP. Required for SSO. Adobe performs no authentication; the IdP does [3].
- **Enterprise ID** — Also created and owned by the organization, but Adobe hosts authentication. Provides org control without requiring SSO infrastructure [3].
- **Adobe ID** — Created and managed by individual users. Adobe authenticates. No org control, no SSO support. Used when domain verification is not in place [3].
- **SAML 2.0 (Security Assertion Markup Language)** — The industry-standard protocol for exchanging authentication data between IdP and service provider. Adobe's SSO exclusively uses SAML 2.0 for non-Microsoft/Google providers [1].
- **ACS URL (Assertion Consumer Service URL)** — The Adobe-side callback URL to which the IdP posts the SAML response after successful authentication. Required when configuring your IdP manually [5].
- **Entity ID / SAML Audience** — A URL that uniquely identifies Adobe as the service provider. The IdP uses this to confirm the assertion is intended for Adobe [5].
- **RelayState** — SAML parameter that controls where users land post-authentication when using IdP-initiated login. Different IdPs expose this under different field names (e.g., "Default Relay State" in Okta, "Start URL" in Google) [6].
- **IdP-initiated vs SP-initiated login** — SP-initiated starts at Adobe's login page and redirects to the IdP. IdP-initiated starts at the IdP dashboard and redirects directly into an Adobe app using RelayState. IdP-initiated is only available for SAML providers, not OIDC [6].
- **Directory** — The Admin Console construct that links a domain to an IdP configuration. One directory per IdP; multiple domains can link to one directory [5].

## Technical Details

### Identity Type Decision Matrix

| Factor | Federated ID | Enterprise ID | Adobe ID |
|--------|-------------|---------------|----------|
| SSO Support | Yes (SAML 2.0) | No | No |
| Domain Required | Yes (verified) | Yes (verified) | No |
| Authentication by | Customer's IdP | Adobe | Adobe |
| Password control | Customer's IdP | Adobe | User |
| Org control level | High | High | Low |
| Best for | SSO + directory integration | Control without SSO | Personal/team use |

Source: [3]

### SAML Directory Creation Steps

The following steps come from official Adobe documentation [5]:

1. Sign in to Admin Console, go to **Settings > Identity > Directories**
2. Select **Create Directory**, enter a name, choose **Federated ID**
3. Select **Other SAML Providers** (or Azure AD / Google if applicable)
4. On the **Set up IdP** screen, choose configuration method:
   - **Metadata file**: Download Adobe's metadata XML and upload to your IdP, then upload your IdP's metadata XML back to Adobe
   - **Manual**: Copy the **ACS URL** and **Entity ID** into your IdP, then enter your IdP's SSO URL and certificate manually
5. Configure **Attribute Mappings** (see below)
6. Claim and verify your domain via DNS record

### Required SAML IdP Minimum Configuration [2]

- IdP Certificate
- IdP Login URL
- IDP Binding (HTTP-POST or HTTP-Redirect)
- Assertion Consumer Service URL (provided by Adobe)

### Attribute Mapping

The SAML assertion must include a `NameID` element in `Subject` equal to the user's email address [7]. The following attributes must be mapped in the IdP assertion [1][5]:

| SAML Attribute | Mapped To |
|----------------|-----------|
| `SAML_SUBJECT` / `NameID` | User email address |
| `FirstName` | User first name |
| `LastName` | User last name |

For Azure AD (Entra ID), attribute mapping is configured in the Azure portal's Attribute-Mapping section and can be kept synchronized automatically [4]. Default country can also be configured in the Admin Console attribute mapping section [5].

### Certificate Management

Adobe issues a self-signed certificate for the SAML integration. SHA256 certificates are supported [2]. Certificate status is visible at **Settings > Identity Settings**, Directories tab [8].

When a certificate is expiring, Adobe displays a banner notification in the Admin Console [8]. To update:

1. Go to **Settings > Identity > [Directory Name] > Authentication**
2. Select **Edit > Next > Generate New Certificate**
3. If IdP supports multiple certificates: upload new alongside old, set new as default, test login, then disable old [8]
4. If IdP supports only one certificate: schedule downtime, upload new, test, disable old [8]

Certificate management actions are recorded in **Insights > Logs > Audit log** [8].

### IdP-Initiated Login Configuration

To enable IdP-initiated login, configure the RelayState in Admin Console under **Identity Settings > SAML RelayState** [6]. Supported destination apps include Adobe Home, Experience Cloud Home, Adobe Express, Workfront, AEM, and Marketo Engage [6].

For Azure AD specifically: the **Sign on URL field in Azure Portal must be left empty** — any value there overrides RelayState and forces SP-initiated login [6].

## Common Patterns

**Standard enterprise rollout**: Create a Federated ID directory in Admin Console, configure SAML with the corporate IdP (commonly Azure AD or Okta), claim corporate domain via DNS, then bulk-provision users via CSV upload or User Sync Tool. Azure Sync and Google Sync are also available for their respective IdPs [2].

**Metadata exchange pattern**: Download Adobe's metadata XML file and upload it to the IdP (rather than manually entering ACS URL + Entity ID) to minimize typos and ensure complete configuration. This is the recommended approach when the IdP supports metadata import [5].

**Multi-domain organizations**: Multiple domains can be claimed under a single Federated ID directory (sharing one IdP config), or separate directories can be created for different domains using different IdPs. An org can also mix identity types across domains — e.g., Federated ID for the main domain, Enterprise ID for a subsidiary domain [2].

**Certificate rotation without downtime**: If the IdP supports multiple active certificates, upload the new certificate first and mark it as default before disabling the old one. This avoids any authentication gap [8].

**AEM Cloud Service**: No SAML configuration is needed at the AEM tier itself. Users are authenticated via IMS (Admin Console federation) and authorized through Product Profiles. Admins only need to configure federation once at the Admin Console level [4].

## Gotchas

- **Federated ID and Enterprise ID cannot coexist on the same domain** — a domain can only be claimed by one directory, and a directory uses one identity type. Adobe IDs can exist alongside either [2].

- **Removing a user from the enterprise IdP does NOT automatically remove them from Admin Console** — the user loses the ability to authenticate but remains listed in Admin Console and continues consuming a license seat. Manual removal is required [2].

- **Password reset is not possible for Federated ID users** — Adobe does not store credentials. All password management must go through the IdP. Admins who attempt to reset passwords in Admin Console will find no such option [2].

- **OIDC vs SAML for IdP-initiated login** — If the directory uses an OIDC-based provider (e.g., Azure AD connected via the Azure AD Connector, not SAML), IdP-initiated login and RelayState are not available. This is a common confusion since Azure AD supports both paths [6].

- **Azure AD Sign on URL must be empty** for IdP-initiated login — any value in the Azure "Sign on URL" field forces SP-initiated flow and breaks IdP-initiated login [6].

- **NameID must be a valid email address** — The SAML Subject NameID must match the email in Admin Console exactly (case-sensitive match recommended). Using a username or UPN that isn't in email format will cause "Access Denied" errors [7].

- **Issuer URL mismatches cause assertion failures** — Typos between http and https, or a trailing slash difference between what's in the IdP and what Admin Console expects, will produce "Issuer in the SAML response did not match" errors [7].

- **Clock skew breaks assertions** — SAML assertions include a validity time window. If the IdP server clock drifts, users see "current time is before the time-range specified." Fix: sync server time (`w32tm /resync` on Windows, `ntpdate` on Unix) and increase NotBeforeSkew tolerance to 2 minutes [7].

- **Certificate expiry is silent to end users** — Users just see a generic authentication error. Admins should proactively monitor the certificate status banner in Admin Console rather than waiting for user reports [8].

- **Deleting a certificate is irreversible** — Adobe recommends disabling (not deleting) old certificates until the new one is confirmed working [8].

- **Self-signed IdP certificates are acceptable** — Adobe allows self-signed certificates from the IdP side; they do not need to be CA-issued [2].

## Sources

[1] **Single Sign-On with Adobe Creative Cloud for enterprise FAQ**
    URL: https://helpx.adobe.com/enterprise/using/sso-faq.html
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: SAML 2.0 protocol details, minimum IdP requirements, supported providers list, self-signed certificate support, user lifecycle behavior, password management limitations.

[2] **Set up user identity and Single Sign-on for your organization**
    URL: https://helpx.adobe.com/enterprise/using/set-up-identity.html
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Identity type overview and comparison (Adobe ID vs Enterprise ID vs Federated ID), recommended IdPs (Azure AD, Google, Other SAML), bulk provisioning options, domain mixing rules.

[3] **Identity overview — Adobe Admin Console**
    URL: https://helpx.adobe.com/enterprise/using/identity.html
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Decision matrix for identity types, ownership and authentication model for each type, security features per type.

[4] **Adobe IMS Authentication and Admin Console Support for AEM Managed Services**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-65/content/security/ims-config-and-admin-console
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: AEM Cloud Service IMS pre-configuration, AEM Managed Services Federated ID support, Product Profiles for AEM instance access control.

[5] **Create a directory for SAML-based identity providers**
    URL: https://helpx.adobe.com/enterprise/using/create-directory.html
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Step-by-step SAML directory creation, ACS URL and Entity ID usage, metadata file exchange method, attribute mapping configuration, automatic account creation default.

[6] **Set up Identity provider initiated login for your users**
    URL: https://helpx.adobe.com/enterprise/using/idp-initiated-sso-login.html
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: RelayState configuration, IdP-initiated vs SP-initiated login differences, supported destination apps, Azure AD Sign on URL gotcha, SAML-only limitation for IdP-initiated.

[7] **Troubleshoot Federated ID (SSO) sign-in Issues**
    URL: https://helpx.adobe.com/enterprise/kb/tshoot-fed-id.html
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Common error messages and root causes (Access Denied, Issuer mismatch, certificate validation failure), NameID email format requirement, clock skew fix, SAML Tracer usage.

[8] **Update SSO certificate**
    URL: https://helpx.adobe.com/enterprise/kb/update-certificate.html
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Certificate expiry detection, Admin Console banner notification, update steps for single vs multi-certificate IdPs, irreversibility of deletion, audit log tracking.
