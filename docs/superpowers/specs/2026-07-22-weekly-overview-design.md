# Weekly Overview Completion Design

## Context

The merged pilot foundation provides authenticated administrative sessions, a responsive application shell, and an initial Weekly Overview. The current overview uses real session and community context but deliberately renders no operational data. Finance and residency API/web libraries remain scaffolds, and the database has no residency-change submission model.

This design completes the Weekly Overview as a read-only weekly review surface backed by tenant-scoped finance and residency APIs. It also hardens the existing cookie-based sign-out flow so all private frontend query data is removed before the user returns to sign-in.

## Goals

- Show real, permission-appropriate residency and finance summaries for the authenticated community.
- Add the missing persistence foundation for Pamwas residency-change submissions.
- Keep the overview read-only; record changes and approvals remain in their owning future screens.
- Preserve explicit community scoping, privacy, and domain ownership at every boundary.
- Let residency and finance load and fail independently.
- Complete sign out without adding a server-side session registry.
- Meet the Notion completion gate through automated and rendered-browser verification.

## Non-Goals

- Creating, reviewing, approving, rejecting, or applying residency-change submissions.
- Creating or editing houses, residents, residencies, financial reports, entries, or approvals.
- Approving or publishing a financial report from the overview.
- Activating unfinished domain navigation destinations.
- Adding resident accounts, announcements, file evidence, notifications, or public financial rendering.
- Adding server-side JWT revocation or a session table.
- Adding production seed or mock data.

## Architectural Direction

Residency and Finance each own their summary contract, persistence query, application service, controller, frontend client, and TanStack Query definition. The web application composes both domain queries in parallel and passes their state to a presentational Weekly Overview in `platform/web`.

This avoids a Platform repository querying tables owned by other domains and avoids a cross-domain aggregator endpoint. `apps/web` and `apps/api` remain composition roots. The overview presentation does not call Axios or query Prisma.

## Residency-Change Persistence Foundation

Add these Prisma enums:

- `ResidencyChangeType`: `MOVE_IN`, `MOVE_OUT`, `CORRECTION`.
- `ResidencyChangeStage`: `SUBMITTED`, `APPROVED`, `REJECTED`, `APPLIED`.

Add `ResidencyChangeSubmission` with:

- `id`: generated UUID.
- `communityId`: required tenant key.
- `changeType` and `workflowStage`.
- Optional `residentId`, `residencyId`, and `houseId` tenant-scoped references.
- Structured proposed values: `proposedFullName`, `proposedContactPhone`, `proposedResidencyType`, `proposedStartDate`, and `proposedEndDate`.
- Optional `reason` and `privateReviewNote`, neither returned by the overview.
- `submittedByMembershipId`, optional `reviewedByMembershipId`, and optional `appliedByMembershipId`.
- Optional `reviewedDateTime` and `appliedDateTime`.
- Lifecycle `status`: `1 = ACTIVE`, `2 = INACTIVE`, `3 = DELETED`.
- `createdByMembershipId`, `updatedByMembershipId`, `createdDateTime`, and `updatedDateTime`.

Compound foreign keys enforce that every referenced resident, residency, house, and membership belongs to the same community. Community-leading indexes support pending-stage, recent-activity, resident, and house queries.

The table supports the later workflow, but this branch does not expose mutation endpoints. Future application services will validate type-specific required fields and execute approval/application transitions transactionally.

## Authenticated API Boundary

The Identity API will expose reusable NestJS boundary infrastructure:

- An administrative-session guard reads the HTTP-only session cookie and resolves the current `SessionContext` through `IdentitySessionService`.
- A current-session decorator supplies the resolved actor context to controllers.
- Community scope is checked before domain services run. A path `communityId` that differs from the session community returns `403` without querying tenant records.
- Permission checks use explicit permission codes and never position names.
- Expected `401` and `403` responses remain generic and do not reveal record existence.

The identity session endpoint retains its existing direct implementation; the reusable guard is for protected domain endpoints.

## Residency Overview Contract

`GET /communities/:communityId/residency/overview` returns two independently permissioned facets:

- `records`, available with `residency.record.read`:
  - active house count;
  - currently occupied house count;
  - current resident count.
- `changes`, available with `residency.change.read`:
  - total active submissions in `SUBMITTED` stage;
  - up to five most recently updated active submissions containing only ID, change type, workflow stage, submitted time, and updated time.

An unavailable facet is `null`. A caller with neither permission receives `403`. Counts include lifecycle-active records only. Current occupancy uses active residencies whose start date is on or before the community-local date and whose end date is absent or on or after that date, with active resident and house records.

The endpoint never returns resident names, contact details, proposed values, reasons, review notes, or actor identities.

## Finance Overview Contract

`GET /communities/:communityId/finance/overview` requires `finance.report.read` and returns:

- `latestReport`, or `null` when no active report exists:
  - report ID;
  - period start and end;
  - revision number;
  - workflow stage and currency;
  - opening, income, expense, and closing amounts in integer minor units encoded as decimal strings.
- `approvalRequiredCount`, containing the number of active `UNDER_REVIEW` reports only when the actor also has `finance.report.approve`; otherwise `null`.

The latest report is selected by period end, period start, revision number, then creation time descending. Totals use active entries only. Closing balance is opening balance plus income less expenses, with all arithmetic performed using exact integer values.

The response excludes entries, descriptions, evidence, approval decisions, private notes, and actor identities.

## Frontend Data Composition

`residency/web` and `finance/web` own Axios clients, Zod response parsing, query keys, and TanStack Query hooks. Every client function receives `communityId` and an optional `AbortSignal`; hooks pass the TanStack Query signal through to Axios. TanStack Query owns retry behaviour.

An application route component in `apps/web` reads `SessionContext`, creates both enabled queries immediately, and passes section states to the presentational page. Queries are disabled when the session lacks their base permission. One failed query does not remove successful data from the other domain.

Query keys include the explicit community ID:

- `['residency', communityId, 'overview']`
- `['finance', communityId, 'overview']`

The refresh action invalidates these exact active-community keys together.

## Weekly Overview Interface

The existing Quiet Utility direction remains unchanged. The page supports administrative viewports at 768 px and wider.

The interface contains:

1. A header with the community-local week range and an accessible refresh icon action.
2. A compact community-record summary band for active houses, occupied houses, and current residents.
3. A residency-review section with pending count and recent type/stage activity, without personal details.
4. A finance section with the latest period, stage, exact Indonesian-formatted IDR totals, and approval-waiting count when authorized.

Cards are limited to compact summary metrics. Operational content uses bordered bands and structured description lists. The page does not use charts, nested cards, decorative gradients, oversized headings, or invented data.

Each domain section has independent loading skeletons, a truthful empty state, a generic error state, and a retry action. Sections absent through permission are omitted rather than displaying forbidden data. The overview exposes no approval or mutation controls.

## Sign-Out Behaviour

The existing `DELETE /identity/session` endpoint remains the server boundary and clears the scoped HTTP-only cookie.

The frontend sign-out mutation will:

1. Disable the account-menu action and show `Signing out...` while pending.
2. Call the existing endpoint without Axios retries.
3. Cancel active queries and remove all cached queries on success or failure so private domain data cannot remain rendered.
4. Navigate with replacement to `/sign-in`.
5. On transport or server failure, pass only a boolean navigation state and render a generic warning on sign-in. No provider error, token, or request detail is displayed.

This branch does not introduce a session table. A copied JWT remains valid until expiry, which is an accepted pilot limitation of Option A. Normal sign out clears the only browser-held HTTP-only cookie.

## Error and Privacy Behaviour

- `401`: the protected route returns to sign-in using existing requested-route restoration.
- `403`: domain sections remain unavailable and no tenant record existence is disclosed.
- Domain query failure: only that section shows retry; the other domain remains usable.
- Contract mismatch: treated as a generic domain load failure and never renders unvalidated data.
- No endpoint or UI returns resident names, contacts, proposed residency values, finance entry descriptions, evidence, approval notes, or audit data.
- Logs contain action names and safe identifiers only; complete request/response bodies are not logged.

## Testing Strategy

- Contract tests validate successful payloads and reject malformed IDs, dates, stages, counts, and minor-unit amounts.
- Prisma repository integration tests use PostgreSQL to prove lifecycle filtering, exact finance arithmetic, date-sensitive occupancy, permission-shaped results, and explicit cross-community isolation.
- NestJS/Supertest integration tests cover authenticated success, unauthenticated `401`, cross-community `403`, missing-permission `403`, and permission-specific response shaping.
- Web client tests cover paths, explicit community IDs, `AbortSignal` forwarding, response validation, and safe failures.
- React Testing Library covers loading, empty, partial success, independent failure/retry, permission omission, Indonesian formats, refresh, and accessible names.
- Sign-out tests cover pending state, complete query-cache removal, success redirect, failure redirect, and generic warning copy.
- Playwright covers a populated overview at 768 by 1024 and 1440 by 1000, keyboard interaction, overflow, console errors, privacy gating below 768 px, and sign out removing private content.
- Migration verification applies the append-only migration to PostgreSQL and validates the Prisma schema.

## Completion Gate

The Weekly Overview Notion checkbox may be checked only after:

- Both real domain endpoints and frontend queries are connected.
- Tenant and permission tests pass, including explicit cross-community denial.
- All repository verification commands pass.
- Rendered tablet and desktop checks pass without accessibility, overflow, or console failures.
- Sign out removes private query data and returns to sign-in.
- Repository status contains no credentials, local environment files, screenshots, generated Prisma client files, or unrelated changes.
