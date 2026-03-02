# Parallel Result Formatting

**Topic ID:** tool-use.parallel-tools.result-formatting
**Researched:** 2026-03-01T12:00:00Z

## Overview

When Claude makes parallel tool calls, it returns multiple `tool_use` content blocks in a single assistant message. The critical requirement is that all corresponding `tool_result` blocks must be returned in one subsequent user message, with each result properly matched to its originating tool call via the `tool_use_id` field [1]. This pattern enables efficient multi-tool workflows where independent operations can execute simultaneously rather than sequentially.

Parallel tool result formatting is a frequent source of API errors in production systems. The most common mistake is sending tool results in separate user messages instead of consolidating them into a single message [2]. Understanding the exact structure requirements prevents the dreaded 400 error: "tool_use ids were found without tool_result blocks immediately after" [3].

The Claude API differs from other LLM APIs (like OpenAI's function calling) by integrating tool use directly into the standard message structure rather than using special roles like `tool` or `function`. Messages contain arrays of `text`, `image`, `tool_use`, and `tool_result` blocks, where `user` messages include client content and `tool_result`, while `assistant` messages contain AI-generated content and `tool_use` [1].

## Key Concepts

- **`tool_use` block** — A content block in Claude's assistant response requesting execution of a specific tool. Contains `id` (unique identifier), `name` (tool name), and `input` (parameters conforming to the tool's schema) [1].

- **`tool_result` block** — A content block in the user's response providing the outcome of a tool execution. Must include `type: "tool_result"`, `tool_use_id` (matching the original `tool_use` id), and `content` (the result data) [1].

- **`tool_use_id` matching** — Each `tool_use_id` in a `tool_result` must exactly match the `id` from the corresponding `tool_use` block. The API generates unique identifiers like `toolu_01A09q90qw90lq917835lq9` for each tool call [1].

- **Single-message consolidation** — All tool results for parallel calls must be in one user message. Sending results across multiple messages causes validation errors [1][3].

- **Content ordering requirement** — Within a user message containing tool results, all `tool_result` blocks must appear before any `text` blocks. Text content can only follow tool results, never precede them [1][3].

- **`is_error` field** — Optional boolean field on `tool_result` blocks. Set to `true` when tool execution failed, allowing Claude to handle the error gracefully [1].

- **`stop_reason: "tool_use"`** — The API response field indicating Claude wants to use tools. When this appears with multiple `tool_use` blocks, you must handle parallel results [1].

## Technical Details

The correct message structure for parallel tool results follows this pattern:

```json
{
  "role": "user",
  "content": [
    {
      "type": "tool_result",
      "tool_use_id": "toolu_01",
      "content": "San Francisco: 68F, partly cloudy"
    },
    {
      "type": "tool_result",
      "tool_use_id": "toolu_02",
      "content": "New York: 45F, clear skies"
    },
    {
      "type": "tool_result",
      "tool_use_id": "toolu_03",
      "content": "2:30 PM PST"
    }
  ]
}
```

The `content` field in a `tool_result` supports three formats [1]:

1. **String**: Simple text result like `"content": "15 degrees"`
2. **Array of content blocks**: Rich content including text, images, or documents
3. **Document blocks**: For returning structured document data

When including text after tool results (for user follow-up), the structure must be:

```json
{
  "role": "user",
  "content": [
    { "type": "tool_result", "tool_use_id": "toolu_01", "content": "Result 1" },
    { "type": "tool_result", "tool_use_id": "toolu_02", "content": "Result 2" },
    { "type": "text", "text": "What should I do next?" }
  ]
}
```

For error cases, include the `is_error` flag:

```json
{
  "type": "tool_result",
  "tool_use_id": "toolu_01A09q90qw90lq917835lq9",
  "content": "ConnectionError: weather service API unavailable (HTTP 500)",
  "is_error": true
}
```

## Common Patterns

**Standard parallel tool flow** [1]:

1. Claude returns an assistant message with multiple `tool_use` blocks
2. Client extracts all `id`, `name`, and `input` values
3. Client executes all tools (can run concurrently for efficiency)
4. Client sends single user message with all `tool_result` blocks
5. Claude processes results and continues the conversation

**Complete conversation structure**:

```python
messages = [
    {
        "role": "user",
        "content": "What's the weather in SF and NYC?"
    },
    {
        "role": "assistant",
        "content": [
            {"type": "text", "text": "I'll check both locations."},
            {"type": "tool_use", "id": "toolu_01", "name": "get_weather",
             "input": {"location": "San Francisco, CA"}},
            {"type": "tool_use", "id": "toolu_02", "name": "get_weather",
             "input": {"location": "New York, NY"}}
        ]
    },
    {
        "role": "user",
        "content": [
            {"type": "tool_result", "tool_use_id": "toolu_01",
             "content": "68F, sunny"},
            {"type": "tool_result", "tool_use_id": "toolu_02",
             "content": "45F, cloudy"}
        ]
    }
]
```

**Using the SDK Tool Runner** (recommended) [1]:

```python
runner = client.beta.messages.tool_runner(
    model="claude-opus-4-6",
    max_tokens=1024,
    tools=[get_weather, calculate_sum],
    messages=[{"role": "user", "content": "Weather in Paris and 15+27?"}],
)
final_message = runner.until_done()
```

The tool runner automatically handles the entire tool call loop including parallel result formatting.

## Gotchas

**Text before tool results causes 400 errors** [1][3]: Placing any `text` block before `tool_result` blocks in the content array triggers an immediate API error. This is the most common formatting mistake.

```json
// WRONG - causes error
{"role": "user", "content": [
  {"type": "text", "text": "Here are results:"},
  {"type": "tool_result", ...}
]}

// CORRECT
{"role": "user", "content": [
  {"type": "tool_result", ...},
  {"type": "text", "text": "Here are results:"}
]}
```

**Separate messages for each result break parallel tool use** [1][3]: Sending tool results in individual user messages instead of consolidating them into one message not only causes errors but also "teaches" Claude to avoid parallel calls in future turns.

**Every `tool_use` requires a `tool_result`** [3]: Missing even one `tool_result` for a parallel batch triggers: "tool_use ids were found without tool_result blocks immediately after: toolu_XXX". You cannot skip results.

**`tool_use_id` must match exactly** [1]: The `tool_use_id` in your result must be identical to the `id` from the `tool_use` block. These are unique strings generated by Anthropic for each call.

**Order of `tool_result` blocks does not matter** [1]: While `tool_result` blocks must come before text, the order of multiple `tool_result` blocks among themselves is flexible. The API matches them by `tool_use_id`, not position.

**Empty results are valid** [1]: If a tool has no meaningful return value (like a "send email" operation), you can omit the `content` field entirely:

```json
{"type": "tool_result", "tool_use_id": "toolu_01"}
```

**Interruption during parallel calls is tricky** [3]: If a user cancels mid-execution or the system crashes after some tools complete, you must still send results for all `tool_use` blocks. For unexecuted tools, send error results with `is_error: true`.

**Older models may not parallelize well** [1]: Claude Sonnet 3.7 may require the `token-efficient-tools-2025-02-19` beta header or explicit prompting to make parallel tool calls. Claude 4 models parallelize effectively by default.

## Sources

[1] **How to implement tool use - Claude API Docs**
    URL: https://platform.claude.com/docs/en/agents-and-tools/tool-use/implement-tool-use
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Complete documentation on tool_result format, parallel tool handling, content ordering requirements, tool runner usage, and code examples for Python/TypeScript.

[2] **Anthropic Engineering - Advanced Tool Use**
    URL: https://www.anthropic.com/engineering/advanced-tool-use
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Background on parallel tool use patterns and the single-message requirement for tool results.

[3] **GitHub Issues - Claude Code tool_use/tool_result errors**
    URL: https://github.com/anthropics/claude-code/issues/3886
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Real-world error messages, common failure scenarios, and workarounds for the "tool_use ids were found without tool_result blocks" error.
