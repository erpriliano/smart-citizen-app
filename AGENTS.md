# Smart Citizen Engineering Guide

## Scope

This file governs the entire repository. A more specific `AGENTS.md` may add rules for a subtree but must not weaken the privacy, tenancy, authorization, or verification requirements here.

## Product Context

Smart Citizen is a trusted RT community information system. It complements WhatsApp with structured, durable administrative records and intentionally published public information.

The first pilot is operated by Pak RT, an App Administrator, authorized Pengurus RT, Bendahara, and Pamwas. Residents do not require accounts during the pilot.

The initial pilot capabilities are:

- Minimal private house, resident, and residency records.
- Pamwas residency-change submissions reviewed by authorized Pengurus RT.
- Monthly financial drafts, review, Pak RT approval, publication, and history.
- Stable resident-facing publications shared manually through WhatsApp.
- A focused weekly review for Pak RT.

Complaints, resident accounts, events, social profiles, emergency workflows, billing, automated WhatsApp delivery, and multi-community operation are later stages. Do not implement them without an approved feature design.

## Non-Negotiable Product Rules

- Trust and privacy come before feature breadth.
- Collect only data required for a stated RT purpose.
- Every tenant-owned record and query must carry explicit community context.
- Only records deliberately published through the publication domain are public.
- Never expose resident names, contacts, administrative records, financial drafts, evidence, approval notes, audit events, role assignments, or Pamwas submissions automatically.
- Published financial reports are stable snapshots. Corrections create a revision instead of silently rewriting history.
- Pak RT approval is required before a pilot financial report can be published.
- Pamwas proposes resident changes and never modifies official resident records directly.
- Organizational position and application permission are separate concepts.
- Records belong to the RT organization and must survive officer handover.
- Sensitive fields and credentials must not appear in logs, test fixtures, screenshots, commits, or public error messages.

## Technology Baseline

- Monorepo: Nx 23 with pnpm workspaces.
- Runtime: Node.js 22, TypeScript, pnpm 8.15.9.
- Web: React 19, Vite, React Router, TanStack Query, React Hook Form, Zod, Tailwind CSS 4, and shadcn/ui Base/Nova.
- API: NestJS 11, REST, OpenAPI, class-validator, and class-transformer.
- Data: PostgreSQL and Prisma 7.
- Files: an S3-compatible adapter will be introduced with the first file-backed feature.
- Tests: Vitest, React Testing Library, Supertest integration tests, and Playwright.
- CI: GitHub Actions with a required `verify` job.

Use versions from `package.json` and `pnpm-lock.yaml`. Keep `nx` and every `@nx/*` package on exactly the same version.

## Repository Structure

```text
apps/web                 SPA composition, providers, routes, and application shell
apps/api                 NestJS composition root and transport bootstrap
apps/web-e2e             Critical browser workflows
libs/<domain>/contracts  Framework-neutral schemas and public types
libs/<domain>/api        Domain/application services and NestJS adapters
libs/<domain>/web        Domain UI, hooks, and client data access
libs/shared/ui           shadcn components and tenant-aware design tokens
libs/shared/database     Prisma lifecycle and shared persistence infrastructure
libs/shared/testing      Cross-project test utilities
libs/shared/configuration Validated runtime configuration
prisma                   Schema and migrations
infrastructure           Deployment assets when a provider is selected
tools                    Repository automation only
docs                     Architecture decisions, designs, and plans
```

Do not create a generic `utils`, `common`, or `helpers` dumping ground. Put behavior in the domain that owns it; promote code to `shared` only after it is genuinely cross-cutting.

## Nx Boundaries

Every project requires `type:*` and `scope:*` tags.

Types:

- `type:web`: React features and browser data access.
- `type:api`: NestJS and server-only domain code.
- `type:contracts`: framework-neutral schemas and types.
- `type:ui`: shared presentational components.
- `type:database`: Prisma and shared persistence infrastructure.
- `type:configuration`: validated configuration.
- `type:testing`: reusable test support.
- `type:e2e`: end-to-end test projects.

Scopes are `identity`, `platform`, `community`, `residency`, `finance`, `publication`, `audit`, `contracts`, and `shared`.

- Web code never imports API or database implementations.
- API code never imports web or UI implementations.
- Contracts import contracts only and must not depend on React, NestJS, Prisma, or browser/Node APIs.
- Shared projects never import a business domain.
- A domain may use another domain only through a contracts project until an explicit public application interface is designed.
- Applications compose libraries. Libraries never import applications.
- Import another project through its configured `@smart-citizen/*` public entry point, never a deep internal file.
- Within one project, prefer direct relative imports over internal barrel files.

Run `pnpm lint` after changing project tags, aliases, or cross-project imports.

## Working Rules

1. Read the nearest `AGENTS.md`, relevant design, and affected project configuration before editing.
2. Keep changes limited to one approved behavior or architecture concern.
3. Write a failing test before production behavior. Confirm the failure reason, implement the minimum, then rerun the focused and affected tests.
4. Use Nx generators for projects and framework scaffolding. Review and remove generated placeholder behavior.
5. Use `pnpm` only. Do not introduce npm, Yarn, Bun, or another lockfile.
6. Use `pnpm exec nx ...` for project tasks so local and CI execution match.
7. Do not silence TypeScript, ESLint, test, or accessibility failures with broad ignores or unsafe casts.
8. Validate external input at the boundary. Do not duplicate validation with ad hoc string checks.
9. Add abstractions only when they remove real duplication or enforce a meaningful boundary.
10. Keep generated artifacts, credentials, local databases, coverage, and build output out of Git.
11. Update relevant documentation when a command, boundary, public contract, or architectural decision changes.
12. Use ASCII in source and documentation unless user-facing Indonesian content requires otherwise.

## React Rules

- Keep `apps/web` as a composition root. Domain screens, hooks, query definitions, and client services belong in `libs/<domain>/web`.
- Use React Router for routes and protected route composition. Keep route modules focused and lazy-load substantial feature areas.
- Use TanStack Query for remote server state. Do not fetch remote data in raw `useEffect` calls.
- Define query keys next to the owning domain client. Invalidate the narrowest relevant key after a mutation.
- Start independent requests together and avoid serial request waterfalls.
- Use React Hook Form with Zod schemas for non-trivial forms. Reuse a framework-neutral contract schema only when the server and client truly share the same input contract.
- Keep transient UI state local. Do not add a global state library without a demonstrated cross-route need.
- Prefer composition and focused components. Split files when they own multiple independent responsibilities.
- Do not mirror props into state or use effects to derive renderable values.
- Use semantic HTML first. Every control needs an accessible name, visible focus, keyboard operation, and appropriate error association.
- Use shadcn components through `components.json`. Run the shadcn CLI, inspect generated files, and keep components in `libs/shared/ui`.
- Use the configured Lucide icons for actions. Add tooltips for unfamiliar icon-only controls.
- Use semantic design tokens and responsive constraints. Do not hardcode tenant branding inside domain components.
- Avoid nested cards, decorative gradients, oversized headings in work surfaces, and layout shifts from dynamic content.
- Import large optional features dynamically. Import library symbols from their public entry point and avoid broad third-party barrel imports when direct imports are supported.
- Test user-visible behavior with Testing Library queries by role, label, and text rather than implementation details.

## NestJS and Node.js Rules

- Controllers translate HTTP input and output only. Business decisions belong in domain application services.
- DTOs must validate all external input. Enable whitelist validation and reject unexpected privileged fields.
- Keep domain invariants independent from NestJS decorators where practical.
- Authorization uses guards/policies and explicit permissions. Never infer permission solely from a position name.
- Resolve actor and community context at the authenticated boundary and pass both explicitly to tenant-owned services and repositories.
- Repository methods for tenant data require `communityId`; a method that can query all communities must be platform-scoped and named accordingly.
- Return stable public DTOs. Do not serialize Prisma records directly from controllers.
- Use transactions for financial approval/publication, residency approval/application, and any operation that updates multiple consistency-related records.
- Map expected domain failures to consistent HTTP errors. Do not leak stack traces, SQL, provider responses, or record existence across tenants.
- Use structured logging with action and safe identifiers. Never log tokens, contact information, evidence contents, or complete request bodies.
- Keep provider integrations behind interfaces owned by the consuming domain. Controllers and domain services do not import vendor SDKs directly.
- Keep CPU-heavy document generation and high-volume notification delivery out of request handlers; introduce a worker only after the operational need is measured.
- Document public endpoints and response models in OpenAPI. Administrative endpoints remain protected even if undocumented clients know the URL.

## Prisma and PostgreSQL Rules

- Prisma is a persistence tool; business rules remain in domain/application services.
- Use the `prisma-client` generator with an explicit output path. Generated client files are not committed.
- Every tenant table includes `communityId`. Add community-leading compound indexes for actual query patterns.
- Every tenant query filters by community at the repository boundary. Never fetch by record ID alone and check tenancy afterward when a compound predicate can enforce it in the query.
- Use foreign keys, uniqueness constraints, and transactions for invariants the database can guarantee.
- Financial amounts use an exact decimal or integer minor-unit representation, never JavaScript floating-point arithmetic.
- Public identifiers are non-sequential and distinct from internal database identifiers.
- Migrations are append-only after sharing. Do not edit an applied migration; create a corrective migration.
- Review generated SQL before applying migrations to staging or production.
- Use raw SQL only when Prisma cannot express a measured need. Parameterize values and document the reason.
- Do not add row-level security as a substitute for application scoping. It may be added later as defense in depth.

## Testing Requirements

Match coverage to risk:

- Pure rules and transformations: focused Vitest unit tests.
- React behavior: React Testing Library with accessible queries.
- Controllers, validation, filters, guards, and persistence wiring: NestJS/Supertest integration tests.
- Prisma repositories: integration tests against PostgreSQL with representative tenant data.
- Authorization or tenant changes: positive permission tests, negative permission tests, and explicit cross-community denial tests.
- Financial publication: test approval gates, atomic snapshot creation, revision history, and private/public separation.
- Residency changes: test propose, approve, reject, apply, and no-change-on-rejection paths.
- Critical mobile workflows: Playwright at small and desktop viewports with overflow and keyboard checks.
- Migrations: validate and apply against representative data before production use.

Do not mock the unit under test. Mock external boundaries only when a real integration would make a focused unit test unreliable or slow.

## Verification

Run the narrowest test during development, then complete the relevant repository checks before finishing:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm e2e
pnpm exec prisma validate
```

`pnpm verify` runs every check except Playwright and Prisma validation. Run those separately when web, routing, Prisma, database, configuration, or CI behavior changes.

Before declaring work complete:

- Read the full command output and confirm zero failures.
- Run `git diff --check`.
- Inspect `git status --short` for generated or secret files.
- Confirm public/private and cross-tenant boundaries for the changed behavior.
- Confirm documentation and OpenAPI remain accurate.

## Git and Review

- After the bootstrap, do not push directly to protected `main`; use a focused branch and pull request.
- Prefer small conventional commits such as `feat(finance): add report approval` or `test(residency): cover rejected move-out`.
- Do not combine dependency upgrades, formatting churn, refactors, and product behavior in one change unless inseparable.
- Never rewrite or discard user changes without explicit permission.
- Treat failing required checks and unresolved review comments as blockers to merge.
