# Token Counting API

**Topic ID:** context-management.optimization.token-counting
**Researched:** 2025-03-01T12:00:00Z

## Overview

The Token Counting API allows developers to determine the exact number of tokens in a message before sending it to Claude, enabling proactive cost management and informed decisions about prompts and model selection. Unlike estimation approaches that approximate token counts using third-party tokenizers, Anthropic's endpoint uses the same tokenization logic as the actual inference pipeline, providing billing-accurate counts.

Token counting is essential for applications that need to optimize context window usage, implement dynamic model routing based on message size, or provide users with real-time cost estimates. The API accepts the same input structure as the Messages API—including system prompts, tools, images, PDFs, and multi-turn conversations—making it straightforward to integrate into existing workflows.

The endpoint is available directly through Anthropic's API at `POST /v1/messages/count_tokens`, on Google Cloud Vertex AI via the `count-tokens:rawPredict` endpoint, and on Amazon Bedrock through the `CountTokens` operation. All three platforms offer the functionality at no cost, though each has its own rate limits and regional availability.

## Key Concepts

- **Input token count**: The response returns a single `input_tokens` field representing the total tokens across messages, system prompt, and tool definitions. This count reflects what would be charged during actual inference.

- **Billing accuracy**: The token count should be considered an estimate; in rare cases, the actual input tokens used during message creation may differ by a small amount. However, you are not billed for system-added tokens that Anthropic may inject for optimizations.

- **Supported content types**: The endpoint accepts all content types supported by the Messages API: text, images (base64 and URL), PDFs, tool definitions, tool results, and extended thinking blocks.

- **Zero Data Retention (ZDR) eligibility**: Token counting is ZDR-eligible, meaning data sent through this endpoint is not stored after the API response is returned when your organization has a ZDR arrangement.

- **Independent rate limits**: Token counting and message creation have separate rate limits—usage of one does not count against the other, allowing you to count tokens freely without impacting your inference capacity.

- **Model-specific tokenization**: Each model has its own tokenizer, so token counts are model-specific. Always specify the intended model when counting tokens to get accurate results.

- **Server tool considerations**: When counting tokens for requests that include server tools (like web search), the token count only applies to the first sampling call, as subsequent tool results add additional tokens.

## Technical Details

### API Endpoint

```
POST https://api.anthropic.com/v1/messages/count_tokens
```

### Required Headers

```
x-api-key: $ANTHROPIC_API_KEY
content-type: application/json
anthropic-version: 2023-06-01
```

### Request Body

The request body mirrors the Messages API structure:

```json
{
  "model": "claude-sonnet-4-5",
  "system": "You are a helpful assistant",
  "messages": [
    {"role": "user", "content": "Hello, Claude"}
  ],
  "tools": []
}
```

### Response Format

```json
{
  "input_tokens": 14
}
```

### Python SDK Usage

```python
import anthropic

client = anthropic.Anthropic()

response = client.messages.count_tokens(
    model="claude-sonnet-4-5",
    system="You are a scientist",
    messages=[{"role": "user", "content": "Hello, Claude"}],
)

print(response.input_tokens)  # Output: 14
```

### Counting Tokens with Tools

```python
response = client.messages.count_tokens(
    model="claude-sonnet-4-5",
    tools=[
        {
            "name": "get_weather",
            "description": "Get the current weather in a given location",
            "input_schema": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "The city and state, e.g. San Francisco, CA"
                    }
                },
                "required": ["location"]
            }
        }
    ],
    messages=[{"role": "user", "content": "What's the weather in SF?"}],
)
# Tool definitions add significant tokens—this returns ~403 tokens
```

### Rate Limits by Usage Tier

| Usage Tier | Requests per Minute (RPM) |
|------------|---------------------------|
| 1          | 100                       |
| 2          | 2,000                     |
| 3          | 4,000                     |
| 4          | 8,000                     |

## Common Patterns

### Pre-flight Cost Estimation

Count tokens before sending expensive requests to estimate costs and warn users:

```python
def estimate_cost(messages, model="claude-sonnet-4-5"):
    count = client.messages.count_tokens(model=model, messages=messages)

    # Pricing varies by model; example for Sonnet
    input_price_per_million = 3.00
    estimated_cost = (count.input_tokens / 1_000_000) * input_price_per_million

    return count.input_tokens, estimated_cost
```

### Smart Model Routing

Route to different models based on message complexity:

```python
def select_model(messages):
    count = client.messages.count_tokens(
        model="claude-sonnet-4-5",  # Use any model for counting
        messages=messages
    )

    if count.input_tokens < 1000:
        return "claude-3-5-haiku-latest"  # Fast, cheap for simple queries
    elif count.input_tokens < 50000:
        return "claude-sonnet-4-5"  # Balanced option
    else:
        return "claude-opus-4-5"  # Maximum capability for complex tasks
```

### Context Window Management

Ensure messages fit within context limits before sending:

```python
MAX_CONTEXT = 200000  # Claude's context window

def validate_and_trim(messages, system=""):
    count = client.messages.count_tokens(
        model="claude-sonnet-4-5",
        system=system,
        messages=messages
    )

    while count.input_tokens > MAX_CONTEXT * 0.8:  # Leave room for response
        messages = messages[1:]  # Remove oldest message
        count = client.messages.count_tokens(
            model="claude-sonnet-4-5",
            system=system,
            messages=messages
        )

    return messages
```

### Amazon Bedrock Integration

```python
import boto3
import json

bedrock = boto3.client("bedrock-runtime")

response = bedrock.count_tokens(
    modelId="anthropic.claude-sonnet-4-20250514-v1:0",
    input={
        "converse": {
            "messages": [
                {"role": "user", "content": [{"text": "Hello"}]}
            ],
            "system": [{"text": "You are helpful."}]
        }
    }
)

print(response["inputTokens"])
```

## Gotchas

- **Token count is an estimate**: While highly accurate, the actual tokens billed during inference may differ slightly. For billing-critical applications, treat the count as an approximation rather than an exact figure.

- **System-added tokens are not billed**: Anthropic may add tokens for internal optimizations. These appear in the count but you won't be charged for them.

- **Prompt caching is not simulated**: Even if you include `cache_control` blocks in your token counting request, prompt caching only occurs during actual message creation. The count reflects uncached token usage.

- **Extended thinking token handling**: When using extended thinking, thinking blocks from previous assistant turns are ignored and do not count toward input tokens. Only the current turn's thinking counts.

- **Tool definitions are expensive**: A single tool definition can add 300-500+ tokens. If you're registering many tools, this overhead compounds quickly.

- **Image tokens are non-trivial**: A typical image adds 1,000-2,000 tokens depending on resolution. Always count tokens when working with multimodal inputs.

- **Local approximation limitations**: If you must estimate offline, OpenAI's `tiktoken` with `p50k_base` encoding provides a rough approximation, but it's unreliable for billing purposes. Always use the official API for accurate counts.

- **Regional availability on cloud providers**: On Vertex AI, token counting is only available in specific regions (us-east5, europe-west1, asia-east1, asia-southeast1, us-central1, europe-west4). On Bedrock, regional support varies by model version.

## Sources

- [Token counting - Claude API Docs](https://platform.claude.com/docs/en/build-with-claude/token-counting) — Primary documentation covering use cases, code examples across Python/TypeScript/Java/Shell, and rate limit details.

- [Count tokens in a Message - API Reference](https://platform.claude.com/docs/en/api/messages-count-tokens) — Complete API specification including all request parameters, content block types, and response format.

- [Count tokens for Claude models - Google Cloud](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/partner-models/claude/count-tokens) — Vertex AI integration documentation covering supported models, regions, and the 2,000 RPM default quota.

- [Monitor your token usage by counting tokens - Amazon Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/count-tokens.html) — AWS documentation with Boto3 examples for both InvokeModel and Converse request formats, plus IAM permission requirements.
