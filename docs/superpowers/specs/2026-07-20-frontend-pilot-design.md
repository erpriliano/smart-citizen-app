# Smart Citizen Frontend Pilot Design

**Status:** Approved on 20 July 2026

## Purpose

The pilot frontend is a trusted administrative workspace for Pak RT, App Administrators, authorised Pengurus RT, Bendahara, and Pamwas. It replaces fragmented administrative records with focused, durable workflows while keeping resident-facing access limited to deliberately published snapshots.

The interface must feel quiet, current, and dependable. It is an operational tool rather than a marketing site: information hierarchy, scanning, predictable navigation, and repeated actions take priority over decorative composition.

## Product Boundaries

- Administrative routes are private and require an authenticated administrative account.
- Every authenticated session resolves one explicit community, membership, positions, roles, and permissions.
- Residents do not receive accounts during the pilot.
- Public routes expose only immutable publication snapshots.
- Production screens do not fall back to mock data when an API request fails.
- Placeholder routes and static mock-ups do not count as completed pages.
- Complaints, events, emergency workflows, resident accounts, billing, automated WhatsApp delivery, and multi-community switching remain out of scope.

## Experience Direction

### Visual Character

Use the approved **Quiet Utility** direction:

- Light-first and dark-ready Emerald + Graphite palette.
- Geist typography for interface copy and data.
- Restrained surfaces with square-to-subtle corners and minimal elevation.
- Tables and structured lists for administrative records.
- Cards only for compact summaries, repeated entities, modals, or genuinely framed tools.
- No gradients, decorative blobs, oversized dashboard headings, nested cards, or marketing-style hero sections.
- Lucide icons for navigation and actions, with tooltips on unfamiliar icon-only controls.

### Core Tokens

| Token          | Light value | Dark-ready value | Purpose                          |
| -------------- | ----------- | ---------------- | -------------------------------- |
| Canvas         | `#f7f8f7`   | `#101312`        | Application background           |
| Surface        | `#ffffff`   | `#191d1b`        | Navigation and working surfaces  |
| Raised surface | `#ffffff`   | `#202522`        | Menus, drawers, and dialogs      |
| Graphite text  | `#18181b`   | `#f4f4f5`        | Primary text                     |
| Muted text     | `#5f6368`   | `#a1a7a3`        | Supporting text                  |
| Border         | `#dde1de`   | `#343a37`        | Dividers and control boundaries  |
| Emerald        | `#047857`   | `#34d399`        | Primary actions and active state |
| Emerald soft   | `#ecfdf5`   | `#12382b`        | Selected and positive emphasis   |
| Amber          | `#b45309`   | `#fbbf24`        | Pending and warning states       |
| Red            | `#b91c1c`   | `#f87171`        | Destructive and failure states   |

Use semantic CSS variables so tenant branding and a future dark-mode control do not require domain-component rewrites. The pilot ships light-first; dark-ready means token compatibility, not an unapproved theme switcher.

### Typography and Density

- Font: Geist Variable with `system-ui, sans-serif` fallback.
- Page title: 24 px, 32 px line height, 600 weight.
- Section title: 18 px, 26 px line height, 600 weight.
- Body and controls: 14 px, 20 px line height.
- Supporting text: 13 px, 18 px line height.
- Table rows: 44 px minimum height.
- Production controls: 40 px minimum height.
- Touch targets: 44 by 44 px minimum where pointer precision cannot be assumed.
- Letter spacing remains `0`; font size never scales with viewport width.

Corners use a 6 px default radius and never exceed 8 px for cards. Borders carry most separation; shadows are reserved for overlays and use low contrast.

## Information Architecture

The administrative application uses one role-adaptive workspace. Navigation visibility follows explicit permissions, never position names alone.

### Primary Navigation

1. Overview
2. Houses
3. Residents
4. Residency Changes
5. Financial Reports
6. Publications
7. Team & Access
8. Audit Trail
9. Community Settings

The current community identity is persistent in the application shell. Account actions are available from the user menu. An officer sees only navigation and actions allowed by the resolved permission set.

### Page Inventory

| Page                       | Route                        | Primary purpose                                                |
| -------------------------- | ---------------------------- | -------------------------------------------------------------- |
| Sign In                    | `/sign-in`                   | Administrative authentication entry point                      |
| Weekly Overview            | `/`                          | Role-adaptive review of pending work and current RT status     |
| Houses                     | `/houses`                    | Searchable house directory and occupancy summary               |
| Residents                  | `/residents`                 | Private resident directory and residency history               |
| Residency Changes          | `/residency-changes`         | Pamwas submissions and authorised review queue                 |
| Financial Reports          | `/finance/reports`           | Monthly reports, workflow stages, and revision history         |
| Financial Report Workspace | `/finance/reports/:reportId` | Entries, totals, review, approval, and publication preparation |
| Publications               | `/publications`              | Published snapshots and correction history                     |
| Team & Access              | `/team`                      | Officers, positions, roles, and explicit permissions           |
| Audit Trail                | `/audit`                     | Restricted administrative change history                       |
| Community Settings         | `/settings`                  | RT identity, timezone, currency, and pilot configuration       |
| Public Financial Report    | `/p/finance/:publicId`       | Phone-first read-only publication opened from WhatsApp         |

House and resident details use URL-backed drawers so users retain list context while links remain addressable and browser navigation works correctly.

## Application Shell

At 1024 px and wider, use a 248 px left navigation and a compact top utility bar. The main working surface uses a constrained readable width while data tables may consume the available content width.

From 768 px to 1023 px, navigation collapses to a stable icon rail or explicit drawer control. The working surface retains the same information order and never converts dense records into decorative card grids.

Below 768 px:

- Sign In remains fully usable.
- Administrative routes show a privacy-safe request to continue on a tablet or larger screen; no administrative data may render behind the message.
- Public financial reports remain fully usable from 320 px upward.

## Interaction Model

- Route modules lazy-load substantial feature areas.
- TanStack Query owns server state; requests do not run in raw effects.
- Filters, search terms, selected record identifiers, and meaningful tabs use URL state when users may refresh, share, or navigate back.
- Mutations invalidate the narrowest owning query key.
- Independent requests begin together.
- Non-trivial forms use React Hook Form and Zod.
- Destructive or publication-changing commands require clear confirmation and cannot rely on colour alone.
- Motion is brief and functional, with reduced-motion support.

## Required States

Every page or data region defines:

- Initial loading without layout shift.
- Empty state with a permission-appropriate next action.
- Recoverable request failure with retry.
- Permission denied without disclosing record existence.
- Successful mutation feedback.
- Disabled and submitting controls.
- Session expiry that returns to Sign In without exposing prior private content.

Skeletons must preserve stable dimensions. Error messages use safe language and never expose SQL, provider responses, stack traces, contacts, or record contents.

## Accessibility and Localisation

- Target WCAG 2.2 AA.
- Use semantic landmarks, headings, lists, tables, and form controls.
- Every control has an accessible name, visible focus, keyboard operation, and associated validation message.
- Dialogs and drawers manage focus, support Escape where safe, and restore focus to the trigger.
- Status never relies only on colour.
- Interface copy uses English (UK), including forms such as `Authorised` and `Cancelled`.
- Currency uses Indonesian Rupiah formatting with locale `id-ID` and currency `IDR`.
- Dates and times use Indonesian formatting with timezone `Asia/Jakarta` unless the resolved community supplies another supported value.
- Sensitive values must not appear in screenshots, fixtures, telemetry, or public errors.

## Delivery Sequence

The frontend is delivered through approved vertical slices:

1. Identity, community context, application shell, and shared states.
2. Houses, residents, and residency changes.
3. Financial reports, review, Pak RT approval, and publication preparation.
4. Published snapshots and public financial reports.
5. Team access, audit trail, and community settings.

Shared foundations are introduced only when required by the current slice. Each slice connects the web application to its real API contract and persistence boundary. Synthetic records are permitted only in focused tests and explicit development fixtures.

## Page Completion Gate

A page is complete only when:

- Approved user-visible behaviour is implemented.
- Real application and API boundaries are connected.
- Positive, negative permission, and relevant cross-community tests pass.
- Loading, empty, error, permission, and submission states are covered.
- Tablet or phone responsiveness is verified for the route's supported viewport.
- Keyboard and accessibility checks pass.
- Repository verification passes without broad ignores.
- Public and private data exposure has been reviewed.
