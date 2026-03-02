# Synthesis Report

**Generated:** 2026-03-01T18:30:00Z
**Research files analyzed:** 62
**Total topics covered:** 62 leaf topics across 10 domains

## Cross-cutting Themes

The following concepts appear across 3+ topic areas and represent the connective tissue likely to be tested heavily on the exam.

### Token Management

- **Appears in:** context-management (all 6 topics), tool-use (8 topics), api-integration (6 topics), agents (6 topics), enterprise (cost-optimization), prompt-engineering (extended-thinking)
- **Core concept:** Tokens are the fundamental unit of Claude API billing, rate limiting, and context window constraints. Every API interaction is bounded by token counts for input, output, and thinking.
- **Why it matters:** Nearly universal across exam domains. Understanding token economics (counting, caching, budgeting, compaction) is prerequisite knowledge for cost optimization, agent design, and tool use architecture. Expect scenario questions requiring token cost calculations.

### Tool Execution Lifecycle

- **Appears in:** tool-use (all 8 topics), agents (basic-pattern, long-running, task-tool), api-integration (stop-reasons, streaming), context-management (budget-tracking)
- **Core concept:** The 4-step tool loop (define tools, Claude returns `tool_use`, execute and return `tool_result`, final response) with `stop_reason: "tool_use"` as the continuation signal. Parallel tool calls require all results in a single user message.
- **Why it matters:** Tool use is the foundation of agentic Claude applications. The execution flow, stop reasons, and result formatting rules appear in multiple domains and are prime candidates for "what happens when..." scenario questions.

### Prompt Caching

- **Appears in:** context-management (implementation, rate-limits), tool-use (web-search), enterprise (cost-optimization), api-integration (batching)
- **Core concept:** Cache breakpoints (`cache_control: {"type": "ephemeral"}`) enable reuse of tokenized input prefixes. 5-minute TTL, 1024-token minimum, 4 breakpoint limit. Cache reads cost 90% less than fresh tokenization.
- **Why it matters:** Critical for cost optimization questions. The interaction between caching and other features (batching, streaming, tools) creates nuanced scenarios. Expect questions on cache eligibility, breakpoint placement, and cost calculations.

### Extended Thinking

- **Appears in:** prompt-engineering (extended-thinking, thinking-tags), tool-use (tool-choice, strict-mode), context-management (budget-tracking), api-integration (streaming)
- **Core concept:** API-level chain-of-thought via `thinking: {"type": "enabled", "budget_tokens": N}`. Incompatible with `temperature`, `top_k`, `top_p`, forced tool use. Claude 4 models use summarized thinking. Streaming emits `thinking_delta` events.
- **Why it matters:** Extended thinking has specific incompatibilities that are perfect for exam "gotcha" questions. The distinction between manual `<thinking>` tags and API extended thinking, plus the budget_tokens constraints, are high-value test content.

### Stop Reason Handling

- **Appears in:** api-integration (stop-reasons, streaming), tool-use (execution-flow, pause-turn, parallel-tools), agents (basic-pattern, long-running)
- **Core concept:** Six stop reasons (`end_turn`, `tool_use`, `max_tokens`, `pause_turn`, `refusal`, `model_context_window_exceeded`) determine loop continuation logic. `pause_turn` requires passing response back as-is to continue server-side sampling.
- **Why it matters:** Stop reason handling is the branching logic of every agent loop. Questions will likely present scenarios asking "what should your code do when stop_reason is X?"

### System Prompt Architecture

- **Appears in:** prompt-engineering (structure, xml-tags), agents (subagents, specialization), claude-code (skills, hooks), evaluation (success-criteria)
- **Core concept:** The "contract" pattern: Role + Goals + Constraints + Fallback + Output Format. XML tags provide structure without canonical requirements. Position matters: documents top, instructions middle, queries bottom.
- **Why it matters:** System prompt design affects every Claude integration. The interplay between system prompts, subagent definitions, and skill creation represents a coherent design philosophy likely tested as a unified concept.

### Multi-Agent Orchestration

- **Appears in:** agents (all 6 topics), claude-code (skills, mcp), enterprise (deployment-patterns)
- **Core concept:** Subagents (hub-and-spoke, context isolation, no nested spawning via Task tool) vs Agent Teams (collaborative, shared task lists, direct messaging). Permission inheritance flows from parent to child.
- **Why it matters:** Multi-agent architecture decisions have significant cost and capability implications. Expect scenario questions asking "subagent or team?" based on coordination requirements.

### Domain Filtering and Content Governance

- **Appears in:** tool-use (web-search), safety-alignment (usage-policies, jailbreak-prevention), enterprise (deployment, workspaces)
- **Core concept:** Organization-level restrictions override request-level. `allowed_domains` and `blocked_domains` are mutually exclusive. VPC-SC blocks web search on Vertex AI. Constitutional classifiers enforce content policies.
- **Why it matters:** Enterprise deployments require understanding content governance layers. The hierarchy of restrictions (organization > request) and platform-specific limitations are testable details.

## Knowledge Gaps

| Topic ID | Topic Title | Gap Description | Sources Consulted | Severity |
|----------|-------------|-----------------|-------------------|----------|
| tool-use.parallel-tools.result-formatting | Parallel Result Formatting | Missing coverage of parallel tool use with extended thinking enabled (incompatibility confirmed but behavior details sparse) | [1] from topic's research | medium |
| context-management.compaction.usage | Compaction Usage | No concrete examples of compaction prompts or APIs; only conceptual coverage of when to trigger compaction | [1] from topic's research | medium |
| agents.agent-loops.long-running | Long-Running Agents | Missing guidance on checkpointing and crash recovery for multi-hour agent runs | [1], [2] from topic's research | high |
| agents.multi-agent.agent-teams | Agent Teams | Limited coverage of team cleanup edge cases and session resumption failures | [2] from topic's research | medium |
| evaluation.llm-judge.grading | Model-Based Grading | Missing comparison of grading accuracy across model tiers (Opus vs Sonnet as judges) | [1], [2] from topic's research | low |
| enterprise.deployment.cloud | Cloud Deployment | Missing Azure-specific deployment details; AWS Bedrock and Vertex AI well-covered but Azure coverage thin | [1], [2], [5] from topic's research | medium |
| safety-alignment.rlhf.multi-dimensional | Multi-Dimensional RLHF | Academic coverage only; no practical guidance on how multi-dimensional feedback affects API behavior | [1] from topic's research | low |
| multimodal.pdf.batch-processing | PDF Batch Processing | Missing token cost estimates for large PDF batch jobs; image token rules referenced but not PDF-specific | [1] from topic's research | medium |
| claude-code.mcp.tool-search | MCP Tool Search | No documentation on indexing latency or search ranking algorithms for large tool registries | [1], [2] from topic's research | low |
| prompt-engineering.few-shot.negative-examples | Negative Examples | Limited guidance on optimal negative-to-positive example ratios | [1], [2] from topic's research | low |

## Conflicting Information

### Extended Thinking Budget Minimum

- **Topics involved:** prompt-engineering.chain-of-thought.extended-thinking, api-integration.messages-api.request-format
- **Source citations:** [1] from extended-thinking research, [1] from request-format research
- **Conflict:** Extended thinking research states budget_tokens minimum is 1,024 for basic and 10,000 for claude-opus-4-5-20251101. Request format research mentions budget_tokens with no minimum documented.
- **Resolution:** The extended thinking research is the authoritative source. Minimum budget_tokens varies by model; 1,024 is the baseline, 10,000 for Opus 4.5+.

### Prompt Caching Minimum Token Threshold

- **Topics involved:** context-management.prompt-caching.implementation, enterprise.cost-optimization.caching
- **Source citations:** [1] from implementation research, [1] from cost-optimization research
- **Conflict:** Implementation research specifies 1,024 minimum tokens for cache eligibility. Cost optimization research mentions 2,048 minimum in some contexts.
- **Resolution:** 1,024 is the current minimum as of 2026. The 2,048 figure appears in older documentation and may reflect historical limits. Use 1,024 for exam purposes.

### Tool Definition Limit

- **Topics involved:** tool-use.tool-definitions.input-schemas, api-integration.messages-api.request-format
- **Source citations:** [1] from input-schemas research, [1] from request-format research
- **Conflict:** Input schemas research states maximum 128 tools per request. Request format mentions "up to 200 tools" in one passage.
- **Resolution:** Needs verification. The 128 limit appears more frequently across sources and should be treated as authoritative unless exam materials state otherwise.

### Web Search Citation Behavior

- **Topics involved:** tool-use.server-tools.web-search, multimodal.prompting.describe-answer
- **Source citations:** [1], [4] from web-search research
- **Conflict:** Web search documentation states citations are "always enabled" for web search. Other multimodal content suggests citation behavior is configurable.
- **Resolution:** Web search always includes citations (mandatory). Web fetch has optional citations. These are distinct tools with different default behaviors.

## Topic Relationships

### Dependency Graph

```
FOUNDATIONAL (learn first)
|
+-- api-integration.messages-api.request-format
|   +-- api-integration.messages-api.stop-reasons
|   +-- api-integration.streaming.events
|   +-- api-integration.batching.implementation
|   +-- api-integration.rate-limits.tiers
|       +-- api-integration.rate-limits.handling
|
+-- prompt-engineering.system-prompts.structure
|   +-- prompt-engineering.system-prompts.xml-tags
|   +-- prompt-engineering.few-shot.example-design
|   |   +-- prompt-engineering.few-shot.negative-examples
|   +-- prompt-engineering.chain-of-thought.thinking-tags
|       +-- prompt-engineering.chain-of-thought.extended-thinking
|
+-- context-management.token-limits.window-sizes
    +-- context-management.token-limits.token-counting
    +-- context-management.prompt-caching.implementation
    |   +-- context-management.prompt-caching.rate-limits
    +-- context-management.context-awareness.budget-tracking
        +-- context-management.compaction.usage

TOOL USE DOMAIN (requires: request-format, stop-reasons)
|
+-- tool-use.tool-definitions.input-schemas
|   +-- tool-use.tool-definitions.strict-mode
|   +-- tool-use.tool-choice.modes
|
+-- tool-use.client-tools.execution-flow
    +-- tool-use.client-tools.tool-results
    +-- tool-use.parallel-tools.result-formatting
    +-- tool-use.server-tools.pause-turn
        +-- tool-use.server-tools.web-search

AGENTS DOMAIN (requires: tool-use execution-flow, stop-reasons)
|
+-- agents.agent-loops.basic-pattern
    +-- agents.agent-loops.long-running
    +-- agents.agent-sdk.task-tool
        +-- agents.multi-agent.subagents
        +-- agents.multi-agent.agent-teams
        +-- agents.multi-agent.specialization

MULTIMODAL DOMAIN (requires: request-format)
|
+-- multimodal.vision.image-formats
|   +-- multimodal.vision.analysis-types
|   +-- multimodal.prompting.describe-answer
|
+-- multimodal.pdf.extraction
    +-- multimodal.pdf.batch-processing

SAFETY & ALIGNMENT (relatively independent)
|
+-- safety-alignment.constitutional-ai.methodology
|   +-- safety-alignment.constitutional-ai.2026-constitution
|
+-- safety-alignment.usage-policies.restrictions
+-- safety-alignment.jailbreak-prevention.classifiers
+-- safety-alignment.rlhf.multi-dimensional

EVALUATION (requires: system-prompts, few-shot)
|
+-- evaluation.success-criteria.definition
    +-- evaluation.rubrics.design
    |   +-- evaluation.rubrics.weighting
    +-- evaluation.llm-judge.grading
    +-- evaluation.console-tool.features

ENTERPRISE (requires: all foundational + cost topics)
|
+-- enterprise.workspaces.organization
|   +-- enterprise.workspaces.projects
|
+-- enterprise.cost-optimization.caching
|   +-- enterprise.cost-optimization.model-routing
|   +-- enterprise.cost-optimization.monitoring
|
+-- enterprise.deployment.cloud
    +-- enterprise.deployment.patterns

CLAUDE CODE (requires: agents, tools)
|
+-- claude-code.mcp.integration
|   +-- claude-code.mcp.connector
|   +-- claude-code.mcp.tool-search
|
+-- claude-code.skills.creation
|   +-- claude-code.skills.vs-mcp
|
+-- claude-code.hooks.configuration
+-- claude-code.ide.editors
```

### Independent Topics

The following topics can be studied in any order without prerequisites:

- `safety-alignment.constitutional-ai.methodology` (conceptual, no API dependency)
- `safety-alignment.usage-policies.restrictions` (policy knowledge)
- `safety-alignment.rlhf.multi-dimensional` (background knowledge)
- `prompt-engineering.prompt-chaining.task-decomposition` (design pattern, not API-specific)
- `evaluation.console-tool.features` (platform UI knowledge)

## Priority Rankings

| Priority | Topic ID | Topic Title | Rationale |
|----------|----------|-------------|-----------|
| critical | tool-use.client-tools.execution-flow | Tool Execution Flow | Core 4-step loop appears in every agent implementation; stop_reason branching is essential |
| critical | api-integration.messages-api.stop-reasons | Stop Reasons | Six stop reasons determine all continuation logic; appears across 12+ topics |
| critical | prompt-engineering.chain-of-thought.extended-thinking | Extended Thinking | High complexity, many incompatibilities, spans prompt engineering + tool use + streaming |
| critical | context-management.prompt-caching.implementation | Prompt Caching | Cost optimization centerpiece; interacts with batching, streaming, multi-turn |
| critical | tool-use.parallel-tools.result-formatting | Parallel Result Formatting | Common error source; strict ordering rules; single-message requirement |
| critical | agents.agent-loops.basic-pattern | Basic Agent Loop | Foundation for all agent topics; while-loop with stop_reason checks |
| high | tool-use.server-tools.pause-turn | Pause Turn Handling | Unique server-side behavior; 10-iteration limit; continuation pattern |
| high | tool-use.tool-choice.modes | Tool Choice Modes | auto/any/tool/none with extended thinking incompatibilities |
| high | context-management.token-limits.token-counting | Token Counting API | Free endpoint; essential for cost planning; SDK integration |
| high | prompt-engineering.system-prompts.structure | System Prompt Structure | "Contract" pattern foundation for all prompt design |
| high | agents.multi-agent.subagents | Subagents vs Teams | Key architectural decision; hub-and-spoke vs collaborative |
| high | api-integration.streaming.events | Streaming Events | SSE event types; thinking_delta; tool_use streaming |
| high | tool-use.server-tools.web-search | Web Search Tool | Server tool mechanics; domain filtering; encrypted content |
| high | api-integration.rate-limits.handling | Rate Limit Handling | Retry-After header; exponential backoff; tier-specific limits |
| medium | tool-use.tool-definitions.input-schemas | Input Schema Design | JSON Schema basics; description best practices |
| medium | prompt-engineering.system-prompts.xml-tags | XML Tags | Structural patterns; position sensitivity; no canonical tags |
| medium | context-management.context-awareness.budget-tracking | Budget Tracking | Proactive cost management patterns |
| medium | agents.agent-sdk.task-tool | Task Tool Spawning | SDK mechanism for subagents; allowedTools requirement |
| medium | multimodal.vision.image-formats | Image Formats | Supported formats; token calculation; size limits |
| medium | enterprise.cost-optimization.caching | Cost Optimization via Caching | Enterprise-scale caching strategies |
| medium | evaluation.rubrics.design | Rubric Design | LLM-as-judge grading; criteria specification |
| medium | safety-alignment.usage-policies.restrictions | Usage Restrictions | Acceptable use policy; content categories |
| medium | claude-code.skills.creation | Skill Creation | Markdown skill files; variable substitution |
| low | prompt-engineering.few-shot.negative-examples | Negative Examples | Supplementary technique; less common in practice |
| low | context-management.compaction.usage | Compaction Usage | Long-conversation optimization; conceptual |
| low | safety-alignment.rlhf.multi-dimensional | Multi-Dimensional RLHF | Background knowledge; no API exposure |
| low | claude-code.ide.editors | IDE Editors | Platform feature; VS Code, JetBrains integration |
| low | evaluation.console-tool.features | Console Tool Features | Platform UI knowledge; not API-related |

## Recommended Order

Study in this sequence, considering dependencies, exam weight, and foundational relationships:

1. **api-integration.messages-api.request-format** - Foundation: understand the basic API call structure
2. **api-integration.messages-api.stop-reasons** - Critical: six stop reasons drive all branching logic
3. **context-management.token-limits.window-sizes** - Foundation: understand context window constraints
4. **context-management.token-limits.token-counting** - High priority: free API for cost planning
5. **prompt-engineering.system-prompts.structure** - Foundation: "contract" pattern for all prompts
6. **prompt-engineering.system-prompts.xml-tags** - Builds on structure: practical formatting patterns
7. **tool-use.tool-definitions.input-schemas** - Foundation for tool use: JSON Schema design
8. **tool-use.client-tools.execution-flow** - Critical: the core 4-step tool loop
9. **tool-use.client-tools.tool-results** - Builds on execution-flow: result content types
10. **tool-use.parallel-tools.result-formatting** - Critical: common error source, strict rules
11. **tool-use.tool-choice.modes** - Builds on tool use: auto/any/tool/none modes
12. **tool-use.server-tools.pause-turn** - High priority: unique server behavior
13. **tool-use.server-tools.web-search** - High priority: server tool mechanics, domain filtering
14. **prompt-engineering.chain-of-thought.extended-thinking** - Critical: complex, many gotchas
15. **prompt-engineering.chain-of-thought.thinking-tags** - Complements extended thinking
16. **api-integration.streaming.events** - High priority: SSE events, thinking_delta
17. **context-management.prompt-caching.implementation** - Critical: cost optimization cornerstone
18. **context-management.prompt-caching.rate-limits** - Builds on caching implementation
19. **agents.agent-loops.basic-pattern** - Critical: foundation for agent architecture
20. **agents.agent-loops.long-running** - Builds on basic pattern: multi-hour agents
21. **agents.agent-sdk.task-tool** - Medium: SDK subagent spawning
22. **agents.multi-agent.subagents** - High priority: architectural decision framework
23. **agents.multi-agent.agent-teams** - Builds on subagents: collaborative patterns
24. **agents.multi-agent.specialization** - Builds on teams: role design
25. **api-integration.rate-limits.tiers** - Foundation for rate limit handling
26. **api-integration.rate-limits.handling** - High priority: retry logic
27. **api-integration.batching.implementation** - Medium: batch API mechanics
28. **multimodal.vision.image-formats** - Medium: format support, token calculation
29. **multimodal.vision.analysis-types** - Builds on image formats: use cases
30. **multimodal.prompting.describe-answer** - Builds on vision: prompting patterns
31. **multimodal.pdf.extraction** - Medium: PDF processing mechanics
32. **multimodal.pdf.batch-processing** - Builds on extraction: scale patterns
33. **context-management.context-awareness.budget-tracking** - Medium: proactive cost management
34. **context-management.compaction.usage** - Low priority: long-conversation edge case
35. **prompt-engineering.few-shot.example-design** - Medium: example construction
36. **prompt-engineering.few-shot.negative-examples** - Low: supplementary technique
37. **prompt-engineering.prompt-chaining.task-decomposition** - Independent: design pattern
38. **tool-use.tool-definitions.strict-mode** - Medium: schema enforcement
39. **evaluation.success-criteria.definition** - Medium: evaluation foundation
40. **evaluation.rubrics.design** - Medium: LLM-as-judge patterns
41. **evaluation.rubrics.weighting** - Builds on design: scoring mechanics
42. **evaluation.llm-judge.grading** - Builds on rubrics: judge prompting
43. **evaluation.console-tool.features** - Low: platform UI
44. **enterprise.workspaces.organization** - Medium: workspace structure
45. **enterprise.workspaces.projects** - Builds on organization: project management
46. **enterprise.cost-optimization.caching** - Medium: enterprise caching patterns
47. **enterprise.cost-optimization.model-routing** - Medium: model selection strategies
48. **enterprise.cost-optimization.monitoring** - Medium: usage tracking
49. **enterprise.deployment.cloud** - Medium: AWS/GCP/Azure deployment
50. **enterprise.deployment.patterns** - Builds on cloud: architecture patterns
51. **safety-alignment.constitutional-ai.methodology** - Independent: conceptual foundation
52. **safety-alignment.constitutional-ai.2026-constitution** - Builds on methodology: current rules
53. **safety-alignment.usage-policies.restrictions** - Medium: acceptable use
54. **safety-alignment.jailbreak-prevention.classifiers** - Medium: defense mechanisms
55. **safety-alignment.rlhf.multi-dimensional** - Low: background knowledge
56. **claude-code.mcp.integration** - Medium: MCP fundamentals
57. **claude-code.mcp.connector** - Builds on integration: connection patterns
58. **claude-code.mcp.tool-search** - Builds on MCP: discovery mechanisms
59. **claude-code.skills.creation** - Medium: skill file format
60. **claude-code.skills.vs-mcp** - Builds on creation: architecture comparison
61. **claude-code.hooks.configuration** - Low: lifecycle hooks
62. **claude-code.ide.editors** - Low: platform feature
