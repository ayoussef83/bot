-- Add payer fields to payments to support mandatory linkage:
-- - payerType: "student" | "school"
-- - schoolName: required when payerType = "school"

ALTER TABLE "payments"
ADD COLUMN     "payerType" TEXT NOT NULL DEFAULT 'student',
ADD COLUMN     "schoolName" TEXT;

CREATE INDEX "payments_payerType_idx" ON "payments"("payerType");


