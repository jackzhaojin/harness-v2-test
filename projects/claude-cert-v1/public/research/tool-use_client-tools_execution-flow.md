# Tool Execution Flow

**Topic ID:** tool-use.client-tools.execution-flow
**Researched:** 2026-03-01T00:00:00Z

## Overview

The tool execution flow in Claude's API is a multi-step conversation pattern where Claude signals intent to use a tool, pauses for execution, receives results, and then formulates a final response. Unlike server-side tools where Anthropic handles execution, client tools require your application to execute the tool and return results to Claude [1][2]. This workflow forms the foundation of all agentic behaviors with Claude, from simple single-tool calls to complex multi-step chains.

The flow centers on the `stop_reason` field in API responses, which indicates why Claude stopped generating. When Claude wants to use a tool, the response includes `stop_reason: "tool_use"` along with one or more `tool_use` content blocks specifying which tools to call and with what parameters [1][3]. Your application executes these tools, then continues the conversation by sending `tool_result` content blocks back to Claude, who uses that information to craft its final answer.

Understanding this flow is critical because improper handling of the request/response cycle is one of the most common sources of errors when building tool-enabled applications. The ordering of content blocks, the matching of tool use IDs, and the handling of edge cases like truncation or parallel calls all require precise implementation [2].

## Key Concepts

- **stop_reason** — A field in every Messages API response indicating why Claude stopped generating. Key values include `end_turn` (natural completion), `tool_use` (awaiting tool execution), `max_tokens` (hit token limit), `pause_turn` (server tool iteration limit), and `refusal` (safety concerns) [3].

- **tool_use content block** — A response block containing `id` (unique identifier for matching results), `name` (which tool to call), and `input` (parameters conforming to the tool's input_schema). Appears when Claude decides to invoke a tool [1][2].

- **tool_result content block** — A user message block containing the executed tool's output. Must include `tool_use_id` (matching the original tool call's id), `content` (the result as string, nested blocks, or document blocks), and optionally `is_error: true` for failed executions [2].

- **tool_choice parameter** — Controls Claude's tool usage behavior: `auto` (Claude decides), `any` (must use one tool), `tool` (must use specific tool), or `none` (no tool use). Note that `any` and `tool` are incompatible with extended thinking [2].

- **parallel tool use** — Claude can invoke multiple tools simultaneously in a single response. All `tool_use` blocks appear in one assistant message, and all corresponding `tool_result` blocks must be returned in a single subsequent user message [2].

- **client tools vs server tools** — Client tools execute on your systems and require you to handle the tool_use/tool_result cycle. Server tools (like web search) execute on Anthropic's servers in a sampling loop and may return `pause_turn` if iteration limits are reached [1].

## Technical Details

### The Core Execution Cycle

The standard tool execution flow consists of four steps [1][2]:

1. **Request with tools defined**: Send a message including the `tools` parameter with tool definitions (name, description, input_schema) and a user prompt.

2. **Claude responds with tool_use**: If Claude determines a tool would help, the response has `stop_reason: "tool_use"` and contains `tool_use` blocks.

3. **Execute and return results**: Extract the tool name, id, and input. Run your tool implementation. Send a new user message containing `tool_result` blocks.

4. **Claude generates final response**: Claude incorporates the tool results into its final answer with `stop_reason: "end_turn"`.

```python
# Example tool execution loop [2]
def complete_tool_workflow(client, user_query, tools):
    messages = [{"role": "user", "content": user_query}]

    while True:
        response = client.messages.create(
            model="claude-opus-4-6",
            messages=messages,
            tools=tools
        )

        if response.stop_reason == "tool_use":
            # Execute tools and continue
            tool_results = execute_tools(response.content)
            messages.append({"role": "assistant", "content": response.content})
            messages.append({"role": "user", "content": tool_results})
        else:
            # Final response
            return response
```

### Content Block Ordering Requirements

The API enforces strict ordering rules for tool-related content blocks [2]:

1. Tool result blocks **must immediately follow** their corresponding tool use blocks in message history. No intervening messages are allowed.

2. Within a user message containing tool results, `tool_result` blocks must come **first** in the content array. Any text content must come **after** all tool results.

```json
// INCORRECT - will cause 400 error [2]
{
  "role": "user",
  "content": [
    { "type": "text", "text": "Here are the results:" },
    { "type": "tool_result", "tool_use_id": "toolu_01", "content": "..." }
  ]
}

// CORRECT [2]
{
  "role": "user",
  "content": [
    { "type": "tool_result", "tool_use_id": "toolu_01", "content": "..." },
    { "type": "text", "text": "What should I do next?" }
  ]
}
```

### Handling All stop_reason Values

A robust implementation must handle every possible stop_reason [3]:

| stop_reason | Meaning | Action |
|------------|---------|--------|
| `end_turn` | Natural completion | Process the response as final |
| `tool_use` | Claude wants to call tool(s) | Execute tools, return results |
| `max_tokens` | Hit token limit | Retry with higher limit or continue |
| `stop_sequence` | Hit custom stop sequence | Process partial response |
| `pause_turn` | Server tool iteration limit (10) | Continue conversation to resume |
| `refusal` | Safety concerns | Handle gracefully, consider rephrasing |
| `model_context_window_exceeded` | Context limit reached | Response valid but truncated |

```python
# Comprehensive stop_reason handling [3]
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

### Tool Result Content Types

Tool results can be returned in multiple formats [2]:

- **String**: `"content": "15 degrees"`
- **Nested content blocks**: `"content": [{"type": "text", "text": "15 degrees"}]`
- **Images**: `"content": [{"type": "image", "source": {"type": "base64", ...}}]`
- **Documents**: `"content": [{"type": "document", "source": {...}}]`
- **Empty**: Omit content field entirely for void operations

## Common Patterns

### Parallel Tool Execution

When Claude calls multiple tools, all results must be returned in a single user message [2]:

```python
# Claude's response contains multiple tool_use blocks
# Return all results together
tool_results = []
for tool_use in response.content:
    if tool_use.type == "tool_use":
        result = execute_tool(tool_use.name, tool_use.input)
        tool_results.append({
            "type": "tool_result",
            "tool_use_id": tool_use.id,
            "content": result
        })

messages.append({"role": "assistant", "content": response.content})
messages.append({"role": "user", "content": tool_results})  # All results in one message
```

### Error Handling in Tool Results

When tool execution fails, return an error message with `is_error: true` [2]:

```json
{
  "type": "tool_result",
  "tool_use_id": "toolu_01A09q90qw90lq917835lq9",
  "content": "ConnectionError: weather API unavailable (HTTP 500)",
  "is_error": true
}
```

Claude will incorporate this error into its response and may retry or inform the user appropriately. Write descriptive error messages (e.g., "Rate limit exceeded. Retry after 60 seconds.") to help Claude recover [2].

### Handling pause_turn for Server Tools

Server tools may hit their 10-iteration limit [3]:

```python
def handle_server_tool_conversation(client, user_query, tools, max_continuations=5):
    messages = [{"role": "user", "content": user_query}]

    for _ in range(max_continuations):
        response = client.messages.create(
            model="claude-opus-4-6",
            messages=messages,
            tools=tools
        )

        if response.stop_reason != "pause_turn":
            return response

        # Continue by sending response back
        messages = [
            {"role": "user", "content": user_query},
            {"role": "assistant", "content": response.content}
        ]

    return response
```

## Gotchas

- **Empty responses with end_turn**: Sometimes Claude returns empty content with `stop_reason: "end_turn"`. This often happens when you add text immediately after tool results. Never add text blocks right after `tool_result` blocks — Claude learns to expect user input and ends its turn prematurely [3].

- **Separate messages for parallel results**: A common mistake is sending each tool result in a separate user message. This breaks parallel tool use patterns and teaches Claude to avoid parallelism. All results must be in a single user message [2].

- **tool_choice and extended thinking incompatibility**: `tool_choice: {"type": "any"}` and `tool_choice: {"type": "tool", "name": "..."}` are not supported with extended thinking. Only `auto` and `none` work [2].

- **max_tokens truncation during tool_use**: If Claude's response is cut off due to `max_tokens` and contains an incomplete `tool_use` block, you must retry with a higher limit. The incomplete tool call cannot be executed [2].

- **Model behavior differences**: Claude Opus is prompted to think before tool calls and may ask for clarification on missing parameters. Claude Sonnet and Haiku try to use tools more aggressively and may infer missing parameters. Use Opus for complex tool scenarios [2].

- **ID matching is critical**: Every `tool_result` must include a `tool_use_id` that exactly matches the `id` from the corresponding `tool_use` block. Mismatches cause API errors [2].

- **Tool runner simplifies implementation**: The SDK provides a beta Tool Runner that automatically handles the tool call loop, result formatting, and conversation management. Use it for most implementations to avoid manual error handling [2].

## Sources

[1] **Tool use with Claude - Claude API Docs**
    URL: https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Core concepts of client vs server tools, the four-step execution flow, tool types and their differences, how tool use works at a high level.

[2] **How to implement tool use - Claude API Docs**
    URL: https://platform.claude.com/docs/en/agents-and-tools/tool-use/implement-tool-use
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Detailed implementation guidance including tool_use/tool_result content blocks, ordering requirements, parallel tool handling, error handling with is_error, tool_choice options, SDK tool runner, and code examples.

[3] **Handling stop reasons - Claude API Docs**
    URL: https://platform.claude.com/docs/en/api/handling-stop-reasons
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Complete list of stop_reason values (end_turn, tool_use, max_tokens, stop_sequence, pause_turn, refusal, model_context_window_exceeded), handling strategies for each, empty response debugging, streaming considerations.
