# Smart Citizen Monorepo Bootstrap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create, verify, commit, and publish the initial Smart Citizen Nx monorepo with runnable React and NestJS applications, enforceable domain boundaries, repository-wide engineering rules, CI, and a protected default branch.

**Architecture:** Use an integrated Nx 23 workspace managed by pnpm 8. Applications compose small domain libraries split into API, web, and framework-neutral contract layers. Executable Nx tags and ESLint rules enforce the modular-monolith boundaries described in the approved design.

**Tech Stack:** Node.js 22, pnpm 8.15.9, Nx 23.0.1, React, Vite, React Router, TanStack Query, React Hook Form, Zod, Tailwind CSS, shadcn/ui, NestJS 11, OpenAPI, PostgreSQL, Prisma 7.8.0, Vitest, React Testing Library, Playwright, ESLint, Prettier, GitHub Actions.

## Global Constraints

- Keep all `nx` and `@nx/*` packages pinned to exactly `23.0.1`.
- Require Node.js `^22.12.0` and pin pnpm to exactly `8.15.9` through `packageManager`.
- Use only the single requested commit named `Initial commit` for the bootstrap.
- Do not add pilot business entities, authentication-provider code, resident workflows, financial workflows, or deployment-provider configuration.
- Do not require a live PostgreSQL instance for linting, unit tests, application builds, or the Playwright smoke test.
- Keep all tenant and privacy invariants from the approved design in the root engineering rules.
- Use `main` for the initial push, then make it default and protected.

---

### Task 1: Root Workspace and Toolchain

**Files:**

- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `nx.json`
- Create: `tsconfig.base.json`
- Create: `eslint.config.mjs`
- Create: `.prettierrc.json`
- Create: `.prettierignore`
- Create: `.gitignore`
- Create: `.nvmrc`
- Create: `.env.example`
- Create: `README.md`
- Create: `AGENTS.md`
- Preserve: `docs/superpowers/specs/2026-07-18-monorepo-bootstrap-design.md`
- Preserve: `docs/superpowers/plans/2026-07-18-monorepo-bootstrap.md`

**Interfaces:**

- Consumes: Approved repository design and Node.js `22.19.0` available locally.
- Produces: Root pnpm/Nx commands and repository rules consumed by every later task.

- [ ] **Step 1: Create the root package manifest and workspace files**

Create a private `package.json` with `packageManager: "pnpm@8.15.9"`, `engines.node: "^22.12.0"`, scripts for `nx`, `format`, `format:check`, `lint`, `typecheck`, `test`, `build`, `e2e`, and `verify`, and exact Nx 23.0.1 development dependencies. Configure `pnpm-workspace.yaml` to include `apps/*` and `libs/**`.

The verification script must execute formatting, linting, type checking, unit tests, and builds. Browser tests remain a separate `e2e` command so local verification does not download or launch browsers unexpectedly.

- [ ] **Step 2: Install the pinned workspace toolchain**

Run:

```bash
pnpm install
```

Expected: `pnpm-lock.yaml` is created and all root dependencies install successfully.

- [ ] **Step 3: Create baseline Nx, TypeScript, lint, and formatting configuration**

Configure Nx plugins for ESLint, Vite, Vitest, and Playwright. Enable task caching for `build`, `lint`, `typecheck`, `test`, and `e2e`. Set strict TypeScript options including `strict`, `noImplicitOverride`, `noUncheckedIndexedAccess`, and `exactOptionalPropertyTypes`.

Configure `@nx/enforce-module-boundaries` with these tag dimensions:

```text
layer:app -> type:api | type:web | type:e2e | type:contracts | type:shared
type:web -> type:web | type:contracts | type:ui | type:configuration | type:testing
type:api -> type:api | type:contracts | type:database | type:configuration | type:testing
type:contracts -> type:contracts
type:ui -> type:ui | type:contracts
type:database -> type:database | type:contracts | type:configuration
type:configuration -> type:configuration | type:contracts
type:testing -> type:testing | type:contracts
scope:shared -> scope:shared
```

Domain projects may depend on `scope:shared` and their own scope. Cross-domain use must go through `type:contracts` until an explicit public application interface is designed.

- [ ] **Step 4: Write root project documentation and engineering rules**

`README.md` must explain prerequisites, installation, local development, verification, application URLs, and the high-level directory map.

`AGENTS.md` must define:

```text
product and pilot context
privacy and public-publication boundaries
current technology stack and version policy
Nx project naming, tags, and dependency constraints
React routing, server-state, forms, accessibility, component, and performance rules
NestJS controller, service, DTO, validation, authorization, tenant, transaction, and logging rules
Prisma migration, query, and transaction rules
test placement and verification expectations by change type
Git scope, commit, documentation, and generated-file hygiene
```

- [ ] **Step 5: Verify the empty workspace configuration**

Run:

```bash
pnpm exec nx report
pnpm exec prettier --check .
```

Expected: Nx reports version 23.0.1 on Node 22.19.0 and Prettier reports no formatting errors.

### Task 2: Runnable Web and API Applications

**Files:**

- Generate: `apps/web/**`
- Generate: `apps/web-e2e/**`
- Generate: `apps/api/**`
- Create: `apps/api/src/app/health/health.controller.spec.ts`
- Create: `apps/api/src/app/health/health.e2e-spec.ts`
- Create: `apps/api/src/app/health/health.controller.ts`
- Create: `apps/api/src/app/health/health.module.ts`
- Modify: `apps/api/src/app/app.module.ts`
- Modify: `apps/api/src/main.ts`
- Create: `apps/web/src/app/app.spec.tsx`
- Modify: `apps/web/src/app/app.tsx`
- Modify: `apps/web/src/main.tsx`
- Modify: `apps/web/src/styles.css`
- Modify: `apps/web-e2e/src/example.spec.ts`

**Interfaces:**

- Consumes: Root Nx scripts and tag constraints from Task 1.
- Produces: `GET /api/v1/health`, a renderable React shell, and project targets consumed by CI.

- [ ] **Step 1: Generate the applications with pinned Nx generators**

Run the React application generator with Vite, Vitest, ESLint, React Router support, Playwright E2E, and tags `layer:app,type:web,scope:web`. Run the Nest application generator with Vitest or convert its generated unit target to Vitest, ESLint, and tags `layer:app,type:api,scope:api`.

Use non-interactive generator options and keep generated applications in `apps/web`, `apps/web-e2e`, and `apps/api`.

- [ ] **Step 2: Write failing API health tests**

Unit expectation:

```ts
expect(controller.getHealth()).toEqual({ status: 'ok', service: 'smart-citizen-api' });
```

Integration expectation:

```ts
await request(app.getHttpServer())
  .get('/api/v1/health')
  .expect(200)
  .expect({ status: 'ok', service: 'smart-citizen-api' });
```

Run:

```bash
pnpm exec nx test api
```

Expected: FAIL because the health controller and module do not exist.

- [ ] **Step 3: Implement the API health surface**

Implement `HealthController.getHealth()` with the exact stable payload from Step 2. Import `HealthModule` in `AppModule`. Configure `main.ts` with global prefix `api/v1`, global validation using whitelist and transform, CORS from validated configuration, and OpenAPI at `/api/docs` outside production.

- [ ] **Step 4: Run API tests**

Run:

```bash
pnpm exec nx test api
pnpm exec nx build api
```

Expected: all API tests pass and the API production build exits successfully.

- [ ] **Step 5: Write the failing web shell test**

Assert that the application renders the product name and a neutral setup-status heading through a memory router and QueryClient provider.

Run:

```bash
pnpm exec nx test web
```

Expected: FAIL because the approved shell content and providers are not implemented.

- [ ] **Step 6: Implement the web shell and providers**

Configure React Router and TanStack Query at the application root. Render a responsive Smart Citizen foundation screen with semantic HTML and no invented dashboard data. Initialize Tailwind and shadcn/ui using the shadcn CLI with the `base-nova` preset, then use only generated configuration and project-owned components.

- [ ] **Step 7: Implement and run the Playwright smoke test**

The browser test opens `/`, verifies the Smart Citizen heading, checks that no horizontal overflow exists at a small mobile viewport, and verifies that the API is not required to render the shell.

Run:

```bash
pnpm exec nx test web
pnpm exec nx build web
pnpm exec nx e2e web-e2e
```

Expected: unit tests, build, and browser smoke test pass.

### Task 3: Domain Libraries, Database Foundation, and Boundaries

**Files:**

- Generate: `libs/{identity,platform,community,residency,finance,publication}/{contracts,api,web}/**`
- Generate: `libs/audit/api/**`
- Generate: `libs/shared/{ui,database,testing,configuration}/**`
- Create: `prisma/schema.prisma`
- Create: `prisma.config.ts`
- Create: `libs/shared/configuration/src/lib/environment.ts`
- Create: `libs/shared/configuration/src/lib/environment.spec.ts`
- Modify: project configuration files generated for all libraries
- Modify: `eslint.config.mjs`
- Modify: `tsconfig.base.json`

**Interfaces:**

- Consumes: Nx tags and application projects from Tasks 1 and 2.
- Produces: Stable import aliases, empty public domain entry points, validated environment configuration, and executable module boundaries.

- [ ] **Step 1: Generate framework-neutral contract libraries**

Generate six `@nx/js` libraries at `libs/<domain>/contracts` with Vitest, ESLint, and tags `scope:<domain>,type:contracts`. Export no speculative domain types; each public entry point contains only a package-level description until a feature defines a contract.

- [ ] **Step 2: Generate API domain libraries**

Generate Nest libraries for all seven pilot domains with tags `scope:<domain>,type:api`. Each library exposes its Nest module and no business behavior.

- [ ] **Step 3: Generate meaningful web domain libraries**

Generate React libraries for `identity`, `platform`, `community`, `residency`, `finance`, and `publication` with tags `scope:<domain>,type:web`. Do not create `audit/web`.

- [ ] **Step 4: Generate shared libraries**

Generate `shared/ui`, `shared/database`, `shared/testing`, and `shared/configuration` with their matching type tags and `scope:shared`. Use React only for `shared/ui`; use TypeScript libraries for the other shared projects.

- [ ] **Step 5: Write failing environment tests**

Test these cases:

```ts
parseEnvironment({ NODE_ENV: 'test', PORT: '3000', DATABASE_URL: 'postgresql://localhost/test' });
// returns typed values with PORT equal to 3000

parseEnvironment({ NODE_ENV: 'test', PORT: 'invalid', DATABASE_URL: '' });
// throws a Zod validation error
```

Run the shared configuration test and confirm it fails before implementation.

- [ ] **Step 6: Implement environment and Prisma configuration**

Implement `parseEnvironment` with Zod for `NODE_ENV`, `PORT`, `DATABASE_URL`, `WEB_ORIGIN`, optional S3 endpoint, bucket, region, access key, and secret. Add a provider-only Prisma schema with no pilot entities and configure Prisma 7 through `prisma.config.ts`.

Run:

```bash
pnpm exec nx test shared-configuration
pnpm exec prisma validate
```

Expected: environment tests pass and Prisma validates using the documented sample connection string.

- [ ] **Step 7: Prove the module-boundary rule**

Create a temporary web-library import of an API-library public entry point and run that web library's lint target.

Expected: lint fails with `@nx/enforce-module-boundaries`.

Remove the temporary import and rerun lint.

Expected: lint passes. No invalid fixture remains in the repository.

- [ ] **Step 8: Verify the complete Nx project graph**

Run:

```bash
pnpm exec nx show projects
pnpm exec nx run-many -t lint,typecheck,test,build
```

Expected: Nx lists all applications and libraries; every available target passes.

### Task 4: CI, Final Verification, Git, and GitHub Protection

**Files:**

- Create: `.github/workflows/ci.yml`
- Modify: `README.md` if generated commands differ from final commands
- Modify: `AGENTS.md` if verification discovers missing rules

**Interfaces:**

- Consumes: All workspace targets and documentation from Tasks 1 through 3.
- Produces: GitHub check `verify`, commit `Initial commit`, remote `origin/main`, and a protected default branch.

- [ ] **Step 1: Add GitHub Actions CI**

Create one workflow named `CI` for pushes to `main` and pull requests. Define a job named `verify` on Ubuntu that checks out the repository, sets up Node 22 with pnpm caching, activates pnpm 8.15.9 through Corepack, installs with `--frozen-lockfile`, runs `pnpm verify`, installs the Playwright Chromium dependency, and runs `pnpm e2e`.

- [ ] **Step 2: Run fresh full local verification**

Run:

```bash
pnpm install --frozen-lockfile
pnpm run verify
pnpm run e2e
pnpm exec prisma validate
```

Expected: every command exits 0 with no failing tests or checks.

- [ ] **Step 3: Audit the final worktree**

Run:

```bash
git diff --check
git status --short
```

Inspect every staged path, confirm no secrets, build output, local databases, browser artifacts, or unrelated files are included, and confirm the design requirements map to repository files and passing commands.

- [ ] **Step 4: Initialize and commit**

Run:

```bash
git init -b main
git remote add origin git@github.com-personal:erpriliano/smart-citizen-app.git
git add -A
git commit -m "Initial commit"
```

Expected: one root commit exists on local `main` and `git status --short` is empty.

- [ ] **Step 5: Push the initial branch**

Run:

```bash
git push -u origin main
```

Expected: `origin/main` is created and local `main` tracks it.

- [ ] **Step 6: Set default branch and protection**

Use an authenticated GitHub API path to set `main` as default. After the `verify` check exists, apply branch protection that requires pull requests, conversation resolution, linear history, and `verify`; disable force pushes and deletion.

If the current `gh` token is still invalid, authenticate `gh` or use an available GitHub app connection. If repository plan or permission limitations reject branch protection, preserve the successful push and report the exact GitHub response without weakening the requested rule silently.

- [ ] **Step 7: Verify remote state**

Confirm:

```text
default branch: main
branch protection: enabled for main
required status check: verify
force pushes: disabled
deletion: disabled
local commit subject: Initial commit
local and remote main commit IDs: identical
```

Record the commit ID and the final verification results for the completion report.
