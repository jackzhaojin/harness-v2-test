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
