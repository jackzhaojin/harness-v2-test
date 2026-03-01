# Messages API Fundamentals

**Topic ID:** api-integration.messages-api.basics
**Researched:** 2026-03-01T12:00:00Z

## Overview

The Messages API is the primary interface for conversational interactions with Claude models. It's a RESTful API endpoint at `https://api.anthropic.com/v1/messages` that accepts POST requests and returns Claude's responses. Unlike simpler completion APIs, the Messages API is designed around a conversation paradigm where you send a history of user and assistant messages, and Claude generates the next assistant turn.

This API is foundational to all Claude integrations—whether you're building chatbots, code assistants, content generation tools, or agentic systems. Understanding its request structure, authentication requirements, and response handling is essential before exploring advanced features like streaming, tool use, or vision capabilities. The API is stateless, meaning every request must include the full conversation history; there's no server-side session management.

The Messages API is available directly through Anthropic and also via third-party platforms (AWS Bedrock, Google Vertex AI, Azure AI), though the direct API typically receives new features first. Official SDKs exist for Python, TypeScript, Java, Go, C#, Ruby, and PHP, which handle authentication, retries, and type safety automatically.

## Key Concepts

- **Base URL**: All requests go to `https://api.anthropic.com/v1/messages`. This is the single endpoint for synchronous message generation.

- **Authentication Header (`x-api-key`)**: Your API key authenticates every request. It must be sent in the `x-api-key` header—not the `Authorization` header. Keys are scoped to workspaces and can be generated in the Anthropic Console.

- **API Version Header (`anthropic-version`)**: Required header specifying the API version. Currently `2023-06-01` is the stable version. This is not the model version—it controls API behavior and response format.

- **Model Parameter**: Required field specifying which Claude model to use (e.g., `claude-opus-4-6`, `claude-sonnet-4-5-20250929`, `claude-3-5-haiku-20241022`). Model names include snapshot dates ensuring consistent behavior.

- **Messages Array**: The conversation history sent to Claude. Must alternate between `user` and `assistant` roles. The API generates the next assistant turn based on this history.

- **max_tokens**: Required parameter setting the maximum output length. Different models have different maximums. The model may stop earlier naturally, but will never exceed this limit.

- **stop_reason**: Every response includes this field explaining why generation stopped: `end_turn` (natural completion), `max_tokens` (hit limit), `tool_use` (calling a tool), `stop_sequence` (hit custom stop text), `refusal` (safety concern), or `pause_turn` (server tool iteration limit).

- **Usage Tracking**: Responses include `usage.input_tokens` and `usage.output_tokens` for cost tracking and rate limit monitoring.

## Technical Details

### Required Headers

Every API request requires three headers:

```bash
curl https://api.anthropic.com/v1/messages \
  --header "x-api-key: $ANTHROPIC_API_KEY" \
  --header "anthropic-version: 2023-06-01" \
  --header "content-type: application/json"
```

### Request Body Structure

```json
{
  "model": "claude-opus-4-6",
  "max_tokens": 1024,
  "messages": [
    {"role": "user", "content": "Hello, Claude"}
  ],
  "system": "You are a helpful assistant.",
  "temperature": 1.0,
  "stop_sequences": ["END"],
  "stream": false
}
```

**Required parameters:**
- `model`: Model identifier string
- `max_tokens`: Integer, maximum tokens to generate
- `messages`: Array of message objects with `role` and `content`

**Optional parameters:**
- `system`: System prompt providing context/instructions
- `temperature`: Float 0.0-1.0 (default 1.0). Lower for analytical tasks, higher for creative tasks
- `stop_sequences`: Array of strings that trigger generation to stop
- `stream`: Boolean for server-sent events streaming

### Response Structure

```json
{
  "id": "msg_01XFDUDYJgAACzvnptvVoYEL",
  "type": "message",
  "role": "assistant",
  "content": [
    {
      "type": "text",
      "text": "Hello! How can I assist you today?"
    }
  ],
  "model": "claude-opus-4-6",
  "stop_reason": "end_turn",
  "stop_sequence": null,
  "usage": {
    "input_tokens": 12,
    "output_tokens": 8
  }
}
```

### Error Codes

| Code | Type | Description |
|------|------|-------------|
| 401 | `authentication_error` | Invalid or missing API key |
| 403 | `permission_error` | API key lacks permission for resource |
| 404 | `not_found_error` | Resource not found |
| 429 | `rate_limit_error` | Rate or spend limit exceeded |
| 500 | `api_error` | Internal server error |

### Request Size Limits

| Endpoint | Maximum Size |
|----------|-------------|
| Messages API | 32 MB |
| Batch API | 256 MB |
| Files API | 500 MB |

## Common Patterns

### Multi-Turn Conversation

The API is stateless—send full conversation history each time:

```python
messages = [
    {"role": "user", "content": "What's the capital of France?"},
    {"role": "assistant", "content": "The capital of France is Paris."},
    {"role": "user", "content": "What's its population?"}
]

response = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=1024,
    messages=messages
)
```

### Handling Truncated Responses

When `stop_reason` is `max_tokens`, the response was cut off:

```python
if response.stop_reason == "max_tokens":
    # Continue generation
    messages.append({"role": "assistant", "content": response.content[0].text})
    messages.append({"role": "user", "content": "Please continue."})
    continuation = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=1024,
        messages=messages
    )
```

### Python SDK Usage

The SDK handles headers, retries, and error handling automatically:

```python
from anthropic import Anthropic

client = Anthropic()  # Reads ANTHROPIC_API_KEY from environment

message = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Hello, Claude"}]
)
```

### Error Handling with SDK

```python
import anthropic

try:
    response = client.messages.create(...)
except anthropic.AuthenticationError:
    # Handle invalid API key (401)
except anthropic.RateLimitError:
    # Handle rate limit (429) - SDK auto-retries these
except anthropic.InternalServerError:
    # Handle server errors (500) - SDK auto-retries these
except anthropic.APIStatusError as e:
    print(f"Status: {e.status_code}")
```

## Gotchas

- **Header name is `x-api-key`, not `Authorization`**: A common mistake when coming from other APIs. Using the wrong header name results in a 401 error.

- **`anthropic-version` is not the model version**: This header controls API behavior, not which Claude model you're using. The model version is specified in the `model` parameter.

- **Messages must alternate roles**: You cannot have two consecutive `user` messages or two consecutive `assistant` messages. The API expects strict alternation.

- **max_tokens is required**: Unlike some APIs that have defaults, you must explicitly set `max_tokens`. Different models have different maximum values.

- **Empty responses with `end_turn`**: Claude may return empty responses after tool results if you add text blocks immediately after `tool_result` content. Send tool results without additional text.

- **SDK auto-retries 429 and 500 errors**: The official SDKs automatically retry rate limit and server errors with exponential backoff (2 retries by default). Don't implement your own retry logic on top of this.

- **Prefilling is deprecated on newer models**: The technique of pre-filling assistant responses to constrain output format is deprecated on Claude Opus 4.6, Sonnet 4.6, and Sonnet 4.5. Use structured outputs or system prompts instead.

- **Long requests without streaming risk timeout**: For requests that may take over 10 minutes, use streaming or the Batch API. Network connections may drop on idle connections.

- **Rate limits use token bucket algorithm**: Capacity replenishes continuously rather than resetting at fixed intervals. Bursting is allowed up to your bucket capacity.

## Sources

- [API Overview - Claude Platform Docs](https://platform.claude.com/docs/en/api/overview) — Authentication headers, base URL, request/response format, SDKs, rate limits overview
- [Messages API Reference - Anthropic](https://docs.anthropic.com/en/api/messages) — Complete parameter specifications and response schemas
- [Handling Stop Reasons - Claude Platform Docs](https://platform.claude.com/docs/en/build-with-claude/handling-stop-reasons) — Detailed stop_reason values, empty response handling, streaming considerations
- [Using the Messages API - Claude Platform Docs](https://platform.claude.com/docs/en/build-with-claude/working-with-messages) — Multi-turn patterns, prefill techniques, vision examples
- [Errors - Claude Docs](https://docs.anthropic.com/en/api/errors) — Error codes, exception types, retry behavior
