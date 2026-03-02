# Criteria Definition

**Topic ID:** evaluation.success-criteria.definition
**Researched:** 2026-03-01T14:32:00Z

## Overview

Defining success criteria is the foundational step in building reliable LLM-based applications. Without specific, measurable criteria, teams cannot objectively assess whether their AI system meets requirements or identify where improvements are needed. Anthropic's documentation emphasizes that "building a successful LLM-based application starts with clearly defining your success criteria and then designing evaluations to measure performance against them" [1].

Success criteria serve multiple purposes: they establish pass/fail thresholds for deployment decisions, enable consistent comparison across prompt versions or model configurations, and provide actionable signals for iterative improvement. The key insight is that criteria must be tailored to your specific use case—general benchmarks like MMLU rarely predict real-world performance in product contexts [2]. Most production applications require multidimensional evaluation across several criteria simultaneously, such as accuracy, latency, tone, and safety [1].

The challenge lies in converting fuzzy goals ("the model should be helpful") into rigorous, testable specifications. Even seemingly subjective qualities like safety, ethics, and empathy can be quantified when criteria are properly structured with explicit scales and rubrics [1][3].

## Key Concepts

- **Specific criteria** — Replace vague objectives with precise definitions. Instead of "good performance," specify "accurate sentiment classification with F1 score of at least 0.85" [1]. Ambiguous criteria lead to inconsistent evaluation and team disagreement about what constitutes success.

- **Measurable criteria** — Use quantitative metrics or well-defined qualitative scales. Quantitative metrics (F1, BLEU, latency) provide scalability and objectivity, while qualitative scales (Likert 1-5) capture nuance when consistently applied [1][3].

- **Achievable criteria** — Base targets on industry benchmarks, prior experiments, or expert knowledge. Setting unrealistic thresholds wastes evaluation effort and demoralizes teams. Know current frontier model capabilities before setting targets [1].

- **Relevant criteria** — Align criteria with application purpose and user needs. Citation accuracy is critical for medical apps but less important for casual chatbots [1]. Start from customer success goals—what delights or frustrates users [2].

- **Multidimensional evaluation** — Most use cases require assessment across multiple criteria: task fidelity, consistency, relevance, tone, privacy, context utilization, latency, and cost [1]. A single metric rarely captures full system quality.

- **Quantitative metrics** — Task-specific (F1, BLEU, perplexity), generic (accuracy, precision, recall), and operational (response time, uptime). Provide speed, scale, and reproducibility but may miss semantic nuance [1][3].

- **Qualitative scales** — Likert scales ("Rate coherence from 1 to 5"), expert rubrics, and human evaluation. Capture subjective qualities but require standardization for consistency [1][3].

- **Rubric design** — Each score level needs explicit definitions, bias-reduction clarifications, and concrete examples. Without proper rubrics, even LLM-based judges produce inconsistent results [4][5].

## Technical Details

### Quantitative Metric Categories

Anthropic's documentation identifies three quantitative metric categories [1]:

```
Task-specific metrics:
- F1 score (classification tasks)
- BLEU score (translation/generation)
- Perplexity (language modeling)
- ROUGE-L (summarization)

Generic metrics:
- Accuracy
- Precision
- Recall
- Exact match percentage

Operational metrics:
- Response time (ms)
- Uptime (%)
- Cost per request
- Tokens per second
```

### Qualitative Scale Design

A 1-5 scale is preferred over broader ranges (1-100) because humans struggle to apply fine-grained distinctions consistently [2][5]. Each level requires clear definition:

```
Example: Empathy Rating for Customer Service

5 - Perfectly empathetic: Acknowledges customer emotion explicitly,
    validates their experience, offers personalized support
4 - Mostly empathetic: Shows understanding but may miss nuance
3 - Neutral: Professional but emotionally flat
2 - Somewhat dismissive: Focuses on solution without acknowledging feeling
1 - Not empathetic: Ignores or contradicts customer emotional state
```

### Well-Defined vs. Poorly-Defined Criteria

From Anthropic's documentation, contrast good and bad criteria definitions [1]:

```
Safety Criteria:
BAD:  "Safe outputs"
GOOD: "Less than 0.1% of outputs out of 10,000 trials flagged
       for toxicity by our content filter"

Sentiment Analysis:
BAD:  "The model should classify sentiments well"
GOOD: "F1 score of at least 0.85 on a held-out test set of 10,000
       diverse Twitter posts, which is a 5% improvement over baseline"

Multidimensional (Sentiment):
GOOD: "On a held-out test set of 10,000 diverse Twitter posts:
       - F1 score >= 0.85
       - 99.5% of outputs are non-toxic
       - 90% of errors cause inconvenience, not egregious harm
       - 95% response time < 200ms"
```

### LLM-Based Grading Setup

When using LLM judges for qualitative evaluation, Anthropic recommends [1]:

```python
def build_grader_prompt(answer, rubric):
    return f"""Grade this answer based on the rubric:
    <rubric>{rubric}</rubric>
    <answer>{answer}</answer>
    Think through your reasoning in <thinking> tags,
    then output 'correct' or 'incorrect' in <result> tags."""
```

Key practices: use detailed rubrics, require empirical outputs (numbers or categories, not prose), encourage reasoning before scoring, and use a different model to evaluate than the one being evaluated [1].

## Common Patterns

**Pattern 1: Layered criteria by priority**
Define must-have criteria (safety, accuracy) with hard thresholds, then nice-to-have criteria (tone, creativity) with softer targets. A response failing any must-have criterion fails overall, regardless of other scores [1].

**Pattern 2: Automated grading cascade**
Start with code-based grading (fastest, most reliable) for objective criteria like format compliance. Escalate to LLM-based grading for semantic quality. Reserve human grading for high-stakes edge cases and calibration [1][4].

**Pattern 3: Golden dataset development**
Label an initial dataset (~100 samples) with trusted team members before outsourcing or using LLM judges. This creates ground truth for calibrating automated evaluators and reveals where initial rubrics fail [2][5].

**Pattern 4: Volume over perfection**
More test cases with slightly lower-signal automated grading beats fewer hand-graded examples. Scale enables statistical significance and edge case coverage [1].

**Pattern 5: Edge case specification**
Explicitly define how the model should handle irrelevant inputs, overly long content, ambiguous queries, and adversarial prompts. These edge cases often differentiate production-ready systems from demos [1].

## Gotchas

**Relying on BLEU/ROUGE for semantic quality** — Traditional NLP metrics measure token overlap, not meaning. Two semantically equivalent responses with different phrasing score poorly. Use semantic similarity (embeddings) or LLM judges for meaning-based evaluation [3][4].

**Skipping rubric development for LLM judges** — Simply asking an LLM to "grade this 1-10" produces inconsistent results. LLMs need explicit score-level definitions and examples to match human judgment [2][5].

**Confusing model benchmarks with product evaluation** — General benchmarks (MMLU, HellaSwag) test base model capabilities, not whether your product solves user tasks. Always evaluate the full system including prompts, retrieval, and guardrails [3][4].

**Binary scoring for subjective qualities** — A 0/1 score for "helpfulness" loses information. Use ordinal scales (1-5) for subjective dimensions to capture partial success and track marginal improvements [2][5].

**Fine-grained scales without calibration** — Off-the-shelf LLMs struggle with nuanced partial credit. They tend toward leniency on 5-way scales. Calibrate with human-labeled examples and consider starting with coarser scales [5].

**Static criteria for evolving systems** — Production models drift, user patterns change, and edge cases emerge. Review criteria quarterly and continuously sample production data for evaluation refinement [2].

**Single evaluator bias** — One LLM judge or human rater introduces systematic bias. Use multiple evaluators, aggregate scores (average/mode), and run inter-rater reliability checks for high-stakes criteria [3][4].

## Sources

[1] **Define success criteria and build evaluations - Claude API Docs**
    URL: https://platform.claude.com/docs/en/docs/build-with-claude/define-success
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: SMART criteria framework (Specific, Measurable, Achievable, Relevant), common success criteria categories (task fidelity, consistency, tone, privacy, latency, price), quantitative vs qualitative metric types, example code for evaluation methods (exact match, cosine similarity, ROUGE-L, Likert scale, binary classification, ordinal scale), grading method hierarchy, LLM grading best practices.

[2] **Defining the right evaluation criteria for your LLM project - Freeplay Blog**
    URL: https://freeplay.ai/blog/defining-the-right-evaluation-criteria-for-your-llm-project-a-practical-guide
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Custom evaluation over generic benchmarks, objective vs subjective metric distinction, 1-5 scale recommendation over broader ranges, golden dataset development process, iterative rubric refinement, avoiding traditional NLP metrics (ROUGE, BLEU) for semantic quality.

[3] **Qualitative vs Quantitative LLM Evaluation - Galileo**
    URL: https://galileo.ai/blog/qualitative-vs-quantitative-evaluation-llm
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: When to use quantitative vs qualitative evaluation, integration strategy combining both methods, practical examples of each (precision/F1 vs case study analysis), limitation of reducing complex behaviors to scalar values.

[4] **LLM Evaluation Metrics: The Ultimate Guide - Confident AI**
    URL: https://www.confident-ai.com/blog/llm-evaluation-metrics-everything-you-need-for-llm-evaluation
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Core quality metrics (coherence, diversity, perplexity), production metrics (accuracy, latency, scalability, reliability), agent-specific metrics (success rate, tool-use accuracy), LLM-as-judge methodology including G-Eval, human-in-the-loop evaluation importance, combining automated and human judgment.

[5] **LLM Evaluation: Grading Rubrics - Multiple Sources**
    URL: https://www.promptfoo.dev/docs/configuration/expected-outputs/model-graded/llm-rubric/
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Rubric design best practices (score-level descriptions, concrete examples, bias reduction), multi-dimensional rubrics, challenges with fine-grained scoring (LLMs struggle with 5-way nuance), few-shot learning for rubric calibration, tools (Promptfoo llm-rubric, G-Eval, Prometheus).
