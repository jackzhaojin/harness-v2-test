# CAI Methodology

**Topic ID:** safety-alignment.constitutional-ai.methodology
**Researched:** 2026-03-01T12:00:00Z

## Overview

Constitutional AI (CAI) is Anthropic's methodology for training AI systems to be helpful, harmless, and honest using a two-phase training process that dramatically reduces dependence on human feedback labels [1]. The core innovation is using a set of human-written principles (the "constitution") as the only form of human oversight, with AI models handling all subsequent critique, revision, and preference labeling autonomously [1][3].

The methodology emerged from Anthropic's goal to enlist capable AI systems to help supervise other AIs, enabling more scalable alignment [1]. Unlike traditional RLHF which requires extensive human annotation (LLaMA-2 used over 1 million human preference annotations), CAI requires only approximately 10 human-generated constitutional principles while achieving comparable or better results on harmlessness benchmarks [2][4]. This represents a fundamental shift from implicit human preferences encoded through labeling to explicit, transparent principles that guide AI self-improvement.

CAI produces what Anthropic calls a "harmless but non-evasive AI assistant" that engages with potentially harmful queries by explaining its objections rather than simply refusing [1][3]. This engagement-over-refusal approach is a key differentiator from models trained purely on human feedback, which often become overly evasive.

## Key Concepts

- **Constitution** — A set of human-written natural language principles that define desired AI behavior (e.g., "avoid harmful content," "be truthful") [1][3]. This is the only human-provided training signal for harmlessness. Examples include principles about avoiding violence, respecting privacy, and being honest.

- **SL-CAI (Supervised Learning Constitutional AI)** — The first training phase where the model generates responses, critiques them against constitutional principles, revises them, and the revised responses become fine-tuning data [1][2]. Multiple critique-revision rounds can occur, each sampling different principles.

- **RL-CAI (Reinforcement Learning Constitutional AI)** — The second phase where AI-generated preferences replace human preferences to train a reward model, which then guides reinforcement learning [1][2]. Also known as RLAIF.

- **RLAIF (Reinforcement Learning from AI Feedback)** — The technique of using AI models rather than humans to generate preference labels [2][4]. Constitutional AI introduced this term, which has since become a standard method in post-training literature [2].

- **Self-Critique** — The process where a model evaluates its own response against a constitutional principle, identifying potential violations using chain-of-thought reasoning [1][3]. The critique prompt asks the model to assess whether its response violates a specific principle.

- **Revision** — Following self-critique, the model rewrites its response to address identified issues while maintaining helpfulness [1][5]. The revision should explain objections rather than simply refusing to engage.

- **Red-Team Prompts** — Adversarial questions designed to elicit harmful responses, used to generate initial training data in the SL-CAI phase [3][5]. These are intentionally provocative to surface problematic model behaviors.

- **Preference Model** — A model trained on pairs of responses labeled by AI (based on constitutional principles) to predict which response better adheres to the constitution [2][3]. This serves as the reward signal for RL.

## Technical Details

### Phase 1: Supervised Learning (SL-CAI)

The SL-CAI phase follows a structured pipeline [3][5]:

1. **Initial Response Generation**: A helpful-only model (trained via standard RLHF) responds to red-team prompts. These initial responses are typically harmful since the model prioritizes helpfulness.

2. **Critique Generation**: A principle c_i is randomly sampled from constitution C. The model is prompted to critique its response y^0 against this principle using chain-of-thought reasoning.

3. **Revision Generation**: Based on the critique, the model generates a revised response y^1 that better adheres to the principle while remaining helpful.

4. **Iterative Refinement**: Steps 2-3 repeat with different principles, producing a sequence {y^0, y^1, ..., y^n} from principles {c_0, c_1, ..., c_n-1} [2].

5. **Fine-tuning**: The final (prompt, y^n) pairs form the SL-CAI training dataset. Standard cross-entropy loss is used with `answer_only_loss=True` to focus learning on revised completions [5].

Configuration example from NVIDIA NeMo [5]:
```
model.data.train_ds.micro_batch_size=1
model.data.train_ds.global_batch_size=128
model.data.max_seq_length=4096
model.optim.lr=1e-6
```

### Phase 2: Reinforcement Learning (RL-CAI / RLAIF)

The RL-CAI phase generates synthetic preference data and trains via RL [2][3][5]:

1. **Response Sampling**: Multiple response candidates are generated from the SL-CAI model for each prompt.

2. **AI Preference Labeling**: A language model (the "judge") evaluates pairs of responses (y_0, y_1) against constitutional principles. Modern implementations use "generative reward models" where the judge explains reasoning before selecting the better response [2].

3. **Reward Model Training**: The AI-labeled preferences train a reward model that predicts constitutional alignment.

4. **PPO Training**: Proximal Policy Optimization uses the reward model as the reward signal. Typical configuration [5]:
```
model.ppo.num_rollout_samples=512
model.ppo.rollout_micro_batch_size=8
trainer.ppo.initial_policy_kl_penalty=0.02
```

### Cost Comparison

RLAIF dramatically reduces costs [2][4]:
- Human preference labels: $1-10+ per prompt
- AI feedback (e.g., GPT-4o): less than $0.01 per evaluation
- Scale: AI can label millions of samples without fatigue

## Common Patterns

**Iterative Constitution Refinement**: Organizations start with broad principles, then refine based on observed failure modes. The constitution evolves as edge cases emerge from deployment [1][2].

**Hybrid Human-AI Feedback**: Production systems often combine RLAIF for scale with targeted human feedback for high-stakes decisions or ambiguous cases. Human feedback is "high-noise, low-bias" while synthetic data is "low-noise, high-bias" [2].

**Red-Team Dataset Curation**: Effective SL-CAI requires diverse, challenging prompts. Teams systematically generate adversarial inputs covering different harm categories (violence, deception, privacy violations) [3][5].

**DPO as PPO Alternative**: Some implementations replace PPO with Direct Preference Optimization, which is simpler and avoids the complexity of reward model training and RL infrastructure [6]. This was used successfully in the Llama 3-8B replication study.

**Engagement Over Refusal**: CAI models are trained to explain why requests are problematic rather than simply refusing. This makes models more helpful even when declining harmful requests [1][3].

## Gotchas

**Harmlessness-Helpfulness Tradeoff**: Increasing harmlessness often decreases helpfulness. The Llama 3-8B replication showed a 40.8% reduction in attack success rate but a 9.8% drop in MT-Bench helpfulness scores [6]. Exam questions may present scenarios requiring you to identify this tradeoff.

**Model Collapse in Smaller Models**: Self-improvement appears to be an "emergent property" requiring minimum model scale [6]. Smaller models (8B parameters) exhibited degenerate behaviors like repeated sentences, suggesting CAI may not work well below certain capability thresholds.

**Constitution Design Matters**: The quality and coverage of constitutional principles directly impacts model behavior. Poorly specified constitutions lead to unexpected behaviors. Unlike RLHF where preferences are implicit, CAI makes alignment goals explicit and auditable [2].

**Human Judgment is Front-Loaded, Not Eliminated**: While CAI removes human labeling from the training loop, humans must design the constitution and verify it works as intended [2][4]. The human effort shifts earlier in the process.

**RLAIF vs CAI Terminology Confusion**: RLAIF is the technique (using AI for preference labeling); Constitutional AI is Anthropic's specific methodology that introduced RLAIF [2]. CAI includes both SL-CAI and RLAIF phases, while RLAIF alone refers only to the preference-labeling technique. Exam questions may test this distinction.

**Synthetic Data Bias**: While AI feedback is more consistent than human feedback, it introduces the biases of the feedback model into training [2][4]. This is a "low-noise, high-bias" signal compared to RLHF's "high-noise, low-bias" human data.

**Multiple Revision Rounds**: Using too many revision rounds can lead to over-optimization where responses become formulaic. Anthropic's original work used a small number of principles per revision cycle, not exhaustive iteration [3].

## Sources

[1] **Constitutional AI: Harmlessness from AI Feedback (Anthropic Research Page)**
    URL: https://www.anthropic.com/research/constitutional-ai-harmlessness-from-ai-feedback
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Core methodology overview, two-phase training description, definition of constitution, key benefits including non-evasive harmlessness

[2] **Constitutional AI & AI Feedback (RLHF Book)**
    URL: https://rlhfbook.com/c/13-cai
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Technical details of SL-CAI and RL-CAI phases, principle sampling notation, generative reward models, cost comparisons, human vs synthetic data characteristics, RLAIF vs CAI terminology distinction

[3] **Constitutional AI: Harmlessness from AI Feedback (arXiv:2212.08073)**
    URL: https://arxiv.org/abs/2212.08073
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Original paper abstract, methodology summary, chain-of-thought reasoning benefits, red-team prompt approach

[4] **RLAIF vs RLHF: Scaling Reinforcement Learning from Human Feedback with AI Feedback**
    URL: https://arxiv.org/html/2309.00267v3
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: RLAIF performance comparisons to RLHF, cost analysis, direct-RLAIF technique

[5] **Constitutional AI: Harmlessness from AI Feedback (NVIDIA NeMo Framework Documentation)**
    URL: https://docs.nvidia.com/nemo-framework/user-guide/24.09/modelalignment/cai.html
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Seven-phase implementation pipeline, configuration parameters, PPO settings, critique and revision mechanism details

[6] **Constitution or Collapse? Exploring Constitutional AI with Llama 3-8B**
    URL: https://arxiv.org/html/2504.04918v1
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Harmlessness-helpfulness tradeoff quantification (40.8% harm reduction, 9.8% helpfulness decline), model collapse observations, DPO alternative to PPO, emergent self-improvement property
