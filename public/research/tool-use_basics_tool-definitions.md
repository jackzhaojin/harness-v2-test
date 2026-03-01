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
