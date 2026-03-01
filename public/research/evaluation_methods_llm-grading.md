# LLM-Based Grading

**Topic ID:** evaluation.methods.llm-grading
**Researched:** 2026-03-01T12:00:00Z

## Overview

LLM-based grading (often called "LLM-as-a-Judge") is an evaluation methodology where a capable language model assesses the quality of outputs from another LLM application. This approach fills a critical gap between code-based grading (fast but limited to exact matches) and human grading (nuanced but slow and expensive). By leveraging Claude or similar models as evaluators, teams can achieve human-like judgment at machine scale.

The technique works by presenting the judge model with the original input, the generated response, and a scoring rubric that defines quality standards. The judge then produces a score along with reasoning explaining its assessment. According to Anthropic's documentation, LLM-based grading is "fast and flexible, scalable and suitable for complex judgement"—making it ideal for evaluating open-ended responses, creative outputs, and nuanced quality dimensions that resist simple string matching.

LLM-based grading has become essential for production AI systems because it enables continuous evaluation at scale. Research shows LLM-as-a-Judge evaluations can achieve over 80% agreement with human preferences in pairwise comparisons, and Pearson correlation coefficients up to 0.85 versus humans in extractive QA tasks—substantially outperforming traditional exact match metrics (0.17) and F1 scores (0.36).

## Key Concepts

- **Judge Model**: The LLM that performs evaluation. Best practice is to use a different (often more capable) model than the one being evaluated to avoid self-preference bias.

- **Rubric**: A detailed description of evaluation criteria with explicit score definitions. Rubrics should be specific enough that the evaluator can make consistent decisions (e.g., "Score 1 if factually incorrect, 5 if fully accurate and well-sourced").

- **Scoring Scales**: Common approaches include binary classification (correct/incorrect), Likert scales (1-5 ratings), and ordinal scales with defined anchor points.

- **Chain-of-Thought Reasoning**: Instructing the judge to explain its reasoning before providing a score. This increases evaluation quality, particularly for complex judgments.

- **Pairwise Comparison**: Having the judge select the better response between two options rather than scoring individually. Often more reliable than absolute scoring.

- **Reference-Based Evaluation**: Providing a "golden answer" or ground truth for the judge to compare against, improving scoring consistency.

- **Criteria Decomposition**: Evaluating one dimension at a time (relevance, clarity, accuracy) rather than asking for a holistic score. Single-objective tasks produce more consistent results.

## Technical Details

### Basic Implementation Pattern

The core implementation follows this structure:

```python
import anthropic
import re

client = anthropic.Anthropic()

def build_grader_prompt(answer, rubric):
    return f"""You will be provided an answer that an assistant gave to a question,
    and a rubric that instructs you on what makes the answer correct or incorrect.

    Here is the answer: <answer>{answer}</answer>

    Here is the rubric: <rubric>{rubric}</rubric>

    First, think through whether the answer is correct based on the rubric inside <thinking></thinking> tags.
    Then, output either 'correct' or 'incorrect' inside <correctness></correctness> tags."""

def grade_completion(output, golden_answer):
    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=2048,
        messages=[{"role": "user", "content": build_grader_prompt(output, golden_answer)}]
    )
    pattern = r"<correctness>(.*?)</correctness>"
    match = re.search(pattern, response.content[0].text, re.DOTALL)
    return match.group(1).strip() if match else None
```

### Likert Scale Evaluation

For nuanced assessments like tone or quality:

```python
def evaluate_likert(model_output, target_criterion):
    prompt = f"""Rate this response on a scale of 1-5 for {target_criterion}:
    <response>{model_output}</response>

    1: Not at all {target_criterion}
    2: Slightly {target_criterion}
    3: Moderately {target_criterion}
    4: Very {target_criterion}
    5: Perfectly {target_criterion}

    First explain your reasoning, then output only the number."""

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=500,
        messages=[{"role": "user", "content": prompt}]
    )
    return int(response.content[0].text.strip()[-1])
```

### Binary Classification

For clear-cut assessments:

```python
def evaluate_binary(model_output, criterion_prompt):
    prompt = f"""{criterion_prompt}

    <response>{model_output}</response>

    Think through your assessment, then output only 'yes' or 'no'."""

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=200,
        messages=[{"role": "user", "content": prompt}]
    )
    return response.content[0].text.strip().lower() == "yes"
```

### Key Parameters

- **Temperature**: Set to 0 for maximum consistency across evaluations
- **Max tokens**: Sufficient for reasoning + score (typically 200-500 for simple evals, 1000+ for complex)
- **Structured output**: Use XML tags or JSON to reliably parse scores from responses

## Common Patterns

### Pattern 1: Multi-Criteria Evaluation

Evaluate each dimension separately rather than asking for one holistic score:

```python
criteria = ["accuracy", "completeness", "clarity", "relevance"]
scores = {}
for criterion in criteria:
    scores[criterion] = evaluate_likert(output, criterion)
overall_score = sum(scores.values()) / len(scores)
```

### Pattern 2: Explanation-First Scoring

Research shows explanation-first ordering improves alignment with human judgment:

```python
prompt = """Evaluate this response for factual accuracy.

First, analyze the claims made in the response.
Second, identify any factual errors or unsupported claims.
Third, provide your assessment.

Finally, output a score from 1-5 where:
1 = Multiple factual errors
5 = Completely accurate"""
```

### Pattern 3: Reference-Based Grading

When you have a golden answer:

```python
rubric = """A correct answer should:
- Mention the key concept X
- Avoid claiming capability Y (which the system lacks)
- Be no longer than 2 sentences

Grade as 'correct' if all criteria met, 'incorrect' otherwise."""
```

### Pattern 4: Production Monitoring

For ongoing quality assurance, sample and evaluate a percentage of production traffic:

```python
import random

def should_evaluate(sample_rate=0.1):
    return random.random() < sample_rate

if should_evaluate():
    score = evaluate_likert(response, "helpfulness")
    log_evaluation(trace_id, score)
```

## Gotchas

1. **Position Bias**: In pairwise comparisons, LLMs may favor responses based on presentation order. Swapping order can shift accuracy by 10%+. Mitigate by randomizing order or running both orderings.

2. **Verbosity Bias**: LLM judges often prefer longer, more verbose responses regardless of actual quality. Counter this by explicitly instructing the judge to penalize unnecessary length.

3. **Self-Preference Bias**: An LLM evaluating its own outputs may assign higher scores due to familiarity. Always use a different model as judge, or at minimum, a different prompt configuration.

4. **Overly Complex Scales**: Research shows Likert scales with too many points (7+) reduce reliability. Stick to binary, 3-point, or 5-point scales with clearly defined anchors.

5. **Generic CoT Phrases**: Simply adding "think step by step" provides minimal value. Instead, specify the actual reasoning steps you want the judge to perform.

6. **Missing Rubric Details**: Vague criteria like "good quality" produce inconsistent results. Define exactly what each score level means with concrete examples.

7. **Expert Domain Gaps**: In specialized domains (medical, legal), LLM judge agreement with human experts drops to 60-68%. Use hybrid human-LLM workflows for high-stakes evaluations.

8. **Reasoning Model Redundancy**: When using models with built-in reasoning (extended thinking), explicit CoT prompts become redundant and add cost without improving quality.

9. **Cost Considerations**: Reasoning models cost 3-20x more than base models. For high-volume evaluation, balance accuracy needs against cost constraints.

10. **Conflicting Sources**: Some research suggests fine-grained scales (4+ points) outperform binary scoring, while other studies find binary more reliable. Test both approaches on your specific use case before committing.

## Sources

- [Anthropic - Define success criteria and build evaluations](https://platform.claude.com/docs/en/test-and-evaluate/develop-tests) — Official Claude documentation on LLM-based grading, rubrics, Likert scales, and code examples
- [Anthropic Claude Cookbooks - Building Evals](https://github.com/anthropics/anthropic-cookbook/blob/main/misc/building_evals.ipynb) — Implementation examples for code-based, human, and model-based grading
- [Evidently AI - LLM-as-a-Judge Complete Guide](https://www.evidentlyai.com/llm-guide/llm-as-a-judge) — Comprehensive guide on evaluation types, scoring methods, and prompt engineering best practices
- [Arize AI - Evidence-Based Prompting Strategies for LLM-as-a-Judge](https://arize.com/blog/evidence-based-prompting-strategies-for-llm-as-a-judge-explanations-and-chain-of-thought/) — Research findings on chain-of-thought, explanation ordering, and reasoning model tradeoffs
- [Langfuse - LLM-as-a-Judge Evaluation](https://langfuse.com/docs/evaluation/evaluation-methods/llm-as-a-judge) — Implementation patterns for production evaluation systems
- [Cameron R. Wolfe - LLM-as-a-Judge](https://cameronrwolfe.substack.com/p/llm-as-a-judge) — Technical deep dive on scoring approaches and bias mitigation
