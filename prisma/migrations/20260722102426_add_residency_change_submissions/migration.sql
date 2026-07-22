-- CreateEnum
CREATE TYPE "residency_change_type" AS ENUM ('MOVE_IN', 'MOVE_OUT', 'CORRECTION');

-- CreateEnum
CREATE TYPE "residency_change_stage" AS ENUM ('SUBMITTED', 'APPROVED', 'REJECTED', 'APPLIED');

-- CreateTable
CREATE TABLE "residency_change_submissions" (
    "id" UUID NOT NULL,
    "community_id" UUID NOT NULL,
    "change_type" "residency_change_type" NOT NULL,
    "workflow_stage" "residency_change_stage" NOT NULL DEFAULT 'SUBMITTED',
    "resident_id" UUID,
    "residency_id" UUID,
    "house_id" UUID,
    "proposed_full_name" TEXT,
    "proposed_contact_phone" TEXT,
    "proposed_residency_type" "residency_type",
    "proposed_start_date" DATE,
    "proposed_end_date" DATE,
    "reason" TEXT,
    "private_review_note" TEXT,
    "submitted_by_membership_id" UUID NOT NULL,
    "reviewed_by_membership_id" UUID,
    "applied_by_membership_id" UUID,
    "reviewed_date_time" TIMESTAMPTZ(3),
    "applied_date_time" TIMESTAMPTZ(3),
    "status" SMALLINT NOT NULL DEFAULT 1,
    "created_by_membership_id" UUID NOT NULL,
    "updated_by_membership_id" UUID NOT NULL,
    "created_date_time" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date_time" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "residency_change_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "residency_change_submissions_community_id_workflow_stage_st_idx" ON "residency_change_submissions"("community_id", "workflow_stage", "status", "updated_date_time" DESC);

-- CreateIndex
CREATE INDEX "residency_change_submissions_community_id_resident_id_statu_idx" ON "residency_change_submissions"("community_id", "resident_id", "status");

-- CreateIndex
CREATE INDEX "residency_change_submissions_community_id_house_id_status_idx" ON "residency_change_submissions"("community_id", "house_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "residency_change_submissions_community_id_id_key" ON "residency_change_submissions"("community_id", "id");

-- AddForeignKey
ALTER TABLE "residency_change_submissions" ADD CONSTRAINT "residency_change_submissions_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "residency_change_submissions" ADD CONSTRAINT "residency_change_submissions_community_id_resident_id_fkey" FOREIGN KEY ("community_id", "resident_id") REFERENCES "residents"("community_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "residency_change_submissions" ADD CONSTRAINT "residency_change_submissions_community_id_residency_id_fkey" FOREIGN KEY ("community_id", "residency_id") REFERENCES "residencies"("community_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "residency_change_submissions" ADD CONSTRAINT "residency_change_submissions_community_id_house_id_fkey" FOREIGN KEY ("community_id", "house_id") REFERENCES "houses"("community_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "residency_change_submissions" ADD CONSTRAINT "residency_change_submissions_community_id_submitted_by_mem_fkey" FOREIGN KEY ("community_id", "submitted_by_membership_id") REFERENCES "community_memberships"("community_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "residency_change_submissions" ADD CONSTRAINT "residency_change_submissions_community_id_reviewed_by_memb_fkey" FOREIGN KEY ("community_id", "reviewed_by_membership_id") REFERENCES "community_memberships"("community_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "residency_change_submissions" ADD CONSTRAINT "residency_change_submissions_community_id_applied_by_membe_fkey" FOREIGN KEY ("community_id", "applied_by_membership_id") REFERENCES "community_memberships"("community_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "residency_change_submissions" ADD CONSTRAINT "residency_change_submissions_community_id_created_by_membe_fkey" FOREIGN KEY ("community_id", "created_by_membership_id") REFERENCES "community_memberships"("community_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "residency_change_submissions" ADD CONSTRAINT "residency_change_submissions_community_id_updated_by_membe_fkey" FOREIGN KEY ("community_id", "updated_by_membership_id") REFERENCES "community_memberships"("community_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
