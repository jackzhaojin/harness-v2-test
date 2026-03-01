# Combined Research: API Integration


---

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


---

# Streaming Responses

**Topic ID:** api-integration.messages-api.streaming
**Researched:** 2026-03-01T12:00:00Z

## Overview

Streaming in the Claude Messages API enables real-time, incremental delivery of model responses using Server-Sent Events (SSE). Instead of waiting for the complete response to generate, streaming returns tokens as they're produced, significantly improving perceived latency for users interacting with AI applications. This is particularly important for long-form content generation where responses may take 30+ seconds to complete.

The streaming mechanism works by setting `"stream": true` in your API request. The server then maintains an open HTTP connection and pushes events as they occur. Each event follows the SSE specification: an `event:` line indicating the type, followed by a `data:` line containing JSON payload, with events separated by `\r\n\r\n`. The official Python and TypeScript SDKs abstract this complexity, providing convenient iterators and event handlers.

Streaming is essential for production applications with large `max_tokens` values. Non-streaming requests risk network timeouts on idle connections, particularly on unreliable networks. The SDKs enforce streaming for requests expected to exceed 10 minutes and automatically configure TCP keep-alive to mitigate timeout issues.

## Key Concepts

- **Server-Sent Events (SSE)**: The underlying protocol for streaming. Responses use `content-type: text/event-stream` headers and transmit events as newline-separated blocks. Unlike WebSockets, SSE is unidirectional (server to client only).

- **Event Types**: Each stream event has a `type` field. Core types are `message_start`, `content_block_start`, `content_block_delta`, `content_block_stop`, `message_delta`, and `message_stop`. Additional types include `ping` for keep-alive and `error` for stream errors.

- **Content Blocks**: A message can contain multiple content blocks (text, tool_use, thinking). Each block is delivered via its own start/delta/stop sequence and has an `index` corresponding to its position in the final Message content array.

- **Delta Events**: `content_block_delta` events contain incremental updates. For text, this is `text_delta` with a `text` field. For tool use, it's `input_json_delta` with `partial_json` strings that must be accumulated and parsed after `content_block_stop`.

- **Message Accumulation**: SDKs provide helpers like `.get_final_message()` (Python) or `.finalMessage()` (TypeScript) that accumulate all events and return the complete Message object, identical to non-streaming `.create()`.

- **Stop Reason**: Initially `null` in `message_start`, the actual `stop_reason` (e.g., `end_turn`, `tool_use`, `max_tokens`) is provided in the final `message_delta` event.

- **Cumulative Usage**: Token counts in `message_delta.usage` are cumulative, not incremental. The final `message_delta` contains total `input_tokens` and `output_tokens`.

## Technical Details

### Enabling Streaming

**Raw HTTP Request:**
```bash
curl https://api.anthropic.com/v1/messages \
  --header "anthropic-version: 2023-06-01" \
  --header "content-type: application/json" \
  --header "x-api-key: $ANTHROPIC_API_KEY" \
  --data '{
    "model": "claude-sonnet-4-20250514",
    "messages": [{"role": "user", "content": "Hello"}],
    "max_tokens": 256,
    "stream": true
  }'
```

**Python SDK (Sync):**
```python
import anthropic

client = anthropic.Anthropic()

with client.messages.stream(
    max_tokens=1024,
    messages=[{"role": "user", "content": "Hello"}],
    model="claude-sonnet-4-20250514",
) as stream:
    for text in stream.text_stream:
        print(text, end="", flush=True)
```

**TypeScript SDK:**
```typescript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

await client.messages
  .stream({
    messages: [{ role: "user", content: "Hello" }],
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024
  })
  .on("text", (text) => {
    console.log(text);
  });
```

### Event Stream Structure

A typical stream follows this sequence:

```sse
event: message_start
data: {"type": "message_start", "message": {"id": "msg_...", "type": "message", "role": "assistant", "content": [], "model": "claude-sonnet-4-20250514", "stop_reason": null, "usage": {"input_tokens": 25, "output_tokens": 1}}}

event: content_block_start
data: {"type": "content_block_start", "index": 0, "content_block": {"type": "text", "text": ""}}

event: content_block_delta
data: {"type": "content_block_delta", "index": 0, "delta": {"type": "text_delta", "text": "Hello"}}

event: content_block_delta
data: {"type": "content_block_delta", "index": 0, "delta": {"type": "text_delta", "text": "!"}}

event: content_block_stop
data: {"type": "content_block_stop", "index": 0}

event: message_delta
data: {"type": "message_delta", "delta": {"stop_reason": "end_turn"}, "usage": {"output_tokens": 15}}

event: message_stop
data: {"type": "message_stop"}
```

### Delta Types

| Delta Type | Content Block | Description |
|------------|---------------|-------------|
| `text_delta` | text | Incremental text content |
| `input_json_delta` | tool_use | Partial JSON strings for tool input |
| `thinking_delta` | thinking | Extended thinking content |
| `signature_delta` | thinking | Integrity signature for thinking blocks |

### Handling Tool Use Streaming

Tool use deltas emit partial JSON strings that must be concatenated:

```python
with client.messages.stream(
    model="claude-sonnet-4-20250514",
    max_tokens=1024,
    tools=tools,
    messages=[{"role": "user", "content": "What's the weather?"}],
) as stream:
    for event in stream:
        if event.type == "content_block_delta":
            if event.delta.type == "input_json_delta":
                # Accumulate partial_json strings
                json_buffer += event.delta.partial_json
```

## Common Patterns

### Pattern 1: Stream for Display, Get Final Message

When you need real-time display but also want the complete structured response:

```python
with client.messages.stream(
    max_tokens=4096,
    messages=[{"role": "user", "content": "Write an essay"}],
    model="claude-sonnet-4-20250514",
) as stream:
    for text in stream.text_stream:
        display_to_user(text)  # Real-time display

    message = stream.get_final_message()  # Complete Message object
    save_to_database(message)
```

### Pattern 2: Streaming with Large Token Limits

For requests with high `max_tokens` values (128K+), use streaming even if you don't need real-time display:

```python
with client.messages.stream(
    max_tokens=128000,
    messages=[{"role": "user", "content": "Write a detailed analysis..."}],
    model="claude-sonnet-4-20250514",
) as stream:
    message = stream.get_final_message()
```

### Pattern 3: Event-Based Processing

For fine-grained control, process events directly:

```python
with client.messages.stream(...) as stream:
    for event in stream:
        if event.type == "content_block_start":
            handle_block_start(event.content_block)
        elif event.type == "content_block_delta":
            if event.delta.type == "text_delta":
                process_text(event.delta.text)
            elif event.delta.type == "thinking_delta":
                process_thinking(event.delta.thinking)
        elif event.type == "message_delta":
            check_stop_reason(event.delta.stop_reason)
```

## Gotchas

- **Errors after 200 OK**: Streaming responses return HTTP 200 immediately. Errors (like `overloaded_error`) can occur mid-stream as SSE error events. Your error handling must check event types, not just HTTP status codes.

- **Tool use JSON is partial**: `input_json_delta` events contain JSON fragments, not valid JSON. You must accumulate all fragments and parse only after receiving `content_block_stop`. Use libraries like Pydantic for partial JSON parsing if you need incremental access.

- **Unknown event types**: Per Anthropic's versioning policy, new event types may be added. Code should handle unknown events gracefully (log and continue, don't crash).

- **Ping events are noise**: Streams may contain `ping` events at any time for keep-alive. Filter these out in your event processing logic.

- **Tool/thinking blocks can't be recovered**: If a stream is interrupted, text blocks can be partially recovered. However, tool_use and thinking blocks cannot be resumed—you must restart the request.

- **Claude 4.6 recovery differs**: For Claude 4.5 and earlier, you can recover interrupted streams by including partial responses as assistant message prefixes. For Claude 4.6, you must prompt the model to continue with a new user message.

- **Usage is cumulative**: The `usage` field in `message_delta` shows total tokens consumed, not tokens since the last event. Don't sum them across events.

- **Browser EventSource incompatible**: SSE via browser's native EventSource API doesn't work because the Messages API requires POST requests. Use fetch() with ReadableStream or a library like httpx-sse.

- **Model-specific delays with tools**: Current models emit tool input one complete key-value pair at a time. Expect pauses between `input_json_delta` events while the model generates values.

## Sources

- [Streaming Messages - Anthropic Platform Docs](https://platform.claude.com/docs/en/api/messages-streaming) — Primary reference for event types, stream structure, delta types, and SDK examples
- [Streaming Guide - Anthropic Build with Claude](https://platform.claude.com/docs/en/build-with-claude/streaming) — SDK streaming patterns, async/sync options, and best practices
- [Errors - Anthropic Platform Docs](https://platform.claude.com/docs/en/api/errors) — HTTP error codes, streaming error handling, and timeout considerations
- [How streaming LLM APIs work - Simon Willison's TILs](https://til.simonwillison.net/llms/streaming-llm-apis) — Cross-provider SSE comparison and implementation details


---

# Message Batches API

**Topic ID:** api-integration.batch-processing.basics
**Researched:** 2026-03-01T00:00:00Z

## Overview

The Message Batches API is Anthropic's asynchronous processing system for handling large volumes of Claude API requests. Instead of sending requests one at a time and waiting for immediate responses, you submit up to 100,000 requests in a single batch. The system processes them within 24 hours (typically under 1 hour) at 50% of standard API pricing—making it ideal for workloads where latency isn't critical.

This pattern fits naturally into data pipelines, offline processing, and cost-sensitive operations. Use cases include large-scale evaluations (processing thousands of test cases), content moderation (analyzing user-generated content asynchronously), bulk content generation (product descriptions, summaries), and dataset analysis. Each request in a batch is processed independently, so you can mix different request types—vision, tool use, multi-turn conversations—within the same batch.

The API is generally available on Anthropic's platform and follows the same request format as the standard Messages API, with the addition of a `custom_id` field for matching results to requests since results may return out of order.

## Key Concepts

- **Batch**: A collection of up to 100,000 Message requests (or 256 MB total size, whichever limit hits first) submitted for asynchronous processing.

- **custom_id**: A developer-provided unique identifier for each request within a batch. Required because results are not guaranteed to return in submission order.

- **processing_status**: The batch lifecycle state—`in_progress` (processing), `canceling` (cancellation initiated), or `ended` (all requests completed/expired/canceled).

- **request_counts**: An object tracking how many requests are in each state: `processing`, `succeeded`, `errored`, `canceled`, and `expired`.

- **results_url**: A URL to download the `.jsonl` file containing all batch results. Only populated after `processing_status` becomes `ended`.

- **Expiration**: Batches expire after 24 hours if processing doesn't complete. Results remain available for 29 days after batch creation.

- **Result types**: Each request resolves to one of four states: `succeeded` (completed normally), `errored` (validation or server error), `canceled` (user-initiated), or `expired` (24-hour timeout reached).

- **50% discount**: All batch usage—input tokens, output tokens, and special tokens—costs half the standard Messages API price.

## Technical Details

### API Endpoint

```
POST https://api.anthropic.com/v1/messages/batches
```

### Request Structure

```json
{
  "requests": [
    {
      "custom_id": "request-001",
      "params": {
        "model": "claude-sonnet-4-5",
        "max_tokens": 1024,
        "messages": [
          {"role": "user", "content": "Summarize this document..."}
        ]
      }
    }
  ]
}
```

The `params` object accepts all standard Messages API parameters: `model`, `messages`, `max_tokens`, `system`, `temperature`, `tools`, `tool_choice`, and beta features.

### Response Structure

```json
{
  "id": "msgbatch_01HkcTjaV5uDC8jWR4ZsDV8d",
  "type": "message_batch",
  "processing_status": "in_progress",
  "request_counts": {
    "processing": 2,
    "succeeded": 0,
    "errored": 0,
    "canceled": 0,
    "expired": 0
  },
  "created_at": "2024-09-24T18:37:24.100435Z",
  "expires_at": "2024-09-25T18:37:24.100435Z",
  "ended_at": null,
  "results_url": null
}
```

### Polling for Completion

```python
import anthropic
import time

client = anthropic.Anthropic()

while True:
    batch = client.messages.batches.retrieve(batch_id)
    if batch.processing_status == "ended":
        break
    time.sleep(60)
```

### Retrieving Results

Results come as a `.jsonl` file (one JSON object per line):

```python
for result in client.messages.batches.results(batch_id):
    if result.result.type == "succeeded":
        print(f"{result.custom_id}: {result.result.message.content}")
    elif result.result.type == "errored":
        print(f"{result.custom_id}: Error - {result.result.error}")
```

### Batch Pricing (50% of standard)

| Model | Batch Input | Batch Output |
|-------|-------------|--------------|
| Claude Opus 4.5/4.6 | $2.50/MTok | $12.50/MTok |
| Claude Sonnet 4/4.5/4.6 | $1.50/MTok | $7.50/MTok |
| Claude Haiku 4.5 | $0.50/MTok | $2.50/MTok |
| Claude Haiku 3.5 | $0.40/MTok | $2/MTok |

## Common Patterns

### Bulk Classification Pipeline

Submit thousands of items for classification, then process results asynchronously:

```python
requests = [
    {
        "custom_id": f"doc-{doc.id}",
        "params": {
            "model": "claude-haiku-4-5",
            "max_tokens": 100,
            "messages": [{"role": "user", "content": f"Classify: {doc.text}"}]
        }
    }
    for doc in documents
]

batch = client.messages.batches.create(requests=requests)
```

### Combining with Prompt Caching

For batches with shared context (same system prompt or reference documents), use prompt caching to reduce costs further. Cache hit rates in batches typically range 30-98% depending on traffic patterns.

```python
{
    "custom_id": "analysis-1",
    "params": {
        "model": "claude-sonnet-4-5",
        "max_tokens": 2048,
        "system": [
            {"type": "text", "text": "You are analyzing..."},
            {
                "type": "text",
                "text": "<large_reference_document>",
                "cache_control": {"type": "ephemeral"}
            }
        ],
        "messages": [{"role": "user", "content": "Analyze section 3..."}]
    }
}
```

### Breaking Large Jobs into Manageable Batches

For datasets exceeding 100,000 items, split into multiple batches and track them separately. This improves manageability and allows partial retries if some batches fail.

## Gotchas

- **Results are unordered**: Never assume results match submission order. Always use `custom_id` to correlate results with requests.

- **Validation is asynchronous**: Request body validation happens during processing, not at submission. Test individual requests with the synchronous Messages API first to catch schema errors.

- **24-hour expiration is hard**: If processing doesn't complete within 24 hours, remaining requests expire. You're not charged for expired requests, but you must resubmit them.

- **Results expire after 29 days**: Download results promptly. After 29 days from batch creation (not completion), results become unavailable.

- **Streaming not supported**: The `stream` parameter is ignored in batch requests. All responses are complete messages.

- **Spend limits can be exceeded**: Due to concurrent processing, batches may slightly exceed your workspace's configured spend limit.

- **Cache hits are best-effort**: Unlike synchronous requests, batch processing is concurrent and unordered, so cache hits aren't guaranteed even with identical cache_control blocks.

- **Not covered by Zero Data Retention**: Batch data follows standard retention policies, not ZDR arrangements.

- **Rate limits are separate**: Batch API has its own rate limits (HTTP requests and queued request count) that don't affect standard Messages API limits.

## Sources

- [Batch Processing Guide](https://platform.claude.com/docs/en/docs/build-with-claude/batch-processing) — Primary documentation covering lifecycle, code examples in multiple languages, and best practices
- [Create a Message Batch API Reference](https://platform.claude.com/docs/en/api/creating-message-batches) — Technical API specification with request/response schemas
- [Anthropic Pricing](https://platform.claude.com/docs/en/about-claude/pricing) — Official pricing tables showing 50% batch discount across all models
- [Introducing the Message Batches API](https://www.anthropic.com/news/message-batches-api) — Launch announcement with feature overview


---

# SDK Setup and Usage

**Topic ID:** api-integration.sdks.setup
**Researched:** 2026-03-01T00:00:00Z

## Overview

Software Development Kits (SDKs) provide pre-built libraries that simplify API integration by handling authentication, request formatting, response parsing, and error handling. Rather than making raw HTTP calls, developers use typed methods that abstract away protocol details while providing compile-time safety and better IDE support.

Modern SDKs typically offer synchronous and asynchronous clients, automatic retry logic with exponential backoff, streaming support, and type-safe request/response handling. The setup process involves installing the SDK package, configuring API credentials securely, and initializing a client instance with appropriate settings for timeouts, retries, and other behaviors.

Understanding SDK configuration is critical because defaults rarely suit production requirements. Misconfigured retry policies can cause cascading failures, hardcoded API keys create security vulnerabilities, and improper timeout settings degrade user experience. A properly configured SDK handles transient failures gracefully while failing fast on permanent errors.

## Key Concepts

- **Client Initialization** — Creating an SDK client instance with credentials and configuration. Most SDKs support environment variable-based configuration as the default, with programmatic overrides for testing and special cases.

- **API Key Management** — Securely storing and providing credentials to the SDK. Best practice is using environment variables locally (with `.env` files excluded from version control) and secrets managers (AWS Secrets Manager, GCP Secret Manager, Azure Key Vault) in production.

- **Type-Safe Clients** — SDKs generated from OpenAPI specifications that provide compile-time type checking for requests and responses. Tools like `openapi-typescript`, Kiota, and Stainless generate clients where the compiler validates that your code matches the API contract.

- **Runtime Validation** — Additional validation layer using libraries like Zod (TypeScript) or Pydantic (Python) to verify API responses match expected schemas at runtime, since type systems only check at compile time.

- **Retry Strategy** — Configuration that determines which errors trigger automatic retries, maximum retry attempts, and delay calculation (typically exponential backoff with jitter). Standard retryable conditions include HTTP 408, 429, and 5xx status codes.

- **Exponential Backoff with Jitter** — Delay calculation that increases wait time between retries (e.g., 1s, 2s, 4s) with randomization to prevent thundering herd problems when many clients retry simultaneously.

- **Circuit Breaker Pattern** — Complementary pattern that stops retry attempts when a service is consistently failing, preventing resource exhaustion and allowing the service to recover.

- **Idempotency** — Property where repeating an operation produces the same result. Critical consideration for retry logic—non-idempotent operations (like creating resources) require idempotency keys or careful handling.

## Technical Details

### Installation Patterns

Python SDKs typically install via pip with optional extras for platform-specific integrations:

```bash
# Basic installation
pip install anthropic

# With platform integrations
pip install anthropic[bedrock]    # AWS Bedrock support
pip install anthropic[vertex]     # Google Vertex AI support
pip install anthropic[aiohttp]    # Improved async performance
```

TypeScript/Node SDKs install via npm:

```bash
npm install openai
npm install @anthropic-ai/sdk
```

### Client Configuration

Initialize clients with credentials from environment variables, not hardcoded values:

```python
import os
from anthropic import Anthropic

# Recommended: API key from environment variable
client = Anthropic(
    api_key=os.environ.get("ANTHROPIC_API_KEY"),
)

# Configure retries and timeouts
client = Anthropic(
    api_key=os.environ.get("ANTHROPIC_API_KEY"),
    max_retries=3,          # Default is 2
    timeout=30.0,           # Default is 10 minutes
)
```

For granular timeout control:

```python
import httpx
from anthropic import Anthropic

client = Anthropic(
    timeout=httpx.Timeout(60.0, read=5.0, write=10.0, connect=2.0),
)
```

### Type-Safe API Clients with OpenAPI

Generate TypeScript types from an OpenAPI specification:

```bash
npx openapi-typescript https://api.example.com/openapi.json -o schema.ts
```

Use the generated types for compile-time safety:

```typescript
import { paths } from './schema';

type GetPetsRequest = paths['/pets']['get']['parameters'];
type GetPetsResponse = paths['/pets']['get']['responses']['200']['content']['application/json'];

export const getPets = ({ params }: { params: GetPetsRequest }) =>
  apiClient.request<GetPetsResponse>({
    method: 'GET',
    url: '/pets',
    params: { limit: params.query?.limit }
  });
```

### Error Handling

SDKs provide typed exceptions for different failure modes:

```python
import anthropic
from anthropic import Anthropic

client = Anthropic()

try:
    message = client.messages.create(...)
except anthropic.APIConnectionError as e:
    print("Network error - check connectivity")
except anthropic.RateLimitError as e:
    print("Rate limited - implement backoff")
except anthropic.AuthenticationError as e:
    print("Invalid API key - check credentials")
except anthropic.APIStatusError as e:
    print(f"API error: {e.status_code}")
```

| Status Code | Error Type | Retryable |
|-------------|-----------|-----------|
| 400 | BadRequestError | No |
| 401 | AuthenticationError | No |
| 403 | PermissionDeniedError | No |
| 429 | RateLimitError | Yes |
| 5xx | InternalServerError | Yes |

### Async Usage

Modern SDKs provide async clients for concurrent operations:

```python
import asyncio
from anthropic import AsyncAnthropic

client = AsyncAnthropic()

async def main():
    message = await client.messages.create(
        model="claude-opus-4-6",
        max_tokens=1024,
        messages=[{"role": "user", "content": "Hello"}]
    )
    print(message.content)

asyncio.run(main())
```

## Common Patterns

### Environment-Based Configuration

Separate credentials per environment using environment variables:

```bash
# Development (.env file - add to .gitignore!)
ANTHROPIC_API_KEY=sk-dev-xxx

# Production (via secrets manager)
export ANTHROPIC_API_KEY=$(aws secretsmanager get-secret-value --secret-id prod/anthropic-key --query SecretString --output text)
```

### Backend Proxy Pattern

Keep API keys out of client-side code by routing through a backend:

```
Client → Your Backend (adds API key) → External API
```

This ensures clients never see credentials, enables centralized rate limiting, and allows credential rotation without client updates.

### Request ID Logging

Capture request IDs for debugging and support tickets:

```python
message = client.messages.create(...)
print(f"Request ID: {message._request_id}")  # e.g., req_018EeWyXxfu5pfWkrYcMdjWG
```

### Streaming for Long Operations

Use streaming to avoid timeout issues on long-running requests:

```python
stream = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=4096,
    messages=[{"role": "user", "content": "Write a long essay..."}],
    stream=True,
)
for event in stream:
    print(event.type)
```

## Gotchas

- **Don't layer retry logic** — If you add application-level retries on top of SDK retries, you get multiplicative retry attempts (e.g., 3 × 3 = 9 attempts) with compounding delays. Configure retries at one layer only.

- **TypeScript type safety is compile-time only** — After compilation to JavaScript, no type information remains. API responses could have unexpected shapes at runtime. Consider adding Zod validation for critical paths.

- **Environment variables aren't automatically loaded** — Python requires `python-dotenv` to load `.env` files; they don't load automatically. Add `load_dotenv()` early in your application.

- **Default timeouts may be too long** — Some SDKs default to 10-minute timeouts. This is appropriate for AI generation APIs but too long for typical REST endpoints. Always configure explicit timeouts.

- **Retry storms can cascade** — Aggressive retry policies with many clients can overwhelm a recovering service. Use exponential backoff with jitter, and consider circuit breakers for persistent failures.

- **API key rotation requires planning** — Keys should be rotated every 30-90 days. Ensure your deployment process supports seamless rotation without downtime.

- **GitHub Secret Scanning** — Anthropic and other providers partner with GitHub to automatically detect and revoke exposed keys in public repositories. This helps, but prevention (proper .gitignore, environment variables) is better than detection.

- **Connection timeouts vs request timeouts** — Connection timeout applies to establishing the TCP connection; request timeout applies to the entire request/response cycle. Configure both appropriately.

- **Non-idempotent operations need care** — Retrying a POST that creates a resource might create duplicates. Use idempotency keys when the API supports them, or implement client-side deduplication.

## Sources

- [Google Cloud - Best practices for managing API keys](https://docs.cloud.google.com/docs/authentication/api-keys-best-practices) — API key restrictions, rotation, and security recommendations
- [Claude Help Center - API Key Best Practices](https://support.claude.com/en/articles/9767949-api-key-best-practices-keeping-your-keys-safe-and-secure) — Environment variable usage, secrets managers, key rotation schedules
- [Anthropic Python SDK Documentation](https://platform.claude.com/docs/en/api/sdks/python) — Complete SDK installation, configuration, async usage, streaming, and error handling
- [DEV Community - Writing Type-Safe API Clients in TypeScript](https://dev.to/nazeelashraf/writing-type-safe-api-clients-in-typescript-1j92) — OpenAPI code generation and type-safe client patterns
- [AWS PDK - Type Safe API](https://aws.github.io/aws-pdk/developer_guides/type-safe-api/index.html) — Multi-language code generation from API specifications
- [Microsoft Azure - Retry Pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/retry) — Retry strategies, exponential backoff, circuit breaker integration, and when not to retry

