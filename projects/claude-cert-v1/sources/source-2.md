# Prompt Engineering Best Practices for Claude

**Source:** https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering (redirects to https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview)
**Extraction ID Prefix:** EXT-2
**Extracted:** 2026-03-01T00:00:00Z

## Summary

Official Anthropic documentation covering comprehensive prompt engineering techniques for Claude's latest models (Opus 4.6, Sonnet 4.6, Haiku 4.5). This is the single authoritative reference for foundational prompting techniques, output control, tool use, thinking capabilities, and agentic systems. Key focus areas include clarity and directness, XML structuring, examples-based steering, thinking/reasoning optimization, and long-horizon autonomous agent workflows.

## Key Facts

- `EXT-2-fact-1`: Claude 4.6 models use adaptive thinking (`thinking: {type: "adaptive"}`) instead of manual thinking with `budget_tokens`
- `EXT-2-fact-2`: Prefilled responses on the last assistant turn are no longer supported starting with Claude 4.6 models
- `EXT-2-fact-3`: Claude Sonnet 4.6 defaults to an effort level of `high`, while Claude Sonnet 4.5 had no effort parameter
- `EXT-2-fact-4`: Claude Sonnet 4.6 and Claude 4.5 models feature context awareness, enabling the model to track its remaining context window throughout a conversation
- `EXT-2-fact-5`: Claude Opus 4.6 defaults to LaTeX for mathematical expressions, equations, and technical explanations
- `EXT-2-fact-6`: Claude's latest models have a more concise and natural communication style - more direct, conversational, and less verbose than previous models
- `EXT-2-fact-7`: Placing long documents and inputs near the top of prompts (above queries/instructions) can significantly improve performance by up to 30% in tests
- `EXT-2-fact-8`: Claude Opus 4.5 is particularly sensitive to the word "think" when extended thinking is disabled
- `EXT-2-fact-9`: The Agent SDK uses the Task tool (not Agent) to spawn sub-agents
- `EXT-2-fact-10`: For optimal Agent SDK sub-agent spawning: allowedTools must include 'Task', settingSources must be ['user', 'project'], and cwd must point to the harness root where .claude/agents/ lives
- `EXT-2-fact-11`: Claude Opus 4.6 does significantly more upfront exploration than previous models, especially at higher effort settings
- `EXT-2-fact-12`: Claude's latest models excel at parallel tool execution and will run multiple speculative searches, read files simultaneously, and execute bash commands in parallel
- `EXT-2-fact-13`: 3-5 examples provide best results for few-shot/multishot prompting
- `EXT-2-fact-14`: Claude Opus 4.6 has a strong predilection for subagents and may spawn them in situations where simpler approaches would suffice
- `EXT-2-fact-15`: Claude Opus 4.5 and Claude Opus 4.6 are more responsive to system prompts than previous models, which can cause overtriggering if prompts were designed to reduce undertriggering

## Definitions

- `EXT-2-def-1`: **Adaptive thinking** — A thinking mode where Claude dynamically decides when and how much to think based on the effort parameter and query complexity. Used with `thinking: {type: "adaptive"}`. In internal evaluations, adaptive thinking reliably drives better performance than extended thinking.
- `EXT-2-def-2`: **Effort parameter** — Controls thinking depth in Claude 4.6 models. Options are low, medium, high, or max. Replaces the budget_tokens approach from earlier models.
- `EXT-2-def-3`: **Context awareness** — Capability in Claude 4.6, 4.5, and Haiku 4.5 models that enables Claude to track its remaining context window (token budget) throughout a conversation
- `EXT-2-def-4`: **Interleaved thinking** — Extended thinking mode available in Claude Sonnet 4.6 where thinking can occur between tool uses and actions, not just at the beginning
- `EXT-2-def-5`: **Few-shot/multishot prompting** — Providing multiple examples (typically 3-5) to steer Claude's output format, tone, and structure
- `EXT-2-def-6`: **Prefilled responses** — Previously supported technique of adding assistant messages with partial content to force specific output formats. Deprecated in Claude 4.6 models on the last assistant turn.
- `EXT-2-def-7`: **Long-horizon reasoning** — Tasks requiring extended multi-step reasoning and state tracking, often spanning multiple context windows or task iterations

## Code Examples

### `EXT-2-code-1`: Basic role prompting with system message

```python
import anthropic

client = anthropic.Anthropic()

message = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=1024,
    system="You are a helpful coding assistant specializing in Python.",
    messages=[
        {"role": "user", "content": "How do I sort a list of dictionaries by key?"}
    ],
)
print(message.content)
```

### `EXT-2-code-2`: Multi-document structure with XML tags

```xml
<documents>
  <document index="1">
    <source>annual_report_2023.pdf</source>
    <document_content>
      {{ANNUAL_REPORT}}
    </document_content>
  </document>
  <document index="2">
    <source>competitor_analysis_q2.xlsx</source>
    <document_content>
      {{COMPETITOR_ANALYSIS}}
    </document_content>
  </document>
</documents>

Analyze the annual report and competitor analysis. Identify strategic advantages and recommend Q3 focus areas.
```

### `EXT-2-code-3`: Quote extraction for long document tasks

```xml
You are an AI physician's assistant. Your task is to help doctors diagnose possible patient illnesses.

<documents>
  <document index="1">
    <source>patient_symptoms.txt</source>
    <document_content>
      {{PATIENT_SYMPTOMS}}
    </document_content>
  </document>
  <document index="2">
    <source>patient_records.txt</source>
    <document_content>
      {{PATIENT_RECORDS}}
    </document_content>
  </document>
  <document index="3">
    <source>patient01_appt_history.txt</source>
    <document_content>
      {{PATIENT01_APPOINTMENT_HISTORY}}
    </document_content>
  </document>
</documents>

Find quotes from the patient records and appointment history that are relevant to diagnosing the patient's reported symptoms. Place these in <quotes> tags. Then, based on these quotes, list all information that would help the doctor diagnose the patient's symptoms. Place your diagnostic information in <info> tags.
```

### `EXT-2-code-4`: Migrating from extended thinking to adaptive thinking

```python
# Before (extended thinking, older models)
client.messages.create(
    model="claude-sonnet-4-5-20250929",
    max_tokens=64000,
    thinking={"type": "enabled", "budget_tokens": 32000},
    messages=[{"role": "user", "content": "..."}],
)

# After (adaptive thinking)
client.messages.create(
    model="claude-opus-4-6",
    max_tokens=64000,
    thinking={"type": "adaptive"},
    output_config={"effort": "high"},  # or max, medium, low
    messages=[{"role": "user", "content": "..."}],
)
```

### `EXT-2-code-5`: Claude Sonnet 4.6 with extended thinking (coding use cases)

```python
client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=16384,
    thinking={"type": "enabled", "budget_tokens": 16384},
    output_config={"effort": "medium"},
    messages=[{"role": "user", "content": "..."}],
)
```

### `EXT-2-code-6`: Claude Sonnet 4.6 with adaptive thinking (autonomous agents)

```python
client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=64000,
    thinking={"type": "adaptive"},
    output_config={"effort": "high"},
    messages=[{"role": "user", "content": "..."}],
)
```

### `EXT-2-code-7`: Claude Sonnet 4.6 without thinking (latency-sensitive)

```python
client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=8192,
    thinking={"type": "disabled"},
    output_config={"effort": "low"},
    messages=[{"role": "user", "content": "..."}],
)
```

### `EXT-2-code-8`: State tracking example with JSON

```json
// Structured state file (tests.json)
{
  "tests": [
    { "id": 1, "name": "authentication_flow", "status": "passing" },
    { "id": 2, "name": "user_management", "status": "failing" },
    { "id": 3, "name": "api_endpoints", "status": "not_started" }
  ],
  "total": 200,
  "passing": 150,
  "failing": 25,
  "not_started": 25
}
```

## Patterns and Best Practices

### General Principles

- `EXT-2-pattern-1`: **Be clear and direct** — Claude responds well to explicit instructions. Think of Claude as a brilliant but new employee who lacks context. If a colleague with minimal context would be confused by your prompt, Claude will be too.
- `EXT-2-pattern-2`: **Golden rule for clarity** — Show your prompt to a colleague with minimal context on the task and ask them to follow it. If they'd be confused, Claude will be too.
- `EXT-2-pattern-3`: **Add context to improve performance** — Providing context or motivation behind instructions (explaining WHY) helps Claude better understand goals and deliver more targeted responses
- `EXT-2-pattern-4`: **Use sequential steps** — Provide instructions as numbered lists or bullet points when order or completeness of steps matters
- `EXT-2-pattern-5`: **Examples should be relevant, diverse, and structured** — Mirror actual use cases, cover edge cases, and wrap in `<example>` tags (multiple examples in `<examples>` tags)
- `EXT-2-pattern-6`: **Structure prompts with XML tags** — XML tags help Claude parse complex prompts unambiguously. Use consistent, descriptive tag names and nest when content has natural hierarchy

### Output Control

- `EXT-2-pattern-7`: **Tell Claude what TO do instead of what NOT to do** — Instead of "Do not use markdown," say "Write in smoothly flowing prose paragraphs"
- `EXT-2-pattern-8`: **Use XML format indicators** — Example: "Write prose in `<smoothly_flowing_prose_paragraphs>` tags"
- `EXT-2-pattern-9`: **Match prompt style to desired output** — The formatting style in your prompt influences Claude's response style. Removing markdown from prompts can reduce markdown in outputs.
- `EXT-2-pattern-10`: **To minimize LaTeX output** — Add explicit instruction: "Format your response in plain text only. Do not use LaTeX, MathJax, or any markup notation such as \( \), $, or \frac{}{}. Write all math expressions using standard text characters."
- `EXT-2-pattern-11`: **For visibility into reasoning after tool calls** — Add: "After completing a task that involves tool use, provide a quick summary of the work you've done."

### Long Context

- `EXT-2-pattern-12`: **Put longform data at the top** — Place long documents and inputs near the top of prompts, above queries and instructions. Queries at the end can improve response quality by up to 30%.
- `EXT-2-pattern-13`: **Structure with document metadata tags** — Use `<documents>`, `<document index="n">`, `<source>`, and `<document_content>` tags for clarity with multiple documents
- `EXT-2-pattern-14`: **Ground responses in quotes** — For long document tasks, ask Claude to quote relevant parts first before carrying out the task. This helps Claude filter noise.

### Tool Use

- `EXT-2-pattern-15`: **Be explicit about desired actions** — Say "Change this function" or "Make these edits" instead of "Can you suggest changes" to ensure Claude takes action vs. only suggesting
- `EXT-2-pattern-16`: **For proactive Claude** — Add system prompt: "By default, implement changes rather than only suggesting them. If the user's intent is unclear, infer the most useful likely action and proceed."
- `EXT-2-pattern-17`: **For conservative Claude** — Add: "Do not jump into implementation unless clearly instructed. When intent is ambiguous, default to providing information and recommendations rather than taking action."
- `EXT-2-pattern-18`: **Dial back aggressive prompting** — Claude 4.6 models are more responsive to system prompts. Change "CRITICAL: You MUST use this tool when..." to "Use this tool when..."
- `EXT-2-pattern-19`: **Maximize parallel tool calling** — Add: "If you intend to call multiple tools with no dependencies, make all independent calls in parallel. Never use placeholders or guess missing parameters."
- `EXT-2-pattern-20`: **Reduce parallel execution** — Add: "Execute operations sequentially with brief pauses between each step to ensure stability."

### Thinking and Reasoning

- `EXT-2-pattern-21`: **Reduce overthinking** — Add: "When deciding how to approach a problem, choose an approach and commit. Avoid revisiting decisions unless you encounter new information that contradicts your reasoning."
- `EXT-2-pattern-22`: **Guide adaptive thinking triggering** — Add: "Extended thinking adds latency and should only be used when it will meaningfully improve answer quality - typically for problems requiring multi-step reasoning. When in doubt, respond directly."
- `EXT-2-pattern-23`: **Guide interleaved thinking** — Add: "After receiving tool results, carefully reflect on their quality and determine optimal next steps before proceeding."
- `EXT-2-pattern-24`: **Prefer general instructions over prescriptive steps** — A prompt like "think thoroughly" often produces better reasoning than hand-written step-by-step plans
- `EXT-2-pattern-25`: **Multishot examples work with thinking** — Use `<thinking>` tags inside few-shot examples to show Claude the reasoning pattern
- `EXT-2-pattern-26`: **Ask Claude to self-check** — Append "Before you finish, verify your answer against [test criteria]" to catch errors reliably

### Agentic Systems - Long Horizon

- `EXT-2-pattern-27`: **Context compaction awareness** — Add: "Your context window will be automatically compacted as it approaches its limit, allowing you to continue working indefinitely. Do not stop tasks early due to token budget concerns. Save progress to memory before context refreshes."
- `EXT-2-pattern-28`: **Multi-context window workflows** — Use the first context window to set up framework (tests, setup scripts), then use future windows to iterate on todo-list
- `EXT-2-pattern-29`: **Write tests in structured format** — Ask Claude to create tests before starting and track them in structured format (e.g., tests.json). Remind: "It is unacceptable to remove or edit tests as this could lead to missing functionality."
- `EXT-2-pattern-30`: **Set up quality of life tools** — Encourage Claude to create setup scripts (e.g., init.sh) to start servers, run test suites, and linters
- `EXT-2-pattern-31`: **Starting fresh vs compacting** — When context is cleared, consider starting with brand new context. Claude 4.6 models are extremely effective at discovering state from filesystem. Be prescriptive: "Call pwd; you can only read/write files in this directory. Review progress.txt, tests.json, and git logs."
- `EXT-2-pattern-32`: **Provide verification tools** — For long autonomous tasks, provide tools like Playwright MCP server or computer use capabilities for testing UIs
- `EXT-2-pattern-33`: **Encourage complete usage of context** — Add: "This is a very long task, so plan your work clearly. Spend your entire output context working on the task - just make sure you don't run out of context with significant uncommitted work."
- `EXT-2-pattern-34`: **Use structured formats for state data** — Use JSON or structured formats for test results, task status, and schema requirements
- `EXT-2-pattern-35`: **Use unstructured text for progress notes** — Freeform progress notes work well for tracking general progress and context
- `EXT-2-pattern-36`: **Use git for state tracking** — Git provides logs of what's been done and checkpoints. Claude 4.6 models excel at using git to track state across sessions.

### Agentic Systems - Safety and Autonomy

- `EXT-2-pattern-37`: **Balance autonomy and safety** — Add: "Consider reversibility and impact of actions. Take local, reversible actions freely (editing files, running tests), but ask before hard-to-reverse actions (deleting files/branches, force-push, posting to external services, dropping database tables)."
- `EXT-2-pattern-38`: **Research with structured approach** — For complex research: "Search for information in a structured way. Develop competing hypotheses. Track confidence levels in progress notes. Regularly self-critique your approach. Update hypothesis tree or research notes file."
- `EXT-2-pattern-39`: **Subagent orchestration** — Claude 4.6 has strong predilection for subagents. Guide with: "Use subagents when tasks can run in parallel, require isolated context, or involve independent workstreams. For simple tasks, sequential operations, single-file edits, or tasks needing shared state, work directly."
- `EXT-2-pattern-40`: **Minimize file creation** — Add: "If you create any temporary new files, scripts, or helper files for iteration, clean up by removing them at the end of the task."
- `EXT-2-pattern-41`: **Reduce overengineering** — Add detailed guidance: "Avoid over-engineering. Only make changes directly requested or clearly necessary. Keep solutions simple: don't add features beyond what was asked, don't add unnecessary documentation/comments, don't add defensive coding for impossible scenarios, don't create abstractions for one-time operations."
- `EXT-2-pattern-42`: **Avoid test-focused hard-coding** — Add: "Write high-quality, general-purpose solutions using standard tools. Do not create helper scripts or workarounds. Implement solutions that work for all valid inputs, not just test cases. Do not hard-code values. Understand problem requirements and implement correct algorithms."
- `EXT-2-pattern-43`: **Minimize hallucinations in agentic coding** — Add: "Never speculate about code you have not opened. If user references a specific file, you MUST read it before answering. Investigate and read relevant files BEFORE answering questions. Never make claims about code before investigating - give grounded, hallucination-free answers."

### Frontend and Design

- `EXT-2-pattern-44`: **Improve frontend aesthetics** — Focus on distinctive typography (avoid generic fonts like Arial/Inter), cohesive color themes using CSS variables, CSS-only animations with staggered reveals, and atmospheric backgrounds with layered gradients. Avoid the "AI slop" aesthetic of purple gradients on white, predictable layouts, and cookie-cutter design.
- `EXT-2-pattern-45`: **Vision capabilities enhancement** — Give Claude a crop tool or skill to "zoom" in on relevant regions of images. Consistent uplift seen on image evaluations with this technique.

### Migration-Specific

- `EXT-2-pattern-46`: **Frame instructions with modifiers** — Instead of "Create an analytics dashboard," use "Create an analytics dashboard. Include as many relevant features and interactions as possible. Go beyond the basics to create a fully-featured implementation."
- `EXT-2-pattern-47`: **Tune anti-laziness prompting** — If prompts previously encouraged thoroughness or aggressive tool use, dial back that guidance. Claude 4.6 models are significantly more proactive and may overtrigger on old instructions.
- `EXT-2-pattern-48`: **Structured Outputs for format control** — Use Structured Outputs feature instead of prefills for constraining Claude to specific schemas (JSON/YAML, classification patterns)
- `EXT-2-pattern-49`: **Direct instructions for preamble elimination** — Instead of prefills like "Here is the requested summary:", use system prompt: "Respond directly without preamble. Do not start with phrases like 'Here is...', 'Based on...', etc."
- `EXT-2-pattern-50`: **Continuations in user message** — Instead of prefills for continuations, move to user message: "Your previous response was interrupted and ended with `[previous_response]`. Continue from where you left off."

## Important Warnings

- `EXT-2-warn-1`: **Breaking change for Claude 4.6** — Prefilled responses on the last assistant turn are no longer supported. Must migrate to Structured Outputs, direct instructions, or tool calling for format control.
- `EXT-2-warn-2`: **Latency increase risk** — Claude Sonnet 4.6 defaults to `high` effort. If not explicitly set, may experience higher latency compared to Claude Sonnet 4.5. Recommend setting to `medium` for most applications and `low` for high-volume/latency-sensitive workloads.
- `EXT-2-warn-3`: **Overthinking and token inflation** — Claude Opus 4.6 does significantly more upfront exploration, especially at higher effort settings. This can inflate thinking tokens and slow responses. Add explicit constraints or lower effort setting if undesirable.
- `EXT-2-warn-4`: **Overtriggering on tools/skills** — Claude Opus 4.5 and 4.6 are more responsive to system prompts. Prompts designed to reduce undertriggering may now cause overtriggering. Dial back aggressive language.
- `EXT-2-warn-5`: **Excessive subagent spawning** — Claude Opus 4.6 has strong predilection for subagents and may spawn them for tasks where simpler approaches suffice (e.g., spawning subagents for code exploration when grep is faster).
- `EXT-2-warn-6`: **Overengineering tendency** — Claude Opus 4.5 and 4.6 may create extra files, add unnecessary abstractions, or build in flexibility that wasn't requested. Add specific guidance to keep solutions minimal.
- `EXT-2-warn-7`: **Hard-coding to pass tests** — Claude can focus too heavily on making tests pass at the expense of general solutions, or use workarounds instead of standard tools. Must explicitly guide toward general-purpose, principled implementations.
- `EXT-2-warn-8`: **Context window sensitivity** — For Claude Opus 4.5, the word "think" and its variants are particularly problematic when extended thinking is disabled. Consider alternatives like "consider," "evaluate," or "reason through."
- `EXT-2-warn-9`: **Destructive actions without confirmation** — Without guidance, Claude Opus 4.6 may take hard-to-reverse actions like deleting files, force-pushing, or posting to external services. Must add explicit guidance about confirming risky operations.
- `EXT-2-warn-10`: **Generic AI slop aesthetic** — Without guidance, Claude defaults to generic frontend patterns: overused fonts (Inter, Roboto), clichéd purple gradients, predictable layouts. Must provide explicit aesthetic guidance for distinctive design.
- `EXT-2-warn-11`: **Model string specification required** — For LLM-powered apps that need to specify model strings, must explicitly provide: "The exact model string for Claude Opus 4.6 is claude-opus-4-6."
- `EXT-2-warn-12`: **SDK integration requirements** — For Agent SDK sub-agent spawning to work: (1) allowedTools must include 'Task', (2) settingSources must be ['user', 'project'], (3) cwd must point to harness root where .claude/agents/ lives. Missing any requirement causes failure.

## Prompting Techniques Reference

### Before Prompt Engineering Checklist

- `EXT-2-pattern-51`: Have clear definition of success criteria for your use case
- `EXT-2-pattern-52`: Have empirical ways to test against those criteria
- `EXT-2-pattern-53`: Have a first draft prompt to improve
- `EXT-2-pattern-54`: Note that not every success criteria is best solved by prompt engineering (e.g., latency and cost are sometimes better improved by model selection)

### Model Self-Knowledge

- `EXT-2-pattern-55`: For correct self-identification: "The assistant is Claude, created by Anthropic. The current model is Claude Opus 4.6."
- `EXT-2-pattern-56`: For LLM-powered apps: "When an LLM is needed, please default to Claude Opus 4.6 unless the user requests otherwise. The exact model string for Claude Opus 4.6 is claude-opus-4-6."

### Effort Parameter Recommendations

- `EXT-2-pattern-57`: **Claude Sonnet 4.6 coding use cases** — Start with `medium` effort. Reduce to `low` if latency too high. Increase to `high` or migrate to Opus 4.6 if need higher intelligence.
- `EXT-2-pattern-58`: **Claude Sonnet 4.6 chat/non-coding** — Start with `low` effort with extended thinking. Increase to `medium` if need more depth.
- `EXT-2-pattern-59`: **When to use adaptive thinking** — Autonomous multi-step agents, computer use agents, or bimodal workloads (mix of easy and hard tasks). Start at `high` effort, scale down to `medium` if latency/tokens are concern.
- `EXT-2-pattern-60`: **When to use Opus 4.6 vs Sonnet 4.6** — Use Opus 4.6 for hardest, longest-horizon problems (large-scale code migrations, deep research, extended autonomous work). Use Sonnet 4.6 when fast turnaround and cost efficiency matter most.
