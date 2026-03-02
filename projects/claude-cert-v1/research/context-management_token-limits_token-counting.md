# Token Counting API

**Topic ID:** context-management.token-limits.token-counting
**Researched:** 2026-03-01T00:00:00Z

## Overview

The Token Counting API allows you to determine the exact number of tokens in a message before sending it to Claude, enabling proactive cost management, rate limit planning, and prompt optimization. Unlike rough character-based estimates, this endpoint uses the same tokenization logic as the Messages API, providing accurate counts that match what you will be billed for [1].

The token counting endpoint accepts the same structured inputs as the Messages API, including system prompts, tools, images, PDFs, and extended thinking configurations [1]. This means you can validate your full request payload before committing to an actual inference call. The feature is Zero Data Retention (ZDR) eligible, so organizations with ZDR arrangements can use it without data being stored after the response [1].

Token counting serves three primary use cases: proactively managing rate limits and costs, making intelligent model routing decisions based on input size, and optimizing prompts to fit within specific length constraints [1]. For certification exam purposes, understanding when and how to use this endpoint is essential for building production-ready Claude integrations.

## Key Concepts

- **Endpoint** — The REST endpoint is `POST /v1/messages/count_tokens`. It mirrors the Messages API structure but returns only a token count rather than generating a response [1][2].

- **Free to use** — Token counting incurs no billing charges, though it is subject to requests-per-minute (RPM) rate limits based on your usage tier [1].

- **Separate rate limits** — Token counting and message creation have independent rate limits. Using one does not count against the other [1].

- **Estimate, not exact** — The token count should be considered an estimate. In some cases, the actual number of input tokens used when creating a message may differ by a small amount [1].

- **System-added tokens** — Token counts may include tokens added automatically by Anthropic for system optimizations. You are not billed for these system-added tokens; billing reflects only your content [1].

- **Model parameter required** — You must specify the exact model ID (e.g., `claude-opus-4-6`) because tokenization can vary between models [1][2].

- **All active models supported** — Every active Claude model supports token counting [1].

- **Multi-modal support** — The endpoint supports images (base64 or URL), PDFs, tools, and documents with the same limitations as the Messages API [1].

## Technical Details

### API Request Structure

The token counting endpoint accepts nearly the same parameters as the Messages API. Required parameters are `model` and `messages`. Optional parameters include `system`, `tools`, `tool_choice`, and `thinking` [2].

**Basic cURL example** [1]:

```bash
curl https://api.anthropic.com/v1/messages/count_tokens \
    --header "x-api-key: $ANTHROPIC_API_KEY" \
    --header "content-type: application/json" \
    --header "anthropic-version: 2023-06-01" \
    --data '{
      "model": "claude-opus-4-6",
      "system": "You are a scientist",
      "messages": [{"role": "user", "content": "Hello, Claude"}]
    }'
```

**Response** [1]:

```json
{ "input_tokens": 14 }
```

### SDK Usage

**Python SDK** [1]:

```python
import anthropic

client = anthropic.Anthropic()
response = client.messages.count_tokens(
    model="claude-opus-4-6",
    system="You are a scientist",
    messages=[{"role": "user", "content": "Hello, Claude"}],
)
print(response.json())  # { "input_tokens": 14 }
```

**TypeScript SDK** [1]:

```typescript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();
const response = await client.messages.countTokens({
  model: "claude-opus-4-6",
  system: "You are a scientist",
  messages: [{ role: "user", content: "Hello, Claude" }]
});
console.log(response);
```

### Rate Limits by Tier

Token counting has its own RPM limits separate from message creation [1]:

| Usage Tier | Requests per Minute (RPM) |
|------------|---------------------------|
| 1          | 100                       |
| 2          | 2,000                     |
| 3          | 4,000                     |
| 4          | 8,000                     |

### Counting Tokens with Tools

When including tools, the token count includes all tool definitions in addition to messages [1]:

```python
response = client.messages.count_tokens(
    model="claude-opus-4-6",
    tools=[{
        "name": "get_weather",
        "description": "Get the current weather in a given location",
        "input_schema": {
            "type": "object",
            "properties": {
                "location": {"type": "string", "description": "City and state"}
            },
            "required": ["location"]
        }
    }],
    messages=[{"role": "user", "content": "What's the weather in SF?"}],
)
# Returns approximately 403 tokens
```

### Counting Tokens with Extended Thinking

When using extended thinking, include the `thinking` parameter [1]:

```python
response = client.messages.count_tokens(
    model="claude-sonnet-4-6",
    thinking={"type": "enabled", "budget_tokens": 16000},
    messages=[{"role": "user", "content": "Prove there are infinite primes"}],
)
```

Important: Thinking blocks from previous assistant turns are ignored and do not count toward input tokens. Only the current assistant turn thinking counts toward input tokens [1].

## Common Patterns

**Pre-flight validation**: Before sending expensive requests, count tokens to ensure the request fits within context limits and budget constraints.

```python
def safe_send_message(client, model, messages, max_budget_tokens=50000):
    count = client.messages.count_tokens(model=model, messages=messages)
    if count.input_tokens > max_budget_tokens:
        raise ValueError(f"Request too large: {count.input_tokens} tokens")
    return client.messages.create(model=model, messages=messages, max_tokens=1024)
```

**Model routing**: Use token counts to route requests to appropriate models based on context size.

```python
count = client.messages.count_tokens(model="claude-opus-4-6", messages=messages)
if count.input_tokens < 10000:
    model = "claude-haiku-4-5"  # Use faster model for small requests
else:
    model = "claude-opus-4-6"   # Use powerful model for complex requests
```

**Prompt trimming**: Count tokens iteratively while trimming content to fit within limits.

**Amazon Bedrock integration**: On AWS Bedrock, use the `CountTokens` API with the same pattern [3]:

```python
import boto3
import json

bedrock = boto3.client("bedrock-runtime")
response = bedrock.count_tokens(
    modelId="anthropic.claude-3-5-sonnet-20241022-v2:0",
    input={"invokeModel": {"body": json.dumps({
        "anthropic_version": "bedrock-2023-05-31",
        "messages": [{"role": "user", "content": "Hello"}]
    })}}
)
print(response["inputTokens"])
```

## Gotchas

- **Prompt caching not reflected**: Token counting does not use caching logic. While you can include `cache_control` blocks in your request, prompt caching only occurs during actual message creation. The count reflects uncached token usage [1].

- **Server tool counts differ**: Server tool token counts (like web_search) only apply to the first sampling call, not subsequent calls in a multi-turn conversation [1].

- **Image tokens are substantial**: A single image can consume 1,500+ tokens. Always count before sending image-heavy requests [1].

- **Tool definitions add overhead**: Each tool definition adds significant tokens (often 200-400+ per tool) regardless of whether the tool is used. Count tokens when designing tool-heavy applications [1].

- **Estimates may vary slightly**: The count is an estimate. Actual tokens used during inference may differ by a small amount, so build in a small buffer when approaching limits [1].

- **Quick estimation heuristic**: If you cannot call the API (e.g., offline estimation), divide character count by 6 for a rough approximation. This is imprecise and should not be used for billing-grade accuracy [4].

- **Bedrock regional availability**: On AWS Bedrock, token counting is only available in specific regions per model. Check availability before depending on it [3].

- **Vertex AI free but rate-limited**: On Google Cloud Vertex AI, token counting is free with a default quota of 2,000 RPM [4].

## Sources

[1] **Token counting - Claude API Docs**
    URL: https://platform.claude.com/docs/en/build-with-claude/token-counting
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Complete guide including endpoint details, code examples in Python/TypeScript/Java/Shell, rate limits by tier, support for images/PDFs/tools/extended thinking, pricing (free), and FAQ about prompt caching.

[2] **Count tokens in a Message - Claude API Reference**
    URL: https://platform.claude.com/docs/en/api/messages/count_tokens
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Full API reference including all body parameters (messages, model, system, tools, thinking, tool_choice), response schema (input_tokens), and parameter documentation.

[3] **Monitor your token usage by counting tokens - Amazon Bedrock**
    URL: https://docs.aws.amazon.com/bedrock/latest/userguide/count-tokens.html
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Bedrock-specific CountTokens API usage, supported Claude models and regions, code examples for InvokeModel and Converse requests, IAM permissions required.

[4] **Token Counting Explained: tiktoken, Anthropic, and Gemini (2025 Guide)**
    URL: https://www.propelcode.ai/blog/token-counting-tiktoken-anthropic-gemini-guide-2025
    Accessed: 2026-03-01
    Relevance: background
    Extracted: Quick estimation heuristic (characters/6), comparison with other providers, Vertex AI quota information.
