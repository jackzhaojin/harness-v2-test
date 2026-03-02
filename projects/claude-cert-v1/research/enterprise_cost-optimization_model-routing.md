# Model Routing

**Topic ID:** enterprise.cost-optimization.model-routing
**Researched:** 2026-03-01T12:00:00Z

## Overview

Model routing is an enterprise architecture pattern that directs incoming requests to the most appropriate Claude model from a tiered pool, optimizing the balance between capability, speed, and cost. Rather than sending all queries to a single high-capability model, intelligent routing classifies requests by complexity and routes them to Haiku (simple/fast tasks), Sonnet (balanced workloads), or Opus (complex reasoning), achieving cost reductions of 30-88% while maintaining quality [1][4].

The business case is compelling: at enterprise scale, even small per-token differences translate to significant cost impacts. A 70/20/10 split across Haiku/Sonnet/Opus instead of using Sonnet for everything can reduce costs by approximately 60% [1]. The current Claude model lineup (Opus 4.6 at $5/$25 per million tokens, Sonnet 4.6 at $3/$15, Haiku 4.5 at $1/$5) creates clear economic tiers that reward thoughtful routing [2][3].

Model routing exists on a spectrum from simple rule-based classification to sophisticated AI-driven semantic routing. The fundamental insight is that not every query requires maximum intelligence. Enterprises implement routing to ensure they never overpay for simple queries while preserving access to frontier capabilities when genuinely needed [1][5].

## Key Concepts

- **Tiered Model Architecture** — A pool of models organized by capability and cost. Claude's tiers are Haiku (fastest, cheapest, 5x lower cost than Sonnet), Sonnet (balanced performance/price), and Opus (most capable, complex reasoning) [2][3]. Each tier has distinct strengths: Haiku excels at real-time applications and high-volume processing; Sonnet handles 90%+ of coding tasks; Opus is reserved for multi-step research, advanced agents, and professional engineering [3].

- **Request Classification** — The process of analyzing incoming prompts to determine required capability level. Classification can be rule-based (keyword matching, prompt length), semantic (embedding similarity), or model-driven (a small classifier model predicting complexity) [4][5].

- **Cascading (Tier Escalation)** — A sequential strategy where requests start at the cheapest tier and escalate to stronger models only when the weaker model fails confidence thresholds. The weak model generates a candidate response; if it passes self-evaluation checks, it is accepted; otherwise, the request escalates [4].

- **Direct Routing** — A classification-based strategy that predicts the most appropriate model upfront, avoiding the redundant computation of cascading. Research shows direct routing can achieve up to 16x better efficiency compared to cascading while preserving accuracy [4].

- **LLM Mesh** — An emerging enterprise pattern analogous to service meshes, featuring intent classification, routing agents, execution across a heterogeneous model fleet, and result aggregation. This represents the shift from monolithic AI to orchestration-driven, specialized model ecosystems [4].

- **Smart Escalation Path** — A recommended progression for Claude: Haiku for initial processing, Sonnet for moderate complexity, Opus for maximum intelligence. Creating explicit escalation rules prevents both underspending (using Haiku for tasks requiring Opus) and overspending (using Opus for trivial queries) [1].

- **Fallback Routing** — Implementing automatic failover between model tiers when latency spikes or errors occur. If extended reasoning increases response time beyond thresholds, the system downgrades effort or switches models, preserving reliability [5].

## Technical Details

### Current Claude Model Specifications

The latest generation models and their key specifications for routing decisions [2][3]:

| Model | Input Price | Output Price | Max Output | Context | Best For |
|-------|-------------|--------------|------------|---------|----------|
| Opus 4.6 | $5/MTok | $25/MTok | 128K tokens | 200K (1M beta) | Complex reasoning, agents, professional engineering |
| Sonnet 4.6 | $3/MTok | $15/MTok | 64K tokens | 200K (1M beta) | Code generation, data analysis, agentic tool use |
| Haiku 4.5 | $1/MTok | $5/MTok | 64K tokens | 200K | Real-time apps, classification, high-volume processing |

### Batch API for Non-Real-Time Routing

Requests that do not require synchronous responses can be routed to the Batch API for an additional 50% discount [2]:

```json
{
  "model": "claude-sonnet-4-6",
  "batch_mode": true,
  "messages": [...]
}
```

Batch pricing: Opus 4.6 at $2.50/$12.50, Sonnet 4.6 at $1.50/$7.50, Haiku 4.5 at $0.50/$2.50 per million tokens [2].

### Implementing a Basic Three-Tier Router

A practical router implementation pattern from industry guidance [4][5]:

```python
def route_request(prompt: str, context: dict) -> str:
    """Route to appropriate Claude model based on task complexity."""

    # Rule-based classification (simplest approach)
    if is_simple_classification(prompt):
        return "claude-haiku-4-5"

    if requires_deep_reasoning(prompt, context):
        return "claude-opus-4-6"

    # Default to balanced tier
    return "claude-sonnet-4-6"

def is_simple_classification(prompt: str) -> bool:
    """Detect simple tasks suitable for Haiku."""
    simple_indicators = [
        "classify", "categorize", "extract", "summarize briefly",
        "yes or no", "true or false", "which option"
    ]
    return any(indicator in prompt.lower() for indicator in simple_indicators)

def requires_deep_reasoning(prompt: str, context: dict) -> bool:
    """Detect tasks requiring Opus-level capability."""
    complex_indicators = [
        "analyze and synthesize", "multi-step reasoning",
        "design architecture", "complex refactoring",
        "research and recommend"
    ]
    # Also consider context size and prior conversation complexity
    return (any(i in prompt.lower() for i in complex_indicators) or
            context.get("token_count", 0) > 50000 or
            context.get("prior_escalations", 0) > 0)
```

### Multi-Agent Architecture with Model Routing

For complex workflows, routing can be embedded in multi-agent systems. Anthropic's research found that a multi-agent architecture with Opus as lead agent and Sonnet subagents outperformed single-agent Opus by 90.2% on internal research evaluations [5]:

```python
# Multi-agent routing pattern
AGENT_MODEL_MAP = {
    "coordinator": "claude-opus-4-6",      # Orchestration, complex decisions
    "researcher": "claude-opus-4-6",       # Deep analysis
    "coder": "claude-sonnet-4-6",          # Code generation
    "reviewer": "claude-sonnet-4-6",       # Code review
    "classifier": "claude-haiku-4-5",      # Triage, categorization
    "extractor": "claude-haiku-4-5",       # Data extraction
}
```

### Combining Routing with Prompt Caching

Routing decisions should consider prompt caching opportunities. Cache reads cost only 10% of base input price [2]:

| Model | Base Input | Cache Write (5m) | Cache Write (1h) | Cache Read |
|-------|------------|------------------|------------------|------------|
| Opus 4.6 | $5/MTok | $6.25/MTok | $10/MTok | $0.50/MTok |
| Sonnet 4.6 | $3/MTok | $3.75/MTok | $6/MTok | $0.30/MTok |
| Haiku 4.5 | $1/MTok | $1.25/MTok | $2/MTok | $0.10/MTok |

For workflows with repeated context (e.g., system prompts, few-shot examples), combining routing with caching multiplies savings.

## Common Patterns

### Customer Support Tiered Routing

A standard enterprise pattern routes support tickets through escalating tiers [1][2]:

1. **Haiku** — Initial message triage, intent classification, simple FAQ responses
2. **Sonnet** — Detailed analysis of complex inquiries, policy lookup, standard resolutions
3. **Opus** — Cases requiring deep reasoning, creative problem-solving, or sensitive handling

This pattern processes approximately 70% of volume at the Haiku tier, achieving major cost savings on the bulk of routine queries.

### Code Review Routing

For development workflows, routing by task complexity [1][3]:

- **Haiku**: Linting, formatting suggestions, simple syntax checks
- **Sonnet**: Refactoring recommendations, code explanations, standard PR reviews
- **Opus**: Architecture decisions, complex bug analysis, security vulnerability assessment

### Semantic Router with Embedding Classification

More sophisticated implementations use embeddings to classify intent before routing [4]:

```python
from sentence_transformers import SentenceTransformer

# Pre-computed cluster centroids for each complexity tier
TIER_CENTROIDS = {
    "haiku": [...],   # Embeddings for simple tasks
    "sonnet": [...],  # Embeddings for moderate tasks
    "opus": [...]     # Embeddings for complex tasks
}

model = SentenceTransformer('all-MiniLM-L6-v2')

def semantic_route(prompt: str) -> str:
    embedding = model.encode(prompt)
    # Find nearest tier centroid
    similarities = {
        tier: cosine_similarity(embedding, centroid)
        for tier, centroid in TIER_CENTROIDS.items()
    }
    return max(similarities, key=similarities.get)
```

### Dynamic Escalation with Confidence Thresholds

Cascading implementations that escalate based on model confidence [4]:

```python
async def cascade_with_confidence(prompt: str, threshold: float = 0.85):
    """Try cheaper model first, escalate if confidence is low."""

    # Start with Haiku
    response = await call_claude("claude-haiku-4-5", prompt)
    if response.confidence >= threshold:
        return response, "haiku"

    # Escalate to Sonnet
    response = await call_claude("claude-sonnet-4-6", prompt)
    if response.confidence >= threshold:
        return response, "sonnet"

    # Final escalation to Opus
    response = await call_claude("claude-opus-4-6", prompt)
    return response, "opus"
```

## Gotchas

- **Over-relying on Haiku for borderline tasks** — Haiku 4.5 delivers "near-frontier" performance but is not a drop-in replacement for Sonnet on moderately complex tasks [3]. Tasks requiring nuanced understanding or multi-step reasoning will produce noticeably worse results. Test extensively before routing production traffic.

- **Ignoring output token costs** — Output tokens cost 5x input tokens across all tiers ($25 vs $5 for Opus, $15 vs $3 for Sonnet) [2]. A task that generates verbose output may be cheaper on a faster model even if input routing would suggest otherwise. Consider expected output length in routing decisions.

- **Cascading latency tax** — Pure cascading (try Haiku, then Sonnet, then Opus) adds latency on every escalation. For latency-sensitive applications, prefer direct routing with good classification over cascading [4].

- **Long context pricing trap** — Requests exceeding 200K input tokens trigger premium pricing: Opus input jumps to $10/MTok, Sonnet to $6/MTok [2]. If your routing logic does not account for context length, you may route a seemingly simple query to Sonnet only to hit 2x pricing because of context size.

- **Extended thinking token accounting** — Extended thinking tokens are billed as output tokens at standard rates [1][2]. When enabling extended thinking (minimum 1,024 tokens), factor this into cost calculations. A "cheap" Haiku request with extended thinking can exceed a standard Sonnet request.

- **Fast mode sticker shock** — Opus 4.6 fast mode costs 6x standard rates ($30/$150 per MTok) [2]. Only use fast mode for latency-critical Opus tasks where the speed improvement justifies the premium.

- **Tool use token overhead** — Each tool use call adds 313-346 tokens to input regardless of model [2]. High-frequency tool use can inflate costs unexpectedly if not accounted for in routing calculations.

- **Confusing model capabilities with model names** — Not all tasks labeled "complex" need Opus. Sonnet 4.6 is described as offering "Opus-level intelligence at Sonnet pricing" and handles 90%+ of coding tasks without compromise [1]. Benchmark your specific use cases rather than routing by keyword assumptions.

- **Regional endpoint pricing on cloud platforms** — AWS Bedrock and Google Vertex AI charge a 10% premium for regional endpoints versus global endpoints for Claude 4.5+ models [2]. If your routing infrastructure uses regional endpoints for compliance, factor this into cost modeling.

## Sources

[1] **Anthropic Claude API Pricing 2026: Opus 4.6, Sonnet 4.6, Haiku**
    URL: https://devtk.ai/en/blog/claude-api-pricing-guide-2026/
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: 70/20/10 model split strategy, cascading tier approach, smart escalation patterns, cost reduction percentages, extended thinking billing model, Sonnet 4.6 developer preference statistics

[2] **Pricing - Claude API Docs (Official)**
    URL: https://platform.claude.com/docs/en/about-claude/pricing
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Complete model pricing tables, batch API discounts (50%), prompt caching multipliers, long context pricing thresholds, fast mode pricing (6x), tool use token overhead, regional endpoint premiums

[3] **Models overview - Claude API Docs (Official)**
    URL: https://platform.claude.com/docs/en/about-claude/models/overview
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Model specifications (context windows, max output, latency), model IDs for API/Bedrock/Vertex, capability descriptions per tier, use case recommendations

[4] **LLM Model Routing Implementation Patterns (Multiple Sources)**
    URL: https://medium.com/google-cloud/a-developers-guide-to-model-routing-1f21ecc34d60
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Routing vs cascading distinction, 16x efficiency improvement from direct routing, three-tier architecture pattern, semantic routing implementation, LLM Mesh architecture concept, 88% cost reduction figure

[5] **Choosing the right model - Claude API Docs (Official)**
    URL: https://platform.claude.com/docs/en/about-claude/models/choosing-a-model
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Model selection matrix, two approaches (start cheap vs start capable), upgrade decision criteria, multi-agent architecture performance (90.2% improvement), fallback routing patterns
