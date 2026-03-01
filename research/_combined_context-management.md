# Combined Research: Context Window Management


---

# Prompt Caching Fundamentals

**Topic ID:** context-management.caching.basics
**Researched:** 2026-03-01T12:00:00Z

## Overview

Prompt caching is an Anthropic API feature that optimizes both cost and latency by allowing the reuse of previously processed prompt prefixes. When you send a request with caching enabled, the system stores KV cache representations and cryptographic hashes of cached content. Subsequent requests with identical prefixes retrieve this cached state rather than reprocessing from scratch, reducing processing time by up to 85% for long prompts and cutting input token costs by 90%.

The feature operates on a prefix-matching basis: content is cached in order from `tools` → `system` → `messages`, and any modification to earlier content invalidates all downstream cache entries. Prompt caching is particularly valuable for conversational agents, coding assistants processing large codebases, document analysis workflows, and agentic systems with multiple tool calls. A 100K-token document analysis, for example, can see response time drop from 11.5 seconds to 2.4 seconds after the initial cache is established.

Anthropic offers two cache duration options: a default 5-minute TTL (time-to-live) that refreshes on each hit at no additional cost, and an extended 1-hour TTL at higher write cost for use cases with less frequent access patterns.

## Key Concepts

- **`cache_control` parameter**: The mechanism for marking content to be cached. Set as `{"type": "ephemeral"}` for 5-minute cache or `{"type": "ephemeral", "ttl": "1h"}` for 1-hour cache.

- **Automatic caching**: Adding `cache_control` at the request's top level; the system automatically places the breakpoint on the last cacheable block and moves it forward as conversations grow.

- **Explicit cache breakpoints**: Placing `cache_control` on individual content blocks for fine-grained control. Up to 4 breakpoints are allowed per request.

- **Cache prefix**: The entire prompt content up to and including the block marked with `cache_control`. Caching follows the hierarchy: `tools` → `system` → `messages`.

- **Cache write**: When new content is written to cache (1.25x base input price for 5-minute, 2x for 1-hour TTL).

- **Cache read/hit**: When cached content is retrieved (0.1x base input price—a 90% savings).

- **Minimum token threshold**: Content must meet minimum length requirements to be cached: 1024 tokens for Sonnet models, 2048-4096 tokens for other models depending on the specific version.

- **20-block lookback window**: The system automatically checks up to 20 content blocks before each explicit breakpoint for cache matches.

- **TTL refresh**: Each cache hit resets the expiration timer, so active sessions can maintain cache indefinitely.

## Technical Details

### Enabling Caching

**Automatic caching (simplest approach):**

```python
import anthropic

client = anthropic.Anthropic()

response = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=1024,
    cache_control={"type": "ephemeral"},  # Top-level, automatic
    system="You are a helpful assistant.",
    messages=[
        {"role": "user", "content": "Hello!"}
    ]
)
```

**Explicit caching (fine-grained control):**

```python
response = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=1024,
    system=[
        {
            "type": "text",
            "text": "Large system prompt content here...",
            "cache_control": {"type": "ephemeral"}
        }
    ],
    messages=[{"role": "user", "content": "Analyze this."}]
)
```

### Extended 1-Hour TTL

```json
{
  "cache_control": {
    "type": "ephemeral",
    "ttl": "1h"
  }
}
```

When mixing TTLs, longer TTL entries must appear before shorter ones (1-hour before 5-minute).

### Minimum Cacheable Tokens by Model

| Model | Minimum Tokens |
|-------|----------------|
| Claude Opus 4.6, Opus 4.5 | 4096 |
| Claude Sonnet 4.6 | 2048 |
| Claude Sonnet 4.5, Sonnet 4, Opus 4.1, Opus 4 | 1024 |
| Claude Haiku 4.5 | 4096 |
| Claude Haiku 3.5, Haiku 3 | 2048 |

### Pricing Structure

| Model | Base Input | 5m Cache Write | 1h Cache Write | Cache Read |
|-------|------------|----------------|----------------|------------|
| Claude Sonnet 4.x | $3/MTok | $3.75/MTok | $6/MTok | $0.30/MTok |
| Claude Opus 4.x | $15/MTok | $18.75/MTok | $30/MTok | $1.50/MTok |
| Claude Haiku 4.5 | $1/MTok | $1.25/MTok | $2/MTok | $0.10/MTok |

Break-even occurs at just 2 API calls with cached content.

### Usage Response Fields

```json
{
  "usage": {
    "input_tokens": 50,
    "cache_creation_input_tokens": 10000,
    "cache_read_input_tokens": 0,
    "output_tokens": 200
  }
}
```

Total input tokens = `cache_read_input_tokens` + `cache_creation_input_tokens` + `input_tokens`

## Common Patterns

### Multi-Turn Conversation Caching

For ongoing conversations, mark the final block with `cache_control`. The system automatically reuses previously cached turns:

```python
messages=[
    {"role": "user", "content": "First message"},
    {"role": "assistant", "content": "First response"},
    {
        "role": "user",
        "content": [
            {"type": "text", "text": "Follow-up question"},
            {"type": "text", "text": "More context", "cache_control": {"type": "ephemeral"}}
        ]
    }
]
```

### Large Document Analysis

Cache the document in the system prompt, keep queries uncached:

```python
system=[
    {"type": "text", "text": "You are a document analyst."},
    {
        "type": "text",
        "text": "[Full 50-page document text here]",
        "cache_control": {"type": "ephemeral"}
    }
]
```

### Tool Definition Caching

Place `cache_control` on the last tool to cache all tool definitions:

```python
tools=[
    {"name": "search", "description": "...", "input_schema": {...}},
    {
        "name": "get_doc",
        "description": "...",
        "input_schema": {...},
        "cache_control": {"type": "ephemeral"}
    }
]
```

### Multiple Independent Breakpoints

Use up to 4 breakpoints for content that changes at different frequencies:

1. Tools (rarely change)
2. System instructions (rarely change)
3. RAG/document context (may change daily)
4. Conversation history (changes per message)

## Gotchas

- **Concurrent request race condition**: A cache entry only becomes available after the first response begins. For parallel requests, the first must complete before others can hit the cache.

- **Image and tool_choice changes invalidate cache**: Adding or removing images anywhere in the prompt, or changing `tool_choice`, invalidates message-level caches.

- **Thinking blocks cannot be directly cached**: You cannot place `cache_control` on thinking blocks, though they are cached when appearing in previous assistant turns.

- **TTL ordering constraint**: When mixing 1-hour and 5-minute caches, 1-hour entries must appear before 5-minute entries or the API returns a 400 error.

- **Web search/citations toggle invalidates system cache**: Enabling or disabling these features modifies the system prompt internally.

- **Reported TTL variance**: Some users have reported the effective 5-minute TTL behaving closer to 3 minutes in practice, though documentation still states 5 minutes.

- **No manual cache clearing**: Cached content automatically expires; there's no API to force eviction.

- **JSON key ordering matters**: Languages like Swift and Go may randomize JSON key order during serialization, breaking cache matches for tool definitions.

- **20-block lookback limit**: For prompts with more than 20 content blocks before your breakpoint, early modifications won't trigger cache hits unless you add explicit breakpoints closer to that content.

- **Workspace isolation change (Feb 2026)**: Cache isolation is moving from organization-level to workspace-level on the Claude API and Azure AI Foundry.

## Sources

- [Prompt caching - Claude API Docs](https://platform.claude.com/docs/en/build-with-claude/prompt-caching) — Primary source for all technical details, code examples, caching strategies, pricing, and limitations
- [Pricing - Claude API Docs](https://platform.claude.com/docs/en/about-claude/pricing) — Official pricing tables and multiplier information for cache writes and reads
- [How Prompt Caching Actually Works in Claude Code](https://www.claudecodecamp.com/p/how-prompt-caching-actually-works-in-claude-code) — Practical insights on TTL behavior and cache hit patterns


---

# Caching with Extended Thinking

**Topic ID:** context-management.caching.with-thinking
**Researched:** 2026-03-01T12:00:00Z

## Overview

Prompt caching with extended thinking in the Claude API presents unique challenges and behaviors that developers must understand to optimize costs and maintain reasoning continuity. When Claude uses extended thinking (either manual or adaptive mode), the internal reasoning process generates thinking blocks that interact with the caching system in specific ways that differ from standard text content.

The core complexity stems from a fundamental tension: thinking blocks must be preserved during tool use loops to maintain reasoning continuity, yet they cannot be explicitly marked with `cache_control` breakpoints. Despite this limitation, thinking blocks are automatically cached as part of the request content when subsequent API calls include tool results. This implicit caching behavior means developers are billed for thinking block input tokens when they're read from cache, creating cost implications that aren't immediately obvious.

Starting with Claude Opus 4.5 (and continuing in Opus 4.6), thinking block preservation behavior changed significantly. Previous models stripped thinking blocks from prior assistant turns, but newer models preserve them in context by default. This enables better cache hit rates in multi-step agentic workflows but consumes more context window space in long conversations.

## Key Concepts

- **Thinking block preservation**: Thinking blocks must be passed back unmodified to the API when continuing conversations with tool use. The entire sequence of consecutive thinking blocks must match the original model output exactly—you cannot rearrange or modify them.

- **Implicit caching**: While thinking blocks cannot have explicit `cache_control` markers, they get cached automatically as part of request content when you make subsequent API calls with tool results. This happens transparently even without explicit cache breakpoints.

- **Cache invalidation on mode change**: Switching between thinking modes (`adaptive`, `enabled`, or `disabled`) invalidates message cache breakpoints. System prompts and tool definitions remain cached, but all message content must be reprocessed.

- **Budget change invalidation**: Changes to the thinking budget (`budget_tokens`) also invalidate previously cached message prefixes, even if thinking remains enabled.

- **Interleaved thinking**: Claude 4 models support thinking between tool calls, which amplifies cache invalidation effects since thinking blocks can occur between multiple tool calls within a single assistant turn.

- **Tool result exemption**: Cache remains valid when only tool results are provided as user messages. Cache gets invalidated when non-tool-result user content is added, causing all previous thinking blocks to be stripped.

- **Model-specific preservation**: Claude Opus 4.5+ preserves thinking blocks from previous turns by default. Earlier models (Sonnet 4.5, Opus 4.1, etc.) continue to strip thinking blocks from prior turns.

- **1-hour cache TTL**: Extended thinking tasks often exceed the default 5-minute cache lifetime. The 1-hour cache option (`"ttl": "1h"`) helps maintain cache hits across longer thinking sessions at 2x the base input token price.

## Technical Details

### Cache Hierarchy and Thinking Parameters

The cache follows a strict hierarchy: `tools` → `system` → `messages`. Thinking parameter changes only invalidate the messages level, leaving tools and system prompts cached:

```json
{
  "thinking": {
    "type": "enabled",
    "budget_tokens": 10000
  }
}
```

Changing `budget_tokens` from 10000 to 8000 will invalidate message caches but preserve tool and system prompt caches.

### Token Counting with Cached Thinking Blocks

When thinking blocks are read from cache, they count as input tokens in usage metrics:

```json
{
  "usage": {
    "cache_creation_input_tokens": 1370,
    "cache_read_input_tokens": 0,
    "input_tokens": 17,
    "output_tokens": 700
  }
}
```

On cache hit:
```json
{
  "usage": {
    "cache_creation_input_tokens": 0,
    "cache_read_input_tokens": 1370,
    "input_tokens": 303,
    "output_tokens": 874
  }
}
```

### Adaptive vs Manual Thinking Caching Behavior

Consecutive requests using the same thinking mode preserve cache breakpoints:

| Mode Transition | Cache Effect |
|-----------------|--------------|
| `adaptive` → `adaptive` | Cache preserved |
| `enabled` → `enabled` (same budget) | Cache preserved |
| `enabled` → `enabled` (different budget) | Messages invalidated |
| `adaptive` → `enabled` | Messages invalidated |
| `adaptive` → disabled | Messages invalidated |

### Thinking Block Structure Requirements

When passing thinking blocks back, include the complete unmodified content:

```python
# Extract and preserve all thinking blocks
thinking_block = next(
    (block for block in response.content if block.type == "thinking"), None
)
tool_use_block = next(
    (block for block in response.content if block.type == "tool_use"), None
)

# Pass both back unmodified
continuation = client.messages.create(
    model="claude-sonnet-4-6",
    thinking={"type": "enabled", "budget_tokens": 10000},
    tools=[weather_tool],
    messages=[
        {"role": "user", "content": "What's the weather in Paris?"},
        {"role": "assistant", "content": [thinking_block, tool_use_block]},
        {"role": "user", "content": [{"type": "tool_result", ...}]},
    ],
)
```

## Common Patterns

### Pattern 1: Long-Running Agentic Workflows

Use 1-hour cache TTL for agentic workflows that may pause between tool calls:

```json
{
  "cache_control": {
    "type": "ephemeral",
    "ttl": "1h"
  }
}
```

### Pattern 2: Multi-Turn with Thinking Preservation (Opus 4.5+)

For Claude Opus 4.5 and later, thinking blocks are preserved by default, enabling incremental caching across assistant turns:

```python
# Request 1: Initial query
response1 = client.messages.create(
    model="claude-opus-4-5",
    thinking={"type": "enabled", "budget_tokens": 4000},
    system=SYSTEM_PROMPT,
    messages=[{"role": "user", "content": "Analyze this text..."}],
)

# Request 2: Follow-up with cache hit on previous content
response2 = client.messages.create(
    model="claude-opus-4-5",
    thinking={"type": "enabled", "budget_tokens": 4000},  # Same budget
    system=SYSTEM_PROMPT,
    messages=[
        {"role": "user", "content": "Analyze this text..."},
        {"role": "assistant", "content": response1.content},
        {"role": "user", "content": "Now focus on the characters."},
    ],
)
```

### Pattern 3: Stable System Prompts with Variable Thinking

Cache system prompts separately since they remain cached when thinking parameters change:

```python
system=[
    {
        "type": "text",
        "text": "You are an AI assistant...",
        "cache_control": {"type": "ephemeral"},  # Survives budget changes
    }
]
```

## Gotchas

- **Thinking blocks cannot have explicit cache_control**: You cannot place `cache_control` directly on thinking blocks. They're excluded from being cache breakpoints, but still get cached implicitly as part of preceding content.

- **Billed tokens differ from visible tokens**: With summarized thinking (Claude 4 models), you're billed for the full thinking tokens generated, not the summarized output you see. The `output_tokens` in usage reflects the actual cost, not the visible response length.

- **Mode switching is expensive**: Toggling between thinking modes mid-conversation invalidates message caches. Plan your thinking strategy at the start of conversations rather than switching dynamically.

- **Tool use loops are single turns**: The entire tool use sequence (thinking → tool_use → tool_result → response) is conceptually one assistant turn. You cannot toggle thinking mode mid-loop.

- **Non-tool user content strips thinking**: Adding regular user messages (not tool results) causes all previous thinking blocks to be stripped from context for older models, invalidating caches.

- **Context window surprise**: While thinking blocks from previous turns are stripped for context calculations, thinking blocks in the current tool use loop DO count toward context. This can cause unexpected context overflow in complex agentic workflows.

- **Signature field is required**: The encrypted `signature` field in thinking blocks must be preserved when passing blocks back. Modifying or removing it breaks verification.

- **5-minute default may be too short**: Extended thinking tasks often exceed 5 minutes. If you're seeing frequent cache misses, consider the 1-hour TTL option despite its 2x cost multiplier.

## Sources

- [Building with extended thinking - Claude API Docs](https://platform.claude.com/docs/en/docs/build-with-claude/extended-thinking) — Primary documentation on extended thinking behavior, caching interactions, thinking block preservation, and tool use patterns
- [Prompt caching - Claude API Docs](https://platform.claude.com/docs/en/docs/build-with-claude/prompt-caching) — Comprehensive guide to prompt caching mechanics, cache invalidation rules, pricing, and thinking block caching behavior
- [Adaptive thinking - Claude API Docs](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking) — Documentation on adaptive thinking mode and its caching behavior relative to manual extended thinking


---

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


---

# Token Counting API

**Topic ID:** context-management.optimization.token-counting
**Researched:** 2025-03-01T12:00:00Z

## Overview

The Token Counting API allows developers to determine the exact number of tokens in a message before sending it to Claude, enabling proactive cost management and informed decisions about prompts and model selection. Unlike estimation approaches that approximate token counts using third-party tokenizers, Anthropic's endpoint uses the same tokenization logic as the actual inference pipeline, providing billing-accurate counts.

Token counting is essential for applications that need to optimize context window usage, implement dynamic model routing based on message size, or provide users with real-time cost estimates. The API accepts the same input structure as the Messages API—including system prompts, tools, images, PDFs, and multi-turn conversations—making it straightforward to integrate into existing workflows.

The endpoint is available directly through Anthropic's API at `POST /v1/messages/count_tokens`, on Google Cloud Vertex AI via the `count-tokens:rawPredict` endpoint, and on Amazon Bedrock through the `CountTokens` operation. All three platforms offer the functionality at no cost, though each has its own rate limits and regional availability.

## Key Concepts

- **Input token count**: The response returns a single `input_tokens` field representing the total tokens across messages, system prompt, and tool definitions. This count reflects what would be charged during actual inference.

- **Billing accuracy**: The token count should be considered an estimate; in rare cases, the actual input tokens used during message creation may differ by a small amount. However, you are not billed for system-added tokens that Anthropic may inject for optimizations.

- **Supported content types**: The endpoint accepts all content types supported by the Messages API: text, images (base64 and URL), PDFs, tool definitions, tool results, and extended thinking blocks.

- **Zero Data Retention (ZDR) eligibility**: Token counting is ZDR-eligible, meaning data sent through this endpoint is not stored after the API response is returned when your organization has a ZDR arrangement.

- **Independent rate limits**: Token counting and message creation have separate rate limits—usage of one does not count against the other, allowing you to count tokens freely without impacting your inference capacity.

- **Model-specific tokenization**: Each model has its own tokenizer, so token counts are model-specific. Always specify the intended model when counting tokens to get accurate results.

- **Server tool considerations**: When counting tokens for requests that include server tools (like web search), the token count only applies to the first sampling call, as subsequent tool results add additional tokens.

## Technical Details

### API Endpoint

```
POST https://api.anthropic.com/v1/messages/count_tokens
```

### Required Headers

```
x-api-key: $ANTHROPIC_API_KEY
content-type: application/json
anthropic-version: 2023-06-01
```

### Request Body

The request body mirrors the Messages API structure:

```json
{
  "model": "claude-sonnet-4-5",
  "system": "You are a helpful assistant",
  "messages": [
    {"role": "user", "content": "Hello, Claude"}
  ],
  "tools": []
}
```

### Response Format

```json
{
  "input_tokens": 14
}
```

### Python SDK Usage

```python
import anthropic

client = anthropic.Anthropic()

response = client.messages.count_tokens(
    model="claude-sonnet-4-5",
    system="You are a scientist",
    messages=[{"role": "user", "content": "Hello, Claude"}],
)

print(response.input_tokens)  # Output: 14
```

### Counting Tokens with Tools

```python
response = client.messages.count_tokens(
    model="claude-sonnet-4-5",
    tools=[
        {
            "name": "get_weather",
            "description": "Get the current weather in a given location",
            "input_schema": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "The city and state, e.g. San Francisco, CA"
                    }
                },
                "required": ["location"]
            }
        }
    ],
    messages=[{"role": "user", "content": "What's the weather in SF?"}],
)
# Tool definitions add significant tokens—this returns ~403 tokens
```

### Rate Limits by Usage Tier

| Usage Tier | Requests per Minute (RPM) |
|------------|---------------------------|
| 1          | 100                       |
| 2          | 2,000                     |
| 3          | 4,000                     |
| 4          | 8,000                     |

## Common Patterns

### Pre-flight Cost Estimation

Count tokens before sending expensive requests to estimate costs and warn users:

```python
def estimate_cost(messages, model="claude-sonnet-4-5"):
    count = client.messages.count_tokens(model=model, messages=messages)

    # Pricing varies by model; example for Sonnet
    input_price_per_million = 3.00
    estimated_cost = (count.input_tokens / 1_000_000) * input_price_per_million

    return count.input_tokens, estimated_cost
```

### Smart Model Routing

Route to different models based on message complexity:

```python
def select_model(messages):
    count = client.messages.count_tokens(
        model="claude-sonnet-4-5",  # Use any model for counting
        messages=messages
    )

    if count.input_tokens < 1000:
        return "claude-3-5-haiku-latest"  # Fast, cheap for simple queries
    elif count.input_tokens < 50000:
        return "claude-sonnet-4-5"  # Balanced option
    else:
        return "claude-opus-4-5"  # Maximum capability for complex tasks
```

### Context Window Management

Ensure messages fit within context limits before sending:

```python
MAX_CONTEXT = 200000  # Claude's context window

def validate_and_trim(messages, system=""):
    count = client.messages.count_tokens(
        model="claude-sonnet-4-5",
        system=system,
        messages=messages
    )

    while count.input_tokens > MAX_CONTEXT * 0.8:  # Leave room for response
        messages = messages[1:]  # Remove oldest message
        count = client.messages.count_tokens(
            model="claude-sonnet-4-5",
            system=system,
            messages=messages
        )

    return messages
```

### Amazon Bedrock Integration

```python
import boto3
import json

bedrock = boto3.client("bedrock-runtime")

response = bedrock.count_tokens(
    modelId="anthropic.claude-sonnet-4-20250514-v1:0",
    input={
        "converse": {
            "messages": [
                {"role": "user", "content": [{"text": "Hello"}]}
            ],
            "system": [{"text": "You are helpful."}]
        }
    }
)

print(response["inputTokens"])
```

## Gotchas

- **Token count is an estimate**: While highly accurate, the actual tokens billed during inference may differ slightly. For billing-critical applications, treat the count as an approximation rather than an exact figure.

- **System-added tokens are not billed**: Anthropic may add tokens for internal optimizations. These appear in the count but you won't be charged for them.

- **Prompt caching is not simulated**: Even if you include `cache_control` blocks in your token counting request, prompt caching only occurs during actual message creation. The count reflects uncached token usage.

- **Extended thinking token handling**: When using extended thinking, thinking blocks from previous assistant turns are ignored and do not count toward input tokens. Only the current turn's thinking counts.

- **Tool definitions are expensive**: A single tool definition can add 300-500+ tokens. If you're registering many tools, this overhead compounds quickly.

- **Image tokens are non-trivial**: A typical image adds 1,000-2,000 tokens depending on resolution. Always count tokens when working with multimodal inputs.

- **Local approximation limitations**: If you must estimate offline, OpenAI's `tiktoken` with `p50k_base` encoding provides a rough approximation, but it's unreliable for billing purposes. Always use the official API for accurate counts.

- **Regional availability on cloud providers**: On Vertex AI, token counting is only available in specific regions (us-east5, europe-west1, asia-east1, asia-southeast1, us-central1, europe-west4). On Bedrock, regional support varies by model version.

## Sources

- [Token counting - Claude API Docs](https://platform.claude.com/docs/en/build-with-claude/token-counting) — Primary documentation covering use cases, code examples across Python/TypeScript/Java/Shell, and rate limit details.

- [Count tokens in a Message - API Reference](https://platform.claude.com/docs/en/api/messages-count-tokens) — Complete API specification including all request parameters, content block types, and response format.

- [Count tokens for Claude models - Google Cloud](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/partner-models/claude/count-tokens) — Vertex AI integration documentation covering supported models, regions, and the 2,000 RPM default quota.

- [Monitor your token usage by counting tokens - Amazon Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/count-tokens.html) — AWS documentation with Boto3 examples for both InvokeModel and Converse request formats, plus IAM permission requirements.

