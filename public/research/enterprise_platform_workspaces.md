# Workspaces and API Keys

**Topic ID:** enterprise.platform.workspaces
**Researched:** 2026-03-01T12:00:00Z

## Overview

Workspaces are organizational units within the Anthropic Claude Console that enable enterprises to segment API usage across teams, projects, and environments. They sit between the organization level and individual API keys, providing a middle layer for resource management, access control, and cost allocation.

For organizations using Claude across development, staging, and production environments—or across multiple teams and use cases—Workspaces solve the problem of undifferentiated API key sprawl. Without workspaces, all API keys share the same rate limits and spend pools, making it impossible to isolate noisy neighbors, track costs per project, or enforce environment-specific constraints.

Workspaces matter because they transform API management from "one big bucket" into a structured hierarchy. You can allocate a development workspace with lower limits (protecting production capacity), give each product team its own workspace for cost attribution, or create a sandbox workspace for experimentation without risk of impacting live services.

## Key Concepts

- **Organization**: The top-level container that holds all workspaces, users, and billing. Every organization gets one immutable default workspace.

- **Workspace**: An isolated environment containing its own API keys, spend limits, rate limits, and member roster. Organizations are limited to 100 workspaces.

- **Default Workspace**: A special workspace that exists in every organization and cannot be renamed, archived, deleted, or have custom limits applied. All organizations start here.

- **Workspace Limits**: Per-workspace spend caps and rate limits that must be equal to or lower than organization-level limits. Anthropic evaluates both workspace and organization limits for every API request.

- **API Key Binding**: API keys are permanently tied to their originating workspace and cannot be moved between workspaces. Archiving a workspace archives all its keys.

- **Admin API**: A separate programmatic interface (using `sk-ant-admin...` keys) for managing workspaces, members, and API keys. Regular API keys cannot perform administrative operations.

- **Workspace Roles**: Permissions scoped to specific workspaces, including workspace_admin and workspace_developer, distinct from organization-level roles.

- **Data Residency**: Per-workspace configuration that controls geographic regions for inference and data storage, set at creation time and immutable afterward.

## Technical Details

### Workspace Structure via Admin API

Retrieve workspace details programmatically:

```bash
curl "https://api.anthropic.com/v1/organizations/workspaces/{workspace_id}" \
  --header "anthropic-version: 2023-06-01" \
  --header "x-api-key: $ANTHROPIC_ADMIN_KEY"
```

Response schema:
```json
{
  "id": "wrkspc_xxx",
  "type": "workspace",
  "name": "Production",
  "display_color": "#FF5733",
  "created_at": "2024-01-15T10:30:00Z",
  "archived_at": null,
  "data_residency": {
    "workspace_geo": "us",
    "default_inference_geo": "us",
    "allowed_inference_geos": ["us"]
  }
}
```

### Managing Workspace Members

```bash
# Add member to workspace
curl --request POST \
  "https://api.anthropic.com/v1/organizations/workspaces/{workspace_id}/members" \
  --header "anthropic-version: 2023-06-01" \
  --header "x-api-key: $ANTHROPIC_ADMIN_KEY" \
  --data '{
    "user_id": "user_xxx",
    "workspace_role": "workspace_developer"
  }'
```

### API Key Management

API keys can only be **created** through the Console UI—the Admin API can list and deactivate keys but not create new ones:

```bash
# List API keys in a workspace
curl "https://api.anthropic.com/v1/organizations/api_keys?workspace_id=wrkspc_xxx&status=active" \
  --header "anthropic-version: 2023-06-01" \
  --header "x-api-key: $ANTHROPIC_ADMIN_KEY"

# Deactivate an API key
curl --request POST \
  "https://api.anthropic.com/v1/organizations/api_keys/{api_key_id}" \
  --header "anthropic-version: 2023-06-01" \
  --header "x-api-key: $ANTHROPIC_ADMIN_KEY" \
  --data '{"status": "inactive"}'
```

### Rate Limit Hierarchy

Rate limits are enforced using a token bucket algorithm with three limit types per model:
- **RPM**: Requests per minute
- **ITPM**: Input tokens per minute (uncached tokens only for most models)
- **OTPM**: Output tokens per minute

Workspace limits cannot exceed organization limits. When a workspace limit is unset, it inherits the organization's limit. Every request is evaluated against both workspace and organization limits.

Example configuration: If your organization has 40,000 ITPM, you might allocate:
- Production workspace: 30,000 ITPM
- Development workspace: 10,000 ITPM
- Staging workspace: (unset, but capped by org availability)

## Common Patterns

### Environment Segmentation

Create separate workspaces for each environment to isolate failures and track costs:

```
Organization: MyCompany
├── Production (spend limit: $5,000/mo, rate: 80% of org limit)
├── Staging (spend limit: $500/mo, rate: 15% of org limit)
└── Development (spend limit: $200/mo, rate: 10% of org limit)
```

This ensures a runaway development script cannot exhaust production capacity.

### Team-Based Cost Attribution

Assign each product team its own workspace to enable usage tracking and chargeback:

```
Organization: MyCompany
├── Search Team (workspace for search product)
├── Chat Team (workspace for chatbot product)
└── Internal Tools (workspace for internal automation)
```

Use the Usage API to pull costs per workspace for internal billing.

### API Key Rotation Strategy

1. Create a new API key in the workspace with a descriptive name including creation date
2. Deploy the new key to services
3. Monitor that the old key shows zero recent usage
4. Disable (not delete) the old key for 30 days
5. After verification period, delete the old key

Recommended rotation cadence: every 90 days.

### Spend Notifications

Configure email alerts at threshold percentages:
- 50% of workspace spend limit: awareness
- 75% of workspace spend limit: planning
- 90% of workspace spend limit: action required

## Gotchas

- **Default workspace has no limits**: You cannot set spend or rate limits on the default workspace. If you need limits, create a new workspace.

- **API keys are immovable**: Once created, an API key cannot be transferred to another workspace. Plan your workspace structure before issuing keys to production systems.

- **Archiving is permanent**: Archiving a workspace permanently disables all its API keys. There is no unarchive operation. Use this only when decommissioning.

- **Workspace limits don't reserve capacity**: Setting a workspace to 30,000 ITPM doesn't reserve that capacity—it's a ceiling, not a guarantee. Another workspace could consume the organization's full limit.

- **Admin API key ≠ regular API key**: The Admin API requires a special `sk-ant-admin...` key. Regular API keys starting with `sk-ant-api...` cannot perform administrative operations.

- **Organization admins see everything**: Users with organization Admin or Billing roles automatically have access to all workspaces and cannot be removed from them.

- **100 workspace cap**: You cannot create more than 100 workspaces per organization. Plan for consolidation if managing many small projects.

- **Invite expiration**: Organization invites expire after 21 days and cannot be extended. Resend if expired.

- **No API key creation via API**: Despite the Admin API's name, you cannot programmatically create new API keys—only list and manage existing ones. Key creation requires Console access.

- **Cached tokens don't count toward ITPM**: For most current models, `cache_read_input_tokens` don't count toward rate limits. This makes prompt caching extremely valuable for high-throughput workloads.

## Sources

- [Creating and managing Workspaces in the Claude Console](https://support.claude.com/en/articles/9796807-creating-and-managing-workspaces) — workspace creation, limits, membership, archiving procedures
- [Admin API overview](https://platform.claude.com/docs/en/build-with-claude/administration-api) — programmatic workspace and API key management, authentication, code examples
- [Rate limits](https://platform.claude.com/docs/en/api/rate-limits) — spend limits, rate limit tiers, workspace limit configuration, response headers
- [API Key Best Practices](https://support.claude.com/en/articles/9767949-api-key-best-practices-keeping-your-keys-safe-and-secure) — security guidance, rotation strategy, environment segmentation, GitHub secret scanning
- [Get Workspace API Reference](https://platform.claude.com/docs/en/api/admin-api/workspaces/get-workspace) — workspace object schema, data residency fields
