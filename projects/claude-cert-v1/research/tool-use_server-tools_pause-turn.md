# Handling pause_turn

**Topic ID:** tool-use.server-tools.pause-turn
**Researched:** 2026-03-01T12:00:00Z

## Overview

The `pause_turn` stop reason is a specialized response indicator in the Claude Messages API that signals when the server-side sampling loop has reached its iteration limit while executing server tools like web search or web fetch [1]. Unlike client tools where you execute the tool and return results, server tools run entirely on Anthropic's servers in an internal loop that can execute multiple tool calls before returning a response [2]. When this loop hits the default limit of 10 iterations, Claude returns `pause_turn` to indicate processing has paused but is not complete [1].

Understanding `pause_turn` is critical for building robust agentic applications that use server tools. When you receive this stop reason, the response may contain a `server_tool_use` block without a corresponding `server_tool_result`, indicating incomplete processing [1]. The correct response is to continue the conversation by sending the response back to Claude, allowing it to resume and finish the task. Failing to handle `pause_turn` properly can result in incomplete responses or API errors in downstream processing [3].

## Key Concepts

- **Server-side sampling loop** — When Claude executes server tools, Anthropic's servers run an internal loop that may perform multiple tool calls before returning a final response [2]. This is transparent to the developer and handled entirely server-side.

- **Iteration limit** — The server-side loop has a default limit of 10 iterations per request [1]. This prevents runaway operations and ensures predictable response times.

- **Stop reason** — The `stop_reason` field in API responses indicates why Claude stopped generating. Possible values include `end_turn`, `max_tokens`, `stop_sequence`, `tool_use`, `pause_turn`, `refusal`, and `model_context_window_exceeded` [1].

- **Server tools** — Tools that execute on Anthropic's servers rather than your systems, including `web_search` and `web_fetch` [2]. These use versioned types like `web_search_20250305` or `web_search_20260209` [2].

- **server_tool_use block** — A content block type (with `srvtoolu_` ID prefix) that appears in responses when server tools are invoked [3]. When `pause_turn` occurs, this block may lack a corresponding result.

- **Continuation pattern** — The recommended approach for handling `pause_turn`: append the assistant's response to your messages array and make another API request to let Claude continue processing [1].

## Technical Details

When the API returns `pause_turn`, your application must handle it by continuing the conversation. The basic pattern involves checking the stop reason and re-sending the conversation if paused [1]:

```python
response = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=1024,
    tools=[{"type": "web_search_20250305", "name": "web_search"}],
    messages=[{"role": "user", "content": "Search for latest AI news"}],
)

if response.stop_reason == "pause_turn":
    # Continue the conversation by sending the response back
    messages = [
        {"role": "user", "content": original_query},
        {"role": "assistant", "content": response.content},
    ]
    continuation = client.messages.create(
        model="claude-opus-4-6",
        messages=messages,
        tools=[{"type": "web_search_20250305", "name": "web_search"}],
    )
```

For robust production code, implement a loop that handles multiple consecutive `pause_turn` responses [1]:

```python
def handle_server_tool_conversation(client, user_query, tools, max_continuations=5):
    """
    Handle server tool conversations that may require multiple continuations.
    """
    messages = [{"role": "user", "content": user_query}]

    for _ in range(max_continuations):
        response = client.messages.create(
            model="claude-opus-4-6", messages=messages, tools=tools
        )

        if response.stop_reason != "pause_turn":
            return response

        # Replace full message list to maintain alternating roles
        messages = [
            {"role": "user", "content": user_query},
            {"role": "assistant", "content": response.content},
        ]

    return response  # Return last response if max continuations reached
```

The response structure when `pause_turn` occurs may include incomplete server tool execution [1]:

```json
{
  "id": "msg_01234",
  "type": "message",
  "role": "assistant",
  "content": [
    {
      "type": "server_tool_use",
      "id": "srvtoolu_abc123",
      "name": "web_search",
      "input": {"query": "AI news 2026"}
    }
    // Note: No server_tool_result block yet
  ],
  "stop_reason": "pause_turn",
  "usage": {...}
}
```

## Common Patterns

**Comprehensive stop reason handler** — Production applications should handle all possible stop reasons systematically [1]:

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

**Web search with continuation** — A complete example for web search that handles pauses [2]:

```python
response = client.messages.create(
    model="claude-3-7-sonnet-latest",
    max_tokens=1024,
    messages=[
        {
            "role": "user",
            "content": "Search for comprehensive information about quantum computing",
        }
    ],
    tools=[{"type": "web_search_20250305", "name": "web_search", "max_uses": 10}],
)

if response.stop_reason == "pause_turn":
    messages = [
        {"role": "user", "content": "Search for comprehensive information..."},
        {"role": "assistant", "content": response.content},
    ]
    continuation = client.messages.create(
        model="claude-3-7-sonnet-latest",
        max_tokens=1024,
        messages=messages,
        tools=[{"type": "web_search_20250305", "name": "web_search", "max_uses": 10}],
    )
```

**Streaming considerations** — When streaming, `stop_reason` is `null` in the initial `message_start` event and only provided in the `message_delta` event [1]:

```python
with client.messages.stream(...) as stream:
    for event in stream:
        if event.type == "message_delta":
            stop_reason = event.delta.stop_reason
            if stop_reason == "pause_turn":
                # Handle continuation
                pass
```

## Gotchas

- **Not the same as `tool_use`** — The `tool_use` stop reason is for client tools where you must execute the tool and return results. `pause_turn` is for server tools where Anthropic handles execution but needs you to continue the conversation [1][2]. Confusing these leads to incorrect handling.

- **Incomplete server_tool_use blocks** — When `pause_turn` occurs, the response may contain a `server_tool_use` block without a corresponding `server_tool_result` [1]. Do not try to provide a result yourself; simply continue the conversation.

- **Multi-turn encrypted content** — When using web search across multiple turns, encrypted content and indices from search results must be passed back in the `web_search_tool_result` blocks to maintain context and citations [3]. This happens automatically when you pass `response.content` back.

- **Mixing client and server tools** — Issues can arise when combining server tools like web search with custom client tools. The `server_tool_use` blocks may be incorrectly converted to regular `tool_use` blocks by some SDKs, and `web_search_tool_result` blocks may be dropped [3]. Test your implementation carefully.

- **Max continuations** — Always set a maximum number of continuation attempts to prevent infinite loops. The example patterns show `max_continuations=5` as a reasonable default [1].

- **Tool inclusion in continuation** — When continuing after `pause_turn`, you must include the same tools in the continuation request to maintain functionality [2]. Omitting tools will cause the continuation to fail.

- **Framework compatibility** — Some third-party frameworks like Pydantic AI have had issues correctly handling `pause_turn`, resulting in 400 errors when using long-running built-in tools [3]. Check your framework's documentation or use the raw Anthropic SDK.

## Sources

[1] **Handling stop reasons - Claude API Docs**
    URL: https://platform.claude.com/docs/en/build-with-claude/handling-stop-reasons
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Complete documentation on all stop reasons including pause_turn, code examples for handling each stop reason, iteration limit details (10 iterations default), and best practices for continuation loops.

[2] **How to implement tool use - Claude API Docs**
    URL: https://platform.claude.com/docs/en/agents-and-tools/tool-use/implement-tool-use
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Server tool workflow details, handling pause_turn with server tools, code examples for web search continuation, and the difference between client and server tool handling.

[3] **Tool use with Claude - Claude API Docs / GitHub Issues**
    URL: https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Server-side sampling loop behavior, server_tool_use and server_tool_result block structure, multi-turn conversation requirements with encrypted content, and known issues with framework compatibility (Pydantic AI, LiteLLM, Vercel AI SDK).
