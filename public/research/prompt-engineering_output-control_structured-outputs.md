# Structured Outputs and JSON

**Topic ID:** prompt-engineering.output-control.structured-outputs
**Researched:** 2026-02-28T12:00:00Z

## Overview

Structured outputs enable LLMs to generate responses that strictly conform to a predefined JSON schema, eliminating parsing errors and schema violations that plague traditional prompt-based approaches. While basic "JSON mode" only guarantees syntactically valid JSON, structured outputs go further by enforcing schema adherence—ensuring required fields are present, data types are correct, and enum values are valid. This distinction is critical: JSON mode might return `{"name": "John"}` when you expected `{"name": "John", "email": "...", "age": 30}`, but structured outputs guarantee the complete schema is followed.

The technology works through **constrained decoding** (also called grammar-based decoding). At each token generation step, the system masks out tokens that would violate the schema, forcing the model to only select from valid continuations. This achieves 100% schema compliance by construction—invalid outputs literally cannot be produced. Major providers including OpenAI, Anthropic (Claude), and Cohere have implemented this capability, with OpenAI's gpt-4o achieving perfect scores on complex JSON schema benchmarks compared to under 40% for earlier models without constrained decoding.

Structured outputs serve two primary use cases: controlling model response format (extracting data, generating reports, formatting API responses) and validating tool/function parameters in agentic workflows. When building agents that call external functions, strict mode ensures the model provides correctly-typed arguments every time, eliminating runtime errors and retry logic.

## Key Concepts

- **JSON Mode vs. Structured Outputs**: JSON mode guarantees valid JSON syntax; structured outputs guarantee schema conformance. Always prefer structured outputs when schema adherence matters.

- **Constrained Decoding**: The underlying technique that masks invalid tokens during generation. At each step, only tokens that continue a valid schema-conformant output are allowed, achieving 100% compliance by construction.

- **Grammar Compilation**: Schemas are compiled into grammar artifacts (finite state machines or pushdown automata) that efficiently determine valid next tokens. First-request latency is higher due to compilation; subsequent requests benefit from caching.

- **Strict Mode (`strict: true`)**: The API parameter that enables schema enforcement for tool/function calls. When enabled, all tool inputs are guaranteed to match the defined `input_schema`.

- **Response Format (`json_schema`)**: Specifies the expected output structure for model responses. In OpenAI's API, use `response_format: {type: "json_schema", json_schema: {...}}`; in Claude's API, use `output_config.format`.

- **Schema Validation vs. Content Accuracy**: Structured outputs guarantee format, not factual correctness. The model can still hallucinate values that match the schema perfectly—a `{"price": 99.99}` response is schema-valid even if the actual price is different.

- **SDK Helpers**: Pydantic (Python), Zod (TypeScript), and native class definitions (Java/Ruby) can automatically generate JSON schemas from type definitions, with SDK methods like `client.messages.parse()` providing automatic validation.

## Technical Details

### API Implementation Patterns

**OpenAI API** - Two approaches:
```python
# Response format for direct JSON output
response = client.chat.completions.create(
    model="gpt-4o",
    response_format={
        "type": "json_schema",
        "json_schema": {
            "name": "extraction",
            "strict": True,
            "schema": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "email": {"type": "string"}
                },
                "required": ["name", "email"],
                "additionalProperties": False
            }
        }
    },
    messages=[{"role": "user", "content": "Extract: John at john@example.com"}]
)

# Function calling with strict mode
tools = [{
    "type": "function",
    "function": {
        "name": "get_weather",
        "strict": True,
        "parameters": {
            "type": "object",
            "properties": {
                "location": {"type": "string"},
                "unit": {"type": "string", "enum": ["celsius", "fahrenheit"]}
            },
            "required": ["location", "unit"],
            "additionalProperties": False
        }
    }
}]
```

**Claude API** - Similar dual approach:
```python
# JSON outputs via output_config
response = client.messages.create(
    model="claude-sonnet-4-6",
    output_config={
        "format": {
            "type": "json_schema",
            "schema": {
                "type": "object",
                "properties": {"name": {"type": "string"}},
                "required": ["name"],
                "additionalProperties": False
            }
        }
    },
    messages=[{"role": "user", "content": "..."}]
)

# Strict tool use
tools = [{
    "name": "search",
    "strict": True,
    "input_schema": {...}
}]
```

### JSON Schema Limitations

Both OpenAI and Claude impose restrictions on supported schema features:

| Supported | Not Supported |
|-----------|---------------|
| Basic types (object, array, string, number, boolean, null) | Recursive schemas |
| `enum`, `const`, `anyOf`, `allOf` | External `$ref` |
| `$ref`/`$defs` (internal only) | Numerical constraints (`minimum`, `maximum`) |
| `required`, `additionalProperties: false` | String constraints (`minLength`, `maxLength`) |
| String formats: `date`, `email`, `uri`, `uuid` | `additionalProperties: true` |

**Critical requirement**: `additionalProperties` must be set to `false` for all objects, and all properties should typically be marked as `required`.

### Performance Characteristics

- **First-request latency**: Grammar compilation adds 100-500ms+ overhead
- **Caching**: Compiled grammars cached for 24 hours (invalidated on schema changes)
- **Token overhead**: System prompt injected to explain expected format (adds to input tokens)
- **Complexity limits**: OpenAI/Claude limit strict tools per request (~20), optional parameters (~24), and union types (~16)

## Common Patterns

### Data Extraction
```python
from pydantic import BaseModel
from typing import List

class Invoice(BaseModel):
    invoice_number: str
    date: str
    total: float
    line_items: List[dict]

response = client.messages.parse(
    model="claude-sonnet-4-6",
    output_format=Invoice,
    messages=[{"role": "user", "content": f"Extract from: {invoice_text}"}]
)
# response.parsed_output is typed Invoice object
```

### Agentic Tool Validation
Define strict tools to ensure agents pass correctly-typed parameters:
```python
tools = [
    {"name": "book_flight", "strict": True, "input_schema": {
        "type": "object",
        "properties": {
            "destination": {"type": "string"},
            "passengers": {"type": "integer", "enum": [1,2,3,4,5,6]},
            "date": {"type": "string", "format": "date"}
        },
        "required": ["destination", "passengers", "date"],
        "additionalProperties": False
    }}
]
```

### Classification with Enums
```python
schema = {
    "type": "object",
    "properties": {
        "category": {"type": "string", "enum": ["bug", "feature", "question"]},
        "priority": {"type": "string", "enum": ["low", "medium", "high"]},
        "confidence": {"type": "number"}
    },
    "required": ["category", "priority", "confidence"],
    "additionalProperties": False
}
```

## Gotchas

- **All fields must be required**: When `strict: true` is enabled, OpenAI requires all properties to be listed in `required`. Optional fields must be handled via union types with `null` (e.g., `"type": ["string", "null"]`).

- **Refusals bypass schema**: If the model refuses a request for safety reasons (`stop_reason: "refusal"`), the output will not match your schema. Always check `stop_reason` before parsing.

- **`max_tokens` truncation**: If output is cut off due to token limits (`stop_reason: "max_tokens"`), the JSON will be incomplete and unparseable. Set generous `max_tokens` values.

- **Parallel tool calls disabled**: OpenAI's structured outputs are incompatible with parallel function calls. Set `parallel_tool_calls: false` when using strict mode.

- **Property ordering**: Required properties appear first in output, followed by optional properties, regardless of schema definition order.

- **Schema complexity limits**: Complex schemas with many optional fields, union types, or nested objects can exceed compilation limits, causing 400 errors. Simplify schemas or split across multiple tools.

- **No content validation**: A response like `{"email": "not-an-email"}` is schema-valid if `email` is type `string`. Use `format: "email"` for basic format checking, but validate critical fields in application code.

- **Caching invalidation**: Changing the schema structure (not just `name` or `description`) invalidates the grammar cache, reintroducing first-request latency.

- **Provider differences**: OpenAI uses `response_format.json_schema`, Claude uses `output_config.format`. Tool schemas differ slightly between providers—always consult provider-specific docs.

## Sources

- [Anthropic Structured Outputs Documentation](https://platform.claude.com/docs/en/build-with-claude/structured-outputs) — Comprehensive guide to Claude's JSON outputs and strict tool use features
- [OpenAI Introducing Structured Outputs](https://openai.com/index/introducing-structured-outputs-in-the-api/) — Announcement explaining 100% schema compliance and constrained decoding approach
- [Cohere Structured Outputs](https://docs.cohere.com/docs/structured-outputs) — Documentation on strict_tools and JSON mode implementations
- [A Guide to Structured Outputs Using Constrained Decoding](https://www.aidancooper.co.uk/constrained-decoding/) — Technical explanation of grammar-based decoding mechanics
- [Modelmetry: How to Ensure LLM Output Adheres to JSON Schema](https://modelmetry.com/blog/how-to-ensure-llm-output-adheres-to-a-json-schema) — Comparison of approaches including prompting, JSON mode, and constrained decoding
- [Let's Data Science: How Structured Outputs Work](https://www.letsdatascience.com/blog/structured-outputs-making-llms-return-reliable-json) — Overview of token masking and 100% compliance guarantees
