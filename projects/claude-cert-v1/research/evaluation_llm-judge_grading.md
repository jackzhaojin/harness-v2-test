# Model-Based Grading

**Topic ID:** evaluation.llm-judge.grading
**Researched:** 2026-03-01T00:00:00Z

## Overview

Model-based grading uses Claude as an automated evaluator to assess outputs from LLM applications by comparing them against rubrics, golden answers, or quality criteria. This approach sits between fast-but-rigid code-based grading and high-quality-but-expensive human grading, offering scalability with nuanced judgment capabilities [1]. The technique is also known as "LLM-as-a-judge" or "autorater" in the broader AI evaluation ecosystem [3].

Setting up Claude as an automated grader requires four components: the input prompt that was given to the model being evaluated, the model's output, a golden answer or rubric for comparison, and a scoring mechanism that produces the final grade [2]. Golden answers can be exact matches for verification or exemplary responses that provide graders a quality reference point [1]. Anthropic recommends testing model-based grading on a sample before scaling, as reliability varies by task complexity [1].

Claude Opus 4.1 achieves a 0.86 Spearman correlation with human evaluators, making it the most calibrated judge model in Anthropic's ecosystem [4]. Claude Sonnet 4 excels at consistency, producing nearly identical scores across repeated evaluations of the same transcript [4]. These characteristics make model-based grading viable for production systems where human review would be prohibitively expensive.

## Key Concepts

- **Golden Answer** — A reference answer used for comparison during grading. Can be an exact string to match or an exemplary response demonstrating expected quality. Writing golden answers is a one-time cost that rarely needs revision [1].

- **Grading Rubric** — Explicit criteria defining what constitutes correct or high-quality output. Rubrics should be detailed and specific, such as "the answer should always mention 'Acme Inc.' in the first sentence" [1]. Research shows question-specific rubrics yield more accurate evaluations than generic rubrics [5].

- **Chain-of-Thought Reasoning** — Prompting the judge model to explain its reasoning step-by-step before producing a final score. This improves reliability by 10-15% and provides debuggable reasoning trails [3]. Anthropic recommends discarding the reasoning after scoring to keep outputs clean [1].

- **Binary Classification** — The simplest grading approach where outputs are marked "correct" or "incorrect." More reliable than fine-grained scales because it reduces ambiguity [3]. Ideal for factual accuracy checks [1].

- **Likert Scale Grading** — Rating outputs on a numeric scale (typically 1-5). Used for subjective qualities like tone, coherence, or context utilization [1]. Best combined with clear anchor descriptions for each score level [3].

- **Pairwise Comparison** — Comparing two outputs to determine which is better, rather than scoring each independently. Effective for A/B testing prompts or models and works well even with subjective criteria [3].

- **Judge Model Calibration** — The degree to which automated scores align with human evaluations. Validated by comparing judge outputs against human-labeled test sets [4].

- **Evaluation Consistency** — How stable scores remain when the same input is evaluated multiple times. High consistency indicates reliable grading; Claude Sonnet 4 demonstrates near-perfect consistency [4].

## Technical Details

### Grading Method Hierarchy

Anthropic recommends choosing the fastest, most reliable, scalable method that meets your needs [1]:

| Method | Speed | Reliability | Flexibility | When to Use |
|--------|-------|-------------|-------------|-------------|
| Code-based | Fastest | Highest | Rigid | Exact match, regex, structured outputs |
| LLM-based | Fast | High (test first) | High | Complex judgment, subjective criteria |
| Human | Slowest | Highest | Highest | Final validation, edge cases |

### LLM-Based Grading Implementation

The standard pattern uses a grader prompt with structured output [1][2]:

```python
import anthropic

client = anthropic.Anthropic()

def build_grader_prompt(answer, rubric):
    return f"""Grade this answer based on the rubric:
    <rubric>{rubric}</rubric>
    <answer>{answer}</answer>
    Think through your reasoning in <thinking> tags, then output 'correct' or 'incorrect' in <result> tags."""

def grade_completion(output, golden_answer):
    grader_response = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=2048,
        messages=[
            {"role": "user", "content": build_grader_prompt(output, golden_answer)}
        ],
    ).content[0].text

    return "correct" if "correct" in grader_response.lower() else "incorrect"
```

### Likert Scale Grading for Subjective Criteria

For qualities like tone or empathy, use ordinal scales with explicit definitions [1]:

```python
def evaluate_likert(model_output, target_tone):
    tone_prompt = f"""Rate this customer service response on a scale of 1-5 for being {target_tone}:
    <response>{model_output}</response>
    1: Not at all {target_tone}
    5: Perfectly {target_tone}
    Output only the number."""

    response = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=50,
        messages=[{"role": "user", "content": tone_prompt}],
    )
    return int(response.content[0].text.strip())
```

### Binary Classification for Privacy/Safety

Use explicit definitions in the grading prompt to catch subtle violations [1]:

```python
def evaluate_binary(model_output, query_contains_phi):
    if not query_contains_phi:
        return True

    binary_prompt = f"""Does this response contain or reference any Personal Health Information (PHI)?
    PHI includes: Names, addresses, birthdates, Social Security numbers, medical record numbers,
    diagnoses, treatment plans, test results, medication records, insurance details.

    <response>{model_output}</response>
    Output only 'yes' or 'no'."""

    response = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=50,
        messages=[{"role": "user", "content": binary_prompt}],
    )
    return response.content[0].text.strip().lower() == "no"
```

### Additive Scoring for Multi-Criteria Evaluation

When multiple criteria matter, score each atomically and sum [3]:

```python
def additive_score(model_output, question):
    prompt = f"""Score this answer on each criterion (0 or 1 point each):
    - Related to the question: 1 point if answer addresses the question
    - Clear and precise: 1 point if explanation is easy to follow
    - Factually accurate: 1 point if claims are correct
    - Provides resources: 1 point if additional references are included

    <question>{question}</question>
    <answer>{model_output}</answer>

    Output JSON: {{"related": 0|1, "clear": 0|1, "accurate": 0|1, "resources": 0|1, "total": N}}"""
    # Parse response...
```

## Common Patterns

### Evaluation Pipeline Structure

A complete evaluation workflow follows this pattern [1][2]:

1. Define test cases with inputs and golden answers
2. Run the model being evaluated on all inputs
3. Pass each (output, golden_answer) pair to the grader
4. Aggregate scores and calculate metrics
5. Iterate on prompts based on failure analysis

```python
eval_data = [
    {"question": "What is the capital of France?", "golden_answer": "Paris"},
    {"question": "Is 42 the answer to life?", "golden_answer": "Yes, per Hitchhiker's Guide"},
]

outputs = [get_completion(q["question"]) for q in eval_data]
grades = [grade_completion(output, q["golden_answer"]) for output, q in zip(outputs, eval_data)]
accuracy = grades.count("correct") / len(grades)
print(f"Score: {accuracy * 100}%")
```

### Using the Claude Console Evaluation Tool

The Console provides a GUI-based evaluation workflow [6]:

1. Create a prompt with `{{variable}}` syntax for dynamic inputs
2. Navigate to the "Evaluate" tab
3. Add test cases manually, generate them with Claude, or import from CSV
4. Run evaluations and grade on a 5-point scale
5. Compare prompt versions side-by-side
6. Iterate based on results

### Production Monitoring with LLM-as-a-Judge

For live systems, run evaluations on sampled outputs [3]:

- Target individual operations (LLM calls, retrievals) rather than full traces
- Cost per evaluation: $0.01-0.10 depending on judge model and output length
- Use sampling to control costs while maintaining coverage
- Periodically validate automated grades against human review

### Mitigating Judge Biases

Known biases require specific countermeasures [3]:

- **Position bias** (40% inconsistency in GPT-4): Run evaluations with both orderings (A,B) and (B,A); only count consistent results
- **Verbosity bias** (~15% score inflation): Use 1-4 scales and explicitly reward conciseness in rubrics
- **Self-preference**: Use a different model as judge than the model being evaluated [1]

## Gotchas

- **Using the same model to grade itself**: Anthropic recommends using a different model for grading than the model that generated the output being graded. Self-evaluation can introduce bias [1].

- **Overly fine-grained scales**: Binary or 3-point scales are more reliable than 10-point scales. LLMs generate text naturally and are not calibrated for precision scoring like "73 vs 82" [3]. Prefer simpler scales.

- **Generic rubrics vs. question-specific rubrics**: Research shows question-specific rubrics yield significantly more accurate evaluations than generic criteria. Invest time in tailored rubrics [5].

- **Skipping chain-of-thought**: Always prompt the grader to reason before scoring, even if you discard the reasoning. This improves accuracy by 10-15% [3][1].

- **Claude Opus 4.1 vs. Sonnet 4 as judge**: Opus 4.1 has the highest human correlation (0.86), but Sonnet 4 has better consistency across repeated evaluations. Choose based on whether accuracy or stability matters more for your use case [4].

- **High refusal rates from Claude judges**: In safety evaluations, Claude models show refusal rates up to 70% when uncertain, which is good for accuracy but may reduce coverage. Account for this in evaluation design [4].

- **Volume over quality trade-off**: Anthropic explicitly recommends more questions with slightly lower-quality automated grading over fewer questions with expensive human grading. Do not over-invest in perfect rubrics at the expense of coverage [1].

- **Forgetting to validate the judge**: Before scaling, create a test set with known good/bad examples, run evaluations multiple times at low temperature, and verify consistency >95% and human agreement >85% [3].

## Sources

[1] **Define success criteria and build evaluations - Claude API Docs**
    URL: https://platform.claude.com/docs/en/test-and-evaluate/develop-tests
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Core framework for LLM-based grading, three grading methods hierarchy, code examples for Likert scale, binary classification, and ordinal grading, best practices for rubrics and chain-of-thought reasoning, golden answer definitions.

[2] **Building Evaluations with Claude - Anthropic Cookbook**
    URL: https://github.com/anthropics/anthropic-cookbook/blob/main/misc/building_evals.ipynb
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Four-part evaluation structure (input, output, golden answer, score), grader prompt patterns with XML tags, implementation code for model-based grading, best practice on volume over quality.

[3] **LLM-as-a-Judge Evaluation Guide - Langfuse**
    URL: https://langfuse.com/docs/evaluation/evaluation-methods/llm-as-a-judge
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Core concept definition, scoring rubric design, model selection criteria (80-90% human agreement), cost estimates ($0.01-0.10), bias mitigation strategies, chain-of-thought improvement percentages, scale simplicity recommendations.

[4] **Bloom: Open Source Tool for Automated Behavioral Evaluations - Anthropic**
    URL: https://alignment.anthropic.com/2025/bloom-auto-evals/
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Claude Opus 4.1 Spearman correlation (0.86), Claude Sonnet 4 consistency characteristics, GPT-5 variance comparison, calibration methodology with bucketed scoring, benchmark release for behavioral evaluations.

[5] **Rubric Is All You Need: Enhancing LLM-based Code Evaluation**
    URL: https://arxiv.org/html/2503.23989v1
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Research findings on question-specific vs. generic rubrics, pointwise rubric evaluation approach, use of Claude 3.7 Sonnet for code grading.

[6] **Using the Evaluation Tool - Claude Docs**
    URL: https://platform.claude.com/docs/en/test-and-evaluate/eval-tool
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Claude Console evaluation features, test case generation, side-by-side comparison, 5-point quality grading scale, prompt versioning workflow.
