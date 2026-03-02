# Extended Thinking Mode

**Topic ID:** prompt-engineering.chain-of-thought.extended-thinking
**Researched:** 2026-03-01T12:00:00Z

## Overview

Extended thinking is a Claude API feature that enables the model to engage in step-by-step internal reasoning before delivering a final response. When enabled, Claude creates `thinking` content blocks containing its reasoning process, then incorporates insights from this reasoning into the final answer [1]. This capability significantly improves accuracy on complex tasks like mathematical proofs, coding problems, and multi-step analysis, with accuracy improving logarithmically as more thinking tokens are allocated [3].

Extended thinking is not a separate model but rather the same Claude model given more computational budget for reasoning [3]. The API response includes thinking blocks followed by text blocks, allowing developers to observe the model's reasoning chain. For Claude 4 models, thinking output is summarized rather than shown in full, though the intelligence benefits are preserved and billing reflects the full thinking tokens generated [1].

Starting with Claude Opus 4.6 and Sonnet 4.6, Anthropic recommends using adaptive thinking mode instead of manually setting token budgets, allowing Claude to dynamically determine when and how much extended reasoning to apply based on task complexity [2].

## Key Concepts

- **Thinking Blocks** - Content blocks of type `thinking` that contain Claude's internal reasoning process, returned in API responses when extended thinking is enabled [1]. Each block includes a `thinking` field with the reasoning text and a `signature` field for verification.

- **budget_tokens** - Parameter specifying the maximum tokens Claude can use for internal reasoning. Minimum is 1,024 tokens; must be less than `max_tokens` [1]. Deprecated on Opus 4.6 and Sonnet 4.6 in favor of adaptive thinking [2].

- **Adaptive Thinking** - The recommended mode for Opus 4.6 and Sonnet 4.6 where Claude dynamically determines thinking depth based on query complexity [2]. Uses `thinking: {type: "adaptive"}` configuration with the `effort` parameter for guidance.

- **Summarized Thinking** - Claude 4 models return a summary of the full thinking process rather than complete output, preserving intelligence while preventing misuse [1]. You are billed for full thinking tokens, not the summary.

- **Interleaved Thinking** - Capability enabling Claude to reason between tool calls, making more sophisticated decisions after receiving tool results [1]. Automatically enabled with adaptive thinking; requires beta header `interleaved-thinking-2025-05-14` for manual mode on most models.

- **Redacted Thinking** - When internal reasoning triggers safety systems, the thinking block is encrypted and returned as `redacted_thinking` type [1]. Must be passed back unmodified to maintain conversation continuity.

- **Effort Parameter** - Controls thinking depth in adaptive mode: `max` (Opus 4.6 only, no constraints), `high` (default, always thinks), `medium` (moderate thinking), `low` (minimizes thinking) [2].

## Technical Details

### Enabling Extended Thinking

Manual mode configuration (older models and Sonnet 4.6):

```python
response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=16000,
    thinking={"type": "enabled", "budget_tokens": 10000},
    messages=[{"role": "user", "content": "Prove there are infinitely many primes..."}]
)
```

Adaptive mode configuration (Opus 4.6 and Sonnet 4.6) [2]:

```python
response = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=16000,
    thinking={"type": "adaptive"},
    output_config={"effort": "high"},
    messages=[{"role": "user", "content": "..."}]
)
```

### Response Structure

The API returns thinking content blocks followed by text blocks [1]:

```json
{
  "content": [
    {
      "type": "thinking",
      "thinking": "Let me analyze this step by step...",
      "signature": "WaUjzkypQ2mUEVM36O2TxuC06KN8xyfbJwyem2dw..."
    },
    {
      "type": "text",
      "text": "Based on my analysis..."
    }
  ]
}
```

### Model Support

Extended thinking is supported on [1]:
- Claude Opus 4.6 (adaptive only; manual mode deprecated)
- Claude Opus 4.5, 4.1, 4
- Claude Sonnet 4.6 (both adaptive and manual modes)
- Claude Sonnet 4.5, 4
- Claude Sonnet 3.7 (returns full thinking, not summarized)
- Claude Haiku 4.5

### Token and Context Window Behavior

Key constraints for `budget_tokens` [1]:
- Minimum: 1,024 tokens
- Must be less than `max_tokens` (except with interleaved thinking + tools, where budget can be entire context window)
- Thinking tokens from previous turns are stripped and not counted toward context window
- Current turn thinking counts toward `max_tokens` limit
- If prompt tokens + `max_tokens` exceeds context window, a validation error is returned (not auto-adjusted)

### Streaming Extended Thinking

When streaming, thinking content arrives via `thinking_delta` events [1]:

```python
with client.messages.stream(
    model="claude-sonnet-4-6",
    max_tokens=16000,
    thinking={"type": "enabled", "budget_tokens": 10000},
    messages=[...]
) as stream:
    for event in stream:
        if event.type == "content_block_delta":
            if event.delta.type == "thinking_delta":
                print(event.delta.thinking, end="", flush=True)
```

The signature is added via `signature_delta` just before `content_block_stop` [1].

### Tool Use with Extended Thinking

When combining extended thinking with tool use [1]:
- Only `tool_choice: {"type": "auto"}` or `{"type": "none"}` is supported; forced tool use is incompatible
- Thinking blocks must be passed back unmodified with tool results to maintain reasoning continuity
- Cannot toggle thinking mid-turn during a tool use loop
- With interleaved thinking, Claude can reason after each tool result before deciding next steps

## Common Patterns

### Choosing Between Adaptive and Manual Thinking

Use adaptive thinking (`type: "adaptive"`) when [2]:
- Working with Opus 4.6 or Sonnet 4.6
- Building autonomous multi-step agents
- Handling bimodal workloads (mix of easy and hard tasks)
- Wanting Claude to calibrate reasoning per step

Use manual thinking (`type: "enabled"` with `budget_tokens`) when [2]:
- Needing precise control over thinking token spend
- Working with older models that do not support adaptive mode
- Requiring predictable latency and token usage

### Token Budget Guidelines

Recommended starting points [1][4]:
- Start at minimum (1,024 tokens) and increase incrementally
- 4K tokens for simple tasks where standard mode might suffice
- 16K tokens for most coding and analysis tasks
- 32K+ tokens for very complex multi-step reasoning
- Above 32K, use batch processing to avoid networking timeouts

### Multi-Turn Conversations with Thinking

When continuing conversations [1]:
- Always pass back complete, unmodified thinking blocks for the last assistant turn
- The API automatically ignores thinking blocks from prior turns for context calculations
- Thinking blocks must be passed back when using tools to maintain reasoning flow

### Prompt Engineering for Extended Thinking

Effective prompting strategies [4]:
- Give high-level instructions rather than step-by-step prescriptions; Claude's reasoning often exceeds prescribed processes
- Use multishot examples with `<thinking>` tags to demonstrate reasoning patterns
- Ask Claude to verify its work before completing: "Before you finish, verify your answer against [test criteria]"
- For adaptive thinking, add guidance to tune frequency: "Extended thinking adds latency and should only be used when it will meaningfully improve answer quality"

## Gotchas

**Billing Mismatch**: The billed output token count does NOT match visible tokens in the response. You are charged for full thinking tokens generated internally, not the summarized output you see [1][2].

**Summarization vs Full Output**: Only Claude Sonnet 3.7 returns full thinking output. All Claude 4 models return summarized thinking. Contact Anthropic sales if you need full thinking access for Claude 4 models [1].

**Cache Invalidation**: Changing thinking parameters (enabled/disabled or budget changes) invalidates message cache breakpoints, though system prompts and tool definitions remain cached [1]. Consecutive requests using the same adaptive thinking mode preserve cache breakpoints [2].

**Thinking Cannot Be Toggled Mid-Turn**: The entire assistant turn (including tool use loops) must operate in a single thinking mode. Attempting to toggle mid-turn causes thinking to be silently disabled for that request [1].

**Interleaved Thinking Header Differences**: On Opus 4.6, interleaved thinking is automatic with adaptive mode and the beta header is deprecated. On Sonnet 4.6, you can use either adaptive mode (automatic) or the beta header with manual mode. On older Claude 4 models, the beta header is required [1].

**Extended Thinking Performance**: Extended thinking performs best in English. Final outputs can be in any language Claude supports, but the thinking process should remain in English [3].

**Overthinking Risk**: Extended thinking can backfire on simple tasks, adding latency and cost without benefit, and sometimes reducing accuracy on routine queries [3]. Use lower effort levels or disable thinking for simple factual questions.

**Streaming Requirements**: SDKs require streaming when `max_tokens` is greater than 21,333 to avoid HTTP timeouts [1].

**Incompatible Parameters**: Extended thinking is not compatible with `temperature` or `top_k` modifications, forced tool use, or prefilled responses [1].

## Sources

[1] **Building with extended thinking - Claude API Docs**
    URL: https://platform.claude.com/docs/en/build-with-claude/extended-thinking
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Core API parameters, thinking block structure, tool use integration, streaming, caching behavior, context window handling, model support, response format, signature/encryption details, redacted thinking handling

[2] **Adaptive thinking - Claude API Docs**
    URL: https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Adaptive vs manual mode comparison, effort parameter levels, configuration syntax, model support (Opus 4.6, Sonnet 4.6), cost control guidance, caching considerations

[3] **Using extended thinking | Claude Help Center**
    URL: https://support.claude.com/en/articles/10574485-using-extended-thinking
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: When to use extended thinking, overthinking risks, performance characteristics, English-language optimization

[4] **Extended thinking tips - Claude API Docs**
    URL: https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/extended-thinking-tips
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Prompt engineering best practices, high-level vs prescriptive instructions, multishot prompting, self-verification patterns, tuning adaptive thinking frequency
