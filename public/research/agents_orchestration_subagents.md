# Subagent Orchestration

**Topic ID:** agents.orchestration.subagents
**Researched:** 2025-03-01T12:00:00Z

## Overview

Subagent orchestration is the practice of delegating specialized subtasks from a primary (lead or parent) agent to subordinate agents that operate under its coordination. This architectural pattern enables complex AI systems to decompose problems into manageable pieces, leverage specialized capabilities, and execute work in parallel when task dependencies allow.

The core value proposition is managing complexity: a single agent tasked with too many responsibilities becomes unreliable as instruction complexity increases. By assigning specific roles to individual subagents—a parser, a critic, a researcher—you build systems that are more modular, testable, and reliable. This mirrors microservices architecture in traditional software, where decomposition into specialized services improves maintainability and scalability.

The trade-off is significant: multi-agent systems typically consume 15× more tokens than single-agent approaches and introduce coordination overhead. The decision to use subagents should be justified by demonstrating that a single agent cannot reliably handle the task due to prompt complexity, tool overload, context window limits, or security requirements.

## Key Concepts

- **Orchestrator-Worker Pattern**: A lead agent coordinates while delegating to specialized subagents. The orchestrator analyzes queries, develops strategy, spawns subagents, and synthesizes results. This is the most common subagent architecture.

- **Task Decomposition**: Breaking complex problems into independent subtasks that can be assigned to specialized agents. Each subagent needs a clear objective, output format, tool/source guidance, and explicit task boundaries.

- **Parallel vs. Sequential Execution**: Parallel execution reduces latency when subtasks are independent; sequential execution is required when each step depends on the previous step's output. Hybrid approaches use sequential for initial processing and parallel for analysis phases.

- **Context Isolation**: Subagents maintain their own conversation history separate from the parent agent. This prevents context window overflow and allows each agent to focus on its specific domain.

- **Handoff Mechanism**: The transfer of control from one agent to another, implemented via tool calls (e.g., `transfer_to_agent(agent_name='target')`). Requires clear descriptions on target agents.

- **Fan-Out/Fan-In**: Spawning multiple subagents simultaneously (fan-out), then aggregating their results (fan-in). This resembles the scatter-gather cloud design pattern.

- **Scaling Effort by Complexity**: Match subagent count to task difficulty—simple fact-finding uses 1 agent with 3-10 tool calls; complex research may use 10+ subagents with divided responsibilities.

- **Aggregation Strategies**: Methods for combining parallel results—voting/majority-rule for classification, weighted merging for recommendations, or LLM-synthesized summaries for reconciling narratives.

## Technical Details

### When to Use Subagents

Use the subagent pattern when:
- Task complexity exceeds a single context window
- Parallel processing cuts latency by more than 50% (after accounting for coordination overhead)
- Three or more domains need contradictory optimizations
- Tasks require multiple perspectives to negotiate
- Security boundaries require isolation between different operations

Avoid subagents when:
- A single agent with tools can reliably handle the task
- Tasks are heavily dependent and sequential
- Domains require shared context across agents
- Resource constraints make parallel processing inefficient

### Implementation Approaches

**Workflow Agents (Google ADK pattern)**:
```python
# Sequential execution
SequentialAgent(sub_agents=[agent1, agent2, agent3])

# Parallel execution
ParallelAgent(sub_agents=[analyst1, analyst2, analyst3])

# Iterative refinement
LoopAgent(sub_agents=[generator, critic], max_iterations=5)
```

**Agent as Tool (Pydantic AI pattern)**:
```python
# Wrap agent in tool for controlled invocation
from pydantic_ai import AgentTool

research_tool = AgentTool(research_agent)
parent_agent = Agent(tools=[research_tool])
```

**LLM-Driven Delegation**:
```python
# Agent generates transfer call based on task analysis
# Requires clear descriptions on sub_agents
coordinator = LlmAgent(
    sub_agents=[billing_agent, support_agent],
    instruction="Route requests to appropriate specialist"
)
```

### Communication Patterns

1. **Shared Session State**: Parent writes to `session.state`, children read from it. Asynchronous, passive communication ideal for pipelines.

2. **Explicit Invocation**: Parent calls subagent like a tool, receives structured response. Synchronous, controlled.

3. **LLM Transfer**: Agent generates `transfer_to_agent()` call. Dynamic routing based on LLM interpretation.

### Cost and Performance

```
Single Agent:     ~1x tokens, ~1x latency
Multi-Agent:      ~15x tokens, ~0.1x latency (with parallelization)
```

Introducing parallel subagent spawning (3-5 simultaneously) with parallel tool calling (3+ tools per agent) can reduce research time by up to 90% for complex queries—but at significant token cost.

## Common Patterns

### Coordinator/Dispatcher
A central agent routes requests to specialized subagents. The coordinator classifies the task and delegates to the appropriate specialist without performing the work itself.

```
User Request → Coordinator → [Billing Agent | Support Agent | Technical Agent]
```

### Sequential Pipeline
Fixed execution order where each agent transforms the previous output:
```
Template Selection → Clause Customization → Compliance Review → Risk Assessment
```

### Parallel Fan-Out with Aggregation
Multiple agents analyze the same input simultaneously:
```
Stock Ticker → [Fundamental | Technical | Sentiment | ESG] → Synthesizer → Recommendation
```

### Maker-Checker Loop
Generator creates output; critic evaluates against criteria; cycle repeats until approval:
```
while not approved:
    draft = generator.run(context)
    feedback = critic.evaluate(draft)
    if feedback.approved:
        return draft
    context = feedback
```

### Hierarchical Decomposition
Multi-level agent trees where parent agents delegate to children, who may further delegate:
```
Research Lead
├── Market Analyst → [Competitor Agent, Pricing Agent]
├── Technical Analyst
└── Risk Analyst → [Regulatory Agent, Compliance Agent]
```

## Gotchas

1. **Vague Instructions Cause Duplication**: Instructions like "research the semiconductor shortage" result in subagents duplicating work. Each subagent needs explicit task boundaries and distinct responsibilities.

2. **Over-spawning**: Early implementations often spawn 50 subagents for simple queries. Scale effort to complexity—simple tasks need 1 agent, not 10.

3. **Synchronous Bottlenecks**: If lead agents execute subagents synchronously (waiting for completion before proceeding), you lose parallelism benefits. True async execution enables greater throughput but adds coordination complexity.

4. **Bad Tool Descriptions**: "Bad tool descriptions can send agents down completely wrong paths." Agents need explicit heuristics for tool matching and should examine available tools before execution.

5. **State Management**: Agents run for extended periods maintaining state. Systems must support error recovery without restarting from scratch and handle graceful degradation when tools fail.

6. **Context Growth**: Each agent adds reasoning, tool results, and outputs. Monitor accumulated context size and apply compaction (summarization, pruning) between agents to prevent exceeding model limits.

7. **Coordination Overhead**: Parallel processing cuts latency only when gains exceed coordination costs. The math only works with >50% latency reduction after accounting for overhead.

8. **Single Parent Rule**: An agent instance can only be added as a subagent once—shared agents across multiple parents create ambiguous ownership.

9. **Result Conflicts**: Parallel agents may return contradictory results. Define aggregation strategies upfront: voting for classification, weighted merging for recommendations, or LLM synthesis for narratives.

10. **Infinite Loops**: Handoff and iterative patterns can loop indefinitely. Implement iteration caps and fallback behaviors (escalate to human, return best result with warning).

## Sources

- [How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) — Anthropic's production architecture, parallel execution benefits (90% time reduction), token costs (15× more), and lessons learned from early failures
- [Multi-agent systems - Agent Development Kit](https://google.github.io/adk-docs/agents/multi-agents/) — Google ADK framework patterns: SequentialAgent, ParallelAgent, LoopAgent, communication mechanisms, and implementation best practices
- [AI Agent Orchestration Patterns - Azure Architecture Center](https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/ai-agent-design-patterns) — Microsoft's comprehensive guide to sequential, concurrent, group chat, handoff, and magentic orchestration patterns
- [Agents, Subagents, and Multi Agents: What They Are and When to Use Them](https://block.github.io/goose/blog/2025/08/14/agent-coordination-patterns/) — Block's Goose framework definitions and decision criteria for agent vs. subagent vs. multi-agent patterns
- [Multi-Agent Patterns - Pydantic AI](https://ai.pydantic.dev/multi-agent-applications/) — Five levels of complexity from single agent to deep agents, delegation strategies, and usage tracking across agents
