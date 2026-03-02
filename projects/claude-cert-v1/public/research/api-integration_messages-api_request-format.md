# Request Format

**Topic ID:** api-integration.messages-api.request-format
**Researched:** 2026-03-01T12:00:00Z

## Overview

The Claude Messages API (`POST /v1/messages`) is Anthropic's primary endpoint for conversational interactions with Claude models. Unlike chat completion APIs that maintain server-side state, the Messages API is stateless: you send the full conversation history with each request, and Claude generates the next assistant turn [1]. This design gives developers complete control over conversation context and enables patterns like synthetic assistant messages and response prefilling.

Every request requires three parameters: `model` (which Claude variant to use), `max_tokens` (the ceiling on response length), and `messages` (the conversation history as an array of alternating user/assistant turns) [1][2]. The request body supports numerous optional parameters for controlling output behavior, including system prompts, temperature sampling, tool definitions, and extended thinking configuration. Understanding how these parameters interact is essential for building production applications.

The API uses content blocks rather than simple strings for rich message content. A message's `content` field can be a plain string (shorthand for a single text block) or an array of typed blocks including text, images, tool use requests, and tool results [3]. This structure enables multimodal inputs, function calling, and complex multi-step agent workflows.

## Key Concepts

- **Required Parameters** — Three parameters must appear in every request: `model` (string identifying the Claude model), `max_tokens` (integer ceiling for output tokens), and `messages` (array of conversation turns) [1][2].

- **Stateless Design** — The API maintains no server-side conversation state. Each request must include the complete conversation history; earlier turns are not retained between calls [1].

- **Content Blocks** — Message content uses typed blocks (`text`, `image`, `tool_use`, `tool_result`) rather than plain strings. A string value is shorthand for `[{"type": "text", "text": "..."}]` [3].

- **Role Alternation** — Messages must alternate between `user` and `assistant` roles. The first message must have role `user`. Consecutive same-role messages are automatically combined [1][2].

- **System Prompt** — Provided via the top-level `system` parameter, not as a message with role "system". The Messages API has no "system" role [1][2].

- **Max Output Tokens** — Claude 4.x and 4.5 models support up to 64,000 output tokens. Older models vary: Claude 3.7 Sonnet supports 8,192 by default (128,000 with beta header), Claude 3 Opus/Haiku support 4,096 [4].

- **Context Window** — Standard context window is 200,000 tokens. A 1M token context window is available in beta for usage tier 4 organizations using Claude Opus 4.6, Sonnet 4.6, Sonnet 4.5, or Sonnet 4 [5].

- **Prefilling (Deprecated)** — Ending the messages array with an assistant turn pre-seeds Claude's response. This technique is deprecated and not supported on Claude Opus 4.6, Claude Sonnet 4.6, and Claude Sonnet 4.5 [1].

## Technical Details

### Required Request Structure

```bash
curl https://api.anthropic.com/v1/messages \
  --header "x-api-key: $ANTHROPIC_API_KEY" \
  --header "anthropic-version: 2023-06-01" \
  --header "content-type: application/json" \
  --data '{
    "model": "claude-opus-4-6",
    "max_tokens": 1024,
    "messages": [
      {"role": "user", "content": "Hello, Claude"}
    ]
  }'
```
The above example is from the official documentation [1].

### Required Headers

| Header | Purpose |
|--------|---------|
| `x-api-key` | Your Anthropic API key (workspace-scoped) |
| `anthropic-version` | API version string (e.g., `2023-06-01`) |
| `content-type` | Must be `application/json` |

SDKs handle headers automatically [2].

### Optional Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `system` | string or array | none | System prompt for context/instructions [2] |
| `temperature` | float | 1.0 | Randomness (0.0-1.0). Lower for analytical tasks [2] |
| `top_p` | float | none | Nucleus sampling cutoff. Use temperature OR top_p, not both [2] |
| `top_k` | integer | none | Limit sampling to top K tokens [2] |
| `stop_sequences` | array | none | Custom strings that halt generation [2] |
| `stream` | boolean | false | Enable server-sent events streaming [2] |
| `tools` | array | none | Tool definitions for function calling [3] |
| `tool_choice` | object | auto | Control tool selection behavior [3] |
| `thinking` | object | none | Extended thinking configuration (min 1,024 token budget) [2] |
| `metadata` | object | none | Request metadata (e.g., `user_id`) [2] |

### Message Content Block Types

**Text Block:**
```json
{"type": "text", "text": "What is in this image?"}
```

**Image Block (base64):**
```json
{
  "type": "image",
  "source": {
    "type": "base64",
    "media_type": "image/jpeg",
    "data": "<base64-encoded-data>"
  }
}
```

**Image Block (URL):**
```json
{
  "type": "image",
  "source": {
    "type": "url",
    "url": "https://example.com/image.jpg"
  }
}
```
Supported media types: `image/jpeg`, `image/png`, `image/gif`, `image/webp` [1].

**Tool Use Block (in assistant responses):**
```json
{
  "type": "tool_use",
  "id": "toolu_01D7FLrfh4GYq7yT1ULFeyMV",
  "name": "get_weather",
  "input": {"location": "San Francisco"}
}
```

**Tool Result Block (in user messages):**
```json
{
  "type": "tool_result",
  "tool_use_id": "toolu_01D7FLrfh4GYq7yT1ULFeyMV",
  "content": "72°F, sunny"
}
```
The `tool_use_id` must match the `id` from the corresponding `tool_use` block [3].

### Response Structure

```json
{
  "id": "msg_01XFDUDYJgAACzvnptvVoYEL",
  "type": "message",
  "role": "assistant",
  "content": [{"type": "text", "text": "Hello!"}],
  "model": "claude-opus-4-6",
  "stop_reason": "end_turn",
  "stop_sequence": null,
  "usage": {"input_tokens": 12, "output_tokens": 6}
}
```
The `stop_reason` indicates why generation stopped: `end_turn`, `max_tokens`, `stop_sequence`, or `tool_use` [1].

## Common Patterns

### Multi-Turn Conversations

Build conversations by accumulating messages. Include all prior turns in each request [1]:

```python
from anthropic import Anthropic

client = Anthropic()

messages = [
    {"role": "user", "content": "Hello, Claude"},
    {"role": "assistant", "content": "Hello!"},
    {"role": "user", "content": "Can you describe LLMs to me?"}
]

response = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=1024,
    messages=messages
)
```

### System Prompts

Use the top-level `system` parameter for persistent instructions [2]:

```python
response = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=1024,
    system="You are a helpful coding assistant. Always include code examples.",
    messages=[{"role": "user", "content": "Explain Python decorators"}]
)
```

### Enabling Extended Thinking

Configure the `thinking` parameter for complex reasoning tasks [5]:

```python
response = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=16000,
    thinking={"type": "enabled", "budget_tokens": 10000},
    messages=[{"role": "user", "content": "Solve this complex problem..."}]
)
```

Thinking tokens count toward `max_tokens` and are billed as output tokens [5].

### Using the 1M Context Window

Add the beta header for extended context [5]:

```python
response = client.beta.messages.create(
    model="claude-opus-4-6",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Process this large document..."}],
    betas=["context-1m-2025-08-07"]
)
```

Requests exceeding 200K tokens incur premium pricing (2x input, 1.5x output) [5].

## Gotchas

- **No "system" role exists** — Attempting to use `{"role": "system", ...}` in the messages array will fail. System prompts go in the top-level `system` parameter [1][2].

- **Prefilling is deprecated** — The technique of ending with an assistant message to pre-seed responses is not supported on Claude Opus 4.6, Sonnet 4.6, and Sonnet 4.5. Use structured outputs or system prompt instructions instead [1].

- **Temperature and top_p are mutually exclusive** — On Claude Sonnet 4.5 and Claude Haiku 4.5, specifying both parameters causes an error. Older models accept both but the combination is discouraged [2].

- **Temperature 0.0 is not deterministic** — Even with temperature set to 0.0, results will not be fully deterministic [2].

- **tool_result must match tool_use_id** — When returning tool results, the `tool_use_id` must exactly match the `id` from the corresponding `tool_use` block. Mismatches cause errors [3].

- **Extended thinking requires thinking blocks in tool use flows** — When using extended thinking with tools, you must return the entire unmodified thinking block with tool results. The API verifies cryptographic signatures; modifications cause errors [5].

- **Context window validation errors** — Starting with Claude Sonnet 3.7, exceeding the context window returns a validation error rather than silently truncating. Use the token counting API to estimate usage beforehand [5].

- **Message limit** — There is a limit of 100,000 messages in a single request [2].

- **Consecutive same-role messages are combined** — If you accidentally send two `user` messages in a row, the API combines them rather than erroring. This can produce unexpected behavior [2].

- **max_tokens does not affect rate limits** — Output tokens per minute (OTPM) limits count only actual generated tokens, not the `max_tokens` ceiling. There is no penalty for setting a high `max_tokens` value [4].

## Sources

[1] **Using the Messages API - Claude API Docs**
    URL: https://platform.claude.com/docs/en/build-with-claude/working-with-messages
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Core request/response examples, multi-turn patterns, prefilling deprecation, vision capabilities, stateless design explanation.

[2] **Messages API Reference - Claude API Docs**
    URL: https://platform.claude.com/docs/en/api/messages
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Complete parameter list (required and optional), headers, temperature/top_p constraints, system prompt usage, message limits.

[3] **Tool Use Implementation - Claude API Docs**
    URL: https://platform.claude.com/docs/en/agents-and-tools/tool-use/implement-tool-use
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: tool_use and tool_result content block structures, tool_use_id matching requirement, error handling with is_error flag.

[4] **Context Windows & Max Tokens - Claude API Docs**
    URL: https://platform.claude.com/docs/en/build-with-claude/context-windows
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Model-specific max output token limits (64K for Claude 4.x), context window sizes, 1M beta availability, rate limit behavior.

[5] **Context Windows Guide - Claude API Docs**
    URL: https://platform.claude.com/docs/en/build-with-claude/context-windows
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Extended thinking token management, thinking block handling in tool use, context awareness feature, validation error behavior, 1M context beta header and pricing.
