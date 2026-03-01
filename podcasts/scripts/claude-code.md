# Podcast: Claude Code and Skills

**Episode Topic:** Claude Code and Skills
**Estimated Duration:** 35 minutes
**Based on:** /Users/jackjin/dev/harness-v2-test/research/_combined_claude-code.md

---

## Opening

HOST: So picture this—you're SSH'd into a remote server, no fancy IDE, just a terminal. You need to refactor some code, write tests, maybe fix a bug. Normally you'd be jumping between reading files, searching for patterns, trying to keep everything in your head. But what if you had an AI coding assistant right there in your terminal that could see your entire codebase?

EXPERT: That's exactly what Claude Code is. It's an agentic AI tool that lives in your terminal. Not an IDE plugin, not a web app—just `claude` at your command prompt. And it's surprisingly powerful because it's not just autocomplete. It can read your files, understand your project structure, execute commands, commit changes, even create pull requests.

HOST: Wait, so this is different from, say, GitHub Copilot or Cursor?

EXPERT: Very different. Those tools are great at inline suggestions while you type. Claude Code operates at a higher level—you describe what you want in natural language, and it figures out how to do it. Think of it more like pair programming with someone who can see your whole codebase. You might say "find the bug causing this error" and it'll search through files, trace the logic, suggest fixes, and apply them if you approve.

HOST: And it all happens in the terminal?

EXPERT: Exactly. Which means it works everywhere—your local machine, remote servers, Docker containers, SSH sessions, even in CI/CD pipelines. Anywhere you have a terminal.

## Understanding the Basics

HOST: Okay, so I install it and just type `claude`?

EXPERT: That's the basic idea. There are two main modes. If you type `claude` by itself, you enter interactive mode—it's like starting a conversation. You can ask questions about your code, request changes, get explanations. The session stays open until you exit, so you can have back-and-forth dialogue.

HOST: And the other mode?

EXPERT: One-shot mode. You run `claude "do something"` and it executes that single task and exits. Super useful for automation. Like you could have `claude "review my changes against main and report issues"` as a git hook or npm script.

HOST: I love that. But here's what I'm wondering—how does it know about my project? Do I have to feed it files manually like with ChatGPT?

EXPERT: No, and that's one of the best parts. Claude Code automatically reads files as it needs them. You don't build up context manually. It starts in your current directory and can explore from there. If you ask "explain the authentication flow," it'll search for relevant files, read them, piece together the logic, and explain it to you.

HOST: So it's doing its own file discovery?

EXPERT: Right. Think of it like a new developer joining your team. They don't read every file upfront—they explore as questions arise. Claude does the same thing, but much faster.

## The Permission System

HOST: That sounds powerful, but also a little scary. What if it just starts modifying files on its own?

EXPERT: Great concern! That's where the permission system comes in. Claude Code never modifies files without asking. Every time it wants to edit, write, or delete something, you get a prompt showing exactly what it plans to do. You can approve, reject, or modify the change.

HOST: So I'm reviewing every change?

EXPERT: By default, yes. Though there are shortcuts. You can enable "Accept All" mode for a session if you trust what Claude's doing. Or—and this is cool—you can use Plan Mode.

HOST: Plan Mode?

EXPERT: It's a read-only analysis mode. Press Shift+Tab twice and Claude can explore your code, read files, analyze architecture, create implementation plans—but it can't modify anything. It's perfect when you want to understand something complex or plan a big refactor before committing to changes.

HOST: Oh, that's smart. So I could say "analyze this codebase and tell me how to add dark mode" and it'll create a plan without touching any files?

EXPERT: Exactly. It'll read your components, understand your styling approach, identify what needs changing, and lay out a step-by-step plan. Then you can exit Plan Mode and execute the plan if it looks good.

HOST: I'm already thinking of use cases. But wait—you said press Shift+Tab twice?

EXPERT: Yeah, the permission modes cycle. First Shift+Tab enables Auto-Accept, second one enables Plan Mode. You'll see an indicator at the bottom of your terminal showing which mode you're in.

HOST: And I'm guessing there's a way to stop Claude mid-action if it's going down the wrong path?

EXPERT: Press Escape. Not Ctrl+C though—that's a gotcha. Ctrl+C exits Claude entirely, like quitting the program. Escape just stops the current action while keeping your session alive.

HOST: Why is that different from every other terminal tool?

EXPERT: It's unconventional, I'll admit. I think the reasoning is that Claude Code sessions are conversational—you don't usually want to kill the whole session, just interrupt what it's currently doing. But yeah, it trips people up at first.

## Memory and Context

HOST: So let's say I have a good session with Claude—we fix a bug, write some tests, everything works. I close my terminal. Next day, I open a new session. Does Claude remember any of that?

EXPERT: Two different memory systems at play here. First, session history. You can resume previous conversations with `claude --continue` for the most recent one, or `claude --resume` to pick from a list. If you name your sessions with `/rename auth-refactor`, you can jump back with `claude --resume auth-refactor`.

HOST: So it's like continuing a Slack thread?

EXPERT: Good analogy. Same conversation, full history. But here's the more interesting part—even in a new session, Claude can remember project-specific knowledge through the memory system.

HOST: How does that work?

EXPERT: Two mechanisms. First, you can create CLAUDE.md files—think of them as onboarding docs for Claude. You write down your build commands, coding standards, architecture decisions, whatever Claude should know. These files live in your repo and load automatically at the start of every session.

HOST: So like a README but specifically for the AI?

EXPERT: Exactly. And they can be hierarchical. You might have one at the project root with team standards, and then `CLAUDE.local.md` for your personal preferences that you don't commit to git. There's even `~/.claude/CLAUDE.md` that applies to all your projects.

HOST: And the second mechanism?

EXPERT: Auto memory. Claude can write notes for itself. When you correct it—"no, we use pnpm not npm"—it can remember that. When it discovers your test command or figures out how your build works, it saves those discoveries. Next session, that knowledge is already loaded.

HOST: Wait, so I can just tell Claude "remember we use two-space indentation" and it'll actually remember?

EXPERT: Yep. Just say it explicitly: "Remember that this API requires a Redis instance running locally" or whatever. Claude writes it to auto memory immediately, and it'll be there next time.

HOST: That's way better than repeating yourself every session. Where does that memory live?

EXPERT: In `~/.claude/projects/<your-project>/memory/`. It's local to your machine, not shared with the team. That's important to understand—auto memory is yours. CLAUDE.md files can be committed and shared.

## Skills: Extending Claude's Capabilities

HOST: Okay, so I'm using Claude Code, I've got my CLAUDE.md set up, memory is working. What about extending it? Can I teach it custom workflows?

EXPERT: That's where skills come in. Skills are basically instruction files that teach Claude how to perform specific repeatable tasks. They follow an open standard called Agent Skills, so they work across multiple AI tools, not just Claude Code.

HOST: Give me an example of what a skill would be useful for.

EXPERT: Deployment workflows are a classic one. Let's say your deploy process has five steps: run tests, build the app, push to staging, verify health checks, then promote to production. You could explain that every time, or create a `/deploy` skill that encodes those steps. Then you just type `/deploy staging` and Claude follows the exact process.

HOST: So it's like creating custom commands?

EXPERT: Skills evolved from custom commands, actually. They're more powerful now though. A skill is a folder containing `SKILL.md` with instructions, plus any supporting files—templates, scripts, reference docs.

HOST: And Claude automatically discovers these?

EXPERT: Yep. It looks in `~/.claude/skills/` for personal/global skills, and `.claude/skills/` at the project level. When you start a session, Claude loads all the skill descriptions into context so it knows what's available.

HOST: Can Claude invoke skills automatically, or do I have to trigger them?

EXPERT: Both. By default, Claude can invoke skills when the task matches the skill's description. That description field is crucial—it's how Claude decides when to apply the skill. But you can also manually trigger any skill with `/skill-name`.

HOST: So if I create a skill with description "Generate API documentation for endpoints," Claude might use it automatically when I ask it to document my API?

EXPERT: Exactly. Though you can disable auto-invocation with `disable-model-invocation: true` in the skill's frontmatter. Then it's manual-only.

HOST: What's frontmatter?

EXPERT: YAML metadata at the top of SKILL.md, between triple-dash markers. It controls how the skill behaves—name, description, whether it's auto-invokable, which tools it can use, which model to use, stuff like that.

HOST: Which tools it can use? Skills can be restricted?

EXPERT: Yeah, the `allowed-tools` field. Let's say you create a read-only exploration skill. You'd set `allowed-tools: Read, Grep, Glob` and now that skill can't accidentally modify files. It's sandboxed to just reading and searching.

HOST: That's clever. Are there other skill patterns people commonly use?

EXPERT: A few. Documentation fetching is popular—skills that pull current docs from the web to avoid relying on potentially outdated training data. Like if you're using a fast-moving library, you'd create a skill that fetches the latest docs and then answers based on them.

HOST: So it's like giving Claude the ability to Google?

EXPERT: More like giving it the ability to check the manual. Here's another pattern: reference skills. These aren't really workflows, just domain knowledge. You might have an `api-conventions` skill that describes your API design patterns. Claude reads it and applies those patterns when writing endpoints.

HOST: And these are just markdown files with instructions?

EXPERT: Yep. The skill might say "When writing API endpoints, use RESTful naming, return consistent error formats, include input validation." Claude reads that and follows it.

HOST: Couldn't you just put that in CLAUDE.md?

EXPERT: You could! Skills are really useful when you want modularity. In a large project, you might have separate skills for frontend conventions, backend patterns, deployment steps, testing strategies. Easier to manage than one giant CLAUDE.md. Plus skills can be scoped to specific file patterns using the `paths` field.

HOST: Scoped to file patterns?

EXPERT: Yeah, using glob patterns. You could have a skill that only applies when Claude is working with files matching `src/api/**/*.ts`. So your API conventions only kick in when you're actually writing API code.

## Hooks: Deterministic Control

HOST: This is all making sense. But here's a question—everything so far relies on Claude choosing to do the right thing, right? Like, Claude should follow your CLAUDE.md, Claude might invoke a skill. What if you need something to happen every single time, no exceptions?

EXPERT: That's exactly what hooks solve. Hooks are shell commands that execute at specific points in Claude Code's lifecycle, deterministically. No LLM involved—just pure automation.

HOST: So like git hooks, but for Claude Code?

EXPERT: Very similar concept. You define lifecycle events—like "before any tool executes" or "after Claude finishes responding" or "when a session starts"—and attach commands that run at those moments.

HOST: Give me a concrete example.

EXPERT: Auto-formatting. Let's say you want every file Claude edits to automatically run through Prettier. You create a `PostToolUse` hook that matches the `Edit` and `Write` tools, and runs `prettier --write` on the modified file.

HOST: And this happens every time Claude edits a file?

EXPERT: Every time, without fail. Claude doesn't have to remember to format—the hook ensures it. That's the key difference from instructions in CLAUDE.md. Instructions are suggestions; hooks are enforcement.

HOST: What other lifecycle events can you hook into?

EXPERT: Several. `PreToolUse` runs before a tool executes—useful for blocking dangerous operations. `SessionStart` runs when you start or resume a session—great for injecting context. `Stop` runs when Claude finishes responding—you could verify tests pass before letting Claude stop. `Notification` runs when Claude needs attention—perfect for desktop notifications.

HOST: Wait, you can block operations? Like prevent Claude from doing something?

EXPERT: Absolutely. That's what makes `PreToolUse` powerful. You could create a hook that blocks any edits to certain files—like `.env` or `package-lock.json`. If Claude tries to modify them, the hook intercepts, returns exit code 2, and Claude gets told "blocked, that file is protected."

HOST: So this is like a safety system.

EXPERT: Exactly. You can't always trust an LLM to remember rules, especially around security or critical files. Hooks let you encode hard constraints.

HOST: How do hooks get input? Like, how does my hook script know which file Claude is trying to edit?

EXPERT: Every hook receives JSON on stdin with context about what's happening. For a `PreToolUse` hook, you'd get the tool name and tool inputs—which includes the file path for Edit or Write tools. You parse that JSON, make your decision, and communicate back via exit codes or structured JSON output.

HOST: So if exit code 0, proceed?

EXPERT: Right. Exit 0 means "all good, proceed." Exit 2 means "block this action." And you can return more nuanced decisions using JSON—like `permissionDecision: allow` to skip the approval prompt, or `deny` with a reason that gets sent to Claude.

HOST: That's sophisticated. Are there simpler hook types for people who don't want to write shell scripts?

EXPERT: Yeah, you can use `prompt` hooks instead of `command` hooks. A prompt hook makes a single API call to Claude with your instructions. Like "evaluate whether this command is safe to run" and Claude judges it.

HOST: And there's an `agent` hook type too, right?

EXPERT: Good memory. Agent hooks spawn a full subagent with tool access for complex verification. Like you could have a Stop hook that runs `npm test` and verifies everything passes before Claude is allowed to finish.

HOST: Wait, wouldn't that run tests every single time Claude responds?

EXPERT: It would, which is why you have to be thoughtful about Stop hooks. Though there's a gotcha here—Stop hooks can create infinite loops if they trigger Claude to continue working. You have to check `stop_hook_active` in the hook input and exit early if it's true.

HOST: That sounds dangerous if you don't know about it.

EXPERT: It is! That's definitely a sharp edge. Hooks are powerful, but you need to understand their behavior.

## Common Gotchas and Mistakes

HOST: Speaking of gotchas, we've touched on a few. What are the biggest mistakes people make with Claude Code?

EXPERT: The Ctrl+C thing trips everyone up. You instinctively press Ctrl+C to stop something, but it kills Claude entirely. Use Escape instead.

HOST: We covered that one. What else?

EXPERT: Installation method matters more than people think. There's a native installer—the curl or PowerShell script—and then there are package managers like Homebrew and WinGet. The native install auto-updates in the background. Homebrew and WinGet don't.

HOST: So if I install via Homebrew, I'm stuck on that version until I manually upgrade?

EXPERT: Exactly. Claude might tell you an update is available before Homebrew even has it. It's frustrating. Just use the native installer unless you have a specific reason not to.

HOST: What about with the memory system? Any common issues there?

EXPERT: Yeah, people don't realize auto memory is local to their machine. If you discover something useful—like "tests require Redis running"—and Claude saves it to auto memory, your teammates won't see that. You need to write it to CLAUDE.md if you want it shared.

HOST: That makes sense. What about the 200-line limit you mentioned earlier?

EXPERT: Right, auto memory only loads the first 200 lines of MEMORY.md at session start. CLAUDE.md files load in full, but if they're too long, Claude struggles to follow them. Keep things concise.

HOST: And with skills—what do people get wrong there?

EXPERT: The `disable-model-invocation` versus `user-invocable` fields confuse everyone. `disable-model-invocation: true` means Claude can't auto-trigger the skill—only you can with the slash command. But `user-invocable: false` hides it from the menu—only Claude can invoke it.

HOST: Wait, those seem contradictory.

EXPERT: They control different things. One is about auto-invocation by the AI, the other is about manual invocation by you. And there's a known bug where sometimes skills with `disable-model-invocation: true` refuse to run even when you explicitly type the command—Claude misinterprets the setting.

HOST: That sounds annoying.

EXPERT: It is. The workaround is usually just removing that field and trusting Claude not to over-trigger it, or keeping the description very specific so Claude knows exactly when to use it.

HOST: Speaking of descriptions, how important is that field really?

EXPERT: Critically important. The description is how Claude decides when to invoke the skill. Vague descriptions like "helps with code" result in inconsistent triggering. Specific ones like "generate OpenAPI documentation for REST endpoints" work much better.

HOST: What about hooks gotchas?

EXPERT: Oh, several. Scripts must be executable—`chmod +x` your hook files or they silently fail. Matchers are case-sensitive, so use `Edit|Write`, not `edit|write`. And if your shell profile prints anything on startup, it breaks JSON parsing because that output prepends to your hook's stdout.

HOST: How do you fix that?

EXPERT: Wrap noisy lines in your `.zshrc` or `.bashrc` with `if [[ $- == *i* ]]; then ... fi` so they only run in interactive shells. Hooks aren't interactive, so that output gets suppressed.

HOST: Any gotchas with Plan Mode?

EXPERT: Just that it requires two Shift+Tab presses. First press enables Auto-Accept, second enables Plan Mode. People often press it once and think Plan Mode is on, but it's actually in Auto-Accept.

HOST: Which would be the opposite of read-only.

EXPERT: Exactly. Very different outcomes! Always check the indicator at the bottom of your terminal.

## Practical Workflows

HOST: Let's talk about how people actually use this day-to-day. Walk me through a realistic bug-fixing workflow.

EXPERT: Sure. You see an error when running tests. You open Claude and say "I'm getting this error when I run npm test" and paste the error. Claude searches your codebase for the relevant files, reads the test file and the code being tested, identifies the issue—maybe a null pointer or wrong import—and suggests fixes.

HOST: Do you ask it to apply the fix right away?

EXPERT: You could, or you might ask for options first. "Suggest a few ways to fix this." Claude presents approaches, you pick one, then say "apply that fix." Claude edits the file, you approve, then you run tests again to verify.

HOST: And if the fix works, you'd commit?

EXPERT: Yep. You can say "commit my changes with a descriptive message" and Claude stages files, reads recent commit history to match your style, and creates a commit. Or use `/commit-push-pr` to do it all in one go—commit, push, and create a pull request.

HOST: That's a full feature delivery workflow.

EXPERT: Right. Or here's another one: refactoring. You say "I want to extract this logic into a separate utility function." Claude reads the file, identifies the code to extract, creates the new function, updates all call sites, and runs tests to make sure nothing broke.

HOST: Does it really run tests automatically?

EXPERT: If you ask it to, or if you have a hook set up. But generally Claude's good about offering to verify changes. You can also use Plan Mode for big refactors—"plan how to migrate this component to TypeScript"—and Claude maps out the steps without touching files.

HOST: What about exploring an unfamiliar codebase?

EXPERT: Classic use case. You clone a repo, run `claude`, and ask "what does this project do?" Claude reads the README, package.json, main entry points, and gives you a summary. Then "explain the folder structure" and it walks through the layout. "Where is the authentication handled?" and it finds and explains the auth flow.

HOST: All without you manually opening files.

EXPERT: Exactly. It's like having a coworker who's already familiar with the code giving you a tour.

HOST: What about integrating Claude into existing tools? You mentioned using it in npm scripts.

EXPERT: Yeah, one-shot mode is perfect for this. In your package.json, you could add a lint script: `claude -p 'review my changes against main and report issues'`. Run `npm run lint` and Claude analyzes your diff.

HOST: Or piping data through it?

EXPERT: Absolutely. `cat build-error.log | claude -p 'explain the root cause' > analysis.txt`. Claude reads the error log from stdin, analyzes it, and you capture the output.

HOST: That's treating Claude like any other command-line tool.

EXPERT: Which is the beauty of the CLI approach. It composes with everything else in your workflow.

## Team Workflows and Scaling

HOST: We've mostly talked about individual use. What about teams? How do you use Claude Code effectively across a team?

EXPERT: CLAUDE.md files are the primary mechanism. You commit them to your repo so everyone's Claude assistant follows the same standards. Think of it as a style guide that actually gets enforced.

HOST: What goes in a team CLAUDE.md?

EXPERT: Build commands, test commands, coding conventions, architecture decisions, deployment process. Basically, onboarding knowledge. "We use pnpm, not npm. Run tests with pnpm test. Use 2-space indentation. Our API follows REST conventions."

HOST: And everyone's Claude reads that automatically?

EXPERT: Yep. When anyone on your team runs `claude` in that repo, those instructions load. So you get consistency—everyone's AI assistant knows the same project standards.

HOST: What about personal preferences that differ between team members?

EXPERT: That's where CLAUDE.local.md comes in. It's gitignored, so you can add personal stuff like "I prefer verbose explanations" or "my local dev server runs on port 3001." Your preferences layer on top of team standards without conflicting.

HOST: Can you enforce rules company-wide?

EXPERT: Enterprise deployments can use managed policy CLAUDE.md. IT puts a file in `/Library/Application Support/ClaudeCode/CLAUDE.md` on macOS—every user gets those instructions, and they can't be overridden.

HOST: So you could enforce security policies that way.

EXPERT: Exactly. "Never access production databases directly" or "always use our internal auth library." Though remember, these are still instructions to an LLM, not hard constraints. For real enforcement, you'd use hooks.

HOST: Right, hooks are deterministic. Could you deploy hooks company-wide?

EXPERT: Hooks can be in project settings committed to git, so everyone gets them. Or enterprise teams can manage them through MDM systems. A common pattern is blocking modifications to sensitive files via PreToolUse hooks.

HOST: What about monorepos? Do they work well with Claude Code?

EXPERT: Yes, but you need to be thoughtful. Claude discovers CLAUDE.md files in subdirectories as it explores. In a monorepo with multiple teams, you might have different CLAUDE.md files in each package. You can use `claudeMdExcludes` in settings to ignore irrelevant ones.

HOST: Why would you exclude them?

EXPERT: To avoid context pollution. If you're working in the frontend package, you probably don't need the data pipeline team's CLAUDE.md loading. It just wastes context window.

HOST: Makes sense. What about skills in a team environment—do those get shared?

EXPERT: Skills in `.claude/skills/` at the project level are shared via git. Personal skills in `~/.claude/skills/` are just yours. So you might have team skills for deployment, code review, documentation generation, and personal skills for your own workflows.

HOST: Can skills call other skills?

EXPERT: Not directly, but Claude can chain them. Like your deploy skill might trigger a test skill which triggers a build skill. Claude orchestrates that.

## Wrap-up

HOST: Okay, we've covered a ton. Let's distill this down. If someone's brand new to Claude Code, what are the essential things to understand?

EXPERT: First, it's a terminal tool, not an IDE plugin. It works everywhere you have a terminal. Second, it's conversational—you describe what you want in natural language, and Claude figures out how to do it by exploring your codebase. Third, the permission system keeps you in control—Claude never modifies files without approval.

HOST: And for memory?

EXPERT: Two systems. CLAUDE.md files are instructions you write—think of them as onboarding docs for Claude. Auto memory is notes Claude writes for itself based on corrections and discoveries. Both load automatically at session start.

HOST: What about extending functionality?

EXPERT: Skills teach Claude custom workflows through instruction files. They can be automatically invoked when tasks match, or manually triggered with slash commands. Hooks provide deterministic control—shell commands that run at lifecycle events, useful for formatting, blocking dangerous operations, and enforcing policies.

HOST: And the biggest gotchas to avoid?

EXPERT: Use Escape to stop Claude, not Ctrl+C. Install with the native installer for auto-updates. Keep CLAUDE.md files concise—under 200 lines ideally. Auto memory is local to your machine, not shared with teammates. Skills need specific descriptions to auto-invoke reliably. And test your hooks carefully—they run every time their conditions match.

HOST: This really feels like a different paradigm from IDE extensions. It's more like having an AI teammate than a smart autocomplete.

EXPERT: That's a great way to put it. You're delegating tasks to an agent that can reason about your code, rather than just getting line-by-line suggestions. And because it's in the terminal, it integrates into any workflow—local development, remote servers, CI/CD, wherever you work.

HOST: Alright, I think that's a solid foundation. If people want to get started, what's the first step?

EXPERT: Install Claude Code with the native installer, make sure you have a paid Claude subscription, then `cd` into a project and just run `claude`. Ask it "what does this project do?" and see what happens. That first session will give you a feel for how it explores and explains. From there, experiment with having it make changes, create a CLAUDE.md for your project standards, maybe write a skill for a common workflow. The best way to learn is just to use it.

HOST: And we've got the official docs at code.claude.com if people want to dive deeper.

EXPERT: Exactly. The quickstart guide is particularly good for getting oriented.

HOST: Perfect. Thanks for breaking this down—I feel like I actually understand how to use this now, not just what it is.

EXPERT: My pleasure. It's a powerful tool once you get the concepts down. Happy coding!
