# Usage Restrictions

**Topic ID:** safety-alignment.usage-policies.restrictions
**Researched:** 2026-03-01T12:00:00Z

## Overview

Anthropic maintains a comprehensive Usage Policy (formerly called the Acceptable Use Policy) that defines what applications of Claude are prohibited, restricted, or require additional safeguards [1]. The policy serves as a binding framework for all users of Claude products, including Claude.ai, the API, and enterprise deployments. Understanding these restrictions is critical for certification because exam scenarios often test whether candidates can identify prohibited uses versus permissible applications with appropriate safeguards.

The Usage Policy is described as "a living document, evolving as AI risks themselves evolve" [1]. Anthropic has demonstrated willingness to enforce these policies even under significant pressure, most notably in February 2026 when the company allowed a $200 million Pentagon contract to lapse rather than remove restrictions on mass domestic surveillance and fully autonomous weapons [2][3]. This stance resulted in Anthropic being designated a "supply chain risk" and banned from federal contracts, underscoring that these policies represent firm operational boundaries rather than aspirational guidelines [4].

## Key Concepts

- **Universal Usage Standards** — Anthropic consolidated "Prohibited Uses" and "Prohibited Business Cases" into unified standards that apply across all Claude products and deployment contexts [1]. This consolidation took effect June 6, 2024.

- **High-Risk Use Cases** — Applications with public welfare and social equity implications, including healthcare decisions, legal guidance, financial determinations, and employment-related uses [1][5]. These require enhanced safeguards but are not outright prohibited.

- **Human-in-the-Loop Oversight** — A required safeguard for high-risk use cases where a qualified human must review AI outputs before consequential decisions are made [5]. This is mandatory, not optional, for consumer-facing applications in regulated domains.

- **AI Disclosure** — The requirement to inform end users when they are interacting with or receiving outputs from an AI system [1][5]. Required for high-risk consumer-facing applications.

- **Red Lines** — Anthropic's term for absolute prohibitions that cannot be waived even for government customers. The two primary red lines are mass domestic surveillance and fully autonomous weapons [2][3].

- **ASL-3 Safeguards** — Enhanced security and deployment safeguards required when models can meaningfully assist with CBRN (chemical, biological, radiological, nuclear) weapons development [6]. These go beyond policy into technical enforcement.

- **Government Exceptions** — Tailored restrictions available for "carefully selected government entities" that meet specific criteria, though core prohibitions (disinformation, weapons, censorship, domestic surveillance, malicious cyber operations) remain unchanged [7].

## Technical Details

### Prohibited Activities (Absolute Prohibitions)

The following uses are unconditionally prohibited regardless of customer tier or deployment context [1][6]:

**Weapons and Dangerous Materials:**
- Produce, modify, design, market, or distribute weapons, explosives, or dangerous materials
- CBRN (chemical, biological, radiological, nuclear) weapons development specifically
- High-yield explosives design or production
- Fully autonomous weapons systems (weapons that select and engage targets without human control)

**Surveillance and Privacy Violations:**
- Mass domestic surveillance of citizens
- Analyzing biometric data to infer characteristics like race or religious beliefs
- Building emotion recognition systems for interrogation purposes
- Tracking or targeting individuals based on identity
- Content censorship on behalf of government organizations

**Cybersecurity Attacks:**
- Discovering vulnerabilities without system owner consent
- Creating malware or malicious code
- Launching denial-of-service attacks
- Exploiting network weaknesses

**Democratic Process Interference:**
- Targeting voting machines or election infrastructure
- Obstructing vote counting or certification
- Generating campaigns with false or misleading election information
- Voter microtargeting with deceptive content

**Disinformation and Fraud:**
- Spreading misinformation or disinformation
- Engaging in fraudulent or abusive practices
- Inciting violence or hateful behavior

**Competitive Restrictions:**
- Using prompts and results to train competing AI models
- Third-party harness access via consumer OAuth tokens (Claude Free, Pro, Max) [8]

### High-Risk Use Case Requirements

For applications in healthcare, legal, financial, and employment contexts that are consumer-facing [1][5]:

```
Required Safeguards:
1. Human-in-the-loop oversight (qualified professional review)
2. AI disclosure to end users
3. Technical measures to reduce bias and errors
4. Regular auditing and monitoring
```

These requirements apply specifically when model outputs are consumer-facing. B2B interactions (internal business use) have lighter requirements [1].

**Healthcare-Specific:**
- HIPAA compliance requires Enterprise plan with signed BAA
- Qualified professional must review content for medical decisions, diagnosis, patient care, therapy, or mental health guidance [5]
- Claude is positioned to "amplify clinicians rather than replace them" [5]

**Legal-Specific:**
- All legal outputs should be reviewed by licensed attorneys [5]
- Suitable for contract review, NDA triage, compliance workflows, but not autonomous legal decisions

### Government Exception Criteria

Government entities seeking tailored restrictions are evaluated on five factors [7]:

1. **Model suitability** — Assessment of whether models fit proposed applications
2. **Legal authorities** — The agency's statutory powers and jurisdiction
3. **Engagement willingness** — Ongoing dialogue with Anthropic
4. **Safeguards** — Systems to prevent misuse and mitigate errors
5. **Democratic oversight** — Independent checks through legislation, regulation, and public commitments

Even with exceptions, core restrictions on disinformation, weapons, censorship, domestic surveillance, and malicious cyber operations remain unchanged [7].

## Common Patterns

**Pattern 1: Distinguishing Prohibited vs. Restricted Uses**

A common exam scenario presents a use case and asks whether it is prohibited, requires safeguards, or is fully permitted:

| Use Case | Classification | Rationale |
|----------|---------------|-----------|
| Vulnerability scanning with owner consent | Permitted | Explicit exception for legitimate security research [1] |
| Vulnerability scanning without consent | Prohibited | Malicious cyber operation [1] |
| Medical diagnosis assistant for clinicians | High-risk (allowed with safeguards) | Human-in-the-loop required [5] |
| Autonomous medical diagnosis without review | Prohibited | Violates human oversight requirement [5] |
| Political research and civic education | Permitted | Explicitly allowed after policy refinement [1] |
| Voter microtargeting campaigns | Prohibited | Deceptive/disruptive to democratic process [1] |

**Pattern 2: Consumer vs. Enterprise Compliance**

The high-risk use case requirements apply to consumer-facing outputs, not B2B interactions [1]. An enterprise using Claude internally for legal document review has lighter requirements than a legal-tech startup offering Claude-powered services directly to consumers.

**Pattern 3: Technical Enforcement Layers**

Beyond policy, Anthropic implements technical safeguards [6]:
- Access controls at model level
- Real-time prompt and completion classifiers
- Rate limiting and usage monitoring
- ASL-3 deployment safeguards for CBRN-adjacent capabilities

## Gotchas

**Gotcha 1: "Permitted with Safeguards" vs. "Prohibited"**
High-risk use cases (healthcare, legal, finance) are NOT prohibited; they require safeguards [1][5]. Exam questions may try to trick candidates into thinking these are outright banned. The key distinction: prohibited uses cannot be made compliant with any safeguards, while high-risk uses become compliant with proper oversight.

**Gotcha 2: Consumer OAuth Restrictions (2026)**
Using OAuth tokens from Claude Free, Pro, or Max subscriptions in third-party tools, harnesses, or the Agent SDK is a policy violation [8]. OAuth is only permitted for Claude.ai and Claude Code. This is commonly confused because the Agent SDK uses OAuth authentication, but enterprise/API authentication is required for SDK use.

**Gotcha 3: Cybersecurity Has Both Permitted and Prohibited Forms**
Vulnerability discovery is permitted with system owner consent but prohibited without consent [1]. Exam scenarios may present security research use cases where the determining factor is whether explicit authorization exists.

**Gotcha 4: Political Content is Nuanced**
Blanket lobbying restrictions were replaced with targeted prohibitions against deceptive or disruptive activities [1]. Legitimate political research, civic education, and responsible political writing are explicitly permitted. Exam questions may present political use cases that appear restricted but are actually allowed.

**Gotcha 5: Government Exceptions Do Not Override Red Lines**
Even carefully selected government entities cannot receive exceptions for mass domestic surveillance, fully autonomous weapons, disinformation, or malicious cyber operations [7]. The Pentagon standoff in February 2026 demonstrated Anthropic enforces this boundary even at significant financial cost [2][3][4].

**Gotcha 6: B2B vs. B2C Requirements Differ**
High-risk use case requirements (human-in-the-loop, AI disclosure) apply specifically to consumer-facing outputs [1]. Internal business use has lighter requirements, which can be confusing when evaluating enterprise deployments.

## Sources

[1] **Usage Policy Update - Anthropic**
    URL: https://www.anthropic.com/news/usage-policy-update
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Complete list of prohibited activities, high-risk use case requirements, policy structure changes, and the distinction between B2B and B2C requirements.

[2] **Anthropic refuses to remove AI guardrails for the Pentagon - Tom's Hardware**
    URL: https://www.tomshardware.com/tech-industry/artificial-intelligence/claude-wont-be-allowed-to-engage-in-mass-surveillance-or-power-fully-autonomous-weapons-anthropic-refuses-to-lower-ai-guardrails-for-the-pentagon
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Details on the two "red lines" (mass domestic surveillance, fully autonomous weapons), Anthropic's refusal to modify policy for Pentagon, and CEO Dario Amodei's statement.

[3] **Anthropic CEO on AI red lines - CBS News**
    URL: https://www.cbsnews.com/news/pentagon-anthropic-dario-amodei-cbs-news-interview-exclusive/
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Direct quotes from Amodei on why autonomous weapons and mass surveillance remain prohibited, reasoning about AI reliability for lethal decisions.

[4] **Trump administration orders agencies to cease business with Anthropic - CNN**
    URL: https://www.cnn.com/2026/02/27/tech/anthropic-pentagon-deadline
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Consequences of policy enforcement, supply chain risk designation, six-month phaseout timeline, financial implications.

[5] **Anthropic Claude AI Vendor Risk Profile - Credo AI**
    URL: https://www.credo.ai/ai-vendor-directory/anthropic-claude
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: High-risk use case definitions, human-in-the-loop requirements, healthcare and legal application guidelines, governance recommendations.

[6] **Anthropic Bans CBRN Weapons Development - TechBuzz AI**
    URL: https://www.techbuzz.ai/articles/anthropic-bans-cbrn-weapons-development-as-ai-risks-escalate
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: CBRN-specific prohibitions, ASL-3 safeguards, technical enforcement layers including classifiers and access controls.

[7] **Exceptions to our Usage Policy - Claude Help Center**
    URL: https://support.claude.com/en/articles/9528712-exceptions-to-our-usage-policy
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Government exception criteria (five factors), which core restrictions remain unchanged, applicability to ASL-2 models.

[8] **Anthropic cracks down on unauthorized Claude usage - VentureBeat**
    URL: https://venturebeat.com/technology/anthropic-cracks-down-on-unauthorized-claude-usage-by-third-party-harnesses
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Consumer OAuth restrictions, prohibition on third-party harness access, technical safeguards against spoofing.
