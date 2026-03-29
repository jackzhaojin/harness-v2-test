# Cloud Manager API Endpoints

**Topic ID:** cloud-manager-operations.api.endpoints
**Researched:** 2026-03-29T00:00:00Z

## Overview

The Adobe Cloud Manager REST API enables programmatic access to the same CI/CD pipeline capabilities available through the Cloud Manager web UI [1]. It is the primary integration surface for automating AEM environment management — triggering deployments, reading execution status, managing environment variables, and orchestrating pipeline workflows from external systems. Organizations typically use it to connect Cloud Manager with external CI/CD platforms (Jenkins, GitHub Actions, Azure DevOps), implement custom deployment gates, or route pipeline event notifications to monitoring tools [2].

The API is hosted at the base URL `https://cloudmanager.adobe.io` and follows a REST/HAL (Hypertext Application Language) architecture [3]. Rather than hardcoding endpoint paths, the API is designed for hypermedia-driven navigation: clients start at a root resource, discover action links from `_links` objects in responses, and follow those links to perform subsequent operations. This HATEOAS pattern means that the API surface is navigable through discovery rather than requiring the client to construct paths manually [3].

The Cloud Manager API covers programs, environments, pipelines, pipeline executions, execution artifacts, environment/pipeline variables, repositories, rapid development environments (RDE), and more [1]. For the AEM DevOps Engineer exam, the highest-priority areas are pipeline execution triggers, advance/cancel operations, environment management, variable management, and authentication headers.

## Key Concepts

- **Base URL** — All Cloud Manager REST API calls are made to `https://cloudmanager.adobe.io`. The API entry point is `GET /api/programs`, which returns the list of programs for the authenticated organization [3].

- **HAL (Hypertext Application Language)** — API responses include a `_links` object containing named link relations (e.g., `https://ns.adobe.com/adobecloud/rel/pipeline/reExecute`). Clients should follow these links rather than construct URLs from documentation, because Adobe can change paths while keeping link relations stable [3].

- **Three Required Headers** — Every API request must include `Authorization: Bearer <token>`, `x-api-key` (IMS Client ID), and `x-gw-ims-org-id` (IMS Organization ID). All three are required; missing any one will result in a 401 or 403 response [1][2].

- **OAuth Server-to-Server Authentication** — The recommended (and now required) authentication method. JWT-based authentication is deprecated and was removed as of January 2025. Tokens are obtained via a POST to `https://ims-na1.adobelogin.com/ims/token/v3` using `CLIENT_ID`, `CLIENT_SECRET`, `GRANT_TYPE`, and `SCOPES` [2].

- **Pipeline Execution Trigger** — A pipeline is started with `PUT /api/program/{programId}/pipeline/{pipelineId}/execution`. Emergency mode skips security and performance tests and is triggered by appending `?pipelineExecutionMode=EMERGENCY` to the same endpoint [4].

- **Advance and Cancel Operations** — Pipeline steps that require interactive action (code quality gates, Go-Live Approval, schedule) are advanced or cancelled via `PUT` to HAL link relations `https://ns.adobe.com/adobecloud/rel/pipeline/advance` and `https://ns.adobe.com/adobecloud/rel/pipeline/cancel` respectively [5].

- **Pipeline Variables** — Set via `PATCH /api/program/{programId}/pipeline/{pipelineId}/variables`. Variables can be `string`, `secretString`, or `secretBytes`. Limit is 200 variables per pipeline; secret strings max out at 500 characters [6].

- **Environment Variables** — Separate from pipeline variables; these are accessible at AEM runtime (not just during build). Managed via the environments endpoint and support the same type system [6].

## Technical Details

### Endpoint Reference

Key endpoints organized by resource group [1][3]:

**Programs**
```
GET  /api/programs                               # List all programs
GET  /api/program/{programId}                    # Get a single program
```

**Pipelines**
```
GET  /api/program/{programId}/pipelines          # List pipelines in a program
GET  /api/program/{programId}/pipeline/{pipelineId}  # Get pipeline by ID
PATCH /api/program/{programId}/pipeline/{pipelineId} # Update pipeline config
DELETE /api/program/{programId}/pipeline/{pipelineId} # Delete pipeline
```

**Pipeline Execution**
```
PUT  /api/program/{programId}/pipeline/{pipelineId}/execution         # Start execution
GET  /api/program/{programId}/pipeline/{pipelineId}/execution         # Get current execution
GET  /api/program/{programId}/pipeline/{pipelineId}/executions        # List executions
GET  /api/program/{programId}/pipeline/{pipelineId}/execution/{executionId}  # Get specific execution
PUT  <HAL link: pipeline/advance>                # Advance a waiting step
PUT  <HAL link: pipeline/cancel>                 # Cancel a running/waiting step
```

**Environments**
```
GET  /api/program/{programId}/environments       # List environments
POST <HAL link: environments>                    # Create an environment
DELETE /api/program/{programId}/environment/{environmentId} # Delete environment
```

**Variables**
```
GET   /api/program/{programId}/pipeline/{pipelineId}/variables   # Get pipeline variables
PATCH /api/program/{programId}/pipeline/{pipelineId}/variables   # Set/update pipeline variables
GET   /api/program/{programId}/environment/{environmentId}/variables   # Get env variables
PATCH /api/program/{programId}/environment/{environmentId}/variables   # Set env variables
```

### Authentication Flow

The recommended OAuth Server-to-Server token generation pattern [2]:

```bash
curl -X POST https://ims-na1.adobelogin.com/ims/token/v3 \
  -d "grant_type=client_credentials" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "scope=openid,AdobeID,read_organizations,additional_info.projectedProductContext,read_pc.dma_aem_ams"
```

All subsequent API calls require [1][2]:
```
Authorization: Bearer <access_token>
x-api-key: <client_id>
x-gw-ims-org-id: <ims_org_id>
Content-Type: application/json   # required for POST/PUT/PATCH
```

### Trigger a Pipeline Execution

Standard execution trigger [4]:
```bash
PUT https://cloudmanager.adobe.io/api/program/{programId}/pipeline/{pipelineId}/execution
```

Emergency mode (skips security and performance tests) [4]:
```bash
PUT https://cloudmanager.adobe.io/api/program/{programId}/pipeline/{pipelineId}/execution?pipelineExecutionMode=EMERGENCY
```

### Pipeline Variable PATCH Body

The PATCH endpoint expects a JSON array. To delete a variable, pass an empty value [6]:
```json
[
  { "name": "MY_VARIABLE", "value": "somevalue", "type": "string" },
  { "name": "MY_SECRET", "value": "secretvalue", "type": "secretString" },
  { "name": "DELETED_VAR", "value": "", "type": "string" }
]
```

Variable constraints [6]:
- Max 200 variables per pipeline
- Name: max 100 characters, alphanumeric + underscore only, uppercase convention
- `string` value: max 2048 characters
- `secretString` value: max 500 characters

### Re-Execution

Re-executing the last production deployment step is done via the HAL link `https://ns.adobe.com/adobecloud/rel/pipeline/reExecute` on the production deploy step state [4]:
```bash
PUT <href from _links["https://ns.adobe.com/adobecloud/rel/pipeline/reExecute"]>
```

### Common HTTP Response Codes

| Code | Meaning in Cloud Manager context |
|------|----------------------------------|
| 200  | Success |
| 201  | Resource created (e.g., new environment) |
| 400  | Malformed request or invalid pipeline state for the requested action |
| 401  | Missing or invalid access token |
| 403  | Valid token but insufficient permissions (e.g., not in Deployment Manager role) |
| 404  | Program, pipeline, or environment not found |
| 412  | Precondition failed — step not in correct state for advance/cancel |

A 412 is commonly returned when trying to advance or cancel a step that is not waiting for user action [5].

## Common Patterns

**Pattern 1: External system triggers deployment**
External CI system (e.g., GitHub Actions) merges code and then calls `PUT .../pipeline/{id}/execution` to start the Cloud Manager pipeline. A webhook or polling loop on `GET .../execution` monitors execution status until a terminal state is reached [4].

**Pattern 2: Automated Go-Live approval**
After the staging deployment passes automated validation, an external system calls `PUT` on the `https://ns.adobe.com/adobecloud/rel/pipeline/advance` HAL link to approve the Go-Live step. This enables zero-human-touch production deployments in mature DevOps setups [5].

**Pattern 3: Slack/Teams deployment notifications**
Cloud Manager webhooks fire events (`pipeline.execution.started`, `pipeline.execution.ended`, `pipeline.execution.step.waiting`) to an Adobe I/O event listener. A Lambda or serverless function receives the event and posts a notification to Slack or Teams [2].

**Pattern 4: Environment variable rotation**
Automated credential rotation scripts call `PATCH .../environment/{id}/variables` to update `secretString` variables without touching source code or restarting pipeline runs. If a pipeline is running, variable management is blocked — the API will return an error [6].

**Pattern 5: Query execution history for metrics**
`GET .../executions` returns a list of execution records including timestamps and statuses, enabling external dashboards to calculate deployment frequency, mean lead time, and failure rate metrics.

## Gotchas

- **JWT auth is gone as of January 2025.** If code uses JWT-based token generation, it will fail. Must migrate to OAuth Server-to-Server. AEM Developer Console tokens also cannot be used with the Cloud Manager API; only tokens from the Adobe Developer Console are valid [2].

- **No refresh tokens for Cloud Manager OAuth.** Unlike standard OAuth flows, Cloud Manager's OAuth Server-to-Server does not issue refresh tokens. Access tokens expire and must be regenerated programmatically. Do not design systems that assume a long-lived token [2].

- **HAL links, not constructed paths.** For advance/cancel/reExecute operations, the correct URL must be extracted from the `_links` object of the step or execution response. Hardcoding these paths based on documentation is an anti-pattern and brittle if Adobe changes their routing [3][5].

- **Re-execution restrictions.** Re-execution via the `reExecute` HAL link only applies to the last execution, and only if it reached the production deployment step. Executions that failed before the production deploy step — or that were triggered by a push update — cannot be re-executed this way [4].

- **Emergency mode is not just "fast mode."** It skips security testing AND performance testing. Using emergency mode routinely defeats a core purpose of Cloud Manager's quality gates. Exam scenarios may test whether you know which tests are skipped [4].

- **Pipeline variable management blocked during runs.** If a pipeline is actively running, `PATCH /variables` calls return an error. Build automation that updates variables must check execution state first or handle this gracefully [6].

- **Environment limits by program type.** Sandbox programs are capped at one environment of each type. Production programs are limited to one stage + one production environment. Dev environments are limited by contract. Attempting to create beyond limits via API returns an error [1].

- **403 vs. 401 permission errors.** A 401 means the token itself is invalid or expired. A 403 means the token is valid but the technical account's product profile does not grant the needed role. Setting pipeline/environment variables requires at minimum the **Deployment Manager** role — not just any Cloud Manager user role [5].

- **`x-gw-ims-org-id` is the IMS Org ID, not the Program ID.** A common mistake is confusing the IMS organization ID with the Cloud Manager program ID. The org ID comes from the Adobe Developer Console credentials screen and never changes across programs [1].

## Sources

[1] **Overview - Cloud Manager API**
    URL: https://developer.adobe.com/experience-cloud/cloud-manager/
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: API overview, base URL (`https://cloudmanager.adobe.io`), list of endpoint categories, environment limit rules, and general integration description.

[2] **Understanding the Adobe Cloud Manager API - Oshyn**
    URL: https://www.oshyn.com/blog/adobe-cloud-manager-api
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: OAuth 2.0 Server-to-Server authentication details, JWT deprecation, required headers (Authorization, x-api-key, x-gw-ims-org-id), token lifecycle, refresh token limitation, and practical automation use cases.

[3] **Understanding the API - Cloud Manager API (Adobe Developer)**
    URL: https://developer.adobe.com/experience-cloud/cloud-manager/guides/getting-started/understanding-the-api/
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: HAL/HATEOAS architecture explanation, `_links` navigation model, base URL, templated links, and why clients should follow links rather than construct paths.

[4] **Cloud Manager API: Pipeline Execution and Triggers**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/using-cloud-manager/cicd-pipelines/introduction-ci-cd-pipelines
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: PUT endpoint for starting pipeline execution, emergency mode query parameter (`pipelineExecutionMode=EMERGENCY`), re-execution HAL link pattern, restrictions on re-execution eligibility.

[5] **Advancing and Cancelling Steps - Cloud Manager API**
    URL: https://developer.adobe.com/experience-cloud/cloud-manager/guides/api-usage/advancing-and-cancelling-steps/
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Advance/cancel PUT operation patterns, HAL link relation names for advance and cancel, step-type to action mapping (code quality, Go-Live approval, schedule), HTTP 412 response for wrong step state, required product profile (Deployment Manager).

[6] **Pipeline Variables in Cloud Manager**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/using-cloud-manager/cicd-pipelines/pipeline-variables
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Variable types (string, secretString), PATCH endpoint pattern, variable limits (200 per pipeline, 100-char name, 2048/500-char values), deletion by empty value, variable management blocked during active pipeline runs.

[7] **Cloud Manager API Spec (Swagger/OpenAPI)**
    URL: https://developer.adobe.com/experience-cloud/cloud-manager/reference/api/
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Full endpoint tag list (Programs, Repositories, Branches, Pipelines, Pipeline Execution, Execution Artifacts, Environments, Region Deployments, Variables, RDE, IP Allowlist, SSL Certificates), operationId references, response schemas.

[8] **Authentication - Cloud Manager API**
    URL: https://developer.adobe.com/experience-cloud/cloud-manager/guides/getting-started/authentication/authentication/
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: OAuth Server-to-Server credential setup via Adobe Developer Console, token endpoint URL, required parameters, confirmation that AEM Developer Console tokens cannot be used with Cloud Manager API.
