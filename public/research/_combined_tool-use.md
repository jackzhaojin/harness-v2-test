# Combined Research: Tool Use and Function Calling


---

# Tool Definitions and Input Schemas

**Topic ID:** tool-use.basics.tool-definitions
**Researched:** 2026-02-28T12:00:00Z

## Overview

Tool definitions are the contract between your application and Claude that specify which operations Claude can request. When you include tools in a Messages API request, Claude evaluates whether any tool can help answer the user's query and, if so, constructs a properly formatted tool use request with parameters matching your schema. This capability transforms Claude from a text-only assistant into an agent that can interact with external systems, databases, APIs, and real-world services.

Each tool definition consists of three core components: a `name` that identifies the tool, a `description` that tells Claude when and how to use it, and an `input_schema` that defines the expected parameters using JSON Schema format. The quality of these definitions directly impacts Claude's ability to select the right tool and provide valid parameters. Poor descriptions lead to incorrect tool selection; weak schemas lead to invalid parameters that break your functions.

Tool definitions are specified in the `tools` top-level parameter of the API request. Claude processes these definitions alongside your system prompt to understand what capabilities are available. When Claude decides to use a tool, the response includes a `tool_use` content block with the tool name and generated input parameters. Your application then executes the actual function and returns results to Claude via a `tool_result` block to continue the conversation.

## Key Concepts

- **`name`**: The unique identifier for the tool. Must match the regex `^[a-zA-Z0-9_-]{1,64}$`. Use descriptive, namespaced names (e.g., `github_list_prs`, `slack_send_message`) especially when tools span multiple services.

- **`description`**: A detailed plaintext explanation of what the tool does, when it should be used, and how it behaves. This is the most important factor in tool performance. Aim for 3-4 sentences minimum; more for complex tools.

- **`input_schema`**: A JSON Schema object defining the expected parameters. Must have `type: "object"` at the root level with `properties` defining each parameter.

- **`required` array**: Lists which parameters must be provided. Parameters not listed are optional. Claude may infer values for missing optional parameters based on context.

- **`strict` mode**: When set to `true`, guarantees that Claude's tool inputs exactly match your schema through constrained decoding. Eliminates type mismatches and missing required fields.

- **`input_examples`**: Optional array of example input objects that help Claude understand complex tools with nested objects, optional parameters, or format-sensitive inputs. Each example must validate against the `input_schema`.

- **`additionalProperties`**: Must be set to `false` when using strict mode. This prevents Claude from adding unexpected fields to the tool input.

- **`tool_choice`**: Controls whether Claude must use a tool. Options: `auto` (default, Claude decides), `any` (must use one tool), `tool` (must use specific tool), `none` (cannot use tools).

## Technical Details

### Basic Tool Definition Structure

```json
{
  "name": "get_weather",
  "description": "Get the current weather in a given location. Returns temperature and conditions. Use when the user asks about current weather, not forecasts.",
  "input_schema": {
    "type": "object",
    "properties": {
      "location": {
        "type": "string",
        "description": "The city and state, e.g. San Francisco, CA"
      },
      "unit": {
        "type": "string",
        "enum": ["celsius", "fahrenheit"],
        "description": "The unit of temperature"
      }
    },
    "required": ["location"]
  }
}
```

### Supported JSON Schema Types

The `input_schema` supports standard JSON Schema with some limitations:

| Type | Notes |
|------|-------|
| `string` | Supports `enum`, `const`, and formats: `date-time`, `time`, `date`, `duration`, `email`, `hostname`, `uri`, `ipv4`, `ipv6`, `uuid` |
| `integer` | Basic integer type |
| `number` | Floating point numbers |
| `boolean` | True/false values |
| `object` | Nested objects with `properties`; must set `additionalProperties: false` in strict mode |
| `array` | Arrays with `items` schema; `minItems` supports only 0 or 1 |
| `null` | Null values |

### Strict Mode Configuration

Enable guaranteed schema validation by adding `strict: true`:

```json
{
  "name": "search_flights",
  "description": "Search for available flights",
  "strict": true,
  "input_schema": {
    "type": "object",
    "properties": {
      "destination": {"type": "string"},
      "departure_date": {"type": "string", "format": "date"},
      "passengers": {"type": "integer", "enum": [1, 2, 3, 4, 5, 6]}
    },
    "required": ["destination", "departure_date"],
    "additionalProperties": false
  }
}
```

### Input Examples

For complex tools, provide concrete examples:

```json
{
  "name": "complex_query",
  "description": "Execute a complex database query",
  "input_schema": { ... },
  "input_examples": [
    {"filter": {"status": "active"}, "limit": 10},
    {"filter": {"created_after": "2025-01-01"}, "sort": "desc"}
  ]
}
```

### API Response Structure

When Claude uses a tool, the response contains:

```json
{
  "stop_reason": "tool_use",
  "content": [
    {
      "type": "text",
      "text": "I'll check the weather for you."
    },
    {
      "type": "tool_use",
      "id": "toolu_01A09q90qw90lq917835lq9",
      "name": "get_weather",
      "input": {"location": "San Francisco, CA", "unit": "celsius"}
    }
  ]
}
```

## Common Patterns

### Multiple Related Tools

Group related operations and use consistent naming:

```python
tools = [
    {
        "name": "database_query",
        "description": "Execute a read-only database query...",
        "input_schema": {...}
    },
    {
        "name": "database_insert",
        "description": "Insert a new record...",
        "input_schema": {...}
    }
]
```

### Forcing Specific Tool Use

Use `tool_choice` to require a particular tool:

```python
response = client.messages.create(
    model="claude-opus-4-6",
    tools=[...],
    tool_choice={"type": "tool", "name": "get_weather"},
    messages=[...]
)
```

### Parallel Tool Calls

Claude can call multiple tools simultaneously when operations are independent. All tool results must be returned in a single user message:

```json
{
  "role": "user",
  "content": [
    {"type": "tool_result", "tool_use_id": "toolu_01", "content": "Result 1"},
    {"type": "tool_result", "tool_use_id": "toolu_02", "content": "Result 2"}
  ]
}
```

### SDK Helpers

Python and TypeScript SDKs provide helpers for schema generation:

```python
# Python with Pydantic
from pydantic import BaseModel

class WeatherInput(BaseModel):
    location: str
    unit: str = "celsius"

# SDK automatically transforms to JSON Schema
```

```typescript
// TypeScript with Zod
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

const WeatherInput = z.object({
  location: z.string(),
  unit: z.enum(["celsius", "fahrenheit"])
});
```

## Gotchas

- **Description quality matters most**: Vague descriptions like "Gets stock price" cause poor tool selection. Write detailed descriptions explaining what the tool does, when to use it, what it returns, and any limitations.

- **`additionalProperties: false` is required for strict mode**: Without this, strict validation fails with a 400 error.

- **Missing required parameters**: If Claude provides invalid tool calls (missing parameters), it usually means the description lacks sufficient detail. Add more context to your descriptions rather than just relying on parameter names.

- **Claude may infer missing optional parameters**: Especially Claude Sonnet, which tends to guess reasonable values rather than asking for clarification. Claude Opus is more likely to ask for missing information.

- **Tool result formatting**: Tool results must immediately follow tool use blocks. In the content array, `tool_result` blocks must come BEFORE any text content.

- **Schema complexity limits**: Strict mode has limits: max 20 strict tools per request, max 24 total optional parameters across all strict schemas, max 16 parameters with union types. Exceeding these returns a 400 error.

- **First request latency**: Strict mode requires grammar compilation on first use of a schema. Subsequent requests are faster due to 24-hour caching.

- **Unsupported schema features**: `minimum`, `maximum`, `minLength`, `maxLength`, recursive schemas, and complex regex patterns are not supported. SDKs may auto-transform these by moving constraints to descriptions.

- **MCP tool conversion**: When using Model Context Protocol tools, rename `inputSchema` to `input_schema` for Claude compatibility.

- **Parallel tool result ordering**: When returning multiple tool results, all results must be in a single user message. Text content (if any) must come AFTER all tool_result blocks.

## Sources

- [Tool use with Claude - Claude API Docs](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview) — Primary documentation covering tool definition structure, client vs server tools, workflow, and code examples
- [How to implement tool use - Claude API Docs](https://platform.claude.com/docs/en/agents-and-tools/tool-use/implement-tool-use) — Implementation guide with specifying tools, best practices for descriptions, input_examples, tool runner, parallel tool use, and troubleshooting
- [Structured outputs - Claude API Docs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs) — Documentation on strict tool use, JSON Schema limitations, SDK helpers, and schema complexity limits


---

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


---

# Parallel and Sequential Tool Calls

**Topic ID:** tool-use.advanced.parallel-and-sequential
**Researched:** 2025-02-28T12:00:00Z

## Overview

Parallel and sequential tool calling represents a fundamental architectural decision when building LLM-powered agents that interact with external systems. The distinction matters because it directly impacts latency, throughput, and correctness. When an LLM needs to gather data from multiple sources or perform multiple operations, it can either request all tools simultaneously (parallel) or chain them one at a time (sequential).

The performance difference is dramatic: four API calls taking 300ms each complete in roughly 300ms total when parallelized, versus 1.2 seconds when executed sequentially. For user-facing applications, this is the difference between feeling instantaneous (~500ms) and sluggish (3+ seconds). Beyond raw speed, parallel execution enables agents to cross-reference information from many sources without exhausting user patience—a capability essential for complex reasoning tasks.

Both OpenAI and Anthropic models support parallel tool calling by default, though the behavior varies by model family and can be controlled via API parameters. Understanding when to use each pattern—and how to implement hybrid approaches—is essential for building responsive, reliable AI agents.

## Key Concepts

- **Parallel tool calling**: The model requests multiple tool executions in a single response, allowing them to run concurrently. The response contains an array of `tool_calls` (OpenAI) or multiple `tool_use` blocks (Anthropic), each with a unique ID.

- **Sequential tool calling**: Tools execute one at a time, with each call waiting for the previous result before the next request. Required when one tool's output serves as input to another.

- **Data dependencies**: The primary determinant of execution strategy. If Tool B requires output from Tool A, sequential execution is mandatory. Independent operations are candidates for parallelization.

- **`parallel_tool_calls` parameter (OpenAI)**: Controls whether the model can request multiple tools in one turn. Default is `true`. Set to `false` to ensure exactly zero or one tool call per response.

- **`disable_parallel_tool_use` parameter (Anthropic)**: When set to `true` with `tool_choice: auto`, ensures Claude uses at most one tool. With `tool_choice: any` or `tool`, ensures exactly one tool.

- **Tool result correlation**: Each tool result must reference the original tool call's ID. OpenAI uses `tool_call_id`, Anthropic uses `tool_use_id`. Mismatched IDs cause API errors.

- **Hybrid execution**: Many workflows combine both patterns—parallel data gathering followed by sequential analysis. This maximizes throughput while respecting logical dependencies.

- **Error isolation**: In parallel execution, one failed tool shouldn't necessarily abort others. Use `return_exceptions=True` with `asyncio.gather()` to handle failures individually.

## Technical Details

### OpenAI API Structure

When the model requests parallel tool calls, the response contains multiple entries in the `tool_calls` array:

```json
{
  "role": "assistant",
  "tool_calls": [
    {"id": "call_abc123", "function": {"name": "get_weather", "arguments": "{\"location\": \"Tokyo\"}"}},
    {"id": "call_def456", "function": {"name": "get_weather", "arguments": "{\"location\": \"Paris\"}"}},
    {"id": "call_ghi789", "function": {"name": "get_time", "arguments": "{\"timezone\": \"Asia/Tokyo\"}"}}
  ]
}
```

You must return all results in a single user message, each referencing the corresponding `tool_call_id`:

```python
messages.append({
    "tool_call_id": "call_abc123",
    "role": "tool",
    "name": "get_weather",
    "content": '{"temperature": "10", "unit": "celsius"}'
})
```

### Anthropic API Structure

Claude returns multiple `tool_use` blocks within the assistant's content array:

```json
{
  "role": "assistant",
  "content": [
    {"type": "text", "text": "I'll check both locations."},
    {"type": "tool_use", "id": "toolu_01A", "name": "get_weather", "input": {"location": "Tokyo"}},
    {"type": "tool_use", "id": "toolu_01B", "name": "get_time", "input": {"location": "Tokyo"}}
  ]
}
```

Results must be provided in a user message with corresponding `tool_result` blocks:

```python
{
    "role": "user",
    "content": [
        {"type": "tool_result", "tool_use_id": "toolu_01A", "content": "10°C, cloudy"},
        {"type": "tool_result", "tool_use_id": "toolu_01B", "content": "3:15 AM"}
    ]
}
```

### Controlling Parallel Behavior

**OpenAI:**
```python
response = client.chat.completions.create(
    model="gpt-4o",
    messages=messages,
    tools=tools,
    parallel_tool_calls=False  # Force single tool per response
)
```

**Anthropic:**
```python
response = client.messages.create(
    model="claude-sonnet-4-20250514",
    messages=messages,
    tools=tools,
    tool_choice={"type": "auto", "disable_parallel_tool_use": True}
)
```

### Async Execution Pattern

When you receive parallel tool calls, execute them concurrently:

```python
import asyncio

async def execute_tools_parallel(tool_calls):
    tasks = []
    for call in tool_calls:
        if call.function.name == "get_weather":
            tasks.append(fetch_weather(call.function.arguments))
        elif call.function.name == "get_time":
            tasks.append(fetch_time(call.function.arguments))

    results = await asyncio.gather(*tasks, return_exceptions=True)
    return results
```

## Common Patterns

### Pattern 1: Independent Data Gathering
Fetch user profile, preferences, and notifications from separate services simultaneously. All three calls execute in parallel, results combine for a unified response.

### Pattern 2: Multi-Location Queries
"What's the weather in Tokyo, Paris, and New York?" triggers three parallel `get_weather` calls. The model automatically parallelizes identical tool invocations with different parameters.

### Pattern 3: Sequential Dependency Chain
"What's the weather where I am?" requires: (1) `get_location` → returns "San Francisco", (2) `get_weather(location="San Francisco")`. The model correctly sequences these, calling location first, then using its result.

### Pattern 4: Hybrid Workflow
For travel planning: parallel fetch of flights, hotels, and weather data, followed by sequential analysis and recommendation generation. Implementation uses parallel gathering, then feeds combined results to a synthesis step.

### Pattern 5: Fan-Out Analysis
Analyzing multiple code files: spawn parallel analysis tasks for each file, aggregate results, then generate a unified report. Reduces latency from O(n) to O(1) for the analysis phase.

## Gotchas

- **Model support varies**: OpenAI reasoning models (o1, o3-mini, o4-mini) do not support parallel tool calls. Setting `parallel_tool_calls=True` with these models causes errors. GPT-4o and GPT-4o-mini support it.

- **Claude 3.7 Sonnet reluctance**: Claude 3.7 Sonnet may not parallelize even when appropriate. Enabling "token-efficient tool use" beta feature encourages parallel behavior. Claude 4 models parallelize reliably without prompting.

- **Streaming complexity**: Collecting parallel tool calls during streaming is challenging due to overlapping data chunks. Consider non-streaming calls for tool-heavy workloads or implement careful chunk reassembly.

- **ID matching is strict**: Every `tool_use` block requires exactly one corresponding `tool_result` with matching ID. Missing or duplicate results cause API errors.

- **Don't force parallelism on dependencies**: If prompted to call dependent tools in parallel, models may guess downstream parameters incorrectly. Let the model decide execution order based on tool descriptions.

- **Rate limiting risks**: Parallel execution can hit API rate limits faster than sequential. Implement throttling with semaphores when calling external services.

- **Deprecated parameters**: OpenAI's `functions` and `function_call` parameters are deprecated. Use `tools` and `tool_choice` instead (since API version 2023-12-01-preview).

- **Error handling strategy**: Decide upfront whether one failed parallel tool should abort the entire operation or allow others to complete. The `return_exceptions=True` pattern lets you handle each result individually.

## Sources

- [Tool use with Claude - Anthropic Documentation](https://platform.claude.com/docs/en/docs/agents-and-tools/tool-use/overview) — Official Claude documentation covering parallel tool use, the `disable_parallel_tool_use` parameter, and implementation patterns with code examples.

- [How to use function calling with Azure OpenAI - Microsoft Learn](https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/function-calling) — Comprehensive guide on parallel function calling with Azure OpenAI, including multi-function examples and model support matrix.

- [Why Parallel Tool Calling Matters for LLM Agents - CodeAnt](https://www.codeant.ai/blogs/parallel-tool-calling) — Analysis of performance benefits, latency reduction patterns, and implementation strategies for parallel tool execution.

- [Implementing Sequential and Parallel Tool Use - APXML](https://apxml.com/courses/building-advanced-llm-agent-tools/chapter-3-llm-tool-selection-orchestration/sequential-parallel-tool-use) — Course material covering when to use each pattern, hybrid approaches, and agent decision-making for tool orchestration.

- [OpenAI Developer Community - parallel_tool_calls parameter](https://community.openai.com/t/new-api-feature-disable-parallel-function-calling-via-parallel-tool-calls-false/805405) — Community discussion on the `parallel_tool_calls` parameter, model support, and configuration options.


---

# Tool Choice Configuration

**Topic ID:** tool-use.advanced.tool-choice
**Researched:** 2025-03-01T12:00:00Z

## Overview

The `tool_choice` parameter in the Claude API gives developers precise control over when and how Claude uses tools during a conversation. Rather than letting the model decide autonomously every time, you can force tool usage, prevent it entirely, or let Claude make intelligent decisions based on context. This is essential for building reliable applications where tool behavior must be predictable.

Tool choice configuration sits at the intersection of prompt engineering and API architecture. It determines whether Claude will attempt to gather external information, execute structured operations, or simply respond from its training data. The parameter accepts four distinct modes—`auto`, `any`, `tool`, and `none`—each with specific behavioral implications that affect response structure, token usage, and compatibility with other features like extended thinking.

Understanding tool choice is particularly important for agentic workflows. When building chatbots, data extraction pipelines, or multi-step automation systems, the difference between "Claude might use a tool" and "Claude must use this exact tool" can determine whether your application works reliably or fails unpredictably.

## Key Concepts

- **`auto` mode** — The default when tools are provided. Claude decides whether to call any provided tools based on the user's query and its own judgment. Ideal for conversational interfaces where tool use should be contextual.

- **`any` mode** — Forces Claude to use at least one tool from the provided set, but lets it choose which one. Useful for systems where every response must trigger an action (e.g., SMS chatbots where all output goes through a `send_message` tool).

- **`tool` mode** — Forces Claude to always use a specific named tool. Guarantees structured output conforming to a particular schema. Perfect for data extraction or classification pipelines.

- **`none` mode** — Prevents Claude from using any tools, even if tools are provided in the request. The default when no tools are defined. Useful for temporarily disabling tool access in multi-turn conversations.

- **Assistant message prefilling** — When `tool_choice` is set to `any` or `tool`, the API prefills the assistant's response to force tool usage. This means Claude will not emit natural language before the tool call, even if explicitly asked.

- **Extended thinking compatibility** — Only `auto` and `none` modes work with extended thinking. Using `any` or `tool` with extended thinking returns an error.

- **Prompt caching interaction** — Changing `tool_choice` invalidates cached message blocks. Tool definitions and system prompts remain cached, but messages must be reprocessed.

- **Parallel tool control** — The `disable_parallel_tool_use` flag can be combined with `tool_choice` to ensure Claude uses exactly one tool (with `any` or `tool`) or at most one tool (with `auto`).

## Technical Details

### Parameter Syntax

The `tool_choice` parameter is an object with a `type` field, and optionally a `name` field for forcing a specific tool:

```python
# Let Claude decide (default when tools provided)
tool_choice = {"type": "auto"}

# Must use a tool, Claude picks which one
tool_choice = {"type": "any"}

# Must use this specific tool
tool_choice = {"type": "tool", "name": "get_weather"}

# Cannot use any tools
tool_choice = {"type": "none"}
```

### Complete API Example

```python
import anthropic

client = anthropic.Anthropic()

# Force a specific tool for structured data extraction
response = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=1024,
    tools=[
        {
            "name": "extract_sentiment",
            "description": "Extract sentiment scores from text",
            "input_schema": {
                "type": "object",
                "properties": {
                    "positive_score": {"type": "number"},
                    "negative_score": {"type": "number"},
                    "neutral_score": {"type": "number"}
                },
                "required": ["positive_score", "negative_score", "neutral_score"]
            }
        }
    ],
    tool_choice={"type": "tool", "name": "extract_sentiment"},
    messages=[
        {"role": "user", "content": "I absolutely loved this product!"}
    ]
)
```

### Behavioral Differences by Mode

| Mode | Response Start | Natural Language Before Tool | Use Case |
|------|----------------|------------------------------|----------|
| `auto` | Text or tool_use | Yes | Conversational assistants |
| `any` | tool_use only | No (prefilled) | Action-required systems |
| `tool` | tool_use only | No (prefilled) | Structured extraction |
| `none` | Text only | N/A | Knowledge-only responses |

### Combining with Parallel Tool Use

```python
# Ensure exactly one tool is called
response = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=1024,
    tools=[tool1, tool2, tool3],
    tool_choice={"type": "any", "disable_parallel_tool_use": True},
    messages=[{"role": "user", "content": "Process this request"}]
)
```

## Common Patterns

### Pattern 1: Structured JSON Output

Use `tool_choice: {"type": "tool", "name": "..."}` to guarantee JSON output matching a schema:

```python
tools = [{
    "name": "classify_ticket",
    "description": "Classify a support ticket",
    "input_schema": {
        "type": "object",
        "properties": {
            "category": {"type": "string", "enum": ["billing", "technical", "general"]},
            "priority": {"type": "string", "enum": ["low", "medium", "high"]},
            "summary": {"type": "string"}
        },
        "required": ["category", "priority", "summary"]
    }
}]

response = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=1024,
    tools=tools,
    tool_choice={"type": "tool", "name": "classify_ticket"},
    messages=[{"role": "user", "content": ticket_text}]
)
```

### Pattern 2: SMS/Messaging Chatbot

Every response must go through a tool:

```python
tools = [
    {"name": "send_text", "description": "Send text to user", ...},
    {"name": "lookup_order", "description": "Look up order details", ...}
]

response = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=1024,
    tools=tools,
    tool_choice={"type": "any"},  # Must use a tool, picks appropriately
    messages=[{"role": "user", "content": user_message}]
)
```

### Pattern 3: Natural Language with Tool Guidance

When you want Claude to explain its actions but still prefer a tool, use `auto` with explicit instructions:

```python
messages = [
    {
        "role": "user",
        "content": "What's the weather in London? Use the get_weather tool in your response."
    }
]

response = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=1024,
    tools=[get_weather_tool],
    tool_choice={"type": "auto"},  # Allows natural language + tool
    messages=messages
)
```

## Gotchas

- **No natural language with `any`/`tool` modes** — The API prefills the response to force tool usage. If you need Claude to explain what it's doing before calling a tool, use `auto` mode with explicit instructions in the prompt. Many developers expect a conversational lead-in and are surprised when it's absent.

- **Extended thinking incompatibility** — Using `tool_choice: {"type": "any"}` or `tool_choice: {"type": "tool", "name": "..."}` with extended thinking enabled returns an error. Only `auto` and `none` work with extended thinking.

- **Cache invalidation** — Changing `tool_choice` between requests invalidates the message portion of prompt caching. If you're optimizing for cache hits, keep `tool_choice` consistent across related requests.

- **Default values matter** — When tools are provided, the default is `auto`. When no tools are provided, the default is `none`. Explicitly setting `none` when tools are provided actively prevents tool usage.

- **Over-eager tool calling with `auto`** — Claude can be aggressive about calling tools when given the option. Without clear guidance in your system prompt about when to use tools, Claude may call tools for queries it could answer from training data. Add explicit instructions: "Only search the web for queries you cannot confidently answer from existing knowledge."

- **Token overhead varies by mode** — Different `tool_choice` values add different token overhead to system prompts. On newer models, `auto`/`none` adds ~346 tokens while `any`/`tool` adds ~313 tokens.

- **Tool name must match exactly** — When using `{"type": "tool", "name": "..."}`, the name must exactly match a tool defined in the `tools` array. Mismatches cause errors.

## Sources

- [How to implement tool use - Anthropic Documentation](https://platform.claude.com/docs/en/agents-and-tools/tool-use/implement-tool-use) — Comprehensive API reference covering tool_choice parameter, forcing tool use, parallel tools, and behavioral details
- [Tool choice - Claude Cookbook](https://platform.claude.com/cookbook/tool-use-tool-choice) — Practical examples of auto, any, and tool modes with complete code samples and use cases
- [Tool use - Amazon Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-anthropic-claude-messages-tool-use.html) — AWS-specific implementation details and token cost considerations for tool_choice


---

# Strict Tool Use

**Topic ID:** tool-use.advanced.strict-tool-use
**Researched:** 2025-03-01T00:00:00Z

## Overview

Strict tool use is a feature in the Claude API that guarantees tool call parameters conform exactly to your defined JSON schema. When you set `strict: true` on a tool definition, Claude uses constrained decoding to ensure that every function call includes correctly-typed arguments—eliminating parsing errors, type mismatches, and missing required fields that can break production agents.

Without strict mode, Claude might return `passengers: "two"` or `passengers: "2"` when your function expects an integer. With strict tool use enabled, the response will always contain `passengers: 2`. This guarantee is achieved through grammar compilation: rather than prompting the model to produce valid JSON, Anthropic compiles your JSON schema into a grammar that physically restricts token generation during inference. The model literally cannot produce tokens that would violate your schema.

Strict tool use is distinct from but complementary to JSON outputs (`output_config.format`). JSON outputs control Claude's response format (what Claude says), while strict tool use validates tool parameters (how Claude calls your functions). Both can be used together in agentic workflows requiring reliable tool calls and structured final outputs.

## Key Concepts

- **Constrained Decoding**: The underlying mechanism that compiles JSON schemas into grammars to restrict token generation. Unlike prompt-based approaches, this provides hard guarantees rather than best-effort compliance.

- **`strict: true` Parameter**: A top-level property added to tool definitions alongside `name`, `description`, and `input_schema`. Enables schema enforcement for that specific tool.

- **Schema Validation**: When enabled, both the tool `name` and `input` fields are guaranteed valid—the name matches provided tools, and inputs strictly follow `input_schema`.

- **Grammar Caching**: Compiled grammars are cached for 24 hours from last use. First requests incur 100-300ms compilation overhead; subsequent requests are faster.

- **Compatibility with Tool Choice**: Strict mode works with all tool choice modes (`auto`, `any`, `tool`). The schema enforcement applies regardless of how tools are selected.

- **Required vs Optional Fields**: All fields should be marked as `required` when possible. Optional parameters roughly double the grammar's state space, contributing to complexity limits.

- **`additionalProperties: false`**: Must be set on all objects in strict schemas. This prevents Claude from adding unexpected fields to tool inputs.

## Technical Details

### Enabling Strict Tool Use

Add `strict: true` to individual tool definitions:

```python
response = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Book a flight to Tokyo"}],
    tools=[{
        "name": "book_flight",
        "description": "Book a flight to a destination",
        "strict": True,  # Enable strict mode
        "input_schema": {
            "type": "object",
            "properties": {
                "destination": {"type": "string"},
                "passengers": {"type": "integer", "enum": [1, 2, 3, 4, 5]},
                "class": {"type": "string", "enum": ["economy", "business"]}
            },
            "required": ["destination", "passengers", "class"],
            "additionalProperties": False
        }
    }]
)
```

### Schema Complexity Limits

| Limit | Value | Description |
|-------|-------|-------------|
| Strict tools per request | 20 | Maximum tools with `strict: true` |
| Optional parameters | 24 | Total optional params across all strict schemas |
| Union type parameters | 16 | Parameters using `anyOf` or type arrays |

### Supported JSON Schema Features

- Basic types: `object`, `array`, `string`, `integer`, `number`, `boolean`, `null`
- `enum` (strings, numbers, bools, nulls only)
- `const`, `anyOf`, `allOf`
- `$ref`, `$def`, `definitions` (internal only)
- String formats: `date-time`, `time`, `date`, `duration`, `email`, `hostname`, `uri`, `ipv4`, `ipv6`, `uuid`
- `required` and `additionalProperties: false`

### Unsupported Features

- Recursive schemas
- External `$ref` (e.g., `'$ref': 'http://...'`)
- Numerical constraints (`minimum`, `maximum`, `multipleOf`)
- String constraints (`minLength`, `maxLength`)
- Array constraints beyond `minItems` of 0 or 1
- `additionalProperties` set to anything other than `false`

## Common Patterns

### Multi-Tool Agent with Guaranteed Parameters

```python
tools = [
    {
        "name": "search_flights",
        "strict": True,
        "input_schema": {
            "type": "object",
            "properties": {
                "origin": {"type": "string"},
                "destination": {"type": "string"},
                "date": {"type": "string", "format": "date"}
            },
            "required": ["origin", "destination", "date"],
            "additionalProperties": False
        }
    },
    {
        "name": "book_hotel",
        "strict": True,
        "input_schema": {
            "type": "object",
            "properties": {
                "city": {"type": "string"},
                "check_in": {"type": "string", "format": "date"},
                "guests": {"type": "integer", "enum": [1, 2, 3, 4]}
            },
            "required": ["city", "check_in", "guests"],
            "additionalProperties": False
        }
    }
]
```

### Combining Strict Tools with JSON Output

```python
response = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Plan my trip to Paris"}],
    output_config={
        "format": {
            "type": "json_schema",
            "schema": {
                "type": "object",
                "properties": {
                    "summary": {"type": "string"},
                    "next_steps": {"type": "array", "items": {"type": "string"}}
                },
                "required": ["summary", "next_steps"],
                "additionalProperties": False
            }
        }
    },
    tools=[{
        "name": "search_flights",
        "strict": True,
        "input_schema": {...}
    }]
)
```

### Versioned Tools for Safe Rollouts

```python
# Keep old version during rollout
tools = [
    {"name": "get_weather_v1", "strict": True, ...},
    {"name": "get_weather_v2", "strict": True, ...}  # New version
]
```

## Gotchas

- **Schema Compliance ≠ Accuracy**: Strict mode guarantees the JSON structure is valid, not that the content is correct. A `passengers: 2` response is schema-compliant but may not reflect user intent. Keep temperature low (0.0-0.2) for factual tasks.

- **First Request Latency**: Initial requests with a new schema incur 100-300ms overhead for grammar compilation. Warm caches during deployment by making a test request with your schema.

- **Refusals Override Schema**: When Claude refuses for safety reasons (`stop_reason: "refusal"`), the response may not match your schema. Always check `stop_reason` before parsing.

- **Token Limits Truncate Output**: If `max_tokens` is insufficient, output may be incomplete (`stop_reason: "max_tokens"`). The truncated response won't match your schema.

- **Optional Parameters Are Expensive**: Each optional parameter roughly doubles grammar state space. Mark parameters as `required` where possible, or accept a reasonable default value from Claude.

- **No Numerical Constraints**: `minimum`, `maximum`, and similar constraints aren't enforced by the schema. Use post-response validation for these checks.

- **Citations Incompatibility**: Strict tool use works, but JSON outputs (`output_config.format`) returns 400 when citations are enabled.

- **Cache Invalidation**: Changing tool sets invalidates the grammar cache. Adding or removing strict tools causes recompilation on next request.

- **Input Token Overhead**: An additional system prompt explaining the expected format is injected, adding 50-200 tokens to input costs. This is typically offset by eliminating retry logic.

- **Property Ordering**: Required properties appear first in output, followed by optional properties in schema order—not necessarily the order defined in your schema.

## Sources

- [Structured outputs - Claude API Docs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs) — Official documentation covering strict tool use, JSON outputs, schema limitations, and SDK helpers
- [Claude API Structured Output: Complete Guide | Thomas Wiegold](https://thomas-wiegold.com/blog/claude-api-structured-output/) — Practical implementation guide with latency considerations and production best practices
- [Hands-On with Anthropic's Structured Output | Towards Data Science](https://towardsdatascience.com/hands-on-with-anthropics-new-structured-output-capabilities/) — Real-world implementation patterns, Pydantic integration, and common gotchas
- [The guide to structured outputs and function calling with LLMs | Agenta](https://agenta.ai/blog/the-guide-to-structured-outputs-and-function-calling-with-llms) — Cross-provider comparison and best practices for schema design


---

# Web Search and Web Fetch Tools

**Topic ID:** tool-use.server-tools.web-search-fetch
**Researched:** 2026-03-01T12:00:00Z

## Overview

Web search and web fetch are server-side tools that enable Claude to access real-time information from the internet during API conversations. These tools address a fundamental limitation of LLMs: static training data with knowledge cutoffs. By enabling on-demand access to current web content, developers can build applications that provide up-to-date information, verify facts against live sources, and ground responses in authoritative documentation.

The web search tool allows Claude to query the web and receive search results, automatically citing sources in its responses. The web fetch tool retrieves full content from specific URLs, including web pages and PDF documents. Together, they enable powerful information retrieval workflows—Claude can search for relevant sources, then fetch and analyze the most promising results in detail.

Both tools are classified as "server tools" because Anthropic's infrastructure executes the actual searches and fetches. This differs from client-side tools where the developer's application handles tool execution. The server-side approach simplifies integration while providing built-in security controls like domain filtering and usage limits.

## Key Concepts

- **Server tool execution**: Unlike standard tool use where the client executes tools, web search and web fetch are executed by Anthropic's servers. Claude sends a `server_tool_use` block, and results appear as `web_search_tool_result` or `web_fetch_tool_result` blocks automatically.

- **Dynamic filtering**: With tool versions `web_search_20260209` and `web_fetch_20260209`, Claude can write and execute code to filter results before they reach the context window. This keeps only relevant information, reducing token costs while improving response quality.

- **Citation support**: Web search always includes citations linking response text to source URLs. Web fetch offers optional citations via the `citations.enabled` parameter. Citations include the source URL, title, and a snippet of the cited text.

- **Domain controls**: Both tools support `allowed_domains` and `blocked_domains` parameters for restricting which sites Claude can access. These work at both request and organization levels.

- **URL validation (web fetch)**: For security, web fetch can only access URLs that have previously appeared in the conversation—user messages, previous tool results, or URLs from web search. Claude cannot fetch arbitrary URLs it generates.

- **Content types**: Web fetch supports HTML pages (converted to text) and PDF documents (with automatic text extraction). JavaScript-rendered content is not supported.

- **Zero Data Retention (ZDR)**: Both tools are ZDR-eligible, meaning data is not stored after the API response returns when your organization has a ZDR arrangement.

## Technical Details

### Tool Definitions

**Web Search Tool:**
```json
{
  "type": "web_search_20250305",
  "name": "web_search",
  "max_uses": 5,
  "allowed_domains": ["docs.example.com"],
  "blocked_domains": ["untrusted.com"],
  "user_location": {
    "type": "approximate",
    "city": "San Francisco",
    "region": "California",
    "country": "US",
    "timezone": "America/Los_Angeles"
  }
}
```

**Web Fetch Tool:**
```json
{
  "type": "web_fetch_20250910",
  "name": "web_fetch",
  "max_uses": 10,
  "allowed_domains": ["example.com"],
  "blocked_domains": ["private.example.com"],
  "citations": { "enabled": true },
  "max_content_tokens": 100000
}
```

### Supported Models

Both tools work with Claude Opus 4.x, Sonnet 4.x and 3.7, and Haiku 4.5 and 3.5. Dynamic filtering (latest tool versions) requires Opus 4.6 or Sonnet 4.6 and the code execution tool.

### Response Structure

Search results include `url`, `title`, `page_age`, and `encrypted_content`. The encrypted content must be passed back in multi-turn conversations for citations to work.

Fetch results include the full document content, either as plain text or base64-encoded PDF data, plus a `retrieved_at` timestamp.

### Error Handling

Errors return within a 200 response (not as HTTP errors):
```json
{
  "type": "web_search_tool_result",
  "content": {
    "type": "web_search_tool_result_error",
    "error_code": "max_uses_exceeded"
  }
}
```

Common error codes: `too_many_requests`, `invalid_input`, `max_uses_exceeded`, `url_not_accessible`, `unsupported_content_type`.

### Pricing

- **Web search**: $10 per 1,000 searches, plus standard token costs for search results
- **Web fetch**: No additional cost beyond standard token costs for fetched content

Token estimates: average web page ~2,500 tokens; large documentation page ~25,000 tokens; research paper PDF ~125,000 tokens.

## Common Patterns

### Search Then Fetch Workflow

The most powerful pattern combines both tools for comprehensive research:

```python
response = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=4096,
    messages=[{
        "role": "user",
        "content": "Find recent articles about quantum computing and analyze the most relevant one"
    }],
    tools=[
        {"type": "web_search_20250305", "name": "web_search", "max_uses": 3},
        {"type": "web_fetch_20250910", "name": "web_fetch", "max_uses": 5,
         "citations": {"enabled": True}}
    ]
)
```

Claude will search for articles, select promising results, fetch full content, and provide cited analysis.

### Domain-Restricted Research

For applications requiring authoritative sources only:

```python
tools=[{
    "type": "web_search_20250305",
    "name": "web_search",
    "allowed_domains": ["docs.aws.amazon.com", "cloud.google.com", "docs.microsoft.com"]
}]
```

### Location-Aware Search

For queries benefiting from geographic context:

```python
tools=[{
    "type": "web_search_20250305",
    "name": "web_search",
    "user_location": {
        "type": "approximate",
        "city": "London",
        "country": "GB",
        "timezone": "Europe/London"
    }
}]
```

### Token-Conscious Fetching

Use `max_content_tokens` to prevent runaway costs with large documents:

```python
tools=[{
    "type": "web_fetch_20250910",
    "name": "web_fetch",
    "max_content_tokens": 50000  # Cap at ~50K tokens
}]
```

## Gotchas

- **Web fetch cannot dynamically construct URLs**: Claude can only fetch URLs explicitly provided by users or appearing in previous results. This is a security measure against data exfiltration, but means you cannot ask Claude to "fetch the first Google result for X" without first using web search.

- **JavaScript-rendered content not supported**: Web fetch retrieves raw HTML, so single-page applications and dynamically loaded content will return incomplete results.

- **Domain filtering is additive, not override**: Request-level domain restrictions must be compatible with organization-level settings. You can only further restrict, not expand, what the organization allows.

- **Unicode homograph attacks**: Domain filters can be bypassed using visually similar Unicode characters (e.g., Cyrillic 'а' vs ASCII 'a'). Use ASCII-only domains when possible and audit configurations.

- **Subdomains are auto-included**: Specifying `example.com` allows `docs.example.com`. To restrict to a specific subdomain, specify it explicitly.

- **Encrypted content for multi-turn citations**: Search results include `encrypted_content` that must be passed back verbatim in subsequent turns. Modifying or omitting this breaks citation functionality.

- **Cache behavior on fetch**: Web fetch caches results automatically, so content may not be the absolute latest version. The cache behavior is managed by Anthropic and may vary.

- **`pause_turn` stop reason**: Long-running web searches may return a `pause_turn` stop reason. Pass the response back as-is to continue, or modify content to interrupt.

- **Dynamic filtering requires code execution**: The latest tool versions (`web_search_20260209`, `web_fetch_20260209`) require the code execution tool to be enabled for dynamic filtering to work.

## Sources

- [Web search tool - Claude API Docs](https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search-tool) — Official documentation covering tool definition, parameters, response structure, pricing, and usage examples
- [Web fetch tool - Claude API Docs](https://platform.claude.com/docs/en/docs/agents-and-tools/tool-use/web-fetch-tool) — Official documentation for web fetch including URL validation rules, PDF support, and security considerations
- [Introducing web search on the Anthropic API](https://claude.com/blog/web-search-api) — Anthropic blog post covering use cases, governance features, and integration points
- [Web Grounding LLMs - DigitalOcean](https://www.digitalocean.com/community/tutorials/web-grounding-llms) — Tutorial on LLM grounding concepts and implementation patterns
- [LLM Grounding with Fresh Web Data Pipelines - Grepsr](https://www.grepsr.com/blog/llm-grounding-fresh-web-data-pipelines/) — Enterprise considerations for grounding LLMs with web data


---

# Code Execution Tool

**Topic ID:** tool-use.server-tools.code-execution
**Researched:** 2025-03-01T12:00:00Z

## Overview

The Code Execution Tool is a server-side capability in the Claude API that allows Claude to run code in a secure, sandboxed environment. Rather than simply generating code as text output, Claude can execute Bash commands, manipulate files, perform calculations, and create visualizations—all within a single API conversation. This transforms Claude from a code-writing assistant into an active computational agent capable of data analysis, file processing, and iterative problem-solving.

Code execution is a core primitive for building high-performance AI agents. It enables dynamic filtering in web search and web fetch workflows, allowing Claude to process results before they reach the context window—improving accuracy while reducing token consumption. The tool runs in Anthropic's managed containers with complete network isolation, eliminating risks of data exfiltration or unauthorized system access.

The feature is particularly valuable for data analysis workflows where Claude can load datasets, generate exploratory charts, identify patterns, and iteratively refine outputs based on execution results. This end-to-end capability means users can upload a CSV and receive not just analysis but downloadable visualizations, cleaned datasets, or formatted reports.

## Key Concepts

- **Sandboxed Environment**: All code runs in isolated Linux containers with no internet access. Containers have 5GiB RAM, 5GiB disk space, and 1 CPU. This prevents malicious code from affecting host systems or exfiltrating data.

- **Tool Version**: The current version is `code_execution_20250825`, which supports Bash commands and file operations. A legacy version `code_execution_20250522` supported Python only. Tool versions are tied to model versions—always use the matching version.

- **Sub-tools**: When enabled, Claude gains access to two internal tools: `bash_code_execution` for running shell commands and `text_editor_code_execution` for viewing, creating, and editing files.

- **Container Reuse**: Containers can persist across multiple API requests using the container ID returned in responses. This allows multi-turn workflows where files created in one request are available in subsequent requests. Containers expire after 30 days.

- **Files API Integration**: Upload files (CSV, Excel, images, JSON, etc.) via the Files API and reference them using `container_upload` content blocks. Claude can then process these files within the sandbox and generate new files that can be downloaded.

- **Free with Web Tools**: Code execution incurs no additional charges when used alongside `web_search_20260209` or `web_fetch_20260209`. Without these tools, billing is based on execution time at $0.05/hour after 1,550 free hours per month.

- **Pre-installed Libraries**: The Python 3.11 environment includes pandas, numpy, scipy, scikit-learn, matplotlib, seaborn, and numerous file processing libraries (openpyxl, pypdf, pillow, etc.).

## Technical Details

### Enabling Code Execution

Add the tool to your API request's `tools` array:

```json
{
  "tools": [{
    "type": "code_execution_20250825",
    "name": "code_execution"
  }]
}
```

### Python SDK Example

```python
import anthropic

client = anthropic.Anthropic()

response = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=4096,
    messages=[{
        "role": "user",
        "content": "Calculate mean and standard deviation of [1,2,3,4,5,6,7,8,9,10]"
    }],
    tools=[{"type": "code_execution_20250825", "name": "code_execution"}]
)
```

### Uploading Files for Analysis

```python
# Upload file first
file_object = client.beta.files.upload(file=open("data.csv", "rb"))

# Reference in request using container_upload
response = client.beta.messages.create(
    model="claude-opus-4-6",
    betas=["files-api-2025-04-14"],
    max_tokens=4096,
    messages=[{
        "role": "user",
        "content": [
            {"type": "text", "text": "Analyze this CSV data"},
            {"type": "container_upload", "file_id": file_object.id}
        ]
    }],
    tools=[{"type": "code_execution_20250825", "name": "code_execution"}]
)
```

### Response Structure

Bash execution results include:
- `stdout`: Command output
- `stderr`: Error messages
- `return_code`: 0 for success, non-zero for failure

File operations return metadata about the changes (line numbers, diff format for edits).

### Platform Availability

- ✅ Claude API (Anthropic)
- ✅ Microsoft Azure AI Foundry
- ❌ Amazon Bedrock
- ❌ Google Vertex AI

## Common Patterns

### Data Analysis Pipeline

Upload a dataset, have Claude explore it, create visualizations, and generate a summary report:

```python
response = client.beta.messages.create(
    model="claude-opus-4-6",
    betas=["files-api-2025-04-14"],
    messages=[{
        "role": "user",
        "content": [
            {"type": "text", "text": "Analyze this sales data: summarize trends, identify outliers, create visualizations, and save a report"},
            {"type": "container_upload", "file_id": file_id}
        ]
    }],
    tools=[{"type": "code_execution_20250825", "name": "code_execution"}]
)
```

### Container Reuse for Multi-Turn Workflows

Maintain state across requests:

```python
# First request
response1 = client.messages.create(...)
container_id = response1.container.id

# Second request reuses container
response2 = client.messages.create(
    container=container_id,
    ...
)
```

### Combining with Web Search

When used with web tools, Claude can search, fetch content, then process it programmatically:

```python
response = client.messages.create(
    model="claude-opus-4-6",
    messages=[{"role": "user", "content": "Find recent tech stock data and create a comparison chart"}],
    tools=[
        {"type": "code_execution_20250825", "name": "code_execution"},
        {"type": "web_search_20260209", "name": "web_search"}
    ]
)
```

### Programmatic Tool Calling

Enable Claude to call custom tools from within the sandbox:

```python
tools=[
    {"type": "code_execution_20250825", "name": "code_execution"},
    {
        "name": "get_weather",
        "description": "Get weather for a city",
        "input_schema": {...},
        "allowed_callers": ["code_execution_20250825"]  # Enables programmatic calling
    }
]
```

## Gotchas

- **No Network Access**: The sandbox has no internet connectivity. Claude cannot fetch external data during code execution. Use web_search or web_fetch tools separately, then pass results to code execution.

- **Multi-Environment Confusion**: When combining server-side code execution with client-side tools (like a local bash tool), Claude may confuse the two environments. Add explicit system prompt instructions clarifying that state is not shared between environments.

- **Zero Data Retention (ZDR) Not Supported**: Code execution is explicitly excluded from ZDR arrangements. Data is retained according to standard feature retention policies.

- **Minimum Billing**: Execution time has a 5-minute minimum. If files are included, billing applies even if the tool isn't invoked, due to file preloading.

- **Tool Version Compatibility**: Older tool versions may not work with newer models. Always match `code_execution_20250825` with compatible model versions (Claude Opus 4.6, Sonnet 4.6, etc.).

- **Container Expiration**: Containers expire after 30 days. Long-running workflows need to handle recreation and file re-upload.

- **`pause_turn` Stop Reason**: Long-running turns may pause. The response can be sent back as-is to continue, or modified to interrupt.

- **Legacy Migration**: The previous `code_execution_20250522` (Python-only) returns different response types. If parsing responses programmatically, update handlers for `bash_code_execution_result` and `text_editor_code_execution_result`.

- **No GPU Access**: The sandbox lacks GPU acceleration, limiting large-scale ML inference or 3D visualization workloads.

- **Interactive Charts**: Interactive visualizations (Plotly interactive mode) must be downloaded externally; they cannot render in-chat.

## Sources

- [Code execution tool - Claude API Docs](https://platform.claude.com/docs/en/docs/agents-and-tools/tool-use/code-execution-tool) — Primary documentation covering API usage, parameters, pricing, response formats, and examples
- [Claude Code Sandboxing - Anthropic Engineering](https://www.anthropic.com/engineering/claude-code-sandboxing) — Technical details on sandbox implementation using Linux Bubblewrap and macOS Seatbelt
- [Practical Security Guidance for Sandboxing Agentic Workflows - NVIDIA](https://developer.nvidia.com/blog/practical-security-guidance-for-sandboxing-agentic-workflows-and-managing-execution-risk/) — Security best practices for AI agent sandboxing, network controls, and file system protection
- [Introducing the analysis tool in Claude.ai](https://claude.com/blog/analysis-tool) — Background on the predecessor analysis tool and its evolution into code execution
- [Data Analysis Pipeline with Claude Code - Medium](https://medium.com/aiguys/data-analysis-pipeline-with-claude-code-2-486-medium-articles-to-interactive-insights-45d39417334b) — Real-world example of using Claude Code for data analysis workflows


---

# MCP Connector and Tool Conversion

**Topic ID:** tool-use.mcp.mcp-connector
**Researched:** 2026-03-01T12:00:00Z

## Overview

The MCP Connector is a beta feature in Claude's Messages API that enables direct connection to remote Model Context Protocol (MCP) servers without implementing a separate MCP client. This eliminates the complexity of managing MCP client connections while providing access to external tools through a standardized interface.

MCP itself is an open-source standard introduced by Anthropic for connecting AI applications to external systems—data sources, tools, and workflows. Think of it as a USB-C port for AI: just as USB-C standardizes device connectivity, MCP standardizes how AI applications interact with external capabilities. The MCP Connector specifically handles the tool-calling subset of the MCP specification, allowing Claude to invoke functions exposed by MCP servers.

The connector bridges two worlds: the Claude Messages API and the MCP ecosystem. When you include an `mcp_servers` configuration in your API request, Claude handles the MCP protocol negotiation, tool discovery, and invocation automatically. This is particularly valuable for accessing third-party integrations, enterprise systems, or custom tooling without building and maintaining MCP client infrastructure.

## Key Concepts

- **MCP Server Definition**: A configuration object in the `mcp_servers` array specifying how to connect to an MCP server—URL, authentication, and a unique name identifier.

- **MCPToolset**: A tool configuration object in the `tools` array that references an MCP server by name and controls which tools are enabled, disabled, or deferred.

- **Tool Conversion**: The process of transforming MCP tool definitions (using JSON Schema) into Claude-compatible tool formats. The TypeScript SDK provides helper functions like `mcpTools()` for manual client implementations.

- **Streamable HTTP vs SSE**: Two supported transport protocols for MCP servers. Both work with the connector, though SSE (Server-Sent Events) may be deprecated in favor of Streamable HTTP.

- **defer_loading**: A tool configuration option that prevents tool descriptions from being sent to the model initially. Used with Tool Search to reduce context window consumption when many tools are available.

- **Authorization Token**: An OAuth Bearer token passed in the MCP server configuration for authenticated servers. The API consumer handles OAuth flows externally.

- **inputSchema**: The JSON Schema (draft-07) definition in each MCP tool that specifies expected parameters, their types, descriptions, and validation constraints.

- **Tool Annotations**: Behavioral hints (`readOnlyHint`, `destructiveHint`, `idempotentHint`, `openWorldHint`) that guide LLM decisions about when and how to use tools.

## Technical Details

### API Request Structure

The MCP connector uses the beta header `anthropic-beta: mcp-client-2025-11-20` and requires two components:

```json
{
  "model": "claude-sonnet-4-6",
  "max_tokens": 1000,
  "messages": [{"role": "user", "content": "Your prompt"}],
  "mcp_servers": [
    {
      "type": "url",
      "url": "https://mcp.example.com/sse",
      "name": "my-mcp-server",
      "authorization_token": "YOUR_OAUTH_TOKEN"
    }
  ],
  "tools": [
    {
      "type": "mcp_toolset",
      "mcp_server_name": "my-mcp-server",
      "default_config": {
        "enabled": true,
        "defer_loading": false
      },
      "configs": {
        "specific_tool": {
          "enabled": true,
          "defer_loading": true
        }
      }
    }
  ]
}
```

### MCP Tool Schema Format

MCP tools follow JSON Schema draft-07:

```json
{
  "name": "search_events",
  "description": "Search calendar events by keyword",
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "Search keyword"
      },
      "limit": {
        "type": "integer",
        "description": "Maximum results to return"
      }
    },
    "required": ["query"]
  }
}
```

### Response Content Types

MCP tool invocations return two special content block types:

```json
{
  "type": "mcp_tool_use",
  "id": "mcptoolu_014Q35RayjACSWkSj4X2yov1",
  "name": "search_events",
  "server_name": "google-calendar-mcp",
  "input": {"query": "meeting", "limit": 10}
}
```

```json
{
  "type": "mcp_tool_result",
  "tool_use_id": "mcptoolu_014Q35RayjACSWkSj4X2yov1",
  "is_error": false,
  "content": [{"type": "text", "text": "Found 3 events..."}]
}
```

### Client-Side Helpers (TypeScript SDK)

For local STDIO servers or when you need prompts/resources (not just tools):

```typescript
import { mcpTools, mcpMessages, mcpResourceToContent } from "@anthropic-ai/sdk/helpers/beta/mcp";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";

const { tools } = await mcpClient.listTools();
const runner = await anthropic.beta.messages.toolRunner({
  model: "claude-sonnet-4-6",
  max_tokens: 1024,
  messages: [{ role: "user", content: "Use the tools" }],
  tools: mcpTools(tools, mcpClient)  // Automatic conversion
});
```

## Common Patterns

### Enable All Tools (Simplest)
```json
{
  "type": "mcp_toolset",
  "mcp_server_name": "my-server"
}
```

### Allowlist Pattern (Security-First)
Disable everything by default, explicitly enable safe tools:
```json
{
  "type": "mcp_toolset",
  "mcp_server_name": "my-server",
  "default_config": {"enabled": false},
  "configs": {
    "read_data": {"enabled": true},
    "search": {"enabled": true}
  }
}
```

### Denylist Pattern (Convenience)
Enable everything, block dangerous operations:
```json
{
  "type": "mcp_toolset",
  "mcp_server_name": "my-server",
  "configs": {
    "delete_all": {"enabled": false},
    "drop_database": {"enabled": false}
  }
}
```

### Multiple Servers
Connect to several MCP servers in one request—each needs a unique name and corresponding toolset:
```json
{
  "mcp_servers": [
    {"type": "url", "url": "https://server1.com/mcp", "name": "server1"},
    {"type": "url", "url": "https://server2.com/mcp", "name": "server2"}
  ],
  "tools": [
    {"type": "mcp_toolset", "mcp_server_name": "server1"},
    {"type": "mcp_toolset", "mcp_server_name": "server2", "default_config": {"defer_loading": true}}
  ]
}
```

## Gotchas

- **Only Tools Supported**: The MCP connector only accesses the `tools/list` and `tools/call` endpoints. MCP resources and prompts are not available through the connector—use client-side helpers for those.

- **HTTPS Required**: Server URLs must use HTTPS. Local STDIO servers cannot connect directly; use the TypeScript SDK helpers or expose the server via a tunnel (e.g., ngrok).

- **Beta Header Required**: Without `anthropic-beta: mcp-client-2025-11-20`, requests will fail. The older `mcp-client-2025-04-04` header is deprecated.

- **Server-Toolset Mapping**: Every MCP server in `mcp_servers` must have exactly one MCPToolset referencing it—no orphan servers, no duplicate references.

- **Unknown Tool Names Silently Ignored**: If you configure a tool name in `configs` that doesn't exist on the server, no error is thrown (just a backend warning). This accommodates dynamic tool availability but can mask typos.

- **UnsupportedMCPValueError**: The client-side helper functions throw this error for unsupported content types, MIME types, or non-HTTP resource links. Handle it explicitly when using `mcpTools()` or `mcpResourceToContent()`.

- **Zero Data Retention Exclusion**: The MCP connector beta is explicitly excluded from ZDR arrangements. Don't use it for sensitive data if ZDR compliance is required.

- **OAuth Token Management**: You must handle the OAuth flow externally and refresh tokens as needed—the API doesn't manage token lifecycle.

- **Platform Availability**: The MCP connector is not supported on Amazon Bedrock or Google Vertex AI—only direct Anthropic API access.

- **Tool Search Model Requirements**: Using `defer_loading: true` with Tool Search requires Sonnet 4+ or Opus 4+. Haiku models don't support tool search.

## Sources

- [MCP Connector - Claude API Docs](https://platform.claude.com/docs/en/agents-and-tools/mcp-connector) — Primary reference for API structure, configuration patterns, migration guide, and response types
- [What is the Model Context Protocol?](https://modelcontextprotocol.io/) — Overview of MCP architecture and ecosystem purpose
- [MCP Schema Reference](https://modelcontextprotocol.io/specification/2025-06-18/schema) — Complete tool schema specification including inputSchema, outputSchema, and annotations
- [Anthropic API + FastMCP Integration](https://gofastmcp.com/integrations/anthropic) — Tutorial on deploying MCP servers and connecting via Messages API
- [MCP Tool Schema Explained - Merge.dev](https://www.merge.dev/blog/mcp-tool-schema) — Detailed breakdown of inputSchema structure and best practices

