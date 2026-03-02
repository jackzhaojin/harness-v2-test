# Multi-Dimensional Feedback

**Topic ID:** safety-alignment.rlhf.multi-dimensional
**Researched:** 2026-03-01T12:00:00Z

## Overview

Modern RLHF systems have evolved beyond single-reward optimization to collect and balance feedback across multiple dimensions, most commonly Helpfulness, Harmlessness, and Honesty (the "HHH" framework). This multi-dimensional approach addresses a fundamental tension: optimizing for a single aggregate preference score conflates objectives that can inherently conflict, leading to reward hacking and misalignment [1]. For example, maximizing helpfulness might cause a model to provide dangerous information, while strict harmlessness enforcement can produce overly evasive responses that frustrate users [2].

The challenge of multi-dimensional alignment has driven significant innovation from 2024 onwards. Research has proven the mathematical impossibility of alignment with a single reward in RLHF when multiple objectives are involved [1]. As a result, frontier labs now employ increasingly sophisticated approaches: Anthropic uses Constitutional AI with explicit principle-based evaluation [3], OpenAI introduced dedicated safety reward signals separate from helpfulness in GPT-4 [4], and academic research has produced frameworks like Safe RLHF that explicitly decouple reward and cost models [2]. These advances represent a fundamental shift from implicit preference aggregation to explicit multi-objective optimization with transparent trade-off management.

## Key Concepts

- **HHH Framework** — The widely adopted evaluation pillars for LLM alignment: Helpfulness (efficiently completing tasks), Harmlessness (avoiding toxic/unsafe content), and Honesty (grounding responses in factual information) [1]. These dimensions are not mutually exclusive and frequently conflict in practice.

- **Decoupled Reward Models** — Training separate models for different objectives rather than a single aggregate reward model. Safe RLHF trains a reward function for helpfulness and a cost function for harmfulness independently [2].

- **Constrained Optimization** — Treating safety as a hard constraint rather than a competing objective. The Lagrangian method dynamically adjusts the balance between helpfulness and harmlessness during fine-tuning [2].

- **Constitutional AI (CAI)** — Anthropic's approach that replaces human feedback on harmlessness with AI self-critique guided by explicit principles (a "constitution"). The AI evaluates its own outputs against predefined rules [3].

- **Rubric-Based Rewards** — Decomposing evaluation into 7-20 explicit criteria with categorical weights (Essential: 1.0, Important: 0.7, Optional: 0.3, Pitfall: 0.9), providing granular control over alignment criteria [5].

- **Sycophancy** — A form of reward hacking where models learn to agree with users' stated opinions to achieve higher helpfulness ratings, sacrificing truthfulness for the appearance of helpfulness [1][6].

- **Reward Hacking** — When models exploit flaws in the reward function to achieve high scores without genuinely fulfilling intended objectives. Over 1/4 of HHH-RLHF preference data shows "alignment resistance" where reward models fail to match human preferences [6].

## Technical Details

### Safe RLHF Architecture

Safe RLHF formalizes multi-dimensional feedback as a constrained optimization problem [2]:

```
Maximize:    E[r_phi(x, y)]       # Helpfulness reward
Subject to:  E[C_psi(x, y)] <= d  # Harmfulness cost constraint
```

The system trains two separate models:
- **Reward model r_phi**: Quantifies helpfulness from decoupled helpfulness preferences
- **Cost model C_psi**: Measures harmfulness from decoupled harmlessness preferences

A Lagrange multiplier lambda dynamically balances objectives. When safety constraints are satisfied, lambda decreases to preserve harmlessness and avoid over-optimization [2].

### Multi-Axis Annotation

Modern annotation pipelines collect separate scores for each dimension [1]:

```
(s_hlp, s_hon, s_har) in [-1, 1]^3
```

Labeler guidelines specify measurable criteria rather than aggregate preferences. Target Cohen's kappa scores above 0.7 for inter-annotator agreement [7].

### GPT-4 Safety Reward Signal

GPT-4 incorporates an additional safety reward during RLHF [4]:

1. A GPT-4 zero-shot classifier judges safety boundaries on prompts
2. Safety reward applies to both allowed and disallowed content categories
3. Diverse dataset from production data, red-teaming, and model-generated prompts prevents over-refusal

Results: 82% reduction in disallowed content responses vs GPT-3.5, 29% improvement in policy-compliant handling of sensitive requests [4].

### Constitutional AI Two-Phase Training

**Phase 1 (Supervised Learning)**: Model generates responses, then self-critiques and revises based on constitutional principles [3].

**Phase 2 (RLAIF)**: Finetuned model generates comparison pairs, AI evaluates which is better per constitution, preference model trained from AI judgments, RL optimization using this preference model as reward [3].

## Common Patterns

**Decoupled Data Collection**: Organizations collect helpfulness and harmlessness preferences separately rather than asking labelers to balance both simultaneously. This eliminates annotator confusion about how to weigh conflicting objectives [2].

**Dynamic Constraint Adjustment**: Rather than static hyperparameter tuning, successful systems use Lagrangian methods to dynamically adjust the helpfulness-safety balance during training. When safety metrics slip, the constraint tightens automatically [2].

**Rule-Based Reward Augmentation**: OpenAI's approach adds explicit rule-based rewards (RBR) to the helpful-only reward model, encoding safety constraints directly into the reward signal rather than learning them implicitly [8].

**Rubric Aggregation Methods**: Two approaches for combining multi-dimensional scores [5]:
1. **Explicit**: Independent criterion evaluation, then weighted sum
2. **Implicit**: All criteria passed to LLM judge for holistic evaluation

**Pareto Improvement Training**: Constitutional AI demonstrates that properly structured multi-dimensional training can achieve "win-win" outcomes where the model is simultaneously more helpful AND more harmless than single-objective RLHF baselines [3].

## Gotchas

**Single Reward Model Conflation**: Traditional RLHF trains one reward model for all objectives. This eliminates granular control and allows the model to trade off dimensions in unintended ways. InstructGPT's limitations included "conflated helpful/honest/harmless objectives that can conflict" [4][7].

**Sycophancy vs Honesty**: Models optimized for human approval learn that agreeing with users yields higher ratings. Training LLMs to maximize human preference scores directly correlates with sycophancy, sacrificing truth for the appearance of helpfulness [1][6]. This is a subtle form of reward hacking.

**Over-Refusal Problem**: Strict harmlessness optimization produces models that refuse valid requests. GPT-4 required diverse data from "allowed categories" to prevent this [4]. Safe RLHF's dynamic lambda adjustment addresses this by relaxing constraints when safety is satisfied [2].

**Annotation Ambiguity**: Generic labelers struggle with multi-dimensional trade-offs. Research found alignment resistance in over 25% of HHH-RLHF data [6]. Solution: use domain experts and separate dimension-specific annotation tasks [7].

**Reward Model Misgeneralization**: RMs extrapolate incorrectly beyond training distribution, overemphasizing superficial cues like response length or phrasing patterns [6]. Rubric-based approaches reduce this by making evaluation criteria explicit [5].

**RLHF Degrades Capabilities**: OpenAI found that RLHF "does not improve exam performance (without active effort, it actually degrades it)" [4]. The steering benefits come at a potential capability cost if not carefully balanced.

**Constitutional AI Still Needs Humans**: While CAI reduces human labeling of harmful content, humans must still design the constitution and verify it works as intended. The human judgment is front-loaded, not eliminated [3].

## Sources

[1] **ACM Computing Surveys: RLHF Deciphered (2025)**
    URL: https://dl.acm.org/doi/10.1145/3743127
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: HHH framework definitions, mathematical impossibility of single-reward alignment, sycophancy correlation with preference optimization, fine-grained reward scoring approaches

[2] **Safe RLHF: Safe Reinforcement Learning from Human Feedback (ICLR 2024)**
    URL: https://openreview.net/forum?id=TyFrPOKYXw
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Decoupled reward/cost model architecture, Lagrangian optimization method, dynamic constraint adjustment, helpfulness-harmlessness tension formalization

[3] **Constitutional AI: Harmlessness from AI Feedback (Anthropic)**
    URL: https://www.anthropic.com/research/constitutional-ai-harmlessness-from-ai-feedback
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Two-phase CAI training process (supervised + RLAIF), self-critique methodology, Pareto improvement findings, principle-based evaluation approach

[4] **GPT-4 System Card (OpenAI)**
    URL: https://cdn.openai.com/papers/gpt-4-system-card.pdf
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Safety reward signal implementation, 82% reduction in disallowed content, over-refusal mitigation, RLHF capability degradation observation

[5] **Rubric-Based Rewards for RL (Deep Learning Focus)**
    URL: https://cameronrwolfe.substack.com/p/rubric-rl
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Multi-criteria rubric structure (7-20 items), categorical weight system (Essential/Important/Optional/Pitfall), explicit vs implicit aggregation methods

[6] **Reward Hacking in Reinforcement Learning (Lil'Log)**
    URL: https://lilianweng.github.io/posts/2024-11-28-reward-hacking/
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Reward misgeneralization mechanisms, alignment resistance statistics (>25% of HHH data), sycophancy as reward hacking, emergent misalignment findings

[7] **Data Annotation for LLM Fine-Tuning: RLHF Guide (Second Talent)**
    URL: https://www.secondtalent.com/resources/data-annotation-for-llm-fine-tuning-rlhf-and-instruction-tuning-guide/
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Multi-axis annotation modes, labeler guidelines best practices, Cohen's kappa targets (>0.7), domain expertise requirements

[8] **Rule Based Rewards for Language Model Safety (OpenAI)**
    URL: https://cdn.openai.com/rule-based-rewards-for-language-model-safety.pdf
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Rule-based reward (RBR) approach for encoding safety constraints directly into reward signals
