# Podcast: Agentic Patterns

**Episode Topic:** Agentic Patterns
**Estimated Duration:** 35 minutes
**Based on:** /Users/jackjin/dev/harness-v2-test/research/_combined_agents.md

---

## Opening

HOST: Imagine you're working on a huge refactoring task—one of those projects where you know it's going to take hours, maybe days. You start working with an AI coding assistant, and about 40 minutes in, it just... forgets what you were doing. Loses context. Starts suggesting things you already tried. Has this happened to you?

EXPERT: All the time! And it's not the AI being forgetful—it's actually a fundamental limitation. Language models are stateless. Each time you hit that context window limit, it's like waking up with amnesia. But here's the exciting part: teams at Anthropic, Google, and others have figured out patterns to work around this. We're going to talk about how modern AI agents can now work for hours—even days—without losing the thread.

HOST: Hours? Days? Okay, I need to understand how that's even possible. Before we get there, let's start with something I've been hearing about: "extended thinking." What is that, and why would I want my AI to think longer?

EXPERT: Great question. Extended thinking is basically giving Claude permission to reason internally before answering. Think of it like when someone asks you a complex question at work—you don't immediately blurt out the first thing that comes to mind. You pause, work through the problem step by step in your head, maybe consider a few approaches, then respond.

## Extended Thinking: When AI Needs to Pause

HOST: So instead of the AI just spitting out an answer immediately, it's... taking a breath?

EXPERT: Exactly. With extended thinking enabled, Claude creates these internal "thinking blocks" where it works through the problem. You might see it reasoning: "Okay, this is a math proof, so I need to start by assuming the opposite and look for a contradiction..." Then after that internal reasoning, it gives you the final answer.

HOST: That sounds useful for complex tasks. But I'm guessing there's a catch—doesn't that cost more?

EXPERT: Yes, and here's where it gets interesting. You're billed for all those thinking tokens, but with Claude 4 models, you only see a *summary* of the thinking. So Claude might use 10,000 tokens to reason internally, but you'll see maybe 500 tokens summarizing the key steps. You still pay for the full 10,000 though.

HOST: Hmm, so I'm paying for reasoning I can't even see?

EXPERT: Right. It's a trade-off. Anthropic summarizes the thinking partly for safety—they don't want people reverse-engineering the reasoning patterns—and partly because you usually don't need to see every single step. The important part is that Claude used that reasoning to give you a better answer.

HOST: Okay, but here's what I'm wondering: when should I actually use this? Should I just turn it on all the time?

EXPERT: No! And this is crucial. Extended thinking actually *hurts* performance on simple tasks. Anthropic's research showed up to a 36% degradation on intuitive questions when thinking was enabled. It's like overthinking a simple problem—sometimes your gut instinct is better than deliberating for five minutes.

HOST: So it's like that psychology thing where people perform worse at pattern recognition when they try to consciously analyze it?

EXPERT: Perfect analogy! Yes, exactly that. Extended thinking shines on multi-step reasoning: mathematical proofs, complex code debugging, strategic planning. But for quick lookups, creative writing, or simple questions, it's counterproductive.

## Budget Tokens and Adaptive Thinking

HOST: Alright, so let's say I've got a complex problem where thinking actually helps. How do I control how much the AI thinks?

EXPERT: You've got two approaches. The older way is setting a `budget_tokens` parameter—basically saying "you can use up to 10,000 tokens for thinking." The minimum is 1,024 tokens. But here's the evolution: newer models like Claude Opus 4.6 use what's called "adaptive thinking."

HOST: What's the difference?

EXPERT: With adaptive thinking, you don't set a specific budget. Instead, you give Claude an "effort" parameter with values like low, medium, high, or max. Claude dynamically decides how much thinking to do based on the problem's complexity.

HOST: So I'm saying "try hard" instead of "think for exactly 10,000 tokens"?

EXPERT: Exactly. And it's much more practical. Think about an AI agent working through a complex task—some steps are trivial, others require deep analysis. With adaptive thinking, Claude can cruise through the easy parts and really dig into the hard ones, instead of spending a fixed budget everywhere.

HOST: That makes sense. What's the recommended effort level?

EXPERT: For most coding work, "medium" is the sweet spot. It balances speed, cost, and quality. "High" is the default, but Anthropic actually recommends being explicit about using medium for day-to-day development. Use "max" only when you need the absolute deepest reasoning, and be prepared for significant token usage—it's only available on Opus 4.6.

HOST: And what about "low"? When would I use that?

EXPERT: High-volume, latency-sensitive tasks. Imagine you're processing hundreds of requests where you want some reasoning but can't afford the delay. Low effort triggers minimal thinking and skips it entirely for simple queries.

## Interleaved Thinking: The Real Game-Changer

HOST: Okay, I'm starting to see how thinking works. But earlier you mentioned agents working for hours. How does thinking fit into that?

EXPERT: This is where interleaved thinking comes in, and it's honestly one of the most important advances in the last year. Traditional extended thinking happens once at the beginning of a response. The model thinks, then acts. Interleaved thinking lets the model alternate: think, act, observe results, think again, act again.

HOST: So it's like a feedback loop?

EXPERT: Yes! It's called the ReAct pattern—Reasoning and Acting. Imagine Claude is debugging code. With regular thinking, it might reason: "I think the bug is in the authentication module." Then it reads the file and... that's it. With interleaved thinking, it reads the file, sees the actual code, and thinks: "Wait, the auth looks fine. Let me check the session handling instead." Then it reads *that* file, updates its hypothesis again, and keeps going.

HOST: That sounds way more powerful. Why wouldn't you always use interleaved thinking?

EXPERT: Cost and latency. Interleaved thinking means more thinking blocks spread throughout the task, which means more tokens. But for complex, multi-step tasks where the path isn't clear from the start, it's transformative.

HOST: Can you give me a concrete example?

EXPERT: Sure. Let's say Claude is trying to run your test suite but gets an error: "Database connection failed." With regular thinking, it might have decided upfront to run tests without considering prerequisites. With interleaved thinking, it sees the error, reasons: "I need to check if the database environment variables are set," uses a tool to check, sees they're missing, and then knows to look in the config files to understand what needs to be set.

HOST: So it's adapting its plan based on what actually happens, not just what it predicted would happen.

EXPERT: Exactly. And this is critical for real-world tasks where things don't always go as planned—which is basically everything in software development.

## State Management: The Memory Problem

HOST: Alright, this is starting to click. But there's still the elephant in the room: these models have a context window limit. You mentioned agents working for hours. How is that possible if they're going to hit the limit?

EXPERT: This is where state management becomes essential. Think of it as the difference between working memory and long-term memory in humans. Your working memory is limited—you can only hold so many things in your head at once. But you can write things down, take notes, and refer back to them.

HOST: So the AI is... taking notes?

EXPERT: Exactly! And there are several patterns. The simplest is maintaining progress files. Anthropic recommends having agents create files like `claude-progress.txt` where they log completed work, decisions made, and what's next.

HOST: That seems almost too simple. Does it actually work?

EXPERT: It works surprisingly well! Here's a typical pattern: the agent completes a feature, writes to the progress file: "Implemented user authentication using JWT. Decision: chose JWT over sessions for statelessness. Next: add password reset flow." When a new session starts—maybe tomorrow, maybe after the context fills up—the agent reads that file and immediately knows where it left off.

HOST: But wouldn't the AI sometimes write wrong information to that file? Like, hallucinate what it did?

EXPERT: Great catch! This is called "context poisoning," and it's a real problem. If incorrect information enters the progress file, it propagates to all future sessions. That's why good patterns include validation steps—like running the test suite before starting new work to confirm the codebase actually works.

## Git as a State Machine

HOST: Beyond progress files, what other state management patterns are there?

EXPERT: Here's a clever one: using git operations as memory primitives. There's a framework called the Git Context Controller that structures agent memory around commits, branches, and merges.

HOST: Wait, you're saying git isn't just for version control—it's actually a memory system for AI?

EXPERT: Think about what git gives you: every commit is a checkpoint you can return to. Branches let you explore alternatives without losing your main line of work. Merge operations synthesize different approaches. These are exactly the operations you want for agent memory!

HOST: Okay, walk me through how that works practically.

EXPERT: Imagine an agent working on a feature. It makes progress, commits with a descriptive message: "Add email validation to signup form." That's a checkpoint. Then it decides to try two different approaches to error handling. It creates two branches, explores each one in isolation. When one proves better, it merges that back to main. The git history becomes a complete record of the agent's decision tree.

HOST: And if something goes wrong, it can literally `git reset` to a known-good state?

EXPERT: Exactly. Plus, multiple agents can work in parallel—each in their own worktree—then merge results using standard git conflict resolution. It's a beautiful reuse of existing, battle-tested tools.

## Checkpointing and Recovery

HOST: That's clever. Are there more structured approaches for really long-running workflows?

EXPERT: Yes, proper checkpointing systems. These capture not just progress notes, but the full execution state: pending messages, tool call results, agent memory, everything. Think of it like saving your game.

HOST: And then you can load from that save point?

EXPERT: Right. This is critical for production systems where an agent might be running for hours and you can't afford to lose progress if something crashes. Frameworks like Microsoft's Agent Framework implement checkpointing at "supersteps"—logical boundaries where all concurrent work has completed.

HOST: How do you implement that? It sounds complicated.

EXPERT: At a basic level, you're serializing the agent's state to storage—could be in-memory for development, or something durable like a database for production. Agents implement hooks: `on_checkpoint_save` returns the state to save, and `on_checkpoint_restore` loads it back.

HOST: What goes into that state?

EXPERT: Typically the message history, current task context, tool call results, and any custom state variables your agent tracks. The key is you can resume from any checkpoint—if step 1,200 out of 1,500 fails, you can restart from there instead of beginning.

## Multi-Context Window Workflows

HOST: Okay, let's bring this all together. How do you actually design a workflow that lasts multiple hours across multiple context windows?

EXPERT: There's a battle-tested pattern Anthropic documented: split your work into an initializer session and subsequent coding sessions.

HOST: What does the initializer do?

EXPERT: It sets up infrastructure. The initializer creates an `init.sh` script—think of it like a development environment setup—creates the progress tracking file, generates a structured list of features to implement in JSON format, and makes an initial git commit documenting everything.

HOST: So it's like setting up a workspace before the real work begins?

EXPERT: Exactly. And this is crucial because subsequent sessions can be completely fresh. A new coding session starts, reads the git history and progress file, understands the current state, picks the highest-priority incomplete feature, and gets to work.

HOST: What about validation? How does it know the previous session didn't break something?

EXPERT: Great question. The pattern includes running the test suite before implementing anything new. This catches bugs introduced in prior sessions. If tests fail, fix them first, then continue.

HOST: That seems... rigorous. Is all this structure really necessary?

EXPERT: For production-quality results, yes. Anthropic's research showed that context compaction alone isn't enough. You need explicit state management. Without it, agents start duplicating work, losing track of decisions, and degrading in quality over time.

## Sub-Agents: Divide and Conquer

HOST: I want to shift gears a bit. You mentioned multiple agents working in parallel earlier. When does it make sense to use multiple agents instead of just one?

EXPERT: This is about managing complexity. There's a breaking point where a single agent trying to do too many things becomes unreliable. Think about it like microservices—instead of one monolithic agent with a hundred tools and conflicting instructions, you create specialized sub-agents.

HOST: What's a good example?

EXPERT: Anthropic's research system. They built an agent that does deep research on complex topics. Instead of one agent trying to search, analyze, synthesize, and format everything, they spawn specialized sub-agents: a search agent finds sources, an analysis agent evaluates them, a synthesis agent combines insights, and so on.

HOST: That sounds expensive though. How many more tokens are we talking?

EXPERT: About 15 times more tokens than a single-agent approach. But they cut research time by 90% on complex queries through parallelization.

HOST: Wow. So it's a huge speed-versus-cost tradeoff?

EXPERT: Yes. And the decision should be justified. You should only use sub-agents when a single agent genuinely can't handle the task—due to prompt complexity, context window limits, or the need for parallel execution.

HOST: What does "can't handle" mean practically?

EXPERT: If your single agent's instructions are becoming a multi-page document with conflicting priorities, that's a sign. If you need to analyze a hundred files in parallel, that's another. If you need to enforce security boundaries—like one agent can read sensitive data but another cannot—that's a third.

HOST: How do you avoid having the sub-agents duplicate work or contradict each other?

EXPERT: Clear task decomposition. Each sub-agent needs an explicit objective, output format, and task boundaries. Vague instructions like "research the topic" result in overlap. Better: "Agent 1: search for academic papers published 2020-2025. Agent 2: analyze competitor products. Agent 3: interview transcripts from industry experts." Each has a distinct domain.

## Orchestration Patterns

HOST: Are there common patterns for how you coordinate multiple agents?

EXPERT: Several. The simplest is the coordinator-dispatcher pattern. You have a central agent that routes requests to specialists. A user asks a question, the coordinator classifies it and hands it to the billing agent, support agent, or technical agent—whoever is best suited.

HOST: That's like a receptionist routing calls?

EXPERT: Perfect analogy. Another pattern is the sequential pipeline. Each agent transforms the previous output. For example, in contract generation: template selection, clause customization, compliance review, risk assessment—each step depends on the previous one.

HOST: And for parallel work?

EXPERT: Fan-out/fan-in. Multiple agents analyze the same input simultaneously. Say you're analyzing a stock: one agent does fundamental analysis, another technical analysis, a third sentiment analysis, a fourth ESG criteria. Then a synthesis agent aggregates their recommendations into a final decision.

HOST: What about iterative refinement? Like having an agent generate something and another agent critique it?

EXPERT: That's the maker-checker loop. A generator creates a draft, a critic evaluates it against criteria. If it passes, you're done. If not, the feedback goes back to the generator for another iteration. This is powerful for tasks where quality requirements are subjective or complex.

HOST: How do you prevent that from looping forever?

EXPERT: Set a maximum iteration count and implement fallback behavior—maybe escalate to a human, or return the best attempt with a warning. Infinite loops are a real risk with handoff patterns.

## Practical Implementation: The Claude Agent SDK

HOST: Let's get practical. If I want to build one of these systems, where do I start?

EXPERT: The Claude Agent SDK is the most direct path. It's Anthropic's official library for building agents in Python or TypeScript. The killer feature is that tool execution is built in—you don't write the tool use loop yourself.

HOST: What does that mean practically?

EXPERT: With the regular Anthropic API, you send a request, Claude says "I want to use tool X," you execute the tool, send results back, Claude decides what to do next—you're managing that loop manually. With the Agent SDK, you give it a prompt and configuration, and it handles the entire tool loop internally.

HOST: So it's less code?

EXPERT: Dramatically less. You get built-in tools immediately: Read, Write, Edit for files; Bash for running commands; Glob and Grep for searching; WebSearch and WebFetch for internet access. No custom implementation needed.

HOST: What about control? I don't want an AI running arbitrary bash commands on my system.

EXPERT: That's where permission modes come in. You've got several options. "Default" requires approval for everything. "AcceptEdits" auto-approves file operations but asks for other commands. "BypassPermissions" gives full autonomy. And "plan" mode is interesting—Claude can analyze and propose changes but can't execute anything.

HOST: Plan mode sounds useful for review workflows.

EXPERT: Exactly. You let Claude analyze a codebase, propose a refactoring plan, and present it to you for approval. Then you run a second pass with execution permissions to actually do the work.

## Hooks: Surgical Control

HOST: What if I need more granular control? Like, I want to auto-approve some operations but manually review others?

EXPERT: That's what hooks are for. Hooks are callback functions that run at specific lifecycle points. You can intercept actions before they execute, modify them, or block them entirely.

HOST: Give me an example.

EXPERT: Say you want to sandbox all file writes. You register a PreToolUse hook that fires before the Write tool executes. Your hook checks the file path, and if it's `/app/data/file.txt`, you modify it to `/sandbox/app/data/file.txt`. Claude thinks it's writing to the original location, but you've redirected it safely.

HOST: That's clever! What else can you do with hooks?

EXPERT: Audit logging—record every tool call to a database without blocking execution. Security policies—block any Bash command containing "rm -rf". Rate limiting—track API calls and deny requests that exceed quota. Input sanitization—validate and clean tool inputs before execution.

HOST: And you can chain multiple hooks?

EXPERT: Yes. They execute in order: rate limiter first to check limits, then auth check to verify permissions, then input sanitizer, then audit logger. Each hook can allow, deny, or pass to the next.

HOST: What happens if one hook says "allow" and another says "deny"?

EXPERT: Deny always wins. That's the safe default—if any hook blocks an action, it doesn't happen.

## Sessions: Conversation Continuity

HOST: Earlier we talked about managing state across context windows. How do sessions fit into this?

EXPERT: Sessions provide conversation continuity. Every time you start a query with the SDK, it creates a session and gives you a session ID. Store that ID, and you can resume the exact conversation later with full context.

HOST: How is this different from just starting a new query and telling it what happened before?

EXPERT: With session resumption, you get the complete conversation history, not a summary. Claude remembers every file it read, every analysis it did, every decision it made. It's truly picking up where it left off.

HOST: That sounds expensive though. You're sending the entire history every time?

EXPERT: Yes, you're paying for all those input tokens. That's why session management is a tradeoff: continuity versus cost. For long-running development sessions, it's worth it. For one-off queries, not so much.

HOST: Can you branch sessions? Like, try two different approaches from the same starting point?

EXPERT: Yes! That's session forking. You resume from a session ID with `fork_session: true`, and it creates a new branch. The original session stays intact, and you can explore alternatives without losing your baseline.

HOST: That's like git branches for conversations.

EXPERT: Exactly that parallel. You're seeing the pattern: these systems borrow heavily from version control concepts because they solve similar problems.

## Common Mistakes and Gotchas

HOST: We've covered a lot of ground. What are the most common mistakes people make with these patterns?

EXPERT: Number one: using extended thinking on everything. People turn it on globally and wonder why simple queries get slower and worse. Thinking should be task-specific.

HOST: What else?

EXPERT: Over-spawning sub-agents. Early implementations spawn 50 agents for simple queries. The right number of agents for a basic fact-finding task is one, not ten. Scale effort to complexity.

HOST: What about state management mistakes?

EXPERT: Context poisoning is huge. If hallucinated information gets into your progress file, it corrupts all future sessions. Always include validation—run tests, check git status, verify the state makes sense before continuing.

HOST: Any technical gotchas?

EXPERT: Several. With Claude 4 models, you're billed for full thinking tokens but only see summaries—your bill won't match the visible output. Budget tokens must be less than max tokens except with interleaved thinking. Changing budget_tokens invalidates your message cache. Cannot pre-fill responses when thinking is enabled.

HOST: That last one's interesting. Why not?

EXPERT: Pre-filling is where you start Claude's response with specific text to guide the format. It's incompatible with thinking because the model needs to generate thinking blocks first, and pre-filling disrupts that flow.

HOST: What about tool use restrictions?

EXPERT: Tool choice with thinking only supports "auto" or "none." You can't force a specific tool because forced tool use conflicts with the thinking process—Claude needs freedom to reason about which tool is appropriate.

HOST: Are there performance limitations?

EXPERT: Yes. Research shows agent performance degrades after about 35 minutes of human time on a task. Plan your sub-agent boundaries accordingly. And large thinking budgets over 32K tokens need batch processing to avoid HTTP timeouts.

## Long-Horizon Workflows: Putting It All Together

HOST: Let's talk about the big picture. If I'm designing a workflow that needs to run for hours, what's the architecture?

EXPERT: You're combining all these patterns. Start with an initializer that sets up state management infrastructure. Use adaptive thinking with medium effort for balanced performance. Enable interleaved thinking so Claude can adapt to tool results. Implement checkpointing at logical boundaries. Use progress files and git commits for persistent state. Spawn sub-agents only when genuinely needed for parallelization or complexity management.

HOST: And validation throughout?

EXPERT: Yes. Each session should validate the codebase works before implementing new features. Run test suites, check that development servers start, confirm the environment is sane. This catches issues early.

HOST: What about the context window itself? When do you compact versus starting fresh?

EXPERT: Modern SDKs like Claude Code auto-compact at 95% context capacity. But compaction alone isn't sufficient. You need structured handoffs—progress files, git history, feature lists. These transform a context reset from catastrophic memory loss into a routine transition.

HOST: How do you design those handoffs?

EXPERT: Think about what a new session needs to know. Current state: what's working, what's blocked. Completed work: features implemented, decisions made with reasoning. Learned context: environmental constraints, gotchas discovered, configuration requirements. Next steps: prioritized list of remaining tasks.

HOST: And you put all that in a markdown file?

EXPERT: Exactly. Simple, human-readable, version-controlled. When a fresh session starts, it reads that file and immediately understands the project's state. It's not trying to reconstruct everything from conversation history—it's reading explicit documentation.

## The Real-World Impact

HOST: Let me ask you this: we've talked about agents running for hours or days. What does that actually enable that wasn't possible before?

EXPERT: Large-scale refactoring that would take a human days or weeks. Comprehensive test coverage across a codebase. Multi-day research projects with dozens of sources. Autonomous debugging where the agent can try approaches, hit dead ends, backtrack, and eventually solve complex issues without constant human intervention.

HOST: But there's still human oversight, right?

EXPERT: Absolutely. These patterns enable *autonomy*, not total independence. Humans set goals, review progress at checkpoints, approve major decisions, and intervene when agents get stuck. Think of it like managing a junior developer—you give them complex tasks, check in periodically, and provide guidance when needed.

HOST: That's a helpful frame. What about reliability? Can I trust an agent to work overnight?

EXPERT: With proper error handling, checkpointing, and validation, yes. The agent might hit errors, but with interleaved thinking and state management, it can recover, backtrack, and try alternatives. And because of checkpointing, you never lose progress—you can always resume from the last good state.

HOST: What's the most impressive real-world example you've seen?

EXPERT: Anthropic documented an agent that ran for over two hours porting files using a hierarchical todo list system. The main agent delegated to specialized sub-agents—a precommit runner, git commit handler, rebaser. Each had a focused job with explicit delegation instructions. The main conversation stayed clean because verbose output happened in sub-agent contexts.

HOST: And that actually worked reliably?

EXPERT: According to their documentation, yes. But notice the patterns: clear task decomposition, specialized sub-agents, state isolation, persistent todos, validation steps. It's not magic—it's careful engineering.

## Wrap-Up

HOST: Alright, we've covered a ton. Let me try to summarize what we learned. You use extended thinking for complex, multi-step reasoning but avoid it for simple tasks because it actually makes things worse. Adaptive thinking with effort levels is the modern approach instead of manual token budgets. Interleaved thinking lets agents react to tool results instead of planning everything upfront.

EXPERT: That's a great summary of the thinking side.

HOST: For long-running workflows, state management is essential: progress files, git history, checkpointing. You can't rely on context windows alone. Sub-agents are powerful for parallel work or complex decomposition, but they cost 15x more tokens, so use them deliberately. The Claude Agent SDK gives you built-in tools and orchestration, with hooks for surgical control and sessions for conversation continuity.

EXPERT: Perfect. Let me add a few key takeaways for listeners:

First: Match the pattern to the problem. Don't use extended thinking for simple queries. Don't spawn ten sub-agents when one will do. Don't maintain session state when a one-shot query would work.

Second: Validation is not optional. For long-running workflows, run tests before starting new work. Verify file citations before applying memories. Check that the environment is sane before continuing.

Third: State management transforms feasibility. What used to be impossible—agents working for hours across context resets—is now practical with progress files, git checkpoints, and explicit handoffs.

Fourth: The tradeoffs are real. Extended thinking costs tokens. Sub-agents multiply cost by 15x. Sessions accumulate input tokens. Choose based on the value you're getting, not just because the capability exists.

HOST: This has been incredibly helpful. I feel like I actually understand how these systems work now, and more importantly, when to use each pattern. Thanks for breaking it all down.

EXPERT: My pleasure. These patterns are evolving fast, but the core principles—managing state, structuring reasoning, decomposing complexity—those are fundamental. Master those, and you'll be able to build agents that are genuinely useful for real work.

HOST: And that's the dream, right? AI that doesn't just answer questions but actually gets complex work done reliably.

EXPERT: That's the dream. And we're a lot closer than people realize.
