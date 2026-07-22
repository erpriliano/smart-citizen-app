# Weekly Overview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the read-only Weekly Overview with real tenant-scoped residency and finance summaries, add the residency-change submission persistence foundation, and harden cookie-based sign out.

**Architecture:** Residency and Finance own separate contracts, API queries, repositories, frontend clients, and TanStack Query hooks. `apps/web` starts both domain queries in parallel and passes permission-aware states to a presentational page in `platform/web`; Identity supplies reusable authenticated session, community, and permission guards. Sign out retains the stateless JWT cookie design while removing all private browser query data.

**Tech Stack:** Node.js 22, TypeScript 5.9, Nx 23, pnpm 8.15.9, React 19, React Router 6, TanStack Query 5, Axios, Zod 4, NestJS 11, Prisma 7, PostgreSQL, Vitest, React Testing Library, Supertest, and Playwright.

## Global Constraints

- Every tenant-owned query receives and filters by `communityId` at the repository boundary.
- Lifecycle status is `1 = ACTIVE`, `2 = INACTIVE`, and `3 = DELETED`.
- The overview is read-only and returns no resident names, contacts, proposed values, finance entries, evidence, approval notes, audit events, or actor identities.
- Position names never grant permission; only explicit permission codes do.
- Financial arithmetic uses integer minor units and never JavaScript floating-point values.
- Administrative UI supports 768 px and wider; private workspace content is absent below 768 px.
- Interface copy uses English (UK); dates, times, and currency use Indonesian formatting.
- No production seed data, mock fallback, global Axios tenant interceptor, Axios retry, or server-side session registry is introduced.
- Write a failing test and confirm its expected failure before each production behaviour.
- Keep generated Prisma client files, `.env`, database contents, screenshots, coverage, and build output out of Git.

---

### Task 1: Domain Overview Contracts

**Files:**

- Create: `libs/residency/contracts/src/lib/residency-overview.ts`
- Create: `libs/residency/contracts/src/lib/residency-overview.spec.ts`
- Modify: `libs/residency/contracts/src/index.ts`
- Create: `libs/residency/contracts/tsconfig.spec.json`
- Create: `libs/residency/contracts/vitest.config.mts`
- Create: `libs/finance/contracts/src/lib/finance-overview.ts`
- Create: `libs/finance/contracts/src/lib/finance-overview.spec.ts`
- Modify: `libs/finance/contracts/src/index.ts`
- Create: `libs/finance/contracts/tsconfig.spec.json`
- Create: `libs/finance/contracts/vitest.config.mts`

**Interfaces:**

- Produces: `residencyOverviewSchema`, `ResidencyOverview`, `financeOverviewSchema`, and `FinanceOverview`.
- Consumes: Zod only; contracts remain framework-neutral.

- [ ] **Step 1: Configure focused contract tests and write failing schema assertions**

Use the existing Identity contract Vitest configuration pattern. Assert exact strict payloads:

```ts
expect(
  residencyOverviewSchema.parse({
    records: { activeHouseCount: 24, occupiedHouseCount: 21, currentResidentCount: 73 },
    changes: {
      pendingCount: 2,
      recent: [
        {
          id: '3ff0d0eb-cf52-447a-bf88-b33dabcf9916',
          changeType: 'MOVE_IN',
          workflowStage: 'SUBMITTED',
          submittedDateTime: '2026-07-21T08:00:00.000Z',
          updatedDateTime: '2026-07-21T08:00:00.000Z',
        },
      ],
    },
  }),
).toBeDefined();

expect(
  financeOverviewSchema.parse({
    latestReport: {
      id: '6e63d35b-c2fa-4225-966c-a71af399eec0',
      periodStart: '2026-07-01',
      periodEnd: '2026-07-31',
      revisionNumber: 1,
      workflowStage: 'UNDER_REVIEW',
      currency: 'IDR',
      openingBalanceMinor: '12500000',
      incomeTotalMinor: '3000000',
      expenseTotalMinor: '1750000',
      closingBalanceMinor: '13750000',
    },
    approvalRequiredCount: 1,
  }),
).toBeDefined();
```

Also reject negative counts, more than five recent items, invalid UUID/date/instant values, unknown stages, non-ISO currency codes, numeric minor units, and unknown keys.

- [ ] **Step 2: Confirm RED for both contract projects**

Run:

```bash
pnpm exec nx run residency-contracts:test --skip-nx-cache
pnpm exec nx run finance-contracts:test --skip-nx-cache
```

Expected: FAIL because the overview schemas and test targets do not exist.

- [ ] **Step 3: Implement strict Zod contracts**

Use these public shapes:

```ts
export type ResidencyOverview = {
  records: {
    activeHouseCount: number;
    occupiedHouseCount: number;
    currentResidentCount: number;
  } | null;
  changes: {
    pendingCount: number;
    recent: Array<{
      id: string;
      changeType: 'MOVE_IN' | 'MOVE_OUT' | 'CORRECTION';
      workflowStage: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'APPLIED';
      submittedDateTime: string;
      updatedDateTime: string;
    }>;
  } | null;
};

export type FinanceOverview = {
  latestReport: {
    id: string;
    periodStart: string;
    periodEnd: string;
    revisionNumber: number;
    workflowStage: 'DRAFT' | 'UNDER_REVIEW' | 'APPROVED';
    currency: string;
    openingBalanceMinor: string;
    incomeTotalMinor: string;
    expenseTotalMinor: string;
    closingBalanceMinor: string;
  } | null;
  approvalRequiredCount: number | null;
};
```

Build them from `.strict()` objects, `z.uuid()`, `z.iso.date()`, `z.iso.datetime({ offset: true })`, non-negative integer counts, and `/^-?\d+$/` minor-unit strings.

- [ ] **Step 4: Confirm GREEN and commit contracts**

Run the two focused tests, `pnpm exec nx run-many -t typecheck -p residency-contracts finance-contracts`, and `git diff --check`.

Commit:

```bash
git commit -m "feat(overview): define residency and finance summaries"
```

### Task 2: Reusable Administrative API Boundary

**Files:**

- Create: `libs/identity/api/src/lib/administrative-session.guard.ts`
- Create: `libs/identity/api/src/lib/administrative-session.guard.spec.ts`
- Create: `libs/identity/api/src/lib/current-session.decorator.ts`
- Create: `libs/identity/api/src/lib/community-scope.guard.ts`
- Create: `libs/identity/api/src/lib/required-permissions.decorator.ts`
- Create: `libs/identity/api/src/lib/permission.guard.ts`
- Modify: `libs/identity/api/src/lib/identity-api.module.ts`
- Modify: `libs/identity/api/src/index.ts`

**Interfaces:**

- Produces: `AdministrativeSessionGuard`, `CommunityScopeGuard`, `PermissionGuard`, `CurrentSession`, `RequireAllPermissions`, and `AdministrativeRequest`.
- Consumes: `IdentitySessionService`, `SessionContext`, NestJS `Reflector`, and the existing `smart_citizen_session` cookie.

- [ ] **Step 1: Write failing guard tests**

Cover these outcomes using Nest execution-context stubs:

```ts
await expect(sessionGuard.canActivate(contextWithoutCookie)).rejects.toThrow(UnauthorizedException);
await expect(sessionGuard.canActivate(contextWithInvalidCookie)).rejects.toThrow(
  UnauthorizedException,
);
await expect(sessionGuard.canActivate(contextWithValidCookie)).resolves.toBe(true);
expect(request.administrativeSession).toEqual(session);

expect(scopeGuard.canActivate(contextFor(session.community.id))).toBe(true);
expect(() => scopeGuard.canActivate(contextFor(otherCommunityId))).toThrow(ForbiddenException);

expect(permissionGuard.canActivate(contextRequiring('finance.report.read'))).toBe(true);
expect(() => permissionGuard.canActivate(contextRequiring('finance.report.approve'))).toThrow(
  ForbiddenException,
);
```

Assert that invalid-session details and community identifiers are absent from public exception messages.

- [ ] **Step 2: Confirm RED**

Run `pnpm exec nx run identity-api:test --skip-nx-cache`.

Expected: FAIL because the guards and decorators do not exist.

- [ ] **Step 3: Implement the guards and decorators**

`AdministrativeSessionGuard` must read the cookie, call `IdentitySessionService.readSession`, attach the session once, and map every absent/invalid token to `UnauthorizedException('Your session is no longer valid.')`.

```ts
export interface AdministrativeRequest extends Request {
  administrativeSession?: SessionContext;
}

export const CurrentSession = createParamDecorator(
  (_data: unknown, context: ExecutionContext): SessionContext => {
    const request = context.switchToHttp().getRequest<AdministrativeRequest>();
    if (!request.administrativeSession) throw new UnauthorizedException();
    return request.administrativeSession;
  },
);
```

`CommunityScopeGuard` compares `request.params.communityId` with `session.community.id`. `RequireAllPermissions(...codes)` stores metadata, and `PermissionGuard` verifies every required code against `session.permissions`. Both denial paths return the same generic `ForbiddenException('You do not have access to this resource.')`.

Register and export all three guards from `IdentityApiModule` so domain modules can use them without constructing Identity internals.

- [ ] **Step 4: Confirm GREEN and commit**

Run `pnpm exec nx run identity-api:test --skip-nx-cache`, its typecheck target, and `git diff --check`.

Commit:

```bash
git commit -m "feat(identity): add administrative API guards"
```

### Task 3: Residency-Change Schema and Overview Repository

**Files:**

- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_add_residency_change_submissions/migration.sql`
- Create: `libs/residency/api/src/lib/residency-overview.repository.ts`
- Create: `libs/residency/api/src/lib/prisma-residency-overview.repository.ts`
- Create: `libs/residency/api/src/lib/prisma-residency-overview.repository.integration.spec.ts`
- Modify: `libs/residency/api/src/index.ts`
- Create: `libs/residency/api/tsconfig.spec.json`
- Create: `libs/residency/api/vitest.config.mts`

**Interfaces:**

- Produces: `ResidencyOverviewRepository.getRecords(communityId, localDate)` and `getChanges(communityId)`.
- Consumes: the generated Prisma client and the Task 1 residency contract.

- [ ] **Step 1: Write the failing PostgreSQL repository test**

Create two communities with active/inactive houses and residents, current/ended/future residencies, and submissions in each stage. Assert:

```ts
await expect(repository.getRecords(communityAId, new Date('2026-07-22'))).resolves.toEqual({
  activeHouseCount: 3,
  occupiedHouseCount: 2,
  currentResidentCount: 3,
});

await expect(repository.getChanges(communityAId)).resolves.toMatchObject({
  pendingCount: 2,
  recent: expect.arrayContaining([
    expect.objectContaining({ changeType: 'MOVE_IN', workflowStage: 'SUBMITTED' }),
  ]),
});

await expect(repository.getChanges(communityBId)).resolves.toEqual({
  pendingCount: 0,
  recent: [],
});
```

Cleanup in reverse foreign-key order and never use production-like names or contacts.

- [ ] **Step 2: Confirm RED**

Run `pnpm exec nx run residency-api:test --skip-nx-cache`.

Expected: FAIL because Prisma has no residency-change model and the repository does not exist.

- [ ] **Step 3: Add the append-only Prisma migration**

Add the approved enums and `ResidencyChangeSubmission` fields from the design. Add reverse relations to Community, Resident, Residency, House, and CommunityMembership. Use compound tenant foreign keys and these indexes:

```prisma
@@unique([communityId, id])
@@index([communityId, workflowStage, status, updatedDateTime(sort: Desc)])
@@index([communityId, residentId, status])
@@index([communityId, houseId, status])
```

Run:

```bash
pnpm exec prisma migrate dev --name add_residency_change_submissions
pnpm db:generate
pnpm exec prisma validate
```

Review the generated SQL for enum creation, tenant compound foreign keys, lifecycle default, audit columns, and community-leading indexes before continuing.

- [ ] **Step 4: Implement tenant-scoped repository queries**

Use `ACTIVE_STATUS = 1`. `getRecords` must count active houses and query distinct active residency `houseId` and `residentId` values with:

```ts
where: {
  communityId,
  status: ACTIVE_STATUS,
  startDate: { lte: localDate },
  OR: [{ endDate: null }, { endDate: { gte: localDate } }],
  house: { status: ACTIVE_STATUS },
  resident: { status: ACTIVE_STATUS },
}
```

`getChanges` counts `SUBMITTED` active records and selects at most five active records ordered by `updatedDateTime desc, id asc`, mapping dates to ISO strings and selecting no sensitive columns.

- [ ] **Step 5: Confirm GREEN and commit**

Run the focused test, `pnpm exec nx run residency-api:typecheck`, `pnpm exec prisma validate`, `pnpm db:migrate:check`, and `git diff --check`.

Commit:

```bash
git commit -m "feat(residency): add change submission overview data"
```

### Task 4: Residency Overview Application and HTTP Boundary

**Files:**

- Create: `libs/residency/api/src/lib/residency-overview.service.ts`
- Create: `libs/residency/api/src/lib/residency-overview.service.spec.ts`
- Create: `libs/residency/api/src/lib/residency-overview.dto.ts`
- Create: `apps/api/src/app/residency/residency-overview.controller.ts`
- Create: `apps/api/src/app/residency/residency-overview.integration.spec.ts`
- Modify: `libs/residency/api/src/lib/residency-api.module.ts`
- Modify: `libs/residency/api/src/index.ts`
- Modify: `apps/api/src/app/app.module.ts`

**Interfaces:**

- Produces: protected `GET /api/v1/communities/:communityId/residency/overview`.
- Consumes: Task 2 guards and Task 3 repository.

- [ ] **Step 1: Write failing service and Supertest tests**

Service assertions:

```ts
await expect(service.getOverview(sessionWithBothPermissions, communityId)).resolves.toEqual({
  records: recordSummary,
  changes: changeSummary,
});
await expect(service.getOverview(sessionWithRecordPermission, communityId)).resolves.toEqual({
  records: recordSummary,
  changes: null,
});
await expect(service.getOverview(sessionWithoutResidencyPermissions, communityId)).rejects.toThrow(
  ForbiddenException,
);
expect(repository.getChanges).not.toHaveBeenCalled();
```

Supertest must prove valid-cookie success, no-cookie `401`, another community `403`, no permission `403`, and that returned JSON contains none of `fullName`, `contactPhone`, `reason`, `privateReviewNote`, or membership actor fields.

- [ ] **Step 2: Confirm RED**

Run `pnpm exec nx run residency-api:test --skip-nx-cache`.

Expected: FAIL because the service/controller do not exist.

- [ ] **Step 3: Implement service, DTO, controller, and module wiring**

The service derives the community-local civil date with `Intl.DateTimeFormat(..., { timeZone })`, queries only permitted facets, and throws the generic forbidden response when neither permission exists. The application-level controller uses:

```ts
@UseGuards(AdministrativeSessionGuard, CommunityScopeGuard)
@Get('communities/:communityId/residency/overview')
getOverview(
  @Param('communityId', new ParseUUIDPipe()) communityId: string,
  @CurrentSession() session: SessionContext,
): Promise<ResidencyOverviewDto> {
  return this.overview.getOverview(session, communityId);
}
```

Document `200`, `401`, and `403` in OpenAPI. Wire `ResidencyApiModule` into `AppModule`.

- [ ] **Step 4: Confirm GREEN and commit**

Run focused tests, residency API typecheck/build, `pnpm exec nx sync:check`, and `git diff --check`.

Commit:

```bash
git commit -m "feat(residency): expose tenant overview summary"
```

### Task 5: Finance Overview Repository and HTTP Boundary

**Files:**

- Create: `libs/finance/api/src/lib/finance-overview.repository.ts`
- Create: `libs/finance/api/src/lib/prisma-finance-overview.repository.ts`
- Create: `libs/finance/api/src/lib/prisma-finance-overview.repository.integration.spec.ts`
- Create: `libs/finance/api/src/lib/finance-overview.service.ts`
- Create: `libs/finance/api/src/lib/finance-overview.service.spec.ts`
- Create: `libs/finance/api/src/lib/finance-overview.dto.ts`
- Create: `apps/api/src/app/finance/finance-overview.controller.ts`
- Create: `apps/api/src/app/finance/finance-overview.integration.spec.ts`
- Modify: `libs/finance/api/src/lib/finance-api.module.ts`
- Modify: `libs/finance/api/src/index.ts`
- Create: `libs/finance/api/tsconfig.spec.json`
- Create: `libs/finance/api/vitest.config.mts`
- Modify: `apps/api/src/app/app.module.ts`

**Interfaces:**

- Produces: protected `GET /api/v1/communities/:communityId/finance/overview`.
- Consumes: Task 1 finance contract and Task 2 guards.

- [ ] **Step 1: Write failing repository, service, and HTTP tests**

Use two communities and reports with active/inactive entries. Prove exact arithmetic:

```ts
await expect(repository.getLatestReport(communityAId)).resolves.toEqual({
  id: reportId,
  periodStart: '2026-07-01',
  periodEnd: '2026-07-31',
  revisionNumber: 2,
  workflowStage: 'UNDER_REVIEW',
  currency: 'IDR',
  openingBalanceMinor: '9007199254740993',
  incomeTotalMinor: '3000000',
  expenseTotalMinor: '1250000',
  closingBalanceMinor: '9007199256490993',
});
await expect(repository.countApprovalRequired(communityAId)).resolves.toBe(1);
await expect(repository.getLatestReport(communityBId)).resolves.toBeNull();
```

Service tests require `finance.report.read`, return `approvalRequiredCount: null` without `finance.report.approve`, and never infer approval from the `Pak RT` position. Supertest covers `200`, `401`, cross-community `403`, read-permission `403`, and response privacy.

- [ ] **Step 2: Confirm RED**

Run `pnpm exec nx run finance-api:test --skip-nx-cache`.

Expected: FAIL because the finance overview boundary does not exist.

- [ ] **Step 3: Implement exact tenant-scoped finance queries**

Select the active report ordered by `periodEnd desc`, `periodStart desc`, `revisionNumber desc`, and `createdDateTime desc`. Select only active entry `entryType` and `amountMinor`. Calculate with `bigint`:

```ts
const income = entries
  .filter((entry) => entry.entryType === 'INCOME')
  .reduce((total, entry) => total + entry.amountMinor, 0n);
const expense = entries
  .filter((entry) => entry.entryType === 'EXPENSE')
  .reduce((total, entry) => total + entry.amountMinor, 0n);
const closing = report.openingBalanceMinor + income - expense;
```

Convert every amount to a decimal string before returning it. Count active `UNDER_REVIEW` reports with the same `communityId` predicate.

- [ ] **Step 4: Implement service, DTO, controller, and module wiring**

Use `AdministrativeSessionGuard`, `CommunityScopeGuard`, `RequireAllPermissions('finance.report.read')`, and `PermissionGuard` in the application-level controller. The service checks `finance.report.approve` only to decide whether to call `countApprovalRequired`; otherwise it returns `null`. Document stable OpenAPI responses and wire `FinanceApiModule` into `AppModule`.

- [ ] **Step 5: Confirm GREEN and commit**

Run focused tests, finance API typecheck/build, `pnpm exec nx sync:check`, and `git diff --check`.

Commit:

```bash
git commit -m "feat(finance): expose exact overview summary"
```

### Task 6: Domain Web Clients and Parallel Query Definitions

**Files:**

- Create: `libs/residency/web/src/lib/residency-overview-client.ts`
- Create: `libs/residency/web/src/lib/residency-overview-client.spec.ts`
- Create: `libs/residency/web/src/lib/residency-overview-query.ts`
- Modify: `libs/residency/web/src/index.ts`
- Create: `libs/residency/web/src/test-setup.ts`
- Create: `libs/residency/web/tsconfig.spec.json`
- Create: `libs/residency/web/vitest.config.mts`
- Create: `libs/finance/web/src/lib/finance-overview-client.ts`
- Create: `libs/finance/web/src/lib/finance-overview-client.spec.ts`
- Create: `libs/finance/web/src/lib/finance-overview-query.ts`
- Modify: `libs/finance/web/src/index.ts`
- Create: `libs/finance/web/src/test-setup.ts`
- Create: `libs/finance/web/tsconfig.spec.json`
- Create: `libs/finance/web/vitest.config.mts`

**Interfaces:**

- Produces: `createResidencyOverviewClient`, `residencyOverviewQueryKey`, `useResidencyOverviewQuery`, `createFinanceOverviewClient`, `financeOverviewQueryKey`, and `useFinanceOverviewQuery`.
- Consumes: shared `HttpClient`, Task 1 schemas, explicit `communityId`, and TanStack Query `AbortSignal`.

- [ ] **Step 1: Write failing client and query-key tests**

Assert exact calls:

```ts
expect(httpClient.get).toHaveBeenCalledWith(`/communities/${communityId}/residency/overview`, {
  signal,
});
expect(residencyOverviewQueryKey(communityId)).toEqual(['residency', communityId, 'overview']);

expect(httpClient.get).toHaveBeenCalledWith(`/communities/${communityId}/finance/overview`, {
  signal,
});
expect(financeOverviewQueryKey(communityId)).toEqual(['finance', communityId, 'overview']);
```

Also prove malformed responses reject with `ZodError`, omitted signals do not add `signal: undefined`, and hooks use `enabled` without changing their explicit query keys.

- [ ] **Step 2: Confirm RED**

Run both web project tests with `--skip-nx-cache`.

Expected: FAIL because clients and hooks do not exist.

- [ ] **Step 3: Implement clients and hooks**

Clients call their owning endpoint, parse `response.data`, and expose no Axios type to components. Hooks use:

```ts
useQuery({
  queryKey: residencyOverviewQueryKey(communityId),
  queryFn: ({ signal }) => client.getOverview(communityId, signal),
  enabled,
  retry: false,
});
```

Use the equivalent finance key/client. Do not fetch from `useEffect` and do not derive community context from an interceptor.

- [ ] **Step 4: Confirm GREEN and commit**

Run both focused test/typecheck targets, `pnpm exec nx sync:check`, and `git diff --check`.

Commit:

```bash
git commit -m "feat(overview): add domain summary queries"
```

### Task 7: Role-Adaptive Weekly Overview and App Composition

**Files:**

- Modify: `libs/platform/web/src/lib/weekly-overview-page.tsx`
- Modify: `libs/platform/web/src/lib/weekly-overview-page.spec.tsx`
- Create: `apps/web/src/app/weekly-overview-route.tsx`
- Create: `apps/web/src/app/weekly-overview-route.spec.tsx`
- Modify: `apps/web/src/app/app.tsx`
- Modify: `apps/web/src/app/app.spec.tsx`
- Modify: relevant Nx-generated TypeScript project references after `pnpm exec nx sync`

**Interfaces:**

- Produces: completed `WeeklyOverviewPage` presentation and application-level `WeeklyOverviewRoute` composition.
- Consumes: Task 6 hooks, `SessionContext`, domain overview contracts, and shared UI primitives.

- [ ] **Step 1: Write failing presentational behaviour tests**

Cover:

- independent residency/finance skeletons;
- omitted unauthorized sections;
- record metrics and recent change type/stage labels;
- no resident names or contacts;
- empty records/submissions/report states;
- one failed section with accessible `Retry residency overview` or `Retry finance overview` action while the other remains visible;
- Indonesian week, period, and `IDR` amount formatting;
- approval count only when non-null;
- refresh action pending name/state.

Use role/label/text queries. A populated assertion includes:

```ts
expect(screen.getByText('24')).toBeVisible();
expect(screen.getByText('21 occupied')).toBeVisible();
expect(screen.getByText('73 current residents')).toBeVisible();
expect(screen.getByText('Move-in')).toBeVisible();
expect(screen.getByText('Under review')).toBeVisible();
expect(screen.getByText('Rp13.750.000')).toBeVisible();
expect(screen.queryByText(/contact phone/i)).not.toBeInTheDocument();
```

- [ ] **Step 2: Confirm platform-web RED**

Run `pnpm exec nx run platform-web:test --skip-nx-cache`.

Expected: FAIL because the current page accepts only `now` and renders the placeholder summary.

- [ ] **Step 3: Implement the presentational page**

Define a focused state union:

```ts
export type OverviewSectionState<T> =
  | { status: 'loading' }
  | { status: 'error'; retry: () => void }
  | { status: 'ready'; data: T };
```

`WeeklyOverviewPage` receives `session`, nullable residency/finance states, `onRefresh`, `isRefreshing`, and optional `now`. Use compact metric summaries, bordered full-width sections, Lucide icons, semantic headings/description lists, stable skeleton dimensions, and shared Button/Alert components. Use `Intl.DateTimeFormat('id-ID')` and `Intl.NumberFormat('id-ID', { style: 'currency', currency })` with `BigInt(minorString)` converted from minor units without floating point.

- [ ] **Step 4: Write failing app-composition tests**

Inject synthetic domain clients through `AppProps`. Assert both clients are called without waiting for each other, each receives `session.community.id`, permission-disabled clients are not called, refresh refetches both enabled sections, and partial failure leaves the successful section visible.

- [ ] **Step 5: Confirm web RED**

Run `pnpm exec nx run web:test --skip-nx-cache`.

Expected: FAIL because the route still lazy-loads the placeholder page directly.

- [ ] **Step 6: Implement `WeeklyOverviewRoute` and app wiring**

The route reads outlet session context, evaluates `residency.record.read`, `residency.change.read`, and `finance.report.read`, invokes both domain hooks unconditionally with their `enabled` flags, maps query results to the presentational union, and invalidates only the two current-community overview keys on refresh.

Replace the current lazy page route with a lazy local route component. Production clients are created once from `apiClient`; tests may inject clients through `AppProps`. Do not enable unfinished navigation links.

- [ ] **Step 7: Confirm GREEN and commit**

Run platform-web and web tests/typechecks, `pnpm exec nx sync`, `pnpm exec nx sync:check`, and `git diff --check`.

Commit:

```bash
git commit -m "feat(overview): connect weekly community review"
```

### Task 8: Sign-Out Cache Privacy and Failure State

**Files:**

- Modify: `libs/identity/web/src/lib/session-query.ts`
- Create or modify: `libs/identity/web/src/lib/session-query.spec.tsx`
- Modify: `libs/identity/web/src/lib/sign-in-page.tsx`
- Modify: `libs/identity/web/src/lib/sign-in-page.spec.tsx`
- Modify: `libs/platform/web/src/lib/application-shell.tsx`
- Modify: `libs/platform/web/src/lib/application-shell.spec.tsx`
- Modify: `apps/web/src/app/app.spec.tsx`

**Interfaces:**

- Produces: complete private-query removal and generic sign-out-failure navigation state.
- Consumes: existing `IdentityClient.signOut()` and `DELETE /identity/session`.

- [ ] **Step 1: Write failing sign-out tests**

Seed the QueryClient with session, residency, finance, and unrelated private queries. After settled success and failure, assert every query is absent. In the shell, use a deferred promise to assert `Signing out...` and disabled state while pending. Reject the promise and assert navigation to Sign In with only the generic warning:

```ts
expect(screen.getByText('Sign out could not be confirmed.')).toBeVisible();
expect(screen.getByText('Close this browser on a shared device and try again.')).toBeVisible();
expect(screen.queryByText(/network|axios|token|cookie/i)).not.toBeInTheDocument();
```

- [ ] **Step 2: Confirm RED**

Run identity-web, platform-web, and web focused tests.

Expected: FAIL because only the session query is removed and Sign In has no sign-out warning state.

- [ ] **Step 3: Harden sign out**

In `useSignOutMutation.onSettled`, cancel all queries and remove all queries without a key filter. In `ApplicationShell`, navigate to `/sign-in` with replacement after both success and failure; pass `{ signOutFailed: true }` only on failure. Keep the pending action disabled. Extend the safe location-state parser in Sign In to accept only that boolean and render the fixed warning copy.

- [ ] **Step 4: Confirm GREEN and commit**

Run the three focused test suites and typechecks plus `git diff --check`.

Commit:

```bash
git commit -m "fix(identity): clear private data on sign out"
```

### Task 9: End-to-End, Migration, and Completion Verification

**Files:**

- Modify: `apps/web-e2e/src/example.spec.ts`
- Modify: `README.md` only if a new development or migration command is required
- Update: Notion page `Smart Citizen - RT Community Information System` only after the completion gate passes

**Interfaces:**

- Consumes: the complete overview and sign-out behaviour.
- Produces: browser evidence and delivery tracking.

- [ ] **Step 1: Extend Playwright routes and failing browser assertions**

Intercept the two exact domain overview endpoints with safe aggregate payloads. Add coverage for:

- populated overview at 768 by 1024 and 1440 by 1000;
- no horizontal overflow;
- refresh requests both endpoints;
- one domain `500` leaves the other visible and exposes a keyboard-operable retry;
- no private overview content below 768 px;
- successful sign out removes all summary/community text;
- failed sign out returns to Sign In with the generic warning;
- no unexpected console or page errors.

- [ ] **Step 2: Confirm Playwright RED, then GREEN**

Run `pnpm e2e` before updating production/E2E support and confirm the new assertions fail for the expected missing behaviour. Complete route fixtures and rerun until every browser test passes.

- [ ] **Step 3: Run database verification**

Run:

```bash
pnpm db:test
pnpm exec prisma validate
pnpm db:migrate:check
```

Review output and confirm the test database accepts the append-only migration with no drift.

- [ ] **Step 4: Run full repository verification**

Run sequentially:

```bash
pnpm exec nx sync:check
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm e2e
pnpm exec prisma validate
git diff --check
git status --short
```

Read the complete output. Zero failures are required. The existing Vite chunk-size warning is non-blocking only if it remains unchanged.

- [ ] **Step 5: Perform rendered visual and privacy inspection**

Use the Browser plugin when available; otherwise record why regular Playwright is used. Capture 768 by 1024 and 1440 by 1000 screenshots in `/tmp`, inspect them with `view_image`, and verify stable framing, readable metric labels, focus, error states, no overlap, no nested cards, and no private content below 768 px. Remove temporary scripts; screenshots must remain outside Git.

- [ ] **Step 6: Inspect boundaries and update delivery tracking**

Confirm:

- all repository queries lead with `communityId`;
- cross-community requests are denied before repository access;
- permissions, not positions, shape results;
- finance arithmetic is exact;
- API/UI payloads exclude sensitive fields;
- sign out removes every cached query;
- `.env`, generated client, screenshots, and credentials are absent from `git status`.

Fetch the Notion page again, change only `Page 02: Weekly Overview` from unchecked to checked, and preserve every other page and recent edit. Do not check any placeholder page.

- [ ] **Step 7: Commit verification changes**

Commit only intentional E2E/documentation adjustments:

```bash
git commit -m "test(overview): verify weekly review workflow"
```
