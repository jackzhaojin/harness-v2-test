# Input Schema Design

**Topic ID:** tool-use.tool-definitions.input-schemas
**Researched:** 2026-03-01T12:00:00Z

## Overview

Input schemas define the contract between Claude and your tools, specifying exactly what parameters a tool accepts and how they should be structured. When you define a tool in the Claude API, the `input_schema` field uses JSON Schema format to describe the expected inputs, including their types, constraints, and documentation [1]. This schema serves two critical purposes: it guides Claude in constructing valid tool calls, and when combined with strict mode, it guarantees that Claude's tool invocations exactly match your specifications [2].

The quality of your input schema directly impacts tool performance. A well-designed schema with detailed descriptions and appropriate constraints helps Claude understand when and how to use the tool correctly. Conversely, vague or incomplete schemas lead to Claude making incorrect assumptions about parameter values or misusing tools entirely [1]. For production systems, enabling strict mode (`strict: true`) eliminates parsing errors and type mismatches by guaranteeing schema compliance through constrained decoding [2].

## Key Concepts

- **input_schema** — A JSON Schema object defining the expected parameters for a tool. Must be of type `object` with a `properties` field listing each parameter [1].

- **properties** — An object mapping parameter names to their definitions. Each property definition includes `type`, optional `description`, and constraints like `enum` [1].

- **required** — An array of strings listing parameter names that must be provided. Parameters not in this array are optional. In strict mode, all parameters are effectively treated as required for schema validation purposes [2].

- **type** — Specifies the JSON type: `string`, `integer`, `number`, `boolean`, `array`, `object`, or `null`. Supported in all contexts including nested objects and arrays [2].

- **enum** — Constrains a parameter to a fixed set of values. Only supports primitive types (strings, numbers, booleans, nulls) — complex types within enums are not supported [2].

- **description** — Free-text documentation explaining the parameter's purpose, expected format, and valid values. This is the single most important factor in tool performance [1].

- **additionalProperties** — When set to `false`, prevents Claude from including parameters not defined in the schema. Required for strict mode [2].

- **strict mode** — Setting `strict: true` on a tool definition guarantees Claude's tool calls match the schema exactly, eliminating type mismatches and missing fields [2].

## Technical Details

### Basic Schema Structure

Every tool definition requires three fields: `name`, `description`, and `input_schema`. The schema must be type `object` [1]:

```json
{
  "name": "get_weather",
  "description": "Get the current weather in a given location",
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

### Supported JSON Schema Features

The Claude API supports standard JSON Schema with specific limitations [2]:

**Fully supported:**
- Basic types: `object`, `array`, `string`, `integer`, `number`, `boolean`, `null`
- `enum` and `const` for value constraints
- `anyOf` and `allOf` for union types
- `$ref`, `$def`, and `definitions` for schema reuse (external `$ref` not supported)
- `default` property for all types
- String formats: `date-time`, `time`, `date`, `duration`, `email`, `hostname`, `uri`, `ipv4`, `ipv6`, `uuid`
- Array `minItems` (only values 0 and 1)

**Not supported:**
- Recursive schemas
- Complex types within enums
- External `$ref` (e.g., `$ref: "http://..."`)
- Numerical constraints (`minimum`, `maximum`, `multipleOf`)
- String constraints (`minLength`, `maxLength`)
- Array constraints beyond `minItems` of 0 or 1

### Strict Mode Configuration

Enable strict mode by adding `strict: true` to the tool definition [2]:

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

### Schema Complexity Limits

When using strict mode, the API enforces complexity limits [2]:

| Limit | Value | Description |
|-------|-------|-------------|
| Strict tools per request | 20 | Maximum tools with `strict: true` |
| Optional parameters | 24 | Total optional parameters across all strict schemas |
| Parameters with union types | 16 | Parameters using `anyOf` or type arrays |

## Common Patterns

### Providing Input Examples

For complex tools, use the optional `input_examples` field to show Claude concrete usage patterns [1]:

```json
{
  "name": "get_weather",
  "description": "Get the current weather in a given location",
  "input_schema": {
    "type": "object",
    "properties": {
      "location": {"type": "string"},
      "unit": {"type": "string", "enum": ["celsius", "fahrenheit"]}
    },
    "required": ["location"]
  },
  "input_examples": [
    {"location": "San Francisco, CA", "unit": "fahrenheit"},
    {"location": "Tokyo, Japan", "unit": "celsius"},
    {"location": "New York, NY"}
  ]
}
```

Examples add 20-50 tokens for simple cases, 100-200 tokens for complex nested objects [1].

### Tools Without Parameters

For tools that require no input, use an empty properties object [1]:

```json
{
  "name": "get_location",
  "description": "Get the current user location based on their IP address. This tool has no parameters or arguments.",
  "input_schema": {
    "type": "object",
    "properties": {}
  }
}
```

### Consolidating Related Operations

Rather than creating separate tools for each action, group related operations with an `action` parameter [1]:

```json
{
  "name": "github_pr",
  "description": "Manage pull requests on GitHub",
  "input_schema": {
    "type": "object",
    "properties": {
      "action": {
        "type": "string",
        "enum": ["create", "review", "merge", "close"]
      },
      "pr_number": {"type": "integer"},
      "comment": {"type": "string"}
    },
    "required": ["action"]
  }
}
```

### Namespace Prefixing

Use meaningful namespacing when tools span multiple services [1]:

```json
{
  "name": "github_list_prs",
  "description": "List pull requests from a GitHub repository"
}
```

```json
{
  "name": "slack_send_message",
  "description": "Send a message to a Slack channel"
}
```

## Gotchas

- **Descriptions are critical** — Detailed descriptions are "by far the most important factor in tool performance" [1]. Aim for at least 3-4 sentences per tool, explaining what it does, when to use it, what each parameter means, and any caveats or limitations.

- **Model behavior varies with missing parameters** — Claude Opus is more likely to ask for clarification when required parameters are missing, while Claude Sonnet may attempt to infer values [1]. Always validate inputs in your tool implementation regardless.

- **additionalProperties must be false for strict mode** — Strict schemas require `additionalProperties: false` on all objects, including nested ones [2]. This is a common source of validation errors.

- **Enum constraints only work with primitives** — You cannot use complex objects or arrays as enum values. Only `string`, `number`, `boolean`, and `null` are supported in enums [2].

- **Numerical and string constraints not supported** — While JSON Schema defines `minimum`, `maximum`, `minLength`, `maxLength`, these are ignored by Claude. Enforce these constraints in your tool implementation or description [2].

- **SDK schema transformation** — Python and TypeScript SDKs can automatically transform schemas with unsupported features (removing constraints, updating descriptions, validating responses). This means Claude receives a simplified schema but validation still catches violations [2].

- **Property ordering in output** — Required properties appear before optional properties in Claude's output, regardless of schema definition order [2]. If order matters, make all properties required.

- **MCP compatibility** — When converting Model Context Protocol tools to Claude format, rename `inputSchema` to `input_schema` [1]. The schema structure itself is compatible.

- **Grammar compilation latency** — First requests with a new strict schema have additional latency while the grammar compiles. Subsequent requests use a 24-hour cache [2]. Changing schema structure (but not names/descriptions) invalidates the cache.

## Sources

[1] **How to implement tool use - Claude API Docs**
    URL: https://platform.claude.com/docs/en/agents-and-tools/tool-use/implement-tool-use
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Tool definition structure, input_schema format, best practices for descriptions, input_examples usage, tool consolidation patterns, namespace conventions, empty schema patterns, MCP compatibility, model behavior differences.

[2] **Structured outputs - Claude API Docs**
    URL: https://platform.claude.com/docs/en/build-with-claude/structured-outputs
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Strict mode configuration, supported JSON Schema features, schema limitations, complexity limits, additionalProperties requirements, property ordering behavior, grammar compilation and caching, SDK schema transformation.
