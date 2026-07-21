# Route Contracts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Register the approved 12 frontend routes with canonical paths while keeping unfinished administrative navigation hidden and public publication routing outside the authenticated shell.

**Architecture:** `libs/platform/contracts` owns framework-neutral administrative route paths so both navigation and application composition can consume them without eagerly loading React feature code. `apps/web` composes those paths into React Router, renders one minimal unavailable state for registered but unfinished pages, and keeps the public financial publication route outside `ProtectedRoute`. Existing permission filtering and the current-slice availability set continue to decide which primary links are visible.

**Tech Stack:** React 19, React Router 6, TypeScript, Vitest, React Testing Library, Nx 23, pnpm 8.15.9.

## Global Constraints

- Administrative routes require an authenticated session and remain unavailable below 768 px.
- `/p/finance/:publicId` is public and must not render the administrative shell or private session data.
- Navigation visibility follows explicit permissions and route availability, never position names.
- Unfinished routes render a truthful unavailable state and remain unchecked in Notion.
- Canonical copy uses English (UK); dates, times, and currency remain Indonesian-formatted where present.
- No production mock data is introduced.

---

### Task 1: Canonical Administrative Paths

**Files:**

- Create: `libs/platform/contracts/src/lib/route-paths.ts`
- Modify: `libs/platform/contracts/src/index.ts`
- Modify: `libs/platform/web/src/lib/navigation.ts`
- Modify: `libs/platform/web/src/lib/navigation.spec.ts`

**Interfaces:**

- Produces: `administrativeRoutePaths` from `@smart-citizen/platform-contracts`, a readonly map for overview, houses, residents, residency changes, financial reports, financial report workspace, publications, team, audit, and settings.
- Consumes: `administrativeRoutePaths` from navigation metadata and application route composition.

- [x] **Step 1: Add failing navigation assertions**

Assert the approved canonical paths (`/finance/reports`, `/team`, `/audit`, and `/settings`) and confirm planned navigation remains hidden by the default availability set.

- [x] **Step 2: Run the focused test and confirm RED**

Run: `pnpm exec nx run platform-web:test --skip-nx-cache`

Expected: FAIL because canonical route constants do not exist and current navigation uses legacy paths.

- [x] **Step 3: Implement and export the route map**

Create a readonly route map and replace navigation string literals with its values. Keep `sliceOneNavigationKeys` limited to `overview`.

- [x] **Step 4: Run the focused test and confirm GREEN**

Run: `pnpm exec nx run platform-web:test --skip-nx-cache`

Expected: PASS with canonical paths and permission/availability filtering intact.

### Task 2: Protected And Public Route Registration

**Files:**

- Modify: `apps/web/src/app/app.spec.tsx`
- Modify: `apps/web/src/app/app.tsx`

**Interfaces:**

- Consumes: `administrativeRoutePaths` from `@smart-citizen/platform-contracts`.
- Produces: registered route elements for all approved administrative paths and `/p/finance/:publicId`.

- [x] **Step 1: Add failing route-boundary tests**

Cover an authenticated unfinished administrative route, an unauthenticated administrative redirect, canonical finance routing, and public publication access without a session request or administrative shell.

- [x] **Step 2: Run the focused test and confirm RED**

Run: `pnpm exec nx run web:test --skip-nx-cache`

Expected: FAIL because unfinished routes currently fall through to `Page not found` and the public route is protected.

- [x] **Step 3: Register the approved route contracts**

Add one focused unavailable-page component, register the eight unfinished administrative destinations plus the financial detail route inside the protected shell, and register the public financial report route outside `ProtectedRoute`. Preserve the protected wildcard page.

- [x] **Step 4: Run the focused test and confirm GREEN**

Run: `pnpm exec nx run web:test --skip-nx-cache`

Expected: PASS with route boundaries, titles, and privacy behaviour proven.

### Task 3: Verification

**Files:**

- Verify only; no production files expected.

**Interfaces:**

- Consumes: completed route and navigation behaviour.
- Produces: repository and rendered-browser evidence.

- [x] **Step 1: Run affected verification**

Run: `pnpm exec nx affected -t lint typecheck test build --skip-nx-cache`

Expected: all affected targets pass.

- [x] **Step 2: Run repository-required verification**

Run: `pnpm verify && pnpm e2e && pnpm exec prisma validate && git diff --check`

Expected: all checks pass; the existing non-blocking Vite chunk-size warning may remain.

- [x] **Step 3: Run Playwright route smoke checks**

Use the repository Playwright configuration because the Browser plugin is not available. Verify one protected unavailable route, the public publication route, the current overview, console health, and tablet/desktop framing.

- [x] **Step 4: Inspect repository status**

Run: `git status --short`

Expected: only the intentional proxy, documentation, route, navigation, test, and plan files are modified or untracked; `.env`, credentials, screenshots, and generated artifacts remain absent.
