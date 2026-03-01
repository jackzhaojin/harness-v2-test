# Combined Research: Evaluation and Testing


---

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


---

# Automated Evaluation

**Topic ID:** evaluation.methods.automated
**Researched:** 2026-03-01T12:00:00Z

## Overview

Automated evaluation refers to code-based grading methods that assess LLM outputs without human intervention. These methods use deterministic algorithms to compare generated text against reference answers using techniques like exact match, string matching, and statistical metrics such as ROUGE-L and F1 scores. Unlike human evaluation (slow, expensive) or LLM-as-judge approaches (flexible but non-deterministic), automated metrics are fast, reproducible, and highly scalable.

Automated evaluation emerged from traditional NLP tasks like machine translation and text summarization, where metrics like BLEU and ROUGE became standard. In modern LLM evaluation, these metrics serve as baseline measurements and work best for tasks with clear-cut, categorical answers. They form the foundation of evaluation pipelines, with more sophisticated methods (semantic similarity, LLM grading) layered on top when simple metrics prove insufficient.

The key limitation of automated metrics is their inability to capture semantic meaning. A response that conveys the correct information with different wording may score poorly on exact match but perfectly on human evaluation. This makes automated metrics most valuable for structured outputs, classification tasks, and as regression tests rather than sole quality measures.

## Key Concepts

- **Exact Match (EM)**: Returns 1 if the generated output matches the reference text character-for-character, 0 otherwise. Used in extractive QA where precise answers are expected. "Paris" matches "Paris" but not "The capital is Paris."

- **String Presence**: Checks whether the response contains a specific reference substring. Returns 1 if present, 0 if absent. Useful for verifying that certain keywords or required phrases appear in outputs.

- **ROUGE (Recall-Oriented Understudy for Gisting Evaluation)**: A family of metrics measuring n-gram overlap between generated and reference text. Primarily used for summarization tasks. Scores range from 0 to 1.

- **ROUGE-L**: Measures the longest common subsequence (LCS) between candidate and reference text. Captures word order importance that unigram metrics miss. If candidate is "The cat on the floor sits" and reference is "The cat sits on the floor," ROUGE-L detects the ordering difference.

- **F1 Score**: The harmonic mean of precision and recall, balancing both metrics. Formula: `F1 = 2 * (Precision * Recall) / (Precision + Recall)`. Prevents gaming by optimizing only one measure.

- **BLEU (BiLingual Evaluation Understudy)**: Calculates n-gram precision with a brevity penalty. Originally designed for machine translation. Emphasizes precision (how much of the output appears in reference).

- **Levenshtein Distance**: Measures the minimum number of single-character edits (insertions, deletions, substitutions) to transform one string into another. Useful for fuzzy matching and spelling correction evaluation.

- **Functional Correctness**: For code generation tasks, executes the generated code against test cases to verify outputs match expected results. Pass/fail based on whether all test cases succeed.

## Technical Details

### ROUGE Score Calculation

ROUGE calculates precision, recall, and F1 for n-gram overlap:

```python
# ROUGE-1 (unigram) calculation
reference = "The cat sits on the mat"
candidate = "The cat is on the mat"

ref_unigrams = set(reference.lower().split())  # {the, cat, sits, on, mat}
cand_unigrams = set(candidate.lower().split())  # {the, cat, is, on, mat}

overlap = ref_unigrams & cand_unigrams  # {the, cat, on, mat}

precision = len(overlap) / len(cand_unigrams)  # 4/6 = 0.67
recall = len(overlap) / len(ref_unigrams)      # 4/6 = 0.67
f1 = 2 * precision * recall / (precision + recall)  # 0.67
```

ROUGE-L uses longest common subsequence:

```python
from rouge import Rouge

rouge = Rouge()
scores = rouge.get_scores(candidate, reference)
rouge_l_f1 = scores[0]["rouge-l"]["f"]  # F1 score
```

### Exact Match Implementation

```python
def evaluate_exact_match(model_output: str, correct_answer: str) -> int:
    """Returns 1 for exact match, 0 otherwise."""
    return int(model_output.strip().lower() == correct_answer.strip().lower())

# Batch evaluation
outputs = ["Paris", "The capital is Paris", "paris"]
answers = ["Paris", "Paris", "Paris"]
accuracy = sum(evaluate_exact_match(o, a) for o, a in zip(outputs, answers)) / len(outputs)
# Result: 0.67 (only first and third match after normalization)
```

### F1 Token-Level Scoring

For QA tasks, F1 can be calculated at the token level:

```python
def token_f1(prediction: str, reference: str) -> float:
    pred_tokens = set(prediction.lower().split())
    ref_tokens = set(reference.lower().split())

    if not pred_tokens or not ref_tokens:
        return 0.0

    common = pred_tokens & ref_tokens
    precision = len(common) / len(pred_tokens)
    recall = len(common) / len(ref_tokens)

    if precision + recall == 0:
        return 0.0
    return 2 * precision * recall / (precision + recall)
```

### Code Functional Correctness

```python
def evaluate_code_generation(generated_code: str, test_cases: list) -> dict:
    """
    Execute generated code against test cases.
    Returns pass rate and individual results.
    """
    results = []
    for test in test_cases:
        try:
            exec_globals = {}
            exec(generated_code, exec_globals)
            func = exec_globals[test["function_name"]]
            actual = func(*test["inputs"])
            passed = actual == test["expected"]
            results.append({"passed": passed, "actual": actual})
        except Exception as e:
            results.append({"passed": False, "error": str(e)})

    pass_rate = sum(r["passed"] for r in results) / len(results)
    return {"pass_rate": pass_rate, "results": results}
```

## Common Patterns

### Baseline Establishment Pattern

Start with exact match and string distance to establish performance baselines before adding complexity:

```python
def evaluate_pipeline(outputs, references):
    metrics = {
        "exact_match": mean([exact_match(o, r) for o, r in zip(outputs, references)]),
        "rouge_l": mean([rouge_l_f1(o, r) for o, r in zip(outputs, references)]),
        "f1": mean([token_f1(o, r) for o, r in zip(outputs, references)])
    }
    return metrics
```

### Multi-Metric Evaluation

Combine multiple metrics to get a holistic view:

| Metric | Best For | Limitation |
|--------|----------|------------|
| Exact Match | Classification, short answers | No partial credit |
| ROUGE-1 | Summarization content | Ignores word order |
| ROUGE-L | Summarization structure | Still lexical only |
| F1 | QA tasks | No semantic understanding |

### Grading Method Selection

From Anthropic's evaluation framework:
1. **Code-based grading**: Use for exact match, string match, binary pass/fail—fastest and most reliable
2. **Human grading**: Reserve for calibration and edge cases—expensive, doesn't scale
3. **LLM-based grading**: Use when simple metrics prove insufficient—requires calibration first

### Test Case Design for Functional Correctness

```python
test_cases = [
    {"function_name": "factorial", "inputs": [0], "expected": 1},
    {"function_name": "factorial", "inputs": [1], "expected": 1},
    {"function_name": "factorial", "inputs": [5], "expected": 120},
    {"function_name": "factorial", "inputs": [10], "expected": 3628800},
]
```

## Gotchas

- **ROUGE doesn't capture semantics**: A hallucinated response can score well on ROUGE if it shares vocabulary with the reference. "The cat ate the dog" vs "The dog ate the cat" score identically on ROUGE-1.

- **Exact match is brittle**: "42" vs "42." fails exact match. Always normalize whitespace, punctuation, and case before comparison.

- **ROUGE package inconsistencies**: According to ACL 2023 research, 76% of ROUGE package citations reference software with scoring errors. Only 5% of papers list configuration parameters. Specify rouge_type (rouge1, rouge2, rougeL) and mode (precision, recall, fmeasure) explicitly.

- **BLEU vs ROUGE confusion**: BLEU emphasizes precision (how much of output appears in reference), ROUGE emphasizes recall (how much of reference appears in output). Use ROUGE for summarization, BLEU for translation.

- **F1 masks precision/recall trade-offs**: A model optimizing for recall (verbose outputs) and one optimizing for precision (terse outputs) can achieve the same F1 score. Report all three metrics.

- **Functional correctness environment isolation**: Generated code tests must run in isolated environments. A test that passes by modifying global state can cause subsequent tests to fail.

- **Character vs token-level metrics**: Levenshtein operates on characters; ROUGE typically operates on words. Choose based on whether you care about spelling (Levenshtein) or content (ROUGE).

- **Ground truth availability**: Automated metrics require reference answers. For open-ended generation tasks, you may need LLM-as-judge approaches instead—but calibrate these against human evaluation first.

## Sources

- [Confident AI - LLM Evaluation Metrics Guide](https://www.confident-ai.com/blog/llm-evaluation-metrics-everything-you-need-for-llm-evaluation) — Comprehensive overview of statistical scorers (BLEU, ROUGE, METEOR) and their limitations for LLM evaluation
- [Ragas Documentation - Traditional NLP Metrics](https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/traditional/) — Implementation details for exact match, string presence, ROUGE, BLEU, and non-LLM similarity metrics
- [Anthropic Engineering - Demystifying Evals for AI Agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents) — Framework for code-based, model-based, and human graders with best practices for evaluation design
- [Claude API Docs - Define Success Criteria and Build Evaluations](https://platform.claude.com/docs/en/test-and-evaluate/develop-tests) — Practical code examples for exact match, ROUGE-L, and code-based grading implementations
- [Microsoft Learn - Evaluation Metrics](https://learn.microsoft.com/en-us/ai/playbook/technology-guidance/generative-ai/working-with-llms/evaluation/list-of-eval-metrics) — Reference-based vs reference-free metrics taxonomy, ROUGE/BLEU formulas, and functional correctness for code generation
- [Wikipedia - ROUGE (metric)](https://en.wikipedia.org/wiki/ROUGE_(metric)) — Canonical definition and variants of ROUGE metrics


---

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

