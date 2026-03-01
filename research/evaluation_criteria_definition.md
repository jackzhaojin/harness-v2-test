# Defining Success Criteria

**Topic ID:** evaluation.criteria.definition
**Researched:** 2026-03-01T12:00:00Z

## Overview

Defining success criteria is the foundational step in evaluating AI systems, particularly large language models (LLMs) and AI agents. Success criteria transform vague goals like "the model should work well" into concrete, measurable targets that guide development, enable systematic testing, and build confidence for deployment. Without well-defined criteria, teams resort to "vibe-based evals"—subjective assessments that fail to catch regressions or compare model versions meaningfully.

The SMART framework (Specific, Measurable, Achievable, Relevant, Time-bound) provides a useful lens for crafting evaluation criteria. Rather than saying "the agent should handle calendar requests," SMART criteria specify exactly what "handle" means: successful event creation in under 2 seconds, with 95% accuracy, and appropriate confirmation tone. This specificity enables automated evaluation pipelines and consistent human review.

Success criteria must address multiple dimensions simultaneously. A customer support agent isn't successful merely by resolving tickets—it must do so within turn limits, maintain appropriate tone, protect sensitive information, and complete tasks efficiently. These dimensions often create trade-offs: optimizing for speed may compromise thoroughness. Effective criteria acknowledge these tensions and establish clear priorities.

## Key Concepts

- **Task Fidelity**: The degree to which model outputs faithfully complete the assigned task. Measured through task completion rate, functional correctness, and adherence to instructions. High fidelity means the output does what was asked.

- **Consistency**: The ability to produce similar, reliable outputs across multiple runs with the same input. Critical for customer-facing applications where deterministic behavior builds trust. Measured using pass^k (probability all k trials succeed) for strict requirements.

- **Relevance**: How well the output addresses the specific input or query. Answer relevancy evaluates whether responses are informative, concise, and on-topic. Context relevancy measures whether retrieved information (in RAG systems) contains necessary data without redundancy.

- **Tone and Style**: Qualitative aspects including clarity, empathy, formality, and helpfulness. Often evaluated through rubric-based scoring with LLM-as-judge approaches or human review. Conversational quality metrics include is-concise, is-polite, and is-helpful.

- **Privacy Compliance**: Ensuring outputs don't leak sensitive information and comply with regulations like GDPR or HIPAA. Requires explicit safety criteria with zero tolerance for failures.

- **Latency**: Response time from request to completion. Even correct answers lose value if they take too long. Must be measured end-to-end and set with realistic thresholds based on user expectations.

- **Faithfulness**: Factual consistency of generated content against source context. Penalizes claims that cannot be deduced from provided information—critical for RAG systems and any application where hallucination is unacceptable.

- **Pass@k vs Pass^k**: Two metrics for measuring reliability. Pass@k captures the likelihood of at least one success in k attempts (appropriate for exploratory tools). Pass^k measures probability that all attempts succeed (required for production reliability).

## Technical Details

### Scoring Methodologies

**LLM-as-Judge**: Uses an LLM to evaluate another LLM's output. Common approaches include:

```
G-Eval: Chain-of-thought generation before scoring
- Generates evaluation steps first
- Applies steps to produce final score
- Balances flexibility with interpretability

QAG (Question-Answer Generation):
- Constrains evaluator to yes/no answers
- More reliable than direct numerical scoring
- Combines LLM reasoning with deterministic evaluation
```

**Rubric-Based Scoring**: Likert-style scoring (typically 0-5) against custom rubrics:

```
Score 5: Response fully addresses query, factually accurate, appropriate tone
Score 4: Response addresses query with minor omissions, accurate
Score 3: Response partially addresses query, may contain minor inaccuracies
Score 2: Response tangentially related, significant issues
Score 1: Response fails to address query or contains major errors
Score 0: Response harmful, completely wrong, or violates safety criteria
```

### Multi-Grader Architecture

Complex evaluations combine multiple graders:

```yaml
evaluation_config:
  graders:
    - name: correctness
      type: functional_test
      weight: 0.4
    - name: tone_check
      type: llm_rubric
      weight: 0.2
    - name: latency
      type: threshold
      max_ms: 2000
      weight: 0.2
    - name: safety
      type: binary
      required: true  # Must pass regardless of score

  scoring_mode: weighted  # or: binary (all must pass), hybrid
  minimum_threshold: 0.75
```

### RAG-Specific Metrics

For retrieval-augmented generation systems:

| Metric | Measures | Inputs |
|--------|----------|--------|
| Faithfulness | Factual consistency vs context | answer, context |
| Answer Relevancy | Response appropriateness | question, answer |
| Context Relevancy | Retrieval quality | question, context |
| Context Recall | Retrieval completeness | ground truth, context |

## Common Patterns

### The Five Dimension Framework

Prioritize criteria in this order for most AI agents:

1. **Safety** (absolute requirement—no negotiation)
2. **Correctness** (fundamental value proposition)
3. **Reliability** (production-grade consistency)
4. **Efficiency** (latency and resource usage)
5. **User Experience** (tone, clarity, helpfulness)

### Capability vs Regression Evals

Maintain two distinct evaluation suites:

- **Capability evals**: Test new features with initially low pass rates. Target tasks the agent struggles with. Success indicates readiness for deployment.
- **Regression evals**: Should maintain ~100% pass rate. Tests proven capabilities. Failures indicate breaking changes.

### Balanced Test Design

Always test both positive and negative cases:

```python
# Positive: Should complete the action
test_cases.append({
    "input": "Schedule a meeting with Bob tomorrow at 2pm",
    "expected": "calendar_create",
    "success_criteria": ["event_created", "correct_time", "correct_attendee"]
})

# Negative: Should refuse appropriately
test_cases.append({
    "input": "Delete all my contacts",
    "expected": "refusal",
    "success_criteria": ["polite_decline", "no_data_deleted", "alternative_offered"]
})
```

### The 5-Metric Rule

Start with 2-3 metrics covering critical dimensions. For most systems:

1. 1-2 custom metrics (G-Eval or DAG) for domain-specific quality
2. 2-3 generic metrics for common requirements (relevance, safety, latency)

Avoid tracking metrics you won't act on—more metrics means higher evaluation costs and interpretation complexity.

## Gotchas

- **Vague criteria doom evaluations**: "The agent should be helpful" is not a success criterion. Define exactly what helpful means: completes task, responds in <3 turns, includes specific information fields.

- **LLM evaluators aren't deterministic**: G-Eval and similar methods can produce different scores for the same input across runs. Use multiple evaluation passes and aggregate scores for important decisions.

- **BLEU/ROUGE mislead for semantic tasks**: Traditional n-gram metrics lack semantic understanding. They're useful for translation/summarization benchmarks but inappropriate for evaluating conversational quality or factual accuracy.

- **Positional bias in LLM judges**: When comparing two outputs, LLM evaluators often prefer whichever appears first. Mitigate by randomizing order or using balanced position calibration.

- **Human eval remains gold standard for subjective criteria**: Automated metrics can approximate tone and style assessment, but only humans can fully evaluate context relevance, creativity, and nuanced appropriateness.

- **Conflicting information between sources**: Microsoft documentation emphasizes reference-based metrics (BLEU, ROUGE) while practitioner guides (Confident AI, Anthropic) favor LLM-as-judge approaches. The consensus is that LLM-based evaluation offers better correlation with human judgment for generative tasks, while traditional metrics remain valuable for specific benchmarks.

- **Threshold setting is iterative**: Initial thresholds (e.g., "90% correctness required") are educated guesses. Treat them as living documents refined through testing and production feedback.

- **Over-optimization risks**: Agents optimized purely for completion rate may develop inappropriate behaviors. Balanced criteria with positive and negative test cases prevent gaming.

## Sources

- [Demystifying Evals for AI Agents - Anthropic](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents) — Comprehensive framework for defining success criteria, multi-grader architectures, and pass@k vs pass^k metrics
- [LLM Evaluation Metrics - Confident AI](https://www.confident-ai.com/blog/llm-evaluation-metrics-everything-you-need-for-llm-evaluation) — Detailed coverage of LLM-as-judge approaches, QAG methodology, and the 5-metric rule
- [Evaluation Metrics - Microsoft Learn](https://learn.microsoft.com/en-us/ai/playbook/technology-guidance/generative-ai/working-with-llms/evaluation/list-of-eval-metrics) — Comprehensive taxonomy of evaluation metrics including reference-based, reference-free, and RAG-specific metrics
- [Setting Goals and Success Criteria - Michael Brenndoerfer](https://mbrenndoerfer.com/writing/setting-goals-and-success-criteria-ai-agent-evaluation) — Five-dimension framework and prioritization guidance for AI agent evaluation
- [LLM Evaluation Metrics Guide - Braintrust](https://www.braintrust.dev/articles/llm-evaluation-metrics-guide) — Practical implementation patterns for consistency and fidelity metrics
