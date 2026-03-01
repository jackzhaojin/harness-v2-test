# Tool Results and Response Handling

**Topic ID:** tool-use.basics.tool-results
**Researched:** 2025-02-28T14:30:00Z

## Overview

Tool results are the mechanism by which your application communicates the output of executed tools back to Claude. When Claude decides to use a tool, it returns a `tool_use` content block containing the tool name, a unique identifier, and input parameters. Your application executes the actual tool (calling an API, querying a database, running a calculation), then sends the result back to Claude in a `tool_result` content block. Claude uses this result to formulate its final response to the user.

This request-response cycle is fundamental to how Claude interacts with external systems. Unlike some APIs that use special roles like `tool` or `function`, the Claude API integrates tools directly into the `user` and `assistant` message structure. Messages contain arrays of `text`, `image`, `tool_use`, and `tool_result` blocks, where `user` messages include client content and `tool_result` blocks, while `assistant` messages contain AI-generated content and `tool_use` blocks.

Understanding tool results is critical for building reliable agent systems. Proper handling ensures Claude receives accurate information to complete tasks, while improper formatting leads to API errors and broken conversations. The tool result mechanism also supports error handling, allowing you to communicate tool failures back to Claude so it can adapt its approach.

## Key Concepts

- **`tool_use` block**: Returned by Claude when it wants to invoke a tool. Contains `id` (unique identifier), `name` (tool name), and `input` (parameters matching the tool's input_schema).

- **`tool_result` block**: Sent by your application after executing a tool. Must include `tool_use_id` (matching the original `id`), `content` (the result), and optionally `is_error: true` for failures.

- **`stop_reason: "tool_use"`**: Indicates Claude's response contains one or more tool requests that need execution before continuing.

- **Conversation continuity**: After receiving tool results, Claude continues generating a response to the original user prompt, incorporating the tool data.

- **Parallel tool calls**: Claude can request multiple tools in a single response. All corresponding `tool_result` blocks must be returned in a single user message.

- **Tool result content types**: Results can be strings, arrays of content blocks (text, image, document), or empty. Strings are converted to text blocks automatically.

- **Error signaling**: Setting `is_error: true` on a `tool_result` tells Claude the tool failed, allowing it to respond appropriately or retry.

- **`stop_reason: "pause_turn"`**: For server-side tools, indicates the API paused a long-running operation. Continue by sending the response back to Claude.

- **`stop_reason: "max_tokens"`**: If a response is truncated during tool use, retry with higher `max_tokens` to get the complete tool call.

## Technical Details

### Tool Use Response Structure

When Claude decides to use a tool, the response includes:

```json
{
  "id": "msg_01Aq9w938a90dw8q",
  "model": "claude-opus-4-6",
  "stop_reason": "tool_use",
  "role": "assistant",
  "content": [
    {
      "type": "text",
      "text": "I'll check the current weather in San Francisco for you."
    },
    {
      "type": "tool_use",
      "id": "toolu_01A09q90qw90lq917835lq9",
      "name": "get_weather",
      "input": { "location": "San Francisco, CA", "unit": "celsius" }
    }
  ]
}
```

### Tool Result Format

Return results in a new user message with `tool_result` blocks:

```json
{
  "role": "user",
  "content": [
    {
      "type": "tool_result",
      "tool_use_id": "toolu_01A09q90qw90lq917835lq9",
      "content": "15 degrees"
    }
  ]
}
```

### Rich Content in Tool Results

Tool results support multimodal content:

```json
{
  "type": "tool_result",
  "tool_use_id": "toolu_01A09q90qw90lq917835lq9",
  "content": [
    { "type": "text", "text": "15 degrees" },
    {
      "type": "image",
      "source": {
        "type": "base64",
        "media_type": "image/jpeg",
        "data": "/9j/4AAQSkZJRg..."
      }
    }
  ]
}
```

### Error Handling

Signal tool execution failures with `is_error`:

```json
{
  "type": "tool_result",
  "tool_use_id": "toolu_01A09q90qw90lq917835lq9",
  "content": "ConnectionError: the weather service API is not available (HTTP 500)",
  "is_error": true
}
```

### Parallel Tool Results

When Claude makes parallel tool calls, return all results in one message:

```json
{
  "role": "user",
  "content": [
    {
      "type": "tool_result",
      "tool_use_id": "toolu_01",
      "content": "San Francisco: 68°F, partly cloudy"
    },
    {
      "type": "tool_result",
      "tool_use_id": "toolu_02",
      "content": "New York: 45°F, clear skies"
    }
  ]
}
```

## Common Patterns

### Basic Tool Execution Loop

```python
response = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=1024,
    tools=tools,
    messages=[{"role": "user", "content": user_query}]
)

while response.stop_reason == "tool_use":
    # Extract tool calls and execute
    tool_results = []
    for block in response.content:
        if block.type == "tool_use":
            result = execute_tool(block.name, block.input)
            tool_results.append({
                "type": "tool_result",
                "tool_use_id": block.id,
                "content": result
            })

    # Send results back
    messages.append({"role": "assistant", "content": response.content})
    messages.append({"role": "user", "content": tool_results})
    response = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=1024,
        tools=tools,
        messages=messages
    )
```

### Using the SDK Tool Runner (Recommended)

The Anthropic SDK provides a tool runner that handles the loop automatically:

```python
from anthropic import beta_tool

@beta_tool
def get_weather(location: str, unit: str = "fahrenheit") -> str:
    """Get the current weather in a given location."""
    return json.dumps({"temperature": "20°C", "condition": "Sunny"})

runner = client.beta.messages.tool_runner(
    model="claude-opus-4-6",
    max_tokens=1024,
    tools=[get_weather],
    messages=[{"role": "user", "content": "What's the weather in Paris?"}]
)

final_message = runner.until_done()
```

### Handling Truncated Responses

```python
if response.stop_reason == "max_tokens":
    last_block = response.content[-1]
    if last_block.type == "tool_use":
        # Retry with higher limit
        response = client.messages.create(
            model="claude-opus-4-6",
            max_tokens=4096,
            messages=messages,
            tools=tools
        )
```

## Gotchas

- **Tool results must come first**: In user messages containing tool results, `tool_result` blocks must appear before any text blocks. Placing text first causes a 400 error.

- **Separate messages break parallel tool use**: Sending tool results in separate user messages (one per result) "teaches" Claude to avoid parallel calls. Always send all results in a single message.

- **IDs must match exactly**: The `tool_use_id` in your result must match the `id` from Claude's tool use request. Mismatches cause errors.

- **Every tool_use needs a tool_result**: If Claude requests a tool and you don't return a result, subsequent requests will fail with "tool result block missing" errors.

- **Tool definitions must persist**: Include the same `tools` array in every request of a conversation that uses tools. Omitting it causes errors about missing tool definitions.

- **Return strings, not primitives**: Tool results must be strings. Convert JSON objects with `json.dumps()`, and convert numbers/booleans to strings.

- **Empty results are valid**: You can omit `content` entirely for tools that perform actions without returning data.

- **Error messages should be instructive**: Instead of generic errors like "failed", include what went wrong and recovery hints: "Rate limit exceeded. Retry after 60 seconds."

- **Claude may retry on errors**: If you return `is_error: true`, Claude typically attempts 2-3 retries with corrected parameters before giving up.

- **Strict mode eliminates validation errors**: Using `strict: true` on tool definitions guarantees tool inputs match your schema, preventing missing parameter errors entirely.

## Sources

- [How to implement tool use - Claude API Docs](https://platform.claude.com/docs/en/agents-and-tools/tool-use/implement-tool-use) — Comprehensive guide to tool result formatting, error handling, parallel tool use, and the SDK tool runner
- [Tool use with Claude - Claude API Docs](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview) — Overview of tool use concepts, client vs server tools, content block structure, and pricing
- [Tool use - Amazon Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-anthropic-claude-messages-tool-use.html) — Amazon's implementation details for Claude tool use, including request/response cycle examples
