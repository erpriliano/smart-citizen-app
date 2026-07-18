# Smart Citizen Monorepo Bootstrap Design

## Objective

Create the initial development foundation for Smart Citizen, a privacy-conscious RT community information system. The repository must contain runnable frontend and backend applications, enforce the agreed modular boundaries, document project-wide engineering rules, and provide repeatable local and CI verification.

This bootstrap establishes architecture and tooling only. It does not implement resident management, financial reporting, publication workflows, authentication, or other pilot business behavior.

## Product Constraints

- The first deployment targets one RT while every tenant-owned record is designed to belong to a community.
- Private resident information, financial drafts, supporting evidence, approval notes, audit records, role assignments, and Pamwas submissions must never become public automatically.
- Public access is limited to immutable information deliberately published through the publication domain.
- Pak RT approval, residency-change approval, tenant isolation, and auditability are domain invariants to implement and test with their respective features.
- Mobile and laptop workflows are both first-class.
- WhatsApp remains a manual distribution channel during the pilot.
- The system belongs to the RT organization and must support future leadership handover.

## Repository Architecture

Use an integrated Nx monorepo managed by pnpm. Nx owns project discovery, dependency constraints, task orchestration, and caching.

### Applications

- `apps/web`: React and TypeScript SPA built by Vite. It provides the administrative application and future public routes.
- `apps/api`: NestJS modular REST API with OpenAPI documentation.
- `apps/web-e2e`: Playwright browser tests for critical web workflows.

No worker application is created until a measured background-processing need exists.

### Domain Libraries

Pilot domains are represented as Nx libraries with explicit responsibilities:

- `identity`: administrative authentication, actor identity, and session context.
- `platform`: platform-owner capabilities and SaaS-level configuration.
- `community`: tenants, RT profiles, branding, positions, memberships, and permissions.
- `residency`: houses, residents, residencies, and Pamwas change submissions.
- `finance`: reporting periods, transactions, categories, draft review, and approval.
- `publication`: stable public snapshots and public identifiers.
- `audit`: traceable administrative actions and approvals.

Each domain may expose:

- `contracts`: framework-neutral schemas and public types shared across application boundaries.
- `api`: NestJS application and domain code.
- `web`: React feature and data-access code.

Libraries are created only where the layer is meaningful. For example, `audit` starts as an API library and does not receive an empty web project.

### Shared Libraries

- `shared/ui`: reusable shadcn/ui components and tenant-aware design tokens.
- `shared/database`: Prisma client lifecycle, persistence infrastructure, and migration ownership.
- `shared/testing`: cross-project test builders and utilities without production business logic.
- `shared/configuration`: validated environment and shared tooling configuration.

Shared libraries must remain cross-cutting. Domain concepts stay in their owning domain.

## Dependency Boundaries

Nx project tags and ESLint module-boundary rules enforce these constraints:

- Web projects cannot import API implementations.
- API projects cannot import web implementations.
- Contracts remain framework-neutral and cannot import API, web, database, or UI projects.
- Applications compose libraries; applications are not imported by libraries.
- A domain consumes another domain through its declared public contract or application interface, never through internal files.
- Shared projects cannot depend on domain projects.
- Tenant-owned backend repositories and services require an explicit community context.

The initial dependency rules must fail lint when a prohibited import is introduced.

## Technology Baseline

- Node.js `^22.12.0`, with local development currently using Node.js `22.19.0`.
- pnpm pinned in the root `packageManager` field and managed with Corepack.
- Nx 23 with all `nx` and `@nx/*` packages on the same version.
- React, TypeScript, Vite, and React Router.
- TanStack Query for server state.
- React Hook Form and Zod for forms and validation.
- Tailwind CSS and shadcn/ui for accessible, tenant-themeable UI.
- NestJS 11 for the modular REST API.
- OpenAPI through NestJS Swagger.
- PostgreSQL with Prisma as the database toolkit.
- S3-compatible object storage represented by configuration only; no provider integration in this bootstrap.
- Vitest and React Testing Library for unit and component tests.
- Playwright for browser tests.
- Backend integration tests alongside NestJS modules as features are implemented.

Dependency versions are resolved and locked during scaffold creation. Runtime and package-manager version constraints are recorded in repository files and CI.

## Initial Runnable Surface

The web application renders a restrained Smart Citizen shell that proves React, routing, Tailwind, and the shared UI path work. It contains no invented product dashboard or feature workflow.

The API exposes a versioned health endpoint that returns a stable status payload and is documented by OpenAPI. This endpoint proves NestJS startup, validation, routing, and test infrastructure.

Database configuration validates the presence of a PostgreSQL connection string without requiring a live database for lint, unit tests, or frontend development. A sample environment file documents required local settings and never contains credentials.

## Engineering Rules

A root `AGENTS.md` governs the whole repository. It documents:

- Product context and privacy boundaries.
- Technology choices and version policy.
- Directory ownership and dependency rules.
- React component, routing, data-fetching, form, accessibility, and performance practices.
- NestJS controller, service, validation, authorization, tenancy, persistence, error, transaction, and logging practices.
- Prisma migration and query rules.
- Testing expectations by change type.
- Required verification commands.
- Git hygiene, scope control, and documentation expectations.

Rules must be concrete enough to review code against and must point contributors to executable repository commands rather than duplicating tool documentation.

## Verification and CI

Root scripts expose consistent commands for:

- Formatting check.
- Linting.
- Type checking.
- Unit and component tests.
- Production builds.
- Playwright end-to-end tests.
- A combined verification command used locally and in CI.

GitHub Actions runs on pull requests and pushes to `main`. The protected branch requires the combined verification job after its first successful run. CI uses the repository-pinned Node and pnpm versions and the frozen lockfile.

The bootstrap is accepted when:

1. pnpm installs from the lockfile.
2. Nx recognizes all applications and libraries.
3. Formatting, linting, type checking, unit tests, and production builds pass.
4. The Playwright smoke test passes against the production-like web server.
5. The API health integration test passes.
6. A prohibited cross-layer import is prevented by the configured boundary rule.
7. `main` exists on the requested origin, is the default branch, and has branch protection configured.

## GitHub Publication

Initialize the repository with `main` as the local branch. Configure `origin` as:

`git@github.com-personal:erpriliano/smart-citizen-app.git`

After all verification passes, create one commit named exactly `Initial commit` and push it directly to `origin/main`. Then set `main` as the repository default and apply branch protection with:

- Pull requests required for future changes.
- Required conversation resolution.
- Required linear history.
- Required CI verification after the check is available.
- Force pushes disabled.
- Branch deletion disabled.

The initial bootstrap push necessarily occurs before protection is enabled. GitHub authentication or plan limitations are reported explicitly if they prevent remote settings from being applied.

## Deliberately Deferred

- Pilot business entities and Prisma schema.
- Authentication provider selection.
- Resident and financial feature screens.
- Public report rendering.
- Object-storage provider integration.
- Automated WhatsApp integration.
- Billing and subscriptions.
- Background workers and message brokers.
- Deployment-provider configuration.
- Nx Cloud.

These items require feature-specific designs or operational decisions and are not inferred during repository bootstrap.
