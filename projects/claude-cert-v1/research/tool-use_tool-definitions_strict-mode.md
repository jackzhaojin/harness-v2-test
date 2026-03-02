# Strict Tool Use

**Topic ID:** tool-use.tool-definitions.strict-mode
**Researched:** 2026-03-01T00:00:00Z

## Overview

Strict tool use is a feature in Claude's API that guarantees schema validation on tool names and inputs by adding `strict: true` to tool definitions [1]. Unlike standard tool use where Claude makes best-effort attempts to follow your schema, strict mode uses constrained decoding to compile your JSON schema into a grammar that actively restricts token generation during inference [1][2]. This means Claude literally cannot produce tokens that would violate your schema, eliminating type mismatches, missing required fields, and invalid tool names entirely.

Without strict mode, Claude might return incompatible types (e.g., `"2"` instead of `2`) or missing required fields, which can break downstream functions and cause runtime errors [1]. For production agents where invalid tool parameters would cause failures, strict mode provides guaranteed type-safe parameters every time, removing the need to validate and retry tool calls [1]. Strict tool use is part of Claude's broader structured outputs feature, which also includes JSON outputs for controlling Claude's response format. These two features solve different problems and can be used together: strict tool use validates tool parameters (how Claude calls your functions), while JSON outputs control Claude's response format (what Claude says) [1].

## Key Concepts

- **Constrained Decoding** - The mechanism behind strict mode that compiles JSON schemas into grammars and restricts token generation at inference time, making schema violations impossible rather than just unlikely [1][2].

- **`strict: true` Flag** - The top-level property added to tool definitions alongside `name`, `description`, and `input_schema` that enables guaranteed schema validation [1].

- **`additionalProperties: false`** - A required setting on all objects in strict schemas; the API returns a 400 error if set to anything other than `false` [1].

- **Grammar Compilation** - The first-time processing step where your schema is compiled into a grammar artifact, adding 100-300ms latency; compiled grammars are cached for 24 hours [1][2].

- **Schema Complexity Limits** - Explicit limits enforced to prevent excessive compilation times: maximum 20 strict tools per request, 24 total optional parameters across all strict schemas, and 16 parameters with union types [1].

- **Property Ordering** - In strict mode output, required properties appear first in schema definition order, followed by optional properties in schema definition order, which may differ from the order you defined them [1].

- **Stop Reason Exceptions** - Two cases where schema guarantees may not hold: refusals (`stop_reason: "refusal"`) where Claude refuses for safety reasons, and token limit truncation (`stop_reason: "max_tokens"`) where output is cut off [1].

## Technical Details

### Enabling Strict Mode

Add `strict: true` as a top-level property in your tool definition [1]:

```json
{
  "name": "get_weather",
  "description": "Get the current weather in a given location",
  "strict": true,
  "input_schema": {
    "type": "object",
    "properties": {
      "location": {
        "type": "string",
        "description": "The city and state, e.g. San Francisco, CA"
      },
      "unit": {
        "type": "string",
        "enum": ["celsius", "fahrenheit"]
      }
    },
    "required": ["location"],
    "additionalProperties": false
  }
}
```

### Supported JSON Schema Features

Strict mode supports the following JSON Schema features [1]:

- All basic types: `object`, `array`, `string`, `integer`, `number`, `boolean`, `null`
- `enum` (strings, numbers, bools, or nulls only - no complex types)
- `const`, `anyOf`, `allOf` (with limitations - `allOf` with `$ref` not supported)
- `$ref`, `$def`, and `definitions` (external `$ref` not supported)
- `default` property for all supported types
- `required` and `additionalProperties` (must be `false` for objects)
- String formats: `date-time`, `time`, `date`, `duration`, `email`, `hostname`, `uri`, `ipv4`, `ipv6`, `uuid`
- Array `minItems` (only values 0 and 1 supported)

### Unsupported Features

The following are NOT supported and will return a 400 error [1]:

- Recursive schemas
- Complex types within enums
- External `$ref` (e.g., `'$ref': 'http://...'`)
- Numerical constraints (`minimum`, `maximum`, `multipleOf`, etc.)
- String constraints (`minLength`, `maxLength`)
- Array constraints beyond `minItems` of 0 or 1
- `additionalProperties` set to anything other than `false`

### Complexity Limits

These limits apply to the combined total across all strict schemas in a single request [1]:

| Limit | Value | Description |
|-------|-------|-------------|
| Strict tools per request | 20 | Maximum tools with `strict: true` |
| Optional parameters | 24 | Total optional parameters across all strict tool schemas |
| Union type parameters | 16 | Parameters using `anyOf` or type arrays |

### Model Availability

Strict tool use is generally available for Claude Opus 4.6, Claude Sonnet 4.6, Claude Sonnet 4.5, Claude Opus 4.5, and Claude Haiku 4.5 [1]. It remains in public beta on Microsoft Foundry [1].

## Common Patterns

### Production Agent with Validated Inputs

The primary use case is building reliable agentic systems where invalid parameters would cause failures [1]:

```python
response = client.messages.create(
    model="claude-opus-4-6",
    messages=[{"role": "user", "content": "Search for flights to Tokyo"}],
    tools=[
        {
            "name": "search_flights",
            "strict": True,
            "input_schema": {
                "type": "object",
                "properties": {
                    "destination": {"type": "string"},
                    "departure_date": {"type": "string", "format": "date"},
                    "passengers": {
                        "type": "integer",
                        "enum": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
                    },
                },
                "required": ["destination", "departure_date"],
                "additionalProperties": False,
            },
        }
    ],
)
```

### Combining Strict Tool Use with JSON Outputs

Use both features together when you need reliable tool calls AND structured final outputs [1]:

```python
response = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Help me plan a trip to Paris"}],
    output_config={
        "format": {
            "type": "json_schema",
            "schema": {
                "type": "object",
                "properties": {
                    "summary": {"type": "string"},
                    "next_steps": {"type": "array", "items": {"type": "string"}},
                },
                "required": ["summary", "next_steps"],
                "additionalProperties": False,
            },
        }
    },
    tools=[
        {
            "name": "search_flights",
            "strict": True,
            "input_schema": {
                "type": "object",
                "properties": {
                    "destination": {"type": "string"},
                    "date": {"type": "string", "format": "date"},
                },
                "required": ["destination", "date"],
                "additionalProperties": False,
            },
        }
    ],
)
```

### Using SDK Helpers (Pydantic/Zod)

The Python and TypeScript SDKs transform schemas automatically, including adding `additionalProperties: false` and filtering unsupported constraints [1]:

```python
from pydantic import BaseModel

class ContactInfo(BaseModel):
    name: str
    email: str
    plan_interest: str

response = client.messages.parse(
    model="claude-opus-4-6",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Extract info from: ..."}],
    output_format=ContactInfo,
)
```

## Gotchas

- **Numerical constraints are NOT enforced** - Properties like `minimum`, `maximum`, and `multipleOf` are not supported by strict mode [1]. Claude will produce valid integers/numbers, but won't respect value bounds. You must validate these post-response.

- **Optional parameters compound complexity exponentially** - Each optional parameter roughly doubles a portion of the grammar's state space [1]. Four tools with 6 optional parameters each will hit the 24-parameter limit. Prefer making parameters required with explicit defaults.

- **Property ordering changes** - Required properties always appear first in output, followed by optional properties [1]. If your downstream code depends on property order, either mark all properties required or handle the reordering.

- **Refusals and truncation bypass guarantees** - Schema compliance is NOT guaranteed when `stop_reason` is `"refusal"` (safety refusal) or `"max_tokens"` (output truncated) [1]. Always check `stop_reason` before parsing.

- **First-request latency penalty** - New schemas incur 100-300ms compilation overhead [1]. For latency-sensitive applications, pre-warm schemas or accept the initial delay.

- **Cache invalidation triggers** - Changing the JSON schema structure or the set of tools in your request invalidates the cached grammar [1]. Changing only `name` or `description` does NOT invalidate the cache.

- **Citations are incompatible** - Enabling citations with `output_config.format` returns a 400 error because citation blocks conflict with strict JSON constraints [1].

- **Message prefilling incompatible with JSON outputs** - You cannot use message prefilling when using JSON outputs mode (though it works with strict tool use alone) [1].

- **Non-strict tools do not count toward limits** - Only tools with `strict: true` count toward the 20-tool limit [1]. You can mix strict and non-strict tools in the same request.

- **Union types are expensive** - Parameters using `anyOf` or type arrays (e.g., `"type": ["string", "null"]`) are especially expensive because they create exponential compilation cost [1]. The 16-parameter limit for union types is separate from the 24-optional-parameter limit.

## Sources

[1] **Structured outputs - Claude API Docs**
    URL: https://platform.claude.com/docs/en/build-with-claude/structured-outputs
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Complete documentation on strict tool use including how to enable it, schema requirements, complexity limits, caching behavior, limitations, incompatibilities, property ordering, stop reason exceptions, and code examples.

[2] **Tool use with Claude - Claude API Docs**
    URL: https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Overview of tool use mechanics, relationship between strict tool use and structured outputs, and recommendation to use strict mode for production agents.

[3] **Anthropic Launches Structured Outputs: Guaranteed JSON Schema Compliance for Claude API**
    URL: https://techbytes.app/posts/claude-structured-outputs-json-schema-api/
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Background context on structured outputs GA release and model availability.
