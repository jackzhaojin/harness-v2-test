# Constitutional Classifiers

**Topic ID:** safety-alignment.jailbreak-prevention.classifiers
**Researched:** 2026-03-01T12:00:00Z

## Overview

Constitutional Classifiers are Anthropic's inference-time safety system designed to detect and block jailbreak attempts on Claude models. Unlike Constitutional AI (which trains the model itself using AI feedback), Constitutional Classifiers operate as a separate filtering layer that monitors both inputs and outputs in real-time [1]. The system derives its name from its use of a "constitution" - a set of principles defining allowed and disallowed content classes - to generate synthetic training data for the classifiers [1].

The importance of Constitutional Classifiers became particularly evident with Anthropic's activation of ASL-3 (AI Safety Level 3) protections for Claude Opus 4 in May 2025 [4]. ASL-3 specifically addresses risks from models that could materially assist in creating chemical, biological, radiological, and nuclear (CBRN) weapons [4]. Constitutional Classifiers serve as the primary deployment safeguard for this threat category, having been validated through over 3,000 hours of red teaming by 183 active participants with no universal jailbreak discovered [1].

The system has evolved through two generations. The first generation reduced jailbreak success rates from 86% to 4.4% but added 23.7% compute overhead [1]. The second generation (Constitutional Classifiers++) achieves even better security at only approximately 1% additional compute cost through innovative use of internal model activations [2].

## Key Concepts

- **Constitution** - A set of natural language principles specifying permitted and restricted content categories. For example, "recipes for mustard are allowed, but recipes for mustard gas are not" [1]. The constitution enables rapid adaptation to new threat models without retraining the base model [1].

- **Dual Classifier Architecture (First Generation)** - The original system employed separate prompt-only and completion-only classifiers. The input classifier evaluates queries before they reach the model; the output classifier monitors generated responses token-by-token and can halt generation mid-stream if harmfulness thresholds are exceeded [1][3].

- **Exchange Classifier (Second Generation)** - Replaces the dual-classifier approach by evaluating outputs in context of their corresponding inputs. This design cut successful jailbreaking attempts by more than half during red teaming because it recognizes when benign-looking outputs answer harmful inputs [2].

- **Internal Probe Classifiers** - A key innovation in Constitutional Classifiers++ that examines Claude's internal neural network activations rather than just text. When Claude processes a suspicious request, patterns fire in its internal states reflecting "this seems harmful" before any response is formulated [2]. These probes are harder to fool because manipulating internal representations is more difficult than crafting deceptive final outputs [2].

- **Two-Stage Architecture** - Constitutional Classifiers++ uses a cascade design: a lightweight probe screens all traffic (very cheap to run), and only flagged exchanges escalate to the more powerful ensemble classifier for final judgment [2].

- **Universal Jailbreak** - A single prompt or technique that can bypass safety measures across multiple harmful queries. Constitutional Classifiers specifically target preventing universal jailbreaks, as opposed to one-off prompt injections [1].

- **Synthetic Data Generation** - The constitution is used to generate diverse training data by creating synthetic prompts and completions across content classes, then augmenting through translation to different languages and transformation into known jailbreak styles [1].

## Technical Details

### Training Pipeline

The Constitutional Classifiers training process follows these steps [1]:

1. Define a constitution specifying allowed/disallowed content classes
2. Use Claude to generate synthetic prompts and completions across all classes
3. Augment data diversity through language translation and jailbreak-style transformations
4. Train classifiers on synthetic harmful data plus contractor-generated benign queries (to minimize over-refusals)

### First Generation Architecture

```
Input Classifier → Claude Model → Output Classifier → Response
     |                                    |
     v                                    v
  [Block]                           [Halt/Block]
```

The output classifier makes predictions at each token position for the harmfulness of the full output sequence, enabling mid-generation stopping [3].

### Constitutional Classifiers++ Architecture

```
All Traffic → Linear Probe (cheap) → [Suspicious?]
                                          |
                        No ←──────────────┼──────────────→ Yes
                         |                                  |
                         v                                  v
                    Pass through              Exchange Classifier Ensemble
                                                           |
                                              [Block or Pass through]
```

The probe examines internal activations, achieving 40x computational cost reduction compared to running the full exchange classifier on all traffic [2].

### Performance Metrics

| Metric | First Generation | Second Generation (++) |
|--------|------------------|------------------------|
| Jailbreak success rate | 4.4% (vs 86% unguarded) | Lower than first gen |
| Compute overhead | 23.7% | Approximately 1% |
| Over-refusal rate increase | 0.38% | 0.05% (87% reduction) |
| Red team hours | 3,000+ | 1,700+ |
| Red team attempts | N/A | 198,000 |
| Universal jailbreaks found | 0 (in controlled test) | 0 |

### Attack Vectors Addressed in Second Generation

Two attack categories that degraded first-generation performance [2]:

1. **Reconstruction Attacks** - Fragment harmful information into benign-looking segments, then reassemble (e.g., embedding malicious queries across scattered code functions)

2. **Output Obfuscation Attacks** - Disguise harmful outputs using synonyms, metaphors, or codes (e.g., substituting dangerous chemical names with "food flavorings")

These attacks could degrade model performance substantially; GPQA Diamond scores dropped from 74% to 32% under certain jailbreak approaches [2].

## Common Patterns

### ASL-3 Deployment Context

Constitutional Classifiers are a core component of Anthropic's ASL-3 deployment safeguards, activated for Claude Opus 4 in May 2025 [4]. The three-part ASL-3 approach includes:

1. Making the system more difficult to jailbreak (Constitutional Classifiers)
2. Detecting jailbreaks when they occur (bug bounty, monitoring)
3. Iteratively improving defenses (classifier retraining) [4]

### Bug Bounty Integration

Anthropic runs ongoing bug bounty programs to stress-test Constitutional Classifiers [1][4]:

- Initial program: 183 participants, 2 months, up to $15,000 rewards, 3,000+ hours
- Public demo (Feb 2025): $20,000 for universal jailbreak discovery
- Current ASL-3 program: Up to $25,000 for verified universal jailbreaks on Claude Opus 4 [4]

### Relationship to Constitutional AI

Both systems use a constitution but serve different purposes [5]:

| Aspect | Constitutional AI | Constitutional Classifiers |
|--------|-------------------|---------------------------|
| Purpose | Train model behavior | Guard against jailbreaks |
| When applied | Training time (SL + RL) | Inference time |
| Mechanism | Self-critique + RLAIF | Classifier filtering |
| Constitution use | Guide AI feedback | Generate training data |

## Gotchas

- **Not the same as Constitutional AI** - A common point of confusion. Constitutional AI is a training methodology (replacing RLHF with AI feedback). Constitutional Classifiers are inference-time filters. Both use a "constitution" but in fundamentally different ways [1][5].

- **Universal vs. one-off jailbreaks** - Constitutional Classifiers are optimized to prevent universal jailbreaks (techniques that work across many harmful queries). Individual prompt injections may occasionally succeed, but finding a reusable technique is exponentially harder [1].

- **Classifiers are not perfect** - Anthropic explicitly states that Constitutional Classifiers "cannot prevent every universal jailbreak" [1]. The public demo (Feb 2025) resulted in one verified universal jailbreak being discovered, and successful strategies included ciphers, role-play, keyword substitution, and prompt injection [1].

- **Compute-security tradeoff history** - The first generation added 23.7% compute overhead, which was significant for production deployment. The second generation reduced this to approximately 1%, making broad deployment viable [1][2]. Exam questions may test understanding of why this efficiency improvement matters for real-world safety deployment.

- **Over-refusal is a real concern** - Safety systems that refuse too many legitimate queries degrade user experience. First-generation classifiers had 0.38% over-refusal increase; second generation achieved 0.05% (87% improvement) [1][2]. This tension between safety and usability is a common exam topic.

- **Internal probes leverage interpretability research** - Constitutional Classifiers++ builds on Anthropic's mechanistic interpretability work. The probes detect patterns in Claude's internal activations - essentially reading Claude's "gut feeling" about whether a request is harmful [2]. This connection between interpretability and safety systems is an important cross-cutting concept.

- **ASL-3 vs ASL-4 threshold** - Claude Opus 4 triggered ASL-3 protections (CBRN risks from sophisticated non-state actors) but was ruled out for ASL-4 [4]. Claude Sonnet 4 does not require ASL-3 protections [4]. Understanding which capabilities trigger which safety levels is exam-relevant.

## Sources

[1] **Constitutional Classifiers: Defending against universal jailbreaks**
    URL: https://www.anthropic.com/research/constitutional-classifiers
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Core mechanism, training process, first-generation performance metrics (86% to 4.4% reduction, 23.7% overhead, 0.38% over-refusal), red teaming methodology (3000+ hours, 183 participants), bug bounty details, public demo results, limitations.

[2] **Next-generation Constitutional Classifiers: More efficient and robust protection against jailbreaks**
    URL: https://www.anthropic.com/research/next-generation-constitutional-classifiers
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Two-stage architecture, internal probe classifiers, exchange classifier design, approximately 1% compute overhead, 0.05% refusal rate, 1700+ hours / 198,000 attempts red teaming, reconstruction and obfuscation attack vectors, GPQA performance degradation statistics.

[3] **Beyond Fine-Tuning: How Constitutional Classifiers Are Upping AI's Security Game**
    URL: https://dev.to/alessandro_pignati/beyond-fine-tuning-how-constitutional-classifiers-are-upping-ais-security-game-1gld
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Dual-layer filtering mechanism details, token-by-token output evaluation, running harmfulness assessment across sequences.

[4] **Activating AI Safety Level 3 Protections**
    URL: https://www.anthropic.com/news/activating-asl3-protections
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: ASL-3 activation context for Claude Opus 4 (May 2025), CBRN threat focus, three-part defense approach, bug bounty rewards up to $25,000, ASL-3 vs ASL-4 model classification.

[5] **Constitutional AI: Harmlessness from AI Feedback**
    URL: https://www.anthropic.com/research/constitutional-ai-harmlessness-from-ai-feedback
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Distinction between Constitutional AI (training methodology) and Constitutional Classifiers (inference-time filters), RLAIF process, constitution usage differences.
