# Compaction Usage

**Topic ID:** context-management.compaction.usage
**Researched:** 2026-03-01T12:00:00Z

## Overview

Compaction is a beta feature in the Claude API that provides server-side context summarization, enabling effectively infinite conversations by automatically summarizing older context when approaching the context window limit [1]. Rather than simply avoiding a token cap, compaction addresses a fundamental problem: as conversations grow longer, models struggle to maintain focus across the full history, leading to degraded accuracy and recall (known as "context rot") [1][2]. When input tokens exceed a configured threshold, Claude generates a summary of the conversation, creates a compaction block containing that summary, and continues the response with the compacted context [1].

Compaction is currently supported on Claude Opus 4.6 and Claude Sonnet 4.6 models [1]. It is ideal for chat-based multi-turn conversations where users maintain one chat for extended periods, and for task-oriented prompts involving extensive follow-up work (often tool use) that may exceed the standard 200K context window [1]. The feature is eligible for Zero Data Retention (ZDR) arrangements [1].

## Key Concepts

- **Beta Header** — Compaction requires the beta header `compact-2026-01-12` in API requests; without this header, the feature is not enabled [1][3].

- **Context Management Parameter** — Enable compaction by adding `compact_20260112` strategy to `context_management.edits` in the Messages API request [1].

- **Compaction Block** — When compaction triggers, the API returns a content block of type `compaction` containing the generated summary; this block must be passed back in subsequent requests [1].

- **Trigger Threshold** — Configurable token threshold (default 150,000; minimum 50,000) at which compaction is triggered based on input tokens [1][3].

- **pause_after_compaction** — Boolean parameter (default false) that pauses the API after generating the summary, allowing additional content to be added before continuing [1].

- **Custom Instructions** — The `instructions` parameter allows replacing the default summarization prompt entirely with custom focus areas [1].

- **Lossy Transformation** — Compaction is inherently lossy; roughly 20-30% of original detail is retained, with summaries capturing "what happened" but often losing "why" and subtle details [4][5].

- **Stop Reason** — When `pause_after_compaction` is true and compaction triggers, the response returns with `stop_reason: "compaction"` [1].

## Technical Details

### Basic API Usage

Enable compaction with the following curl request [1]:

```bash
curl https://api.anthropic.com/v1/messages \
     --header "x-api-key: $ANTHROPIC_API_KEY" \
     --header "anthropic-version: 2023-06-01" \
     --header "anthropic-beta: compact-2026-01-12" \
     --header "content-type: application/json" \
     --data \
'{
    "model": "claude-opus-4-6",
    "max_tokens": 4096,
    "messages": [{"role": "user", "content": "Help me build a website"}],
    "context_management": {
        "edits": [{"type": "compact_20260112"}]
    }
}'
```

### Python SDK Usage

```python
import anthropic

client = anthropic.Anthropic()

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

# Append response (including compaction block) to continue conversation
messages.append({"role": "assistant", "content": response.content})
```

### Configuration Parameters

| Parameter | Type | Default | Description |
|:----------|:-----|:--------|:------------|
| `type` | string | Required | Must be `"compact_20260112"` |
| `trigger` | object | 150,000 tokens | When to trigger; must be at least 50,000 tokens |
| `pause_after_compaction` | boolean | `false` | Pause after generating summary |
| `instructions` | string | `null` | Custom summarization prompt (replaces default entirely) |

### Response Structure with Compaction Block

```json
{
  "content": [
    {
      "type": "compaction",
      "content": "Summary of the conversation: The user requested help..."
    },
    {
      "type": "text",
      "text": "Based on our conversation so far..."
    }
  ]
}
```

### Usage and Billing

The `usage.iterations` array shows token consumption for each sampling step [1][3]:

```json
{
  "usage": {
    "input_tokens": 45000,
    "output_tokens": 1234,
    "iterations": [
      {"type": "compaction", "input_tokens": 180000, "output_tokens": 3500},
      {"type": "message", "input_tokens": 23000, "output_tokens": 1000}
    ]
  }
}
```

The top-level `input_tokens` and `output_tokens` do NOT include compaction iteration usage; sum across all entries in `usage.iterations` for total billing [1][3].

### AWS Bedrock Differences

On Amazon Bedrock, compaction is supported via InvokeModel but NOT the Converse API [3]. The beta header and configuration remain the same.

## Common Patterns

### Enforcing a Total Token Budget

Combine `pause_after_compaction` with a compaction counter to estimate cumulative usage and gracefully wrap up tasks [1]:

```python
TRIGGER_THRESHOLD = 100_000
TOTAL_TOKEN_BUDGET = 3_000_000
n_compactions = 0

response = client.beta.messages.create(
    betas=["compact-2026-01-12"],
    model="claude-opus-4-6",
    max_tokens=4096,
    messages=messages,
    context_management={
        "edits": [{
            "type": "compact_20260112",
            "trigger": {"type": "input_tokens", "value": TRIGGER_THRESHOLD},
            "pause_after_compaction": True,
        }]
    },
)

if response.stop_reason == "compaction":
    n_compactions += 1
    messages.append({"role": "assistant", "content": response.content})

    if n_compactions * TRIGGER_THRESHOLD >= TOTAL_TOKEN_BUDGET:
        messages.append({
            "role": "user",
            "content": "Please wrap up your current work and summarize the final state.",
        })
```

### Preserving Recent Messages After Compaction

Use `pause_after_compaction` to inject preserved messages between the compaction block and continuation [1]:

```python
if response.stop_reason == "compaction":
    compaction_block = response.content[0]
    preserved_messages = messages[-2:]  # Last user+assistant turn

    messages_after_compaction = [
        {"role": "assistant", "content": [compaction_block]}
    ] + preserved_messages

    response = client.beta.messages.create(
        betas=["compact-2026-01-12"],
        model="claude-opus-4-6",
        max_tokens=4096,
        messages=messages_after_compaction,
        context_management={"edits": [{"type": "compact_20260112"}]},
    )
```

### Maximizing Prompt Cache Hits

Add a `cache_control` breakpoint at the end of your system prompt to keep it cached separately, so compaction events do not invalidate the system prompt cache [1]:

```python
response = client.beta.messages.create(
    betas=["compact-2026-01-12"],
    model="claude-opus-4-6",
    max_tokens=4096,
    system=[{
        "type": "text",
        "text": "You are a helpful coding assistant...",
        "cache_control": {"type": "ephemeral"},
    }],
    messages=messages,
    context_management={"edits": [{"type": "compact_20260112"}]},
)
```

## Gotchas

1. **Summarization is inherently lossy** — Approximately 20-30% of original detail is retained [4][5]. Summaries capture "what happened" but often lose "why" and subtle implementation details. Specific variable names, exact error messages, and nuanced decisions get compressed into a gist.

2. **User-provided data can be irreversibly lost** — When auto-compaction triggers mid-task, data the user pasted (e.g., DOM markup, configuration files) may be reduced to a reference like "user provided 8,200 characters of DOM markup" without the actual data [4].

3. **Top-level usage fields exclude compaction tokens** — If you previously relied on `usage.input_tokens` and `usage.output_tokens` for cost tracking, you must update to aggregate across `usage.iterations` when compaction is enabled [1][3].

4. **Same model used for summarization** — There is no option to use a different (cheaper) model for the summarization step; the model specified in your request handles both summarization and response generation [1].

5. **Re-applying previous compaction blocks is free** — Re-sending an existing compaction block incurs no additional compaction cost; only new compaction triggers are billed [1][3].

6. **Minimum trigger threshold is 50,000 tokens** — You cannot set a trigger threshold below 50,000 tokens [1][3].

7. **Compaction can fail near context limits** — In Claude Code, running `/compact` when context is nearly full can fail with "Conversation too long" because the summarization process itself requires context space [4].

8. **Custom instructions replace (not supplement) default** — When providing custom `instructions`, they completely replace the default summarization prompt, not augment it [1].

9. **Streaming behavior differs** — Compaction blocks stream as a single `content_block_delta` with complete content, not incrementally like text blocks [1].

10. **Multiple compactions in long sessions** — A long-running conversation may trigger multiple compactions; the last compaction block reflects the final state, replacing all prior content [1].

## Sources

[1] **Compaction - Claude API Docs**
    URL: https://platform.claude.com/docs/en/build-with-claude/compaction
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Complete technical documentation including API usage, parameters, code examples, streaming behavior, prompt caching integration, and billing details.

[2] **Introducing Claude Opus 4.6 - Anthropic**
    URL: https://www.anthropic.com/news/claude-opus-4-6
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Feature announcement context, model availability, and relationship to other Opus 4.6 features like adaptive thinking and agent teams.

[3] **Compaction - Amazon Bedrock**
    URL: https://docs.aws.amazon.com/bedrock/latest/userguide/claude-messages-compaction.html
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Bedrock-specific implementation details, confirmation that Converse API does not support compaction, usage billing structure.

[4] **Why Claude Loses Context After Compaction - BSWEN**
    URL: https://docs.bswen.com/blog/2026-02-09-claude-context-loss-compaction/
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Detailed analysis of information loss (20-30% retention), real-world failure patterns, timing-dependent degradation, and prevention strategies.

[5] **Claude Code Context Issues - GitHub Issues**
    URL: https://github.com/anthropics/claude-code/issues/26771
    Accessed: 2026-03-01
    Relevance: background
    Extracted: Community-reported issues with compaction including failure modes near context limits, user data loss during mid-task compaction, and proposed solutions.
