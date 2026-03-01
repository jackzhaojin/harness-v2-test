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
