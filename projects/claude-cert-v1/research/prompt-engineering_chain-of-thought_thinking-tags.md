# Thinking Tags Pattern

**Topic ID:** prompt-engineering.chain-of-thought.thinking-tags
**Researched:** 2026-03-01T00:00:00Z

## Overview

The thinking tags pattern is a prompt engineering technique that encourages Claude to reason through problems step-by-step before providing a final answer. This pattern uses structured XML tags, typically `<thinking>` and `<answer>`, to cleanly separate Claude's internal reasoning process from its final output [1]. The technique falls under the broader category of Chain of Thought (CoT) prompting, which dramatically improves Claude's performance on complex tasks like research, analysis, math, logic, and problem-solving [1].

There are two distinct approaches to enabling step-by-step reasoning in Claude: manual CoT prompting using thinking tags (when extended thinking is disabled), and the API's built-in extended thinking feature (which creates native `thinking` content blocks automatically) [2]. Understanding when to use each approach, and critically, when NOT to combine them, is essential for exam success and practical implementation.

The thinking tags pattern is particularly valuable because it provides visibility into Claude's reasoning process, enables debugging of unclear prompts, and produces more accurate and coherent responses through structured problem decomposition [1]. However, with the introduction of extended thinking in Claude's API, the landscape has evolved, and knowing which technique to apply in which context has become a key competency.

## Key Concepts

- **Chain of Thought (CoT) Prompting** — A technique that encourages Claude to break down problems step-by-step rather than jumping directly to an answer, leading to improved accuracy in math, logic, analysis, and complex tasks [1].

- **Manual Thinking Tags** — XML-style tags like `<thinking>` and `<answer>` used in prompts when extended thinking is disabled to separate reasoning from final output [1]. This is a prompt-level technique controlled by the user.

- **Extended Thinking Mode** — An API feature that gives Claude enhanced reasoning capabilities by automatically creating `thinking` content blocks in responses [2]. Enabled via the `thinking` parameter in API requests with `type: "enabled"` or `type: "adaptive"`.

- **Adaptive Thinking** — The recommended approach for Claude Opus 4.6 and Sonnet 4.6, where Claude dynamically decides when and how much to think based on query complexity and the `effort` parameter [1][2].

- **Budget Tokens** — When using manual extended thinking mode, this parameter sets the maximum tokens Claude can use for internal reasoning [2]. Minimum is 1,024 tokens. Deprecated on Opus 4.6 in favor of adaptive thinking.

- **Interleaved Thinking** — A beta feature for Claude 4 models that enables Claude to think between tool calls, allowing more sophisticated reasoning after receiving tool results [2].

- **Thinking Content Blocks** — Native response structures returned by the API when extended thinking is enabled, containing Claude's reasoning in a `thinking` field with a cryptographic `signature` [2].

- **Summarized Thinking** — For Claude 4 models, the API returns a summary of Claude's full thinking process rather than raw output, providing intelligence benefits while preventing misuse [2].

## Technical Details

### Manual CoT with Thinking Tags (When Extended Thinking is Off)

When the extended thinking API feature is disabled, you can still encourage step-by-step reasoning by using XML tags in your prompt [1]:

```text
Analyze this problem step by step.

<thinking>
Work through your reasoning here.
</thinking>

<answer>
Provide your final answer here.
</answer>
```

### Extended Thinking API Configuration

To enable extended thinking via the API, use the `thinking` parameter [2]:

```python
import anthropic

client = anthropic.Anthropic()

response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=16000,
    thinking={"type": "enabled", "budget_tokens": 10000},
    messages=[
        {
            "role": "user",
            "content": "Are there an infinite number of prime numbers such that n mod 4 == 3?",
        }
    ],
)
```

### Adaptive Thinking (Recommended for Claude 4.6)

For the latest models, adaptive thinking with effort control is preferred [1][2]:

```python
client.messages.create(
    model="claude-opus-4-6",
    max_tokens=64000,
    thinking={"type": "adaptive"},
    output_config={"effort": "high"},  # or max, medium, low
    messages=[{"role": "user", "content": "..."}],
)
```

### Response Structure with Extended Thinking

When extended thinking is enabled, responses include thinking blocks [2]:

```json
{
  "content": [
    {
      "type": "thinking",
      "thinking": "Let me analyze this step by step...",
      "signature": "WaUjzkypQ2mUEVM36O2TxuC06KN8xyfbJwyem2dw3URve/op..."
    },
    {
      "type": "text",
      "text": "Based on my analysis..."
    }
  ]
}
```

### Using Thinking Tags in Few-Shot Examples

Multishot examples work with extended thinking [1]. Use `<thinking>` tags inside few-shot examples to demonstrate the reasoning pattern:

```xml
<examples>
  <example>
    <input>Calculate compound interest on $1000 at 5% for 3 years</input>
    <thinking>
    I need to use the compound interest formula: A = P(1 + r)^t
    P = 1000, r = 0.05, t = 3
    A = 1000(1.05)^3 = 1000 * 1.157625 = 1157.63
    </thinking>
    <answer>The compound interest amount is $1,157.63</answer>
  </example>
</examples>
```

Claude will generalize this reasoning style to its own extended thinking blocks [1].

## Common Patterns

**Pattern 1: Manual CoT as API Fallback**
When extended thinking is disabled (to reduce latency or cost), use manual thinking tags [1]:

```text
Think through this problem step by step.
Put your reasoning in <thinking> tags.
Put your final answer in <answer> tags.
```

**Pattern 2: Self-Check Pattern**
Append verification instructions to catch errors [1]:

```text
Before you finish, verify your answer against the original requirements.
```

**Pattern 3: General Instructions Over Prescriptive Steps**
A prompt like "think thoroughly" often produces better reasoning than hand-written step-by-step plans [1]. Claude's reasoning frequently exceeds what a human would prescribe.

**Pattern 4: Structured Output Separation**
When you need clean parsing of reasoning vs. results:

```text
Analyze the data and provide recommendations.
<thinking>
[Your analysis process]
</thinking>
<recommendations>
[Your final recommendations]
</recommendations>
```

**Pattern 5: Adaptive Thinking for Agentic Workloads**
For multi-step tool use, coding tasks, and autonomous agents, use adaptive thinking with appropriate effort levels [1]:

```python
thinking={"type": "adaptive"},
output_config={"effort": "high"}
```

## Gotchas

**Do NOT use "think step-by-step" with Extended Thinking enabled.** Telling the model to "think step-by-step" wastes tokens when Extended Thinking is active because the model already manages its own reasoning budget [1]. If you enable Extended Thinking, remove all instructions about how to think.

**Manual vs. API Thinking are mutually exclusive patterns.** Use `<thinking>` tags in prompts only when `thinking.type` is disabled or omitted. When extended thinking is enabled, Claude generates native thinking blocks automatically [1][2].

**Budget tokens is a target, not a strict limit.** Actual token usage can vary based on task complexity [2]. Claude may not use the entire budget, especially above 32k tokens.

**Thinking blocks must be preserved during tool use.** When using extended thinking with tools, you must pass thinking blocks back to the API for the last assistant turn to maintain reasoning continuity [2]. Omitting them causes errors.

**Claude Opus 4.5 is sensitive to "think" when thinking is disabled.** When extended thinking is disabled on Opus 4.5, consider using alternatives like "consider," "evaluate," or "reason through" [1].

**Summarized thinking billing.** You are billed for full thinking tokens generated internally, not the summary you see in Claude 4 responses [2]. The visible token count will not match the billed count.

**Cannot toggle thinking mid-turn.** During tool use loops, the entire assistant turn must operate in a single thinking mode. Attempting to toggle mid-turn silently disables thinking for that request [2].

**Thinking incompatibilities.** Extended thinking is not compatible with temperature, top_k modifications (except top_p 0.95-1.0), or response prefilling [2].

**Interleaved thinking requires beta header (for most models).** To enable thinking between tool calls on Claude 4 models (except Opus 4.6 with adaptive), include the `interleaved-thinking-2025-05-14` beta header [2]. Opus 4.6 enables this automatically with adaptive thinking.

## Sources

[1] **Let Claude think (chain of thought prompting) - Anthropic Documentation**
    URL: https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/chain-of-thought
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Core concepts of CoT prompting, manual thinking tags syntax, when to use vs. avoid step-by-step instructions, few-shot example patterns with thinking tags, self-check technique.

[2] **Building with Extended Thinking - Claude API Docs**
    URL: https://platform.claude.com/docs/en/build-with-claude/extended-thinking
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Extended thinking API configuration, thinking content block structure, budget_tokens parameter, adaptive thinking, interleaved thinking with tools, summarized thinking billing, thinking block preservation requirements, feature incompatibilities, streaming patterns.
