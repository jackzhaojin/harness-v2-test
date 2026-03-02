# Usage Monitoring

**Topic ID:** enterprise.cost-optimization.monitoring
**Researched:** 2026-03-01T12:00:00Z

## Overview

Usage Monitoring in the Anthropic ecosystem refers to the programmatic tracking and analysis of API consumption, costs, and cache efficiency across an organization. At its core, this capability is delivered through the Usage and Cost API, part of Anthropic's Admin API suite, which provides granular visibility into token consumption, spending patterns, and caching performance [1].

For enterprise organizations, usage monitoring serves three critical functions: enabling accurate per-workspace chargebacks for internal cost allocation, tracking prompt caching efficiency to optimize spend, and setting up budget alerts to prevent cost overruns [1][2]. The API reports usage data within approximately 5 minutes of request completion, making it suitable for near-real-time dashboards and alerting systems [1].

The monitoring capabilities integrate with the broader Claude ecosystem, connecting workspace-level isolation with detailed attribution metrics. Organizations can break down usage by model, API key, workspace, service tier, context window size, data residency region, and speed mode (standard vs. fast) [1]. This multi-dimensional visibility is essential for enterprises running Claude across multiple teams, products, or geographic regions.

## Key Concepts

- **Admin API Key** — A special API key (prefix `sk-ant-admin...`) required for Usage and Cost API access. Only organization members with admin role can provision these keys through the Claude Console [1]. Regular API keys cannot access usage reporting endpoints.

- **Usage Endpoint** — The `/v1/organizations/usage_report/messages` endpoint tracks token consumption with breakdowns by uncached input tokens, cached input tokens, cache creation tokens, and output tokens [1]. Supports filtering and grouping by multiple dimensions.

- **Cost Endpoint** — The `/v1/organizations/cost_report` endpoint provides service-level cost breakdowns in USD cents, including token usage, web search, and code execution costs [1]. Only supports daily (`1d`) granularity.

- **Time Buckets** — Usage data can be aggregated in fixed intervals: `1m` (max 1440 buckets for real-time monitoring), `1h` (max 168 buckets for daily patterns), or `1d` (max 31 buckets for weekly/monthly reports) [1].

- **Workspace-Level Attribution** — All usage and costs can be grouped by `workspace_id` for internal chargeback purposes [1][2]. The default workspace reports `null` for workspace_id.

- **Cache Efficiency Metrics** — Three token fields track caching performance: `cache_creation_input_tokens` (cache writes), `cache_read_input_tokens` (cache hits), and `input_tokens` (uncached) [1][4].

- **Spend Limits** — Maximum monthly cost limits configurable at both organization and workspace levels to prevent runaway spending [2][3].

- **Budget Notifications** — Email alerts triggered when workspace spend reaches specified thresholds [2][3].

## Technical Details

### Usage API Request Structure

The Usage API supports extensive filtering and grouping parameters [1]:

```bash
curl "https://api.anthropic.com/v1/organizations/usage_report/messages?\
starting_at=2026-01-01T00:00:00Z&\
ending_at=2026-01-08T00:00:00Z&\
workspace_ids[]=wrkspc_01JwQvzr7rXLA5AGx3HKfFUJ&\
group_by[]=model&\
group_by[]=workspace_id&\
bucket_width=1d" \
  --header "anthropic-version: 2023-06-01" \
  --header "x-api-key: $ADMIN_API_KEY"
```

Grouping dimensions include: `api_key_id`, `workspace_id`, `model`, `service_tier`, `context_window`, `inference_geo`, and `speed` [1].

### Cost API Request Structure

Cost reporting uses daily buckets and returns amounts in USD cents [1]:

```bash
curl "https://api.anthropic.com/v1/organizations/cost_report?\
starting_at=2026-01-01T00:00:00Z&\
ending_at=2026-01-31T00:00:00Z&\
group_by[]=workspace_id&\
group_by[]=description" \
  --header "anthropic-version: 2023-06-01" \
  --header "x-api-key: $ADMIN_API_KEY"
```

### Cache Efficiency Tracking

Cache performance metrics appear in every API response's `usage` object [4]:

```json
{
  "usage": {
    "input_tokens": 50,
    "cache_read_input_tokens": 100000,
    "cache_creation_input_tokens": 0,
    "output_tokens": 503
  }
}
```

The total input calculation formula is: `total_input_tokens = cache_read_input_tokens + cache_creation_input_tokens + input_tokens` [4].

### Cache Pricing Structure

Cache operations have distinct pricing multipliers relative to base input token costs [4]:

| Operation | Multiplier | Claude Opus 4.5/4.6 Example |
|-----------|------------|----------------------------|
| Base Input | 1.0x | $5/MTok |
| 5-minute Cache Write | 1.25x | $6.25/MTok |
| 1-hour Cache Write | 2.0x | $10/MTok |
| Cache Read | 0.1x | $0.50/MTok |

### Workspace Spend Limits Configuration

Spend limits can be set per-workspace through the Console [3]:

1. Navigate to workspace details page
2. Click "Limits" tab
3. Select "Change Limit" to set workspace-specific amount
4. Add notification to configure email alerts at specified thresholds

Workspace limits must be lower than the organization's limit [3].

## Common Patterns

### Per-Workspace Chargeback Implementation

The standard pattern for internal chargebacks involves daily cost attribution queries grouped by workspace [1][2]:

```bash
curl "https://api.anthropic.com/v1/organizations/cost_report?\
starting_at=2026-02-01T00:00:00Z&\
ending_at=2026-02-28T00:00:00Z&\
group_by[]=workspace_id&\
group_by[]=description&\
bucket_width=1d" \
  --header "anthropic-version: 2023-06-01" \
  --header "x-api-key: $ADMIN_API_KEY"
```

This returns costs broken down by workspace and line item (model usage, web search, code execution) for accurate team-level billing [1].

### Third-Party Observability Integration

For advanced alerting and dashboards, organizations commonly integrate with observability platforms [1]:

- **Datadog**: Real-time token consumption monitoring, cost tracking by model/workspace/tier, anomaly alerting [1]
- **Honeycomb**: OpenTelemetry-based metrics collection, advanced querying and visualization [1]
- **Grafana Cloud**: Agentless integration with out-of-box dashboards [1]
- **Vantage/CloudZero**: FinOps-focused cost and usage observability [1]

### Cache Efficiency Monitoring via Console

The Claude Console provides visual cache tracking [2]:

1. Navigate to Usage section
2. Set "Group by" dropdown to "token type"
3. View color-coded breakdown of cached vs. uncached tokens

### Budget Alert Configuration

To set up proactive spend notifications [3]:

1. Open workspace settings
2. Navigate to Limits tab
3. Set spend limit below organization threshold
4. Click "Add notification"
5. Configure email alert threshold (e.g., 80% of limit)

## Gotchas

- **Priority Tier Exclusion** — Priority Tier costs use a different billing model and are NOT included in the Cost API endpoint. You must track Priority Tier usage through the Usage endpoint instead, filtering by `service_tier=priority` [1].

- **Workbench Usage Attribution** — API usage from the Claude Workbench is not associated with an API key, so `api_key_id` will be `null` even when grouping by that dimension [1]. This can complicate attribution if teams use both API and Workbench.

- **Default Workspace Representation** — Usage and costs for the default workspace report `null` for `workspace_id` rather than an actual ID [1]. Handle this edge case in chargeback scripts.

- **No Per-User Breakdown** — The standard Usage and Cost APIs cannot break down usage by individual users [2]. For Claude Code per-user analytics, use the separate Claude Code Analytics API [1].

- **Data Freshness vs. Polling Frequency** — While data appears within ~5 minutes, the API officially supports polling once per minute for sustained use. More frequent polling is acceptable only for short bursts like paginating through results [1].

- **Workspace Cache Isolation (February 2026)** — Starting February 5, 2026, prompt caching uses workspace-level isolation instead of organization-level [4]. Caches will not be shared between workspaces, potentially reducing cache hit rates for multi-workspace deployments.

- **Input Tokens Field Confusion** — The `input_tokens` field in usage responses represents only tokens AFTER the last cache breakpoint, not total input tokens [4]. This frequently trips up cost calculations.

- **Code Execution Tracking** — Code execution usage appears only in the Cost endpoint under the `Code Execution Usage` description field, not in the Usage endpoint [1].

## Sources

[1] **Usage and Cost API - Claude API Docs**
    URL: https://platform.claude.com/docs/en/api/usage-cost-api
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Complete API documentation including endpoints, parameters, grouping dimensions, time buckets, pagination, third-party integrations, and FAQ for usage/cost tracking.

[2] **Cost and Usage Reporting in Claude Console**
    URL: https://support.claude.com/en/articles/9534590-cost-and-usage-reporting-in-console
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Console-based reporting features including filtering options, token visualization, CSV export, and access requirements (Developer/Billing/Admin roles).

[3] **Creating and Managing Workspaces**
    URL: https://support.claude.com/en/articles/9796807-creating-and-managing-workspaces
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Workspace spend limit configuration, rate limit settings, budget notification setup, and the relationship between workspace and organization limits.

[4] **Prompt Caching - Claude API Docs**
    URL: https://platform.claude.com/docs/en/build-with-claude/prompt-caching
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Cache efficiency metrics (cache_creation_input_tokens, cache_read_input_tokens, input_tokens), pricing multipliers for cache operations, workspace-level cache isolation policy, and best practices for cache performance tracking.
