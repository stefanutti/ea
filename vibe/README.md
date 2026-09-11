# Vibe Coding — Environment Setup Guide

This guide walks through setting up a working environment for Vibe Coding on this repository (or any repository derived from this template). It applies to any AI coding assistant used via CLI (Claude Code, GitHub Copilot CLI, OpenAI Codex, Gemini CLI, etc.), with Claude Code + the Superpowers plugin as the reference setup used on this project.

Background reading on the "why" behind this setup: the team's internal [Vibe Coding guide](https://docs.google.com/document/d/19KuJLnBcYuGCuy-FJfuBc6lp8iWgzTrcKE0aYO_E9UA/edit?usp=sharing) and [kickoff presentation](https://docs.google.com/presentation/d/1nL9OEHqZ1aFrztJRw7g9CiGk4Fj5LqUA/edit?usp=sharing).

---

## Setup checklist

1. [ ] Install prerequisites (`uv`, `git`, an AI coding CLI)
2. [ ] Install the mandatory Superpowers plugin
3. [ ] Install project agents into `.claude/agents/` or equivalent
4. [ ] Install project skills into `.claude/skills/` or equivalent
5. [ ] Verify MCP servers in `.mcp.json`
6. [ ] Set up the AI instructions file for this repo (`AGENTS.md`), starting from `vibe/AGENTS.template.md`

---

## 1. Install prerequisites

- [`uv`](https://docs.astral.sh/uv/) (never invoke `python`/`pip` directly — see repo `AGENTS.md`)
- `git` and `gh` (for PRs)
- One AI coding CLI, configured per the table below

| Tool | Config dir | Instructions file |
|---|---|---|
| Claude Code | `.claude/` | `CLAUDE.md` |
| GitHub Copilot | `.github/` | `AGENTS.md` or `COPILOT-INSTRUCTIONS.md` |
| OpenAI Codex | `.codex/` | `AGENTS.md` |
| Gemini CLI | `.gemini/` | `GEMINI.md` |

Each tool reads its own instructions file at startup. Keep one canonical file — `AGENTS.md` at the repo root, next to `README.md` — and make every other instructions file a one-line import of it (`CLAUDE.md` in this repo contains just `@AGENTS.md`), instead of duplicating content.

---

## 2. Install the mandatory Superpowers plugin

Install the Superpowers plugin (multi-platform): https://github.com/obra/superpowers

On Claude Code it is enabled per-repo via `.claude/settings.json`:

```json
{
  "enabledPlugins": {
    "superpowers@claude-plugins-official": true
  }
}
```

Superpowers provides the workflow this project standardizes on for any non-trivial change (SDD + TDD):

1. `brainstorming` — refine the idea before writing code
2. `using-git-worktrees` — isolate the work on its own branch/worktree
3. `writing-plans` — break the work into small, verifiable tasks
4. `subagent-driven-development` or `executing-plans` — implement task by task
5. `test-driven-development` — red/green/refactor per task
6. `requesting-code-review` — review against the plan before moving on
7. `finishing-a-development-branch` — merge/PR/cleanup

Use this sequence as the default for features and bug fixes; skip steps only for genuinely trivial changes.

---

## 3. Install project agents

Claude Code agents go in `.claude/agents/` (or the equivalent config dir from the table in step 1):

```bash
curl -sL https://raw.githubusercontent.com/VoltAgent/awesome-claude-code-subagents/refs/heads/main/categories/04-quality-security/architect-reviewer.md -o .claude/agents/architect-reviewer.md
curl -sL https://raw.githubusercontent.com/VoltAgent/awesome-claude-code-subagents/refs/heads/main/categories/04-quality-security/code-reviewer.md -o .claude/agents/code-reviewer.md
curl -sL https://raw.githubusercontent.com/VoltAgent/awesome-claude-code-subagents/refs/heads/main/categories/04-quality-security/ui-ux-tester.md -o .claude/agents/ui-ux-tester.md
```

Do not install the [VoltAgent subagents marketplace](https://github.com/VoltAgent/awesome-claude-code-subagents/tree/main/categories) as a whole — copy only the agent definitions actually needed into the repository.

For Copilot/OpenAI/Gemini, equivalent agent definitions go in the tool-specific config directory listed in the table in step 1.

---

## 4. Install project skills

Claude Code skills go in `.claude/skills/` (or the equivalent config dir from the table in step 1):

- `webapp-testing` → https://github.com/anthropics/skills/tree/main/skills/webapp-testing (Playwright-based frontend verification, already installed)
- `algorithmic-art` (already installed, used for generative-art side projects)

For Copilot/OpenAI/Gemini, equivalent skill definitions go in the tool-specific config directory listed in the table in step 1.

---

## 5. Verify MCP servers

MCP servers are configured in `.mcp.json` at the repo root. This project currently connects to:

```json
{
  "mcpServers": {
  }
}
```

To find more MCP servers: https://registry.modelcontextprotocol.io/ or https://mcpservers.com/. Add new entries under `mcpServers` following the same shape.

GitHub, Supabase, Mail, Calendar, Google Drive and others maybe usefull for your project.

---

## 6. Setup of the AI instructions file for this repo

`AGENTS.md` at the repo root is the canonical instructions file — every AI coding CLI reads it, either directly or through a one-line import (see step 1). It must include:

- **A pointer to `README.md`** — so the project overview isn't duplicated across instruction files.
- **Commands** — how to run dev/build/lint/clean for the app, and how to run the test suite (this repo: `uv run pytest`, never `python`/`pip` directly — see step 1).
- **Stack** — a one-line summary of the tech stack, so the assistant doesn't have to infer it from `package.json`.

Start from [`AGENTS.template.md`](AGENTS.template.md) in this folder: copy it to the repo root under the name your CLI reads, fill in the `<placeholders>` for **Commands** and **Stack**, and keep its last two sections — *Tasks as checkboxes* and *Commit AI-tooling folders to Git* — verbatim: they are project-independent conventions, not examples to adapt.

NOTE:
- 27/Jun/2026: The *Tasks as checkboxes* convention still does not work reliably. Sometimes the assistant forgets to tick the boxes.

---

## Quality review process

Run quality reviews using the three agents installed above, saving each to `docs/reviews/<YYYY-MM-DD>-<agent-name>.md`:

- `code-reviewer` agent → `docs/reviews/<YYYY-MM-DD>-code-reviewer.md`
- `architect-reviewer` agent → `docs/reviews/<YYYY-MM-DD>-architect-reviewer.md`
- `ui-ux-tester` agent → `docs/reviews/<YYYY-MM-DD>-ui-ux-tester.md`

Spawn each as a subagent rather than running the review inline.

---

## Resources

- Superpowers plugin: https://github.com/obra/superpowers
- VoltAgent subagents marketplace: https://github.com/VoltAgent/awesome-claude-code-subagents/tree/main/categories (copy individual agents only, don't install as a whole)
- Awesome Claude (menu/extensions): https://awesomeclaude.ai
- Anthropic official skills: https://github.com/anthropics/skills
- MCP server registries: https://registry.modelcontextprotocol.io/, https://mcpservers.com/

## To be evaluated

- claude-plugins-official: frontend-design. code-review, code-simplifier
- https://github.com/thedotmack/claude-mem
- https://context7.com/ - Get the latest docs into Claude, Codex, Cursor, and other agents
