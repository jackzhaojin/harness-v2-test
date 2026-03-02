# Workspace Organization

**Topic ID:** enterprise.workspaces.organization
**Researched:** 2026-03-01T12:00:00Z

## Overview

Workspaces are the foundational organizational unit within the Anthropic API Console, enabling teams to separate API resources by use case, environment, or team [1]. Every organization has a Default Workspace that cannot be renamed, archived, or deleted, and can create up to 100 additional workspaces [1][2]. The key architectural principle is that API keys are scoped to a single workspace and can only access resources within that workspace, making workspaces essential for implementing proper environment separation between development, staging, and production [1].

Workspaces solve several critical enterprise needs: they group related resources (API keys, usage data, settings) into logical units aligned with projects or environments [1]; they enable fine-grained access control by assigning user permissions at the workspace level [1]; they allow independent rate limit and spend limit configuration per workspace [1]; and they provide granular usage and cost tracking broken down by workspace [1]. Starting February 5, 2026, prompt caches are also isolated per workspace on the Claude API and Azure, adding another layer of resource separation [1].

## Key Concepts

- **Workspace Identifiers** — All workspace IDs use the `wrkspc_` prefix (e.g., `wrkspc_01JwQvzr7rXLA5AGx3HKfFUJ`) [1]. The Default Workspace has no ID and returns `null` for `workspace_id` in API responses [1].

- **API Key Scoping** — API keys are tied to the workspace where they are created and cannot be moved between workspaces [2]. When you create an API key in a workspace, it can only access resources within that workspace, including Files, Message Batches, and Skills [1].

- **Workspace Roles** — Four roles exist: Workspace User (Workbench only), Workspace Developer (create/manage API keys, use API), Workspace Admin (full workspace control), and Workspace Billing (inherited from organization billing role, cannot be manually assigned) [1].

- **Role Inheritance** — Organization admins automatically receive Workspace Admin access to all workspaces; organization billing members automatically receive Workspace Billing access; organization users and developers must be explicitly added to each workspace [1][2].

- **Workspace Limits** — Custom spend and rate limits can be set per workspace, but can only be lower than (not higher than) organization limits [1]. The Default Workspace cannot have limits set [1].

- **Admin API Key** — A special key (starting with `sk-ant-admin...`) required for programmatic workspace management, distinct from standard API keys [3]. Only organization admins can provision these keys through the Console [3].

## Technical Details

### Creating Workspaces via Console

Only organization admins can create workspaces [1][2]. The process:

1. Navigate to Settings > Workspaces in the Claude Console
2. Click "Add Workspace"
3. Enter a workspace name and select a color for visual identification
4. Click "Create" to finalize [1]

### Creating Workspaces via Admin API

```bash
# Create a workspace
curl --request POST "https://api.anthropic.com/v1/organizations/workspaces" \
  --header "anthropic-version: 2023-06-01" \
  --header "x-api-key: $ANTHROPIC_ADMIN_KEY" \
  --data '{"name": "Production"}'

# List workspaces
curl "https://api.anthropic.com/v1/organizations/workspaces?limit=10&include_archived=false" \
  --header "anthropic-version: 2023-06-01" \
  --header "x-api-key: $ANTHROPIC_ADMIN_KEY"
```
[1]

### Managing Workspace Members

```bash
# Add a member to a workspace
curl --request POST "https://api.anthropic.com/v1/organizations/workspaces/{workspace_id}/members" \
  --header "anthropic-version: 2023-06-01" \
  --header "x-api-key: $ANTHROPIC_ADMIN_KEY" \
  --data '{
    "user_id": "user_xxx",
    "workspace_role": "workspace_developer"
  }'

# Update a member's role
curl --request POST "https://api.anthropic.com/v1/organizations/workspaces/{workspace_id}/members/{user_id}" \
  --header "anthropic-version: 2023-06-01" \
  --header "x-api-key: $ANTHROPIC_ADMIN_KEY" \
  --data '{"workspace_role": "workspace_admin"}'
```
[1][3]

### Tracking Usage by Workspace

```bash
curl "https://api.anthropic.com/v1/organizations/usage_report/messages?\
starting_at=2025-01-01T00:00:00Z&\
ending_at=2025-01-08T00:00:00Z&\
workspace_ids[]=wrkspc_01JwQvzr7rXLA5AGx3HKfFUJ&\
group_by[]=workspace_id&\
bucket_width=1d" \
  --header "anthropic-version: 2023-06-01" \
  --header "x-api-key: $ADMIN_API_KEY"
```
[1]

### API Key Naming Convention

Use descriptive names that indicate environment and purpose, such as "prod-backend-2026-01" or "staging-chat-service" [4]. This enables quick identification and isolation if a specific key is compromised [4].

## Common Patterns

### Environment Separation Pattern

The recommended approach creates separate workspaces for each deployment environment [1][4]:

| Workspace | Purpose | Typical Limits |
|-----------|---------|----------------|
| Development | Testing and experimentation | Lower rate limits, minimal spend cap |
| Staging | Pre-production testing | Production-like limits for realistic testing |
| Production | Live traffic | Full rate limits, monitoring alerts configured |

This pattern ensures that development activity cannot exhaust production rate limits, compromised dev keys cannot access production resources, and costs can be tracked and attributed per environment [1][4].

### Team/Department Isolation Pattern

Assign workspaces to different teams for cost allocation and access control [1]:

- Engineering team with developer access
- Data science team with their own API keys
- Support team with limited access for customer tools

### Programmatic Onboarding Pattern

Use the Admin API to automate workspace setup [3]:

1. Create workspace via POST to `/v1/organizations/workspaces`
2. Add team members via POST to `/v1/organizations/workspaces/{workspace_id}/members`
3. Members create their API keys through Console (Admin API cannot create new keys for security reasons) [3]
4. Configure spend/rate limits via Console

### Key Rotation Pattern

Rotate API keys every 60-90 days [4]:

1. Create new key with descriptive name including date (e.g., "prod-backend-2026-03")
2. Update applications to use new key
3. Verify new key is working correctly
4. Disable old key via Console or Admin API
5. After confirmation period, delete old key

## Gotchas

- **Cannot Create API Keys via Admin API** — New API keys can only be created through the Claude Console for security reasons; the Admin API can only manage existing keys [3]. This is frequently surprising to teams trying to fully automate provisioning.

- **Default Workspace Limitations** — The Default Workspace cannot be renamed, archived, deleted, or have limits set [1][2]. It has no workspace ID, so API responses show `null` for `workspace_id` [1]. This can complicate analytics if you rely on the Default Workspace.

- **Archived Workspaces are Permanent** — Archiving a workspace immediately revokes all API keys in that workspace and cannot be undone [1][2]. This is more severe than "disabling" — it is a one-way operation.

- **API Keys Persist After User Removal** — API keys persist in their current state when a user is removed from a workspace because keys are scoped to the organization and workspace, not to individual users [1][3]. Removed users do not automatically have their keys revoked.

- **Organization Admins Cannot Be Removed from Workspaces** — Organization admins and billing members cannot have their workspace roles changed or be removed from workspaces while they hold those organization roles [1]. Their workspace access must be modified by changing their organization role first.

- **Workspace Limits Cannot Exceed Organization Limits** — Workspace limits can only be set lower than organization limits [1]. If you try to set higher limits, the request will fail. Also, if workspace limits collectively exceed organization limits, the organization limit still applies [1].

- **Prompt Cache Isolation Change (Feb 2026)** — Starting February 5, 2026, prompt caches are isolated per workspace [1]. This means cached prompts in one workspace cannot be reused by another workspace, potentially increasing costs if the same prompts are used across environments.

- **100 Workspace Maximum** — Organizations are limited to 100 active workspaces; archived workspaces do not count toward this limit [1][2].

- **Admin API Requires Special Key** — The Admin API key (starting with `sk-ant-admin...`) is distinct from regular API keys and can only be provisioned by organization admins [3]. Using a regular API key will fail silently or return authorization errors.

## Sources

[1] **Workspaces - Claude API Docs**
    URL: https://platform.claude.com/docs/en/build-with-claude/workspaces
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Core workspace concepts including identifiers, roles, role inheritance, workspace limits, API key scoping, prompt cache isolation, usage tracking, Console and Admin API instructions, best practices, and FAQ answers.

[2] **Creating and managing Workspaces in the Claude Console**
    URL: https://support.claude.com/en/articles/9796807-creating-and-managing-workspaces
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Step-by-step Console instructions for creating workspaces, editing settings, managing members, creating API keys, setting rate limits, archiving workspaces, and managing the Default Workspace.

[3] **Admin API overview - Claude API Docs**
    URL: https://platform.claude.com/docs/en/build-with-claude/administration-api
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Admin API authentication requirements, organization roles, workspace member management endpoints, API key management limitations, invite expiration (21 days), and security restrictions on admin removal.

[4] **API Key Best Practices: Keeping Your Keys Safe and Secure**
    URL: https://support.claude.com/en/articles/9767949-api-key-best-practices-keeping-your-keys-safe-and-secure
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Environment variable storage best practices, key rotation schedule (90 days), environment separation recommendations, naming conventions, repository scanning tools, and KMS recommendations for scale.
