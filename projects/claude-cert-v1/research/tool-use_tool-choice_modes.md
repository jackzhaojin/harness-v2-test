# Tool Choice Modes

**Topic ID:** tool-use.tool-choice.modes
**Researched:** 2026-03-01T12:00:00Z

## Overview

The `tool_choice` parameter in Claude's Messages API controls how Claude interacts with available tools during a conversation. This parameter determines whether Claude should automatically decide on tool usage, be forced to use a specific tool, be required to use any tool, or be prevented from using tools altogether [1][2].

Understanding tool choice modes is essential for building reliable AI applications because the choice directly affects Claude's response behavior, output format, and compatibility with features like extended thinking. The parameter is specified as an object in API requests (e.g., `tool_choice = {"type": "auto"}`) and has different default values depending on whether tools are provided [1].

Tool choice modes represent a fundamental trade-off: forcing tool use guarantees structured output but suppresses natural language explanations, while automatic mode allows conversational responses but requires more careful prompt engineering to ensure tools are used when needed [2][3].

## Key Concepts

- **`auto` mode** — Claude decides whether to call any provided tools based on the conversation context. This is the default value when `tools` are provided in the request [1][2]. Claude may provide natural language responses before or instead of tool calls.

- **`none` mode** — Prevents Claude from using any tools. This is the default value when no `tools` are provided [1][2]. If no tools are provided, using `none` adds 0 additional system prompt tokens [2].

- **`any` mode** — Forces Claude to use one of the provided tools, but Claude chooses which tool to use [1][2]. The model will not emit natural language before the tool call [1][2].

- **`tool` mode** — Forces Claude to always use a specific named tool. Requires specifying the tool name: `{"type": "tool", "name": "tool_name"}` [1][2]. Like `any`, suppresses natural language output before the tool call.

- **Assistant message prefilling** — When `tool_choice` is set to `any` or `tool`, the API prefills the assistant message to force tool usage. This technical mechanism is why natural language responses are suppressed [1][2].

- **Strict tool use** — Can be combined with `tool_choice: {"type": "any"}` and `strict: true` on tool definitions to guarantee both tool usage AND schema-compliant inputs [1].

- **Parallel tool control** — The `disable_parallel_tool_use` parameter can be combined with `tool_choice` to limit Claude to exactly one tool call (with `any`/`tool`) or at most one (with `auto`) [1][2].

## Technical Details

### API Syntax

Tool choice is specified as an object in the Messages API request:

```python
# Auto mode (default when tools provided)
tool_choice = {"type": "auto"}

# Force a specific tool
tool_choice = {"type": "tool", "name": "get_weather"}

# Require any tool to be used
tool_choice = {"type": "any"}

# Prevent tool use
tool_choice = {"type": "none"}
```

### Extended Thinking Compatibility

When using extended thinking, only two modes are supported [1][2]:
- `tool_choice: {"type": "auto"}` (default)
- `tool_choice: {"type": "none"}`

Using `tool_choice: {"type": "any"}` or `tool_choice: {"type": "tool", "name": "..."}` with extended thinking will result in an API error [1][2]. This constraint exists because forced tool use conflicts with how extended thinking operates internally.

### Prompt Caching Interaction

Changes to the `tool_choice` parameter will invalidate cached message blocks when using prompt caching [1][2]. However, tool definitions and system prompts remain cached; only message content must be reprocessed.

### Response Behavior by Mode

| Mode | Claude decides? | Natural language before tool? | Typical stop_reason |
|------|-----------------|-------------------------------|---------------------|
| `auto` | Yes | Yes | `end_turn` or `tool_use` |
| `none` | N/A (no tools) | Yes | `end_turn` |
| `any` | Chooses which tool | No | `tool_use` |
| `tool` | No | No | `tool_use` |

[1][2]

## Common Patterns

### Pattern 1: Structured JSON Extraction

Force a specific tool to guarantee JSON output matching a schema [3]:

```python
response = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=4096,
    tools=[{
        "name": "extract_entities",
        "description": "Extract named entities from text",
        "input_schema": {
            "type": "object",
            "properties": {
                "persons": {"type": "array", "items": {"type": "string"}},
                "organizations": {"type": "array", "items": {"type": "string"}}
            },
            "required": ["persons", "organizations"]
        }
    }],
    tool_choice={"type": "tool", "name": "extract_entities"},
    messages=[{"role": "user", "content": document_text}]
)
```

### Pattern 2: Natural Language with Encouraged Tool Use

Use `auto` with explicit instructions when you want both conversation and tool usage [1][2]:

```python
response = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=1024,
    tools=[weather_tool],
    tool_choice={"type": "auto"},  # Default
    messages=[{
        "role": "user",
        "content": "What's the weather like in London? Use the get_weather tool in your response."
    }]
)
```

### Pattern 3: SMS/Chat Bot Requiring Tool Output

Use `any` when every response must go through a tool (e.g., SMS systems) [3]:

```python
tools = [
    {"name": "send_text", "description": "Send a text message", ...},
    {"name": "lookup_order", "description": "Look up an order", ...}
]

response = client.messages.create(
    model="claude-opus-4-6",
    tools=tools,
    tool_choice={"type": "any"},  # Must use one of the tools
    messages=[{"role": "user", "content": user_message}]
)
```

### Pattern 4: Preventing Tool Use for Follow-up Questions

Use `none` when you want Claude to respond conversationally without tool access [2]:

```python
# First turn: allow tools
response1 = client.messages.create(tools=tools, tool_choice={"type": "auto"}, ...)

# Follow-up: no tools needed
response2 = client.messages.create(
    tools=tools,
    tool_choice={"type": "none"},  # Prevent tool use
    messages=[..., {"role": "user", "content": "Can you explain that result?"}]
)
```

## Gotchas

**1. No natural language with `any`/`tool` modes** — When `tool_choice` is `any` or `tool`, Claude will not provide explanatory text before the tool call, even if explicitly requested in the prompt [1][2]. This catches developers who expect a conversational preamble. Workaround: use `auto` mode with user-message instructions like "Use the X tool in your response."

**2. Extended thinking incompatibility** — Using `tool_choice: {"type": "any"}` or `tool_choice: {"type": "tool", "name": "..."}` with extended thinking causes an API error [1][2]. This is a hard constraint, not a warning. Only `auto` and `none` work with extended thinking.

**3. Cache invalidation on `tool_choice` changes** — Switching between tool choice modes invalidates the prompt cache for message content [1][2]. If you're optimizing for cached prompts, keep `tool_choice` consistent across related requests.

**4. Default values depend on tool presence** — When `tools` are provided, the default is `auto`. When no `tools` are provided, the default is `none` [1][2]. This can cause confusion when dynamically building requests.

**5. Over-eager tool use with `auto`** — Claude may call tools unnecessarily with `auto` mode, especially with brief prompts [1][3]. Mitigation: write detailed prompts explaining when tools should and should not be used, e.g., "Only search the web for queries you cannot confidently answer from existing knowledge."

**6. Schema enforcement requires `strict: true`** — Even with forced tool use (`any`/`tool`), Claude's tool inputs are not guaranteed to match your schema unless you also set `strict: true` on the tool definition [1]. Without strict mode, inputs may have incorrect types or missing fields.

**7. Tool name syntax for `tool` mode** — The `tool` type requires a nested `name` field: `{"type": "tool", "name": "my_tool"}` [1][2]. Using just `{"type": "my_tool"}` is a common syntax error.

## Sources

[1] **How to implement tool use - Claude API Docs**
    URL: https://platform.claude.com/docs/en/agents-and-tools/tool-use/implement-tool-use
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Comprehensive documentation on all four tool_choice modes, their syntax, behavior differences, extended thinking compatibility constraints, prompt caching interactions, and best practices for controlling Claude's output.

[2] **Tool use with Claude - Claude API Docs**
    URL: https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Overview of tool use concepts, default values for tool_choice, extended thinking limitations, and the relationship between tool_choice and parallel tool use control.

[3] **Tool choice - Anthropic Cookbook**
    URL: https://github.com/anthropics/anthropic-cookbook/blob/main/tool_use/tool_choice.ipynb
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Practical code examples for each tool_choice mode including auto with web search, forcing specific tools for sentiment analysis, and using any mode for SMS chatbots. Demonstrations of real behavior differences between modes.
