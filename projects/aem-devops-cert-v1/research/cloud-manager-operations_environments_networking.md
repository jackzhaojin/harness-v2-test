# Advanced Networking Configuration

**Topic ID:** cloud-manager-operations.environments.networking
**Researched:** 2026-03-29T00:00:00Z

## Overview

AEM as a Cloud Service provides three mutually exclusive advanced networking options to manage how AEM environments connect to external services: **Flexible Port Egress**, **Dedicated Egress IP Address**, and **Virtual Private Network (VPN)** [1]. These features go beyond the default shared-IP outbound routing that AEM uses for standard HTTP/HTTPS traffic on ports 80 and 443, enabling use cases such as accessing on-premise systems, allowlisting AEM traffic by a fixed IP at a firewall, or connecting to non-standard ports for databases and SMTP services [1][2].

All three options follow a two-step configuration model: the network infrastructure is first provisioned at the **program level**, and then separately **enabled per environment** [1]. This means choosing the wrong infrastructure type has significant consequences — a program can only provision a single advanced networking type at any given time, and switching requires deleting and recreating the infrastructure [1]. These networking features are available only for production programs; sandbox programs do not support advanced networking [2].

Provisioning is handled through either the **Cloud Manager UI** (Services > Network Infrastructures wizard) or the **Cloud Manager API** (`/networkInfrastructures` and `/advancedNetworking` endpoints) [1]. Provisioning can take up to one hour for flexible port egress and dedicated egress IP, and up to 45-60 minutes for VPN [3][4][5].

## Key Concepts

- **Flexible Port Egress** — Enables AEM to make outbound connections on non-standard ports (ports other than 80/443). Does not provide a dedicated IP; traffic egresses through shared Adobe cluster IPs. Recommended when IP allowlisting is not required, as Adobe can optimize performance of shared-IP traffic [1][2].
- **Dedicated Egress IP Address** — Routes all outbound traffic through a single static IP per program, which can be allowlisted at customer firewalls. Includes all flexible port egress capabilities. The dedicated IP is shared across all environments in the same program [1][4].
- **Virtual Private Network (VPN)** — Creates an encrypted IPSec tunnel between AEM and the customer's existing VPN infrastructure. The most powerful option: it supports all features of dedicated egress IP, adds IP-based traffic restriction to AEM Publish, and enables private hostname resolution via customer DNS [1][2][3].
- **Two-step provisioning** — Advanced networking must first be created at the program level via `POST /program/{programId}/networkInfrastructures`, then enabled per environment via `PUT /program/{programId}/environment/{envId}/advancedNetworking` [1].
- **Port Forwarding (`portForwards`)** — Environment-level rules that map an internal `portOrig` (30000-30999 range) to an external destination host and `portDest`. Required for non-HTTP/HTTPS protocols (SQL, SMTP, etc.) [1][5].
- **Non-Proxy Hosts (`nonProxyHosts`)** — Per-environment list of hostnames that should route through shared IPs instead of the dedicated egress IP or VPN. Only available for Dedicated Egress IP and VPN [1][4].
- **Proxy Environment Variables** — `AEM_PROXY_HOST` (resolves to `proxy.tunnel`), `AEM_HTTP_PROXY_PORT`, and `AEM_HTTPS_PROXY_PORT` (default 3128). Used in Java and OSGi configs for non-standard port traffic [1][5].
- **Connection limit** — Advanced networking connections are capped at 1000 per AEM instance. An alert fires at 750. Exceeding the limit drops new egress connections [1].

## Technical Details

### Feature Comparison Matrix

| Capability | Flexible Port Egress | Dedicated Egress IP | VPN |
|---|---|---|---|
| Non-standard port egress | Yes | Yes | Yes |
| Non-HTTP/HTTPS protocols | Yes | Yes | Yes |
| Dedicated static egress IP | No | Yes | Yes |
| IP-based access restriction to Publish | No | No | Yes |
| `nonProxyHosts` support | No | Yes | Yes |
| Private hostname resolution | No | No | Yes (via DNS resolvers) |

[2]

### Cloud Manager API Workflow

**Step 1 — Create program-level infrastructure (API):**

```shell
# Dedicated Egress IP example
curl -X POST https://cloudmanager.adobe.io/api/program/{programId}/networkInfrastructures \
  -H 'x-gw-ims-org-id: <ORG_ID>' \
  -H 'x-api-key: <CLIENT_ID>' \
  -H 'Authorization: Bearer <ACCESS_TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{ "kind": "dedicatedEgressIp", "region": "va7" }'
```

Valid `kind` values: `flexiblePortEgress`, `dedicatedEgressIp`, `vpn` [4].

**Step 2 — Verify provisioning status:**

Poll `GET /program/{programId}/networkInfrastructure/{infraId}` until `status` is `ready` [4].

**Step 3 — Enable per environment:**

```json
PUT /program/{programId}/environment/{envId}/advancedNetworking

{
  "nonProxyHosts": ["example.net", "*.example.org"],
  "portForwards": [
    { "name": "mysql.example.com", "portDest": 3306, "portOrig": 30001 },
    { "name": "smtp.sendgrid.net", "portDest": 465, "portOrig": 30002 }
  ]
}
```

This is a **PUT operation** — all rules must be included in every call or previously set rules will be removed [1][4].

### Proxy Variables in Code

**Java:**
```java
String proxyHost = System.getenv().getOrDefault("AEM_PROXY_HOST", "proxy.tunnel");
int proxyPort = Integer.parseInt(System.getenv().getOrDefault("AEM_HTTPS_PROXY_PORT", "3128"));
HttpClient client = HttpClient.newBuilder()
    .proxy(ProxySelector.of(new InetSocketAddress(proxyHost, proxyPort)))
    .build();
```
[1]

**OSGi Configuration (e.g., Mail service SMTP host):**
```
smtp.host = $[env:AEM_PROXY_HOST;default=proxy.tunnel]
smtp.port = 30465   # portOrig, NOT the real SMTP port
```
[1]

### VPN-Specific Configuration

VPN requires additional fields at the program level: address space CIDR (e.g., `/26` = 64 IPs), DNS resolver IP addresses for private hostname resolution, a pre-shared key, and VPN connection details (customer VPN device IP, routes) [3]. The IPSec policy defaults are:

- IKE: AES256/SHA256, DH Group ECP256
- IPSec: AES256/SHA256, PFS Group ECP256, SA Lifetime 3600s [3]

### Finding the Dedicated Egress IP

```shell
dig +short p{programId}.external.adobeaemcloud.com
```

This hostname is egress-only; it cannot be pinged [4].

## Common Patterns

**Scenario: External database on non-standard port**
Use any of the three options (flexible port egress is the lightest-weight choice if IP allowlisting is not required). Define a `portForwards` rule mapping `portOrig: 30001` to `mysql.example.com:3306`. In the Java/OSGi code, connect to `$AEM_PROXY_HOST:30001` rather than the real host/port [1][5].

**Scenario: Third-party SaaS requiring IP allowlisting at their firewall**
Use **Dedicated Egress IP**. Retrieve the static IP via DNS lookup on `p{programId}.external.adobeaemcloud.com`. Provide this IP to the third-party for allowlisting. All environments in the program share this IP [4].

**Scenario: Accessing on-premise backend not exposed to internet**
Use **VPN**. This is the only option that creates a private encrypted tunnel to the customer's network. Configure DNS resolvers in the VPN setup to enable private hostname resolution [3].

**Scenario: HTTP/HTTPS on standard ports to public internet**
No advanced networking required. AEM routes ports 80/443 HTTP/HTTPS traffic directly by default [1].

**Scenario: Multi-region publish with advanced networking**
Secondary regions route advanced networking traffic through the primary region by default. To optimize latency, provision separate network infrastructure per region [1].

## Gotchas

- **One type per program, no mixing.** Once you provision flexible port egress, you cannot add dedicated egress IP or VPN to the same program. To switch, delete the infrastructure (after disabling it on all environments) and recreate [1].
- **Flexible port egress cannot be edited.** After creation, the only change path is delete and recreate [1].
- **PUT semantics for environment configuration.** `enableEnvironmentAdvancedNetworkingConfiguration` is a PUT, not PATCH. Every invocation must include the full set of `portForwards` and `nonProxyHosts` or previously configured rules will be lost [1][4].
- **OSGi `smtp.port` uses `portOrig`, not the real destination port.** When configuring an SMTP or other non-HTTP service via OSGi, the port value must be the mapped `portOrig` (e.g., 30465), not the actual service port (465). The Cloud Manager `portForwards` rule handles the translation [1].
- **`AEM_PROXY_HOST` is a reserved environment variable.** Do not attempt to set this via Cloud Manager environment variables; it is automatically injected by the platform and maps to `proxy.tunnel` [1].
- **Dedicated egress IP is shared by all environments in the program.** A single static IP is issued per program, not per environment. Dev, Stage, and Production all use the same egress IP [1][4].
- **VPN does not support build environment.** Cloud Manager build pipelines cannot use VPN connections. Build artifacts must be hosted in publicly accessible repositories [3].
- **Legacy egress migration requires Adobe Client Care.** Customers on pre-September 30, 2021 dedicated egress technology must contact Adobe before enabling new advanced networking features, as mixing old and new egress can break site connectivity [1].
- **`nonProxyHosts` is only for Dedicated Egress IP and VPN.** Flexible port egress does not support `nonProxyHosts` because all traffic already exits through shared IPs [1][4].
- **Dedicated egress IP does not cover Azure/Adobe internal services.** Traffic to Azure or Adobe-owned services routes through shared cluster IPs regardless of dedicated egress IP configuration [1].
- **Connection limit applies only to advanced networking traffic.** The 1000-connection cap (alert at 750) applies only to non-standard port or dedicated IP/VPN connections, not standard HTTP/HTTPS on 80/443 [1].
- **Flexible port egress preferred when IP not needed.** Adobe explicitly recommends using flexible port egress over dedicated egress IP when a specific egress IP is not required, because Adobe can optimize performance for shared-IP traffic [1].
- **VPN address space cannot be changed after creation.** The CIDR address space defined at VPN creation is immutable [1].

## Sources

[1] **Configure Advanced Networking for AEM as a Cloud Service — Adobe Experience League**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/security/configuring-advanced-networking
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Full configuration reference including two-step provisioning model, all three networking types, API endpoints, proxy environment variables, port forwarding rules, `nonProxyHosts`, connection limits, editing restrictions, multi-region behavior, legacy migration warnings, and Java/OSGi code examples.

[2] **Advanced Networking — AEM as a Cloud Service Learn**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-learn/cloud-service/networking/advanced-networking
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Feature comparison matrix across all three networking types, sandbox program exclusion, and the single-type-per-program constraint.

[3] **Virtual Private Network (VPN) — AEM as a Cloud Service Learn**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-learn/cloud-service/networking/vpn
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: VPN-specific provisioning (45-60 min), address space configuration, DNS resolver setup, IPSec policy defaults, build environment limitation, and port forwarding for non-HTTP traffic over VPN.

[4] **Dedicated Egress IP Address — AEM as a Cloud Service Learn**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-learn/cloud-service/networking/dedicated-egress-ip-address
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Dedicated IP provisioning steps (API and UI), shared-IP-per-program behavior, DNS lookup for egress IP (`dig +short p{programId}.external.adobeaemcloud.com`), `nonProxyHosts` usage, `portForwards` JSON schema, and PUT semantics warning.

[5] **Flexible Port Egress — AEM as a Cloud Service Learn**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-learn/cloud-service/networking/flexible-port-egress
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Flexible port egress configuration (UI and API), proxy environment variable table (`AEM_PROXY_HOST`, `AEM_HTTP_PROXY_PORT`, `AEM_HTTPS_PROXY_PORT`), connection type routing rules, `portForwards` JSON example, and single-infrastructure-per-program constraint.
