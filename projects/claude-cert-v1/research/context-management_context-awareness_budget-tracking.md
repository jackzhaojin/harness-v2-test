# Token Budget Tracking

**Topic ID:** context-management.context-awareness.budget-tracking
**Researched:** 2026-03-01T12:00:00Z

## Overview

Token budget tracking refers to Claude's ability to monitor and report the remaining capacity in its context window during a conversation. This capability, called "context awareness," is built into Claude Sonnet 4.6, Claude Sonnet 4.5, and Claude Haiku 4.5, allowing these models to understand how much token space remains for continued work [1]. Unlike older models that operated without visibility into their own context consumption, context-aware models receive explicit information about their total budget and remaining capacity after each interaction.

The context window represents Claude's "working memory" for a given conversation, distinct from its training data [1]. For context-aware models, this budget can be 200K tokens (standard), 500K tokens (claude.ai Enterprise), or 1M tokens (beta, for eligible organizations) [1]. Claude Sonnet 4.6, Claude Sonnet 4.5, and Claude Haiku 4.5 are trained to use this context information precisely, persisting in tasks until completion rather than guessing how many tokens remain [1]. This is particularly valuable for long-running agent sessions and multi-context-window workflows where understanding remaining capacity directly affects task execution strategy.

For developers integrating with the Claude API, token tracking operates at two levels: the model's internal context awareness (automatic for supported models), and the API's usage reporting mechanism that returns token counts in every response [2]. These complementary systems enable both the model and the application to make informed decisions about context management.

## Key Concepts

- **Context Window** — The total text a language model can reference when generating a response, representing its "working memory." Standard capacity is 200K tokens, with 1M available in beta for Opus 4.6, Sonnet 4.6, Sonnet 4.5, and Sonnet 4 [1].

- **Context Awareness** — A capability in Claude Sonnet 4.6, Sonnet 4.5, and Haiku 4.5 that enables the model to track remaining context window capacity throughout a conversation [1]. The model receives structured updates about its token budget.

- **Token Budget** — The total number of tokens allocated to a conversation. Communicated to context-aware models via XML-formatted messages at conversation start: `<budget:token_budget>200000</budget:token_budget>` [1].

- **Token Usage Updates** — System warnings sent after each tool call that inform the model of current consumption: `<system_warning>Token usage: 35000/200000; 165000 remaining</system_warning>` [1].

- **Token Counting API** — A free API endpoint (`/v1/messages/count_tokens`) that estimates token count before sending messages to Claude, helping developers proactively manage rate limits and costs [2].

- **Response Usage Metadata** — Token counts returned in every API response: `input_tokens`, `output_tokens`, `cache_creation_input_tokens`, and `cache_read_input_tokens` [3].

- **Context Rot** — The phenomenon where accuracy and recall degrade as token count grows, making what is in context just as important as how much fits [1].

- **Extended Thinking Tokens** — When using extended thinking, thinking tokens count toward the context window during the current turn but are automatically stripped from subsequent turns to preserve capacity [1].

## Technical Details

### Context Awareness Implementation

Context-aware models receive budget information through structured XML messages injected by the API. At conversation start:

```xml
<budget:token_budget>200000</budget:token_budget>
```

After each tool call, an update provides current consumption:

```xml
<system_warning>Token usage: 35000/200000; 165000 remaining</system_warning>
```

This automatic injection requires no developer configuration. Image tokens are included in these budgets [1].

### Token Counting API

The token counting endpoint accepts the same inputs as message creation, including system prompts, tools, images, and PDFs [2]. All active models support token counting.

```python
import anthropic

client = anthropic.Anthropic()

response = client.messages.count_tokens(
    model="claude-sonnet-4-6",
    system="You are a scientist",
    messages=[{"role": "user", "content": "Hello, Claude"}],
)
print(response.json())  # {"input_tokens": 14}
```

The count is an estimate; actual usage may differ slightly due to system-added tokens. You are not billed for system-added tokens [2].

### API Response Usage Object

Every Claude API response includes a usage object with token metrics [3]:

```json
{
  "usage": {
    "input_tokens": 7,
    "cache_creation_input_tokens": 464,
    "cache_read_input_tokens": 37687,
    "output_tokens": 176
  }
}
```

When using prompt caching, `cache_read_input_tokens` cost 90% less but still occupy space in the context window [3].

### 1M Context Window (Beta)

Enabled via the `context-1m-2025-08-07` beta header. Available for Opus 4.6, Sonnet 4.6, Sonnet 4.5, and Sonnet 4 only [1]. Claude Haiku 4.5 does not support the 1M beta context window.

```bash
curl https://api.anthropic.com/v1/messages \
  -H "anthropic-beta: context-1m-2025-08-07" \
  -d '{"model": "claude-sonnet-4-6", ...}'
```

Requests exceeding 200K tokens incur premium pricing: 2x input rate, 1.5x output rate [1].

### Model Context Specifications

| Model | Standard Context | 1M Beta | Max Output | Context Awareness |
|-------|------------------|---------|------------|-------------------|
| Claude Opus 4.6 | 200K | Yes | 128K | No (different capability set) |
| Claude Sonnet 4.6 | 200K | Yes | 64K | Yes |
| Claude Sonnet 4.5 | 200K | Yes | 64K | Yes |
| Claude Haiku 4.5 | 200K | No | 64K | Yes |

Source: [4]

## Common Patterns

### Long-Running Agent Sessions

Context awareness is most valuable for sustained agent work. The model can allocate effort appropriately, knowing how much space remains for additional tool calls, reasoning, and output [1]. Design state artifacts so context recovery is fast when a new session starts.

### Pre-Flight Token Estimation

Before sending large payloads, use the token counting API to verify they fit within limits:

```python
# Check before sending
count = client.messages.count_tokens(
    model="claude-sonnet-4-6",
    messages=large_conversation,
    tools=tool_definitions
)

if count.input_tokens > 180000:
    # Implement compaction or splitting strategy
    pass
```

This pattern prevents validation errors from newer Claude models (starting with Sonnet 3.7) that reject requests exceeding the context window rather than silently truncating [1].

### Tracking Cumulative Usage

For multi-turn conversations, track token consumption from response metadata:

```python
total_input = 0
total_output = 0

for response in conversation_responses:
    total_input += response.usage.input_tokens
    total_output += response.usage.output_tokens
```

Note: When Claude uses multiple tools in one turn, deduplicate by message ID to avoid double-counting [3].

### Extended Thinking Context Management

Previous thinking blocks are automatically stripped from context window calculations. The effective formula becomes [1]:

```
context_window = (input_tokens - previous_thinking_tokens) + current_turn_tokens
```

When using tool results with extended thinking, the thinking block accompanying the tool request must be included. The API verifies authenticity via cryptographic signatures [1].

## Gotchas

- **Haiku 4.5 lacks 1M context** — Unlike Sonnet models, Claude Haiku 4.5 does not support the 1M beta context window, only the standard 200K [1][4]. Do not attempt to use the `context-1m-2025-08-07` header with Haiku.

- **Token counts are estimates** — The token counting API provides an estimate; actual usage may differ by a small amount. System-added tokens are not billed but may appear in counts [2].

- **Cache tokens still consume context** — Although `cache_read_input_tokens` cost 90% less financially, they still occupy space in the context window. Do not confuse pricing benefits with context limits [3].

- **Context awareness is model-specific** — Only Claude Sonnet 4.6, Sonnet 4.5, and Haiku 4.5 have context awareness. Older models and Opus models operate without internal budget visibility [1].

- **Validation errors replace truncation** — Newer models (Sonnet 3.7+) return validation errors when prompts exceed the context window rather than silently truncating. Use the token counting API to prevent this [1].

- **Tool use with thinking blocks** — When posting tool results, the entire unmodified thinking block from that tool request must be included. Modified thinking blocks trigger API errors due to signature verification [1].

- **1M context requires tier 4** — The 1M beta context window is only available for organizations in usage tier 4 or with custom rate limits. Lower tiers must advance to access this feature [1].

- **Long context pricing is automatic** — Requests exceeding 200K tokens are automatically charged at premium rates (2x input, 1.5x output) without explicit opt-in [1].

## Sources

[1] **Context windows - Claude API Docs**
    URL: https://platform.claude.com/docs/en/build-with-claude/context-windows
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Context awareness implementation details, budget tracking XML format, 1M context window beta requirements, extended thinking context behavior, model-specific capabilities, context rot concept.

[2] **Token counting - Claude API Docs**
    URL: https://platform.claude.com/docs/en/build-with-claude/token-counting
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Token counting API usage, code examples, rate limits, estimation caveats, Zero Data Retention eligibility.

[3] **Track cost and usage - Claude API Docs / Usage Tracking**
    URL: https://platform.claude.com/docs/en/agent-sdk/cost-tracking
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Response usage object structure, cache token fields, deduplication by message ID, cost tracking in Agent SDK.

[4] **Models overview - Claude API Docs**
    URL: https://platform.claude.com/docs/en/about-claude/models/overview
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Model comparison table, context window sizes per model, max output tokens, 1M beta availability matrix.
