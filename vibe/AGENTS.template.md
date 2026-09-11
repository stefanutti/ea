<!--
Template for a repository's AI instructions file.

Copy it to the repo root as `AGENTS.md` — the canonical file — then give every other CLI
a one-line file that imports it, so no content is ever duplicated:

    CLAUDE.md   ->  @AGENTS.md
    GEMINI.md   ->  @AGENTS.md

(see the config-dir table in `vibe/README.md` for which file each CLI reads).

Then fill in the `<placeholders>` and delete this comment.

The "Commands" and "Stack" sections are project-specific: replace them.
The two convention sections at the bottom are project-independent: keep them as they are.
-->

# AGENTS.md

Read also the ./README.md file.

## Commands

```bash
# From <path/to/the/app>
<dev command>          # e.g. npm run dev
<build command>        # e.g. npm run build
<lint command>         # e.g. npm run lint
<unit test command>    # e.g. npm run test

# <E2E or integration tests, and the runner they must use>
```

## Stack

`<one-line summary of the tech stack, so the assistant does not have to infer it from the manifest>`

`<any dependency whose presence or absence is surprising, and the variables that do NOT need configuring>`

## Tasks as checkboxes

**Scope:** applies only to markdown files written under `./docs` (`docs/**/*.md`). Markdown files outside `./docs` are exempt.

When generating a markdown file under `./docs` that lists actions, tasks, or items to address (reports, plans, reviews), always use unchecked checkboxes (`- [ ]`) per item, with a summary of findings/recommendations up front. Keep IDs and titles consistent across sections for traceability, e.g.:

- [ ] ID=CRIT-1, Severity=Critical, Complexity=Low, Priority=P0, Estimate=minutes, Title=Title A, Fix description=Description of the fix to be implemented for CRIT-1, updated as tasks are completed.
- [ ] ID=HIGH-1, Severity=High, Complexity=Low, Priority=P1, Estimate=hours, Title=Title C, Fix description=Description of the fix to be implemented for HIGH-1, updated as tasks are completed.

`Estimate` is one of `minutes`, `hours`, `days`, `weeks`, `months`: how long a vibe-coding system (Claude, ChatGPT, …) is expected to take to complete the item end to end, not how long a human developer would take. It is a different axis from `Complexity`, which describes the change itself: a mechanical rename across hundreds of files is Low complexity and still an `hours` estimate.

If the originating request came from a `.md` file under `./docs` with checkboxes, mark the corresponding checkbox `- [✅]` as soon as that work is done — regardless of whether it was done: via a workflow (like Superpowers implementation), a direct command, a bug fix, or delegated to a subagent. Do this per item, not in one batch at the end. Only mark items actually completed and tested.

## Commit AI-tooling folders to Git

Folders that the Superpowers plugin creates under `docs/` (e.g. `docs/superpowers/`, containing plans and other workflow artifacts) must be committed to Git, not left untracked or gitignored. They are part of the project's traceable history of AI-assisted work.

The same applies to the `agents/` and `skills/` folders inside `.claude/`, and to the equivalent folders inside any other AI coding CLI's config directory (`.github/`, `.codex/`, `.gemini/`, etc. — see the config-dir table in `vibe/README.md`). These contain the agent and skill definitions the project standardizes on and must be tracked so every contributor and every AI assistant gets the same setup.
