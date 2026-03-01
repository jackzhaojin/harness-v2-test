HOST: Okay, so here's a question for you. When was the last time you actually read documentation for a tool before you started using it?

EXPERT: Honestly? Probably never. I just... install things and start clicking around.

HOST: Right, right, exactly. And that works fine for most tools. But there's this whole category of AI coding tools now where the difference between "I kinda use it" and "I actually understand what it can do" is just... massive. Like, night and day.

EXPERT: You're talking about Claude Code.

HOST: I am absolutely talking about Claude Code. Because I think most people who've heard of it think it's just, like, another AI chatbot you can ask coding questions to. But it's so much weirder and more interesting than that.

EXPERT: It really is. So okay, for anyone who hasn't touched it yet -- Claude Code is Anthropic's agentic coding tool, and the key word there is "agentic." It doesn't just answer questions. It lives in your terminal. It reads your files, understands your project structure, runs commands, makes git commits--

HOST: Wait, it makes git commits?

EXPERT: It makes git commits. It creates pull requests. You can literally say "commit my changes with a descriptive message" and it just... does it.

HOST: That's... okay, I have feelings about that. But hold on, let me back up. You said it lives in the terminal. So this isn't a VS Code extension or anything like that?

EXPERT: Well, it actually supports both. There's IDE integrations for VS Code and JetBrains, there's a desktop app, it even works in Slack. But the terminal is the native experience, and honestly, that's where it gets interesting. Because the terminal means it works everywhere -- SSH sessions, remote servers, CI pipelines. You're not tied to a GUI.

HOST: So you literally just type "claude" in your terminal and you're in?

EXPERT: That's it. You type "claude" and you get an interactive session. You can ask it about your codebase, tell it to fix bugs, refactor things. And then when you're done, you exit. But here's the neat part -- your conversations are saved. So you can come back later and say "continue where I left off."

HOST: Oh, that's actually huge. Because the thing I hate about most AI tools is that every conversation starts from zero.

EXPERT: Exactly. And you can even name your sessions. So like, you're working on an authentication refactor, you name it "auth-refactor," go home, come back the next day, type "claude resume auth-refactor" and you're right back in it.

HOST: Okay, that's clever. But I want to talk about something that tripped me up the first time I read about this. The keyboard shortcuts are... different.

EXPERT: Oh, you mean the Ctrl+C thing?

HOST: The Ctrl+C thing! So in basically every terminal tool in the history of computing, Ctrl+C means "stop what you're doing." In Claude Code, Ctrl+C means "goodbye forever, I'm closing the whole application."

EXPERT: Yeah, that catches everyone. You want Escape. Escape stops Claude mid-action but keeps your session alive. Ctrl+C just... exits. Gone. And I think that's a deliberate design choice because they want Escape to be the "gentle stop" and Ctrl+C to be the "I'm done" button, but it goes against decades of muscle memory.

HOST: Decades! My fingers have been trained since I was like twelve years old.

EXPERT: I know, I know. And there's another one -- Plan Mode. You'd think it's one toggle, right? Nope. You have to press Shift+Tab twice. First press gives you Auto-Accept mode, second press gets you to Plan Mode. And you have to look for a little indicator at the bottom of the terminal that says "plan mode on."

HOST: Okay so what even is Plan Mode? Because that sounds really useful.

EXPERT: It's basically read-only analysis. Claude looks at your code, thinks about it, creates a plan for what it would do, but it doesn't actually touch anything. It's perfect for when you're like, "I want to refactor this whole module but I'm scared."

HOST: So it's like... getting a second opinion before surgery.

EXPERT: That's a great analogy, actually. It's the consultation before the operation. And you can even press Ctrl+G to open the plan in your text editor, mark it up, hand it back. So it's genuinely collaborative.

HOST: Alright, so that's the basics of using the tool. But here's where things get really interesting, and honestly this is the part that kind of blew my mind. The memory system.

EXPERT: Oh, the memory system is where Claude Code goes from "neat tool" to "indispensable team member." So, okay, this is going to sound nerdy but--

HOST: Go for it.

EXPERT: Claude Code has this dual memory architecture. There's stuff you write for it, and stuff it writes for itself. And both get loaded every single time you start a conversation.

HOST: Wait -- stuff it writes for itself?

EXPERT: Yeah! It's called auto memory. So let's say you correct Claude during a session. You say "hey, we use pnpm here, not npm." Claude goes "got it" and writes that down in its own memory file. Next session, it already knows. You never have to tell it again.

HOST: That's... okay, that actually changes the game. Because the number one complaint I have with AI coding tools is repeating myself.

EXPERT: Same. And the stuff you write for it? That's the CLAUDE.md system. Think of it as an onboarding document. You know how when a new developer joins your team, you sit them down and say "here's our coding standards, here's how to run the tests, here's the architecture"?

HOST: Yeah, and then they forget half of it by lunch.

EXPERT: Right! Well, CLAUDE.md is that briefing document, except Claude actually reads it. Every. Single. Time. And there's this whole hierarchy to it that's really elegant. You've got your project-level file that the whole team shares through git. You've got a personal one that follows you across all your projects. And then there's a local one for your personal preferences on a specific project that doesn't get committed.

HOST: So the team file says "we use TypeScript and four-space indentation" and my personal file says "I prefer verbose explanations" and those just... layer on top of each other?

EXPERT: Exactly. And it goes even deeper. There's a rules directory where you can create modular instruction files that only apply to specific file patterns. So you can have rules that say "when you're working on anything in the API directory, follow these conventions" and totally different rules for the frontend.

HOST: Oh, that's smart. So it's like... context-aware instructions. The rules change depending on what part of the codebase you're touching.

EXPERT: Right. You use glob patterns in the YAML frontmatter. Like "src/api double-star slash star-dot-ts" and those rules only activate when Claude is working on TypeScript files in your API folder.

HOST: Okay, but here's the thing I want to push back on a little. You said Claude "reads" these files. But it's not enforcing them, right? It's guidance.

EXPERT: That is a really important distinction, yeah. CLAUDE.md is guidance, not enforcement. Claude tries to follow it, and it does a pretty good job, but there's no guarantee. And here's the gotcha -- vague instructions don't work well. If you write "format code properly," that could mean anything. But "use two-space indentation and single quotes for strings"? That it can follow.

HOST: So it's like managing a very capable but somewhat literal junior developer.

EXPERT: I love that. Yes. Be specific, be explicit, and you'll be happy. Be vague and you'll be frustrated.

HOST: And there's a limit on the auto memory too, right? Something about two hundred lines?

EXPERT: Yeah, so the auto memory gets stored in a file called MEMORY.md, and only the first two hundred lines load at session start. But here's the thing people get confused about -- that limit only applies to the auto memory file. Your CLAUDE.md files load in full. Although, and this is important, if your CLAUDE.md is like five hundred lines long, it's eating into your context window and Claude's adherence to the instructions actually drops.

HOST: So keep it tight.

EXPERT: Keep it tight. Think of it as... you know how the best commit messages are like one sentence? Same energy. Dense, specific, actionable.

HOST: Alright, so we've got the CLI, we've got the memory system. Now I want to talk about skills, because this is where it starts to feel less like a tool and more like a platform.

EXPERT: Oh, skills are fascinating. So a skill is basically... a recipe. It's a set of instructions you write once, and then Claude can follow them over and over again. Every skill lives in a folder with a SKILL.md file, and that file has some YAML metadata at the top and then markdown instructions below.

HOST: And these evolved from something called custom commands?

EXPERT: Yeah, so there used to be this commands system, and skills kind of absorbed it. The old command files still work, but skills are more powerful because you can bundle supporting files with them -- templates, scripts, examples. And they have this frontmatter where you can control all sorts of behavior.

HOST: So give me a concrete example. What would I actually use a skill for?

EXPERT: Okay, so imagine your team has a deployment process. It's like seven steps. Check this, build that, push to this, verify that. Instead of explaining it to Claude every time, you write a deploy skill. Now anyone on the team can just type slash deploy and Claude follows the exact same steps every time.

HOST: Slash deploy. Like a slash command?

EXPERT: Exactly like a slash command. You type forward-slash and the skill name. Or -- and this is the cool part -- Claude can invoke skills automatically if it thinks the task matches the skill's description.

HOST: Wait, really? So it reads the descriptions and decides on its own?

EXPERT: Yeah, auto-invocation. The description field in the frontmatter is how Claude decides when to apply a skill. So if you have a skill called "api-conventions" with a description that says "API design patterns for this codebase," and then you ask Claude to write an API endpoint, it might just... pull in those conventions automatically.

HOST: That's... okay, I can see how that's powerful, but I can also see how that could go sideways. What if it invokes the wrong skill at the wrong time?

EXPERT: And this is where the description quality really matters. If your description is vague, you'll get inconsistent triggering. But there are also controls. You can set "disable-model-invocation: true" in the frontmatter, which means only a human can trigger it with the slash command. Or you can go the other way and set "user-invocable: false," which means only Claude can trigger it -- it's hidden from the menu entirely.

HOST: Huh. So you can have skills that are human-only, Claude-only, or both.

EXPERT: Right. And there's actually a known bug with the human-only setting that's kind of ironic. Sometimes when you set "disable-model-invocation: true," Claude interprets that as "I'm not allowed to use this skill at all" -- even when the user explicitly types the slash command.

HOST: So it's being too obedient.

EXPERT: Too obedient! It reads "disable model invocation" and goes "well, I'm a model, so I guess I can't invoke this." Which is technically a correct reading but not the intended behavior.

HOST: That's actually kind of funny. It's like telling your assistant "don't schedule meetings on your own initiative" and then they refuse to schedule one when you specifically ask them to.

EXPERT: That's exactly what's happening. And there's another subtlety people miss. Skills aren't separate processes. They're injected instructions within your main conversation. So it's not like Claude spawns a little sub-program. It's more like someone hands Claude a recipe card in the middle of cooking.

HOST: Oh, that changes how I think about them. So they're expanding the prompt dynamically.

EXPERT: Exactly. And that means there's a context budget. All your skill descriptions have to fit within two percent of the context window. If you create fifty skills with lengthy descriptions, some might get excluded.

HOST: Two percent? That's it?

EXPERT: That's it. You can check with the slash context command to see if any of your skills are getting dropped. And there's an environment variable to override it, but the default is pretty tight.

HOST: Okay, but here's the thing that really got me. There's this feature where skills can run shell commands to inject dynamic context before they even start. Tell me about that.

EXPERT: Oh, the exclamation-mark backtick syntax. So in your SKILL.md, you can write something like "PR diff: exclamation-mark backtick gh pr diff backtick" and when the skill fires, it actually runs that command and injects the output into the context. So your skill gets live data from your environment.

HOST: So you could have a PR summary skill that automatically fetches the diff and the comments and then summarizes them?

EXPERT: That's literally the example in the docs. And it's powerful because the skill doesn't have stale information. It's pulling fresh data every time.

HOST: Alright, so we've covered the memory system and skills. Now let's talk about hooks, because this is where things get... I don't know, deterministic? Serious?

EXPERT: This is where it gets serious. So here's the fundamental problem. CLAUDE.md is a suggestion. Skills are instructions. But none of that is guaranteed. Claude might forget. Claude might decide it knows better. Hooks? Hooks always run.

HOST: Always.

EXPERT: Always. Every single time the conditions match. No exceptions. Think of it this way -- CLAUDE.md is like a style guide on the wall. A hook is like a locked door.

HOST: Oh, that's a good way to put it. So what are hooks, mechanically?

EXPERT: They're shell commands that fire at specific lifecycle points. Before a tool runs, after a tool runs, when a session starts, when Claude finishes responding. And they're configured in JSON settings files. You define the event, an optional matcher to filter when it fires, and then the command to run.

HOST: Give me the most common use case.

EXPERT: Auto-formatting. So you set up a PostToolUse hook that matches on Edit or Write -- those are the tools Claude uses to modify files. Every time Claude writes or edits a file, boom, Prettier runs on it automatically. You don't have to ask Claude to format. You don't have to hope it remembers. It just happens.

HOST: Every. Time.

EXPERT: Every time. And the real power is in PreToolUse hooks, because those can block actions. You can write a script that checks if Claude is about to edit a protected file -- like your env file or package-lock -- and if it is, the hook returns exit code 2, which cancels the action entirely.

HOST: Exit code 2 specifically?

EXPERT: Yeah, and this is one of those details that trips people up. Exit 0 means proceed. Exit 2 means block. And when you block, only stderr matters. If you try to send a fancy reason through stdout, it gets ignored. You have to write to stderr.

HOST: Oh no. That's the kind of thing you debug for an hour before you realize--

EXPERT: Before you realize you were writing to the wrong output stream. Yep. Been there.

HOST: And the matchers are case-sensitive, right?

EXPERT: Case-sensitive! Capital B Bash, capital E Edit, capital W Write. Not lowercase. And this gets people because most of the tools in the ecosystem are lowercase by convention, but Claude Code's internal tool names are capitalized.

HOST: Okay, so there's one more thing about hooks that I think is genuinely scary in a fun way. The Stop hook.

EXPERT: Oh, the infinite loop problem.

HOST: Tell me about the infinite loop problem.

EXPERT: So the Stop event fires when Claude finishes responding. And you can use it to, say, run tests and make Claude keep working if tests fail. Great idea, right? Except if your hook triggers continuation, Claude does more work, finishes again, fires the Stop hook again, which triggers continuation again, and--

HOST: It just goes forever.

EXPERT: Forever. You have to explicitly check for a field called "stop_hook_active" in the input JSON and bail out early if it's true. Otherwise you've created an infinite loop of Claude trying to satisfy a condition it can't.

HOST: That's like... setting an alarm that snoozes itself.

EXPERT: Ha! That's exactly what it is. An alarm that snoozes itself forever.

HOST: Okay, there's another gotcha with hooks that I think is sneaky and I want to talk about it. The shell profile thing.

EXPERT: Oh, this one is evil. So hooks run shell commands, right? And on macOS, your shell startup file -- your zshrc or whatever -- might print things. Like a welcome message, or conda activation output, or some cute ASCII art you put there three years ago and forgot about.

HOST: Oh no, I see where this is going.

EXPERT: That output gets prepended to your hook's stdout. So if your hook is returning carefully formatted JSON and your shell profile prints "Good morning, developer!" first, the JSON is corrupted. And Claude Code tries to parse it and just... chokes.

HOST: And you'd never think to check your shell profile as the source of the bug.

EXPERT: Never! You'd be staring at your hook script for hours. The fix is to wrap your zshrc's noisy stuff in an interactive shell check. Only print that stuff when you're actually sitting at a terminal, not when a script is running.

HOST: So let me try to pull this all together, because I think there's a really interesting design philosophy here. You've got three layers. CLAUDE.md is the culture -- it's how you want things done. Skills are the playbook -- specific repeatable workflows. And hooks are the rules -- the things that must happen, no exceptions.

EXPERT: And they layer on each other beautifully. Your CLAUDE.md says "we use Prettier for formatting." Your skill might include a code review checklist that mentions formatting. But your hook is the one that actually runs Prettier after every single edit. So even if Claude somehow forgets the instruction and the skill doesn't trigger, the hook catches it.

HOST: Defense in depth. For AI coding.

EXPERT: Defense in depth! That's exactly what it is. And I think that's the thing people miss when they first look at Claude Code. They see the chat interface and think "oh, it's another chatbot." But underneath, there's this whole system of persistent memory, composable skills, and deterministic hooks that makes it feel less like a conversation and more like... an operating system for AI-assisted development.

HOST: Okay, that's a bold claim. But I think you might be right. Because the thing that strikes me is how much of this is about trust. Like, the permission system asks you before it changes files. Plan Mode lets you preview without risk. Hooks enforce your boundaries. It's all about building enough trust that you can gradually hand over more control.

EXPERT: And that's the journey, right? You start by approving every single file change. Then you move to auto-accept for a session because you trust the patterns. Then you set up hooks so the guardrails are automated. And eventually you're running it in headless mode in your CI pipeline with skip-permissions because you've got enough hooks and checks in place that you trust the system.

HOST: It's like... training a self-driving car. You start with your hands on the wheel.

EXPERT: And eventually you're reading a book while it drives. But only because the safety systems earned your trust incrementally.

HOST: So here's what I keep thinking about. All of this -- the memory, the skills, the hooks -- it's really about encoding your team's engineering culture into a format an AI can follow. And that's... I mean, that's kind of a new discipline, isn't it? Prompt engineering for your entire development workflow.

EXPERT: It is. And I think the teams that figure it out first are going to have a genuinely unfair advantage. Because it's not just about one developer being faster. It's about your entire team's AI assistants all following the same standards, catching the same mistakes, running the same checks. It's institutional knowledge that doesn't walk out the door when someone leaves.

HOST: Institutional knowledge that doesn't walk out the door. I think that might be the most interesting thing either of us has said in this entire conversation.

EXPERT: And it starts with a markdown file. That's the wild part. All of this power, and it starts with writing a good CLAUDE.md.

HOST: Which, let's be honest, most people are going to skip because who reads documentation, right?

EXPERT: And we're right back where we started.
