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
