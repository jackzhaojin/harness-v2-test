# Streaming Events

**Topic ID:** api-integration.streaming.events
**Researched:** 2026-03-01T12:00:00Z

## Overview

Streaming in the Claude API uses Server-Sent Events (SSE) to deliver responses incrementally as they are generated, enabling real-time display of content in user interfaces [1]. When you set `"stream": true` in your API request, instead of receiving a complete response once generation finishes, you receive a sequence of typed events that build up the final message piece by piece [1].

The streaming mechanism is essential for creating responsive AI applications. Each event has a named type (delivered via the SSE `event:` field) and associated JSON data [1]. Understanding the event flow and properly handling each event type is critical for building robust integrations, especially when dealing with complex scenarios like tool use or extended thinking where multiple content blocks appear in sequence [2].

The key architectural insight is that a Claude message consists of multiple content blocks (text, tool_use, thinking), and streaming exposes the construction of each block through start, delta, and stop events [1][2].

## Key Concepts

- **Server-Sent Events (SSE)** — A web technology that allows the server to push real-time updates over a single, long-lived HTTP connection. Claude uses this standard format with named events and JSON payloads [1].

- **Content Block** — A discrete unit of content in a message (text, tool_use, or thinking type). Each block has an index that corresponds to its position in the final message's content array [1].

- **Event Flow** — The guaranteed sequence: `message_start` -> (content_block_start -> content_block_delta(s) -> content_block_stop)* -> message_delta -> message_stop [1].

- **Delta Events** — Incremental updates delivered via `content_block_delta` events. The delta type indicates what kind of content is being streamed: `text_delta`, `input_json_delta`, `thinking_delta`, or `signature_delta` [1][2].

- **Index Tracking** — Each content block has a unique index. Delta events reference this index to indicate which block they update. Implementations must track indices to correctly reconstruct the response [3].

- **Cumulative Usage** — Token counts in `message_delta` are cumulative totals, not incremental additions [1].

## Technical Details

### Event Types

The complete event sequence for a streaming response [1]:

```
message_start           # Contains Message object with empty content
  content_block_start   # Begins block at index N, includes type
    content_block_delta # One or more deltas updating block N
    content_block_delta
  content_block_stop    # Ends block at index N
  content_block_start   # Next block at index N+1
    ...
  content_block_stop
message_delta           # Top-level changes (stop_reason, usage)
message_stop            # Stream complete
```

Additional events: `ping` (keep-alive, can appear anywhere) and `error` (e.g., `overloaded_error`) [1].

### Delta Type Details

**text_delta** — Contains incremental text chunks [1]:
```json
{"type": "content_block_delta", "index": 0, "delta": {"type": "text_delta", "text": "Hello"}}
```

**input_json_delta** — Partial JSON strings for tool use inputs. Accumulate until `content_block_stop`, then parse [1]:
```json
{"type": "content_block_delta", "index": 1, "delta": {"type": "input_json_delta", "partial_json": "{\"location\": \"San Fra"}}
```

**thinking_delta** — Extended thinking content (requires thinking enabled) [2]:
```json
{"type": "content_block_delta", "index": 0, "delta": {"type": "thinking_delta", "thinking": "Let me analyze..."}}
```

**signature_delta** — Cryptographic signature for thinking blocks, sent just before `content_block_stop` [2]:
```json
{"type": "content_block_delta", "index": 0, "delta": {"type": "signature_delta", "signature": "EqQBCgIYAhIM..."}}
```

### SDK Usage Patterns

The Python and TypeScript SDKs provide high-level streaming helpers [1]:

```python
# Python - Simple text streaming
with client.messages.stream(
    model="claude-opus-4-6",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Hello"}],
) as stream:
    for text in stream.text_stream:
        print(text, end="", flush=True)
```

```typescript
// TypeScript - Event-based streaming
await client.messages
  .stream({
    model: "claude-opus-4-6",
    max_tokens: 1024,
    messages: [{ role: "user", content: "Hello" }]
  })
  .on("text", (text) => console.log(text));
```

For extended thinking, handle both delta types [2]:

```python
for event in stream:
    if event.type == "content_block_delta":
        if event.delta.type == "thinking_delta":
            print(event.delta.thinking, end="", flush=True)
        elif event.delta.type == "text_delta":
            print(event.delta.text, end="", flush=True)
```

### Raw API Example

Direct curl request showing `stream: true` [1]:

```bash
curl https://api.anthropic.com/v1/messages \
  --header "anthropic-version: 2023-06-01" \
  --header "content-type: application/json" \
  --header "x-api-key: $ANTHROPIC_API_KEY" \
  --data '{
    "model": "claude-opus-4-6",
    "messages": [{"role": "user", "content": "Hello"}],
    "max_tokens": 256,
    "stream": true
  }'
```

## Common Patterns

### Basic Text Reconstruction

Accumulate `text_delta` events to build the complete response [1]:

```python
full_text = ""
for event in stream:
    if event.type == "content_block_delta" and event.delta.type == "text_delta":
        full_text += event.delta.text
```

### Tool Use with Streaming

When streaming tool use, the input arrives as partial JSON. Wait for `content_block_stop` before parsing [1]:

```python
tool_input_json = ""
for event in stream:
    if event.type == "content_block_delta":
        if event.delta.type == "input_json_delta":
            tool_input_json += event.delta.partial_json
    elif event.type == "content_block_stop":
        # Now safe to parse the complete JSON
        parsed_input = json.loads(tool_input_json)
```

### Extended Thinking Flow

When thinking is enabled, expect this sequence [2]:

1. `content_block_start` with `type: "thinking"`
2. Multiple `thinking_delta` events
3. `signature_delta` event (integrity verification)
4. `content_block_stop`
5. `content_block_start` with `type: "text"`
6. Multiple `text_delta` events
7. `content_block_stop`

### Getting Final Message Without Event Handling

If you do not need real-time display, SDKs can accumulate events internally [1]:

```python
with client.messages.stream(...) as stream:
    message = stream.get_final_message()  # Returns complete Message object
```

## Gotchas

- **Token counts are cumulative** — The `usage` field in `message_delta` shows cumulative totals, not the tokens generated since the last event. A common bug is treating these as incremental values [1].

- **Index reuse causes type mismatches** — When building proxy implementations, each `content_block.index` must uniquely identify one block. Reusing indices across different block types causes client failures with errors like "Mismatched content block type" [3].

- **Partial JSON is not parseable** — The `input_json_delta` events contain string fragments, not valid JSON. Attempting to parse before receiving `content_block_stop` will fail. Use libraries like Pydantic for partial JSON parsing if needed mid-stream [1].

- **Ping events can appear anywhere** — The `ping` event type is a keep-alive signal that can appear between any other events. Implementations must handle unknown event types gracefully [1].

- **Streaming may be required for large max_tokens** — SDKs require streaming when `max_tokens` exceeds 21,333 to avoid HTTP timeouts. Use `.stream()` with `.get_final_message()` if you do not need incremental processing [1].

- **Delays between events are normal** — There can be significant pauses between streaming events, especially during tool use when the model is "working." This is expected behavior, not a connection issue [1].

- **Thinking blocks require signature preservation** — When passing thinking blocks back to the API (required for tool use with thinking), include the complete unmodified block including the signature [2].

- **Error events can interrupt the stream** — During high load, you may receive an `overloaded_error` event mid-stream. Implement error handling for graceful recovery [1].

- **New event types may be added** — Per the versioning policy, new events can appear in future API versions. Code should handle unknown event types without crashing [1].

## Sources

[1] **Streaming Messages - Claude API Docs**
    URL: https://platform.claude.com/docs/en/build-with-claude/streaming
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Complete event type specifications, delta types (text_delta, input_json_delta, thinking_delta, signature_delta), event flow, SDK examples in Python and TypeScript, raw API examples, error handling guidance, and usage token behavior.

[2] **Building with extended thinking - Claude API Docs**
    URL: https://platform.claude.com/docs/en/build-with-claude/extended-thinking
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Streaming with thinking_delta events, signature handling, thinking block preservation requirements, interleaved thinking, and the event sequence for extended thinking responses.

[3] **GitHub: diskd-ai/claude-api - streaming.md**
    URL: https://github.com/diskd-ai/claude-api/blob/main/references/streaming.md
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Index handling requirements, common implementation bugs with content_block.index collisions, and the importance of unique sequential indices per block.
