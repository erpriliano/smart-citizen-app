ALTER TABLE "residency_change_submissions"
  ADD CONSTRAINT "residency_change_submissions_status_check"
  CHECK ("status" IN (1, 2, 3));

ALTER TABLE "residency_change_submissions"
  ADD CONSTRAINT "residency_change_submissions_review_time_check"
  CHECK ("reviewed_date_time" IS NULL OR "reviewed_date_time" >= "created_date_time");

ALTER TABLE "residency_change_submissions"
  ADD CONSTRAINT "residency_change_submissions_apply_time_check"
  CHECK (
    "applied_date_time" IS NULL
    OR "applied_date_time" >= COALESCE("reviewed_date_time", "created_date_time")
  );
