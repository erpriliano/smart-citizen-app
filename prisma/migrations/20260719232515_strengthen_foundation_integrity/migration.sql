/*
  Warnings:

  - A unique constraint covering the columns `[community_id,id,entry_type]` on the table `financial_categories` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[community_id,period_start,period_end,id]` on the table `financial_reports` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[community_id,period_start,period_end,supersedes_report_id]` on the table `financial_reports` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[community_id,membership_id,id]` on the table `membership_position_assignments` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[community_id,series_id,id]` on the table `publications` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[community_id,series_id,supersedes_publication_id]` on the table `publications` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[community_id,publication_type,series_id,revision_number]` on the table `publications` will be added. If there are existing duplicate values, this will fail.
  - The required column `series_id` was added to the `publications` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- DropForeignKey
ALTER TABLE "financial_report_approvals" DROP CONSTRAINT "financial_report_approvals_community_id_position_assignmen_fkey";

-- DropForeignKey
ALTER TABLE "financial_report_entries" DROP CONSTRAINT "financial_report_entries_community_id_category_id_fkey";

-- DropForeignKey
ALTER TABLE "financial_reports" DROP CONSTRAINT "financial_reports_community_id_supersedes_report_id_fkey";

-- DropForeignKey
ALTER TABLE "publications" DROP CONSTRAINT "publications_community_id_supersedes_publication_id_fkey";

-- DropIndex
DROP INDEX "financial_reports_community_id_supersedes_report_id_key";

-- DropIndex
DROP INDEX "publications_community_id_publication_type_revision_number_key";

-- DropIndex
DROP INDEX "publications_community_id_supersedes_publication_id_key";

-- AlterTable
ALTER TABLE "publications" ADD COLUMN     "series_id" UUID NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "financial_categories_community_id_id_entry_type_key" ON "financial_categories"("community_id", "id", "entry_type");

-- CreateIndex
CREATE UNIQUE INDEX "financial_reports_community_id_period_start_period_end_id_key" ON "financial_reports"("community_id", "period_start", "period_end", "id");

-- CreateIndex
CREATE UNIQUE INDEX "financial_reports_community_id_period_start_period_end_supe_key" ON "financial_reports"("community_id", "period_start", "period_end", "supersedes_report_id");

-- CreateIndex
CREATE UNIQUE INDEX "membership_position_assignments_community_id_membership_id__key" ON "membership_position_assignments"("community_id", "membership_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "publications_community_id_series_id_id_key" ON "publications"("community_id", "series_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "publications_community_id_series_id_supersedes_publication__key" ON "publications"("community_id", "series_id", "supersedes_publication_id");

-- CreateIndex
CREATE UNIQUE INDEX "publications_community_id_publication_type_series_id_revisi_key" ON "publications"("community_id", "publication_type", "series_id", "revision_number");

-- RenameForeignKey
ALTER TABLE "financial_report_approvals" RENAME CONSTRAINT "financial_report_approvals_community_id_created_by_members_fkey" TO "financial_approvals_created_by_fkey";

-- AddForeignKey
ALTER TABLE "financial_reports" ADD CONSTRAINT "financial_reports_community_id_period_start_period_end_sup_fkey" FOREIGN KEY ("community_id", "period_start", "period_end", "supersedes_report_id") REFERENCES "financial_reports"("community_id", "period_start", "period_end", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_report_entries" ADD CONSTRAINT "financial_report_entries_community_id_category_id_entry_ty_fkey" FOREIGN KEY ("community_id", "category_id", "entry_type") REFERENCES "financial_categories"("community_id", "id", "entry_type") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_report_approvals" ADD CONSTRAINT "financial_approvals_position_actor_fkey" FOREIGN KEY ("community_id", "created_by_membership_id", "position_assignment_id") REFERENCES "membership_position_assignments"("community_id", "membership_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publications" ADD CONSTRAINT "publications_community_id_series_id_supersedes_publication_fkey" FOREIGN KEY ("community_id", "series_id", "supersedes_publication_id") REFERENCES "publications"("community_id", "series_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
