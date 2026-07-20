# Smart Citizen

Smart Citizen is a privacy-conscious community information system for Indonesian RT organizations. The pilot gives authorized RT officers a structured source of truth for resident records and monthly financial reporting while WhatsApp remains the familiar distribution channel.

This repository contains the development and database foundations. Pilot business workflows will be added in independently reviewed feature slices.

## Prerequisites

- Node.js 22.19.0 or another version matching `^22.12.0`
- pnpm 8.15.9
- PostgreSQL for database-backed feature development

## Start Locally

```bash
pnpm install
cp .env.example .env
pnpm exec nx serve web
pnpm exec nx serve api
```

The web application runs at `http://localhost:4200`. The API runs at `http://localhost:3000/api/v1`, with OpenAPI documentation at `http://localhost:3000/api/docs` outside production.

## Local Database

Local Prisma development uses three PostgreSQL databases owned by the `smart_citizen_app` role:

- `smart_citizen_dev` for application development.
- `smart_citizen_test` for rollback-safe database verification.
- `smart_citizen_shadow` for Prisma migration validation.

Set the three URLs in the ignored `.env` file. Replace `change-me` with the local role password and URL-encode special characters:

```dotenv
DATABASE_URL=postgresql://smart_citizen_app:change-me@127.0.0.1:5433/smart_citizen_dev?schema=public
TEST_DATABASE_URL=postgresql://smart_citizen_app:change-me@127.0.0.1:5433/smart_citizen_test?schema=public
SHADOW_DATABASE_URL=postgresql://smart_citizen_app:change-me@127.0.0.1:5433/smart_citizen_shadow?schema=public
```

Prisma owns application tables. Do not create or change them manually in pgAdmin. Create and review a migration with:

```bash
pnpm db:migrate:dev --name database_foundation
```

Validate the schema, migration history, and database constraints with:

```bash
pnpm db:validate
pnpm db:generate
pnpm db:migrate:check
pnpm db:migrate:status
pnpm db:test
```

`pnpm db:test` deploys the committed migrations to `smart_citizen_test`, inserts synthetic records inside a transaction, checks tenant and data-integrity constraints, and rolls the transaction back. It does not persist test data.

## Frontend HTTP Client

Axios is the standard frontend transport through `@smart-citizen/shared-http-client`. The web composition root exposes the application instance from `apps/web/src/app/http-client.ts` and reads its base URL from `VITE_API_URL`, with `/api/v1` as the same-origin fallback.

Domain API functions belong in `libs/<domain>/web`. They use the shared client, validate response data at the domain boundary, and pass TanStack Query's `AbortSignal` to Axios. TanStack Query owns request retries, caching, and invalidation; Axios does not retry requests. Tenant-owned functions must receive `communityId` explicitly instead of relying on a global tenant interceptor.

## Verification

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm e2e
pnpm exec prisma validate
```

`pnpm verify` runs formatting, linting, type checking, unit and integration tests, and production builds. Browser tests remain separate because they require Playwright Chromium and its host dependencies.

## Repository Map

```text
apps/
  web/                 React and Vite SPA
  web-e2e/             Playwright browser tests
  api/                 NestJS REST API
libs/
  identity/            Administrative identity and sessions
  platform/            Platform-owner and SaaS configuration
  community/           Communities, roles, permissions, and branding
  residency/           Houses, residents, and change submissions
  finance/             Financial reports, transactions, and approvals
  publication/         Stable public snapshots
  audit/               Administrative audit events
  shared/              UI, HTTP client, database, testing, and configuration infrastructure
prisma/                 Prisma schema and migrations
docs/superpowers/       Approved designs and implementation plans
```

Domain libraries use `api`, `web`, and `contracts` layers only where meaningful. Nx tags and ESLint prevent imports across private domain and frontend/backend boundaries.

## Architecture Documents

- [Bootstrap design](docs/superpowers/specs/2026-07-18-monorepo-bootstrap-design.md)
- [Bootstrap implementation plan](docs/superpowers/plans/2026-07-18-monorepo-bootstrap.md)
- [Axios HTTP client design](docs/superpowers/specs/2026-07-19-axios-http-client-design.md)
- [Database foundation design](docs/superpowers/specs/2026-07-19-database-foundation-design.md)
- [Database foundation implementation plan](docs/superpowers/plans/2026-07-19-database-foundation.md)
- [Engineering rules](AGENTS.md)
