# Smart Citizen Database Foundation Design

## Goal

Create the first PostgreSQL and Prisma schema for Smart Citizen without adding application behavior or seed data. The schema establishes:

- Tenant and authorization foundations.
- Houses, residents, and residency history.
- Financial reporting and approval records.
- Immutable public financial snapshots.
- Private audit events.

The pilot operates one RT, but every tenant-owned relationship is scoped to a community from the first migration.

## Scope Boundaries

This change creates tables, relations, indexes, constraints, Prisma configuration, and migration verification only. It does not implement authentication, API endpoints, authorization policies, seed data, resident change submissions, file evidence, soft-delete services, resident accounts, row-level security, or application workflows.

The Pamwas residency-change workflow will be designed separately on top of the house, resident, and residency foundation.

## Database Environments

Local development uses three databases on the existing PostgreSQL server:

- `smart_citizen_dev`: development schema and future local data.
- `smart_citizen_test`: integration-test schema.
- `smart_citizen_shadow`: Prisma migration shadow database.

The local `smart_citizen_app` role authenticates with a developer-managed password. Example environment values use a safe placeholder and never contain credentials.

Prisma owns all application tables. Tables must not be created or changed manually through pgAdmin.

## Schema Conventions

### Names and identifiers

- Prisma models and fields use PascalCase and camelCase.
- PostgreSQL tables and columns use plural `snake_case` names through Prisma mappings.
- Internal identifiers use non-sequential PostgreSQL UUIDs.
- Public resources also receive a distinct random public identifier. Internal IDs are never exposed as public IDs.
- All timestamps use timezone-aware PostgreSQL timestamps with millisecond precision.
- Calendar-only values such as reporting dates use PostgreSQL `DATE`.
- Financial values use PostgreSQL `BIGINT` minor units and must never use floating-point arithmetic.

### Lifecycle metadata

Mutable business records include:

- `createdDateTime`
- `updatedDateTime`
- `status`
- `createdBy`
- `updatedBy`

`status` is a PostgreSQL `SMALLINT` with a default of `1` and an explicit database check constraint:

| Value | Meaning  |
| ----- | -------- |
| `1`   | Active   |
| `2`   | Inactive |
| `3`   | Deleted  |

No feature in this change performs soft deletion. The status structure is present for later lifecycle behavior.

Tenant-owned actor references use community membership IDs and compound tenant foreign keys. Global records use user IDs. Actor references may be null for bootstrap and system-created records that exist before an authenticated actor is available.

### Immutable and assignment exceptions

Approvals, publications, publication snapshots, and audit events are append-only. They contain creation time and creator context but no update metadata or lifecycle status.

Assignment records contain creation metadata plus optional revocation time and revoking actor. Revocation preserves assignment history instead of updating or deleting it invisibly.

## Tenant And Authorization Foundation

### `communities`

Stores the tenant identity and basic operating defaults such as display name, timezone, and currency. It is a mutable global record with lifecycle metadata. Community-owned data references it through `community_id`.

### `users`

Stores an authenticated administrative identity independently from resident records. It includes:

- Original email.
- Globally unique normalized email.
- Nullable `password_hash` reserved for a later local authentication design.
- Lifecycle and global actor metadata.

There is never a plaintext password column. Password hashing, login, sessions, reset flows, and credential policies remain out of scope.

### `community_memberships`

Connects an administrative user to a community. `user_id` is globally unique in this table, enforcing the approved rule that a user may belong to at most one RT. A Platform Owner may exist without a community membership.

Memberships have lifecycle metadata. Each membership exposes a compound unique `(community_id, id)` target so tenant-owned relations can enforce matching community context.

### Positions and position assignments

- `community_positions` defines organizational positions such as Pak RT, Sekretaris, Bendahara, or Pamwas without hard-coding them as application permissions.
- `membership_position_assignments` records position assignment history with creation and revocation metadata.

A membership may hold more than one position. Position codes are unique within a community.

### Roles and permissions

- `community_roles` defines application roles within one community.
- `permissions` is the global permission catalog.
- `role_permissions` assigns permissions to community roles with creation and revocation metadata.
- `membership_roles` assigns community roles to memberships with creation and revocation metadata.

Organizational position never grants permission implicitly. Application services will later evaluate active membership-role-permission assignments explicitly.

### Platform authorization

- `platform_roles` defines platform-scoped roles.
- `user_platform_roles` assigns those roles to users with creation and revocation metadata.

This supports Platform Owner access without pretending that the Platform Owner participates in an RT community.

No community, user, role, position, or permission data is seeded by this change.

## Houses And Residency

### `houses`

Stores a community-owned house or unit with a community-unique house code, address details, and lifecycle metadata. Occupancy is derived from active residency records rather than duplicated as a mutable house field.

### `residents`

Stores the minimum private administrative resident record:

- Full name.
- Optional contact information.
- Lifecycle and tenant actor metadata.

A resident is not a login account and has no public visibility. Authenticated resident accounts remain a later-stage feature.

### `residencies`

Connects a resident to a house within the same community. It records permanent or temporary residency, a start date, an optional end date, and lifecycle metadata.

Constraints enforce:

- Resident, house, actor, and residency community IDs match.
- A residency end date cannot precede its start date.
- A resident has at most one active, unended residency.
- A house may contain multiple active residents.

Moving out sets the residency end date and makes the residency inactive. The resident and prior residency remain available for restricted historical and audit use. No record is hard-deleted.

## Financial Reporting And Approval

### `financial_categories`

Defines community-owned income and expense categories. Category codes are unique within a community. A compound category key ensures that an entry cannot claim a different income or expense type from its category. Categories have lifecycle and tenant actor metadata.

### `financial_reports`

Stores a community-owned reporting period, revision number, opening balance, currency, workflow stage, and optional link to the report revision it supersedes. Workflow stages are `DRAFT`, `UNDER_REVIEW`, and `APPROVED`; workflow stage is separate from lifecycle status.

Constraints enforce valid date ranges, positive revision numbers, a unique revision within a community and period, and a same-community, same-period supersession link. A superseded report may have at most one direct successor so revision history remains linear.

### `financial_report_entries`

Stores an income or expense entry for a report, including category, transaction date, description, and positive amount in minor units. Report, category, entry, and actor relations are tenant-matched.

Entries contain lifecycle and tenant actor metadata. Application services will later prevent changes after the owning report leaves an editable workflow stage.

### `financial_report_approvals`

Stores immutable approval decision history. Each record contains the report, decision, private note when provided, approving membership, the relevant position assignment context, and creation timestamp. A compound foreign key guarantees that the recorded position assignment belongs to the approving membership.

Approval decisions are `APPROVED`, `REJECTED`, or `CHANGES_REQUESTED`. The database preserves who decided and their position context. Application authorization will later enforce that Pak RT alone can provide final pilot approval.

Closing balance is derived from opening balance plus active income and expense entries. It is not maintained as duplicated mutable draft state.

A correction to an approved or published report creates a new report revision linked through `supersedes_report_id`.

## Publication Snapshots

### `publications`

Stores immutable community-owned publication metadata:

- Random public ID.
- Internal publication series ID.
- Publication type.
- Revision number.
- Publishing membership and timestamp.
- Optional same-community link to the publication it supersedes.

Publication revision numbers are unique within a community, publication type, and series. Supersession must remain inside the same series, allowing each monthly report to begin at revision one without colliding with other reports.

### `financial_report_publication_snapshots`

Stores one immutable financial snapshot per publication. It references the approved source report for private traceability and contains:

- Reporting period and currency.
- Opening, income, expense, and closing totals.
- Versioned resident-safe JSON payload.
- Payload checksum.

Public reads use only the immutable snapshot. They never join to financial drafts, evidence, approval notes, membership assignments, residents, or audit events. A correction creates a new publication revision; an existing publication is never silently rewritten.

## Audit Events

### `audit_events`

Stores immutable, private, community-owned administrative history:

- Community.
- Human membership actor or explicit system actor type.
- Action code.
- Target type and target identifier.
- Request or correlation identifier when available.
- Safe structured metadata.
- Creation timestamp.

Audit metadata may identify changed field names and safe workflow context. It must not duplicate passwords, tokens, resident contacts, complete resident records, approval notes, evidence, complete request bodies, or other sensitive payloads.

Application services will later create audit events in the same transaction as sensitive business changes. Audit records are the authoritative change history; lifecycle metadata alone is not treated as a complete audit log.

## Tenant Integrity

Every tenant-owned table contains a non-null `community_id` and a compound unique `(community_id, id)` key where another tenant-owned table references it.

Compound foreign keys enforce same-community relationships for:

- Membership actors.
- Positions, roles, and their assignments.
- Houses, residents, and residencies.
- Financial reports, categories, entries, and approvals.
- Publications, source reports, superseded revisions, and snapshots.
- Audit actors.

Audit targets are polymorphic identifiers and therefore cannot use reliable relational foreign keys. The audit service must derive their community from the tenant-scoped operation and write the event in the same transaction. It must never accept an unverified target community from request input.

Community-leading indexes support expected tenant queries. Repository methods must still require `communityId`; database constraints complement application scoping and do not replace it.

PostgreSQL row-level security is deferred and may later be added as defense in depth.

## Migration And Verification

Implementation will:

1. Configure Prisma to use `DATABASE_URL` and `SHADOW_DATABASE_URL` without committed credentials.
2. Add safe development, test, and shadow examples to `.env.example`.
3. Define the schema once in `prisma/schema.prisma`.
4. Generate and review an append-only initial migration.
5. Apply the migration to `smart_citizen_dev`.
6. Apply the same migration to `smart_citizen_test`.
7. Use `smart_citizen_shadow` only through Prisma migration tooling.
8. Generate the Prisma client at the configured explicit output path.
9. Verify lifecycle checks, unique constraints, date checks, positive financial amounts, and representative cross-community denial using rollback-safe database tests.
10. Run repository formatting, linting, type checking, tests, builds, Prisma validation, migration status, and diff hygiene checks.

No persistent sample or seed data is created.

## Success Criteria

- All approved tables exist through a version-controlled Prisma migration.
- Development and test databases share the same migration history.
- The shadow database validates migration reproducibility.
- A user cannot have more than one community membership.
- Tenant-owned foreign keys cannot connect records across communities.
- Resident and residency history can be retained without hard deletion.
- Financial values and report revisions have database-level integrity.
- Public financial reads can be served from immutable snapshots alone.
- Audit and approval history cannot be mutated through lifecycle fields.
- No credentials or resident data appear in source control or fixtures.
