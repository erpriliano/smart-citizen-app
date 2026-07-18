# Smart Citizen

Smart Citizen is a privacy-conscious community information system for Indonesian RT organizations. The pilot gives authorized RT officers a structured source of truth for resident records and monthly financial reporting while WhatsApp remains the familiar distribution channel.

This repository currently contains the development foundation only. Pilot business workflows and data entities will be added in independently reviewed feature slices.

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
  shared/              UI, database, testing, and configuration infrastructure
prisma/                 Prisma schema and future migrations
docs/superpowers/       Approved designs and implementation plans
```

Domain libraries use `api`, `web`, and `contracts` layers only where meaningful. Nx tags and ESLint prevent imports across private domain and frontend/backend boundaries.

## Architecture Documents

- [Bootstrap design](docs/superpowers/specs/2026-07-18-monorepo-bootstrap-design.md)
- [Bootstrap implementation plan](docs/superpowers/plans/2026-07-18-monorepo-bootstrap.md)
- [Engineering rules](AGENTS.md)
