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
