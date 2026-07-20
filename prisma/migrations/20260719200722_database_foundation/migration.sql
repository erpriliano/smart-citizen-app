-- CreateEnum
CREATE TYPE "residency_type" AS ENUM ('PERMANENT', 'TEMPORARY');

-- CreateEnum
CREATE TYPE "financial_entry_type" AS ENUM ('INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "financial_report_stage" AS ENUM ('DRAFT', 'UNDER_REVIEW', 'APPROVED');

-- CreateEnum
CREATE TYPE "financial_approval_decision" AS ENUM ('APPROVED', 'REJECTED', 'CHANGES_REQUESTED');

-- CreateEnum
CREATE TYPE "publication_type" AS ENUM ('FINANCIAL_REPORT');

-- CreateEnum
CREATE TYPE "audit_actor_type" AS ENUM ('HUMAN', 'SYSTEM');

-- CreateTable
CREATE TABLE "communities" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Jakarta',
    "currency" TEXT NOT NULL DEFAULT 'IDR',
    "status" SMALLINT NOT NULL DEFAULT 1,
    "created_by_user_id" UUID,
    "updated_by_user_id" UUID,
    "created_date_time" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date_time" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "communities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "normalized_email" TEXT NOT NULL,
    "password_hash" TEXT,
    "status" SMALLINT NOT NULL DEFAULT 1,
    "created_by_user_id" UUID,
    "updated_by_user_id" UUID,
    "created_date_time" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date_time" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_memberships" (
    "id" UUID NOT NULL,
    "community_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "status" SMALLINT NOT NULL DEFAULT 1,
    "created_by_membership_id" UUID,
    "updated_by_membership_id" UUID,
    "created_date_time" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date_time" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_positions" (
    "id" UUID NOT NULL,
    "community_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" SMALLINT NOT NULL DEFAULT 1,
    "created_by_membership_id" UUID,
    "updated_by_membership_id" UUID,
    "created_date_time" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date_time" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membership_position_assignments" (
    "id" UUID NOT NULL,
    "community_id" UUID NOT NULL,
    "membership_id" UUID NOT NULL,
    "position_id" UUID NOT NULL,
    "created_by_membership_id" UUID,
    "revoked_by_membership_id" UUID,
    "created_date_time" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_date_time" TIMESTAMPTZ(3),

    CONSTRAINT "membership_position_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_roles" (
    "id" UUID NOT NULL,
    "community_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" SMALLINT NOT NULL DEFAULT 1,
    "created_by_membership_id" UUID,
    "updated_by_membership_id" UUID,
    "created_date_time" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date_time" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" SMALLINT NOT NULL DEFAULT 1,
    "created_by_user_id" UUID,
    "updated_by_user_id" UUID,
    "created_date_time" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date_time" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" UUID NOT NULL,
    "community_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,
    "created_by_membership_id" UUID,
    "revoked_by_membership_id" UUID,
    "created_date_time" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_date_time" TIMESTAMPTZ(3),

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membership_roles" (
    "id" UUID NOT NULL,
    "community_id" UUID NOT NULL,
    "membership_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "created_by_membership_id" UUID,
    "revoked_by_membership_id" UUID,
    "created_date_time" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_date_time" TIMESTAMPTZ(3),

    CONSTRAINT "membership_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_roles" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" SMALLINT NOT NULL DEFAULT 1,
    "created_by_user_id" UUID,
    "updated_by_user_id" UUID,
    "created_date_time" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date_time" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_platform_roles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "platform_role_id" UUID NOT NULL,
    "created_by_user_id" UUID,
    "revoked_by_user_id" UUID,
    "created_date_time" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_date_time" TIMESTAMPTZ(3),

    CONSTRAINT "user_platform_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "houses" (
    "id" UUID NOT NULL,
    "community_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "address_line" TEXT NOT NULL,
    "address_detail" TEXT,
    "status" SMALLINT NOT NULL DEFAULT 1,
    "created_by_membership_id" UUID,
    "updated_by_membership_id" UUID,
    "created_date_time" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date_time" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "houses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "residents" (
    "id" UUID NOT NULL,
    "community_id" UUID NOT NULL,
    "full_name" TEXT NOT NULL,
    "contact_phone" TEXT,
    "status" SMALLINT NOT NULL DEFAULT 1,
    "created_by_membership_id" UUID,
    "updated_by_membership_id" UUID,
    "created_date_time" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date_time" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "residents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "residencies" (
    "id" UUID NOT NULL,
    "community_id" UUID NOT NULL,
    "resident_id" UUID NOT NULL,
    "house_id" UUID NOT NULL,
    "residency_type" "residency_type" NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "status" SMALLINT NOT NULL DEFAULT 1,
    "created_by_membership_id" UUID,
    "updated_by_membership_id" UUID,
    "created_date_time" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date_time" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "residencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_categories" (
    "id" UUID NOT NULL,
    "community_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "entry_type" "financial_entry_type" NOT NULL,
    "status" SMALLINT NOT NULL DEFAULT 1,
    "created_by_membership_id" UUID,
    "updated_by_membership_id" UUID,
    "created_date_time" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date_time" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "financial_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_reports" (
    "id" UUID NOT NULL,
    "community_id" UUID NOT NULL,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "revision_number" INTEGER NOT NULL,
    "opening_balance_minor" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'IDR',
    "workflow_stage" "financial_report_stage" NOT NULL DEFAULT 'DRAFT',
    "supersedes_report_id" UUID,
    "status" SMALLINT NOT NULL DEFAULT 1,
    "created_by_membership_id" UUID,
    "updated_by_membership_id" UUID,
    "created_date_time" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date_time" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "financial_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_report_entries" (
    "id" UUID NOT NULL,
    "community_id" UUID NOT NULL,
    "report_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "entry_type" "financial_entry_type" NOT NULL,
    "transaction_date" DATE NOT NULL,
    "description" TEXT NOT NULL,
    "amount_minor" BIGINT NOT NULL,
    "status" SMALLINT NOT NULL DEFAULT 1,
    "created_by_membership_id" UUID,
    "updated_by_membership_id" UUID,
    "created_date_time" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date_time" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "financial_report_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_report_approvals" (
    "id" UUID NOT NULL,
    "community_id" UUID NOT NULL,
    "report_id" UUID NOT NULL,
    "position_assignment_id" UUID NOT NULL,
    "decision" "financial_approval_decision" NOT NULL,
    "private_note" TEXT,
    "created_by_membership_id" UUID NOT NULL,
    "created_date_time" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "financial_report_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "publications" (
    "id" UUID NOT NULL,
    "community_id" UUID NOT NULL,
    "public_id" TEXT NOT NULL,
    "publication_type" "publication_type" NOT NULL,
    "revision_number" INTEGER NOT NULL,
    "supersedes_publication_id" UUID,
    "created_by_membership_id" UUID NOT NULL,
    "created_date_time" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "publications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_report_publication_snapshots" (
    "id" UUID NOT NULL,
    "community_id" UUID NOT NULL,
    "publication_id" UUID NOT NULL,
    "source_report_id" UUID NOT NULL,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "currency" TEXT NOT NULL,
    "opening_balance_minor" BIGINT NOT NULL,
    "income_total_minor" BIGINT NOT NULL,
    "expense_total_minor" BIGINT NOT NULL,
    "closing_balance_minor" BIGINT NOT NULL,
    "schema_version" INTEGER NOT NULL,
    "checksum" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "created_by_membership_id" UUID NOT NULL,
    "created_date_time" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "financial_report_publication_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_events" (
    "id" UUID NOT NULL,
    "community_id" UUID NOT NULL,
    "actor_type" "audit_actor_type" NOT NULL,
    "created_by_membership_id" UUID,
    "action" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" UUID NOT NULL,
    "request_id" TEXT,
    "metadata" JSONB,
    "created_date_time" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "communities_slug_key" ON "communities"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_normalized_email_key" ON "users"("normalized_email");

-- CreateIndex
CREATE UNIQUE INDEX "community_memberships_user_id_key" ON "community_memberships"("user_id");

-- CreateIndex
CREATE INDEX "community_memberships_community_id_status_idx" ON "community_memberships"("community_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "community_memberships_community_id_id_key" ON "community_memberships"("community_id", "id");

-- CreateIndex
CREATE INDEX "community_positions_community_id_status_idx" ON "community_positions"("community_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "community_positions_community_id_id_key" ON "community_positions"("community_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "community_positions_community_id_code_key" ON "community_positions"("community_id", "code");

-- CreateIndex
CREATE INDEX "membership_position_assignments_community_id_membership_id_idx" ON "membership_position_assignments"("community_id", "membership_id");

-- CreateIndex
CREATE INDEX "membership_position_assignments_community_id_position_id_idx" ON "membership_position_assignments"("community_id", "position_id");

-- CreateIndex
CREATE UNIQUE INDEX "membership_position_assignments_community_id_id_key" ON "membership_position_assignments"("community_id", "id");

-- CreateIndex
CREATE INDEX "community_roles_community_id_status_idx" ON "community_roles"("community_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "community_roles_community_id_id_key" ON "community_roles"("community_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "community_roles_community_id_code_key" ON "community_roles"("community_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_code_key" ON "permissions"("code");

-- CreateIndex
CREATE INDEX "permissions_status_idx" ON "permissions"("status");

-- CreateIndex
CREATE INDEX "role_permissions_community_id_role_id_idx" ON "role_permissions"("community_id", "role_id");

-- CreateIndex
CREATE INDEX "role_permissions_permission_id_idx" ON "role_permissions"("permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_community_id_id_key" ON "role_permissions"("community_id", "id");

-- CreateIndex
CREATE INDEX "membership_roles_community_id_membership_id_idx" ON "membership_roles"("community_id", "membership_id");

-- CreateIndex
CREATE INDEX "membership_roles_community_id_role_id_idx" ON "membership_roles"("community_id", "role_id");

-- CreateIndex
CREATE UNIQUE INDEX "membership_roles_community_id_id_key" ON "membership_roles"("community_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "platform_roles_code_key" ON "platform_roles"("code");

-- CreateIndex
CREATE INDEX "platform_roles_status_idx" ON "platform_roles"("status");

-- CreateIndex
CREATE INDEX "user_platform_roles_user_id_idx" ON "user_platform_roles"("user_id");

-- CreateIndex
CREATE INDEX "user_platform_roles_platform_role_id_idx" ON "user_platform_roles"("platform_role_id");

-- CreateIndex
CREATE INDEX "houses_community_id_status_idx" ON "houses"("community_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "houses_community_id_id_key" ON "houses"("community_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "houses_community_id_code_key" ON "houses"("community_id", "code");

-- CreateIndex
CREATE INDEX "residents_community_id_status_idx" ON "residents"("community_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "residents_community_id_id_key" ON "residents"("community_id", "id");

-- CreateIndex
CREATE INDEX "residencies_community_id_resident_id_status_idx" ON "residencies"("community_id", "resident_id", "status");

-- CreateIndex
CREATE INDEX "residencies_community_id_house_id_status_idx" ON "residencies"("community_id", "house_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "residencies_community_id_id_key" ON "residencies"("community_id", "id");

-- CreateIndex
CREATE INDEX "financial_categories_community_id_status_idx" ON "financial_categories"("community_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "financial_categories_community_id_id_key" ON "financial_categories"("community_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "financial_categories_community_id_code_key" ON "financial_categories"("community_id", "code");

-- CreateIndex
CREATE INDEX "financial_reports_community_id_workflow_stage_status_idx" ON "financial_reports"("community_id", "workflow_stage", "status");

-- CreateIndex
CREATE UNIQUE INDEX "financial_reports_community_id_id_key" ON "financial_reports"("community_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "financial_reports_community_id_supersedes_report_id_key" ON "financial_reports"("community_id", "supersedes_report_id");

-- CreateIndex
CREATE UNIQUE INDEX "financial_reports_community_id_period_start_period_end_revi_key" ON "financial_reports"("community_id", "period_start", "period_end", "revision_number");

-- CreateIndex
CREATE INDEX "financial_report_entries_community_id_report_id_status_idx" ON "financial_report_entries"("community_id", "report_id", "status");

-- CreateIndex
CREATE INDEX "financial_report_entries_community_id_category_id_idx" ON "financial_report_entries"("community_id", "category_id");

-- CreateIndex
CREATE UNIQUE INDEX "financial_report_entries_community_id_id_key" ON "financial_report_entries"("community_id", "id");

-- CreateIndex
CREATE INDEX "financial_report_approvals_community_id_report_id_created_d_idx" ON "financial_report_approvals"("community_id", "report_id", "created_date_time");

-- CreateIndex
CREATE UNIQUE INDEX "financial_report_approvals_community_id_id_key" ON "financial_report_approvals"("community_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "publications_public_id_key" ON "publications"("public_id");

-- CreateIndex
CREATE INDEX "publications_community_id_publication_type_created_date_tim_idx" ON "publications"("community_id", "publication_type", "created_date_time");

-- CreateIndex
CREATE UNIQUE INDEX "publications_community_id_id_key" ON "publications"("community_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "publications_community_id_supersedes_publication_id_key" ON "publications"("community_id", "supersedes_publication_id");

-- CreateIndex
CREATE UNIQUE INDEX "publications_community_id_publication_type_revision_number_key" ON "publications"("community_id", "publication_type", "revision_number");

-- CreateIndex
CREATE INDEX "financial_report_publication_snapshots_community_id_period__idx" ON "financial_report_publication_snapshots"("community_id", "period_start", "period_end");

-- CreateIndex
CREATE UNIQUE INDEX "financial_report_publication_snapshots_community_id_id_key" ON "financial_report_publication_snapshots"("community_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "financial_report_publication_snapshots_community_id_publica_key" ON "financial_report_publication_snapshots"("community_id", "publication_id");

-- CreateIndex
CREATE UNIQUE INDEX "financial_report_publication_snapshots_community_id_source__key" ON "financial_report_publication_snapshots"("community_id", "source_report_id");

-- CreateIndex
CREATE INDEX "audit_events_community_id_created_date_time_idx" ON "audit_events"("community_id", "created_date_time" DESC);

-- CreateIndex
CREATE INDEX "audit_events_community_id_target_type_target_id_idx" ON "audit_events"("community_id", "target_type", "target_id");

-- CreateIndex
CREATE UNIQUE INDEX "audit_events_community_id_id_key" ON "audit_events"("community_id", "id");

-- AddForeignKey
ALTER TABLE "communities" ADD CONSTRAINT "communities_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communities" ADD CONSTRAINT "communities_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_memberships" ADD CONSTRAINT "community_memberships_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_memberships" ADD CONSTRAINT "community_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_memberships" ADD CONSTRAINT "community_memberships_community_id_created_by_membership_i_fkey" FOREIGN KEY ("community_id", "created_by_membership_id") REFERENCES "community_memberships"("community_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_memberships" ADD CONSTRAINT "community_memberships_community_id_updated_by_membership_i_fkey" FOREIGN KEY ("community_id", "updated_by_membership_id") REFERENCES "community_memberships"("community_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_positions" ADD CONSTRAINT "community_positions_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_positions" ADD CONSTRAINT "community_positions_community_id_created_by_membership_id_fkey" FOREIGN KEY ("community_id", "created_by_membership_id") REFERENCES "community_memberships"("community_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_positions" ADD CONSTRAINT "community_positions_community_id_updated_by_membership_id_fkey" FOREIGN KEY ("community_id", "updated_by_membership_id") REFERENCES "community_memberships"("community_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_position_assignments" ADD CONSTRAINT "membership_position_assignments_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_position_assignments" ADD CONSTRAINT "membership_position_assignments_community_id_membership_id_fkey" FOREIGN KEY ("community_id", "membership_id") REFERENCES "community_memberships"("community_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_position_assignments" ADD CONSTRAINT "membership_position_assignments_community_id_position_id_fkey" FOREIGN KEY ("community_id", "position_id") REFERENCES "community_positions"("community_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_position_assignments" ADD CONSTRAINT "membership_position_assignments_community_id_created_by_me_fkey" FOREIGN KEY ("community_id", "created_by_membership_id") REFERENCES "community_memberships"("community_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_position_assignments" ADD CONSTRAINT "membership_position_assignments_community_id_revoked_by_me_fkey" FOREIGN KEY ("community_id", "revoked_by_membership_id") REFERENCES "community_memberships"("community_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_roles" ADD CONSTRAINT "community_roles_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_roles" ADD CONSTRAINT "community_roles_community_id_created_by_membership_id_fkey" FOREIGN KEY ("community_id", "created_by_membership_id") REFERENCES "community_memberships"("community_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_roles" ADD CONSTRAINT "community_roles_community_id_updated_by_membership_id_fkey" FOREIGN KEY ("community_id", "updated_by_membership_id") REFERENCES "community_memberships"("community_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_community_id_role_id_fkey" FOREIGN KEY ("community_id", "role_id") REFERENCES "community_roles"("community_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_community_id_created_by_membership_id_fkey" FOREIGN KEY ("community_id", "created_by_membership_id") REFERENCES "community_memberships"("community_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_community_id_revoked_by_membership_id_fkey" FOREIGN KEY ("community_id", "revoked_by_membership_id") REFERENCES "community_memberships"("community_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_roles" ADD CONSTRAINT "membership_roles_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_roles" ADD CONSTRAINT "membership_roles_community_id_membership_id_fkey" FOREIGN KEY ("community_id", "membership_id") REFERENCES "community_memberships"("community_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_roles" ADD CONSTRAINT "membership_roles_community_id_role_id_fkey" FOREIGN KEY ("community_id", "role_id") REFERENCES "community_roles"("community_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_roles" ADD CONSTRAINT "membership_roles_community_id_created_by_membership_id_fkey" FOREIGN KEY ("community_id", "created_by_membership_id") REFERENCES "community_memberships"("community_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_roles" ADD CONSTRAINT "membership_roles_community_id_revoked_by_membership_id_fkey" FOREIGN KEY ("community_id", "revoked_by_membership_id") REFERENCES "community_memberships"("community_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_roles" ADD CONSTRAINT "platform_roles_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_roles" ADD CONSTRAINT "platform_roles_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_platform_roles" ADD CONSTRAINT "user_platform_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_platform_roles" ADD CONSTRAINT "user_platform_roles_platform_role_id_fkey" FOREIGN KEY ("platform_role_id") REFERENCES "platform_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_platform_roles" ADD CONSTRAINT "user_platform_roles_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_platform_roles" ADD CONSTRAINT "user_platform_roles_revoked_by_user_id_fkey" FOREIGN KEY ("revoked_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "houses" ADD CONSTRAINT "houses_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "houses" ADD CONSTRAINT "houses_community_id_created_by_membership_id_fkey" FOREIGN KEY ("community_id", "created_by_membership_id") REFERENCES "community_memberships"("community_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "houses" ADD CONSTRAINT "houses_community_id_updated_by_membership_id_fkey" FOREIGN KEY ("community_id", "updated_by_membership_id") REFERENCES "community_memberships"("community_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "residents" ADD CONSTRAINT "residents_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "residents" ADD CONSTRAINT "residents_community_id_created_by_membership_id_fkey" FOREIGN KEY ("community_id", "created_by_membership_id") REFERENCES "community_memberships"("community_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "residents" ADD CONSTRAINT "residents_community_id_updated_by_membership_id_fkey" FOREIGN KEY ("community_id", "updated_by_membership_id") REFERENCES "community_memberships"("community_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "residencies" ADD CONSTRAINT "residencies_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "residencies" ADD CONSTRAINT "residencies_community_id_resident_id_fkey" FOREIGN KEY ("community_id", "resident_id") REFERENCES "residents"("community_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "residencies" ADD CONSTRAINT "residencies_community_id_house_id_fkey" FOREIGN KEY ("community_id", "house_id") REFERENCES "houses"("community_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "residencies" ADD CONSTRAINT "residencies_community_id_created_by_membership_id_fkey" FOREIGN KEY ("community_id", "created_by_membership_id") REFERENCES "community_memberships"("community_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "residencies" ADD CONSTRAINT "residencies_community_id_updated_by_membership_id_fkey" FOREIGN KEY ("community_id", "updated_by_membership_id") REFERENCES "community_memberships"("community_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_categories" ADD CONSTRAINT "financial_categories_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_categories" ADD CONSTRAINT "financial_categories_community_id_created_by_membership_id_fkey" FOREIGN KEY ("community_id", "created_by_membership_id") REFERENCES "community_memberships"("community_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_categories" ADD CONSTRAINT "financial_categories_community_id_updated_by_membership_id_fkey" FOREIGN KEY ("community_id", "updated_by_membership_id") REFERENCES "community_memberships"("community_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_reports" ADD CONSTRAINT "financial_reports_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_reports" ADD CONSTRAINT "financial_reports_community_id_created_by_membership_id_fkey" FOREIGN KEY ("community_id", "created_by_membership_id") REFERENCES "community_memberships"("community_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_reports" ADD CONSTRAINT "financial_reports_community_id_updated_by_membership_id_fkey" FOREIGN KEY ("community_id", "updated_by_membership_id") REFERENCES "community_memberships"("community_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_reports" ADD CONSTRAINT "financial_reports_community_id_supersedes_report_id_fkey" FOREIGN KEY ("community_id", "supersedes_report_id") REFERENCES "financial_reports"("community_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_report_entries" ADD CONSTRAINT "financial_report_entries_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_report_entries" ADD CONSTRAINT "financial_report_entries_community_id_report_id_fkey" FOREIGN KEY ("community_id", "report_id") REFERENCES "financial_reports"("community_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_report_entries" ADD CONSTRAINT "financial_report_entries_community_id_category_id_fkey" FOREIGN KEY ("community_id", "category_id") REFERENCES "financial_categories"("community_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_report_entries" ADD CONSTRAINT "financial_report_entries_community_id_created_by_membershi_fkey" FOREIGN KEY ("community_id", "created_by_membership_id") REFERENCES "community_memberships"("community_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_report_entries" ADD CONSTRAINT "financial_report_entries_community_id_updated_by_membershi_fkey" FOREIGN KEY ("community_id", "updated_by_membership_id") REFERENCES "community_memberships"("community_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_report_approvals" ADD CONSTRAINT "financial_report_approvals_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_report_approvals" ADD CONSTRAINT "financial_report_approvals_community_id_report_id_fkey" FOREIGN KEY ("community_id", "report_id") REFERENCES "financial_reports"("community_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_report_approvals" ADD CONSTRAINT "financial_report_approvals_community_id_position_assignmen_fkey" FOREIGN KEY ("community_id", "position_assignment_id") REFERENCES "membership_position_assignments"("community_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_report_approvals" ADD CONSTRAINT "financial_report_approvals_community_id_created_by_members_fkey" FOREIGN KEY ("community_id", "created_by_membership_id") REFERENCES "community_memberships"("community_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publications" ADD CONSTRAINT "publications_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publications" ADD CONSTRAINT "publications_community_id_created_by_membership_id_fkey" FOREIGN KEY ("community_id", "created_by_membership_id") REFERENCES "community_memberships"("community_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publications" ADD CONSTRAINT "publications_community_id_supersedes_publication_id_fkey" FOREIGN KEY ("community_id", "supersedes_publication_id") REFERENCES "publications"("community_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_report_publication_snapshots" ADD CONSTRAINT "financial_report_publication_snapshots_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_report_publication_snapshots" ADD CONSTRAINT "financial_report_publication_snapshots_community_id_public_fkey" FOREIGN KEY ("community_id", "publication_id") REFERENCES "publications"("community_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_report_publication_snapshots" ADD CONSTRAINT "financial_report_publication_snapshots_community_id_source_fkey" FOREIGN KEY ("community_id", "source_report_id") REFERENCES "financial_reports"("community_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_report_publication_snapshots" ADD CONSTRAINT "financial_report_publication_snapshots_community_id_create_fkey" FOREIGN KEY ("community_id", "created_by_membership_id") REFERENCES "community_memberships"("community_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_community_id_created_by_membership_id_fkey" FOREIGN KEY ("community_id", "created_by_membership_id") REFERENCES "community_memberships"("community_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Mutable records use the shared numeric lifecycle contract.
ALTER TABLE "communities" ADD CONSTRAINT "communities_status_check" CHECK ("status" IN (1, 2, 3));
ALTER TABLE "users" ADD CONSTRAINT "users_status_check" CHECK ("status" IN (1, 2, 3));
ALTER TABLE "community_memberships" ADD CONSTRAINT "community_memberships_status_check" CHECK ("status" IN (1, 2, 3));
ALTER TABLE "community_positions" ADD CONSTRAINT "community_positions_status_check" CHECK ("status" IN (1, 2, 3));
ALTER TABLE "community_roles" ADD CONSTRAINT "community_roles_status_check" CHECK ("status" IN (1, 2, 3));
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_status_check" CHECK ("status" IN (1, 2, 3));
ALTER TABLE "platform_roles" ADD CONSTRAINT "platform_roles_status_check" CHECK ("status" IN (1, 2, 3));
ALTER TABLE "houses" ADD CONSTRAINT "houses_status_check" CHECK ("status" IN (1, 2, 3));
ALTER TABLE "residents" ADD CONSTRAINT "residents_status_check" CHECK ("status" IN (1, 2, 3));
ALTER TABLE "residencies" ADD CONSTRAINT "residencies_status_check" CHECK ("status" IN (1, 2, 3));
ALTER TABLE "financial_categories" ADD CONSTRAINT "financial_categories_status_check" CHECK ("status" IN (1, 2, 3));
ALTER TABLE "financial_reports" ADD CONSTRAINT "financial_reports_status_check" CHECK ("status" IN (1, 2, 3));
ALTER TABLE "financial_report_entries" ADD CONSTRAINT "financial_report_entries_status_check" CHECK ("status" IN (1, 2, 3));

-- Date, revision, amount, and immutable snapshot integrity.
ALTER TABLE "residencies" ADD CONSTRAINT "residencies_date_range_check" CHECK ("end_date" IS NULL OR "end_date" >= "start_date");
ALTER TABLE "financial_reports" ADD CONSTRAINT "financial_reports_period_check" CHECK ("period_end" >= "period_start");
ALTER TABLE "financial_reports" ADD CONSTRAINT "financial_reports_revision_number_check" CHECK ("revision_number" > 0);
ALTER TABLE "financial_report_entries" ADD CONSTRAINT "financial_report_entries_amount_minor_check" CHECK ("amount_minor" > 0);
ALTER TABLE "publications" ADD CONSTRAINT "publications_revision_number_check" CHECK ("revision_number" > 0);
ALTER TABLE "financial_report_publication_snapshots" ADD CONSTRAINT "financial_report_publication_snapshots_period_check" CHECK ("period_end" >= "period_start");
ALTER TABLE "financial_report_publication_snapshots" ADD CONSTRAINT "financial_report_publication_snapshots_schema_version_check" CHECK ("schema_version" > 0);
ALTER TABLE "financial_report_publication_snapshots" ADD CONSTRAINT "financial_report_publication_snapshots_income_total_check" CHECK ("income_total_minor" >= 0);
ALTER TABLE "financial_report_publication_snapshots" ADD CONSTRAINT "financial_report_publication_snapshots_expense_total_check" CHECK ("expense_total_minor" >= 0);
ALTER TABLE "financial_report_publication_snapshots" ADD CONSTRAINT "financial_report_publication_snapshots_balance_check" CHECK ("closing_balance_minor" = "opening_balance_minor" + "income_total_minor" - "expense_total_minor");
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actor_check" CHECK (
  ("actor_type" = 'HUMAN' AND "created_by_membership_id" IS NOT NULL)
  OR ("actor_type" = 'SYSTEM' AND "created_by_membership_id" IS NULL)
);

-- Assignment and residency history is append-only with one current row per relationship.
ALTER TABLE "membership_position_assignments" ADD CONSTRAINT "membership_position_assignments_revocation_check" CHECK ("revoked_date_time" IS NULL OR "revoked_date_time" >= "created_date_time");
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_revocation_check" CHECK ("revoked_date_time" IS NULL OR "revoked_date_time" >= "created_date_time");
ALTER TABLE "membership_roles" ADD CONSTRAINT "membership_roles_revocation_check" CHECK ("revoked_date_time" IS NULL OR "revoked_date_time" >= "created_date_time");
ALTER TABLE "user_platform_roles" ADD CONSTRAINT "user_platform_roles_revocation_check" CHECK ("revoked_date_time" IS NULL OR "revoked_date_time" >= "created_date_time");

CREATE UNIQUE INDEX "membership_position_assignments_active_key"
  ON "membership_position_assignments"("community_id", "membership_id", "position_id")
  WHERE "revoked_date_time" IS NULL;
CREATE UNIQUE INDEX "role_permissions_active_key"
  ON "role_permissions"("community_id", "role_id", "permission_id")
  WHERE "revoked_date_time" IS NULL;
CREATE UNIQUE INDEX "membership_roles_active_key"
  ON "membership_roles"("community_id", "membership_id", "role_id")
  WHERE "revoked_date_time" IS NULL;
CREATE UNIQUE INDEX "user_platform_roles_active_key"
  ON "user_platform_roles"("user_id", "platform_role_id")
  WHERE "revoked_date_time" IS NULL;
CREATE UNIQUE INDEX "residencies_active_resident_key"
  ON "residencies"("community_id", "resident_id")
  WHERE "status" = 1 AND "end_date" IS NULL;
