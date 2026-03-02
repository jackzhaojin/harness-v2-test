# Basic Agent Loop Pattern

**Topic ID:** agents.agent-loops.basic-pattern
**Researched:** 2026-03-01T12:00:00Z

## Overview

The basic agent loop pattern is the foundational architecture underpinning modern AI agents, from coding assistants like Claude Code to autonomous research systems. At its core, an agent is simply an LLM running in a loop with access to tools [1]. The pattern follows a cycle where the model reasons about a task, selects and executes tools, observes the results, and repeats until the objective is fulfilled or a stopping condition is reached [2].

This architecture has emerged as the dominant paradigm because of its remarkable simplicity and effectiveness. The "unreasonable effectiveness" of putting an LLM in a loop accounts for the proliferation of coding agents like Claude Code, Cursor, Windsurf, and GitHub Copilot [3]. The pattern requires no sophisticated frameworks—just an LLM API, some tools, and a while loop [4]. Despite this simplicity, the architecture handles complex, multi-step tasks by allowing the model to iteratively gather information, take actions, and refine its approach based on environmental feedback.

The pattern is also known by various names: the ReAct loop (Reasoning and Acting), the Thought-Action-Observation cycle, or simply the agentic loop [2][5]. Regardless of terminology, the core mechanism remains consistent: the agent operates autonomously within a controlled loop structure, using tools to interact with its environment while maintaining a conversation history that accumulates context over iterations.

## Key Concepts

- **Agent Loop** — The fundamental while-loop structure where an LLM repeatedly processes input, decides whether to call tools, executes those tools, and continues until completion or a stopping condition [1][3]. The loop naturally terminates when the model produces a response without tool calls.

- **Tool Calling** — The mechanism by which agents interact with their environment. When Claude responds, it includes a tool use block if it plans to invoke a tool, formatted as structured JSON with the tool name and arguments [6]. Tools are the primary building blocks of agent execution.

- **Thought-Action-Observation Cycle** — The three-phase iteration pattern: the model reasons about the current state (Thought), executes a tool or action (Action), and processes the result (Observation) before deciding the next step [2][5]. This cycle continues until the objective is met.

- **ReAct Framework** — A formalization of the agent loop that explicitly interleaves chain-of-thought reasoning with tool execution [5]. ReAct reduces hallucinations by grounding decisions in real tool outputs rather than relying solely on the model's parametric knowledge.

- **Context Accumulation** — Each iteration adds to the conversation history, allowing the agent to build understanding over time [3]. Tool outputs comprise approximately 67.6% of total tokens in agent conversations, making their design critical for context efficiency [4].

- **Stopping Conditions** — Safeguards that prevent unbounded execution, such as maximum iteration limits, confidence thresholds, or explicit completion signals from the model [1][5]. Production agents always include these controls.

- **Ground Truth** — Environmental feedback obtained at each step, such as tool execution results, code output, or API responses [1]. This real-world feedback enables agents to assess progress and adapt their approach.

## Technical Details

The canonical implementation of the agent loop is remarkably concise. The following pseudocode captures the essential pattern [3]:

```python
msg = user_input()
while True:
    output, tool_calls = llm(msg)
    print("Agent: ", output)
    if tool_calls:
        msg = [handle_tool_call(tc) for tc in tool_calls]
    else:
        msg = user_input()
```

A more production-ready TypeScript implementation shows the same structure [4]:

```typescript
while (!done) {
  const response = await callLLM();
  messages.push(response);
  if (response.toolCalls) {
    messages.push(
      ...(await Promise.all(response.toolCalls.map((tc) => tool(tc.args))))
    );
  } else {
    messages.push(getUserMessage());
  }
}
```

The loop operates through four key phases [6]:

1. **Gather Context** — The agent fetches and updates its context through searches, file reads, or subagent queries
2. **Take Action** — Execute tools, run bash commands, generate code, or call external services via MCPs
3. **Verify Work** — Evaluate outputs using rules-based feedback (linting), visual inspection, or LLM-as-judge
4. **Repeat** — Continue the cycle until the task succeeds or a stopping condition triggers

Tool responses follow a consistent pattern where JSON tool calls flow to execution environments and return results as plain text, feeding back into the next iteration [6]. This maintains predictability and enables the model to reason about outcomes.

## Common Patterns

**Single-Threaded Master Loop**: Production agents like Claude Code use a single main thread with one flat message list—no competing agent personas or complex orchestration [6]. This design prioritizes debuggability and reliability over architectural sophistication.

**Tool-First Architecture**: Effective agents expose purpose-built tools tailored to the agent's mental model rather than generic APIs [4]. For example, a coding agent might have specific tools for reading files, running tests, and searching code—not a single "execute any API" tool.

**Progressive Refinement**: Agents iterate through multiple rounds of tool calls, with each observation informing the next thought [2]. A weather agent might: (1) think about needing weather data, (2) call the weather API, (3) observe the results, (4) format a response. Complex tasks may require dozens of iterations.

**Verification-Driven Loops**: The most reliable agents incorporate verification at each step [6]. Code linting provides rules-based feedback; screenshot capture enables visual validation; subagent judges assess quality. Agents that can check and improve their own output self-correct before errors compound.

**Context Engineering**: Since tool outputs dominate the context window (~80% of tokens) [4], successful implementations filter irrelevant data from tool responses and format outputs for readability. The file system structure itself becomes a form of context engineering.

## Gotchas

**Self-Assessment Unreliability**: LLM agents often exit when they subjectively believe they are "complete" rather than when objectively verifiable standards are met [3]. The agent's confidence does not equal task completion. Always include external verification mechanisms.

**Error Propagation**: A misleading result from one tool observation can cascade through subsequent reasoning [5]. If an API returns incorrect data, the agent may confidently produce a wrong final answer. Implement sanity checks and consider retry logic for critical tool calls.

**Iteration Limits Matter**: Without explicit stopping conditions, agents can loop indefinitely or consume excessive resources [1]. Always set maximum iterations. Production agents typically cap at 10-50 iterations depending on task complexity.

**Tool Design is Critical**: Generic, overloaded tools shift cognitive burden to the agent [4]. A single "do anything" bash tool is less effective than purpose-built tools with clear, constrained interfaces. Invest as much effort in tool design as in prompt engineering.

**Context Window Exhaustion**: Long-running agent loops accumulate context that eventually exceeds model limits [6]. Implement context compaction strategies—summarization, selective history pruning, or checkpointing—before hitting limits.

**ReAct vs Function Calling Trade-off**: ReAct's explicit reasoning is more adaptable for complex scenarios but consumes more tokens than direct function calling [5]. Function calling is faster and cheaper for straightforward tasks. Choose based on task complexity.

**Single vs Multi-Agent**: While multi-agent architectures are popular in research, many production teams find that a simple single-threaded loop with good tools outperforms complex multi-agent setups [4]. Start simple; add complexity only when proven necessary.

## Sources

[1] **Building Effective Agents - Anthropic Research**
    URL: https://www.anthropic.com/research/building-effective-agents
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Core definition of agents as LLMs using tools in a loop, importance of ground truth feedback, stopping conditions, and tool design principles.

[2] **Understanding AI Agents through the Thought-Action-Observation Cycle - Hugging Face**
    URL: https://huggingface.co/learn/agents-course/en/unit1/agent-steps-and-structure
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Detailed breakdown of the Thought-Action-Observation cycle, Alfred weather agent example, explanation of how the while loop continues until objectives are fulfilled.

[3] **The Unreasonable Effectiveness of an LLM Agent Loop with Tool Use - Sketch.dev**
    URL: https://sketch.dev/blog/agent-loop
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Nine-line core implementation, explanation of why the pattern is so effective, mention of coding agents using this pattern, context accumulation mechanism.

[4] **The Canonical Agent Architecture: A While Loop with Tools - Braintrust**
    URL: https://www.braintrust.dev/blog/agent-while-loop
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: TypeScript implementation, three critical focus areas (tool design, context engineering, evaluation), token distribution statistics, architectural principles.

[5] **What is a ReAct Agent? - IBM**
    URL: https://www.ibm.com/think/topics/react-agent
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: ReAct framework definition, benefits (reduced hallucination, explainability, adaptability), comparison with function calling, implementation considerations.

[6] **Building Agents with the Claude Agent SDK - Anthropic**
    URL: https://claude.com/blog/building-agents-with-the-claude-agent-sdk
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Four-phase agent cycle (gather context, take action, verify, repeat), tool design principles, verification mechanisms, context management strategies.
