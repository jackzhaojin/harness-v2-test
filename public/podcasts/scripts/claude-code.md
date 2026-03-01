HOST: Okay, so I tried something yesterday that kind of blew my mind a little bit. I was debugging this gnarly API issue, right? And instead of switching between my terminal and my IDE and copy-pasting error messages—

EXPERT: Let me guess. Claude Code?

HOST: Yes! But here's the thing that got me—I wasn't even in an IDE. I was SSH'd into a server.

EXPERT: Oh, that's the whole point! That's what people miss about Claude Code. Everyone thinks it's just, like, another Copilot or another AI coding assistant that sits in VS Code.

HOST: Right, right.

EXPERT: But it's fundamentally different because it lives in your terminal. Which means—

HOST: It works literally anywhere you have a command line.

EXPERT: Exactly. Remote servers, CI/CD pipelines, Docker containers, even those janky legacy systems where you can't install a fancy IDE.

HOST: Okay, but hold on. Let's rewind for people who haven't used this yet. What actually is Claude Code? Like, at the most basic level?

EXPERT: So at its core, it's an AI-powered coding assistant from Anthropic that you control entirely through your terminal. You install it, you type `claude`, and you just... talk to it. You can ask it to explain your codebase, refactor functions, write tests, fix bugs, create pull requests—all in plain English.

HOST: And it has actual access to your files.

EXPERT: Yes. It reads your code contextually. So you don't have to manually feed it context like "here's my auth module, here's my database schema." It just... knows. It explores your project as it needs to.

HOST: That's kind of wild when you think about it. It's not just generating code in a vacuum.

EXPERT: Right! It's understanding your entire project structure. And here's where it gets interesting—it has this permission system built in. So before it modifies anything, it asks you.

HOST: Oh, so it's not just going rogue and rewriting your entire codebase?

EXPERT: Exactly. Every file change, every command it wants to run—it shows you what it's planning to do and asks for approval. You can review the diff right there in your terminal. You can say yes, no, or even enable "Accept all" mode if you trust it for that session.

HOST: Huh. So there's this balance between automation and control.

EXPERT: Precisely. And actually, there's this third mode that I think is super underrated—Plan Mode.

HOST: Wait, what's Plan Mode?

EXPERT: Okay, so imagine you want to do a complex refactor. You don't want Claude to start making changes immediately, right? You want to understand the approach first. So you hit Shift+Tab twice—

HOST: Twice?

EXPERT: Yeah, the first Shift+Tab turns on "Auto-Accept" mode, the second one activates Plan Mode. Look at the bottom of your terminal; it'll say "plan mode on." Now Claude can only read files and analyze code. It can't modify anything. It'll create a plan for you—like, "here's what I would do, here are the files I'd touch, here are the gotchas I see."

HOST: Oh! So it's like... thinking out loud before executing.

EXPERT: Exactly. And once you approve the plan, you can switch back to normal mode and actually implement it. It's perfect for when you're dealing with something high-stakes or you just want to explore options without committing to changes.

HOST: That's... actually kind of brilliant. Because I've had situations where I ask an AI tool to do something, and it just starts making changes immediately, and I'm like, "Wait, wait, that's not what I meant!"

EXPERT: Right, right, right. And that brings up another thing—Claude Code has this concept of sessions. Every conversation is automatically saved.

HOST: So you can come back to it later?

EXPERT: Yeah. You can do `claude --continue` to resume your most recent session, or `claude --resume` to pick from a list. And here's a pro tip: you can name your sessions using the `/rename` command. So if you're working on, say, an authentication refactor, you name the session "auth-refactor," and then later you can do `claude --resume auth-refactor` to jump right back in.

HOST: Oh, that's nice. So it's not just throwaway conversations.

EXPERT: Not at all. It's persistent context. Which ties into something even more interesting—the memory system.

HOST: Okay, tell me about this.

EXPERT: So Claude Code has two ways of remembering things. The first is CLAUDE.md files—these are like onboarding documents you write for Claude.

HOST: CLAUDE.md—that's a file I create?

EXPERT: Yep. It's just a markdown file. You put it in your project root—or actually, you can put it in a few different places, we'll get to that—and you write down your project conventions, build commands, architecture decisions, coding standards.

HOST: So it's like briefing a new team member.

EXPERT: Exactly! You wouldn't expect a new developer to intuitively know that your team uses pnpm instead of npm, or that you have this weird custom testing setup. So you write it down once in CLAUDE.md, and now every Claude session starts with that context loaded.

HOST: Wait, so every time I start a new conversation, it reads CLAUDE.md automatically?

EXPERT: Yep. Session start, it loads CLAUDE.md. No manual copying and pasting.

HOST: That's... okay, that's really smart. Because I've used other AI tools where you have to re-explain your setup every single time.

EXPERT: Right, right. And here's where it gets even better—there's a hierarchy of these files. You can have a global CLAUDE.md in your home directory that applies to all your projects, a project-level one that your whole team shares via git, and a local one just for your personal preferences that you don't commit.

HOST: Oh, so the local one is like... your personal overrides?

EXPERT: Exactly. Maybe your team's CLAUDE.md says "use the staging server at staging.example.com," but you have a local dev environment at localhost:3001. You put that in CLAUDE.local.md, and it takes precedence.

HOST: Got it. And you said there were two memory systems?

EXPERT: Yeah, the second one is auto memory. This is where Claude writes notes for itself.

HOST: Wait, it takes its own notes?

EXPERT: Yes! So as you work with Claude, it learns things. Maybe it discovers your build command, or you correct it on something, or it figures out a debugging pattern that works for your codebase. It can write these learnings to memory files that load automatically in future sessions.

HOST: Huh. So it's like... self-documenting its experience with my project.

EXPERT: Exactly. And the key thing is, this is local to your machine. It's stored in `~/.claude/projects/`, not in your git repo. So it's your personal knowledge base that Claude builds up over time.

HOST: Okay, I have a question though. How much of this actually gets loaded? Like, if it's writing a bunch of notes over weeks and weeks, doesn't that get huge?

EXPERT: Great question. So there's a limit—the first 200 lines of the memory index file get loaded at session start. CLAUDE.md files load in full, but it's recommended to keep them concise. If they're too long, adherence actually drops.

HOST: Interesting. So shorter, more focused instructions work better than a massive tome of rules.

EXPERT: Exactly. Be specific, be concise. "Use 2-space indentation" works better than "format code properly."

HOST: Makes sense. Okay, so we've covered the basics—terminal-based, permission system, Plan Mode, sessions, memory. What else makes this thing powerful?

EXPERT: Ooh, skills. This is where it gets really fun.

HOST: Skills?

EXPERT: Yeah. So Claude Code supports this open standard called Agent Skills—

HOST: Wait, open standard?

EXPERT: Yeah, it's called agentskills.io. The idea is that skills are portable across different AI tools, not just Claude. But basically, a skill is a way to extend Claude's capabilities by teaching it how to do specific tasks in a repeatable way.

HOST: Like... custom commands?

EXPERT: Exactly. In fact, they evolved from what used to be called custom commands. Now they've been merged into this skills system. And a skill is just a folder with a SKILL.md file inside.

HOST: SKILL.md. So similar naming convention to CLAUDE.md.

EXPERT: Yep. And this file has YAML frontmatter at the top—metadata like the skill's name, description, what tools it's allowed to use—and then markdown instructions below.

HOST: Okay, give me an example. What would you actually use a skill for?

EXPERT: Let's say you have a specific deployment process. You need to run tests, build the app, push to your deployment target, verify it succeeded. You could write a skill called "deploy" that encodes all those steps. Then you just type `/deploy`, and Claude follows your instructions exactly.

HOST: Oh! So it's like creating your own custom workflows.

EXPERT: Exactly. Or here's another one—documentation fetching. Let's say you're working with a specific library, like Dexie.js, and you want Claude to have the most current documentation instead of relying on training data from months ago. You can create a skill that fetches the docs from the web first, then answers your question.

HOST: Wait, so the skill can fetch documentation on the fly?

EXPERT: Yeah. You use the `allowed-tools` field in the frontmatter to give the skill access to WebFetch. Then the skill instructions say "first fetch the docs from this URL, then answer the user's question based on those docs."

HOST: That's... okay, that's actually really clever. Because you're working around the training cutoff problem.

EXPERT: Exactly! And skills can be auto-invoked or manual-only.

HOST: What's the difference?

EXPERT: So by default, Claude can decide to invoke a skill automatically if the task matches the skill's description. The description is key—that's how Claude knows when to use it. But if you set `disable-model-invocation: true` in the frontmatter, only you can trigger it manually with the slash command.

HOST: So like, a deployment skill would probably be manual-only, because you don't want Claude randomly deciding to deploy your app.

EXPERT: Exactly! You want explicit control over that. But something like API conventions or code style guidelines—those could be auto-invoked whenever Claude's working on relevant code.

HOST: This is making me think... where do skills live? Are they per-project or global?

EXPERT: Both! Same hierarchy as CLAUDE.md. You can put skills in `~/.claude/skills/` for all your projects, or `.claude/skills/` for just the current project. And there's even support for nested skills in subdirectories, which is great for monorepos.

HOST: Okay, so you mentioned frontmatter. What else can you configure in there?

EXPERT: Oh man, there's a lot. You've got `name`, which becomes the slash command. `description`, which is how Claude decides when to use it. `argument-hint` for autocomplete. `allowed-tools` to restrict what the skill can do—super useful for safety.

HOST: What do you mean, for safety?

EXPERT: Well, imagine you have a skill that's just for reading and exploring code. You don't want it accidentally modifying files. So you set `allowed-tools: Read, Grep, Glob`. Now even if the skill's instructions somehow led to an edit, it physically can't execute that tool.

HOST: Oh, so it's like... permissions at the skill level.

EXPERT: Exactly. And there's more—you can set `context: fork` to run the skill in an isolated subagent context.

HOST: Wait, what does that mean?

EXPERT: So normally, skills are injected into your main conversation. They see all the context you've been building up. But sometimes you want a clean slate—like, you're generating a pull request summary and you don't want the subagent to be biased by your conversation history. You set `context: fork`, and it runs in isolation.

HOST: Huh. So it's like spawning a separate Claude instance just for that task.

EXPERT: Basically, yeah. And you can even specify which model or which agent type to use. Like, if it's a simple task, you might use the Haiku model to save on cost and latency.

HOST: This is getting pretty sophisticated.

EXPERT: It is. And we haven't even talked about hooks yet.

HOST: Okay, you have to tell me about hooks because that sounds ominous.

EXPERT: Hooks are... okay, so you know how CLAUDE.md files are like guidelines that Claude should follow, but there's no guarantee it always will?

HOST: Yeah, because it's an LLM. It's probabilistic, not deterministic.

EXPERT: Exactly. Hooks are the deterministic counterpart. They're shell commands that run at specific points in Claude Code's lifecycle, and they execute every single time, no exceptions.

HOST: Oh. So they're like... enforced rules instead of suggestions.

EXPERT: Exactly! Think of CLAUDE.md as a style guide, and hooks as the linter that enforces it. You can't rely on Claude to always remember to format your code, but you can write a PostToolUse hook that runs Prettier after every file edit.

HOST: Wait, after every edit?

EXPERT: Yep. Every time Claude successfully uses the Edit or Write tool, the hook fires. So you extract the file path from the hook input, pipe it to Prettier, and boom—your code is always formatted, no matter what.

HOST: That's... okay, that's kind of brilliant. What else can you do with hooks?

EXPERT: Oh man, so much. You can block dangerous commands before they execute—like, prevent Claude from ever touching your .env file or your package-lock.json.

HOST: How does that work?

EXPERT: You write a PreToolUse hook with a matcher for Edit and Write. The hook receives JSON on stdin with the tool name and the file path Claude wants to modify. You check if the path matches any protected patterns, and if it does, you exit with code 2. That blocks the action entirely.

HOST: And Claude gets a message saying "hey, you can't do that"?

EXPERT: Exactly. Whatever you write to stderr becomes Claude's feedback. So you might say "Blocked: .env files are protected." And Claude understands and tries a different approach.

HOST: Okay, that's actually really powerful. What are the other hook types? You said PreToolUse—

EXPERT: Yeah, so there's PreToolUse and PostToolUse for tool execution, SessionStart for when a session begins or resumes, Stop for when Claude finishes responding, Notification for when it needs your attention... there's a whole lifecycle of events.

HOST: And these are all configured in JSON?

EXPERT: Yep, in `.claude/settings.json` or `~/.claude/settings.json`. You define the event, a matcher pattern—like "Edit|Write"—and then the hook command.

HOST: So the matcher is like... filtering which tools trigger the hook?

EXPERT: Exactly. Without a matcher, the hook fires on every occurrence of that event. With a matcher, it only fires when the tool name matches the regex.

HOST: Got it. And you said there are different types of hooks, not just command hooks?

EXPERT: Yeah! Command hooks run shell scripts, but there are also prompt hooks and agent hooks.

HOST: What's a prompt hook?

EXPERT: It's a single Claude API call for judgment-based decisions. Like, instead of writing shell logic to evaluate something complex, you just ask Claude. The hook sends a prompt to the API, gets a response, and uses that to decide whether to allow or block something.

HOST: Huh. So you're using Claude to moderate Claude.

EXPERT: Exactly! And agent hooks go even further—they spawn a whole subagent with tool access. So you could have a Stop hook that runs your entire test suite before allowing Claude to stop working.

HOST: Wait, that's... so if my tests fail, Claude can't stop?

EXPERT: Well, you have to be careful with that because you can create infinite loops. But yeah, the idea is you can enforce quality gates. Like, "don't mark this task complete until the tests pass."

HOST: Okay, I'm seeing the power here, but this also feels like it could get complicated fast. How do you know when to use hooks versus skills versus CLAUDE.md?

EXPERT: Great question. So CLAUDE.md is for guidance—"here's how we do things on this project." Skills are for repeatable workflows you want to invoke—either manually or automatically when relevant. And hooks are for things that must always happen, no exceptions.

HOST: So like... CLAUDE.md says "we prefer functional components in React," a skill might help you generate a component following that pattern, and a hook would auto-format the file after Claude writes it.

EXPERT: Perfect example! And here's the thing—they all work together. Your CLAUDE.md sets the standards, your skills encode common tasks, and your hooks enforce the invariants you can't compromise on.

HOST: This is making me think about team workflows. Like, if I'm working on a team, how much of this gets shared?

EXPERT: So CLAUDE.md files at the project level get checked into git, so your whole team shares them. Same with project-level skills. But hooks and auto memory are local to your machine.

HOST: Why isn't auto memory shared?

EXPERT: Privacy and personalization. Auto memory includes things Claude learned from your specific sessions—maybe debugging approaches that worked for your local environment, or commands you frequently run. That's not necessarily relevant to your teammates.

HOST: That makes sense. And if you want to share something you learned, you'd just add it to CLAUDE.md.

EXPERT: Exactly. Auto memory is the scratchpad, CLAUDE.md is the published documentation.

HOST: Okay, I want to go back to something you mentioned earlier—git integration. How does Claude actually work with git?

EXPERT: So it understands git workflows natively. You can ask it to commit changes, create pull requests, even work with git worktrees.

HOST: Wait, worktrees?

EXPERT: Yeah, this is a cool feature. You can do `claude --worktree feature-auth`, and it creates a new git worktree with that branch and starts a Claude session in it. So you can work on multiple features in parallel without switching branches.

HOST: Oh! So each worktree gets its own Claude session?

EXPERT: Exactly. And they get separate auto memory, too, which makes sense because different branches might be in different states.

HOST: Huh. I've never really used git worktrees, but that actually sounds useful.

EXPERT: It's super handy for context-switching. And when you're ready to commit, you can either ask Claude explicitly or use the `/commit-push-pr` command that does the whole workflow—commit, push, create PR—in one go.

HOST: And Claude writes the commit message?

EXPERT: Yeah, it analyzes the diff and writes a descriptive message. And here's something cool—it looks at your recent commit history to match the style of your project.

HOST: Oh, so if your team uses conventional commits or whatever, it picks up on that?

EXPERT: Exactly. It's context-aware. And every commit gets a co-authored-by tag that says "Claude Sonnet 4.5" so it's transparent that AI was involved.

HOST: I like that. It's honest about the collaboration.

EXPERT: Yeah. And speaking of collaboration, there's this whole thing about installation and deployment that I think is worth mentioning because it's different from most tools.

HOST: What do you mean?

EXPERT: So the recommended installation method uses a native installer—curl for Mac and Linux, PowerShell for Windows. And this is important because native installations auto-update in the background.

HOST: Okay, but you can also install via Homebrew, right?

EXPERT: You can, but Homebrew and WinGet don't auto-update. You have to manually run the upgrade command. And sometimes Claude notifies you about updates before they're even available in the package manager, which is confusing.

HOST: So the recommendation is to use the native installer?

EXPERT: Yeah. Just curl the install script and run it. It's one line. And then you never have to think about updates again.

HOST: What about access? Do you need a paid account?

EXPERT: Yeah, you need Claude Pro, Max, Teams, Enterprise, or a Console account with credits. The free Claude.ai tier explicitly doesn't include Claude Code access.

HOST: Gotcha. So there's a cost barrier to entry.

EXPERT: Yeah, but if you're using it professionally, it's worth it. The time savings are real. And for enterprise users, there's also support for authenticating through Bedrock, Vertex, or Foundry if you're on those platforms.

HOST: Okay, we've covered a lot of ground here. Let me see if I can synthesize this. Claude Code is a terminal-based coding assistant that contextually understands your codebase. It has a permission system for safety, Plan Mode for exploration, persistent sessions with memory, and extensibility through skills and hooks. It integrates with git, supports automation, and works anywhere you have a command line.

EXPERT: That's a great summary. And I think the key thing people miss is that it's not trying to replace your IDE or your brain. It's trying to be a teammate that handles the tedious stuff so you can focus on the interesting problems.

HOST: Right, like... it's not magic. It's automation and context.

EXPERT: Exactly. And the context part is huge. The fact that it can read your entire project structure, remember your preferences across sessions, and apply learned patterns—that's what makes it feel less like a tool and more like a collaborator.

HOST: Yeah. Although I will say, the learning curve seems real. Like, there's a lot to configure if you want to get the most out of it.

EXPERT: For sure. But here's the thing—you can start simple. Install it, run `claude` in your project, ask it questions. You don't need to write CLAUDE.md files or create skills or set up hooks on day one.

HOST: Just start with the interactive mode.

EXPERT: Exactly. And as you use it more, you'll naturally hit friction points. Like, "oh, I keep having to tell Claude to use pnpm instead of npm." Okay, add that to CLAUDE.md. Or "I wish it would run Prettier automatically." Cool, write a PostToolUse hook.

HOST: So it's progressive enhancement.

EXPERT: Yeah, great way to put it. The baseline experience is already useful, and then you layer on customization as you discover what you need.

HOST: What about debugging Claude itself? Like, what if something's not working the way you expect?

EXPERT: There's a `claude doctor` command that diagnoses configuration issues. And you can toggle verbose mode with Ctrl+O to see Claude's internal thinking process.

HOST: Oh, so you can see what it's actually considering before it responds?

EXPERT: Yep. Sometimes that's helpful for understanding why it made a certain choice, or if it's getting stuck on something.

HOST: And there's a `/help` command, I assume?

EXPERT: Yeah, `/help` lists all the slash commands. And typing `?` shows you keyboard shortcuts. There's actually a bunch of shortcuts that aren't super obvious—like double-tapping Escape to see previous messages, or Tab for command completion.

HOST: The Shift+Tab cycling through permission modes—that's the one that would trip me up. Normal, Auto-Accept, Plan Mode.

EXPERT: Yeah, you have to press it twice to get to Plan Mode, which is a little unintuitive at first. But once you internalize it, it becomes muscle memory.

HOST: Are there gotchas people should know about? Like, things that don't work the way you'd expect?

EXPERT: Oh yeah, definitely. One big one is that Ctrl+C exits Claude entirely, not just cancels the current operation. You have to use Escape to stop Claude mid-action.

HOST: Wait, really? That's... that's going to mess me up because every terminal tool uses Ctrl+C for cancellation.

EXPERT: I know, it's counterintuitive. But they made that choice deliberately. Escape stops Claude, Ctrl+C exits the session.

HOST: Okay, what else?

EXPERT: Uhh, let's see... Windows users need Git for Windows even if they have WSL. Claude Code uses Git Bash internally. And WSL 1 doesn't support sandboxing, so you need WSL 2 if you want the enhanced security features.

HOST: Sandboxing?

EXPERT: Yeah, Claude Code can run commands in a sandboxed environment to prevent accidental damage. But that requires WSL 2 on Windows.

HOST: Got it. What about the 200-line limit on auto memory—does that actually become a problem?

EXPERT: It can if you're not curating it. The idea is that only the first 200 lines of the memory index file load at session start, so if important stuff gets pushed past line 200, Claude won't see it.

HOST: So you have to occasionally go in and clean it up?

EXPERT: Yeah, or restructure it. You can use the `/memory` command to browse and edit memory files directly from Claude.

HOST: Okay. And you mentioned path-scoped rules earlier—how does that actually work?

EXPERT: So you create rule files in `.claude/rules/` with YAML frontmatter at the top. You specify a `paths` field with glob patterns like "src/api/**/*.ts", and those rules only apply when Claude's working with files that match those patterns.

HOST: Oh, so like... different rules for frontend versus backend code?

EXPERT: Exactly. Your React components might have different conventions than your API endpoints, and you can encode that without cluttering up your main CLAUDE.md.

HOST: That's smart. Keeps things modular.

EXPERT: Yeah. And you can even import files into CLAUDE.md using @ syntax—like "@docs/git-workflow.md"—so you can keep your main instructions file short and reference detailed docs elsewhere.

HOST: How deep can you nest imports?

EXPERT: Five hops. So you can't go crazy with it, but it's enough for most use cases.

HOST: Okay, last question. We've talked about a lot of features, but if you had to pick the one thing that makes Claude Code different from other AI coding tools, what would it be?

EXPERT: Hmm. That's tough because it's really the combination of things. But if I had to pick one... I think it's the fact that it's built for workflows, not just code generation. The session persistence, the memory system, the git integration, the hooks—it's all designed around the idea that you're working on a project over time, not just asking one-off questions.

HOST: So it's long-term context, not just short-term assistance.

EXPERT: Exactly. Most AI coding tools are like "ask me a question, get an answer, done." Claude Code is more like "let's work on this project together over the next few weeks, and I'll remember what we learn along the way."

HOST: That's a good distinction. It's less transactional.

EXPERT: Yeah. And that's why the memory system matters so much, and why skills and hooks are important—because you're building up knowledge and automation that compounds over time.

HOST: Okay, I'm sold. Where do people go to get started?

EXPERT: code.claude.com. There's a quickstart guide, installation instructions, all the docs. And if you have a Claude Pro or higher subscription, you can just curl the install script and start immediately.

HOST: And there's a GitHub repo?

EXPERT: Yep, github.com/anthropics/claude-code. That's where you can file issues, see the changelog, all the usual open-source stuff.

HOST: Cool. Alright, I think we covered everything. CLAUDE.md files, auto memory, skills, hooks, git workflows, Plan Mode, session management... this is a lot more than I expected when you first said "terminal-based coding assistant."

EXPERT: Yeah, there's a surprising amount of depth here. And honestly, we didn't even get into MCP servers or some of the more advanced customization stuff.

HOST: MCP servers?

EXPERT: Model Context Protocol. It's a way to extend Claude with external integrations—like connecting to databases or APIs. But that's probably a whole other conversation.

HOST: Yeah, let's save that for another episode. I think my brain is full.

EXPERT: Fair enough. But seriously, if people are doing any kind of regular coding work, especially in the terminal, Claude Code is worth checking out. The learning curve pays off.

HOST: Agreed. And the fact that it works over SSH alone makes it interesting. I can think of so many scenarios where that's useful.

EXPERT: Right? Like, you're deploying something to a server and hit an error—just SSH in, run `claude`, paste the error, and ask what's wrong. No need to context-switch back to your laptop.

HOST: That's actually what I did yesterday. The API issue I mentioned.

EXPERT: And it worked?

HOST: It did. I mean, I still had to understand the fix and apply judgment, but it got me to the solution way faster than I would have on my own.

EXPERT: That's the sweet spot. It's not replacing your expertise; it's amplifying it.

HOST: Exactly. Alright, I think that's a good place to leave it. Thanks for the deep dive.

EXPERT: Anytime. This was fun.
