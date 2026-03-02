# Editor Support

**Topic ID:** claude-code.ide.editors
**Researched:** 2026-03-01T00:00:00Z

## Overview

Claude Code offers IDE integrations that extend its terminal-first experience into graphical development environments. The official integrations support VS Code (including forks like Cursor and Windsurf) and JetBrains IDEs, while community-maintained plugins serve Neovim and Emacs users [1][2][3][4]. All integrations connect to the same underlying Claude Code engine, meaning CLAUDE.md files, settings, and MCP servers work across all surfaces [1].

The fundamental architecture differs by integration type: official extensions communicate directly with Anthropic's services and include the CLI bundled within [1], while community plugins implement a WebSocket-based MCP protocol to bridge their editors with the Claude Code CLI running separately [3][4]. Understanding these differences matters for troubleshooting and knowing which features are available where.

For certification purposes, VS Code and JetBrains represent the primary supported platforms with full feature parity, while Neovim and Emacs require additional setup and may lag in feature availability. Cursor, being a VS Code fork, uses the same extension as VS Code [1].

## Key Concepts

- **Native Extensions vs Bridge Plugins** — Official integrations (VS Code, JetBrains) bundle or directly invoke Claude Code, while community plugins (Neovim, Emacs) implement the MCP WebSocket protocol to connect an external CLI instance to the editor [1][2][3][4].

- **IDE Detection** — Claude Code automatically detects which IDE it is running in and enables appropriate features. When launched from an integrated terminal, features activate automatically; from external terminals, use the `/ide` command to connect [2].

- **Inline Diffs** — All official integrations display Claude's proposed changes in the native diff viewer of the IDE rather than terminal output, allowing accept/reject directly in the editor [1][2].

- **Selection Context** — The current file and any highlighted text are automatically shared with Claude when a prompt is sent, eliminating manual copy-paste [1][2].

- **@-Mentions** — Reference specific files with `@filename` syntax, supporting fuzzy matching. In VS Code, `Option+K` (Mac) / `Alt+K` (Windows/Linux) inserts references including line numbers [1].

- **Checkpoints** — Track file edits and rewind to previous states. Available in VS Code extension with options to fork conversation, rewind code, or both [1].

- **Permission Modes** — Control how Claude asks for approval: default (ask each time), plan mode (describe before doing), or auto-accept mode (make edits without asking) [1].

- **MCP Protocol** — Model Context Protocol enables bidirectional communication between Claude and editors, allowing Claude to access editor-specific capabilities like LSP, diagnostics, and project context [3][4].

- **Terminal Backend** — Community plugins support multiple terminal providers. Neovim's claudecode.nvim supports snacks.nvim, native terminals, and external terminals [3].

- **Workspace Trust** — VS Code's Restricted Mode affects Claude Code operation. The extension does not work in untrusted workspaces [1].

## Technical Details

### VS Code Integration

**Prerequisites**: VS Code 1.98.0 or higher and an Anthropic account with Claude Pro, Max, Team, or Enterprise subscription [1].

**Installation**: Install from the VS Code Marketplace by pressing `Cmd+Shift+X` / `Ctrl+Shift+X`, searching for "Claude Code", and clicking Install. Also works with Cursor and Windsurf using the same extension [1].

**Key Settings** [1]:
```json
{
  "claudeCode.selectedModel": "default",
  "claudeCode.useTerminal": false,
  "claudeCode.initialPermissionMode": "default",
  "claudeCode.autosave": true,
  "claudeCode.respectGitIgnore": true
}
```

**Essential Shortcuts** [1]:
| Shortcut | Mac | Windows/Linux | Action |
|----------|-----|---------------|--------|
| Focus Toggle | `Cmd+Esc` | `Ctrl+Esc` | Switch between editor and Claude |
| New Tab | `Cmd+Shift+Esc` | `Ctrl+Shift+Esc` | Open new conversation as tab |
| New Conversation | `Cmd+N` | `Ctrl+N` | Start fresh (Claude must be focused) |
| Insert Reference | `Option+K` | `Alt+K` | Insert `@file#line-range` reference |

### JetBrains Integration

**Supported IDEs**: IntelliJ IDEA, PyCharm, Android Studio, WebStorm, PhpStorm, GoLand [2].

**Prerequisites**: Node.js 18+ and the Claude Code CLI must be installed separately via `npm install -g @anthropic-ai/claude-code` [2][5].

**Plugin Installation**: Install from JetBrains Marketplace (search "Claude Code"), then restart the IDE completely [2].

**Plugin Settings Path**: Settings > Tools > Claude Code [Beta] [2].

**Key Configuration Options** [2]:
- `Claude command`: Custom path to claude binary (important for nvm/asdf users)
- `Enable automatic updates`: Check for plugin updates on restart
- `Enable using Option+Enter for multi-line prompts`: macOS-specific

**Essential Shortcuts** [2]:
| Shortcut | Mac | Windows/Linux | Action |
|----------|-----|---------------|--------|
| Quick Launch | `Cmd+Esc` | `Ctrl+Esc` | Open Claude Code panel |
| Insert Reference | `Cmd+Option+K` | `Alt+Ctrl+K` | Insert `@File#L1-99` |

### Neovim Integration (Community)

The primary plugin is **claudecode.nvim** by Coder [3].

**Requirements**: Neovim 0.8.0+, Claude Code CLI, folke/snacks.nvim [3].

**Installation with lazy.nvim** [3]:
```lua
{
  "coder/claudecode.nvim",
  dependencies = { "folke/snacks.nvim" },
  config = function()
    require("claudecode").setup({
      terminal = {
        provider = "snacks",  -- or "native", "external"
        split_side = "right",
        split_width_percentage = 0.4,
      },
    })
  end,
}
```

**How It Works**: The plugin creates a WebSocket server and writes connection details to `~/.claude/ide/[port].lock`. Claude Code CLI auto-detects and connects, gaining access to editor tools [3].

### Emacs Integration (Community)

The primary package is **claude-code-ide.el** [4].

**Requirements**: Emacs 28.1+, Claude Code CLI in PATH, vterm or eat package [4].

**Installation with use-package** [4]:
```elisp
(use-package claude-code-ide
  :vc (:url "https://github.com/manzaltu/claude-code-ide.el" :rev :newest)
  :bind ("C-c C-'" . claude-code-ide-menu)
  :config (claude-code-ide-emacs-tools-setup))
```

**Exposed MCP Tools** [4]:
- `xref-find-references` — project-wide symbol reference lookup (LSP-backed)
- `xref-find-apropos` — pattern-based symbol search
- `treesit-info` — tree-sitter AST analysis
- `imenu-list-symbols` — structured file symbol enumeration
- `project-info` — project metadata

### Cursor Differences

Cursor is a VS Code fork with its own AI features. Claude Code's VS Code extension works in Cursor [1]. Key distinction from native Cursor AI [6]:

| Aspect | Cursor AI | Claude Code in Cursor |
|--------|-----------|----------------------|
| Workflow | Real-time inline completion | Agentic task execution |
| Best For | Tab completions, quick edits | Multi-file refactoring, autonomous tasks |
| Context | IDE-managed | 200K token window [6] |

Many developers use both: Cursor's native AI for fast edits and Claude Code for complex multi-step tasks [6].

## Common Patterns

**Running Multiple Conversations**: In VS Code, use "Open in New Tab" to start parallel conversations. Each maintains independent history and context. A colored dot on the tab indicates status (blue = permission pending, orange = finished while hidden) [1].

**Resuming CLI Sessions in IDE**: Run `claude --resume` in the integrated terminal to continue an extension conversation in CLI mode [1].

**WSL Configuration for JetBrains**: Set the Claude command to `wsl -d Ubuntu -- bash -lic "claude"` (replace Ubuntu with your distro name) [2].

**Connecting External Terminals to IDE**: Run `/ide` inside any Claude Code session to connect it to a running VS Code or JetBrains IDE [1][2].

**Multi-Project Emacs Workflow**: claude-code-ide.el automatically detects projects via `project.el` and maintains independent Claude sessions per project [4].

## Gotchas

- **CLI Required for JetBrains**: Unlike VS Code where the extension includes the CLI, JetBrains requires separate CLI installation via npm. The plugin is just a bridge [2][5].

- **Node Version Manager PATH Issues**: If using nvm, asdf, or mise, JetBrains may not inherit your shell's PATH. You must manually configure the Claude command path in plugin settings [5].

- **VS Code Version Requirement**: Minimum VS Code 1.98.0 is required. Older versions will not show the extension properly [1].

- **Remote Development for JetBrains**: When using JetBrains Remote Development, install the plugin on the remote host via Settings > Plugin (Host), not on the local client [2].

- **Workspace Trust in VS Code**: Claude Code does not work in VS Code's Restricted Mode. Enable workspace trust for AI-assisted development [1].

- **Beta Status for JetBrains**: The JetBrains plugin is labeled Beta and may have stability issues, including reported memory leaks in PyCharm [5].

- **No Official Vim/Sublime Support**: Only VS Code and JetBrains have official integrations. Neovim and Emacs rely on community plugins implementing MCP [3][4].

- **Feature Parity Between CLI and Extensions**: Some features remain CLI-only. In VS Code, the `!` bash shortcut and tab completion are not available in the graphical panel. Use integrated terminal for full CLI access [1].

- **ESC Key Conflicts in JetBrains**: The ESC key may not interrupt Claude operations. Disable "Move focus to the editor with Escape" in terminal settings [2].

- **Auto-Edit Security Considerations**: With auto-accept enabled, Claude can modify IDE configuration files that may be auto-executed. Use manual approval mode when working with untrusted code [1][2].

## Sources

[1] **Use Claude Code in VS Code - Claude Code Docs**
    URL: https://code.claude.com/docs/en/vs-code
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Complete VS Code integration documentation including installation, features, shortcuts, settings, checkpoints, and security considerations.

[2] **JetBrains IDEs - Claude Code Docs**
    URL: https://code.claude.com/docs/en/jetbrains
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: JetBrains plugin installation, configuration, supported IDEs, shortcuts, WSL setup, and troubleshooting guidance.

[3] **claudecode.nvim - Coder GitHub Repository**
    URL: https://github.com/coder/claudecode.nvim
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Neovim plugin implementation details, WebSocket MCP protocol approach, installation via lazy.nvim, terminal providers, and connection mechanism.

[4] **claude-code-ide.el - GitHub Repository**
    URL: https://github.com/manzaltu/claude-code-ide.el
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Emacs integration via MCP, exposed tools (xref, treesit, imenu), vterm/eat requirements, project management, and ediff integration.

[5] **Claude Code JetBrains Plugin - JetBrains Marketplace & Community**
    URL: https://plugins.jetbrains.com/plugin/27310-claude-code-beta-
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Beta status, npm prerequisite, PATH issues with version managers, user-reported memory problems.

[6] **Claude Code vs Cursor Comparisons - Multiple Sources**
    URL: https://www.builder.io/blog/cursor-vs-claude-code
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Workflow philosophy differences, context window sizes, when to use each tool, complementary usage patterns.
