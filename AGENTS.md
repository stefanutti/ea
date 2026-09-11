# AGENTS.md

This is the canonical repository instruction file for AI coding agents. Tool-specific
instruction files should import this file instead of duplicating it.

There is currently no `README.md` at the repository root. Before changing the app, read:

- `project/components/web-app/README.md` for the original application overview. It is
  partially stale: references to Supabase and `NEXT_PUBLIC_*` database credentials no
  longer match the implementation.
- `project/components/web-app/ENV_VARIABLES.md` for the current runtime variables.
- `docs/local-installation.md` and `docs/local-development.md` for the k3d workflow.
- `vibe/README.md` for the repository's AI-assisted development workflow.

When documentation disagrees with executable code or configuration, treat
`package.json`, `package-lock.json`, application code, Docker files, and Helm charts as
authoritative, and call out the discrepancy in the change.

## Project layout

- `project/components/web-app/`: the only application component and the npm project root.
- `project/components/web-app/src/app/`: Next.js App Router UI and route handlers.
- `project/components/web-app/src/components/`: feature components and shadcn/Radix UI
  primitives. The main views are graph, table, drawing editor, and help.
- `project/components/web-app/src/lib/`: Neo4j access, browser-side API client, Drizzle
  client/schema, and shared field definitions.
- `project/components/web-app/drizzle/migrations/`: committed PostgreSQL migrations.
- `helm/charts/web-app/`: in-repository Helm chart for the web app.
- `helm/charts/{neo4j,postgresql}/values-local.yaml`: local values for upstream charts.
- `scripts/`: full local k3d lifecycle and port-forwarding scripts.

Unless a command explicitly says otherwise, application commands must be run from
`project/components/web-app`, not the repository root.

## Commands

```bash
# From project/components/web-app
npm ci                         # install the exact package-lock.json dependency graph
npm run dev                    # Next.js development server on http://localhost:3000
npm run build                  # production standalone build
npm run start                  # serve an existing production build
npm run lint                   # Next.js ESLint command
npm test -- --runInBand        # Jest/ts-jest unit tests
npm exec tsc -- --noEmit       # explicit TypeScript check
npm run analyze                # bundle-analyzer production build

# PostgreSQL/Drizzle; DATABASE_URL must point to the intended database
npm run db:generate            # generate a migration from src/lib/drizzle/schema.ts
npm run db:migrate             # apply committed migrations
npm run db:push                # push schema directly; do not use on shared/prod DBs
npm run db:studio              # launch Drizzle Studio

# From the repository root; requires Docker, kubectl, Helm 3, and k3d
./scripts/deploy-k3d.sh         # create/update the complete local environment
./scripts/port-forward-k3d.sh   # expose PostgreSQL, Neo4j, and the web app locally
./scripts/undeploy-k3d.sh       # destructive local teardown; confirm scope first
```

There is no meaningful E2E/integration suite yet. `src/__tests__/sample.test.ts` is only a
placeholder arithmetic test. Do not describe the project as tested based on it. For UI
changes, add focused automated coverage where practical and perform browser verification.
For database changes, verify migrations against disposable/local services rather than a
shared database.

The Python faker helper has dependencies in `requirements.txt`. Follow the repository's
vibe tooling rule: use `uv` for Python environments/dependencies and `uv run python ...`
to execute it; do not install packages with bare `pip` or mutate the system Python.

## Stack

Next.js 14 App Router + React 18 + TypeScript 5, styled with Tailwind CSS and shadcn/Radix;
Neo4j stores applications and their `flow` relationships, while PostgreSQL stores saved
drawings through Drizzle ORM/postgres-js. Graph/drawing features use vis-network and
tldraw. The production image is a Node 20 Alpine standalone Next.js build, deployed with
Docker, Helm, Kubernetes, and k3d for local development.

Use Node 20 as the compatibility baseline because that is the Docker runtime. npm and
`package-lock.json` are the canonical JavaScript package manager and lockfile.

## Runtime and data flow

- `src/app/page.tsx` is a client-side shell that keeps all four main views mounted and
  switches their visibility.
- Client components call same-origin endpoints through `src/lib/neo4jApi.ts` or direct
  `fetch` calls. Do not import the server Neo4j driver into client components.
- Neo4j credentials stay server-side. Route handlers under `src/app/api/neo4j/` call
  `src/lib/neo4jUtils.ts`, which uses the singleton driver in `src/lib/neo4j.ts`.
- Drawing CRUD is exposed under `src/app/api/drawings/` and uses Drizzle/PostgreSQL.
- The container entrypoint applies committed Drizzle migrations before starting
  `server.js`; a failed migration prevents application startup.
- The local Kubernetes environment runs PostgreSQL, Neo4j, and the web app in namespace
  `ns-ea` on cluster `ea-cluster`.

## Environment variables and secrets

The active database configuration is server-side only:

- Required for graph features: `NEO4J_URI`, `NEO4J_USERNAME`, `NEO4J_PASSWORD`.
- Required for drawing persistence and migrations: `DATABASE_URL`.
- Also used by local scripts/charts: `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`,
  `POSTGRES_PASSWORD`, `POSTGRES_DB`.
- Optional build analysis: `ANALYZE=true`.

Do not introduce `NEXT_PUBLIC_` database credentials and do not add Supabase merely to
match the stale application README. Never print secret values in logs or responses.
`project/components/web-app/.env` is a legacy tracked file containing connection values:
do not modify, expose, or copy it unless the task explicitly requires credential cleanup.
Use `.env.example` for documentation and placeholders. Local Helm values contain
development-only credentials and must not be reused for shared or production systems.

## Coding and database conventions

- TypeScript is configured with `strict: true`; prefer explicit domain types over adding
  more `any` values. Keep `@/*` imports rooted at `src/`.
- Preserve the server/client boundary. Add `"use client"` only to components that need
  browser APIs, hooks, or interactivity.
- Parameterize every new Cypher query. Do not interpolate request data into Cypher text.
- The generic `POST /api/neo4j/query` endpoint can execute caller-supplied Cypher and the
  driver currently opens write sessions. Do not expand or reuse this surface without
  explicit authorization, validation, and access-control work.
- For schema changes, edit `src/lib/drizzle/schema.ts`, generate and inspect a migration,
  commit the migration and metadata together, then test it on a disposable database.
- Keep route handlers thin: validate input at the boundary, return appropriate 4xx/5xx
  responses, and keep persistence logic in focused library modules.
- Avoid unrelated rewrites of generated shadcn UI primitives.

## Known baseline limitations

- The application README still describes the removed Supabase design; PostgreSQL/Drizzle
  is the current implementation.
- Some checked-in UI primitives import packages that are not direct dependencies and in
  several cases are absent from the lockfile. `DrawingEditor` also imports `tldraw` while
  only `@tldraw/tldraw` is declared directly. If a task touches these areas, reconcile
  imports, `package.json`, and `package-lock.json`; do not rely on transitive packages.
- `eslint-config-next` is major version 15 while `next` is major version 14, and production
  builds currently ignore ESLint errors. Do not interpret a successful build as a clean
  lint result.
- There are no active GitHub Actions workflows in the current tree and essentially no
  behavioral test coverage. Run and report each relevant check explicitly.
- Some existing Neo4j helpers interpolate values into Cypher and delete helpers/routes
  have inconsistent parameter shapes. Do not copy these patterns; fix them when they are
  within the requested scope and cover the behavior with tests.

## Change and verification workflow

Preserve unrelated user changes and untracked AI-tooling files. Before finishing a code
change, run the smallest relevant tests during development, then run all applicable final
checks from a fresh state: unit tests, TypeScript check, lint, and production build. Report
commands that could not run and why; never infer success. Infrastructure changes also
require shell syntax checks and Helm rendering/linting when Helm is available. Do not
deploy, tear down clusters, push schemas, or access shared databases unless the user has
authorized that operation.


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
