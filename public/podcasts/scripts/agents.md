HOST: Okay so I want to start with something that genuinely surprised me. You would think that giving an AI model more time to think would always make it smarter, right? Like, more reasoning equals better answers. That just seems obvious.

EXPERT: Yeah, you'd think so. And for a lot of tasks, that's absolutely true. Multi-step math, complex code architecture, proving theorems -- giving the model a thinking budget makes a massive difference. But here's the thing that tripped me up...

HOST: Hit me.

EXPERT: On intuitive tasks -- pattern matching, simple lookups, the kind of thing where you just know the answer -- extended thinking can actually make performance worse. By up to thirty-six percent.

HOST: Wait. Thirty-six percent worse? Not like, marginally worse. Significantly worse.

EXPERT: Significantly worse. And it makes sense when you think about it in human terms. You know when someone asks you what two plus two is, and you just say four? Now imagine someone forces you to write out a full proof before answering. You'd probably overthink it, second-guess yourself, maybe even introduce errors.

HOST: That's... actually a really good analogy. It's like when you're playing a sport and someone tells you to think about your form mid-swing. Suddenly you can't hit the ball.

EXPERT: Exactly. So the whole paradigm of extended thinking -- which is genuinely one of the most powerful features in the Claude API -- comes with this counterintuitive gotcha. You have to be intentional about when you turn it on.

HOST: So let's back up for a second. For people who haven't played with this stuff directly, what even is extended thinking? Like, what's actually happening under the hood?

EXPERT: Okay so when you enable extended thinking, you're basically giving the model a scratchpad. Before it writes its final answer, it gets to work through the problem step by step internally. It creates these thinking blocks -- separate content blocks in the response -- where it reasons through the problem. Explores alternatives, checks its own work, the whole deal.

HOST: And you can see that thinking?

EXPERT: Sort of. This is where it gets interesting. With the older Claude 3.7 Sonnet, you got the full raw thinking output. Like, every single step. But with the Claude 4 models and newer, you get a summarized version. The model still does the full reasoning internally, but what you see in the response is a condensed summary.

HOST: Oh, so it's like getting the CliffsNotes of the model's internal monologue.

EXPERT: Right, but -- and this is the gotcha that catches people -- you're billed for the full thinking tokens, not the summary. So you look at the response and think "oh, that was only a few hundred tokens of thinking." Then your bill comes and it's way higher because the model actually used thousands of tokens internally.

HOST: Ooh, that's sneaky. Not intentionally sneaky, I'm sure, but that's the kind of thing that would really confuse you if you were trying to track costs.

EXPERT: Totally. You have to look at the usage object in the API response to get the real numbers. The visible token count in the thinking block won't match what you're charged for.

HOST: Okay so you mentioned a thinking budget. How does that work? Do you just say "hey, think for this many tokens"?

EXPERT: That's exactly how it used to work. You'd set a budget_tokens parameter -- minimum 1,024 tokens -- and the model would use up to that amount for internal reasoning. But here's where the evolution gets really cool. The newer models, Opus 4.6 and Sonnet 4.6, introduced something called adaptive thinking.

HOST: Adaptive thinking.

EXPERT: Yeah, and it's a philosophical shift. Instead of you, the developer, trying to predict how much thinking a problem needs -- which is kind of an impossible task -- the model itself decides. You just set the thinking type to "adaptive" and the model evaluates each request and allocates the right amount of reasoning on the fly.

HOST: So it's like... going from a manual transmission to an automatic.

EXPERT: That's actually a pretty perfect analogy. And they paired it with this effort parameter that gives you high-level control. Four levels: low, medium, high, and max. So you're not micromanaging token budgets anymore, you're just saying "hey, this is a quick lookup, keep it light" or "this is a thorny security audit, go deep."

HOST: Okay but hold on -- does "low effort" mean it never thinks? Like, it just fires off an answer?

EXPERT: No, and this is important. The effort level is a signal, not a guarantee. Even at low effort, if the model encounters a genuinely hard problem, it'll still think -- just less than it would at higher levels. Think of it like a suggestion. You're saying "I expect this to be straightforward," and the model mostly listens, but it won't deliberately give you a bad answer just because you told it not to think too hard.

HOST: That's reassuring. And max effort is only for Opus 4.6, right?

EXPERT: Right. If you try to use max on any other model, it straight-up errors. Doesn't fail gracefully, doesn't fall back to high. Just errors.

HOST: Good to know. So let me ask about something that connects to all of this -- interleaved thinking. Because when I first heard that term, I was like, "isn't that just... thinking?"

EXPERT: So, okay, here's the distinction. Without interleaved thinking, the model does all its reasoning up front, in one big block, before it does anything. With interleaved thinking, the model can reason between tool calls. It thinks, calls a tool, gets the result, thinks again based on what it learned, calls another tool... it's this dynamic loop.

HOST: Oh! Oh, that's actually a huge difference. Because without it, the model has to predict everything in advance, right? It has to plan the entire sequence of actions before it starts.

EXPERT: Exactly. And think about what happens when something unexpected comes back from a tool call. Like, your database query fails because the table name is different from what the model assumed. Without interleaved thinking, the model kind of has to start over. With interleaved thinking, it reads the error, immediately adjusts its approach, and tries the right table name.

HOST: It's like the difference between writing out a recipe from memory versus cooking and tasting as you go.

EXPERT: Yes! And the benchmark numbers back this up. MiniMax showed a forty percent improvement on BrowseComp when they enabled interleaved thinking. That's not a marginal gain. That's transformative.

HOST: Forty percent. On a benchmark. That's wild.

EXPERT: And this is the foundation of what people call the ReAct pattern -- Reasoning and Acting. The model alternates between thought, action, and observation. It forms a hypothesis, tests it with a tool, observes the result, updates its hypothesis, and repeats. It's basically the scientific method applied to AI agents.

HOST: Okay I love that framing. But I want to pivot to something that I think is maybe the unsexy-but-critical part of all this. Because all this thinking and tool-calling is great for a single conversation. But what happens when you're trying to build something that takes hours? Or days? These models don't have persistent memory. Every context window starts fresh.

EXPERT: Yeah, this is the state management problem. And it's honestly one of the hardest problems in the whole agentic space. Because you're right -- LLMs are fundamentally stateless. Every new context window is a blank slate. The model has no idea what happened before unless you explicitly tell it.

HOST: So how do you actually solve that?

EXPERT: Multiple strategies, and the smart approach is to layer them. The first one is context compaction. When your context window is getting full -- Claude Code actually triggers this automatically at ninety-five percent capacity -- you compress the conversation. Summarize what's been done, what decisions were made, what's left to do.

HOST: That sounds straightforward enough.

EXPERT: It is, until you hit the gotcha. Context poisoning.

HOST: That sounds ominous.

EXPERT: It should. So imagine the model hallucinates something during a summary. Maybe it says "we already fixed the authentication bug" when it actually didn't. That incorrect information gets baked into the summary. And now every future session reads that summary and believes the bug is fixed. It's like a virus in your project history that just keeps propagating.

HOST: That's... terrifying, actually. Because you wouldn't even know it happened. You'd just be building on top of a wrong assumption.

EXPERT: Exactly. Which is why the best systems don't rely on compaction alone. You need structured state management. Progress files, git commits with descriptive messages, explicit decision logs. Things that can be independently verified.

HOST: So it's like... don't just rely on someone's memory of what happened. Write it down in a way that can be checked.

EXPERT: Right. And there's this really elegant pattern called the initializer agent approach. Your first session doesn't write any code. It just sets up the infrastructure -- creates a progress tracking file, a structured feature list, an initialization script. Then every subsequent session starts by reading those files, running the test suite to verify the codebase actually works, and only then picking up the next task.

HOST: I like that. It's like, before you start cooking, you lay out all your ingredients and check that the oven works. You don't just start throwing things in a pan.

EXPERT: And here's a data point that really drove home why this matters. Research shows agent performance degrades after about thirty-five minutes of continuous work on a single task.

HOST: Thirty-five minutes? That's... not very long.

EXPERT: It's not. And that's human time, not model time. So the practical takeaway is: design your agent workflows to hand off or checkpoint well before that threshold. Break big tasks into smaller chunks, use sub-agents for focused work, and make sure each chunk is independently verifiable.

HOST: Which brings us to sub-agents. And this is where I feel like we get into the real architecture of these systems. Because it's not just one model running in a loop anymore. It's models coordinating with other models.

EXPERT: Yeah, and the orchestrator-worker pattern is the most common approach. You have a lead agent -- the coordinator -- that analyzes the task, breaks it into pieces, and spawns specialized sub-agents for each piece. Each sub-agent has its own context window, its own tools, its own focused job.

HOST: So it's like a project manager delegating to specialists.

EXPERT: Exactly like that. And there's a really important design decision here: context isolation. Each sub-agent has its own separate conversation. The verbose output -- test failures, build logs, all that noisy stuff -- stays inside the sub-agent's context. The lead agent only gets back a clean, compressed summary. Usually around a thousand to two thousand tokens.

HOST: Oh, that's clever. Because otherwise the main agent's context window would fill up just from all the noise of the sub-agents' work.

EXPERT: Right. And this is what actually enables multi-hour autonomous operation. There are reports of agents running for over two hours using this pattern -- todo-driven hierarchies where a main agent loops through tasks, delegates each one to a sub-agent, and the sub-agent handles all the messy details internally.

HOST: Okay but I have to imagine this costs a fortune in tokens.

EXPERT: So, yeah. Multi-agent systems typically use about fifteen times more tokens than a single-agent approach.

HOST: Fifteen times!

EXPERT: Fifteen times. But here's the trade-off that makes it worth it. With parallel execution -- spawning three to five sub-agents simultaneously -- you can cut research and analysis time by up to ninety percent. So you're paying more in tokens, but you're getting results dramatically faster.

HOST: That's a fascinating trade-off. You're basically buying time with tokens.

EXPERT: And the key insight from people who've built these systems is: don't use sub-agents as a default pattern. Only reach for them when a single agent genuinely can't handle the task. When the prompt complexity is too high, when you need contradictory optimizations across different domains, when you need security isolation between operations.

HOST: What do you mean by contradictory optimizations?

EXPERT: Like, imagine you need one agent optimizing for code performance and another optimizing for code readability. Those are sometimes conflicting goals. If you put both mandates in a single agent's prompt, it gets confused. But if you split them into separate agents and have a coordinator synthesize their recommendations, you get much better results.

HOST: Huh. I never thought about it that way. It's like having a devil and an angel on your shoulders, except they're both useful.

EXPERT: And there are some really fun patterns for how you orchestrate these agents. There's fan-out/fan-in, which is like scatter-gather from distributed systems. You send the same input to multiple agents analyzing from different angles, then aggregate their results. There's the maker-checker loop, where one agent generates output and another critiques it, and they cycle until the critic is satisfied.

HOST: Wait, sorry, go back to that for a second. The maker-checker thing. Does the critic have to be a separate model? Or just a separate prompt?

EXPERT: It can be either, but typically it's the same model with a different system prompt and different tools. The key is that the critic has an independent perspective. It's not influenced by the generator's reasoning process. Fresh context, fresh eyes.

HOST: That's really clever. Okay so let's talk about the SDK itself because I think this is where the rubber meets the road for developers. If someone wants to actually build one of these agent systems, what does the Claude Agent SDK give them?

EXPERT: So the SDK is really the tool that makes all of this practical. The core innovation is that it handles tool execution internally. With the regular Anthropic client, you have to write the tool loop yourself. The model says "I want to call this tool," you execute it, pass the result back, the model decides next steps -- you're managing all of that manually.

HOST: That sounds painful.

EXPERT: It is. The Agent SDK handles all of that. You provide a prompt and configuration, and Claude figures out which tools to use, executes them, observes results, and keeps going until the task is done. The main interface is the query function, which returns an async stream of messages as Claude works.

HOST: So you just... ask it to do something and watch it work?

EXPERT: Pretty much. And it comes with built-in tools that work immediately. Read, Write, Edit for file operations. Bash for running commands. Glob and Grep for finding files. WebSearch and WebFetch for the internet. You don't have to implement any of that.

HOST: That's nice. But what about control? Because just letting an AI loose with file-writing and command-execution permissions seems... terrifying.

EXPERT: Yeah, and this is where the permission system comes in, and it's actually really well thought out. You have four modes. Default mode requires a callback to approve each tool use. AcceptEdits auto-approves file operations but still requires approval for other things. BypassPermissions auto-approves everything. And Plan mode -- this one's interesting -- the agent can analyze and propose changes but can't actually execute anything.

HOST: Oh, so Plan mode is like a dry run.

EXPERT: Exactly. You could do a review pass in Plan mode, look at what the agent wants to do, and then re-run with actual permissions. But here's a gotcha that's caught people: bypassPermissions is inherited by all sub-agents, and you cannot override it. So if your coordinator has full permissions, every agent it spawns also has full permissions.

HOST: Ooh, that could be a problem. You might want your coordinator to have broad access but restrict what the specialist agents can do.

EXPERT: Exactly. And that's where hooks come in, which is honestly one of the most powerful features of the SDK. Hooks are callback functions that fire at specific lifecycle points. Before a tool executes, after it succeeds, when a sub-agent spawns, when the agent finishes -- you can intercept at all these points.

HOST: So you could build like a security layer on top?

EXPERT: You could build incredibly sophisticated control. Want to block any Bash command containing "rm -rf"? PreToolUse hook. Want to redirect all file writes to a sandbox directory? PreToolUse hook with an updatedInput response. Want to log every single tool call for auditing? PostToolUse hook with an async flag so it doesn't slow things down.

HOST: That's really elegant. It's like middleware in a web framework.

EXPERT: That's a great comparison. And there's a priority system. If multiple hooks apply to the same tool call, deny always wins over ask, which always wins over allow. So your security hooks can't be overridden by a more permissive hook later in the chain.

HOST: I love that. Defense in depth.

EXPERT: And then there are sessions, which handle the continuity problem. When you start a query, the SDK creates a session with a unique ID. You capture that ID, store it somewhere, and later you can resume from exactly where you left off. Claude gets the full conversation history back and picks up where it stopped.

HOST: Can you branch sessions? Like, "let me try this approach in a parallel universe?"

EXPERT: Yes! Session forking. You resume with a fork flag, and it creates a new branch from the resume point. The original session stays untouched. You can explore an alternative approach without losing your original work.

HOST: That's... that's actually beautiful. It's like git branching but for conversations.

EXPERT: And that connection is not accidental. There's actually a whole framework called the Git Context Controller that uses git primitives -- commit, branch, merge -- as the foundations for agent memory management. Agents commit at meaningful milestones, branch when they want to explore alternatives, merge when they've found the right approach.

HOST: So the whole version control mental model just... transfers directly.

EXPERT: It does. And there's this fascinating detail from the GitHub Copilot team. They built a memory system where every stored memory includes citations -- file paths, line numbers, specific code references. And before the agent uses any stored memory, it verifies the citations still match the current state of the code.

HOST: Because code changes! The thing you remembered might not be true anymore.

EXPERT: Exactly. And in their A/B testing, adding that verification step improved performance by seven percent. Which doesn't sound like a lot, but at their scale, that's a meaningful improvement in developer productivity.

HOST: Okay so I want to zoom out for a second because I think there's a bigger picture here that we've been circling around. We've talked about thinking, interleaved reasoning, state management, sub-agents, the SDK. And the thread that connects all of it is this idea that... building a useful AI agent isn't really about making the model smarter. It's about building the right scaffolding around it.

EXPERT: That's... yeah, that's exactly right. The model is the engine, but the harness -- the state management, the tool orchestration, the permission controls, the checkpoint system -- that's what determines whether your agent can actually accomplish something meaningful over a sustained period.

HOST: It's like... the model is a really talented chef, but without a kitchen, without ingredients, without a recipe, without someone making sure the stove is actually on, the talent doesn't matter.

EXPERT: And the field is moving so fast on this. Adaptive thinking alone represents a fundamental shift in how developers interact with these systems. Instead of "let me carefully tune this parameter," it's "let the model figure it out." The effort parameter, interleaved thinking, sub-agent orchestration -- these are all moving toward a world where the developer describes what they want, and the system figures out the how.

HOST: But with enough control surfaces that you're not just hoping for the best.

EXPERT: Right. Hooks give you the safety rails. Sessions give you continuity. Checkpoints give you recovery. State management gives you memory. It's a layered system where each layer solves a different problem.

HOST: You know what strikes me? A year ago, the conversation about AI agents was all about "can they do it." Can they write code, can they analyze data, can they use tools. And now the conversation is about "how do you keep them doing it reliably for hours at a time without going off the rails."

EXPERT: And that shift -- from capability to reliability -- is what separates a cool demo from a production system. Anyone can build an agent that works once. Building one that works reliably over two hours, that recovers from errors, that doesn't poison its own context, that manages its token budget intelligently... that's the hard part.

HOST: And honestly, the part I keep coming back to is that thirty-six percent degradation number. Because it's such a perfect encapsulation of the whole challenge. More isn't always better. More thinking, more agents, more tokens, more context. The art is in knowing when to add complexity and when to keep it simple.

EXPERT: I mean, that's engineering in a nutshell, right? The right tool for the right job. Sometimes that's adaptive thinking with max effort and five parallel sub-agents. Sometimes it's a single agent with a thousand-token thinking budget and a well-written prompt. Knowing the difference is what makes you good at this.

HOST: And somehow, knowing when not to think too hard... is the thing that requires the most thinking.

EXPERT: Yeah. The irony is not lost on me.
