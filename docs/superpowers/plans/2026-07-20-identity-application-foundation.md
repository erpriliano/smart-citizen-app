# Identity and Application Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the first working pilot slice: secure administrative sign-in, explicit community session context, protected routing, a responsive role-adaptive application shell, and an honest initial Weekly Overview.

**Architecture:** The identity domain owns framework-neutral session contracts, application services, password verification, signed session tokens, and tenant-scoped persistence. The web application injects its shared Axios client into the identity web library, TanStack Query owns session state, and the application shell renders only permission-allowed navigation. The overview uses the authenticated session contract only; it does not invent finance or residency data before those domains expose real APIs.

**Tech Stack:** Node.js 22, TypeScript, pnpm 8.15.9, Nx 23, NestJS 11, PostgreSQL, Prisma 7 with the PostgreSQL driver adapter, Argon2id, signed JWT session cookies, React 19, React Router 6, TanStack Query 5, React Hook Form, Zod 4, Tailwind CSS 4, shadcn/ui Base/Nova, Vitest, Testing Library, Supertest, and Playwright.

## Global Constraints

- Administrative sessions resolve exactly one active user, membership, community, positions, roles, and permission set.
- Tenant-owned lookups require `communityId` in the repository predicate.
- Cookies are HTTP-only, SameSite Lax, scoped to `/api/v1`, and secure in production.
- Invalid credentials and invalid sessions return the same privacy-safe `401` message without disclosing account existence.
- Passwords, password hashes, tokens, contacts, and request bodies never appear in logs or fixtures committed to Git.
- Production web screens never fall back to mock data.
- Interface copy uses English (UK); currency and date/time formatting use Indonesian locale rules.
- Administrative content is not rendered below 768 px; Sign In remains usable from 320 px.
- Follow test-driven development: observe the focused test fail, implement the minimum, then rerun the focused test and affected suite.

---

### Task 1: Runtime Configuration, Cookie-capable HTTP, and Prisma Lifecycle

**Files:**

- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `.env.example`
- Modify: `libs/shared/configuration/src/lib/shared-configuration.ts`
- Modify: `libs/shared/configuration/src/lib/shared-configuration.spec.ts`
- Modify: `libs/shared/http-client/src/lib/http-client.ts`
- Modify: `libs/shared/http-client/src/lib/http-client.spec.ts`
- Create: `libs/shared/database/src/lib/database.service.ts`
- Create: `libs/shared/database/src/lib/database.module.ts`
- Create: `libs/shared/database/src/lib/database.service.spec.ts`
- Modify: `libs/shared/database/src/index.ts`
- Modify: `libs/shared/database/project.json`

**Interfaces:**

- Produces: `Environment.AUTH_SESSION_SECRET: string`, `Environment.AUTH_SESSION_TTL_SECONDS: number`, and `Environment.AUTH_COOKIE_SECURE: boolean`.
- Produces: `CreateHttpClientOptions.withCredentials?: boolean`.
- Produces: injectable `DatabaseService extends PrismaClient` and global `DatabaseModule`.

- [x] **Step 1: Write failing configuration and HTTP client tests**

Add assertions that a 32-character session secret, integer TTL, and boolean cookie flag are parsed, that short secrets are rejected, and that `withCredentials: true` reaches Axios defaults.

- [x] **Step 2: Run the focused tests and confirm the new assertions fail**

Run:

```bash
pnpm exec nx run shared-configuration:test
pnpm exec nx run shared-http-client:test
```

Expected: configuration fails because auth fields are absent and HTTP client fails because `withCredentials` is not forwarded.

- [x] **Step 3: Install the approved server dependencies**

Run:

```bash
pnpm add @nestjs/config @nestjs/jwt @prisma/adapter-pg argon2 cookie-parser pg
pnpm add -D @types/cookie-parser @types/pg
```

- [x] **Step 4: Implement validated auth configuration and credentialed Axios requests**

Extend the environment schema with:

```ts
AUTH_SESSION_SECRET: z.string().min(32),
AUTH_SESSION_TTL_SECONDS: z.coerce.number().int().min(300).max(86_400).default(28_800),
AUTH_COOKIE_SECURE: z
  .enum(['true', 'false'])
  .default('false')
  .transform((value) => value === 'true'),
```

Forward `withCredentials` into `axios.create` and document non-secret example values in `.env.example`.

- [x] **Step 5: Write and run a failing DatabaseService lifecycle test**

The test supplies a PostgreSQL adapter double to a constructor seam, calls `onModuleDestroy`, and expects `$disconnect` to run once. It must fail before the lifecycle service exists.

- [x] **Step 6: Implement DatabaseModule and DatabaseService**

`DatabaseService` constructs `PrismaClient` with `new PrismaPg({ connectionString })`, connects during module initialisation, and disconnects during module destruction. `DatabaseModule` obtains the validated URL from `ConfigService<Environment, true>` and exports one service instance without logging queries.

- [x] **Step 7: Run focused tests and commit**

Run:

```bash
pnpm exec nx run shared-configuration:test
pnpm exec nx run shared-http-client:test
pnpm exec nx run shared-database:test
```

Commit:

```bash
git commit -m "feat(platform): add secure runtime database foundation"
```

### Task 2: Framework-neutral Identity Contracts

**Files:**

- Create: `libs/identity/contracts/src/lib/session-contracts.ts`
- Create: `libs/identity/contracts/src/lib/session-contracts.spec.ts`
- Modify: `libs/identity/contracts/src/index.ts`
- Modify: `libs/identity/contracts/project.json`
- Create: `libs/identity/contracts/tsconfig.spec.json`
- Create: `libs/identity/contracts/vitest.config.mts`

**Interfaces:**

- Produces: `signInInputSchema`, `SignInInput`, `sessionContextSchema`, `SessionContext`, and `permissionCodeSchema`.
- `SessionContext` contains safe user identity, one community, one membership identifier, position summaries, role summaries, and a de-duplicated permission-code array. It never includes a password hash or internal audit fields.

- [x] **Step 1: Write failing schema tests**

Cover normalised email input, minimum password length, complete session parsing, malformed community identifiers, and rejection of privileged unknown fields.

- [x] **Step 2: Run the focused test and confirm failure**

Run:

```bash
pnpm exec nx run identity-contracts:test
```

Expected: fail because the session contract module does not exist.

- [x] **Step 3: Implement exact public contracts**

Use strict Zod objects. The public session shape is:

```ts
type SessionContext = {
  user: { id: string; email: string };
  membershipId: string;
  community: {
    id: string;
    name: string;
    slug: string;
    timezone: string;
    currency: string;
  };
  positions: Array<{ code: string; name: string }>;
  roles: Array<{ code: string; name: string }>;
  permissions: string[];
};
```

- [x] **Step 4: Run the focused tests and commit**

Run:

```bash
pnpm exec nx run identity-contracts:test
```

Commit:

```bash
git commit -m "feat(identity): define administrative session contracts"
```

### Task 3: Identity Application Service and Session API

**Files:**

- Create: `libs/identity/api/src/lib/identity-account.repository.ts`
- Create: `libs/identity/api/src/lib/prisma-identity-account.repository.ts`
- Create: `libs/identity/api/src/lib/password-hasher.ts`
- Create: `libs/identity/api/src/lib/session-token.service.ts`
- Create: `libs/identity/api/src/lib/identity-session.service.ts`
- Create: `libs/identity/api/src/lib/identity-session.service.spec.ts`
- Create: `libs/identity/api/src/lib/session.dto.ts`
- Create: `libs/identity/api/src/lib/identity-session.controller.ts`
- Create: `libs/identity/api/src/lib/identity-session.integration.spec.ts`
- Modify: `libs/identity/api/src/lib/identity-api.module.ts`
- Modify: `libs/identity/api/src/index.ts`
- Modify: `libs/identity/api/project.json`
- Create: `libs/identity/api/tsconfig.spec.json`
- Create: `libs/identity/api/vitest.config.mts`
- Modify: `apps/api/src/app/app.module.ts`
- Modify: `apps/api/src/main.ts`
- Modify: `apps/api/src/app/health/health.integration.spec.ts`
- Modify: `apps/api/vitest.config.mts`

**Interfaces:**

- Consumes: `DatabaseService`, `Environment`, and identity contracts.
- Produces: `POST /api/v1/identity/session`, `GET /api/v1/identity/session`, and `DELETE /api/v1/identity/session`.
- Produces: `IdentityAccountRepository.findByNormalisedEmail(email)` and `findSessionContext({ userId, membershipId, communityId })`.

- [x] **Step 1: Write failing IdentitySessionService tests**

Use repository, password, and token boundary doubles. Cover successful sign-in, unknown email, missing password hash, incorrect password, inactive membership, invalid token, and tenant-mismatched token claims. Assert the same `InvalidCredentialsError` for all credential failures and `InvalidSessionError` for all session failures.

- [x] **Step 2: Run the service test and confirm failure**

Run:

```bash
pnpm exec nx run identity-api:test --testFile=identity-session.service.spec.ts
```

- [x] **Step 3: Implement application boundaries and service**

Normalise email with `trim().toLowerCase()`. Verify Argon2id hashes only through `PasswordHasher`. Sign only `{ sub, membershipId, communityId }`. Re-resolve active database context for every session read so role revocation, community deactivation, and officer handover take effect without waiting for token expiry.

- [x] **Step 4: Implement tenant-scoped Prisma queries**

The session-context query must include all three identifiers in its predicate:

```ts
where: {
  id: membershipId,
  userId,
  communityId,
  status: 1,
  user: { status: 1 },
  community: { status: 1 },
}
```

Select only fields needed to create the public contract. Filter active assignments with `revokedDateTime: null` and active roles, positions, and permissions with `status: 1`.

- [x] **Step 5: Write failing Supertest integration tests**

Override the repository, password hasher, and token service in a Nest test module. Cover valid sign-in cookie attributes, invalid credential response, current-session response, invalid-cookie response, sign-out cookie clearing, DTO whitelist rejection, and absence of password/token data in JSON.

- [x] **Step 6: Implement controller, DTO, cookie policy, and module wiring**

Use `@ApiTags`, explicit response models, `@HttpCode`, and a single safe `UnauthorizedException('Email or password is incorrect.')` for credential failures. Session failures return `UnauthorizedException('Your session is no longer valid.')`. Enable `cookie-parser`, CORS credentials, whitelist validation, and `forbidNonWhitelisted: true` in the API bootstrap.

- [x] **Step 7: Run identity and API tests and commit**

Run:

```bash
pnpm exec nx run identity-api:test
pnpm exec nx run api:test
```

Commit:

```bash
git commit -m "feat(identity): add administrative session API"
```

### Task 4: Shared Design Tokens and UI Primitives

**Files:**

- Modify: `apps/web/src/styles.css`
- Create through shadcn CLI: `libs/shared/ui/src/components/ui/button.tsx`
- Create through shadcn CLI: `libs/shared/ui/src/components/ui/input.tsx`
- Create through shadcn CLI: `libs/shared/ui/src/components/ui/field.tsx`
- Create through shadcn CLI: `libs/shared/ui/src/components/ui/alert.tsx`
- Create through shadcn CLI: `libs/shared/ui/src/components/ui/skeleton.tsx`
- Create through shadcn CLI: `libs/shared/ui/src/components/ui/separator.tsx`
- Create through shadcn CLI: `libs/shared/ui/src/components/ui/dropdown-menu.tsx`
- Create through shadcn CLI: `libs/shared/ui/src/components/ui/tooltip.tsx`
- Create through shadcn CLI: `libs/shared/ui/src/components/ui/sheet.tsx`
- Create through shadcn CLI: `libs/shared/ui/src/lib/utils.ts`
- Modify: `libs/shared/ui/src/index.ts`

**Interfaces:**

- Produces: semantic Tailwind tokens matching the approved design specification.
- Produces: public `@smart-citizen/shared-ui` exports for the installed primitives.

- [x] **Step 1: Inspect the configured shadcn project and component documentation**

Run:

```bash
pnpm dlx shadcn@latest info --json
pnpm dlx shadcn@latest docs button input field alert skeleton separator dropdown-menu tooltip sheet
```

- [x] **Step 2: Add the required Base/Nova primitives through the CLI**

Run:

```bash
pnpm dlx shadcn@latest add button input field alert skeleton separator dropdown-menu tooltip sheet
```

Read every generated file, correct aliases if necessary, and expose components only from the shared UI public entry point.

- [x] **Step 3: Implement semantic tokens and stable control dimensions**

Define light tokens from the approved design spec and compatible dark values under `.dark`. Set Geist, `min-width: 320px`, 40 px controls, visible focus rings, and reduced-motion behaviour. Do not create a theme toggle.

- [x] **Step 4: Run lint, typecheck, and commit**

Run:

```bash
pnpm exec nx run shared-ui:lint
pnpm exec nx run shared-ui:typecheck
pnpm exec nx run web:typecheck
```

Commit:

```bash
git commit -m "feat(ui): add quiet utility design foundations"
```

### Task 5: Identity Web Client and Sign In

**Files:**

- Create: `libs/identity/web/src/lib/identity-client.ts`
- Create: `libs/identity/web/src/lib/identity-provider.tsx`
- Create: `libs/identity/web/src/lib/session-query.ts`
- Create: `libs/identity/web/src/lib/protected-route.tsx`
- Create: `libs/identity/web/src/lib/sign-in-page.tsx`
- Create: `libs/identity/web/src/lib/sign-in-page.spec.tsx`
- Create: `libs/identity/web/src/lib/protected-route.spec.tsx`
- Modify: `libs/identity/web/src/index.ts`
- Modify: `libs/identity/web/project.json`
- Create: `libs/identity/web/tsconfig.spec.json`
- Create: `libs/identity/web/vitest.config.mts`
- Modify: `apps/web/src/test-setup.ts`

**Interfaces:**

- Consumes: injected `HttpClient`, identity contracts, React Router, TanStack Query, React Hook Form, Zod, and shared UI.
- Produces: `createIdentityClient`, `IdentityProvider`, `useSessionQuery`, `useSignInMutation`, `useSignOutMutation`, `ProtectedRoute`, and `SignInPage`.

- [x] **Step 1: Write failing client and Sign In behaviour tests**

Cover request paths, AbortSignal forwarding, credential-cookie usage, labelled fields, client validation, disabled submission, generic server failure, successful cache population, and redirect to the originally requested route. Use synthetic `example.test` addresses and non-secret test passwords.

- [x] **Step 2: Run focused tests and confirm failure**

Run:

```bash
pnpm exec nx run identity-web:test
```

- [x] **Step 3: Implement the injected identity client and query definitions**

Use query key `['identity', 'session']`, `retry: false` for unauthorised session reads, and the request signal passed by TanStack Query. Sign-out clears only the identity session cache.

- [x] **Step 4: Implement the accessible Sign In page**

Visible copy is limited to `Smart Citizen`, `Administrative workspace`, `Email address`, `Password`, `Sign in`, and necessary validation or error feedback. Use `FieldGroup` and `Field`, autofocus email, `autocomplete="username"` and `autocomplete="current-password"`, and preserve the requested route in navigation state.

- [x] **Step 5: Implement ProtectedRoute states**

Loading uses stable skeleton dimensions. A `401` redirects to `/sign-in` with the attempted location. Other failures render a retry action. Authenticated sessions render the outlet context without duplicating session state.

- [x] **Step 6: Run identity web tests and commit**

Run:

```bash
pnpm exec nx run identity-web:test
```

Commit:

```bash
git commit -m "feat(identity): add administrative sign-in experience"
```

### Task 6: Role-adaptive Shell and Initial Weekly Overview

**Files:**

- Create: `libs/platform/web/src/lib/navigation.ts`
- Create: `libs/platform/web/src/lib/navigation.spec.ts`
- Create: `libs/platform/web/src/lib/application-shell.tsx`
- Create: `libs/platform/web/src/lib/application-shell.spec.tsx`
- Create: `libs/platform/web/src/lib/weekly-overview-page.tsx`
- Create: `libs/platform/web/src/lib/administrative-viewport-gate.tsx`
- Modify: `libs/platform/web/src/index.ts`
- Modify: `libs/platform/web/project.json`
- Create: `libs/platform/web/tsconfig.spec.json`
- Create: `libs/platform/web/vitest.config.mts`

**Interfaces:**

- Consumes: `SessionContext`, `useSignOutMutation`, React Router, shared UI, and Lucide icons.
- Produces: `getPermittedNavigation(session)`, `ApplicationShell`, `AdministrativeViewportGate`, and `WeeklyOverviewPage`.

- [ ] **Step 1: Write failing navigation and shell tests**

Cover permission-filtered navigation, no position-name inference, current-route indication, community identity, account menu, sign-out, keyboard-accessible mobile/tablet navigation, and absence of unauthorised links.

- [ ] **Step 2: Run platform web tests and confirm failure**

Run:

```bash
pnpm exec nx run platform-web:test
```

- [ ] **Step 3: Implement explicit navigation policy**

Each navigation entry declares an exact required permission code or `null` for Overview. `getPermittedNavigation` filters by the session permission set. Position codes and labels are display-only.

- [ ] **Step 4: Implement the shell and viewport privacy gate**

Use a 248 px desktop sidebar, a compact tablet navigation control, a stable utility header, semantic landmarks, and visible focus. At widths below 768 px, hide administrative content with CSS and show `Continue on a tablet or larger screen`; no private text remains visible.

- [ ] **Step 5: Implement an honest Weekly Overview**

Show the community name, an Indonesian-formatted current week range, the signed-in officer's position/role labels, and an empty-state statement that operational summaries appear as each domain is connected. Do not render fake counts, charts, reports, residents, or approval tasks.

- [ ] **Step 6: Run platform web tests and commit**

Run:

```bash
pnpm exec nx run platform-web:test
```

Commit:

```bash
git commit -m "feat(platform): add role-adaptive pilot workspace"
```

### Task 7: Application Composition and Browser Workflow

**Files:**

- Modify: `apps/web/src/app/http-client.ts`
- Modify: `apps/web/src/app/http-client.spec.ts`
- Modify: `apps/web/src/app/app.tsx`
- Modify: `apps/web/src/app/app.spec.tsx`
- Modify: `apps/web/src/main.tsx`
- Modify: `apps/web-e2e/src/example.spec.ts`
- Modify: `apps/web-e2e/playwright.config.mts`

**Interfaces:**

- Consumes: shared API client, `IdentityProvider`, identity routes, protected shell, and platform overview.
- Produces: route composition with `/sign-in`, protected `/`, and a safe not-found state.

- [ ] **Step 1: Write failing application composition tests**

Cover unauthenticated redirect, Sign In rendering, authenticated overview rendering, preservation of the requested route, and no legacy placeholder copy.

- [ ] **Step 2: Run the web test and confirm failure**

Run:

```bash
pnpm exec nx run web:test
```

- [ ] **Step 3: Compose providers and lazy routes**

Configure the shared Axios client with `withCredentials: true`. Keep `App` as route composition only. Lazy-load identity and platform route modules without importing API or database code.

- [ ] **Step 4: Replace the placeholder Playwright workflow**

Intercept only API boundaries in the browser test. Verify Sign In at 375 px, administrative privacy gate at 375 px, authenticated shell at 768 px and desktop, no horizontal overflow, keyboard navigation, sign-out, and zero console errors.

- [ ] **Step 5: Run focused web and browser tests and commit**

Run:

```bash
pnpm exec nx run web:test
pnpm exec nx run web-e2e:e2e --project=desktop-chromium
pnpm exec nx run web-e2e:e2e --project=mobile-chromium
```

Commit:

```bash
git commit -m "feat(web): compose the authenticated pilot foundation"
```

### Task 8: Full Verification and Delivery Tracking

**Files:**

- Modify if behaviour changed: `docs/superpowers/specs/2026-07-20-frontend-pilot-design.md`
- External update after verification: Smart Citizen Notion page checklist.

**Interfaces:**

- Produces: verified Slice 1 branch and accurate delivery status.

- [ ] **Step 1: Run full repository verification**

Run:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm e2e
pnpm exec prisma validate
pnpm db:test
git diff --check
git status --short
```

- [ ] **Step 2: Run browser visual and accessibility review**

Use Playwright because no Browser plugin is available. Capture 1440 by 1000, 768 by 1024, and 375 by 812 screenshots. Inspect them with `view_image` for typography, Emerald + Graphite colour fidelity, spacing, stable controls, navigation, privacy gating, overflow, focus visibility, and unsupported decorative card usage.

- [ ] **Step 3: Review exposure boundaries**

Confirm cookies are HTTP-only, unauthorised responses are generic, session DTOs contain no credential fields, tenant session queries include `communityId`, unauthorised navigation is absent, and private administrative content is absent below 768 px.

- [ ] **Step 4: Commit final verification corrections**

Commit only if verification required source changes:

```bash
git commit -m "fix(web): address pilot foundation verification"
```

- [ ] **Step 5: Update delivery tracking**

Check `Page 01: Sign In` in Notion only if the complete page gate passes. Leave `Page 02: Weekly Overview` unchecked until finance and residency summaries are connected to their real domain APIs. Record the branch, verification commands, and remaining Slice 1 limitation in the final handoff.
