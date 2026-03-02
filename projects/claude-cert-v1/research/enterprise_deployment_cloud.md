# Cloud Integration

**Topic ID:** enterprise.deployment.cloud
**Researched:** 2026-03-01T00:00:00Z

## Overview

Cloud integration refers to accessing Anthropic's Claude models through major cloud providers rather than the direct Anthropic API. The two primary integration paths are Amazon Web Services (AWS) Bedrock and Google Cloud Vertex AI. Both platforms offer Claude as a managed foundation model service, enabling enterprises to leverage Claude within their existing cloud infrastructure while maintaining centralized billing, IAM controls, and data residency compliance [1][2].

Choosing between cloud integration and the direct API involves trade-offs. Cloud platforms excel at enterprise compliance, ecosystem integration, and unified governance, but they introduce a feature velocity gap (new Claude capabilities arrive on the direct API first) and typically carry pricing premiums [3]. For certification exam purposes, understanding when to recommend each approach based on compliance requirements, existing infrastructure, and feature needs is essential.

Both AWS Bedrock and Google Cloud Vertex AI now support Claude's latest models including Opus 4.6, Sonnet 4.6, and Haiku 4.5, with global and regional endpoint options for balancing availability against data residency requirements [1][2].

## Key Concepts

- **Amazon Bedrock** - AWS's fully managed service providing access to over 100 foundation models from multiple AI providers, including Anthropic's Claude family. Uses standard AWS authentication (IAM, SigV4 signing) and integrates natively with Lambda, S3, CloudWatch, and other AWS services [1].

- **Google Cloud Vertex AI** - Google's unified ML platform offering Claude models through the Model Garden. Uses Google Cloud authentication (gcloud CLI, service accounts) and integrates with GCP services like Cloud Run and BigQuery [2].

- **Global Endpoints** - Dynamic routing endpoints that distribute requests across multiple regions for maximum availability and lowest latency. Available on both Bedrock (prefix: `global.`) and Vertex AI (region: `global`). No pricing premium on either platform [1][2].

- **Regional Endpoints** - Endpoints that guarantee data routing through specific geographic regions for compliance requirements. Carry a 10% pricing premium over global endpoints on both platforms [1][2].

- **Cross-Region Inference (CRIS)** - Bedrock's feature enabling intelligent routing across AWS regions using geographic prefixes like `us.`, `eu.`, `apac.`, or `global.` for the model ID [4].

- **First-Time Use (FTU) Form** - A one-time requirement for accessing Anthropic models on AWS Bedrock. Without completing this form, API calls may succeed initially but fail with 403 errors after approximately 15 minutes [1].

- **Inference Profiles** - Model ID patterns in Bedrock that determine routing behavior. Format: `{prefix}.anthropic.{model-name}` where prefix is `global`, `us`, `eu`, `jp`, or `apac` [4].

- **anthropic_version** - A required parameter when calling Claude on Vertex AI, set to `vertex-2023-10-16` and passed in the request body rather than as a header [2].

## Technical Details

### API Differences from Direct Anthropic API

**AWS Bedrock:**
- Uses AWS SDK authentication (IAM credentials, SigV4 signing) instead of API keys [1]
- Model specified via `modelId` parameter or inference profile ID, not in request body [1]
- Requires `anthropic_version: "bedrock-2023-05-31"` in request body [1]
- Supports bearer token authentication as an alternative to IAM credentials (Go, Java, C# SDKs only) [1]

**Google Cloud Vertex AI:**
- Model specified in the endpoint URL path, not in request body [2]
- Requires `anthropic_version: "vertex-2023-10-16"` in request body [2]
- Uses Google Cloud authentication via `gcloud auth application-default login` [2]
- PHP SDK does not support Vertex AI [2]

### Model IDs by Platform

**Bedrock Model IDs** [1]:
```
# Global endpoints (recommended)
global.anthropic.claude-opus-4-6-v1
global.anthropic.claude-sonnet-4-6
global.anthropic.claude-sonnet-4-5-20250929-v1:0
global.anthropic.claude-opus-4-5-20251101-v1:0
global.anthropic.claude-haiku-4-5-20251001-v1:0

# Regional endpoints (US example)
us.anthropic.claude-sonnet-4-5-20250929-v1:0
```

**Vertex AI Model IDs** [2]:
```
claude-opus-4-6
claude-sonnet-4-6
claude-sonnet-4-5@20250929
claude-opus-4-5@20251101
claude-haiku-4-5@20251001
```

### Authentication Setup

**Bedrock Python Example** [1]:
```python
from anthropic import AnthropicBedrock

client = AnthropicBedrock(
    aws_access_key="<access key>",
    aws_secret_key="<secret key>",
    aws_session_token="<session_token>",  # For temporary credentials
    aws_region="us-west-2",
)

message = client.messages.create(
    model="global.anthropic.claude-opus-4-6-v1",
    max_tokens=256,
    messages=[{"role": "user", "content": "Hello"}],
)
```

**Vertex AI Python Example** [2]:
```python
from anthropic import AnthropicVertex

client = AnthropicVertex(
    project_id="MY_PROJECT_ID",
    region="global"  # or specific region like "us-east1"
)

message = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=100,
    messages=[{"role": "user", "content": "Hello"}],
)
```

### IAM Permissions

**Bedrock Required Permissions** [1]:
- `bedrock:InvokeModel`
- `bedrock:ListFoundationModels`
- `bedrock:ListInferenceProfiles`
- `aws-marketplace:Subscribe` (for initial model access)

**Vertex AI Required Role** [2]:
- `roles/aiplatform.user` (includes `aiplatform.endpoints.predict`)

## Common Patterns

### Choosing Between Platforms

The decision tree for cloud integration follows this pattern [3]:

1. **Existing AWS infrastructure** - Use Bedrock for native integration with Lambda, S3, CloudWatch
2. **Existing GCP infrastructure** - Use Vertex AI for integration with Cloud Run, BigQuery
3. **Strict data residency requirements** - Use regional endpoints on either platform (10% premium)
4. **Maximum availability priority** - Use global endpoints (no premium, dynamic routing)
5. **Need latest features immediately** - Use direct Anthropic API (features arrive first)
6. **Multi-model flexibility** - Both platforms offer 100+ models from multiple providers [3]

### Environment Variable Configuration

**For Bedrock** (e.g., Claude Code) [1]:
```bash
export CLAUDE_CODE_USE_BEDROCK=1
export AWS_REGION=us-east-1
export ANTHROPIC_MODEL='global.anthropic.claude-sonnet-4-6'
```

**For Vertex AI** [2]:
```bash
export CLAUDE_CODE_USE_VERTEX=1
export CLOUD_ML_REGION=global
export ANTHROPIC_VERTEX_PROJECT_ID=your-project-id
```

### Multi-Provider Resilience

Organizations requiring high availability can route traffic across both Bedrock and Vertex AI using API gateways, achieving no single point of failure, rate-limit resilience across providers, and regional compliance flexibility [3].

## Gotchas

- **Feature velocity gap**: New Claude capabilities (like extended thinking, computer use beta features) appear on the direct Anthropic API weeks to months before cloud platform availability [3]. Exam scenarios asking about "latest features" may have different answers depending on platform.

- **Model ID confusion**: Bedrock uses versioned IDs with prefixes (`global.anthropic.claude-sonnet-4-5-20250929-v1:0`) while Vertex AI uses shorter IDs with `@` notation (`claude-sonnet-4-5@20250929`). These are NOT interchangeable [1][2].

- **anthropic_version differences**: Bedrock uses `bedrock-2023-05-31`, Vertex AI uses `vertex-2023-10-16`. Using the wrong version string will cause errors [1][2].

- **Regional vs Global pricing**: Both platforms charge 10% more for regional endpoints. The global endpoints provide the same model quality with better availability and no premium [1][2].

- **FTU form timing trap**: On Bedrock, API calls may initially succeed even without completing the First-Time Use form, then fail with 403 errors after approximately 15 minutes. This can cause confusing intermittent failures [1].

- **Bedrock model access auto-enablement**: As of October 2025, AWS Bedrock automatically enables all serverless foundation models. However, Anthropic models still require the one-time FTU form submission [1].

- **PHP SDK limitation**: Neither Bedrock nor Vertex AI is supported by the PHP SDK. Only Python, TypeScript, Java, Go, Ruby (Bedrock adds C#) have official cloud provider support [1][2].

- **1M context window beta**: The extended 1M token context window requires the `context-1m-2025-08-07` beta header on both platforms. Without it, you get the standard 200K limit [1][2].

- **Performance differences**: The direct Anthropic API has the highest throughput and lowest latency. Vertex AI shows measurably higher latency compared to both Bedrock and the direct API [3].

- **Model retirement dates**: Cloud platforms retire models on fixed schedules. For example, Claude Sonnet 3.7 was retired February 19, 2026. Applications must be updated before retirement dates or they will break [1][2].

## Sources

[1] **Claude on Amazon Bedrock - Anthropic Documentation**
    URL: https://platform.claude.com/docs/en/build-with-claude/claude-on-amazon-bedrock
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Bedrock model IDs, API differences from native API, authentication patterns, code examples, global vs regional endpoints, bearer token authentication, PDF support, 1M context window beta, IAM permissions, FTU form requirements.

[2] **Claude on Vertex AI - Anthropic Documentation**
    URL: https://platform.claude.com/docs/en/build-with-claude/claude-on-vertex-ai
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Vertex AI model IDs, API differences (anthropic_version in body, model in URL), authentication setup, global vs regional endpoints with 10% premium, SDK support matrix, code examples in Python/TypeScript/Java/Go/Ruby.

[3] **Claude on Vertex AI vs Native Anthropic - Hidden Differences**
    URL: https://amitkoth.com/claude-vertex-ai-vs-native-api/
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Feature velocity comparison (native API gets features first), pricing differences, performance benchmarks, decision criteria for choosing between platforms, multi-provider resilience patterns.

[4] **AWS Bedrock Cross-Region Inference Documentation**
    URL: https://docs.aws.amazon.com/bedrock/latest/userguide/global-cross-region-inference.html
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Cross-region inference profile types (global vs geographic), model ID prefix patterns, routing behavior, regional availability for different Claude models.
