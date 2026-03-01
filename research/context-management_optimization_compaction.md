# Context Compaction

**Topic ID:** context-management.optimization.compaction
**Researched:** 2026-03-01T12:00:00Z

## Overview

Context compaction is a server-side technique for managing long-running AI conversations that approach context window limits. Rather than truncating messages or losing conversation history, compaction automatically summarizes older context while preserving essential information, allowing conversations to continue indefinitely with minimal performance degradation.

The technique addresses a fundamental constraint: even models with large context windows (200K+ tokens) eventually fill up during extended interactions. More critically, model performance degrades as context grows—focus diminishes, retrieval accuracy drops, and response quality suffers. Compaction solves both problems by replacing stale content with concise summaries, keeping the active context focused and performant.

Major AI providers now offer server-side compaction as a first-class API feature. Anthropic's Claude API and OpenAI's Responses API both support automatic compaction with configurable thresholds. This shifts the complexity of context management from application developers to the API layer, enabling "infinite" conversations with minimal integration work.

## Key Concepts

- **Context window**: The total tokens (input + output) a model can attend to at once—effectively the model's "working memory." Claude models support 200K tokens; some offer up to 1M tokens in beta.

- **Compaction trigger threshold**: The token count at which compaction activates. Anthropic defaults to 150,000 tokens with a minimum of 50,000. OpenAI uses a configurable `compact_threshold` parameter.

- **Compaction block**: A special content block containing the summarized conversation history. When the API receives this block in subsequent requests, it ignores all preceding content and continues from the summary.

- **Rolling/incremental summarization**: A dynamic approach where summaries are continuously updated as conversations evolve, rather than regenerating from scratch each time.

- **Pause after compaction**: An option to halt processing after generating a summary, allowing insertion of preserved messages or instructions before continuing.

- **Tool result clearing**: A complementary technique that removes raw tool outputs from context after they've served their purpose, reducing token usage without full summarization.

- **Context awareness**: A capability in newer Claude models (Sonnet 4.5+) that lets the model track its remaining token budget and manage context more effectively.

## Technical Details

### Claude API Implementation

Enable compaction by adding the `compact_20260112` strategy to your Messages API request:

```python
response = client.beta.messages.create(
    betas=["compact-2026-01-12"],
    model="claude-opus-4-6",
    max_tokens=4096,
    messages=messages,
    context_management={
        "edits": [
            {
                "type": "compact_20260112",
                "trigger": {"type": "input_tokens", "value": 150000},
            }
        ]
    },
)
```

**Key parameters:**

| Parameter | Default | Description |
|-----------|---------|-------------|
| `trigger.value` | 150,000 | Token threshold for compaction (minimum 50,000) |
| `pause_after_compaction` | `false` | Pause to allow message preservation |
| `instructions` | null | Custom summarization prompt (replaces default) |

The default summarization prompt instructs Claude to capture state, next steps, and learnings for continuity. Custom instructions completely replace this prompt—they don't supplement it.

### OpenAI Implementation

OpenAI offers both automatic and standalone compaction:

```python
# Server-side (automatic)
response = client.responses.create(
    model="gpt-5.2-codex",
    context_management={"compact_threshold": 100000},
    input=[...],
)

# Standalone endpoint
compact_result = client.responses.compact(
    model="gpt-5.2-codex",
    input=[full_context],
)
```

OpenAI's compaction blocks are opaque and encrypted—they're not human-readable but carry forward key state efficiently.

### Handling Compaction Blocks

After receiving a response with a compaction block, append the entire response content to your message list:

```python
messages.append({"role": "assistant", "content": response.content})
```

The API automatically ignores all content before the compaction block on subsequent requests. You can optionally prune your local message list for efficiency, but it's not required.

### Streaming Behavior

When streaming with compaction enabled, you'll receive:
1. `content_block_start` event (type: "compaction")
2. Single `content_block_delta` with complete summary (no incremental streaming)
3. `content_block_stop` event
4. Normal text block streaming continues

## Common Patterns

### Basic Long-Running Conversation

```python
def chat(user_message: str) -> str:
    messages.append({"role": "user", "content": user_message})

    response = client.beta.messages.create(
        betas=["compact-2026-01-12"],
        model="claude-opus-4-6",
        max_tokens=4096,
        messages=messages,
        context_management={
            "edits": [{"type": "compact_20260112"}]
        },
    )

    # Compaction blocks are automatically included
    messages.append({"role": "assistant", "content": response.content})
    return extract_text(response)
```

### Preserving Recent Messages

Use `pause_after_compaction` to keep the last N turns verbatim instead of summarizing them:

```python
if response.stop_reason == "compaction":
    compaction_block = response.content[0]
    preserved = messages[-2:]  # Keep last turn

    messages = [
        {"role": "assistant", "content": [compaction_block]},
        *preserved
    ]

    # Continue request with compacted context + preserved messages
    response = client.beta.messages.create(...)
```

### Enforcing Token Budgets

Track compaction count to estimate cumulative usage and gracefully wrap up tasks:

```python
TRIGGER = 100_000
BUDGET = 3_000_000
n_compactions = 0

if response.stop_reason == "compaction":
    n_compactions += 1
    if n_compactions * TRIGGER >= BUDGET:
        messages.append({
            "role": "user",
            "content": "Please wrap up and summarize final state."
        })
```

### Combining with Prompt Caching

Add cache breakpoints on system prompts to maximize cache hits across compaction events:

```python
system=[{
    "type": "text",
    "text": "You are a helpful assistant...",
    "cache_control": {"type": "ephemeral"}  # Survives compaction
}]
```

## Gotchas

- **Information loss risk**: Overly aggressive compaction can discard subtle but critical context whose importance only becomes apparent later. Start with high retention and tune gradually.

- **Re-fetch overhead**: Once artifacts are summarized away, the agent may need to re-fetch them, adding latency. In iterative workflows (code review, debugging), this overhead can outweigh token savings.

- **Same model for summarization**: Claude uses the same model specified in your request for summarization—you cannot use a cheaper model for summaries.

- **Custom instructions replace, not supplement**: Providing custom `instructions` completely replaces the default summarization prompt. Include all necessary guidance.

- **Usage calculation changes**: With compaction enabled, top-level `usage.input_tokens` and `usage.output_tokens` don't include compaction iteration usage. Sum across `usage.iterations` for accurate billing.

- **Streaming differences**: Compaction blocks stream as a single delta (no incremental content), unlike text blocks.

- **OpenAI blocks are opaque**: OpenAI's compaction items are encrypted and not human-readable. Don't attempt to parse or modify them.

- **Summarization vs. compression**: Summarization generates new sentences (hallucination risk); compression keeps original phrasing but removes redundancy (safer for precision). Server-side compaction typically uses summarization.

- **Minimum threshold**: Claude requires at least 50,000 tokens for the trigger threshold—you can't compact very short conversations.

## Sources

- [Compaction - Claude API Docs](https://platform.claude.com/docs/en/build-with-claude/compaction) — Comprehensive official documentation on Claude's compaction feature, including API parameters, code examples, and usage patterns
- [Effective context engineering for AI agents - Anthropic](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) — Engineering guidance on context compaction strategies, trade-offs, and when to use compaction vs. alternatives
- [Compaction - OpenAI API](https://developers.openai.com/api/docs/guides/compaction) — OpenAI's server-side and standalone compaction documentation
- [Top techniques to manage context length in LLMs - Agenta](https://agenta.ai/blog/top-6-techniques-to-manage-context-length-in-llms) — Comparison of six context management approaches including truncation, routing, memory buffering, hierarchical summarization, compression, and RAG
