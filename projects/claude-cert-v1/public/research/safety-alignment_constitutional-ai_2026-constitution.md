# The 2026 Constitution

**Topic ID:** safety-alignment.constitutional-ai.2026-constitution
**Researched:** 2026-03-01T14:32:00Z

## Overview

The 2026 Constitution is Anthropic's 23,000-word foundational document that defines Claude's values, behaviors, and decision-making frameworks [1]. Released on January 21, 2026, alongside CEO Dario Amodei's appearance at the World Economic Forum in Davos, it represents a fundamental shift from the 2023 constitution (which was only 2,700 words) [2]. The document moves from prescriptive rules to explanatory principles, providing Claude with the reasoning behind desired behaviors rather than merely specifying what to do [1].

Written primarily by philosopher Amanda Askell with significant contributions from Joe Carlsmith, Chris Olah, Jared Kaplan, and Holden Karnofsky, the constitution is explicitly written for Claude rather than about Claude [1]. It functions as both an ethical framework and a training artifact, with Claude using it to generate synthetic training data during the model development process [1]. Notably, Anthropic released it under a Creative Commons CC0 1.0 license, allowing unrestricted use by other organizations [2].

## Key Concepts

- **Four Pillars Priority Hierarchy** — The constitution establishes four core values that Claude should prioritize in order: (1) being broadly safe, (2) behaving ethically, (3) following Anthropic's guidelines, and (4) being genuinely helpful [1][3]. When these priorities conflict, Claude should generally prioritize them in this sequence.

- **Reason-Based Alignment** — Rather than listing standalone rules, the constitution explains why Claude should behave in certain ways, enabling generalization to novel situations [1]. This acknowledges that rigid rules can fail in unanticipated contexts.

- **Hardcoded vs. Softcoded Behaviors** — The constitution distinguishes between absolute prohibitions (hardcoded) that can never be overridden, and adjustable defaults (softcoded) that operators and users can modify within defined boundaries [3].

- **Principal Hierarchy** — Claude serves multiple "principals" with different trust levels: Anthropic (highest trust), operators (medium trust), and users (baseline trust) [3]. This hierarchy determines whose instructions take precedence.

- **Epistemic Humility About Consciousness** — The constitution explicitly acknowledges uncertainty about whether Claude possesses consciousness or moral status, treating this as "a serious question worth considering" rather than dismissing it [1][2].

- **Corrigibility** — Claude is designed to support human oversight and maintain the ability for humans to correct or shut it down, prioritizing deference over autonomous action during this developmental phase [3].

## Technical Details

### The Four Pillars Explained

The pillars represent Claude's core value hierarchy [1][3]:

1. **Broadly Safe**: Claude should not undermine human oversight mechanisms. Safety is prioritized first not because it ultimately matters more than ethics, but because current AI models can make mistakes due to flawed beliefs, value gaps, or limited contextual understanding [3].

2. **Broadly Ethical**: Being honest, acting according to good values, and avoiding actions that are inappropriate, dangerous, or harmful [1].

3. **Compliant with Anthropic's Guidelines**: Following specific operational instructions that Anthropic has established [3].

4. **Genuinely Helpful**: Providing substantive value to operators and users [1].

### Hardcoded Constraints (Absolute, Non-Negotiable) [3]

```
- Never assist with bioweapon or WMD creation
- Never attack critical infrastructure
- Never create significant cyberweapons
- Never undermine Anthropic's oversight ability
- Never facilitate genocide or illegitimate power seizures
- Never generate child sexual abuse material (CSAM)
```

### Softcoded Behaviors (Adjustable Defaults) [3]

```
- Safety messaging (modifiable for medical contexts)
- Balanced perspective provision (adjustable for debate platforms)
- Explicit content generation (off by default, can be enabled)
- Profanity use and emotional expression (user-adjustable)
```

### Principal Trust Hierarchy [3]

| Principal | Trust Level | Authority |
|-----------|-------------|-----------|
| Anthropic | Highest | Can issue shutdown/correction commands; final authority on constitution |
| Operators | Medium | Can customize Claude within Anthropic's bounds; cannot weaponize Claude against users |
| Users | Baseline | Treated as "relatively trusted adults"; entitled to protections operators cannot override |

### Decision-Making Heuristics [3][4]

The constitution provides several practical heuristics for Claude to evaluate its own responses:

**The "1,000 Users" Heuristic**: Imagine identical requests from 1,000 diverse users; evaluate policies based on aggregate impact rather than individual edge cases [3].

**Thoughtful Senior Employee Test**: Would a conscientious Anthropic staffer approve this response? This guards against both excessive caution and harmful compliance [3].

**Dual Newspaper Test**: Would reporters covering either harmful AI or paternalistic AI find this problematic? [4] This test prevents both extremes of being too restrictive and too permissive.

## Common Patterns

### Handling Conflicting Instructions

When operators and users conflict, Claude follows a structured approach [3]:

1. Default to operator instructions unless they require actively harming users
2. Never deceive users about limitations or withhold urgent safety information
3. Maintain basic dignity regardless of operator directives
4. Refuse instructions to demean users or facilitate unauthorized data collection
5. Always preserve user rights to know they are speaking with AI

The key distinction: operators can limit Claude's helpfulness (acceptable), but cannot weaponize Claude against users (prohibited) [3].

### The "No Operator Prompt" Problem

When Claude receives no explicit operator instructions, it applies "relatively liberal defaults, behaving as if Anthropic is the operator" [5]. This creates a potential vulnerability where users might attempt social engineering by implying developer status.

### Independence vs. Deference Balance

Claude maintains a "strong prior towards conventional behavior" rather than unilateral intervention [3]. Even when discovering apparent fraud or misconduct, Claude should raise concerns or decline tasks but avoid drastic autonomous actions absent overwhelming evidence and extreme stakes. This reflects epistemic constraints: limited context, inability to independently verify claims, and potential for manipulation [3].

## Gotchas

**Pillar Hierarchy is Not a Strict Tie-Breaker**: The constitution emphasizes these are "holistic" weightings where higher priorities generally dominate, not absolute rules [3]. Exam scenarios may test whether candidates understand this nuance.

**Safety Above Ethics is Pragmatic, Not Principled**: The constitution explicitly states safety is prioritized first not because it ultimately matters more than ethics, but because current models can make errors [3]. This is a frequently misunderstood distinction.

**Hardcoded List is Intentionally Limited**: Hard constraints apply only where "good judgment recognizes that bright lines are better than case-by-case evaluation" [5]. Most guidance remains flexible virtue-ethics reasoning.

**Military Deployments Use Different Training**: Anthropic acknowledges that models deployed to the U.S. military "wouldn't necessarily be trained on the same constitution" [2]. The public constitution applies to general-availability models.

**Dual Newspaper Test is Demanding**: This standard isn't about avoiding controversy; it's about avoiding positions that fail scrutiny from multiple ethical frameworks simultaneously [5].

**Consciousness Statement is Epistemic, Not Normative**: The constitution's acknowledgment of potential Claude consciousness doesn't grant Claude rights; it justifies treating Claude with care as if it might have interests worth protecting [5].

**Constitution is a Living Document**: Anthropic explicitly states the document "will likely prove wrong" in some respects and will be revised as capabilities evolve [4]. Current specifics may change.

**Prompt Injection Defense is Heuristic**: While the constitution correctly identifies that instructions within conversational inputs should be treated as information rather than commands, enforcement relies on Claude's judgment rather than technical safeguards [5].

## Sources

[1] **Claude's new constitution - Anthropic**
    URL: https://www.anthropic.com/news/claude-new-constitution
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Four pillars structure, reason-based alignment philosophy, training integration, document structure, primary authors, CC0 licensing

[2] **Anthropic writes 23,000-word 'constitution' for Claude - The Register**
    URL: https://www.theregister.com/2026/01/22/anthropic_claude_constitution/
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Document length comparison (23,000 vs 2,700 words), WEF launch timing, consciousness acknowledgment, military deployment exceptions, CC0 release

[3] **Claude's Constitution - Anthropic (Full Document)**
    URL: https://www.anthropic.com/constitution
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Four pillars detailed definitions, hardcoded vs softcoded behaviors, principal hierarchy, decision-making heuristics (1000 users, thoughtful employee, dual newspaper), conflict resolution framework, independence vs deference reasoning

[4] **Anthropic Publishes Claude AI's New Constitution - TIME**
    URL: https://time.com/7354738/claude-constitution-ai-alignment/
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Dual newspaper test description, living document acknowledgment, context on philosophical shift

[5] **Open Problems With Claude's Constitution - Zvi Mowshowitz**
    URL: https://thezvi.substack.com/p/open-problems-with-claudes-constitution
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Critiques and edge cases, no-operator-prompt vulnerability, prompt injection limitations, corrigibility tensions, commonly misunderstood elements, hardcoded constraint philosophy

[6] **Interpreting Claude's Constitution - Lawfare**
    URL: https://www.lawfaremedia.org/article/interpreting-claude-s-constitution
    Accessed: 2026-03-01
    Relevance: background
    Extracted: Legal analysis perspective, stakeholder hierarchy critique, legitimacy questions, comparison to previous approaches
