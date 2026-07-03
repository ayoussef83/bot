-- Operating model gap closure (GAP_ANALYSIS_OPERATING_MODEL.md B1-B4)

CREATE TYPE "OnboardingStatus" AS ENUM ('pending_payment','paid_unverified','onboarded');
CREATE TYPE "RenewalStage" AS ENUM ('due','reminder_sent','negotiating','renewed','lost');
CREATE TYPE "ChurnReason" AS ENUM ('price','schedule','exams','moved','dissatisfied','other');
CREATE TYPE "ProgressReportStatus" AS ENUM ('draft','approved','published');
CREATE TYPE "PortfolioItemType" AS ENUM ('certificate','project_photo','note');
CREATE TYPE "SlotRequestStatus" AS ENUM ('open','matched','closed');
CREATE TYPE "AuditFlagType" AS ENUM ('unpaid_booking','incomplete_profile','missing_attendance');
CREATE TYPE "AuditFlagStatus" AS ENUM ('open','resolved');

ALTER TABLE "student_enrollments"
  ADD COLUMN "sessionsPlanned" INTEGER NOT NULL DEFAULT 12,
  ADD COLUMN "roundNo" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "renewalDate" TIMESTAMP(3),
  ADD COLUMN "onboardingStatus" "OnboardingStatus" NOT NULL DEFAULT 'pending_payment',
  ADD COLUMN "onboardedAt" TIMESTAMP(3),
  ADD COLUMN "onboardedById" TEXT;

ALTER TABLE "session_reports"
  ADD COLUMN "topicCovered" TEXT,
  ADD COLUMN "homework" TEXT;

CREATE TABLE "renewal_cases" (
  "id" TEXT NOT NULL,
  "enrollmentId" TEXT NOT NULL,
  "roundNo" INTEGER NOT NULL,
  "dueDate" TIMESTAMP(3) NOT NULL,
  "stage" "RenewalStage" NOT NULL DEFAULT 'due',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "lastContactAt" TIMESTAMP(3),
  "instructorRecommendation" TEXT,
  "churnReason" "ChurnReason",
  "churnNotes" TEXT,
  "ownerId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "renewal_cases_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "renewal_cases_enrollmentId_roundNo_key" ON "renewal_cases"("enrollmentId","roundNo");
CREATE INDEX "renewal_cases_stage_idx" ON "renewal_cases"("stage");
CREATE INDEX "renewal_cases_dueDate_idx" ON "renewal_cases"("dueDate");
ALTER TABLE "renewal_cases" ADD CONSTRAINT "renewal_cases_enrollmentId_fkey"
  FOREIGN KEY ("enrollmentId") REFERENCES "student_enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "progress_reports" (
  "id" TEXT NOT NULL,
  "enrollmentId" TEXT NOT NULL,
  "milestone" INTEGER NOT NULL,
  "content" TEXT NOT NULL,
  "strengths" TEXT,
  "nextFocus" TEXT,
  "status" "ProgressReportStatus" NOT NULL DEFAULT 'draft',
  "authorId" TEXT NOT NULL,
  "approvedById" TEXT,
  "approvedAt" TIMESTAMP(3),
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "progress_reports_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "progress_reports_enrollmentId_milestone_key" ON "progress_reports"("enrollmentId","milestone");
CREATE INDEX "progress_reports_status_idx" ON "progress_reports"("status");
ALTER TABLE "progress_reports" ADD CONSTRAINT "progress_reports_enrollmentId_fkey"
  FOREIGN KEY ("enrollmentId") REFERENCES "student_enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "portfolio_items" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "type" "PortfolioItemType" NOT NULL,
  "url" TEXT,
  "caption" TEXT,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "portfolio_items_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "portfolio_items_studentId_idx" ON "portfolio_items"("studentId");

CREATE TABLE "slot_requests" (
  "id" TEXT NOT NULL,
  "parentId" TEXT,
  "studentId" TEXT,
  "courseId" TEXT NOT NULL,
  "courseLevelId" TEXT,
  "preferredDay" INTEGER,
  "timeWindow" TEXT,
  "location" "Location",
  "notes" TEXT,
  "status" "SlotRequestStatus" NOT NULL DEFAULT 'open',
  "matchedClassId" TEXT,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "slot_requests_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "slot_requests_status_idx" ON "slot_requests"("status");
CREATE INDEX "slot_requests_courseId_courseLevelId_idx" ON "slot_requests"("courseId","courseLevelId");

CREATE TABLE "audit_flags" (
  "id" TEXT NOT NULL,
  "type" "AuditFlagType" NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "status" "AuditFlagStatus" NOT NULL DEFAULT 'open',
  "resolvedById" TEXT,
  "resolvedAt" TIMESTAMP(3),
  "resolutionNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_flags_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "audit_flags_type_entityType_entityId_status_key" ON "audit_flags"("type","entityType","entityId","status");
CREATE INDEX "audit_flags_status_idx" ON "audit_flags"("status");
CREATE INDEX "audit_flags_type_idx" ON "audit_flags"("type");
