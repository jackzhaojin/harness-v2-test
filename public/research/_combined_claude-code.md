# Combined Research: Claude Code and Skills


---

# CLI Installation and Usage

**Topic ID:** claude-code.cli.basics
**Researched:** 2026-03-01T12:00:00Z

## Overview

Claude Code is Anthropic's agentic coding tool that operates directly in your terminal, providing AI-powered assistance for software development through natural language commands. Unlike traditional IDE extensions that require graphical interfaces, Claude Code integrates into command-line workflows, making it accessible from any terminal environment—including remote servers, SSH sessions, and CI/CD pipelines.

The tool understands your codebase contextually, reading project files as needed without requiring manual context addition. It can execute routine tasks, explain complex code, handle git workflows, refactor code, write tests, and create pull requests—all through conversational prompts. Claude Code supports multiple interfaces beyond the CLI, including a desktop app, VS Code and JetBrains IDE integrations, Slack, and GitHub Actions.

Access requires a Claude Pro, Max, Teams, Enterprise, or Console account. The free Claude.ai plan does not include Claude Code access. Enterprise users can also authenticate through Amazon Bedrock, Google Vertex AI, or Microsoft Foundry.

## Key Concepts

- **Native Installation**: The recommended installation method using platform-specific installers (`curl` for macOS/Linux, PowerShell for Windows). Native installations auto-update in the background, unlike Homebrew or WinGet installations which require manual updates.

- **Interactive Mode**: Starting Claude Code with just `claude` opens an interactive session where you can have ongoing conversations about your codebase. The session persists until you exit with `exit` or Ctrl+C.

- **One-shot Mode**: Using `claude "task"` or `claude -p "query"` executes a single command and returns results, useful for scripting and automation pipelines.

- **Permission System**: Claude Code always asks for permission before modifying files. You can approve individual changes, enable "Accept all" mode for a session, or use `--dangerously-skip-permissions` for fully automated workflows.

- **Plan Mode**: A read-only analysis mode activated with Shift+Tab (cycle twice) or `--permission-mode plan`. Claude analyzes code and creates plans without making changes—ideal for exploration and complex refactoring planning.

- **Session Management**: Conversations are saved automatically and can be resumed with `claude --continue` (most recent), `claude --resume` (picker), or `claude --resume session-name` (specific session). Use `/rename` to name sessions for easy retrieval.

- **CLAUDE.md**: The primary configuration file Claude reads at session start. Use it to define project context, coding conventions, and custom instructions.

- **Slash Commands**: Commands prefixed with `/` provide quick access to features: `/help`, `/clear`, `/resume`, `/rename`, `/permissions`, `/commit-push-pr`, etc.

## Technical Details

### Installation Commands

**macOS/Linux/WSL (Recommended):**
```bash
curl -fsSL https://claude.ai/install.sh | bash
```

**Windows PowerShell:**
```powershell
irm https://claude.ai/install.ps1 | iex
```

**Windows CMD:**
```batch
curl -fsSL https://claude.ai/install.cmd -o install.cmd && install.cmd && del install.cmd
```

**Homebrew (does not auto-update):**
```bash
brew install --cask claude-code
```

**WinGet (does not auto-update):**
```powershell
winget install Anthropic.ClaudeCode
```

### System Requirements
- **macOS**: 13.0+
- **Windows**: 10 1809+ or Server 2019+ (requires Git for Windows or WSL)
- **Linux**: Ubuntu 20.04+, Debian 10+, Alpine 3.19+
- **RAM**: 4GB minimum
- **Network**: Internet connection required

### Core CLI Commands

| Command | Description |
|---------|-------------|
| `claude` | Start interactive mode |
| `claude "task"` | Run a one-time task |
| `claude -p "query"` | Run query and exit immediately |
| `claude -c` | Continue most recent conversation |
| `claude -r` | Resume a previous conversation (picker) |
| `claude --resume name` | Resume specific named session |
| `claude commit` | Create a Git commit |
| `claude --version` | Check installed version |
| `claude doctor` | Diagnose configuration issues |
| `claude update` | Manually apply updates |

### Output Formats for Scripting

```bash
# Plain text output (default)
claude -p "summarize this" --output-format text

# JSON array with metadata
claude -p "analyze this" --output-format json

# Streaming JSON for real-time processing
claude -p "process this" --output-format stream-json
```

### Terminal Shortcuts

| Shortcut | Action |
|----------|--------|
| `Escape` | Stop Claude (not Ctrl+C) |
| `Escape` twice | Show previous messages list |
| `Shift+Tab` | Cycle permission modes (Normal → Auto-Accept → Plan) |
| `Tab` | Command completion |
| `↑` | Command history |
| `?` | Show all keyboard shortcuts |
| `Ctrl+G` | Open plan in text editor (Plan Mode) |
| `Ctrl+O` | Toggle verbose mode (show thinking) |

## Common Patterns

### First Session Workflow
```bash
cd /path/to/your/project
claude
> what does this project do?
> explain the folder structure
> where is the main entry point?
```

### Bug Fixing Workflow
```bash
claude
> I'm seeing an error when I run npm test
> suggest a few ways to fix the issue
> apply the fix you suggested
```

### Git and PR Workflow
```bash
claude
> what files have I changed?
> commit my changes with a descriptive message
> create a pr for my changes
```
Or use the combined skill:
```
> /commit-push-pr
```

### Piping Data Through Claude
```bash
# Analyze build errors
cat build-error.txt | claude -p 'explain the root cause' > analysis.txt

# Use as a linter in package.json
"lint:claude": "claude -p 'review changes vs. main and report issues'"
```

### Using Git Worktrees for Parallel Work
```bash
# Create isolated worktree and start Claude in it
claude --worktree feature-auth

# Auto-generate worktree name
claude --worktree
```

### Session Management Best Practice
```bash
# Name sessions when starting distinct tasks
claude
> /rename auth-refactor

# Resume later by name
claude --resume auth-refactor
```

## Gotchas

- **npm installation is deprecated**: While `npm install -g @anthropic-ai/claude-code` still works, prefer the native installer for auto-updates and better performance. Never use `sudo npm install -g` as it causes permission issues.

- **Ctrl+C exits entirely**: Unlike most CLI tools, pressing Ctrl+C exits Claude Code completely. Use `Escape` to stop Claude mid-action while staying in the session.

- **Homebrew/WinGet don't auto-update**: If you installed via Homebrew or WinGet, you must manually run `brew upgrade claude-code` or `winget upgrade Anthropic.ClaudeCode`. Claude may notify you of updates before they're available in these package managers.

- **Windows requires Git for Windows**: Even if you have WSL, native Windows installation needs Git for Windows. Claude Code uses Git Bash internally to run commands.

- **WSL 1 doesn't support sandboxing**: For enhanced security features, use WSL 2 which supports Claude Code's sandboxing.

- **Free Claude.ai accounts don't work**: You need a paid subscription (Pro, Max, Teams, Enterprise) or Console account with credits. The free tier explicitly excludes Claude Code access.

- **Thinking mode phrases don't work literally**: Phrases like "think harder" or "ultrathink" are interpreted as regular prompts. Extended thinking is enabled by default and controlled via `Option+T`/`Alt+T` toggle or `/config`, not through prompt keywords.

- **Plan Mode requires two Shift+Tab presses**: The first Shift+Tab enables Auto-Accept mode, the second enables Plan Mode. Look for `⏸ plan mode on` at the terminal bottom.

- **@ file references are relative to your prompt**: When using `@src/file.js` syntax, paths can be relative or absolute. This automatically includes CLAUDE.md files from the file's directory hierarchy.

## Sources

- [Claude Code Quickstart - Official Documentation](https://code.claude.com/docs/en/quickstart) — Installation steps, first session guide, essential commands reference
- [Common Workflows - Claude Code Docs](https://code.claude.com/docs/en/common-workflows) — Detailed workflow guides for debugging, refactoring, testing, PR creation, Plan Mode usage
- [Advanced Setup - Claude Code Docs](https://code.claude.com/docs/en/setup) — System requirements, platform-specific installation, update management, uninstallation procedures
- [GitHub - anthropics/claude-code](https://github.com/anthropics/claude-code) — Official repository with installation methods and feature overview


---

# CLAUDE.md and Memory

**Topic ID:** claude-code.cli.memory
**Researched:** 2026-03-01T12:00:00Z

## Overview

Claude Code uses a dual memory system to maintain context across sessions: **CLAUDE.md files** that you write to provide persistent instructions, and **auto memory** that Claude writes to accumulate learnings automatically. Both systems load at the start of every conversation, giving Claude immediate access to project standards, coding conventions, debugging insights, and workflow preferences without requiring you to repeat information each session.

CLAUDE.md files function as onboarding documentation—the equivalent of briefing a new team member on your project's architecture, coding standards, and common commands. They live in your repository and can be version-controlled, ensuring your entire team's Claude assistants follow the same standards. Auto memory complements this by letting Claude take notes for itself: build commands it discovers, debugging patterns it learns, and preferences you correct it on.

The memory system operates hierarchically, with more specific locations taking precedence over broader ones. This allows organization-wide policies, project standards, and personal preferences to coexist without conflict. Understanding this hierarchy is essential for teams deploying Claude Code at scale.

## Key Concepts

- **CLAUDE.md files**: Markdown files you create that provide persistent instructions to Claude. They're loaded into context at session start and treated as guidance, not enforced configuration.

- **Auto memory**: Notes Claude writes for itself based on corrections and discoveries. Stored in `~/.claude/projects/<project>/memory/` and loaded automatically (first 200 lines of MEMORY.md).

- **Memory hierarchy**: Files load in priority order—managed policy → project instructions → user instructions → local instructions. More specific locations override broader ones.

- **Project CLAUDE.md**: Lives at `./CLAUDE.md` or `./.claude/CLAUDE.md`. Shared with team via version control. Contains build commands, coding standards, and architecture decisions.

- **User CLAUDE.md**: Lives at `~/.claude/CLAUDE.md`. Personal preferences that apply to all your projects across your machine.

- **Local CLAUDE.md**: Lives at `./CLAUDE.local.md`. Personal project-specific preferences not checked into git.

- **Rules directory**: `.claude/rules/` contains modular instruction files. Can be scoped to specific file patterns using YAML frontmatter with the `paths` field.

- **Import syntax**: Use `@path/to/file` to include additional files in CLAUDE.md. Paths resolve relative to the containing file.

- **The 200-line limit**: Only the first 200 lines of MEMORY.md load at session start. CLAUDE.md files load in full but shorter files produce better adherence.

## Technical Details

### CLAUDE.md File Locations

| Scope | Location | Shared With |
|-------|----------|-------------|
| Managed policy | `/Library/Application Support/ClaudeCode/CLAUDE.md` (macOS) | All org users |
| Project | `./CLAUDE.md` or `./.claude/CLAUDE.md` | Team via git |
| User | `~/.claude/CLAUDE.md` | Just you (all projects) |
| Local | `./CLAUDE.local.md` | Just you (current project) |

### Auto Memory Structure

```
~/.claude/projects/<project>/memory/
├── MEMORY.md          # Index file, first 200 lines loaded at startup
├── debugging.md       # Detailed debugging patterns
├── api-conventions.md # API design decisions
└── patterns.md        # Code patterns Claude discovered
```

### Path-Scoped Rules

Create files in `.claude/rules/` with YAML frontmatter to apply rules only when Claude works with matching files:

```markdown
---
paths:
  - "src/api/**/*.ts"
  - "lib/**/*.ts"
---

# API Development Rules

- All endpoints must include input validation
- Use standard error response format
- Include OpenAPI documentation comments
```

Glob patterns supported: `**/*.ts` (all TypeScript), `src/**/*` (everything under src), `*.md` (markdown in root).

### Import Syntax

Reference external files with `@` syntax:

```markdown
See @README for project overview and @package.json for npm commands.

# Additional Instructions
- Git workflow: @docs/git-instructions.md
- Personal settings: @~/.claude/my-project-prefs.md
```

Maximum import depth: five hops. Relative paths resolve from the containing file.

### Key Commands

| Command | Purpose |
|---------|---------|
| `/init` | Generate starter CLAUDE.md by analyzing codebase |
| `/memory` | Browse and edit all memory files |
| `#` key | Add rule inline during conversation |

### Configuration Settings

Disable auto memory project-wide in `.claude/settings.json`:
```json
{
  "autoMemoryEnabled": false
}
```

Exclude irrelevant CLAUDE.md files in monorepos:
```json
{
  "claudeMdExcludes": [
    "**/other-team/CLAUDE.md",
    "/path/to/monorepo/.claude/rules/**"
  ]
}
```

Environment variable for CI: `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1`

## Common Patterns

### Minimal Project CLAUDE.md

```markdown
# Project Context

FastAPI REST API for user authentication.

## Key Directories
- app/models/ - database models
- app/api/ - route handlers
- app/core/ - configuration

## Standards
- Type hints required on all functions
- pytest for testing (fixtures in tests/conftest.py)
- PEP 8 with 100 character lines

## Commands
uvicorn app.main:app --reload  # dev server
pytest tests/ -v               # run tests
```

### Modular Organization for Large Projects

```
your-project/
├── .claude/
│   ├── CLAUDE.md           # Main project instructions
│   └── rules/
│       ├── code-style.md   # Loaded for all files
│       ├── frontend/
│       │   └── react.md    # paths: ["src/components/**"]
│       └── backend/
│           └── api.md      # paths: ["src/api/**"]
```

### Team + Personal Preferences

Project CLAUDE.md (committed to git):
```markdown
# Team Standards
- Use pnpm, not npm
- Run `pnpm test` before committing
```

Personal CLAUDE.local.md (gitignored):
```markdown
# My Preferences
- I prefer verbose explanations
- My sandbox URL: http://localhost:3001
```

### Explicit Memory Saves

When solving hard problems, tell Claude directly:
- "Remember that the API tests require a local Redis instance"
- "Remember we use pnpm, not npm"
- "Remember this debugging approach for auth token issues"

Claude writes these to auto memory immediately.

## Gotchas

- **CLAUDE.md is guidance, not enforcement**: Claude reads instructions and tries to follow them, but there's no guarantee of strict compliance. Vague instructions ("format code properly") work poorly; specific instructions ("use 2-space indentation") work better.

- **The 200-line cutoff applies only to MEMORY.md**: CLAUDE.md files load in full, but files over 200 lines consume excessive context and reduce adherence. Keep CLAUDE.md concise.

- **Auto memory is machine-local**: It's stored in `~/.claude/projects/` and not shared via git. Team members don't see each other's auto memory.

- **Conflicting instructions produce arbitrary results**: If two CLAUDE.md files give different guidance for the same behavior, Claude picks one arbitrarily. Review for conflicts periodically.

- **Instructions don't survive `/compact` unless written to files**: Anything given only in conversation disappears after compaction. Write important instructions to CLAUDE.md.

- **Import approval dialog appears once**: The first time Claude encounters external imports (`@path`), it shows an approval dialog. If declined, imports stay disabled permanently for that project.

- **Subdirectory CLAUDE.md files load on demand**: Only CLAUDE.md files in the current directory and ancestors load at startup. Subdirectory files load when Claude reads files in those directories.

- **`/init` doesn't overwrite existing files**: If CLAUDE.md exists, `/init` suggests improvements rather than replacing it.

- **Different worktrees get separate auto memory**: This is intentional—different branches often have different states. Use `@~/.claude/my-project-prefs.md` imports if you need shared personal preferences across worktrees.

- **Managed policy CLAUDE.md cannot be excluded**: Organization-wide instructions deployed via IT always apply, regardless of `claudeMdExcludes` settings.

## Sources

- [How Claude remembers your project - Claude Code Docs](https://code.claude.com/docs/en/memory) — Official documentation covering CLAUDE.md files, auto memory, rules directory, and troubleshooting
- [Using CLAUDE.md files: Customizing Claude Code for your codebase](https://claude.com/blog/using-claude-md-files) — Anthropic blog post on CLAUDE.md structure, best practices, and the /init command
- [The CLAUDE.md Memory System - Tutorial | SFEIR Institute](https://institute.sfeir.com/en/claude-code/claude-code-memory-system-claude-md/tutorial/) — Step-by-step setup guide covering memory hierarchy and glob patterns
- [Claude Code Auto Memory: How Your AI Learns Your Project](https://claudefa.st/blog/guide/mechanics/auto-memory) — Technical deep-dive on auto memory internals, MEMORY.md structure, and management commands


---

# Custom Skills and Commands

**Topic ID:** claude-code.customization.skills
**Researched:** 2025-03-01T12:00:00Z

## Overview

Claude Code skills are a mechanism for extending Claude's capabilities through instruction files that teach it how to perform specific tasks in a repeatable way. Skills follow the open [Agent Skills](https://agentskills.io) standard, which means they work across multiple AI tools including Claude.ai, Claude Code CLI, and the API. A skill is essentially a folder containing a `SKILL.md` file with YAML frontmatter (metadata) and markdown instructions, plus optional supporting files like scripts, templates, or reference documentation.

Skills evolved from the earlier "custom commands" feature, and the two have now been merged. Files in `.claude/commands/` continue to work, but skills offer additional capabilities: directory structures for supporting files, frontmatter for controlling invocation behavior, and automatic loading when relevant to user tasks. When you create a skill, Claude adds it to its toolkit and can either invoke it automatically when the task matches the skill's description, or you can trigger it manually using `/skill-name` syntax.

The practical value of skills lies in workflow standardization. Rather than explaining your deployment process, code review checklist, or documentation format every session, you encode that knowledge once in a skill. Claude then follows those instructions consistently, whether it decides to apply them or you explicitly invoke them.

## Key Concepts

- **SKILL.md**: The required entry point file for every skill. Contains YAML frontmatter between `---` markers followed by markdown instructions that Claude follows when the skill is invoked.

- **Frontmatter**: YAML metadata at the top of `SKILL.md` that configures skill behavior. Key fields include `name`, `description`, `disable-model-invocation`, `user-invocable`, `allowed-tools`, and `context`.

- **Skill discovery**: Claude Code automatically discovers skills from `~/.claude/skills/` (personal/global), `.claude/skills/` (project-level), and nested `.claude/skills/` directories in subdirectories you're working in (supporting monorepos).

- **Auto-invocation**: By default, Claude can invoke skills automatically when the task matches the skill's description. The description field is crucial—it's how Claude decides when to apply the skill.

- **Manual invocation**: Users can trigger any user-invocable skill directly using `/skill-name` followed by optional arguments.

- **Context budget**: Skill descriptions are loaded into context so Claude knows what's available. The budget is 2% of the context window (fallback: 16,000 characters). Run `/context` to check for warnings about excluded skills.

- **Subagent execution**: Adding `context: fork` to frontmatter runs the skill in an isolated subagent context, useful for tasks that shouldn't share conversation history.

- **String substitutions**: Skills support `$ARGUMENTS` (all arguments), `$ARGUMENTS[N]` or `$N` (specific argument by index), and `${CLAUDE_SESSION_ID}` for dynamic content.

## Technical Details

### Directory Structure

```
my-skill/
├── SKILL.md           # Main instructions (required)
├── template.md        # Template for Claude to fill in
├── examples/
│   └── sample.md      # Example output showing expected format
└── scripts/
    └── validate.sh    # Script Claude can execute
```

### Storage Locations (Priority Order)

| Location   | Path                                      | Applies to                     |
|------------|-------------------------------------------|--------------------------------|
| Enterprise | Managed settings                          | All users in organization      |
| Personal   | `~/.claude/skills/<skill-name>/SKILL.md`  | All your projects              |
| Project    | `.claude/skills/<skill-name>/SKILL.md`    | This project only              |
| Plugin     | `<plugin>/skills/<skill-name>/SKILL.md`   | Where plugin is enabled        |

Higher-priority locations win when skills share the same name.

### Frontmatter Reference

```yaml
---
name: my-skill                    # Display name, becomes /slash-command
description: What this skill does # How Claude decides when to use it
argument-hint: [filename]         # Shown during autocomplete
disable-model-invocation: true    # Only user can invoke (manual only)
user-invocable: false             # Only Claude can invoke (hidden from menu)
allowed-tools: Read, Grep, Glob   # Tools allowed without per-use approval
model: sonnet                     # Model to use when skill is active
context: fork                     # Run in isolated subagent context
agent: Explore                    # Subagent type when context: fork
---
```

### Dynamic Context Injection

The `!`command`` syntax runs shell commands before sending content to Claude:

```yaml
---
name: pr-summary
description: Summarize changes in a pull request
context: fork
agent: Explore
---

## Pull request context
- PR diff: !`gh pr diff`
- PR comments: !`gh pr view --comments`

Summarize this pull request...
```

## Common Patterns

### Reference/Knowledge Skills

Add conventions or domain knowledge Claude applies to your work:

```yaml
---
name: api-conventions
description: API design patterns for this codebase
---

When writing API endpoints:
- Use RESTful naming conventions
- Return consistent error formats
- Include request validation
```

### Task/Workflow Skills

Step-by-step instructions for specific actions, typically manually invoked:

```yaml
---
name: deploy
description: Deploy the application to production
context: fork
disable-model-invocation: true
---

Deploy $ARGUMENTS to production:
1. Run the test suite
2. Build the application
3. Push to the deployment target
4. Verify the deployment succeeded
```

### Documentation Fetching Skills

Fetch current documentation to avoid outdated training data:

```yaml
---
name: dexie-expert
description: Get Dexie.js guidance with current documentation
allowed-tools: Read, Grep, Glob, WebFetch
---

First, fetch the documentation index from https://dexie.org/llms.txt
Then fetch relevant documentation pages based on the user's question.
Finally, answer: $ARGUMENTS
```

### Read-Only Exploration Skills

Restrict tools for safe exploration:

```yaml
---
name: safe-reader
description: Read files without making changes
allowed-tools: Read, Grep, Glob
---

Explore the codebase without modifying any files.
```

## Gotchas

- **`disable-model-invocation` vs `user-invocable` confusion**: These control different things. `disable-model-invocation: true` prevents Claude from auto-triggering the skill—only you can invoke it with `/skill-name`. `user-invocable: false` hides it from the `/` menu—only Claude can invoke it. The `user-invocable` field does NOT block the Skill tool access; use `disable-model-invocation` for that.

- **Known bug with `disable-model-invocation`**: There have been reports that skills with `disable-model-invocation: true` may cause Claude to refuse invoking them even when the user explicitly types the slash command. The model misinterprets the setting as "I cannot use this skill at all" rather than "don't auto-trigger without user request."

- **Skills aren't separate processes**: Skills are injected instructions within the main conversation, not sub-agents or external tools. They expand the prompt dynamically.

- **`context: fork` requires explicit instructions**: If your skill contains only guidelines without a task (e.g., "use these API conventions"), the subagent receives guidelines but no actionable prompt and returns without meaningful output.

- **Commands migration**: Both `.claude/commands/review.md` and `.claude/skills/review/SKILL.md` create `/review`. If both exist with the same name, the skill takes precedence.

- **Context budget overflow**: If you have many skills, descriptions may exceed the 2% budget. Check `/context` for warnings. Override with `SLASH_COMMAND_TOOL_CHAR_BUDGET` environment variable.

- **Description quality matters**: Claude uses the description to decide when to auto-invoke. Vague descriptions lead to inconsistent triggering. Be specific about when the skill should activate.

- **Supporting files aren't auto-loaded**: Files beyond `SKILL.md` must be explicitly referenced in your instructions so Claude knows when to load them. Keep `SKILL.md` under 500 lines and move detailed reference material to separate files.

## Sources

- [Extend Claude with skills - Claude Code Docs](https://code.claude.com/docs/en/skills) — Official documentation covering full SKILL.md structure, frontmatter reference, storage locations, and advanced patterns
- [Inside Claude Code Skills: Structure, prompts, invocation](https://mikhail.io/2025/10/claude-code-skills/) — Technical deep-dive on how skills work internally as injected instructions rather than separate processes
- [Claude Code Customization Guide](https://alexop.dev/posts/claude-code-customization-guide-claudemd-skills-subagents/) — Practical patterns for skills, slash commands, and subagent orchestration
- [GitHub Issue #19141: Clarify distinction between user-invocable and disable-model-invocation](https://github.com/anthropics/claude-code/issues/19141) — Discussion of common confusion between the two frontmatter fields


---

# Hooks System

**Topic ID:** claude-code.customization.hooks
**Researched:** 2026-03-01T00:00:00Z

## Overview

Claude Code hooks are user-defined shell commands that execute at specific points in Claude Code's lifecycle. They provide deterministic control over Claude Code's behavior, ensuring certain actions always happen rather than relying on the LLM to choose to run them. While CLAUDE.md files serve as style guides that Claude should follow, hooks act as enforcers—they run every single time their conditions are met, with zero exceptions.

Hooks address a fundamental limitation of LLM-based tools: you cannot guarantee an AI agent will remember to format code, run tests, or avoid editing sensitive files. Hooks solve this by intercepting Claude's actions at predefined lifecycle points. You can block dangerous commands before they execute, auto-format files after every edit, inject context when sessions start, validate tool inputs, send desktop notifications, and audit configuration changes.

The hooks system supports three handler types: command hooks run shell scripts, prompt hooks use a Claude model for single-turn evaluation, and agent hooks spawn subagents with tool access for complex verification. This flexibility allows both simple automation (running Prettier) and sophisticated guardrails (verifying tests pass before allowing Claude to stop).

## Key Concepts

- **Lifecycle Events**: Hooks fire at specific points—`PreToolUse` (before tool execution), `PostToolUse` (after tool succeeds), `SessionStart`, `Stop` (when Claude finishes responding), `Notification`, `UserPromptSubmit`, and others. Each event type provides different input data and control options.

- **Matchers**: Regex patterns that filter when hooks fire. Without a matcher, hooks fire on every occurrence of their event. Matchers like `"Edit|Write"` limit a `PostToolUse` hook to only file-editing tools. Matchers are case-sensitive.

- **Exit Codes**: Command hooks communicate outcomes through exit codes. Exit 0 means proceed (stdout added to context for some events), exit 2 blocks the action (stderr becomes Claude's feedback), other codes proceed but log to verbose mode.

- **JSON I/O**: Hooks receive structured JSON on stdin containing session info, tool names, and tool inputs. They can return structured JSON on stdout for fine-grained control beyond simple allow/block decisions.

- **Hook Types**: `command` runs shell scripts, `prompt` makes a single Claude API call for judgment-based decisions, `agent` spawns a subagent with tool access for multi-step verification.

- **Configuration Scope**: Hooks can be defined at user level (`~/.claude/settings.json`), project level (`.claude/settings.json`), or local project level (`.claude/settings.local.json`). Project settings take precedence over user settings.

- **Deterministic Enforcement**: Unlike instructions in CLAUDE.md that Claude might occasionally forget, hooks execute every time their conditions match. This is critical for security and consistency.

## Technical Details

### Configuration Structure

Hooks are defined in JSON settings files:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.tool_input.file_path' | xargs npx prettier --write"
          }
        ]
      }
    ]
  }
}
```

### Lifecycle Events Reference

| Event | When It Fires | Matcher Field |
|-------|---------------|---------------|
| `PreToolUse` | Before tool executes; can block | Tool name |
| `PostToolUse` | After tool succeeds | Tool name |
| `SessionStart` | Session begins/resumes | startup, resume, clear, compact |
| `Stop` | Claude finishes responding | None |
| `Notification` | Claude needs attention | permission_prompt, idle_prompt |
| `UserPromptSubmit` | User submits prompt | None |
| `ConfigChange` | Settings file modified | Configuration source |

### Hook Input Schema

Every hook receives JSON on stdin with common fields plus event-specific data:

```json
{
  "session_id": "abc123",
  "cwd": "/Users/sarah/myproject",
  "hook_event_name": "PreToolUse",
  "tool_name": "Bash",
  "tool_input": {
    "command": "npm test"
  }
}
```

### Structured JSON Output

For control beyond exit codes, return JSON to stdout:

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "Use rg instead of grep for performance"
  }
}
```

`permissionDecision` accepts `"allow"` (proceed without prompt), `"deny"` (cancel and send reason to Claude), or `"ask"` (show normal permission prompt).

### Environment Variables

Hooks have access to `CLAUDE_PROJECT_DIR`, `CLAUDE_CODE_REMOTE`, and `CLAUDE_ENV_FILE`. The default timeout is 60 seconds per hook (configurable via the `timeout` field).

## Common Patterns

### Auto-Format After Edits

Run Prettier on every file Claude modifies:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.tool_input.file_path' | xargs npx prettier --write"
          }
        ]
      }
    ]
  }
}
```

### Block Dangerous Commands

Create `.claude/hooks/protect-files.sh`:

```bash
#!/bin/bash
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
PROTECTED_PATTERNS=(".env" "package-lock.json" ".git/")

for pattern in "${PROTECTED_PATTERNS[@]}"; do
  if [[ "$FILE_PATH" == *"$pattern"* ]]; then
    echo "Blocked: $FILE_PATH matches protected pattern '$pattern'" >&2
    exit 2
  fi
done
exit 0
```

Register with `PreToolUse` on `Edit|Write`.

### Desktop Notifications

Alert when Claude needs input:

```json
{
  "hooks": {
    "Notification": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "osascript -e 'display notification \"Claude Code needs attention\" with title \"Claude Code\"'"
          }
        ]
      }
    ]
  }
}
```

### Re-Inject Context After Compaction

When context compacts, critical info may be lost. Use `SessionStart` with `compact` matcher:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "compact",
        "hooks": [
          {
            "type": "command",
            "command": "echo 'Reminder: use Bun, not npm. Run tests before committing.'"
          }
        ]
      }
    ]
  }
}
```

### Verify Tests Before Stopping

Use an agent hook to run tests:

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "agent",
            "prompt": "Verify all unit tests pass. Run the test suite and check results.",
            "timeout": 120
          }
        ]
      }
    ]
  }
}
```

## Gotchas

- **Shell profile output breaks JSON parsing**: If `~/.zshrc` prints anything on startup (welcome messages, conda activation), it prepends to hook stdout and corrupts JSON. Wrap noisy lines in `if [[ $- == *i* ]]; then ... fi` to only run in interactive shells.

- **Scripts must be executable**: `chmod +x` is easy to forget. If your hook silently does nothing, check permissions first.

- **Exit 2 ignores stdout**: When blocking with exit code 2, only stderr matters. The `permissionDecisionReason` in stdout JSON is ignored; write your message to stderr.

- **Matchers are case-sensitive**: Use `Bash`, not `bash`. Use `Edit|Write`, not `edit|write`.

- **PostToolUse cannot undo actions**: The tool has already executed. Use `PreToolUse` if you need to prevent something.

- **Stop hooks can loop infinitely**: If your Stop hook triggers continuation, it must check `stop_hook_active` in the input JSON and exit early when true, or Claude keeps working forever.

- **Manual settings edits require reload**: Hooks added via `/hooks` menu take effect immediately, but direct file edits require reviewing in `/hooks` or restarting the session.

- **PermissionRequest hooks don't fire in headless mode**: When running with `-p` (non-interactive), use `PreToolUse` instead for automated permission decisions.

- **MCP tool naming convention**: MCP tools use `mcp__<server>__<tool>` format. Match them with patterns like `"mcp__github__.*"`.

## Sources

- [Automate workflows with hooks - Claude Code Docs](https://code.claude.com/docs/en/hooks-guide) — Primary reference for all lifecycle events, configuration structure, JSON schemas, and official examples
- [Claude Code power user customization: How to configure hooks](https://claude.com/blog/how-to-configure-hooks) — Configuration file locations, matcher syntax, and practical JSON structure examples
- [Automating Your Workflow with Claude Code Hooks - DEV Community](https://dev.to/gunnargrosch/automating-your-workflow-with-claude-code-hooks-389h) — Practical gotchas including shell profile issues and permission problems, strategy recommendations

