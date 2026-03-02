# Context Window Sizes

**Topic ID:** context-management.token-limits.window-sizes
**Researched:** 2026-03-01T12:00:00Z

## Overview

Context window size determines how much text Claude can process in a single conversation turn, functioning as the model's "working memory" [1]. All Claude models support a standard 200K token context window (approximately 150,000 words or 500 pages of text), with extended options available for enterprise customers and high-tier API users [1][2]. The 1M token context window, currently in beta, represents a 5x expansion that enables processing of entire codebases, comprehensive legal document sets, or extensive research corpora in a single request [1].

Understanding context window tiers is critical for exam scenarios involving architecture decisions, cost optimization, and feature availability. The distinction between what is advertised versus what is practically usable matters significantly: while competitors may advertise similar context sizes, Claude's Opus 4.6 achieves 76% accuracy on the 8-needle 1M MRCR v2 benchmark compared to Gemini 3 Pro's 26.3% at the same context length [3].

Context windows are not just about capacity. As token count grows, accuracy and recall can degrade through a phenomenon called "context rot," making context curation as important as context size [1].

## Key Concepts

- **Standard Context Window (200K)** — The default context window for all Claude models across paid plans, providing approximately 150K words or 680K Unicode characters of capacity [2]. This is sufficient for most use cases including long documents, multi-turn conversations, and moderate codebases.

- **Enterprise Context Window (500K)** — Available exclusively to Claude.ai Enterprise plan users [1][4]. This tier sits between the standard 200K and the beta 1M window, offering 2.5x the standard capacity for organizations requiring larger context without API-level access.

- **1M Token Context Window (Beta)** — Extended context available via API for Claude Opus 4.6, Sonnet 4.6, Sonnet 4.5, and Sonnet 4 [1][2]. Requires usage tier 4 or custom rate limits. Activated using the `context-1m-2025-08-07` beta header.

- **Context Awareness** — A capability in Claude Sonnet 4.6, Sonnet 4.5, and Haiku 4.5 that tracks remaining token budget throughout a conversation [1]. The model receives explicit updates like `<system_warning>Token usage: 35000/200000; 165000 remaining</system_warning>` after each tool call.

- **Context Rot** — The degradation of accuracy and recall as context length increases [1]. Not all tokens in context are equally useful, and curating what enters context is as important as having large capacity.

- **Long Context Pricing** — Premium rates automatically applied when requests exceed 200K input tokens: 2x input pricing and 1.5x output pricing [1][5]. For Opus 4.6, this means $10/MTok input and $37.50/MTok output instead of $5/$25 [5].

## Technical Details

### Enabling the 1M Context Window

The 1M token context requires the beta header in API requests [1]:

```bash
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "anthropic-beta: context-1m-2025-08-07" \
  -H "content-type: application/json" \
  -d '{
    "model": "claude-opus-4-6",
    "max_tokens": 1024,
    "messages": [{"role": "user", "content": "Process this large document..."}]
  }'
```

Python SDK usage [1]:

```python
from anthropic import Anthropic

client = Anthropic()
response = client.beta.messages.create(
    model="claude-opus-4-6",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Process this large document..."}],
    betas=["context-1m-2025-08-07"],
)
```

### Context Window Limits by Model

| Model | Standard Window | Extended Window | Max Output |
|-------|-----------------|-----------------|------------|
| Claude Opus 4.6 | 200K tokens | 1M (beta) | 128K tokens |
| Claude Sonnet 4.6 | 200K tokens | 1M (beta) | 64K tokens |
| Claude Sonnet 4.5 | 200K tokens | 1M (beta) | 64K tokens |
| Claude Sonnet 4 | 200K tokens | 1M (beta) | 64K tokens |
| Claude Haiku 4.5 | 200K tokens | N/A | 64K tokens |
| Claude Opus 4.5 | 200K tokens | N/A | 64K tokens |

*Data compiled from [2]*

### Tier Requirements for 1M Context

The 1M token context window is restricted to [1]:
- Organizations at usage tier 4 or higher
- Organizations with custom rate limits negotiated with Anthropic

Lower-tier organizations must advance to tier 4 to access this feature.

### Platform Availability

The 1M context window is available on [1]:
- Claude Developer Platform (API direct)
- Amazon Bedrock
- Google Cloud Vertex AI
- Microsoft Foundry

## Common Patterns

### Long Document Processing

For processing legal contracts, research papers, or technical specifications exceeding 200K tokens, the pattern involves [1]:

1. Enable the 1M beta header
2. Structure the document with clear section markers
3. Place retrieval targets (questions, analysis instructions) at the end of the prompt
4. Monitor the response's `usage` object to track token consumption

### Multi-Session Workflows with Context Awareness

For agents spanning multiple context windows [1]:

1. Design state artifacts that enable fast context recovery at session start
2. Leverage context awareness updates to plan task completion
3. Use compaction (beta for Opus 4.6) to automatically summarize older context when approaching limits

### Cost-Optimized Long Context

When using contexts over 200K tokens [5]:

1. **Batch API**: 50% discount applies to long context pricing ($5/MTok input, $18.75/MTok output for Opus 4.6)
2. **Prompt caching**: Cache frequently reused long contexts to pay cache read rates (0.1x base) instead of full input rates
3. **Fast mode**: For Opus 4.6, fast mode ($30/$150 per MTok) includes the full 1M context at no additional long context charge

## Gotchas

- **200K threshold applies to total input**: The premium pricing threshold counts all input tokens including `cache_creation_input_tokens` and `cache_read_input_tokens`. If the sum exceeds 200K, the entire request is billed at premium rates [5].

- **Haiku 4.5 does not support 1M context**: Despite being a recent model, Claude Haiku 4.5 is capped at 200K tokens and has no extended context option [2]. This is a common exam trap when comparing model capabilities.

- **Opus 4.5 does not support 1M context**: Only Opus 4.6, Sonnet 4.6, Sonnet 4.5, and Sonnet 4 have the 1M beta [2]. Older Opus models (4.5, 4.1, 4) are limited to 200K.

- **Enterprise 500K is Claude.ai only**: The 500K context window is specific to the Claude.ai Enterprise web interface, not the API [1][4]. API users must use the 1M beta header instead.

- **Context awareness is not universal**: Only Sonnet 4.6, Sonnet 4.5, and Haiku 4.5 have context awareness [1]. Opus models and older Sonnets do not receive token budget updates mid-conversation.

- **Extended thinking tokens count toward context**: When using extended thinking, all thinking tokens count toward the context window limit during that turn, though previous thinking blocks are automatically stripped from subsequent turns [1].

- **Advertised vs usable context differs**: Benchmark performance degrades at extreme context lengths. Opus 4.6 maintains 76% accuracy at 1M tokens on MRCR v2, while competitors drop significantly lower [3]. "Context window size" alone does not indicate effective retrieval capability.

- **Validation errors instead of truncation**: Starting with Claude Sonnet 3.7 and later models, exceeding the context window returns a validation error rather than silently truncating the input [1]. Applications must implement proper token counting.

## Sources

[1] **Context windows - Claude API Docs**
    URL: https://platform.claude.com/docs/en/build-with-claude/context-windows
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Comprehensive context window documentation including 1M beta requirements, beta header syntax, context awareness mechanics, extended thinking behavior, pricing implications, and platform availability.

[2] **Models overview - Claude API Docs**
    URL: https://platform.claude.com/docs/en/about-claude/models/overview
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Model-by-model context window specifications, max output token limits, and which models support the 1M beta (Opus 4.6, Sonnet 4.6, Sonnet 4.5, Sonnet 4 only).

[3] **Introducing Claude Opus 4.6 - Anthropic News**
    URL: https://www.anthropic.com/news/claude-opus-4-6
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: MRCR v2 benchmark performance (76% for Opus 4.6 vs 26.3% for Gemini 3 Pro at 1M tokens), demonstrating practical long-context retrieval capability differences.

[4] **How large is the context window on paid Claude plans? - Claude Help Center**
    URL: https://support.claude.com/en/articles/8606394-how-large-is-the-context-window-on-paid-claude-plans
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Claude.ai plan-specific context windows (200K standard, 500K Enterprise), automatic context management with summarization for paid plans.

[5] **Pricing - Claude API Docs**
    URL: https://platform.claude.com/docs/en/about-claude/pricing
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Long context pricing structure (2x input, 1.5x output over 200K tokens), specific rates by model, batch API discounts, and how pricing modifiers stack.
