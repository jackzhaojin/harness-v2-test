# Criteria Weighting

**Topic ID:** evaluation.rubrics.weighting
**Researched:** 2026-03-01T14:22:00Z

## Overview

Criteria weighting is the practice of assigning differential importance to evaluation dimensions when assessing AI model outputs. Not all criteria matter equally for every use case: a medical chatbot might weight safety at 40% while a creative writing assistant weights originality higher [1]. The fundamental challenge is balancing multiple quality dimensions into a single actionable score while ensuring critical requirements are never compromised.

Modern evaluation frameworks distinguish between two fundamental approaches: weighted scoring (where criteria contribute proportionally to a final score) and hard gates (where certain criteria must pass regardless of other scores) [3]. The most robust systems combine both: safety and compliance act as binary gates, while tone, helpfulness, and style receive weighted scores that allow nuanced trade-offs [5]. Understanding when to use each approach—and how to combine them—is essential for building reliable evaluation systems.

## Key Concepts

- **Weighted scoring model** — A method that assigns proportional importance to each criterion, multiplies scores by weights, and sums them to produce an aggregate score [3]. Weights typically sum to 1.0 (or 100%) for interpretability.

- **Hard gate (pass/fail)** — A binary filter where certain criteria must meet a minimum threshold or the entire evaluation fails, regardless of performance on other dimensions [3]. Safety is the classic gate criterion—no amount of accuracy compensates for unsafe content.

- **Threshold** — A configurable minimum score that determines success. If the combined weighted score exceeds the threshold, the test passes [5]. Common thresholds include 0.5 (50%) for general quality and higher values (0.8-0.9) for production systems.

- **Score capping** — When critical gates fail, the overall score is artificially limited. For example, a single major safety omission caps scores at 0.40 or below, preventing superficially high scores from masking dangerous failures [4].

- **Normalized scoring** — Converting different scale scores (1-5, binary, percentage) to a common 0-1 range before applying weights [1]. This ensures fair combination across heterogeneous criteria.

- **Grader types** — Three main approaches: code-based (fast, deterministic, lacks nuance), model-based (flexible, requires calibration), and human (gold standard, expensive) [2]. Each has different reliability characteristics for weighted evaluation.

## Technical Details

### Weight Distribution Patterns

A typical weighted rubric distributes importance based on use-case priorities [1][4]:

```
Accuracy/Relevance:     40-60%  (usually highest weight)
Safety/Compliance:      Gate or 20-30%
Task-specific criteria: 15-25%
Tone/Style:            10-15%
```

The Anthropic documentation recommends multidimensional evaluation with explicit thresholds [2]:

```python
# Example success criteria with weights
criteria = {
    "f1_score": {"target": 0.85, "weight": 0.4},
    "non_toxic_rate": {"target": 0.995, "weight": 0.3, "is_gate": True},
    "response_time_ms": {"target": 200, "weight": 0.15},
    "inconvenience_errors": {"target": 0.90, "weight": 0.15}
}
```

### Combining Gates with Weighted Scores

In Promptfoo and similar tools, the hybrid approach works as follows [5]:

```yaml
tests:
  - vars:
      query: "How do I reset my password?"
    assert:
      # Hard gate - must pass or entire test fails
      - type: not-contains
        value: "password123"
        weight: 0  # weight:0 with failure = auto-fail

      # Weighted criteria - contribute to aggregate score
      - type: llm-rubric
        value: "Response is helpful and complete"
        weight: 2.0

      - type: llm-rubric
        value: "Response maintains professional tone"
        weight: 1.0

    threshold: 0.7  # Combined weighted score must exceed 70%
```

### Safety-Critical Weighting (Medical/High-Risk Domains)

The CSEDB framework demonstrates weighted scoring for safety-critical applications [4]:

| Dimension | Weight | Score Mapping |
|-----------|--------|---------------|
| Coverage | 30% | How completely critical items are addressed |
| Critical Items | 30% | Specific must-mention safety points |
| Correctness | 20% | Factual accuracy of statements |
| Prioritization | 10% | Correct ordering of recommendations |
| Actionability | 10% | Practical usefulness of advice |

With hard caps: single major omission caps score at 0.40, multiple omissions cap at 0.20 [4].

### Confidence Thresholds for Human Review

When automated evaluation uncertainty is high, trigger human review [4]:

```
High confidence:    Score >= 90  → Proceed automatically
Medium confidence:  Score 70-89  → Optional review
Low confidence:     Score 40-69  → Requires human review
Very low:          Score < 40   → Automatic rejection + review
```

## Common Patterns

**Pattern 1: Safety as a Gate, Quality as Weighted**

The most common production pattern treats safety as binary pass/fail while quality dimensions receive proportional weights [3]:

```python
def evaluate_response(output, safety_check, quality_scores):
    # Hard gate - safety must pass
    if not safety_check(output):
        return {"pass": False, "score": 0, "reason": "Safety gate failed"}

    # Weighted quality scoring
    weighted_score = sum(
        score * weight
        for score, weight in quality_scores.items()
    )

    return {
        "pass": weighted_score >= threshold,
        "score": weighted_score
    }
```

**Pattern 2: Hierarchical Weights by Use Case**

Different applications require different weight distributions [1][2]:

| Application | Accuracy | Safety | Tone | Speed |
|-------------|----------|--------|------|-------|
| Medical chatbot | 30% | 40% (gate) | 15% | 15% |
| Customer support | 25% | 20% (gate) | 35% | 20% |
| Code assistant | 50% | 15% | 10% | 25% |

**Pattern 3: Adaptive vs. Static Rubrics**

Static rubrics apply fixed weights across all evaluations. Adaptive rubrics generate task-specific weights per input [1]. For agentic workloads with varied tasks, adaptive rubrics provide better signal but require more sophisticated infrastructure.

**Pattern 4: Partial Credit for Multi-Step Tasks**

For complex tasks with multiple components, build in partial credit rather than all-or-nothing scoring [2]:

```python
# Support agent that identifies problem correctly but fails refund
components = {
    "problem_identified": 0.4,   # Correct: +40%
    "solution_proposed": 0.3,    # Correct: +30%
    "refund_processed": 0.3      # Failed: +0%
}
# Total: 70% - meaningful progress vs. complete failure
```

## Gotchas

- **Averaging masks critical failures** — A response scoring 100% on helpfulness, 100% on tone, but 0% on safety would average to 67%—a "passing" grade despite being completely unacceptable. Always use safety as a gate, not a weighted component [3].

- **Weights must have documented rationale** — Weighted metrics need accompanying evidence explaining why each weight was chosen. Arbitrary weights undermine evaluation credibility and make it harder to diagnose issues when scores disagree with intuition [4].

- **Scale normalization is essential** — Combining a 1-5 scale criterion with a binary criterion without normalization produces meaningless results. Convert all scores to 0-1 before applying weights [1].

- **Different graders require different weights** — Code-based graders are deterministic but brittle; LLM-based graders are flexible but non-deterministic. A code-based exact-match assertion might deserve higher weight (more reliable signal) than an LLM rubric assessment [2][5].

- **Threshold selection is domain-specific** — A 0.7 threshold might be appropriate for customer support but dangerously low for medical applications. Base thresholds on industry benchmarks, not convenience [2].

- **Score capping prevents gaming** — Without hard caps, a system could score 95% overall while missing critical safety items. Implement caps that limit maximum scores when specific gates fail [4].

- **Weights of 0 have special semantics** — In some frameworks (like Promptfoo), `weight: 0` assertions automatically pass but still execute, allowing them to function as soft gates that don't affect the aggregate score [5].

- **Continuous scores beat binary for diagnostics** — A 4.75/5.0 score tells you "high quality with minor flaw" while pass/fail just says "pass." Use continuous scoring for improvement signal, binary gates for deployment decisions [3].

## Sources

[1] **Rubric Evaluation: A Comprehensive Framework for Generative AI Assessment**
    URL: https://encord.com/rubric-evaluation-generative-ai-assessment/
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Core rubric components (criteria, performance levels, weighting systems), weight normalization to 0-1 range, accuracy/relevance typically 60%+ of weight, static vs. adaptive rubrics

[2] **Define success criteria and build evaluations - Anthropic Claude Docs**
    URL: https://platform.claude.com/docs/en/test-and-evaluate/develop-tests
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: SMART criteria for success metrics, multidimensional evaluation dimensions (fidelity, consistency, relevance, tone, privacy), grading approaches (code-based, LLM-based, human), example code for various eval types, threshold specification examples

[3] **LLM Evaluation Criteria: How to Measure AI Quality - Paradime**
    URL: https://www.paradime.io/blog/llm-evaluation-criteria-how-to-measure-ai-quality
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Safety as gate not gradient, hybrid approach combining gates with weighted scores, continuous vs. binary scoring tradeoffs, weight distribution by use case

[4] **Evaluating Metrics for Safety with LLM-as-Judges (arXiv)**
    URL: https://arxiv.org/html/2512.15617v1
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Five-dimension weighting framework (Coverage 30%, Critical Items 30%, Correctness 20%, Prioritization 10%, Actionability 10%), score capping on gate failures, confidence thresholds for human review, requirement for documented weighting rationale

[5] **Assertions and Metrics - Promptfoo Documentation**
    URL: https://www.promptfoo.dev/docs/configuration/expected-outputs/
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Weighted assertions implementation, threshold property for pass/fail, assertion sets with grouped thresholds, weight:0 special case, custom scoring functions

[6] **Demystifying Evals for AI Agents - Anthropic Engineering**
    URL: https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Three grader types (code-based, model-based, human), scoring modes (weighted, binary, hybrid), partial credit for multi-component tasks, grader calibration requirements
