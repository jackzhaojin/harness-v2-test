# Common Product Patterns

**Topic ID:** enterprise.deployment.patterns
**Researched:** 2026-03-01T12:00:00Z

## Overview

Enterprise deployments of Claude typically follow one of four common product patterns: customer support copilots, internal knowledge assistants, IDE code assistants, and agentic workflow orchestrators. Each pattern represents a distinct architecture optimized for specific interaction styles, latency requirements, and integration depths [1][2].

The choice of pattern depends on several factors: whether the end user is a customer or employee, whether the workload is conversational or task-oriented, whether real-time responsiveness or deep reasoning matters more, and how much autonomy the AI should have [1]. Anthropic's guidance emphasizes starting simple and adding complexity only when it demonstrably improves outcomes [1]. Many enterprises begin with support copilots or knowledge assistants before graduating to more sophisticated agentic patterns.

These patterns are not mutually exclusive. Organizations often deploy multiple patterns simultaneously, using support copilots for customer-facing interactions, knowledge assistants for internal Q&A, IDE assistants for developer productivity, and orchestrators for complex back-office automation [3][6].

## Key Concepts

- **Customer Support Copilot** — An AI agent handling customer inquiries in real-time, providing 24/7 support, reducing wait times, and managing high support volumes with accurate responses [2]. Typically combines conversational AI with RAG for knowledge retrieval and tool use for actions like quote generation or order lookup.

- **Internal Knowledge Assistant** — An enterprise-focused assistant that answers employee questions by retrieving information from internal knowledge bases, wikis, and document repositories [4]. The dominant implementation pattern is RAG, not fine-tuning, because RAG keeps knowledge fresh, auditable, and easier to govern [4].

- **IDE Code Assistant** — A developer-focused tool that understands codebases, edits files, runs commands, and integrates with development workflows [5]. Claude Code operates through a client-server architecture running locally while communicating with Anthropic's API, available in terminal, IDE extensions, desktop app, and browser [5].

- **Agentic Workflow Orchestrator** — A system where LLMs dynamically direct their own processes and tool usage, operating in loops with environmental feedback [1]. Distinguished from workflows (predefined code paths) by the agent's autonomy in deciding next steps.

- **Workflow vs Agent** — Anthropic defines workflows as "systems where LLMs and tools are orchestrated through predefined code paths" versus agents as "systems where LLMs dynamically direct their own processes and tool usage" [1]. This distinction is fundamental to architecture selection.

- **RAG (Retrieval Augmented Generation)** — The standard pattern for grounding AI responses in enterprise data. Involves chunking documents, creating embeddings, storing in vector databases, and retrieving relevant context at query time [4][7].

- **Contextual Retrieval** — An advanced RAG technique that prepends chunk-specific context before embedding, reducing failed retrievals by 49% (or 67% with reranking) [7].

- **Agent Teams** — Multiple Claude Code instances working together with shared tasks, inter-agent messaging, and centralized management. Unlike subagents which only report back to the main agent, teammates can communicate directly with each other [8].

## Technical Details

### Model Selection by Pattern

Model selection varies significantly across patterns based on latency, cost, and intelligence requirements [2][3]:

| Pattern | Recommended Model | Rationale |
|---------|-------------------|-----------|
| Customer Support | Claude Haiku 4.5 | Optimizes latency for multi-turn RAG conversations |
| Knowledge Assistant | Claude Sonnet 4.5 | Balances reasoning quality with acceptable latency |
| IDE Code Assistant | Claude Sonnet 4.5 | Strong coding performance, reasonable speed |
| Agentic Orchestrator | Claude Opus 4.6 | Best for complex multi-step planning and tool calling |

### Customer Support Architecture

A production customer support implementation requires several components [2]:

```python
# Core tool definition pattern from Anthropic docs [2]
TOOLS = [
    {
        "name": "get_quote",
        "description": "Calculate the insurance quote based on user input",
        "input_schema": {
            "type": "object",
            "properties": {
                "make": {"type": "string"},
                "model": {"type": "string"},
                "year": {"type": "integer"},
                "mileage": {"type": "integer"},
                "driver_age": {"type": "integer"}
            },
            "required": ["make", "model", "year", "mileage", "driver_age"]
        }
    }
]
```

Key implementation steps [2]:
1. Break interaction into discrete tasks (greeting, product info, quote generation)
2. Define success criteria with measurable benchmarks
3. Build prompt with static context, examples, and guardrails
4. Add tool use for dynamic capabilities
5. Implement RAG for large knowledge bases (>200K tokens)

### RAG Implementation for Knowledge Assistants

For knowledge bases exceeding 200,000 tokens (approximately 500 pages), RAG becomes necessary [7]:

```
Ingestion Pipeline:
Documents → Chunking (with 10-20% overlap) → Contextual Embedding → Vector Store

Query Pipeline:
User Query → Embedding → Similarity Search → Top-K Retrieval → (Optional Reranking) → LLM Generation
```

Contextual Retrieval transformation example [7]:
- **Original chunk**: "The company's revenue grew by 3% over the previous quarter."
- **Contextualized**: "This chunk is from an SEC filing on ACME corp's performance in Q2 2023; the previous quarter's revenue was $314 million. The company's revenue grew by 3% over the previous quarter."

### Agentic Orchestration Patterns

Anthropic documents five workflow patterns of increasing complexity [1]:

1. **Prompt Chaining**: Sequential LLM calls where each processes the previous output
2. **Routing**: Classifying inputs to direct them toward specialized downstream tasks
3. **Parallelization**: Running multiple LLM instances simultaneously
4. **Orchestrator-Workers**: A central LLM dynamically delegates tasks to worker models
5. **Evaluator-Optimizer**: One LLM generates responses; another provides iterative feedback

For agent teams, the architecture includes [8]:
- **Team lead**: Creates the team, spawns teammates, coordinates work
- **Teammates**: Separate Claude Code instances working on assigned tasks
- **Task list**: Shared list of work items that teammates claim and complete
- **Mailbox**: Messaging system for inter-agent communication

## Common Patterns

### When to Use Each Pattern

**Customer Support Copilot** [2]:
- High volume of repetitive queries
- 24/7 availability requirement
- Rapid scaling during peak periods
- Need for consistent brand voice

**Internal Knowledge Assistant** [4]:
- Large internal documentation (>500 pages)
- Frequent policy/procedure questions
- Need for auditable, governed responses
- Heterogeneous document sources

**IDE Code Assistant** [5]:
- Codebase Q&A and exploration
- Bug fixes and feature implementation
- Automated testing and refactoring
- Git operations and PR creation

**Agentic Orchestrator** [1][8]:
- Complex tasks with unpredictable subtasks
- Work requiring parallel exploration
- Research and review workflows
- Cross-layer coordination (frontend/backend/tests)

### Pattern Selection Decision Tree

Start simple and add complexity only when needed [1]:

1. Can a single optimized LLM call handle it? Stop there.
2. Need external data? Add RAG.
3. Need real-time data or actions? Add tool use.
4. Need parallel work without inter-agent communication? Use subagents.
5. Need parallel work with agent-to-agent collaboration? Use agent teams.

### Subagents vs Agent Teams [8]

| Aspect | Subagents | Agent Teams |
|--------|-----------|-------------|
| Context | Own window; results return to caller | Own window; fully independent |
| Communication | Report results back to main agent only | Teammates message each other directly |
| Best for | Focused tasks where only the result matters | Complex work requiring discussion |
| Token cost | Lower (results summarized) | Higher (each is a separate instance) |

## Gotchas

- **RAG vs Context Window**: If your knowledge base is under 200,000 tokens, you can include it directly in the prompt without RAG [7]. Many teams over-engineer with RAG when direct context inclusion would suffice.

- **Framework Opacity**: Anthropic warns that frameworks can "obscure the underlying prompts and responses" and "incorrect assumptions about what's under the hood are a common source of customer error" [1]. Start with direct API calls before adopting frameworks.

- **Haiku vs Opus for Support**: While Opus 4.6 is more intelligent, Claude Haiku 4.5 is often better for support chat due to latency requirements, especially with multi-turn RAG conversations [2][3].

- **Tool Design Matters More Than Prompts**: Anthropic's SWE-bench agent required "more time optimizing our tools than the overall prompt" [1]. Invest in agent-computer interface (ACI) design equivalent to human-computer interface design.

- **Agent Teams Are Experimental**: As of early 2026, agent teams require explicit opt-in via `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` and have known limitations including no session resumption with in-process teammates [8].

- **Contextual Retrieval Cost**: While contextual embeddings provide the largest single improvement (+5-7 percentage points), they add a one-time ingestion cost of $1.02 per million document tokens [7].

- **Token Scaling in Teams**: Agent team token usage scales linearly with the number of active teammates. Start with 3-5 teammates for most workflows; beyond that, diminishing returns set in rapidly [8].

- **Workflow vs Agent Confusion**: Many teams implement agents when workflows would suffice. Use workflows for fixed, decomposable tasks; reserve true agents for open-ended problems where "you can't hardcode a fixed path" [1].

## Sources

[1] **Building Effective Agents - Anthropic Research**
    URL: https://www.anthropic.com/research/building-effective-agents
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Core definitions of workflows vs agents, five workflow patterns, three design principles, tool design best practices, framework guidance

[2] **Customer Support Agent - Claude API Docs**
    URL: https://platform.claude.com/docs/en/about-claude/use-case-guides/customer-support-chat
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Complete implementation guide for support chat, model selection, tool use patterns, success criteria, guardrail implementation, code examples

[3] **Claude Opus 4.6 on Microsoft Foundry - Azure Blog**
    URL: https://azure.microsoft.com/en-us/blog/claude-opus-4-6-anthropics-powerful-model-for-coding-agents-and-enterprise-workflows-is-now-available-in-microsoft-foundry-on-azure/
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Model capabilities for enterprise agentic workflows, sub-agent orchestration, parallel work patterns

[4] **Enterprise Knowledge Base with RAG - Xenoss**
    URL: https://xenoss.io/blog/enterprise-knowledge-base-llm-rag-architecture
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: RAG architecture patterns, why RAG over fine-tuning, context window management, GraphRAG for complex queries, hallucination prevention

[5] **Claude Code Overview - Claude Code Docs**
    URL: https://code.claude.com/docs/en/overview
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: IDE assistant architecture, capabilities, CLAUDE.md configuration, MCP integration, multi-surface availability, agent teams and subagents

[6] **Advanced Tool Use - Anthropic Engineering**
    URL: https://www.anthropic.com/engineering/advanced-tool-use
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Programmatic tool calling (37% token reduction), Tool Search Tool (85% token reduction), code orchestration vs inference decision framework

[7] **Contextual Retrieval - Anthropic News**
    URL: https://www.anthropic.com/news/contextual-retrieval
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Contextual embeddings technique, 49-67% reduction in failed retrievals, implementation steps, chunking best practices, when to use vs not use

[8] **Orchestrate Teams of Claude Code Sessions - Claude Code Docs**
    URL: https://code.claude.com/docs/en/agent-teams
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Agent team architecture, subagents vs teams comparison, task coordination, best practices, use case examples, limitations and experimental status
