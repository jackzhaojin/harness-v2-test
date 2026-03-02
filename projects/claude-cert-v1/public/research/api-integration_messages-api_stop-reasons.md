# Stop Reasons

**Topic ID:** api-integration.messages-api.stop-reasons
**Researched:** 2026-03-01T00:00:00Z

## Overview

The `stop_reason` field is a critical component of every successful Messages API response, indicating why Claude stopped generating its output [1]. Unlike HTTP errors (4xx/5xx status codes) that signal request failures, `stop_reason` values are part of successful responses and tell you how Claude completed its generation [1]. Understanding these values is essential for building robust applications that handle different response scenarios appropriately, from natural completions to tool invocations to truncated outputs.

The field appears at the top level of the response JSON alongside content, usage statistics, and model information [1][2]. In streaming mode, `stop_reason` is null in the initial `message_start` event and only becomes available in the `message_delta` event near the end of the stream [1]. Every application that consumes Claude's API should implement explicit handling for each stop reason to ensure reliable behavior.

## Key Concepts

- **end_turn** — The most common stop reason, indicating Claude finished its response naturally and reached a logical stopping point [1][2]. This is the expected outcome for straightforward question-answering.

- **max_tokens** — Claude stopped because it hit the `max_tokens` limit specified in your request [1][2]. The response is truncated and may be incomplete.

- **stop_sequence** — Claude encountered one of the custom stop sequences you specified in the `stop_sequences` parameter [1][2]. The matched sequence is available in the `stop_sequence` field of the response.

- **tool_use** — Claude decided to invoke a tool and expects you to execute it and return results [1][2]. The response content will contain `tool_use` blocks with the tool name and input parameters.

- **pause_turn** — The API paused a long-running turn, typically when using server tools like web search that hit the iteration limit (default 10) [1][3]. You can continue by sending the response back as-is.

- **refusal** — Claude declined to generate a response due to safety concerns [1][2]. This is triggered by streaming classifiers that detect potential policy violations.

- **model_context_window_exceeded** — Claude stopped because the conversation hit the model's context window limit [1][2]. Available by default in Sonnet 4.5 and newer; older models require the beta header `model-context-window-exceeded-2025-08-26`.

## Technical Details

The response structure includes `stop_reason` as a top-level field [1]:

```json
{
  "id": "msg_01234",
  "type": "message",
  "role": "assistant",
  "content": [
    {
      "type": "text",
      "text": "Here's the answer to your question..."
    }
  ],
  "stop_reason": "end_turn",
  "stop_sequence": null,
  "usage": {
    "input_tokens": 100,
    "output_tokens": 50
  }
}
```

The TypeScript SDK defines the type as [1]:

```typescript
type StopReason = "end_turn" | "max_tokens" | "stop_sequence" | "tool_use" | "pause_turn" | "refusal" | "model_context_window_exceeded";
```

For streaming responses, check for stop_reason in the `message_delta` event [1]:

```python
with client.messages.stream(...) as stream:
    for event in stream:
        if event.type == "message_delta":
            stop_reason = event.delta.stop_reason
            if stop_reason:
                print(f"Stream ended with: {stop_reason}")
```

## Common Patterns

**Comprehensive response handler** — Always check stop_reason to route responses appropriately [1]:

```python
def handle_response(response):
    if response.stop_reason == "tool_use":
        return handle_tool_use(response)
    elif response.stop_reason == "max_tokens":
        return handle_truncation(response)
    elif response.stop_reason == "model_context_window_exceeded":
        return handle_context_limit(response)
    elif response.stop_reason == "pause_turn":
        return handle_pause(response)
    elif response.stop_reason == "refusal":
        return handle_refusal(response)
    else:
        return response.content[0].text
```

**Continuing truncated responses** — When hitting token limits, append the partial response and ask Claude to continue [1]:

```python
def get_complete_response(client, prompt, max_attempts=3):
    messages = [{"role": "user", "content": prompt}]
    full_response = ""

    for _ in range(max_attempts):
        response = client.messages.create(
            model="claude-opus-4-6", messages=messages, max_tokens=4096
        )
        full_response += response.content[0].text

        if response.stop_reason != "max_tokens":
            break

        messages = [
            {"role": "user", "content": prompt},
            {"role": "assistant", "content": full_response},
            {"role": "user", "content": "Please continue from where you left off."},
        ]
    return full_response
```

**Handling pause_turn with server tools** — Continue the conversation by sending the response back [1][3]:

```python
def handle_server_tool_conversation(client, user_query, tools, max_continuations=5):
    messages = [{"role": "user", "content": user_query}]

    for _ in range(max_continuations):
        response = client.messages.create(
            model="claude-opus-4-6", messages=messages, tools=tools
        )

        if response.stop_reason != "pause_turn":
            return response

        messages = [
            {"role": "user", "content": user_query},
            {"role": "assistant", "content": response.content},
        ]
    return response
```

## Gotchas

- **Empty responses with end_turn** — Claude may return an empty response with `stop_reason: "end_turn"` when you add text blocks immediately after tool results in the message history [1]. This trains Claude to expect user input after every tool use. Solution: send tool results directly without additional text blocks.

- **Retrying empty responses incorrectly** — Simply sending an empty response back to Claude will not help because Claude already decided its turn is complete [1]. Instead, add a new user message with a continuation prompt like "Please continue."

- **max_tokens vs model_context_window_exceeded** — These are different limits [1]. `max_tokens` means you hit your requested limit; `model_context_window_exceeded` means the total conversation exceeded what the model can handle. Handle them differently in your UX.

- **pause_turn is not an error** — This stop reason is expected behavior with server tools when the iteration limit (default 10) is reached [1][3]. Your application must handle it by continuing the conversation, not by treating it as a failure.

- **refusal varies by model** — If you encounter frequent `refusal` stop reasons with Claude Sonnet 4.5 or Opus 4.1, consider using Sonnet 4 which has different usage restrictions [1].

- **Streaming null value** — In streaming mode, `stop_reason` is null until the `message_delta` event [1]. Do not check for it in `message_start` or content events.

- **stop_sequence field** — Only populated when `stop_reason` is `"stop_sequence"` [1]. Always null otherwise. Check both fields together when using custom stop sequences.

## Sources

[1] **Handling stop reasons - Claude API Docs**
    URL: https://platform.claude.com/docs/en/api/handling-stop-reasons
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Comprehensive documentation on all stop_reason values, code examples for handling each case, best practices, streaming behavior, empty response handling, and patterns for tool use and truncation recovery.

[2] **Request and Response - Amazon Bedrock**
    URL: https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-anthropic-claude-messages-request-response.html
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Response JSON structure showing stop_reason field, table of possible values with definitions, example responses for refusal and tool_use scenarios.

[3] **Web search tool - Claude API Docs**
    URL: https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search-tool
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Details on pause_turn behavior with server tools, default 10-iteration limit for server-side sampling loop, continuation patterns for web search.
