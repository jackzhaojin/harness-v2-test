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
