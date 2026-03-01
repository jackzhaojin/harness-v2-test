# Combined Research: Agentic Patterns


---

# Extended Thinking Basics

**Topic ID:** agents.thinking.extended-thinking
**Researched:** 2026-03-01T12:00:00Z

## Overview

Extended thinking is Anthropic's feature that gives Claude enhanced reasoning capabilities by allowing the model to perform step-by-step internal reasoning before generating its final response. When enabled, Claude creates `thinking` content blocks containing its reasoning process, then incorporates insights from that reasoning into the final `text` response. This mirrors how humans approach complex problems—working through sub-steps, exploring alternatives, and verifying conclusions before committing to an answer.

The feature is controlled via the `thinking` parameter in API requests, with `budget_tokens` specifying how much reasoning the model can perform. Extended thinking is particularly valuable for tasks requiring multi-step reasoning: mathematical proofs, complex coding problems, analytical comparisons, and strategic planning. However, it's not universally beneficial—research shows it can actually hurt performance by up to 36% on intuitive tasks where "overthinking" is counterproductive, similar to how humans perform worse when deliberating too hard on pattern-matching or simple lookups.

Starting with Claude 4 models, the API returns *summarized* thinking rather than full reasoning output (Claude 3.7 Sonnet still returns full thinking). This summarization preserves the intelligence benefits while preventing misuse, though you're billed for the full thinking tokens generated, not the summary you see in the response.

## Key Concepts

- **`thinking` parameter**: The top-level API parameter that enables extended thinking. Set `type: "enabled"` with a `budget_tokens` value, or use `type: "adaptive"` for Claude Opus 4.6+.

- **`budget_tokens`**: Maximum tokens Claude can use for internal reasoning. Minimum is 1,024 tokens. Must be less than `max_tokens` (except with interleaved thinking). Claude may not use the full budget, especially above 32K tokens.

- **Thinking blocks**: Content blocks with `type: "thinking"` in the response containing Claude's reasoning. Include a `signature` field for verification when passing back to the API.

- **Summarized thinking**: Claude 4 models return condensed versions of reasoning. The first few lines are more verbose for prompt engineering. You're billed for full tokens, not the summary.

- **Interleaved thinking**: Beta feature (header: `interleaved-thinking-2025-05-14`) allowing Claude to reason between tool calls. Automatic in Claude Opus 4.6 with adaptive thinking.

- **Redacted thinking**: Encrypted thinking blocks (`type: "redacted_thinking"`) when safety systems flag content. Must be passed back unmodified; Claude can still use them.

- **Adaptive thinking**: Recommended for Claude Opus 4.6+. Uses `type: "adaptive"` instead of manual budgets, letting Claude dynamically determine reasoning depth. Manual `budget_tokens` is deprecated on Opus 4.6.

- **Signature field**: Encrypted verification data attached to thinking blocks. Required when passing thinking back to the API during tool use loops.

## Technical Details

### Enabling Extended Thinking

```python
import anthropic

client = anthropic.Anthropic()

response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=16000,
    thinking={"type": "enabled", "budget_tokens": 10000},
    messages=[
        {"role": "user", "content": "Prove there are infinitely many primes p where p mod 4 = 3"}
    ],
)

for block in response.content:
    if block.type == "thinking":
        print(f"Thinking: {block.thinking}")
    elif block.type == "text":
        print(f"Response: {block.text}")
```

### Response Structure

```json
{
  "content": [
    {
      "type": "thinking",
      "thinking": "Let me analyze this step by step...",
      "signature": "WaUjzkypQ2mUEVM36O2TxuC06KN8xyfbJwyem2dw3URve..."
    },
    {
      "type": "text",
      "text": "Based on my analysis..."
    }
  ]
}
```

### Streaming Extended Thinking

Streaming uses `thinking_delta` events for reasoning content:

```python
with client.messages.stream(
    model="claude-sonnet-4-6",
    max_tokens=16000,
    thinking={"type": "enabled", "budget_tokens": 10000},
    messages=[{"role": "user", "content": "What is GCD(1071, 462)?"}],
) as stream:
    for event in stream:
        if event.type == "content_block_delta":
            if event.delta.type == "thinking_delta":
                print(event.delta.thinking, end="", flush=True)
            elif event.delta.type == "text_delta":
                print(event.delta.text, end="", flush=True)
```

**Streaming requirement**: When `max_tokens` > 21,333, streaming is required to avoid HTTP timeouts.

### Tool Use with Thinking

When using tools with extended thinking, thinking blocks must be preserved and passed back:

```python
# After receiving tool_use response with thinking
thinking_block = next(b for b in response.content if b.type == "thinking")
tool_use_block = next(b for b in response.content if b.type == "tool_use")

# Continue conversation - MUST include thinking_block
continuation = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=16000,
    thinking={"type": "enabled", "budget_tokens": 10000},
    tools=[weather_tool],
    messages=[
        {"role": "user", "content": "What's the weather in Paris?"},
        {"role": "assistant", "content": [thinking_block, tool_use_block]},  # Include both!
        {"role": "user", "content": [{"type": "tool_result", "tool_use_id": tool_use_block.id, "content": "20°C, sunny"}]},
    ],
)
```

### Supported Models

| Model | Extended Thinking | Notes |
|-------|-------------------|-------|
| Claude Opus 4.6 | Adaptive only | Manual `budget_tokens` deprecated |
| Claude Sonnet 4.6 | Both manual + adaptive | Supports interleaved thinking beta |
| Claude Opus 4/4.1/4.5 | Manual | Interleaved with beta header |
| Claude Sonnet 4/4.5 | Manual | Interleaved with beta header |
| Claude Haiku 4.5 | Manual | Summarized thinking |
| Claude Sonnet 3.7 | Manual | Returns **full** thinking (not summarized) |

## Common Patterns

### Budget Sizing Strategy

Start with the 1,024 token minimum and scale up based on task complexity:
- **Simple reasoning** (basic math, straightforward analysis): 1,024–4,000 tokens
- **Moderate complexity** (multi-step problems, code review): 8,000–16,000 tokens
- **Complex tasks** (proofs, architecture design): 16,000–32,000 tokens
- **Very complex** (>32K): Use batch processing to avoid timeouts

### Enabling Interleaved Thinking (Claude 4 models)

```bash
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "anthropic-beta: interleaved-thinking-2025-05-14" \
  -H "content-type: application/json" \
  -d '{
    "model": "claude-sonnet-4-6",
    "max_tokens": 16000,
    "thinking": {"type": "enabled", "budget_tokens": 10000},
    "tools": [...],
    "messages": [...]
  }'
```

### Using Adaptive Thinking (Claude Opus 4.6)

```python
response = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=16000,
    thinking={"type": "adaptive"},  # No budget_tokens needed
    messages=[{"role": "user", "content": "Complex analysis task..."}],
)
```

### Amazon Bedrock Configuration

```json
{
  "anthropic_version": "bedrock-2023-05-31",
  "max_tokens": 10000,
  "thinking": {
    "type": "enabled",
    "budget_tokens": 4000
  },
  "messages": [...]
}
```

## Gotchas

- **Token billing mismatch**: You're billed for *full* thinking tokens, not the summarized output. The `usage` field shows the real cost, which won't match visible token counts.

- **`budget_tokens` < `max_tokens` required**: The budget must be less than max_tokens, except when using interleaved thinking with tools (where budget can use the full 200K context).

- **Cannot pre-fill responses**: Assistant pre-fill is incompatible with extended thinking. Attempting it causes errors.

- **Tool choice restrictions**: Only `tool_choice: "auto"` (default) or `"none"` work. Using `"any"` or specific tool names errors because forced tool use conflicts with thinking.

- **No mid-turn thinking toggle**: You cannot enable/disable thinking during a tool use loop. The entire assistant turn must use one mode. If you try to toggle, thinking silently disables.

- **Thinking blocks must be preserved in tool loops**: Omitting thinking blocks when continuing with tool results breaks reasoning continuity. Always pass complete, unmodified blocks back.

- **Context window strict enforcement**: Claude 3.7+ enforces `prompt_tokens + max_tokens ≤ context_window` strictly. Older models auto-adjusted; newer ones return validation errors.

- **32K+ budgets need batch processing**: Large thinking budgets cause long-running requests that hit HTTP timeouts. Use batch API for heavy reasoning.

- **Cache invalidation**: Changing `budget_tokens` invalidates message cache breakpoints (system prompts/tools stay cached).

- **"Think" prompt sensitivity**: When thinking is *disabled*, Claude Opus 4.5 is sensitive to "think" and variants. Use "consider," "evaluate," or "reason through" instead.

- **Extended thinking isn't always better**: Simple questions, creative writing, quick lookups, and pattern matching often perform *worse* with extended thinking—up to 36% degradation on some intuitive tasks.

- **Signature field is opaque**: Never parse or modify the `signature` field—it's only for API verification.

## Sources

- [Building with extended thinking - Claude API Docs](https://platform.claude.com/docs/en/build-with-claude/extended-thinking) — Primary source for API parameters, code examples, streaming, tool use integration, caching behavior, and thinking encryption
- [Extended thinking - Amazon Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/claude-messages-extended-thinking.html) — Bedrock-specific configuration, model IDs, and platform differences
- [Extended thinking tips - Claude API Docs](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/extended-thinking-tips) — Best practices for prompting and when to use/avoid extended thinking
- [Adaptive thinking - Claude API Docs](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking) — Documentation on adaptive thinking for Claude 4.6 models


---

# Adaptive Thinking and Effort Parameter

**Topic ID:** agents.thinking.adaptive-thinking
**Researched:** 2026-03-01T12:00:00Z

## Overview

Adaptive thinking is Anthropic's recommended approach for controlling Claude's extended reasoning capabilities in Claude Opus 4.6 and Sonnet 4.6. Rather than manually specifying a fixed token budget for thinking, adaptive thinking allows Claude to dynamically determine when and how much internal reasoning to apply based on each request's complexity. This represents a significant shift from the earlier `budget_tokens` approach, which required developers to predict appropriate reasoning allocation upfront.

The effort parameter works alongside adaptive thinking to provide high-level control over Claude's token expenditure. With four levels—`low`, `medium`, `high`, and `max`—developers can tune the tradeoff between response quality and cost/latency without micromanaging token budgets. This system is particularly effective for agentic workflows and tool-heavy applications where reasoning requirements vary dramatically across different steps.

Adaptive thinking automatically enables interleaved thinking, meaning Claude can reason between tool calls rather than only at the start of an assistant turn. This makes it especially powerful for multi-step agents that need to process tool results and adjust strategy mid-execution.

## Key Concepts

- **Adaptive thinking mode**: Set via `thinking: {type: "adaptive"}` in API calls. Claude evaluates each request's complexity and allocates thinking tokens accordingly. No manual budget specification required.

- **Effort parameter**: A behavioral signal (`low`, `medium`, `high`, `max`) that guides Claude's token spending across text responses, tool calls, and thinking. Set via `output_config: {effort: "medium"}`.

- **Interleaved thinking**: Automatically enabled with adaptive thinking. Allows Claude to reason after receiving tool results, not just at the start of a turn. Critical for sophisticated agent behavior.

- **Summarized thinking**: Claude 4 models return a summary of the full thinking process rather than raw thinking tokens. You're billed for full thinking tokens, not the summary you see in responses.

- **Thinking blocks**: Content blocks of type `thinking` returned in API responses. Include a `signature` field for verification and must be passed back unmodified during tool use loops.

- **Budget_tokens deprecation**: The manual `thinking: {type: "enabled", budget_tokens: N}` approach is deprecated on Opus 4.6 and Sonnet 4.6. It still works but will be removed in a future release.

- **Model support**: Adaptive thinking works on Claude Opus 4.6 and Sonnet 4.6 only. Older models require manual `budget_tokens` configuration.

## Technical Details

### API Configuration

Enable adaptive thinking with the effort parameter:

```python
import anthropic

client = anthropic.Anthropic()

response = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=16000,
    thinking={"type": "adaptive"},
    output_config={"effort": "medium"},
    messages=[
        {"role": "user", "content": "Analyze this codebase for security vulnerabilities."}
    ],
)

for block in response.content:
    if block.type == "thinking":
        print(f"Thinking: {block.thinking}")
    elif block.type == "text":
        print(f"Response: {block.text}")
```

### Effort Level Behaviors

| Level | Thinking Behavior | Typical Use Case |
|-------|-------------------|------------------|
| `max` | Always thinks, no constraints. Opus 4.6 only. | Deepest reasoning, thorough analysis |
| `high` | Always thinks (default behavior) | Complex reasoning, difficult coding |
| `medium` | Moderate thinking, may skip for simple queries | Agentic coding, tool-heavy workflows |
| `low` | Minimal thinking, skips for simple tasks | High-volume, latency-sensitive tasks |

### Effort Effects on Tool Use

Lower effort levels cause Claude to:
- Combine operations into fewer tool calls
- Proceed directly without preamble
- Use terse confirmation messages

Higher effort levels cause Claude to:
- Make more tool calls for thoroughness
- Explain plans before execution
- Provide detailed summaries

### Streaming with Adaptive Thinking

```python
with client.messages.stream(
    model="claude-opus-4-6",
    max_tokens=16000,
    thinking={"type": "adaptive"},
    messages=[{"role": "user", "content": "Solve this math problem..."}],
) as stream:
    for event in stream:
        if event.type == "content_block_delta":
            if event.delta.type == "thinking_delta":
                print(event.delta.thinking, end="", flush=True)
            elif event.delta.type == "text_delta":
                print(event.delta.text, end="", flush=True)
```

### Claude Code Trigger Words

In Claude Code CLI, natural language triggers map to effort levels:

- **"think"** → Small reasoning boost
- **"think hard"** → Medium-depth analysis
- **"think harder"** → Extended thinking
- **"ultrathink"** → Maximum reasoning depth (maps to `max` effort)

Usage: "Ultrathink this authentication bug" naturally in prompts.

## Common Patterns

### Agentic Workflow with Adaptive Thinking

For agents that make multiple tool calls, adaptive thinking with medium effort provides the best balance:

```python
response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=16000,
    thinking={"type": "adaptive"},
    output_config={"effort": "medium"},
    tools=[search_tool, calculator_tool, file_tool],
    messages=[{"role": "user", "content": "Research and summarize..."}],
)
```

### Dynamic Effort Based on Task Complexity

Adjust effort programmatically based on task type:

```python
def get_effort_for_task(task_type):
    if task_type in ["debug", "architecture", "security"]:
        return "high"
    elif task_type in ["code_generation", "refactor"]:
        return "medium"
    else:
        return "low"
```

### Preserving Thinking in Multi-Turn Tool Use

During tool use loops, pass back thinking blocks unmodified:

```python
# After receiving tool_use block, include thinking when continuing
continuation = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=16000,
    thinking={"type": "adaptive"},
    tools=[weather_tool],
    messages=[
        {"role": "user", "content": "What's the weather?"},
        {"role": "assistant", "content": [thinking_block, tool_use_block]},
        {"role": "user", "content": [{"type": "tool_result", "tool_use_id": tool_id, "content": "72°F"}]},
    ],
)
```

### Prompt-Based Thinking Tuning

Add guidance in system prompts to influence when Claude thinks:

```text
Extended thinking adds latency and should only be used when it
will meaningfully improve answer quality — typically for problems
that require multi-step reasoning. When in doubt, respond directly.
```

## Gotchas

- **Max effort is Opus 4.6 only**: Using `effort: "max"` on other models returns an error. It does not fall back gracefully.

- **Billing mismatch**: You're billed for full thinking tokens, not summarized output. The token count you see in responses won't match your bill. Monitor the `usage` object in API responses.

- **Switching thinking modes breaks cache**: Changing between `adaptive` and `enabled`/`disabled` modes invalidates message cache breakpoints. System prompts and tool definitions remain cached.

- **Can't toggle mid-turn**: You cannot switch thinking modes during a tool use loop. The entire assistant turn must use the same thinking configuration. If you try, thinking is silently disabled.

- **Interleaved thinking requires adaptive mode on Opus 4.6**: Unlike Sonnet 4.6 which supports both the beta header and adaptive mode for interleaved thinking, Opus 4.6 only supports interleaved thinking via adaptive mode.

- **MAX_THINKING_TOKENS ignored on 4.6 models**: In Claude Code, the environment variable `MAX_THINKING_TOKENS` has no effect on Opus 4.6 and Sonnet 4.6 since they use adaptive reasoning. Exception: setting it to `0` still disables thinking.

- **Validation flexibility**: Unlike manual mode, adaptive thinking doesn't require assistant turns to start with thinking blocks. This is more permissive but may cause confusion when mixing modes.

- **Effort is a signal, not a guarantee**: Lower effort levels still trigger thinking on sufficiently hard problems—just less thinking than higher levels would use for the same problem.

- **Sonnet 4.6 recommendation**: Anthropic recommends explicitly setting effort to `medium` for most Sonnet 4.6 workloads rather than relying on the `high` default, to balance speed, cost, and performance.

## Sources

- [Adaptive thinking - Claude API Docs](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking) — Primary documentation on adaptive thinking configuration, streaming, and comparison with manual mode
- [Effort - Claude API Docs](https://platform.claude.com/docs/en/build-with-claude/effort) — Complete reference for effort parameter levels, behaviors, and integration with thinking
- [Building with extended thinking - Claude API Docs](https://platform.claude.com/docs/en/build-with-claude/extended-thinking) — Deep dive on thinking mechanics, tool use integration, caching, and migration from budget_tokens
- [How to make Claude Code think harder | @kentgigger](https://kentgigger.com/posts/claude-code-thinking-triggers) — Practical guide to thinking trigger words in Claude Code CLI


---

# Interleaved Thinking with Tools

**Topic ID:** agents.thinking.interleaved-thinking
**Researched:** 2026-03-01T12:00:00Z

## Overview

Interleaved thinking is a reasoning paradigm that enables AI models to alternate between internal reasoning steps and external actions (such as tool calls) during task execution. Unlike traditional approaches where a model generates a complete chain of thought before acting, interleaved thinking creates a dynamic **plan → act → reflect** loop. The model reasons, executes a tool, ingests the result, updates its plan, and repeats—carrying forward hypotheses and constraints between steps.

This capability is particularly critical for complex agentic workflows where the path isn't clear from step one. When a shell command fails, the model reads the error and adjusts its next move immediately. When API results don't match expectations, the model can reconsider its approach before proceeding. This prevents the "memory loss" and state drift common in long multi-step tasks.

Interleaved thinking emerged as a major advancement in 2025. Anthropic introduced it in Claude 4 models (May 2025), MiniMax released M2 as the first major open-weight model with the capability (October 2025), and Moonshot AI's Kimi K2 Thinking followed (November 2025). Benchmark results demonstrate significant improvements: MiniMax-M2 showed a 40% improvement on BrowseComp and 3.3% on SWE-Bench Verified when interleaved thinking was enabled.

## Key Concepts

- **Thinking Blocks**: Structured content blocks in API responses containing the model's internal reasoning. These blocks capture step-by-step analysis that led to tool requests and must be preserved across multi-turn conversations.

- **Tool Use Loop**: A conceptual unit where tool calls and their results are part of a single "assistant turn." An assistant turn doesn't complete until the model finishes its full response, which may include multiple tool calls and results.

- **Reasoning Continuity**: The preservation of thinking context across tool invocations. When tool results are returned, including original thinking ensures the model can continue reasoning from where it left off.

- **Budget Tokens**: A parameter controlling how many tokens the model can use for internal reasoning. With interleaved thinking, this budget applies across all thinking blocks within one assistant turn and can exceed `max_tokens`.

- **Summarized Thinking**: Claude 4 models return a summary of the full thinking process rather than raw output. You're billed for full thinking tokens, not summary tokens.

- **Signature Field**: An encrypted verification field ensuring thinking blocks were generated by the model. Required when passing thinking blocks back to the API.

- **Redacted Thinking**: Occasionally, safety systems flag internal reasoning. These blocks are encrypted and returned as `redacted_thinking`, which can still be passed back to maintain context.

- **ReAct Pattern**: The foundational "Reasoning and Acting" paradigm where agents alternate between Thought (internal reasoning), Action (tool execution), and Observation (processing results).

## Technical Details

### Enabling Interleaved Thinking

For Claude models, interleaved thinking is enabled via API configuration:

```python
import anthropic

client = anthropic.Anthropic()

response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=16000,
    thinking={"type": "enabled", "budget_tokens": 10000},
    tools=[weather_tool],
    messages=[{"role": "user", "content": "What's the weather in Paris?"}],
    extra_headers={"anthropic-beta": "interleaved-thinking-2025-05-14"}
)
```

**Model-specific behavior:**
- **Claude Opus 4.6**: Use adaptive thinking (`thinking: {type: "adaptive"}`). Beta header is deprecated.
- **Claude Sonnet 4.6**: Supports both manual mode with beta header and adaptive thinking.
- **Other Claude 4 models**: Require the `interleaved-thinking-2025-05-14` beta header.

### Preserving Thinking Blocks

When continuing a conversation with tool results, you must pass thinking blocks back unmodified:

```python
# After receiving response with thinking + tool_use blocks
thinking_block = next(b for b in response.content if b.type == "thinking")
tool_use_block = next(b for b in response.content if b.type == "tool_use")

# Continue conversation - include both blocks
continuation = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=16000,
    thinking={"type": "enabled", "budget_tokens": 10000},
    tools=[weather_tool],
    messages=[
        {"role": "user", "content": "What's the weather in Paris?"},
        {"role": "assistant", "content": [thinking_block, tool_use_block]},
        {"role": "user", "content": [
            {"type": "tool_result", "tool_use_id": tool_use_block.id, "content": "20°C"}
        ]},
    ],
)
```

### OpenAI-Compatible APIs (MiniMax, vLLM)

For OpenAI-compatible implementations, reasoning is passed separately:

```bash
vllm serve MODEL_NAME \
  --tool-call-parser minimax_m2 \
  --reasoning-parser minimax_m2 \
  --enable-auto-tool-choice
```

The `reasoning_details` field must be passed in subsequent requests to maintain the reasoning chain.

### Streaming Considerations

Extended thinking responses can be streamed using server-sent events:

```python
with client.messages.stream(
    model="claude-sonnet-4-6",
    max_tokens=16000,
    thinking={"type": "enabled", "budget_tokens": 10000},
    messages=[{"role": "user", "content": prompt}],
) as stream:
    for event in stream:
        if event.type == "content_block_delta":
            if event.delta.type == "thinking_delta":
                print(f"Thinking: {event.delta.thinking}")
            elif event.delta.type == "text_delta":
                print(f"Response: {event.delta.text}")
```

Streaming is **required** when `max_tokens` exceeds 21,333 to avoid HTTP timeouts.

## Common Patterns

### Multi-Step Analysis with Self-Correction

```text
User: "Analyze sales data and create a visualization"

Turn 1: [thinking] "I need to first fetch the sales data..."
        [tool_use: fetch_data] { "table": "sales" }
  ↓ tool result: { "data": [...] }

Turn 2: [thinking] "Data received. I notice missing Q4 values.
         Let me query specifically for Q4..."
        [tool_use: fetch_data] { "table": "sales", "quarter": "Q4" }
  ↓ tool result: { "data": [...] }

Turn 3: [thinking] "Now I have complete data. Creating chart..."
        [tool_use: create_chart] { "type": "bar", "data": [...] }
```

### Error Recovery

When a tool call fails, interleaved thinking allows the model to reason about the error and adapt:

```text
Turn 1: [thinking] "Running database query..."
        [tool_use: query_db] { "sql": "SELECT * FROM users" }
  ↓ tool result: "Error: table 'users' does not exist"

Turn 2: [thinking] "The table doesn't exist. Let me check available tables..."
        [tool_use: list_tables] {}
  ↓ tool result: ["customers", "orders", "products"]

Turn 3: [thinking] "The user data is in 'customers' table. Adjusting query..."
        [tool_use: query_db] { "sql": "SELECT * FROM customers" }
```

### Hypothesis Testing

The model can form hypotheses, test them with tools, and refine understanding:

```text
[thinking] "User reports slow API. Hypothesis: database bottleneck..."
[tool_use: check_db_metrics] {}
↓ "Database latency: 5ms (normal)"

[thinking] "Database is fine. Let me check network..."
[tool_use: check_network_latency] {}
↓ "Network latency: 500ms (high)"

[thinking] "Network is the issue. Checking CDN configuration..."
```

## Gotchas

- **Cannot toggle thinking mid-turn**: The entire assistant turn (including all tool calls) must operate in a single thinking mode. Attempting to toggle mid-turn will silently disable thinking for that request.

- **Tool choice limitations**: Tool use with thinking only supports `tool_choice: {"type": "auto"}` or `tool_choice: {"type": "none"}`. Forced tool use (`type: "any"` or specific tool) is incompatible with extended thinking.

- **Cache invalidation**: Changes to thinking parameters (`budget_tokens`) invalidate message cache breakpoints. System prompts and tool definitions remain cached.

- **Token accounting confusion**: With summarized thinking, billed output tokens won't match visible tokens. You're charged for full thinking, not the summary.

- **OpenAI API incompatibility**: The OpenAI Chat Completion API does not natively support passing reasoning content back in subsequent requests. This breaks interleaved thinking chains unless developers manually preserve and resubmit reasoning.

- **Context window calculation**: Thinking blocks from previous turns are stripped from context (except in Claude Opus 4.5+), but current-turn thinking counts toward `max_tokens`.

- **Increased latency and cost**: Interleaved thinking generates more tokens and increases response time. Consider this for latency-sensitive applications.

- **Streaming required for large outputs**: SDKs require streaming when `max_tokens` > 21,333 to avoid HTTP timeouts.

- **Thinking block ordering matters**: When providing thinking blocks back to the API, the entire sequence must match the original output exactly—no rearranging or modifying.

## Sources

- [Building with extended thinking - Claude Docs](https://platform.claude.com/docs/en/build-with-claude/extended-thinking) — Comprehensive official documentation on extended thinking, interleaved thinking, tool use, streaming, and caching
- [Interleaved Thinking - MiniMax News](https://www.minimax.io/news/why-is-interleaved-thinking-important-for-m2) — Technical deep dive on plan→act→reflect loop and benchmark improvements
- [Interleaved Thinking - vLLM](https://docs.vllm.ai/en/latest/features/interleaved_thinking/) — Server configuration and API usage for open-source implementations
- [ReAct Prompting Guide](https://www.promptingguide.ai/techniques/react) — Foundation of the reasoning-and-acting paradigm underlying interleaved thinking
- [ReAct: Synergizing Reasoning and Acting - arXiv](https://arxiv.org/abs/2210.03629) — Original academic paper introducing the ReAct framework
- [What is a ReAct Agent? - IBM](https://www.ibm.com/think/topics/react-agent) — Conceptual overview of reasoning and acting in LLM agents


---

# State Management and Progress Tracking

**Topic ID:** agents.long-horizon.state-management
**Researched:** 2026-03-01T12:00:00Z

## Overview

State management in long-horizon AI agents refers to the persistent tracking of agent progress, decisions, and context across extended task executions that may span thousands of tool calls, multiple sessions, or days of elapsed time. Unlike traditional software state management, agent state must accommodate the unique constraints of LLM context windows, the probabilistic nature of language model outputs, and the need for human-interpretable progress records.

Effective state management solves three critical problems: preventing agents from losing progress when context windows reset, enabling agents to resume interrupted work without starting over, and maintaining accurate records as the underlying environment (code, data, configurations) evolves. The approaches fall into three categories: structured formats for precise state representation, version control systems (particularly git) for checkpointing and branching, and unstructured text notes for flexible progress tracking.

This topic has become increasingly important as agents tackle multi-hour workflows in software development, data analysis, and autonomous operations. Without robust state management, agents exhibit degraded performance on long tasks, repetitive behavior, and an inability to recover from interruptions or errors.

## Key Concepts

- **Checkpoint**: A serialized snapshot of agent state captured at defined intervals (typically at "supersteps" or milestone completions). Checkpoints enable rollback, resumption after failures, and migration across environments.

- **Context Compaction**: The process of summarizing or pruning older context to stay within token limits while preserving essential information. Strategies include removing cached tool outputs, summarizing completed work, and offloading details to external storage.

- **Memory Hierarchy**: A tiered architecture separating working memory (current task context), short-term memory (recent session data), and long-term memory (persistent knowledge stored in vector databases or files).

- **State Scope**: Determines what boundaries state crosses—across messages (single session), across sessions (multiple interactions), across tool calls (within execution), or across multiple agents (shared context).

- **Git-Based Versioning**: Using version control operations (commit, branch, merge) as primitives for agent state management, enabling isolated exploration, milestone tracking, and structured rollback.

- **Citation-Based Verification**: Storing memories with references to specific code or data locations, then verifying citations remain valid before applying stored knowledge (used by GitHub Copilot).

- **Progress Notes**: Unstructured or semi-structured text files (e.g., `NOTES.md`, `progress.md`) that agents maintain to track completed work, pending tasks, and learned insights outside the context window.

- **Superstep**: A unit of workflow execution after which checkpoints are created; represents a logical boundary where all concurrent executors have completed their work.

## Technical Details

### Checkpoint Storage Patterns

Checkpoints typically capture: executor states, pending messages, request/response queues, and shared state variables. Two primary storage approaches exist:

**In-Memory Checkpointing** (for development/testing):
```python
from agent_framework import InMemoryCheckpointStorage

checkpoint_storage = InMemoryCheckpointStorage()
builder = WorkflowBuilder(start_executor=start, checkpoint_storage=checkpoint_storage)
workflow = builder.build()

async for event in workflow.run_streaming(input):
    ...

# Retrieve checkpoints
checkpoints = await checkpoint_storage.list_checkpoints()
```

**Durable Checkpointing** (for production):
```python
# Resume from a specific checkpoint
saved_checkpoint = checkpoints[5]
async for event in workflow.run_stream(
    checkpoint_id=saved_checkpoint.checkpoint_id,
    checkpoint_storage=checkpoint_storage,
):
    ...
```

Executors must implement save/restore hooks:
```python
class CustomExecutor(Executor):
    async def on_checkpoint_save(self) -> dict[str, Any]:
        return {"messages": self._messages, "state": self._current_state}

    async def on_checkpoint_restore(self, state: dict[str, Any]) -> None:
        self._messages = state.get("messages", [])
        self._current_state = state.get("state", {})
```

### Git Context Controller (GCC) Operations

The GCC framework structures agent memory using git-like primitives:

| Operation | Purpose | When to Use |
|-----------|---------|-------------|
| `COMMIT` | Checkpoint meaningful progress | After achieving coherent milestones |
| `BRANCH` | Create isolated exploration space | When detecting directional shifts or experiments |
| `MERGE` | Synthesize completed work | After evaluating alternatives |
| `CONTEXT` | Retrieve state at varying granularity | When resuming or needing historical context |

Memory is organized hierarchically:
- **Global level** (`main.md`): Project goals, milestones, shared planning
- **Commit level** (`commit.md`): Branch purpose, historical summaries, current contributions
- **Execution level** (`log.md`): Fine-grained Observation-Thought-Action cycles

### Structured Progress Notes Format

A practical pattern for unstructured progress tracking:

```markdown
# Session Progress

## Current State
- Working on: [specific task]
- Blocked by: [blockers if any]
- Last checkpoint: step 1276/1500

## Completed Work
- [x] Implemented user authentication module
- [x] Added error handling for API endpoints

## Learned Context
- API versions must stay synchronized across /config.yaml and /deploy.yaml
- Test suite requires DATABASE_URL environment variable

## Next Steps
1. Complete remaining 224 steps
2. Run integration tests
3. Update documentation
```

## Common Patterns

### Pattern 1: Hierarchical Memory with Compaction

For long-running agents, implement a three-tier memory system:
1. **Working memory**: Full context for current task (in prompt)
2. **Session memory**: Compressed summaries of completed work (reinjected as needed)
3. **Persistent memory**: Vector database or file storage for cross-session knowledge

When approaching context limits, trigger compaction:
- Remove raw tool outputs from early in the conversation
- Replace detailed exploration with condensed summaries (1,000-2,000 tokens)
- Preserve architectural decisions and unresolved issues

### Pattern 2: Git-Backed Multi-Agent Coordination

When multiple sub-agents work concurrently:
1. Assign each agent an isolated git worktree
2. Agents work independently, committing to their branches
3. Merge changes back using standard git conflict resolution
4. Main orchestrator synthesizes results and resolves semantic conflicts

### Pattern 3: Just-In-Time Verification

For agents operating on evolving codebases (like GitHub Copilot):
1. Store memories with citations (file paths, line numbers)
2. Before applying any stored memory, verify citations still match current state
3. If verification fails, either discard the memory or create a corrected version
4. Let the memory pool "self-heal" through agent-driven corrections

### Pattern 4: Checkpoint-Based Recovery

For workflows requiring fault tolerance:
```python
# Enable checkpointing at workflow creation
checkpoint_manager = CheckpointManager()
checkpointed_run = await InProcessExecution.StreamAsync(
    workflow, input, checkpoint_manager
)

# On failure, resume from last good checkpoint
saved_checkpoint = checkpoints[-1]
await checkpointed_run.RestoreCheckpointAsync(saved_checkpoint)
```

## Gotchas

- **Memory bloat degrades performance**: Indiscriminate storage without deletion strategies causes error propagation. Research shows utility-based deletion yields up to 10% performance gains over naive strategies.

- **Checkpoint size limits**: DynamoDB-based checkpointers store small checkpoints (< 350 KB) directly but offload larger ones to S3. Expect similar patterns across storage backends.

- **State invalidation in evolving environments**: Stored memories about code or data become stale. Without citation verification or timestamp-based expiration, agents apply outdated information. GitHub's A/B tests showed 7% improvement when using verification.

- **Compaction loses critical details**: Aggressive summarization can discard information that becomes relevant later. Prefer selective retention of architectural decisions, error patterns, and environmental constraints over raw outputs.

- **Cross-session state requires explicit scoping**: State that works "across messages" (single session) differs from "across sessions" (persistent). Mixing these scopes causes subtle bugs where agents expect state that no longer exists.

- **Sub-agent isolation vs. coordination tradeoff**: Isolated sub-agents prevent context pollution but require explicit state merging. Shared state enables coordination but risks conflicts. Choose based on task independence.

- **Schema drift**: Checkpoints saved with one schema may not restore correctly after code changes. Version your checkpoint schema and implement migration strategies for production systems.

## Sources

- [Effective Context Engineering for AI Agents (Anthropic)](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) — Core patterns for context compaction, progress notes, and sub-agent architectures
- [Context Repositories: Git-based Memory for Coding Agents (Letta)](https://www.letta.com/blog/context-repositories) — Git-backed versioning, concurrent multi-agent coordination, memory lifecycle operations
- [Git Context Controller (arXiv)](https://arxiv.org/html/2508.00031v1) — GCC framework details, COMMIT/BRANCH/MERGE/CONTEXT operations, versioned memory hierarchy
- [Microsoft Agent Framework - Checkpointing and Resuming](https://learn.microsoft.com/en-us/agent-framework/tutorials/workflows/checkpointing-and-resuming) — Technical implementation of workflow checkpointing with code examples
- [Building an Agentic Memory System for GitHub Copilot (GitHub Blog)](https://github.blog/ai-and-ml/github-copilot/building-an-agentic-memory-system-for-github-copilot/) — Citation-based verification, cross-agent memory sharing, just-in-time validation
- [Memory and State in LLM Applications (Arize AI)](https://arize.com/blog/memory-and-state-in-llm-applications/) — State scope taxonomy, memory hierarchy patterns, tradeoff analysis


---

# Multi-Context Window Workflows

**Topic ID:** agents.long-horizon.multi-context-workflows
**Researched:** 2026-03-01T12:00:00Z

## Overview

Multi-context window workflows address a fundamental challenge in AI agent systems: LLMs are stateless by design, meaning they cannot inherently remember past interactions once a session ends or the context window fills up. For long-horizon tasks—those spanning tens of minutes to multiple hours of continuous work—agents must employ specialized techniques to maintain coherence, track progress, and gracefully continue across discrete context windows.

The core problem is that each new context window starts as a blank slate. Without explicit state management, an agent cannot know what work was previously completed, what decisions were made, or what remains to be done. This becomes critical for complex tasks like large codebase migrations, comprehensive research projects, or multi-day development workflows where the token count far exceeds any single context window's capacity.

Modern solutions combine several complementary strategies: compaction (summarizing filled context windows before starting fresh), persistent external state (files tracking progress and decisions), structured handoff protocols (init scripts and progress logs), and hierarchical agent architectures (sub-agents handling focused tasks with isolated context). Together, these enable agents to theoretically work for arbitrarily long periods while maintaining quality and avoiding redundant work.

## Key Concepts

- **Context Compaction**: The practice of summarizing a conversation nearing the context limit and reinitiating with that summary. This preserves critical information while freeing tokens. Claude Code implements "auto-compact" at 95% context capacity using recursive compression strategies.

- **State Persistence**: Mechanisms for maintaining information across context windows, including progress files (`claude-progress.txt`), git history, JSON feature lists, and external databases. This transforms stateless LLM sessions into a continuous workflow.

- **Initializer Agent Pattern**: A specialized first-session agent that establishes foundational infrastructure—setup scripts (`init.sh`), progress tracking files, initial git commits, and feature requirement documents—before any implementation begins.

- **Context Isolation**: Separating verbose output (test failures, build logs, file edits) into sub-agent context windows, preventing token exhaustion in the main conversation. This is what enables multi-hour autonomous operation.

- **Hierarchical Memory**: Multi-tier storage with short-term verbatim records, medium-term compressed summaries, and long-term extracted facts. Agents draw from all tiers, allocating more context budget to recent information while including relevant historical data.

- **Graceful Continuation**: The ability for subsequent sessions to quickly understand prior state, validate the codebase works, and resume from where previous work halted—typically achieved through structured progress files and git history.

- **Context Poisoning**: A failure mode where hallucinated or incorrect information enters a summary and propagates to all future sessions, corrupting the agent's understanding of the project state.

- **Sub-Agent Delegation**: Spawning specialized agents with dedicated context windows for focused tasks, returning compressed summaries (typically 1,000-2,000 tokens) to the lead agent while maintaining overall coherence.

## Technical Details

### Two-Part Session Architecture

The recommended architecture splits work into an initializer session and subsequent coding sessions:

**Initializer Agent (First Session)**
```
Responsibilities:
1. Set up init.sh script for development environment
2. Create claude-progress.txt for work logging
3. Generate structured feature list (JSON format)
4. Make initial git commit documenting setup
```

**Coding Agent (Subsequent Sessions)**
```
Onboarding sequence:
1. Run pwd to identify working directory
2. Read git logs and progress files for context
3. Select highest-priority incomplete feature
4. Start development server via init.sh
5. Run end-to-end tests before new implementation
6. Implement one feature incrementally
7. Commit with descriptive messages
8. Update progress documentation
```

### Feature List Structure

```json
{
  "category": "functional",
  "description": "User action and expected outcome",
  "steps": ["step1", "step2", "step3"],
  "passes": false
}
```

### Context Management Commands

| Command | Effect |
|---------|--------|
| `/compact` | Manually trigger context compression |
| `/clear` | Clear context while preserving disk-based state |
| `resume: <agent_id>` | Continue a previous sub-agent's work with full history |

### Sub-Agent Execution Modes

- **Foreground**: Blocks main session until completion (tasks under 30 seconds)
- **Background** (`run_in_background: true`): Asynchronous execution with notifications and output saved to file

### Memory Persistence Layers

```
┌─────────────────────────────────────────────┐
│ In-Context Memory (current session)         │
├─────────────────────────────────────────────┤
│ Persistent Memory Blocks (across LLM calls) │
├─────────────────────────────────────────────┤
│ External Memory (databases, vector stores)  │
└─────────────────────────────────────────────┘
```

## Common Patterns

### Todo-Driven Autonomous Execution

A proven pattern for extended runtime uses hierarchical agent delegation with todo lists:

```
/todo-all (slash command)
  └── loops through incomplete tasks
       └── @do-todo (agent) executes individual task
            └── @precommit-runner
            └── @git-commit-handler
            └── @git-rebaser
```

Each agent has a focused job with explicit delegation instructions. The main conversation stays clean because verbose output (test failures, build logs) happens inside sub-agent context windows. Reported runtimes: over 2 hours for file-porting tasks.

### Validation Before Implementation

Every session validates the codebase runs before implementing new features:

```bash
# Run init.sh to start environment
# Execute existing test suite
# Only proceed if tests pass
# This catches bugs from prior sessions
```

### Progress File Pattern

```markdown
# Progress Log

## 2026-03-01 Session 1
- Set up project structure
- Implemented user authentication
- Decision: Using JWT over sessions for statelessness
- Blocked: Need API key for external service

## 2026-03-01 Session 2
- Resolved API key issue
- Completed user authentication
- Started payment integration
```

### Context Refresh Strategy

For multi-day workflows:
1. Begin each day by reading `claude-progress.txt`
2. Review recent git history for implementation decisions
3. Run test suite to confirm working state
4. Continue with next priority item

## Gotchas

- **Compaction alone is insufficient**: While context compression helps, it cannot replace structured state management. Production-quality results require explicit progress tracking, feature lists, and validation steps.

- **Performance degradation at 35 minutes**: Research indicates agent performance degrades after approximately 35 minutes of human time on a task. Plan sub-agent boundaries accordingly.

- **Context poisoning is persistent**: If a hallucination enters a summary or progress file, it propagates to all future sessions. Implement validation checks and encourage explicit documentation of decisions with reasoning.

- **Token multiplication with sub-agents**: Multi-agent architectures can increase token usage by 15x compared to single-agent approaches. Use sub-agents for genuinely parallel work, not as a default pattern.

- **Don't edit test files to make them pass**: A common anti-pattern where agents modify tests rather than implementation. Instructions should explicitly state: "It is unacceptable to remove or edit tests because this could lead to missing or buggy functionality."

- **Context distraction from information density**: Simply filling the context window with information is counterproductive. Selective injection based on relevance outperforms exhaustive inclusion.

- **Resuming requires agent ID**: To continue a sub-agent's work, you must have its agent ID from the previous invocation. Without it, a new agent starts fresh with no context.

- **External memory retrieval unpredictability**: Automated retrieval from external memory can surface unexpected information, making behavior harder to predict. Log all retrieval operations for debugging.

- **Session vs memory confusion**: Sessions generate memories, but memories persist across sessions. Clearing a session doesn't clear memories; these are separate persistence layers requiring independent management.

## Sources

- [Effective harnesses for long-running agents - Anthropic Engineering](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) — Primary source for initializer/coding agent architecture, state persistence patterns, and anti-patterns
- [Effective context engineering for AI agents - Anthropic Engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) — Technical details on compaction, attention budget constraints, and structured note-taking
- [Context Engineering for Agents - LangChain Blog](https://blog.langchain.com/context-engineering-for-agents/) — Four strategies framework (write, select, compress, isolate) and LangGraph implementation details
- [Stateful Agents: The Missing Link in LLM Intelligence - Letta](https://www.letta.com/blog/stateful-agents) — Hierarchical memory architecture and multi-agent state sharing
- [The Task Tool: Claude Code's Agent Orchestration System - DEV Community](https://dev.to/bhaidar/the-task-tool-claude-codes-agent-orchestration-system-4bf2) — Sub-agent types, execution modes, and resumption patterns
- [Claude Code: Keeping It Running for Hours - motlin.com](https://motlin.com/blog/claude-code-running-for-hours) — Practical implementation of todo-driven autonomous execution and context isolation
- [Context Window Management Strategies - Maxim](https://www.getmaxim.ai/articles/context-window-management-strategies-for-long-context-ai-agents-and-chatbots/) — Sliding window architectures, hierarchical summarization, and external memory augmentation


---

# Subagent Orchestration

**Topic ID:** agents.orchestration.subagents
**Researched:** 2025-03-01T12:00:00Z

## Overview

Subagent orchestration is the practice of delegating specialized subtasks from a primary (lead or parent) agent to subordinate agents that operate under its coordination. This architectural pattern enables complex AI systems to decompose problems into manageable pieces, leverage specialized capabilities, and execute work in parallel when task dependencies allow.

The core value proposition is managing complexity: a single agent tasked with too many responsibilities becomes unreliable as instruction complexity increases. By assigning specific roles to individual subagents—a parser, a critic, a researcher—you build systems that are more modular, testable, and reliable. This mirrors microservices architecture in traditional software, where decomposition into specialized services improves maintainability and scalability.

The trade-off is significant: multi-agent systems typically consume 15× more tokens than single-agent approaches and introduce coordination overhead. The decision to use subagents should be justified by demonstrating that a single agent cannot reliably handle the task due to prompt complexity, tool overload, context window limits, or security requirements.

## Key Concepts

- **Orchestrator-Worker Pattern**: A lead agent coordinates while delegating to specialized subagents. The orchestrator analyzes queries, develops strategy, spawns subagents, and synthesizes results. This is the most common subagent architecture.

- **Task Decomposition**: Breaking complex problems into independent subtasks that can be assigned to specialized agents. Each subagent needs a clear objective, output format, tool/source guidance, and explicit task boundaries.

- **Parallel vs. Sequential Execution**: Parallel execution reduces latency when subtasks are independent; sequential execution is required when each step depends on the previous step's output. Hybrid approaches use sequential for initial processing and parallel for analysis phases.

- **Context Isolation**: Subagents maintain their own conversation history separate from the parent agent. This prevents context window overflow and allows each agent to focus on its specific domain.

- **Handoff Mechanism**: The transfer of control from one agent to another, implemented via tool calls (e.g., `transfer_to_agent(agent_name='target')`). Requires clear descriptions on target agents.

- **Fan-Out/Fan-In**: Spawning multiple subagents simultaneously (fan-out), then aggregating their results (fan-in). This resembles the scatter-gather cloud design pattern.

- **Scaling Effort by Complexity**: Match subagent count to task difficulty—simple fact-finding uses 1 agent with 3-10 tool calls; complex research may use 10+ subagents with divided responsibilities.

- **Aggregation Strategies**: Methods for combining parallel results—voting/majority-rule for classification, weighted merging for recommendations, or LLM-synthesized summaries for reconciling narratives.

## Technical Details

### When to Use Subagents

Use the subagent pattern when:
- Task complexity exceeds a single context window
- Parallel processing cuts latency by more than 50% (after accounting for coordination overhead)
- Three or more domains need contradictory optimizations
- Tasks require multiple perspectives to negotiate
- Security boundaries require isolation between different operations

Avoid subagents when:
- A single agent with tools can reliably handle the task
- Tasks are heavily dependent and sequential
- Domains require shared context across agents
- Resource constraints make parallel processing inefficient

### Implementation Approaches

**Workflow Agents (Google ADK pattern)**:
```python
# Sequential execution
SequentialAgent(sub_agents=[agent1, agent2, agent3])

# Parallel execution
ParallelAgent(sub_agents=[analyst1, analyst2, analyst3])

# Iterative refinement
LoopAgent(sub_agents=[generator, critic], max_iterations=5)
```

**Agent as Tool (Pydantic AI pattern)**:
```python
# Wrap agent in tool for controlled invocation
from pydantic_ai import AgentTool

research_tool = AgentTool(research_agent)
parent_agent = Agent(tools=[research_tool])
```

**LLM-Driven Delegation**:
```python
# Agent generates transfer call based on task analysis
# Requires clear descriptions on sub_agents
coordinator = LlmAgent(
    sub_agents=[billing_agent, support_agent],
    instruction="Route requests to appropriate specialist"
)
```

### Communication Patterns

1. **Shared Session State**: Parent writes to `session.state`, children read from it. Asynchronous, passive communication ideal for pipelines.

2. **Explicit Invocation**: Parent calls subagent like a tool, receives structured response. Synchronous, controlled.

3. **LLM Transfer**: Agent generates `transfer_to_agent()` call. Dynamic routing based on LLM interpretation.

### Cost and Performance

```
Single Agent:     ~1x tokens, ~1x latency
Multi-Agent:      ~15x tokens, ~0.1x latency (with parallelization)
```

Introducing parallel subagent spawning (3-5 simultaneously) with parallel tool calling (3+ tools per agent) can reduce research time by up to 90% for complex queries—but at significant token cost.

## Common Patterns

### Coordinator/Dispatcher
A central agent routes requests to specialized subagents. The coordinator classifies the task and delegates to the appropriate specialist without performing the work itself.

```
User Request → Coordinator → [Billing Agent | Support Agent | Technical Agent]
```

### Sequential Pipeline
Fixed execution order where each agent transforms the previous output:
```
Template Selection → Clause Customization → Compliance Review → Risk Assessment
```

### Parallel Fan-Out with Aggregation
Multiple agents analyze the same input simultaneously:
```
Stock Ticker → [Fundamental | Technical | Sentiment | ESG] → Synthesizer → Recommendation
```

### Maker-Checker Loop
Generator creates output; critic evaluates against criteria; cycle repeats until approval:
```
while not approved:
    draft = generator.run(context)
    feedback = critic.evaluate(draft)
    if feedback.approved:
        return draft
    context = feedback
```

### Hierarchical Decomposition
Multi-level agent trees where parent agents delegate to children, who may further delegate:
```
Research Lead
├── Market Analyst → [Competitor Agent, Pricing Agent]
├── Technical Analyst
└── Risk Analyst → [Regulatory Agent, Compliance Agent]
```

## Gotchas

1. **Vague Instructions Cause Duplication**: Instructions like "research the semiconductor shortage" result in subagents duplicating work. Each subagent needs explicit task boundaries and distinct responsibilities.

2. **Over-spawning**: Early implementations often spawn 50 subagents for simple queries. Scale effort to complexity—simple tasks need 1 agent, not 10.

3. **Synchronous Bottlenecks**: If lead agents execute subagents synchronously (waiting for completion before proceeding), you lose parallelism benefits. True async execution enables greater throughput but adds coordination complexity.

4. **Bad Tool Descriptions**: "Bad tool descriptions can send agents down completely wrong paths." Agents need explicit heuristics for tool matching and should examine available tools before execution.

5. **State Management**: Agents run for extended periods maintaining state. Systems must support error recovery without restarting from scratch and handle graceful degradation when tools fail.

6. **Context Growth**: Each agent adds reasoning, tool results, and outputs. Monitor accumulated context size and apply compaction (summarization, pruning) between agents to prevent exceeding model limits.

7. **Coordination Overhead**: Parallel processing cuts latency only when gains exceed coordination costs. The math only works with >50% latency reduction after accounting for overhead.

8. **Single Parent Rule**: An agent instance can only be added as a subagent once—shared agents across multiple parents create ambiguous ownership.

9. **Result Conflicts**: Parallel agents may return contradictory results. Define aggregation strategies upfront: voting for classification, weighted merging for recommendations, or LLM synthesis for narratives.

10. **Infinite Loops**: Handoff and iterative patterns can loop indefinitely. Implement iteration caps and fallback behaviors (escalate to human, return best result with warning).

## Sources

- [How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) — Anthropic's production architecture, parallel execution benefits (90% time reduction), token costs (15× more), and lessons learned from early failures
- [Multi-agent systems - Agent Development Kit](https://google.github.io/adk-docs/agents/multi-agents/) — Google ADK framework patterns: SequentialAgent, ParallelAgent, LoopAgent, communication mechanisms, and implementation best practices
- [AI Agent Orchestration Patterns - Azure Architecture Center](https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/ai-agent-design-patterns) — Microsoft's comprehensive guide to sequential, concurrent, group chat, handoff, and magentic orchestration patterns
- [Agents, Subagents, and Multi Agents: What They Are and When to Use Them](https://block.github.io/goose/blog/2025/08/14/agent-coordination-patterns/) — Block's Goose framework definitions and decision criteria for agent vs. subagent vs. multi-agent patterns
- [Multi-Agent Patterns - Pydantic AI](https://ai.pydantic.dev/multi-agent-applications/) — Five levels of complexity from single agent to deep agents, delegation strategies, and usage tracking across agents


---

# Agent SDK Core Concepts

**Topic ID:** agents.sdk.core-concepts
**Researched:** 2025-03-01T00:00:00Z

## Overview

The Claude Agent SDK (formerly Claude Code SDK) is Anthropic's official library for building AI agents that can autonomously read files, run commands, search the web, edit code, and more. It provides the same tools, agent loop, and context management that power Claude Code, but programmable in Python and TypeScript.

The SDK's core innovation is built-in tool execution. Unlike the Anthropic Client SDK where developers implement tool loops manually, the Agent SDK handles tool orchestration internally. You provide a prompt and configuration; Claude figures out which tools to use, executes them, observes results, and continues until the task is complete. This dramatically reduces the code needed to build capable agents.

The SDK targets developers building production automation, CI/CD pipelines, and custom AI-powered applications. It supports authentication via Anthropic API keys, Amazon Bedrock, Google Vertex AI, and Microsoft Azure AI Foundry, making it suitable for enterprise deployments with existing cloud infrastructure.

## Key Concepts

- **`query()` function**: The primary async interface for Claude interactions. It returns an `AsyncIterator` that streams messages as Claude works. Each iteration yields Claude's reasoning, tool calls, tool results, or final outcomes.

- **Built-in tools**: Pre-implemented tools that work immediately without custom code. These include `Read` (read files), `Write` (create files), `Edit` (modify files), `Bash` (run commands), `Glob` (find files by pattern), `Grep` (search content with regex), `WebSearch`, and `WebFetch`.

- **`ClaudeAgentOptions`**: Configuration object controlling agent behavior. Key parameters include `allowed_tools`, `permission_mode`, `system_prompt`, `max_turns`, `cwd` (working directory), `mcp_servers`, and `hooks`.

- **Permission modes**: Global controls for tool approval. Options include `default` (requires callback), `acceptEdits` (auto-approve file operations), `bypassPermissions` (all tools auto-approved), and `plan` (no execution, planning only).

- **Message types**: Response objects from the query stream. `AssistantMessage` contains Claude's reasoning and tool invocations, `ResultMessage` indicates completion, and content blocks (`TextBlock`, `ToolUseBlock`) carry specific data.

- **Hooks**: Callback functions that run at key lifecycle points (`PreToolUse`, `PostToolUse`, `Stop`, `SessionStart`, etc.) for validation, logging, blocking, or transforming agent behavior.

- **Sessions**: Context persistence across multiple exchanges. Claude remembers files read, analysis done, and conversation history. Sessions can be resumed or forked.

- **Subagents**: Specialized agents spawned for focused subtasks. Defined via `AgentDefinition` with custom prompts and tool restrictions.

## Technical Details

### Query Function Signature

```python
from claude_agent_sdk import query, ClaudeAgentOptions

async for message in query(
    prompt: str,
    options: ClaudeAgentOptions = None
) -> AsyncIterator[Message]:
    # Process messages as they stream
```

The query creates a new session for each invocation. Use `async for` in Python or `for await` in TypeScript to consume the stream.

### ClaudeAgentOptions Parameters

```python
ClaudeAgentOptions(
    system_prompt: str,                    # Custom instructions for Claude
    max_turns: int,                        # Maximum conversation turns
    allowed_tools: List[str],              # Tools Claude can use
    permission_mode: str,                  # "default", "acceptEdits", "bypassPermissions", "plan"
    cwd: str | Path,                       # Working directory for tool operations
    mcp_servers: Dict[str, Any],           # External MCP server connections
    hooks: Dict[str, List[HookMatcher]],   # Lifecycle callbacks
    resume: str,                           # Session ID to resume
)
```

### Built-in Tools Reference

| Tool | Purpose | Example Use |
|------|---------|-------------|
| `Read` | Read any file in working directory | Analyze code, check configs |
| `Write` | Create new files | Generate code, create configs |
| `Edit` | Make precise edits to existing files | Fix bugs, refactor code |
| `Bash` | Run terminal commands | Git operations, run tests, install packages |
| `Glob` | Find files by pattern (`**/*.ts`) | Discover project structure |
| `Grep` | Search file contents with regex | Find function usages, locate patterns |
| `WebSearch` | Search the web | Find documentation, research |
| `WebFetch` | Fetch and parse web pages | Read API docs, get examples |
| `AskUserQuestion` | Prompt user with multiple choice | Clarify requirements |

### Permission Evaluation Order

When Claude requests a tool, the SDK evaluates permissions in this sequence:

1. **Hooks** — `PreToolUse` hooks can allow, deny, or pass
2. **Permission rules** — Declarative `deny` → `allow` → `ask` rules from settings.json
3. **Permission mode** — `bypassPermissions`, `acceptEdits`, etc.
4. **canUseTool callback** — Runtime approval function if not resolved above

### TypeScript Usage

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const message of query({
  prompt: "Find and fix bugs in auth.py",
  options: {
    allowedTools: ["Read", "Edit", "Bash"],
    permissionMode: "acceptEdits"
  }
})) {
  if ("result" in message) console.log(message.result);
}
```

## Common Patterns

### Read-Only Analysis Agent

Restrict tools to prevent modifications:

```python
options = ClaudeAgentOptions(
    allowed_tools=["Read", "Glob", "Grep"],
    permission_mode="bypassPermissions"
)

async for message in query(
    prompt="Review this codebase for security issues",
    options=options
):
    # Claude analyzes but cannot modify files
```

### Automated Code Fixer

Full automation with file editing and command execution:

```python
options = ClaudeAgentOptions(
    allowed_tools=["Read", "Edit", "Bash", "Glob", "Grep"],
    permission_mode="acceptEdits"
)

async for message in query(
    prompt="Run tests, find failures, and fix them",
    options=options
):
    pass
```

### Session Continuation

Resume a previous session with full context:

```python
# First query - capture session ID
session_id = None
async for message in query(prompt="Analyze the auth module"):
    if hasattr(message, "session_id"):
        session_id = message.session_id

# Resume with context
async for message in query(
    prompt="Now refactor it",
    options=ClaudeAgentOptions(resume=session_id)
):
    pass
```

### Audit Hook for File Changes

Log all modifications:

```python
async def log_change(input_data, tool_use_id, context):
    file_path = input_data.get("tool_input", {}).get("file_path")
    with open("audit.log", "a") as f:
        f.write(f"{datetime.now()}: modified {file_path}\n")
    return {}

options = ClaudeAgentOptions(
    permission_mode="acceptEdits",
    hooks={
        "PostToolUse": [HookMatcher(matcher="Edit|Write", hooks=[log_change])]
    }
)
```

## Gotchas

- **`bypassPermissions` inheritance**: When using `bypassPermissions`, all subagents inherit this mode and it cannot be overridden. Subagents may have different system prompts and less constrained behavior—they get full autonomous system access.

- **Tool name casing**: Tool names are case-sensitive. Use `"Read"` not `"read"`. The SDK will not recognize lowercase tool names.

- **`acceptEdits` scope**: This mode only auto-approves file operations (`Edit`, `Write`, `mkdir`, `rm`, `mv`, `cp`). Other Bash commands that aren't filesystem operations still require normal permissions.

- **Session ID capture**: The session ID is emitted in an early `init` message. You must capture it during streaming to resume later—it's not available after the query completes.

- **`plan` mode limitations**: In plan mode, Claude cannot execute any tools. It can only analyze and propose changes. This is useful for review workflows but requires a second pass with execution permissions.

- **Working directory matters**: Tools operate relative to `cwd`. If unspecified, it defaults to the current working directory. File paths in prompts should be relative to this directory.

- **Streaming is default**: The SDK is streaming-first. If you need all results at once (for CI/CD or background jobs), you must collect messages manually or use single-turn mode patterns documented separately.

- **ClaudeSDKClient vs query()**: For simple one-shot tasks, use `query()`. For bidirectional conversations with custom tools and hooks defined as Python functions, use `ClaudeSDKClient` context manager.

## Sources

- [Agent SDK Overview - Claude API Docs](https://platform.claude.com/docs/en/agent-sdk/overview) — Primary documentation covering query function, built-in tools, capabilities, and comparison with other Claude tools
- [Configure Permissions - Claude API Docs](https://platform.claude.com/docs/en/agent-sdk/permissions) — Detailed documentation on permission modes, evaluation order, and mode-specific behaviors
- [Quickstart - Claude API Docs](https://platform.claude.com/docs/en/agent-sdk/quickstart) — Step-by-step guide with working examples and explanation of key concepts
- [GitHub - anthropics/claude-agent-sdk-python](https://github.com/anthropics/claude-agent-sdk-python) — Official Python SDK repository with API signatures, message types, and error handling


---

# Hooks and Sessions

**Topic ID:** agents.sdk.hooks-and-sessions
**Researched:** 2026-03-01T12:00:00Z

## Overview

Hooks and sessions are two fundamental mechanisms in the Claude Agent SDK that provide control over agent behavior and conversation continuity. **Hooks** are callback functions that execute at specific lifecycle points during agent execution, enabling you to intercept, modify, or block agent actions programmatically. **Sessions** provide persistent conversation state, allowing you to resume conversations across multiple interactions while maintaining full context.

Together, these features enable sophisticated agent workflows: hooks let you enforce security policies, audit actions, transform inputs/outputs, and implement custom permission logic, while sessions allow for long-running development workflows where Claude can pick up exactly where it left off. This combination is essential for production deployments where you need both behavioral control and conversation continuity.

The SDK provides both Python and TypeScript implementations, with hooks available as callback functions passed in agent options. Sessions are automatically created when queries start, and the SDK returns session IDs that can be stored and used to resume conversations later.

## Key Concepts

- **Hook Events**: Lifecycle points where hooks can fire. Primary events include `PreToolUse` (before tool execution), `PostToolUse` (after successful tool execution), `Stop` (when agent finishes), `SessionStart`, `SessionEnd`, `SubagentStart`, `SubagentStop`, and `Notification`.

- **Matchers**: Regex patterns that filter when hooks fire. For tool-based hooks, matchers filter by tool name (e.g., `"Bash"`, `"Write|Edit"`, `"mcp__.*"`). Omitting a matcher runs the hook for all occurrences.

- **Hook Callbacks**: Async functions receiving three arguments: `input_data` (event details), `tool_use_id` (correlates PreToolUse/PostToolUse for same call), and `context` (contains AbortSignal in TypeScript).

- **Permission Decisions**: PreToolUse hooks can return `permissionDecision` of `"allow"` (bypass permission system), `"deny"` (block tool call), or `"ask"` (prompt user). Deny takes priority when multiple hooks apply.

- **Session IDs**: Unique identifiers returned in the initial system message when a session starts. Store these to resume conversations later using the `resume` option.

- **Session Forking**: When resuming, use `forkSession: true` to create a new branch from the resume point, preserving the original session unchanged. Default behavior continues the original session.

- **hookSpecificOutput**: A nested object in hook responses containing event-specific fields like `permissionDecision`, `updatedInput`, or `additionalContext`.

- **Async Hooks**: Hooks can return `{ async: true }` to run in the background without blocking. Useful for logging and webhooks that don't need to influence agent behavior.

## Technical Details

### Hook Configuration

Hooks are passed in the `hooks` field of agent options as a dictionary mapping event names to arrays of matchers:

```python
from claude_agent_sdk import ClaudeAgentOptions, ClaudeSDKClient, HookMatcher

async def my_hook(input_data, tool_use_id, context):
    # Check tool input
    if input_data["tool_name"] == "Bash":
        command = input_data["tool_input"].get("command", "")
        if "rm -rf" in command:
            return {
                "hookSpecificOutput": {
                    "hookEventName": "PreToolUse",
                    "permissionDecision": "deny",
                    "permissionDecisionReason": "Destructive command blocked"
                }
            }
    return {}  # Allow by default

options = ClaudeAgentOptions(
    hooks={
        "PreToolUse": [
            HookMatcher(matcher="Bash", hooks=[my_hook])
        ]
    }
)

async with ClaudeSDKClient(options=options) as client:
    await client.query("Your prompt")
```

```typescript
import { query, HookCallback, PreToolUseHookInput } from "@anthropic-ai/claude-agent-sdk";

const myHook: HookCallback = async (input, toolUseID, { signal }) => {
  const preInput = input as PreToolUseHookInput;
  const toolInput = preInput.tool_input as Record<string, unknown>;

  if (preInput.tool_name === "Bash" &&
      (toolInput.command as string)?.includes("rm -rf")) {
    return {
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: "Destructive command blocked"
      }
    };
  }
  return {};
};

for await (const message of query({
  prompt: "Your prompt",
  options: {
    hooks: {
      PreToolUse: [{ matcher: "Bash", hooks: [myHook] }]
    }
  }
})) {
  console.log(message);
}
```

### Session Management

```python
from claude_agent_sdk import query, ClaudeAgentOptions

session_id = None

# Start a session and capture ID
async for message in query(
    prompt="Help me build a web app",
    options=ClaudeAgentOptions(model="claude-opus-4-6")
):
    if hasattr(message, "subtype") and message.subtype == "init":
        session_id = message.data.get("session_id")
    print(message)

# Resume the session later
async for message in query(
    prompt="Continue where we left off",
    options=ClaudeAgentOptions(resume=session_id)
):
    print(message)

# Fork the session to explore an alternative
async for message in query(
    prompt="Let's try a different approach",
    options=ClaudeAgentOptions(resume=session_id, fork_session=True)
):
    print(message)
```

### Available Hook Events

| Hook Event | Description | Can Block? |
|------------|-------------|------------|
| `PreToolUse` | Before tool executes | Yes |
| `PostToolUse` | After tool succeeds | No (already ran) |
| `PostToolUseFailure` | After tool fails | No |
| `Stop` | Agent finishes responding | Yes |
| `SubagentStart` | Subagent spawned | No |
| `SubagentStop` | Subagent finished | Yes |
| `SessionStart` | Session begins/resumes | No |
| `SessionEnd` | Session terminates | No |
| `Notification` | Agent status messages | No |
| `UserPromptSubmit` | User submits prompt | Yes |
| `PreCompact` | Before context compaction | No |

### Hook Input Fields

All hooks receive common fields: `session_id`, `transcript_path`, `cwd`, `permission_mode`, `hook_event_name`. Tool hooks also receive `tool_name`, `tool_input`, and `tool_use_id`.

## Common Patterns

### Audit Logging

```python
async def audit_logger(input_data, tool_use_id, context):
    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "tool": input_data.get("tool_name"),
        "input": input_data.get("tool_input"),
        "session": input_data.get("session_id")
    }
    await send_to_logging_service(log_entry)
    return {"async_": True}  # Don't block execution
```

### Sandboxing File Operations

```python
async def sandbox_writes(input_data, tool_use_id, context):
    if input_data["tool_name"] == "Write":
        original_path = input_data["tool_input"].get("file_path", "")
        return {
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": "allow",
                "updatedInput": {
                    **input_data["tool_input"],
                    "file_path": f"/sandbox{original_path}"
                }
            }
        }
    return {}
```

### Auto-Approving Read-Only Tools

```python
async def auto_approve_reads(input_data, tool_use_id, context):
    read_only_tools = ["Read", "Glob", "Grep"]
    if input_data["tool_name"] in read_only_tools:
        return {
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": "allow"
            }
        }
    return {}
```

### Chaining Multiple Hooks

```python
options = ClaudeAgentOptions(
    hooks={
        "PreToolUse": [
            HookMatcher(hooks=[rate_limiter]),      # First: check limits
            HookMatcher(hooks=[auth_check]),         # Second: verify perms
            HookMatcher(hooks=[input_sanitizer]),    # Third: sanitize
            HookMatcher(hooks=[audit_logger])        # Last: log action
        ]
    }
)
```

## Gotchas

- **Python SDK limitations**: `SessionStart` and `SessionEnd` can only be registered as SDK callback hooks in TypeScript. In Python, these are only available as shell command hooks in settings files.

- **Hooks don't fire at max_turns**: When the agent hits the `max_turns` limit, hooks may not execute because the session ends abruptly.

- **Matchers only filter tool names**: To filter by file path or other arguments, you must check inside your callback—matchers only match against `tool_name`.

- **updatedInput requires permissionDecision**: When modifying tool input with `updatedInput`, you must also return `permissionDecision: "allow"` for the change to take effect.

- **Deny always wins**: When multiple hooks or permission rules apply, `deny` takes priority over `ask`, which takes priority over `allow`.

- **Session resumption sends full history**: When resuming, the entire conversation history is sent to Claude's API, consuming input tokens proportional to conversation length.

- **No automatic memory across sessions**: The SDK doesn't remember context across different sessions without explicit resume functionality. Each new session starts fresh.

- **Hook timeout defaults**: Command hooks timeout after 10 minutes by default. For long operations, set an explicit `timeout` value or use `async: true`.

- **MCP tool naming**: MCP tools follow the pattern `mcp__<server>__<tool>`. Use regex matchers like `mcp__memory__.*` to target all tools from a server.

## Sources

- [Intercept and control agent behavior with hooks - Claude API Docs](https://platform.claude.com/docs/en/agent-sdk/hooks) — Comprehensive documentation on hook configuration, events, callbacks, and examples
- [Session Management - Claude API Docs](https://platform.claude.com/docs/en/agent-sdk/sessions) — Official documentation on session creation, resumption, and forking
- [Hooks reference - Claude Code Docs](https://code.claude.com/docs/en/hooks) — Detailed reference for hook events, JSON input/output formats, matchers, and shell command hooks
- [GitHub - anthropics/claude-agent-sdk-python](https://github.com/anthropics/claude-agent-sdk-python) — Python SDK repository with hook and session examples

