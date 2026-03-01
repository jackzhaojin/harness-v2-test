HOST: Okay, so I've been using Claude Code for a while now, and I keep hearing about all these... agentic patterns. Extended thinking, interleaved reasoning, multi-context workflows. And honestly? I don't really get what makes them different from just, you know, talking to Claude.

EXPERT: Right, right. So here's the thing—when you're just chatting with Claude, you're getting one shot at a response. But when you're building actual agents? You need them to do stuff over time. And that's where it gets wild.

HOST: Wild how?

EXPERT: Okay, let me paint you a picture. You know how when you're solving a hard problem, you don't just blurt out the answer? You think it through, right? You test ideas, maybe write some scratch work—

HOST: Yeah, of course.

EXPERT: That's extended thinking. It's literally giving Claude space to work through problems step-by-step before responding. So instead of just getting "here's the answer," you get "let me reason through this... okay, if I try approach A, that won't work because X... but approach B handles that edge case... alright, here's what I think."

HOST: Wait, so Claude is like... showing its work?

EXPERT: Exactly! But here's where it gets interesting. In the API, there's this `thinking` parameter. You can give Claude a token budget—like, "hey, you can use up to 10,000 tokens just for reasoning"—and it'll create these thinking blocks before the actual response.

HOST: Huh. That's... actually kind of wild. So it's not just generating an answer, it's genuinely working through it.

EXPERT: Yeah! And this is the part that surprised me when I first learned about it—extended thinking doesn't always help.

HOST: What do you mean?

EXPERT: So, research shows that on intuitive tasks, extended thinking can actually hurt performance. By up to 36 percent.

HOST: Get out of here. Seriously?

EXPERT: I'm serious! Think about it like this—you know when someone asks you what color the sky is, and you just know it's blue? If you start deliberating about it, like "well, technically it's the scattering of light, and at sunset it's orange, and in space it's black"... you're overthinking a simple question.

HOST: Oh! Oh, that's interesting. So it's like... the AI equivalent of choking under pressure?

EXPERT: Exactly. The model performs worse when you force it to deliberate on things it can pattern-match instantly. Quick lookups, creative writing, simple questions—these actually get worse with extended thinking.

HOST: So when do you want it?

EXPERT: Multi-step reasoning. Mathematical proofs, complex coding problems, strategic planning. Anything where you genuinely need to explore alternatives and verify conclusions.

HOST: Okay, okay, this is making sense. But then what's adaptive thinking? Because I keep seeing that term everywhere.

EXPERT: Right, so—adaptive thinking is basically Claude saying "I'll figure out how much thinking I need." Instead of you manually setting a token budget, you just tell it `type: "adaptive"` and it decides based on the complexity of the request.

HOST: Oh, that's way easier.

EXPERT: Way easier. And it comes with this other parameter called effort—low, medium, high, or max. It's like telling Claude how much you want it to... try.

HOST: Wait, wait, wait—are you saying I can tell an AI to try harder?

EXPERT: Yes! And it actually works. Low effort means minimal thinking, skip simple stuff. High effort means always think deeply. It changes how many tool calls Claude makes, how thoroughly it explains things, all of that.

HOST: Huh. Okay, so if I'm doing something quick and I don't want to burn a ton of tokens, I'd use low effort. But if I'm debugging some gnarly authentication bug, I'd crank it up to high?

EXPERT: Or max, if you're on Opus 4.6. Max is basically "no constraints, think as much as you need."

HOST: That's only on Opus though?

EXPERT: Yeah, max effort is Opus 4.6 exclusive. Other models will throw an error if you try it.

HOST: Alright, so we've got extended thinking, adaptive thinking, effort levels. But you mentioned interleaved thinking earlier. What's that?

EXPERT: Oh man, this is the cool one. This is where it all comes together.

HOST: I'm listening.

EXPERT: So traditionally, when an agent uses tools—like running a command or calling an API—it would think once at the beginning, decide what to do, execute all the tools, and then respond. But interleaved thinking lets it think between tool calls.

HOST: Why does that matter?

EXPERT: Because the real world doesn't go according to plan! Let's say Claude runs a shell command and it fails. Without interleaved thinking, it can't reason about the error mid-execution. It's just stuck. But with interleaved thinking? It reads the error, thinks "oh, that didn't work because the table name is wrong," adjusts, and tries again.

HOST: So it's like... plan, act, reflect, repeat?

EXPERT: Yes! That's actually the ReAct pattern—Reasoning and Acting. The model alternates between internal reasoning and external actions, updating its plan based on what it learns.

HOST: That sounds way more useful than just running everything blind and hoping it works.

EXPERT: Oh, absolutely. The benchmarks are wild. MiniMax's M2 model showed a 40 percent improvement on web browsing tasks when interleaved thinking was enabled. On coding benchmarks like SWE-Bench, it was a few percent, but still measurable.

HOST: Okay, so how do you actually use it?

EXPERT: In Claude, you enable it with a beta header—`interleaved-thinking-2025-05-14`—or if you're on Opus 4.6, it's automatic with adaptive thinking. The key thing is that when you get thinking blocks in the API response, you have to pass them back unmodified when you continue the conversation.

HOST: Why?

EXPERT: Because that's how Claude maintains reasoning continuity. Those thinking blocks have a signature field—like cryptographic verification—so Claude knows they're legit. If you strip them out or modify them, the reasoning chain breaks.

HOST: Huh. So it's like... the thinking blocks are part of the conversation state.

EXPERT: Exactly. Which brings us to state management.

HOST: Oh boy.

EXPERT: Yeah, so—LLMs are stateless. Claude doesn't remember anything between sessions unless you explicitly manage state.

HOST: Right, right, that makes sense. It's not like it has a database of our past chats.

EXPERT: Exactly. So if you're building an agent that works on a task for, say, two hours, across multiple sessions, you need to handle that yourself.

HOST: How do people do that?

EXPERT: A bunch of ways. The most common is progress files. Like, literally a markdown file that says "here's what I've done, here's what's left, here's what I learned."

HOST: Wait, that's it? Just... notes?

EXPERT: I mean, think about it—if you had to hand off work to a coworker, what would you give them? You'd write down what you did, what worked, what didn't, what's next. Same idea.

HOST: Okay but that feels... low-tech?

EXPERT: It is! But it works. Anthropic's own research shows that unstructured progress notes are one of the most effective patterns for long-running agents. They call it `NOTES.md` or `progress.md`, and agents just maintain it outside the context window.

HOST: So when a new session starts, the agent reads the notes and picks up where it left off.

EXPERT: Yep. You can also use git history—commit messages are basically checkpoints. Or structured formats like JSON feature lists. Or even full-on vector databases for cross-session knowledge.

HOST: I feel like the git approach is really clever. Because you get branches, merges, all that version control stuff for free.

EXPERT: Right? There's this whole framework called Git Context Controller that treats git operations as primitives for agent memory. COMMIT for checkpoints, BRANCH for isolated exploration, MERGE to synthesize work. It's basically applying software engineering patterns to agent state.

HOST: That's actually kind of beautiful.

EXPERT: It is! But here's the gotcha—state invalidation.

HOST: Uh oh.

EXPERT: Yeah. So let's say you store a memory like "the API version is set in line 47 of config.yaml." But then someone changes the file. Now that memory is stale. If the agent applies it, it's using outdated information.

HOST: Oh no.

EXPERT: GitHub Copilot ran into this exact problem. Their solution was citation-based verification. Every memory includes a reference—file path, line number—and before using it, they verify it still matches. If not, they discard or update the memory.

HOST: So the memory heals itself over time.

EXPERT: Exactly. The A/B tests showed a 7 percent improvement with verification turned on.

HOST: Huh. Okay, so you've got your state management, you've got your thinking... what happens when you hit the context window limit?

EXPERT: Oh man, that's the multi-context workflow problem.

HOST: I'm not gonna lie, that took me a second to wrap my head around.

EXPERT: So the issue is that context windows are finite, right? Even with 200K tokens, if you're working on a big project for hours, you'll eventually fill it up.

HOST: Yeah.

EXPERT: The naive approach is to just start a new session and lose everything. But that's terrible—the agent forgets what it did, repeats work, makes mistakes.

HOST: So what's the smart approach?

EXPERT: Compaction. You summarize the conversation when you're near the limit, and you start a fresh context with that summary. Claude Code actually does this automatically at 95 percent capacity.

HOST: Does that work well?

EXPERT: It helps, but it's not enough. You also need external state—those progress files we talked about—and a structured handoff protocol.

HOST: Handoff protocol?

EXPERT: Yeah, like an init script that sets up the environment, runs tests to validate everything still works, reads the progress log to understand what's been done, and then continues.

HOST: So it's like onboarding a new team member.

EXPERT: That's the perfect analogy. You're onboarding a new session. And one of the really clever patterns is using an initializer agent for the first session.

HOST: What's that do?

EXPERT: Its whole job is setup. It creates the init script, the progress file, the feature list, makes the first git commit. It doesn't implement anything—it just sets the stage for all the future coding agents.

HOST: Oh! Oh, that's smart. Because then every subsequent session has the infrastructure it needs.

EXPERT: Exactly. And those coding agents follow a ritual: run `pwd` to see where you are, read git logs and progress files, pick the next feature, validate the codebase works, implement incrementally, commit, update docs.

HOST: That sounds really structured.

EXPERT: It has to be. Research shows agent performance degrades after about 35 minutes of human time on a task. So you need to design around that.

HOST: Wait, 35 minutes? That's not very long.

EXPERT: No! Which is why you don't want one agent doing everything. You want sub-agents.

HOST: Here we go. I knew we'd get to this.

EXPERT: Okay, okay, so—subagent orchestration is basically delegation. You have a lead agent that breaks down the task and spawns specialized subagents to handle pieces.

HOST: Like a manager delegating to their team.

EXPERT: Exactly. And each subagent has its own context window, its own tools, its own job. So the lead agent doesn't get overwhelmed with verbose output—test failures, build logs, all that happens in the subagent's context.

HOST: That actually makes a lot of sense. But doesn't that use way more tokens?

EXPERT: Oh yeah. Like 15 times more.

HOST: Fifteen?!

EXPERT: Yeah, multi-agent systems are expensive. But the tradeoff is that they can run for way longer and handle way more complexity. Anthropic's research system uses parallel subagents and cuts research time by 90 percent on complex queries.

HOST: Ninety percent!

EXPERT: Ninety percent. But again—15x the tokens. So you only do it when a single agent genuinely can't handle it.

HOST: Okay, so when do you use subagents?

EXPERT: When task complexity exceeds a single context window. When parallel processing would cut latency by more than 50 percent after overhead. When you need contradictory optimizations—like one agent needs to be creative, another needs to be precise.

HOST: So it's not a default pattern.

EXPERT: No, no. You start with a single agent. If it can't handle it reliably, then you decompose.

HOST: Alright, so let's say I'm building a subagent system. How do I actually implement it?

EXPERT: There are a few patterns. The simplest is just tools—you wrap an agent as a tool, and the parent agent can invoke it like any other function.

HOST: Huh.

EXPERT: Or you can use frameworks like Google's ADK, which has SequentialAgent, ParallelAgent, LoopAgent. You compose workflows declaratively.

HOST: LoopAgent sounds interesting.

EXPERT: That's the maker-checker pattern. You have a generator agent that creates output, and a critic agent that evaluates it. They loop until the critic approves.

HOST: Oh, I like that. Like iterative refinement.

EXPERT: Exactly. And you can cap the iterations so it doesn't loop forever.

HOST: Yeah, I was gonna say—what if it never approves?

EXPERT: You hit the cap and return the best result with a warning. Or escalate to a human.

HOST: Okay, so we've got thinking, state management, multi-context workflows, subagents. Is there anything else I'm missing?

EXPERT: The SDK!

HOST: Oh right, the Agent SDK.

EXPERT: So the Claude Agent SDK is basically "all of this, but programmable." It gives you the same tools Claude Code uses—Read, Write, Edit, Bash, Grep, Glob—but you can call them from Python or TypeScript.

HOST: So I can build my own Claude Code?

EXPERT: Basically, yeah. And the cool part is that tool execution is built in. You don't have to implement the tool loop yourself—you just call `query()`, and Claude figures out which tools to use, executes them, observes results, and continues.

HOST: That sounds way easier than doing it manually.

EXPERT: It is. And you can configure permissions—like, do I auto-approve file edits? Do I require user confirmation for everything? Do I only allow read-only tools?

HOST: Oh, that's useful for security.

EXPERT: Super useful. There's a permission mode called `bypassPermissions` that auto-approves everything, but you have to be careful because it applies to subagents too.

HOST: Meaning subagents get full access?

EXPERT: Yep. They might have different system prompts and less constrained behavior, so if you're not careful, they can do stuff you didn't intend.

HOST: Yikes. Okay, noted.

EXPERT: And then there's hooks, which are callbacks that run at specific lifecycle points. Before a tool executes, after it succeeds, when the agent stops, all of that.

HOST: What would you use those for?

EXPERT: Audit logging, blocking dangerous commands, transforming inputs. Like, you could write a hook that catches any Bash command with `rm -rf` and denies it.

HOST: Oh, that's smart.

EXPERT: Yeah. Or you could sandbox file writes by rewriting paths to a sandbox directory. Or auto-approve read-only tools but require confirmation for writes.

HOST: So it's like middleware.

EXPERT: Exactly! And you can chain multiple hooks together. Rate limiter, then auth check, then input sanitizer, then audit logger.

HOST: Okay, this is all starting to click. But here's what I'm wondering—when would I actually use all of this? Like, what's the real-world scenario?

EXPERT: Okay, so imagine you're building a CI/CD pipeline. You want an agent that reviews code, runs tests, finds failures, fixes them, and commits the changes.

HOST: Okay.

EXPERT: You'd use adaptive thinking with medium effort for speed. You'd enable interleaved thinking so it can adjust when tests fail. You'd set up a progress file so it can resume if the pipeline crashes. You'd use hooks to block dangerous commands and audit all file changes. And if it's a big codebase, you might spawn subagents for different modules.

HOST: That actually sounds like a real thing people would want.

EXPERT: Oh, totally. Or think about autonomous coding agents that work for hours. They use multi-context workflows with initializer agents, progress logs, git checkpoints. They delegate subtasks to specialized agents. They validate the codebase works before implementing new features.

HOST: And this stuff actually works?

EXPERT: People are reporting agents running for two-plus hours autonomously, porting files, fixing bugs, running tests. The patterns are proven.

HOST: Huh. That's... actually kind of wild.

EXPERT: It is! But there are gotchas.

HOST: Oh, here we go.

EXPERT: So one big one—context poisoning. If a hallucination or mistake gets into a summary or progress file, it propagates to all future sessions.

HOST: Oh no.

EXPERT: Yeah. So you need validation checks. Encourage the agent to document decisions with reasoning. Use verification before applying stored knowledge.

HOST: What else?

EXPERT: Token billing can be confusing. With summarized thinking, you're billed for the full reasoning, not the summary you see in the response.

HOST: Wait, so I might see like 100 tokens but get billed for 5,000?

EXPERT: Exactly. You have to check the `usage` field in the API response to see the real cost.

HOST: That's sneaky.

EXPERT: It's not intentional—it's just how it works. The summarization is for safety and to prevent misuse, but you still pay for the full compute.

HOST: Alright, what else?

EXPERT: You can't toggle thinking modes mid-turn. The entire assistant turn has to use the same config. If you try to switch, it silently disables thinking.

HOST: That seems like it could cause bugs.

EXPERT: It can. And with tool use, you can't force specific tools when thinking is enabled. Only `auto` or `none` tool choice works.

HOST: Because forced tool use conflicts with reasoning?

EXPERT: Exactly. If you force a tool, Claude can't deliberate about whether it's the right choice, so the API blocks it.

HOST: Makes sense. Anything else?

EXPERT: Budget tokens has to be less than max tokens, except with interleaved thinking. Streaming is required if max tokens is over 21,333 to avoid timeouts. Thinking blocks must be passed back unmodified in tool loops or reasoning continuity breaks.

HOST: Okay, okay, this is a lot.

EXPERT: It is! But the core ideas are pretty intuitive. Give Claude space to think. Manage state across sessions. Isolate context when things get complex. Delegate to specialists when needed. Use hooks to control behavior.

HOST: And all of this is just... patterns? Like, there's no magic?

EXPERT: No magic. It's applying software engineering principles to AI agents. Statelessness, modularity, checkpointing, resumption, middleware. We've been doing this stuff in distributed systems for decades.

HOST: Huh. So building robust AI agents is kind of like building robust software?

EXPERT: Exactly. And that's actually really empowering, because it means we have decades of prior art to draw from. We're not inventing this from scratch.

HOST: Okay, one last question.

EXPERT: Shoot.

HOST: If someone's just getting started—like, they want to build their first real agent—where should they start?

EXPERT: Start simple. Use the Agent SDK with a single agent, adaptive thinking, medium effort. Give it file tools—Read, Write, Edit. Maybe Bash if you need it. Set permissions to `acceptEdits` so it can work autonomously but you still have control.

HOST: Okay.

EXPERT: Build something small. Like, "analyze this codebase and generate a report." Let it read files, grep for patterns, write a summary. See how it behaves.

HOST: And then?

EXPERT: Add a progress file. Have it update notes as it works. Then try resuming a session—see if it picks up where it left off. Add a hook to log which files it touches.

HOST: So build up incrementally.

EXPERT: Exactly. Don't jump straight to multi-agent systems with 15 subagents and complex state management. You'll just confuse yourself.

HOST: That's... actually really good advice.

EXPERT: And once you're comfortable with the basics, then you experiment. Add interleaved thinking for tool-heavy workflows. Try subagents for parallel work. Use checkpoints for fault tolerance. But get the fundamentals first.

HOST: Alright, I think I'm sold. This stuff is way more interesting than I thought.

EXPERT: Right? When you first hear "agentic patterns," it sounds like buzzwords. But when you actually dig into it, it's solving real problems in clever ways.

HOST: Yeah. And it's wild that we're basically teaching AI how to work like humans—take notes, break down tasks, check your work, ask for help when you're stuck.

EXPERT: That's the whole game. The models are already smart. Now we're teaching them to be effective over time, across contexts, in the messy real world.

HOST: Alright. So if someone wants to learn more, where should they go?

EXPERT: The Anthropic docs are excellent—they cover extended thinking, adaptive thinking, the Agent SDK, all of it. There's also research from Google on multi-agent systems, Microsoft on orchestration patterns, GitHub on memory systems. And honestly? Just start building. You learn way more by trying stuff than by reading about it.

HOST: Fair enough. Alright, I think that's a wrap. Thanks for nerding out with me on this.

EXPERT: Anytime. This stuff is genuinely fun once you get into it.

HOST: It really is. Alright, until next time—go build something cool.

EXPERT: And make sure it takes notes.

HOST: And make sure it takes notes. Perfect.
