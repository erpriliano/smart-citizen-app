# Smart Citizen Database Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create and verify the initial tenant-safe PostgreSQL schema for authorization, residency, finance, publication, and auditing through Prisma migrations without persistent seed data.

**Architecture:** A single Prisma schema owns one shared PostgreSQL schema. Every tenant-owned relation carries `communityId` and uses compound foreign keys to prevent cross-community relationships. Mutable records use numeric lifecycle metadata, while approvals, snapshots, audit events, and assignment history remain append-only.

**Tech Stack:** Node.js 22.19.0, pnpm 8.15.9, Nx 23.0.1, TypeScript 5.9, PostgreSQL, Prisma 7.8.0, SQL verification through `psql`.

## Global Constraints

- Use only pnpm 8.15.9 and the repository's existing Prisma 7.8.0 packages.
- Never commit `.env`, credentials, generated Prisma client files, local databases, or test data.
- Prisma owns table creation and schema evolution; do not create tables manually in pgAdmin.
- Every tenant-owned table contains non-null `community_id` and tenant-matched compound relations.
- Mutable records use `status SMALLINT DEFAULT 1` constrained to `1`, `2`, or `3`.
- Immutable records contain creation metadata only; assignment history uses revocation metadata.
- Financial amounts use `BIGINT` minor units and positive-value checks.
- No authentication behavior, API behavior, seed data, resident change submissions, or file evidence belongs in this change.
- Migration verification may insert temporary records only inside a transaction that always rolls back.

---

## File Structure

- Modify `prisma.config.ts`: load local environment values and configure development and shadow database URLs.
- Modify `.env.example`: document development, test, and shadow URL shapes with safe credential placeholders.
- Modify `.env`: repair ignored local database URLs; never stage this file.
- Modify `prisma/schema.prisma`: define enums, models, relations, indexes, and mappings.
- Create `prisma/migrations/*_database_foundation/migration.sql`: generated initial DDL plus reviewed PostgreSQL checks and partial indexes.
- Create `prisma/migrations/*_strengthen_foundation_integrity/migration.sql`: append-only tenant and revision integrity constraints found during final verification.
- Create `tools/database/verify-schema.sql`: rollback-safe catalog and integrity verification.
- Create `tools/database/verify-test-database.mjs`: deploy migrations to the test database and run the SQL verification.
- Modify `package.json`: add Prisma generate, validate, migration, and database verification commands.
- Modify `.github/workflows/ci.yml`: provide PostgreSQL and run schema verification in the required job.
- Modify `README.md`: document local migration and test commands.

---

### Task 1: Database Environment And Prisma Configuration

**Files:**

- Modify: `.env`
- Modify: `.env.example`
- Modify: `prisma.config.ts`
- Modify: `package.json`

**Interfaces:**

- Consumes: `DATABASE_URL`, `TEST_DATABASE_URL`, and `SHADOW_DATABASE_URL`.
- Produces: `pnpm db:validate`, `pnpm db:generate`, `pnpm db:migrate:dev`, and `pnpm db:migrate:status`.

- [x] **Step 1: Confirm the current configuration fails to use the intended database**

Run:

```bash
pnpm exec prisma migrate status
```

Expected: FAIL because the current `.env` database URLs are split across lines or because Prisma configuration does not load the intended values.

- [x] **Step 2: Repair local and example environment values**

Use these exact URL shapes, with each value on one line:

```dotenv
DATABASE_URL=postgresql://smart_citizen_app:change-me@127.0.0.1:5433/smart_citizen_dev?schema=public
TEST_DATABASE_URL=postgresql://smart_citizen_app:change-me@127.0.0.1:5433/smart_citizen_test?schema=public
SHADOW_DATABASE_URL=postgresql://smart_citizen_app:change-me@127.0.0.1:5433/smart_citizen_shadow?schema=public
```

- [x] **Step 3: Configure Prisma 7 environment loading**

Update `prisma.config.ts` to load `.env`, require `DATABASE_URL`, and pass `SHADOW_DATABASE_URL` as `datasource.shadowDatabaseUrl`. Keep the schema and migration paths unchanged.

- [x] **Step 4: Add database scripts**

Add these root scripts:

```json
{
  "db:generate": "prisma generate",
  "db:validate": "prisma validate",
  "db:migrate:dev": "prisma migrate dev",
  "db:migrate:status": "prisma migrate status",
  "db:test": "sh tools/database/verify-test-database.sh"
}
```

- [x] **Step 5: Verify configuration**

Run:

```bash
pnpm db:validate
pnpm db:migrate:status
```

Expected: schema validation succeeds; migration status connects to `smart_citizen_dev` and reports no migrations yet.

---

### Task 2: Write The Failing Database Contract

**Files:**

- Create: `tools/database/verify-schema.sql`
- Create: `tools/database/verify-test-database.mjs`

**Interfaces:**

- Consumes: a migrated PostgreSQL database through `TEST_DATABASE_URL`.
- Produces: a non-destructive `pnpm db:test` command that returns non-zero for missing or invalid schema guarantees.

- [x] **Step 1: Create the test database runner**

The Node.js script must load `.env` when present, require `TEST_DATABASE_URL`, and execute:

```js
run('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
  DATABASE_URL: testDatabaseUrl,
});
run('psql', [
  testDatabaseUrl,
  '-X',
  '-v',
  'ON_ERROR_STOP=1',
  '-f',
  'tools/database/verify-schema.sql',
]);
```

- [x] **Step 2: Create rollback-safe SQL assertions**

The SQL contract must begin with `BEGIN`, finish with `ROLLBACK`, and raise an exception unless all 21 application tables exist. It must also assert:

- Every mutable table has `created_date_time`, `updated_date_time`, `status`, `created_by`, and `updated_by` columns using the actor-specific mapped names.
- Lifecycle checks reject `status = 4`.
- A user cannot receive two community memberships.
- A cross-community residency relation fails.
- A resident cannot have two active, unended residencies.
- Residency end date cannot precede start date.
- Financial entry amount must be positive.
- Report supersession is same-community and same-period; publication supersession is same-community and same-series.
- Approval, publication, snapshot, and audit tables do not expose update or lifecycle columns.

Use nested PL/pgSQL exception blocks for expected unique, foreign-key, and check violations. Insert only synthetic UUIDs and non-sensitive values within the rollback transaction.

- [x] **Step 3: Run the contract and observe the red state**

Run:

```bash
pnpm db:test
```

Expected: FAIL because no migration creates the required tables.

---

### Task 3: Tenant And Authorization Prisma Models

**Files:**

- Modify: `prisma/schema.prisma`

**Interfaces:**

- Produces: `Community`, `User`, `CommunityMembership`, `CommunityPosition`, `MembershipPositionAssignment`, `CommunityRole`, `Permission`, `RolePermission`, `MembershipRole`, `PlatformRole`, and `UserPlatformRole` models.

- [x] **Step 1: Add shared schema enums**

Add only workflow enums whose values need readable database representation. Lifecycle status remains `Int @db.SmallInt` so it maps to approved numeric values.

- [x] **Step 2: Add community and user models**

Use UUID primary keys, mapped plural snake-case tables, normalized globally unique email, nullable `passwordHash`, timezone/currency defaults, and mutable lifecycle metadata. Global actor fields reference `User` and remain nullable for bootstrap.

- [x] **Step 3: Add the one-community membership rule**

Add `CommunityMembership` with:

- Required `communityId` and `userId`.
- Unique `userId`.
- Compound unique `(communityId, id)`.
- Tenant membership actor relations for creation and updates.
- Community-leading status index.

- [x] **Step 4: Add position, role, and permission catalogs**

Position and role codes are community-unique. Permission codes are globally unique. Mutable catalogs include their correct tenant or global actor metadata.

- [x] **Step 5: Add append-only assignment history**

Position, role-permission, membership-role, and platform-role assignments contain `createdDateTime`, creator actor, optional `revokedDateTime`, and optional revoking actor. Compound tenant foreign keys prevent cross-community assignments.

- [x] **Step 6: Validate and format the partial schema**

Run:

```bash
pnpm exec prisma format
pnpm db:validate
```

Expected: both commands pass.

---

### Task 4: Residency And Finance Prisma Models

**Files:**

- Modify: `prisma/schema.prisma`

**Interfaces:**

- Consumes: `Community` and `CommunityMembership` compound tenant keys.
- Produces: `House`, `Resident`, `Residency`, `FinancialCategory`, `FinancialReport`, `FinancialReportEntry`, and `FinancialReportApproval` models.

- [x] **Step 1: Add residency enums and models**

Add `ResidencyType` with `PERMANENT` and `TEMPORARY`. Create houses, residents, and residencies with UUID IDs, required community IDs, mutable lifecycle metadata, and compound tenant relations.

- [x] **Step 2: Add residency indexes and schema-level constraints**

Add community-leading indexes for active house, resident, and residency queries. Prepare migration-level checks for valid date order and a partial unique index on active, unended residency per `(community_id, resident_id)`.

- [x] **Step 3: Add financial enums and catalogs**

Add `FinancialEntryType`, `FinancialReportStage`, and `FinancialApprovalDecision`. Create community-scoped categories with unique codes and mutable lifecycle metadata.

- [x] **Step 4: Add reports, revisions, and entries**

Reports contain period dates, positive revision number, `BIGINT` opening balance, currency, workflow stage, and same-community, same-period self-reference. Entries contain report/category relations, an entry type constrained to match the category, transaction date, description, positive `BIGINT` amount, and mutable lifecycle metadata.

- [x] **Step 5: Add immutable approval history**

Approval rows reference the report, deciding membership, and a position assignment owned by that same membership. Store decision, optional private note, and creation metadata only.

- [x] **Step 6: Validate and format the partial schema**

Run:

```bash
pnpm exec prisma format
pnpm db:validate
```

Expected: both commands pass.

---

### Task 5: Publication And Audit Prisma Models

**Files:**

- Modify: `prisma/schema.prisma`

**Interfaces:**

- Consumes: community, membership, and financial report compound tenant keys.
- Produces: `Publication`, `FinancialReportPublicationSnapshot`, and `AuditEvent` models.

- [x] **Step 1: Add publication and audit enums**

Add `PublicationType` with `FINANCIAL_REPORT` and `AuditActorType` with `HUMAN` and `SYSTEM`.

- [x] **Step 2: Add immutable publications**

Publications contain internal UUID, internal series UUID, distinct random public ID, community, publication type, positive revision, publishing membership, optional same-community and same-series predecessor, and creation timestamp. Revisions are unique within their publication series. No lifecycle or update metadata is allowed.

- [x] **Step 3: Add immutable financial snapshots**

Snapshots are one-to-one with publications, reference the approved source report in the same community, and store period, currency, `BIGINT` totals, schema version, checksum, resident-safe JSON payload, and creation actor context.

- [x] **Step 4: Add immutable private audit events**

Audit events contain community, actor type, optional human membership actor, action, target type and UUID, optional request ID, safe JSON metadata, and creation timestamp. Add community-leading timestamp and target indexes.

- [x] **Step 5: Validate, format, and generate**

Run:

```bash
pnpm exec prisma format
pnpm db:validate
pnpm db:generate
```

Expected: all commands pass and generated client files remain ignored.

---

### Task 6: Generate And Harden The Migration History

**Files:**

- Create: `prisma/migrations/*_database_foundation/migration.sql`
- Create: `prisma/migrations/*_strengthen_foundation_integrity/migration.sql`

**Interfaces:**

- Consumes: the complete Prisma schema and development/shadow database URLs.
- Produces: append-only SQL that reproduces the complete foundation.

- [x] **Step 1: Generate the migration against development and shadow databases**

Run:

```bash
pnpm db:migrate:dev --name database_foundation
```

Expected: Prisma creates and applies the initial migration to `smart_citizen_dev` while using `smart_citizen_shadow` for migration validation.

- [x] **Step 2: Review generated SQL before further execution**

Confirm all 21 mapped tables, foreign keys, indexes, UUID defaults, `TIMESTAMPTZ(3)`, `DATE`, `BIGINT`, and enum types are present. Confirm there are no destructive statements unrelated to this initial empty schema.

- [x] **Step 3: Add named PostgreSQL checks and partial indexes**

Add explicit SQL constraints for:

- Lifecycle status in `(1, 2, 3)` on every mutable table.
- Residency end date greater than or equal to start date.
- Positive report revisions and financial entry amounts.
- Positive publication revisions and snapshot schema versions.
- A partial unique active-residency index where `status = 1 AND end_date IS NULL`.

- [x] **Step 4: Recreate the development schema from the final migration**

Because this is an unshared initial migration against an empty local database, run:

```bash
pnpm exec prisma migrate reset --force
```

Expected: the initial migration applies cleanly and creates no seed data.

- [x] **Step 5: Add final integrity constraints as an append-only migration**

Generate and review a corrective migration for the cross-table invariants discovered by the expanded database contract tests. Keep report revisions within a community and reporting period, bind financial entry types to their categories, bind approvals to the approving membership's position assignment, and scope publication revision chains by series.

- [x] **Step 6: Apply and verify the test database**

Run:

```bash
pnpm db:test
```

Expected: migration deployment and all rollback-safe SQL assertions pass with no persistent rows.

---

### Task 7: CI, Documentation, And Final Verification

**Files:**

- Modify: `.github/workflows/ci.yml`
- Modify: `README.md`
- Modify: `package.json`

**Interfaces:**

- Produces: reproducible local and CI database validation.

- [x] **Step 1: Add PostgreSQL to CI**

Configure the required `verify` job with a PostgreSQL service, health checks, and CI-only `DATABASE_URL`, `TEST_DATABASE_URL`, and `SHADOW_DATABASE_URL`. Use non-production `postgres` credentials only inside the workflow.

- [x] **Step 2: Add Prisma verification to CI**

After dependency installation, run `pnpm db:validate`, `pnpm db:generate`, and `pnpm db:test` before the existing workspace and Playwright checks.

- [x] **Step 3: Document local database commands**

Document the three-database purpose, credential placeholder URL shape, migration ownership, `pnpm db:migrate:dev --name database_foundation`, `pnpm db:test`, and the prohibition on manual pgAdmin table changes.

- [x] **Step 4: Run focused database verification**

Run:

```bash
pnpm db:validate
pnpm db:generate
pnpm db:migrate:status
pnpm db:test
```

Expected: all commands pass and both development and test databases report the same migration history.

- [x] **Step 5: Run full repository verification**

Run:

```bash
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

Expected: zero failures; `.env`, generated Prisma client output, credentials, and database artifacts are absent from Git status.

- [x] **Step 6: Commit the implementation**

Stage only the plan, schema, migration, verification tooling, configuration, CI, and documentation files. Commit with:

```bash
git commit -m "feat(database): add tenant-aware foundation"
```
