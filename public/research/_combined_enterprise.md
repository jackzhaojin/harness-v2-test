# Combined Research: Enterprise Patterns


---

# Rate Limits and Usage Tiers

**Topic ID:** enterprise.platform.rate-limits
**Researched:** 2026-03-01T12:00:00Z

## Overview

Rate limits are safeguards that API providers implement to control how much an organization can use their services over a defined period. They exist to prevent abuse, ensure fair access across all users, maintain system stability, and help developers predict costs. When building applications that consume APIs—particularly LLM APIs like OpenAI, Claude, or Azure OpenAI—understanding rate limits is essential for designing resilient systems that don't fail under load.

Rate limits are typically measured across multiple dimensions simultaneously: requests per minute (RPM), tokens per minute (TPM), and sometimes requests per day (RPD) or images per minute (IPM). Hitting any single limit triggers throttling, so applications must track and respect all applicable constraints. Most providers organize users into usage tiers, where higher tiers unlock greater limits as you demonstrate consistent usage and spend.

The underlying mechanism for many rate limiting systems is the **token bucket algorithm**, which allows for controlled bursting while maintaining average rate compliance. Understanding this algorithm helps explain why you might sometimes exceed your stated limit briefly, or why capacity "refills" continuously rather than resetting at fixed intervals.

## Key Concepts

- **RPM (Requests Per Minute)**: The total number of API calls permitted per minute, regardless of request size. A simple "hello world" prompt counts the same as a 10,000-token document.

- **TPM (Tokens Per Minute)**: The total tokens (input + output) your application can process per minute. Tokens are roughly 4 characters or 0.75 words. This limit applies to the sum of prompt tokens and completion tokens.

- **ITPM/OTPM**: Some providers (like Claude) separate input tokens per minute (ITPM) and output tokens per minute (OTPM), giving finer control and allowing optimization strategies like prompt caching.

- **Usage Tiers**: Graduated levels that determine your rate limits. As you spend more with a provider and maintain good standing, you automatically advance to higher tiers with increased limits.

- **Spend Limits**: Maximum monthly expenditure allowed per tier. Prevents runaway costs and requires tier advancement to exceed.

- **Token Bucket Algorithm**: The rate limiting mechanism where tokens accumulate at a fixed rate up to a maximum capacity. Requests consume tokens; if insufficient tokens exist, the request is rejected or queued.

- **429 Error**: The HTTP status code returned when rate limits are exceeded. Accompanied by a `retry-after` header indicating when to retry.

- **Exponential Backoff**: A retry strategy where wait time increases exponentially (1s, 2s, 4s, 8s...) after each failed attempt, often with random jitter to prevent thundering herd problems.

## Technical Details

### Token Bucket Algorithm

The token bucket algorithm works as follows:

```
1. Initialize bucket with max_capacity tokens
2. Tokens are added at refill_rate (e.g., 1000 tokens/second)
3. On request arrival:
   - If tokens >= request_cost: allow request, deduct tokens
   - Else: reject request (429 error)
4. Bucket cannot exceed max_capacity
```

Key parameters:
- **Bucket capacity**: Maximum burst size allowed
- **Refill rate**: How quickly capacity regenerates
- **Token cost**: Tokens consumed per request

This differs from fixed-window counters, which reset at intervals and are vulnerable to boundary attacks (double traffic at window edges).

### Usage Tier Structure (Claude API Example)

| Tier | Credit Purchase Required | Max Credit Purchase |
|------|-------------------------|---------------------|
| Tier 1 | $5 | $100 |
| Tier 2 | $40 | $500 |
| Tier 3 | $200 | $1,000 |
| Tier 4 | $400 | $5,000 |

Rate limits scale significantly across tiers. For Claude Sonnet 4.x:
- Tier 1: 50 RPM, 30K ITPM, 8K OTPM
- Tier 4: 4,000 RPM, 2M ITPM, 400K OTPM

### Response Headers

APIs return headers to help track limits:

```
retry-after: 2
anthropic-ratelimit-requests-limit: 1000
anthropic-ratelimit-requests-remaining: 500
anthropic-ratelimit-tokens-remaining: 450000
anthropic-ratelimit-tokens-reset: 2026-03-01T12:01:00Z
```

### Handling 429 Errors with Exponential Backoff

```python
from tenacity import retry, wait_random_exponential, stop_after_attempt

@retry(wait=wait_random_exponential(min=1, max=60), stop=stop_after_attempt(6))
def call_api_with_backoff(**kwargs):
    return client.messages.create(**kwargs)
```

Or manually:

```python
import time
import random

def call_with_retry(func, max_retries=6):
    for attempt in range(max_retries):
        try:
            return func()
        except RateLimitError:
            wait = (2 ** attempt) + random.uniform(0, 1)
            time.sleep(min(wait, 60))
    raise Exception("Max retries exceeded")
```

## Common Patterns

### Proactive Rate Management

Instead of reacting to 429 errors, calculate delays proactively:

```python
# For 60 RPM limit, space requests ~1 second apart
import time

RATE_LIMIT_RPM = 60
DELAY = 60 / RATE_LIMIT_RPM  # 1 second

for request in requests:
    response = make_api_call(request)
    time.sleep(DELAY)
```

### Cache-Aware Token Optimization (Claude)

Claude's ITPM only counts uncached input tokens. With 80% cache hit rate on a 2M ITPM limit:

```
Effective throughput = 2M uncached + 8M cached = 10M total input tokens/minute
```

Use prompt caching for:
- System instructions
- Large context documents
- Tool definitions
- Repeated conversation prefixes

### Batch Processing for High-Volume Workloads

For non-time-sensitive bulk processing, use batch APIs:
- Requests queue in processing pool
- Higher throughput limits than synchronous API
- Cost savings (often 50% discount)
- Separate rate limit pool

### Multi-Model Fallback

```python
MODELS = ["claude-sonnet-4", "claude-haiku-4.5", "gpt-4o-mini"]

def call_with_fallback(prompt):
    for model in MODELS:
        try:
            return call_api(model, prompt)
        except RateLimitError:
            continue
    raise Exception("All models rate limited")
```

## Gotchas

- **max_tokens counts against TPM (OpenAI)**: The `max_tokens` parameter you set counts toward your TPM limit at request time, even if the model generates fewer tokens. Claude's OTPM only counts actual output tokens.

- **Shared limits across model families**: Some providers share rate limits across model versions. Claude's Opus 4.x limit applies to combined traffic across Opus 4.6, 4.5, 4.1, and 4.

- **Short bursts can trigger limits**: A rate of 60 RPM may be enforced as 1 request per second. Sending 10 requests in 1 second can trigger limits even if you're under 60/minute average.

- **Acceleration limits**: Sharp usage increases can trigger throttling even within rate limits. Ramp up traffic gradually.

- **Azure OpenAI ratio**: Azure enforces RPM proportional to TPM at 6 RPM per 1000 TPM. A 10K TPM quota means only 60 RPM.

- **Cached tokens still cost money**: While Claude's cached tokens don't count toward ITPM rate limits, they're still billed (at 10% of base price). Don't confuse rate limits with pricing.

- **Older model differences**: Some deprecated models (marked with †) count `cache_read_input_tokens` toward ITPM. Check documentation for your specific model version.

- **Workspace limits stack**: Organization-wide limits always apply even if workspace sub-limits add up to more than the org limit.

## Sources

- [Claude API Rate Limits Documentation](https://platform.claude.com/docs/en/api/rate-limits) — Comprehensive guide to Claude's ITPM/OTPM system, usage tiers, cache-aware rate limiting, and response headers
- [Rate Limiting Algorithms Explained with Code](https://blog.algomaster.io/p/rate-limiting-algorithms-explained-with-code) — Technical comparison of token bucket, leaky bucket, fixed window, and sliding window algorithms with implementation details
- [OpenAI Cookbook: How to Handle Rate Limits](https://developers.openai.com/cookbook/examples/how_to_handle_rate_limits) — Practical Python examples for exponential backoff, tenacity/backoff libraries, and throughput optimization
- [Token Bucket - Wikipedia](https://en.wikipedia.org/wiki/Token_bucket) — Foundational explanation of the token bucket algorithm in telecommunications and networking
- [How to Deal with API Rate Limits - Sentry](https://blog.sentry.io/how-to-deal-with-api-rate-limits/) — Best practices for proactive rate management, caching, and monitoring strategies


---

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


---

# Third-Party Platform APIs

**Topic ID:** enterprise.cloud.integrations
**Researched:** 2026-03-01T12:00:00Z

## Overview

Anthropic's Claude models can be deployed through three major cloud platforms: AWS Bedrock, Google Vertex AI, and Microsoft Foundry (Azure). Each platform provides managed API access to Claude, meaning you don't need to provision or manage infrastructure—the models run as serverless APIs. This approach lets enterprises integrate Claude while using their existing cloud billing, security configurations, and compliance frameworks.

The choice of platform typically depends on your organization's existing cloud footprint. AWS Bedrock integrates with AWS IAM and billing, Vertex AI uses Google Cloud credentials and projects, and Microsoft Foundry leverages Azure subscriptions and Entra ID. All three platforms support the latest Claude models (Opus 4.6, Sonnet 4.6, Haiku 4.5) with near feature parity, though new capabilities may appear first on Anthropic's direct API before rolling out to cloud platforms.

A key architectural decision across all platforms is choosing between global and regional endpoints. Starting with Claude Sonnet 4.5 and newer models, all three platforms offer global endpoints (dynamic routing for maximum availability) and regional endpoints (guaranteed data routing through specific geographies). Regional endpoints carry a 10% pricing premium but are essential for data residency compliance.

## Key Concepts

- **Global vs Regional Endpoints**: Global endpoints route requests dynamically across regions for maximum availability with no pricing premium. Regional endpoints guarantee data stays within specific geographies (US, EU, etc.) with a 10% premium. Required for compliance-sensitive workloads.

- **Inference Profiles (Bedrock)**: Wrappers around models that enable cross-region routing, load balancing, and throughput management. Geographic profiles (EU, US, APAC) keep data within regulatory boundaries.

- **Model IDs vs Deployment Names**: Bedrock uses model IDs with optional `global.` or regional prefixes. Vertex AI uses model IDs with `@version` suffixes. Foundry uses deployment names that default to model IDs but can be customized.

- **SDK Support**: Python, TypeScript, Java, Go, and C# SDKs support all three platforms. Ruby supports Bedrock and Vertex. PHP currently only supports Bedrock. Each platform has a separate SDK package (e.g., `anthropic[bedrock]`, `@anthropic-ai/vertex-sdk`, `@anthropic-ai/foundry-sdk`).

- **Prompt Caching**: Available on all platforms with cache reads costing 0.1x base input token price. Cache TTL defaults to 5 minutes but can extend to 1 hour. Reduces costs up to 90% and latency up to 85% for repeated prompts.

- **1M Token Context Window**: Claude Opus 4.6, Sonnet 4.5, and Sonnet 4 support 1M tokens on Bedrock and Vertex AI. Requires the `context-1m-2025-08-07` beta header on Bedrock.

- **Activity Logging**: All platforms provide native logging services (CloudWatch for Bedrock, request-response logging for Vertex, Azure Monitor for Foundry) that don't expose content to cloud providers or Anthropic.

## Technical Details

### AWS Bedrock Configuration

```python
from anthropic import AnthropicBedrock

client = AnthropicBedrock(
    aws_access_key="<access_key>",
    aws_secret_key="<secret_key>",
    aws_region="us-west-2",
)

message = client.messages.create(
    model="global.anthropic.claude-opus-4-6-v1",  # Global endpoint
    max_tokens=256,
    messages=[{"role": "user", "content": "Hello"}],
)
```

**Required IAM permissions:**
- `bedrock:InvokeModel`
- `bedrock:ListFoundationModels`
- `bedrock:ListInferenceProfiles`
- `aws-marketplace:Subscribe`
- `aws-marketplace:ViewSubscriptions`

**Model ID format:**
- Global: `global.anthropic.claude-opus-4-6-v1`
- Regional (US): `us.anthropic.claude-opus-4-6-v1`
- Regional (EU): `eu.anthropic.claude-opus-4-6-v1`

### Google Vertex AI Configuration

```python
from anthropic import AnthropicVertex

client = AnthropicVertex(
    project_id="MY_PROJECT_ID",
    region="global",  # Or specific region like "us-east1"
)

message = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=100,
    messages=[{"role": "user", "content": "Hello"}],
)
```

**Setup requirements:**
1. Enable Vertex AI API: `gcloud services enable aiplatform.googleapis.com`
2. Authenticate: `gcloud auth application-default login`

**Key difference:** Vertex API requires `anthropic_version: "vertex-2023-10-16"` in the request body (SDKs handle this automatically).

### Microsoft Foundry Configuration

```python
from anthropic import AnthropicFoundry

client = AnthropicFoundry(
    api_key="YOUR_AZURE_API_KEY",
    resource="example-resource",  # Or use base_url
)

message = client.messages.create(
    model="claude-opus-4-6",  # Deployment name
    max_tokens=1024,
    messages=[{"role": "user", "content": "Hello"}],
)
```

**Environment variables:**
- `ANTHROPIC_FOUNDRY_API_KEY`
- `ANTHROPIC_FOUNDRY_RESOURCE` or `ANTHROPIC_FOUNDRY_BASE_URL`

**Regional availability:** Currently East US 2 and Sweden Central only.

### Authentication Methods Comparison

| Platform | Primary Auth | Alternative |
|----------|-------------|-------------|
| Bedrock | AWS credential chain | Bearer tokens (C#, Go, Java only) |
| Vertex AI | `gcloud auth` / service accounts | Application Default Credentials |
| Foundry | Azure API key | Entra ID (Azure AD) tokens |

## Common Patterns

### Enterprise Deployment on Bedrock

```bash
# Environment setup for Claude Code
export CLAUDE_CODE_USE_BEDROCK=1
export AWS_REGION=us-east-1
# Pin model versions to avoid unexpected updates
export ANTHROPIC_DEFAULT_SONNET_MODEL=anthropic.claude-sonnet-4-6
```

Create monthly budgets scoped to Bedrock with alerts at 50%, 80%, and 100% thresholds. Use AWS Guardrails for content filtering by creating a Guardrail in the Bedrock console and enabling Cross-Region inference if using cross-region profiles.

### Multi-Region Failover

Use global endpoints as the primary path and regional endpoints as fallback:

```python
# Primary: global endpoint
try:
    response = client.messages.create(
        model="global.anthropic.claude-opus-4-6-v1",
        ...
    )
except Exception:
    # Fallback: regional endpoint
    response = client.messages.create(
        model="us.anthropic.claude-opus-4-6-v1",
        ...
    )
```

### Vertex AI with Private Service Connect

For enterprise workloads requiring private networking, use Private Service Connect endpoints to keep traffic within Google's network without traversing the public internet.

### Cost Optimization with Prompt Caching

```python
# Cache long system prompts
message = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=1024,
    system=[{
        "type": "text",
        "text": "Your long system prompt...",
        "cache_control": {"type": "ephemeral", "ttl": "1h"}
    }],
    messages=[...]
)
```

## Gotchas

- **Model availability varies by region**: Not all Claude models are available in all regions. Check AWS, GCP, or Azure documentation for current regional availability. APAC regions often have limited model selection.

- **SDK platform support gaps**: PHP only supports Bedrock. Go, PHP, and Ruby don't support Foundry. Always verify SDK support before committing to a platform.

- **Model version pinning is critical**: Using aliases like "sonnet" without pinning can cause requests to fail if newer model versions aren't enabled in your account. Always specify explicit model IDs in production.

- **1-hour cache TTL limitations**: On Vertex AI, the 1-hour TTL isn't supported for Claude 3.7 Sonnet, Claude 3.5 Sonnet v2, Claude 3.5 Sonnet, and Claude 3 Opus. Stick to 5-minute default for these models.

- **Foundry deploys models, not just uses them**: Unlike Bedrock and Vertex where you access shared model endpoints, Foundry requires you to create a deployment first. The deployment name (not model ID) goes in your API requests.

- **Bedrock PDF analysis quirk**: Using the Converse API for PDF analysis requires citations to be enabled for visual analysis (charts, images, layouts). Use InvokeModel API for full control without forced citations.

- **Rate limit headers differ**: Foundry doesn't include Anthropic's standard rate limit headers. Use Azure Monitor instead of response headers for rate limit tracking.

- **Feature rollout timing**: New Claude features (tools, caching updates, batch processing) appear first on Anthropic's direct API. Cloud platforms typically lag by weeks to months. Plan accordingly if you need bleeding-edge capabilities.

- **Regional endpoint pricing**: The 10% premium on regional endpoints only applies to Claude Sonnet 4.5 and newer models. Older models maintain their original pricing structure.

## Sources

- [Claude on Amazon Bedrock - Anthropic Docs](https://platform.claude.com/docs/en/build-with-claude/claude-on-amazon-bedrock) — Complete Bedrock integration guide with SDK examples, model IDs, and global/regional endpoint configuration
- [Claude on Vertex AI - Anthropic Docs](https://platform.claude.com/docs/en/build-with-claude/claude-on-vertex-ai) — Vertex AI setup, authentication, and API configuration details
- [Claude in Microsoft Foundry - Anthropic Docs](https://platform.claude.com/docs/en/build-with-claude/claude-in-microsoft-foundry) — Foundry deployment, authentication options, and SDK usage
- [Claude Code on Amazon Bedrock - Claude Code Docs](https://code.claude.com/docs/en/amazon-bedrock) — Environment variables, IAM permissions, and enterprise deployment patterns
- [Anthropic Claude Models on Vertex AI - Google Cloud](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/partner-models/claude) — Model availability, regions, and GCP-specific configuration
- [Prompt Caching on Vertex AI - Google Cloud](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/partner-models/claude/prompt-caching) — Cache TTL options and model-specific limitations
- [Configure Claude Code for Microsoft Foundry - Microsoft Learn](https://learn.microsoft.com/en-us/azure/foundry/foundry-models/how-to/configure-claude-code) — Azure-specific setup and authentication

