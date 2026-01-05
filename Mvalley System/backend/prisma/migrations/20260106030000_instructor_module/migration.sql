-- Instructor module tables

-- CreateEnum
CREATE TYPE "InstructorSkillLevel" AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');

-- CreateEnum
CREATE TYPE "InstructorCostModelType" AS ENUM ('hourly', 'per_session', 'monthly');

-- CreateEnum
CREATE TYPE "InstructorPayrollStatus" AS ENUM ('draft', 'approved', 'paid', 'void');

-- CreateTable
CREATE TABLE "instructor_skills" (
    "id" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" "InstructorSkillLevel" NOT NULL DEFAULT 'beginner',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "instructor_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instructor_contracts" (
    "id" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "contractType" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "terms" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "instructor_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instructor_availabilities" (
    "id" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "location" "Location",
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "instructor_availabilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instructor_blackout_dates" (
    "id" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "instructor_blackout_dates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instructor_cost_models" (
    "id" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "type" "InstructorCostModelType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EGP',
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "instructor_cost_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instructor_sessions" (
    "id" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "costModelId" TEXT,
    "costAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'EGP',
    "durationMinutes" INTEGER NOT NULL DEFAULT 0,
    "attendanceComplete" BOOLEAN NOT NULL DEFAULT false,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payrollId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "instructor_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instructor_payrolls" (
    "id" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "periodYear" INTEGER NOT NULL,
    "periodMonth" INTEGER NOT NULL,
    "status" "InstructorPayrollStatus" NOT NULL DEFAULT 'draft',
    "currency" TEXT NOT NULL DEFAULT 'EGP',
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "snapshot" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generatedBy" TEXT NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "paidAt" TIMESTAMP(3),
    "paidBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "instructor_payrolls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instructor_feedback_summaries" (
    "id" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "periodYear" INTEGER NOT NULL,
    "periodMonth" INTEGER NOT NULL,
    "avgRating" DOUBLE PRECISION,
    "totalFeedback" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "instructor_feedback_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instructor_documents" (
    "id" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "instructor_documents_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "instructor_skills_instructorId_idx" ON "instructor_skills"("instructorId");
CREATE INDEX "instructor_skills_name_idx" ON "instructor_skills"("name");

CREATE INDEX "instructor_contracts_instructorId_idx" ON "instructor_contracts"("instructorId");
CREATE INDEX "instructor_contracts_startDate_idx" ON "instructor_contracts"("startDate");
CREATE INDEX "instructor_contracts_endDate_idx" ON "instructor_contracts"("endDate");

CREATE INDEX "instructor_availabilities_instructorId_idx" ON "instructor_availabilities"("instructorId");
CREATE INDEX "instructor_availabilities_dayOfWeek_idx" ON "instructor_availabilities"("dayOfWeek");
CREATE INDEX "instructor_availabilities_location_idx" ON "instructor_availabilities"("location");

CREATE INDEX "instructor_blackout_dates_instructorId_idx" ON "instructor_blackout_dates"("instructorId");
CREATE INDEX "instructor_blackout_dates_startDate_idx" ON "instructor_blackout_dates"("startDate");
CREATE INDEX "instructor_blackout_dates_endDate_idx" ON "instructor_blackout_dates"("endDate");

CREATE INDEX "instructor_cost_models_instructorId_idx" ON "instructor_cost_models"("instructorId");
CREATE INDEX "instructor_cost_models_effectiveFrom_idx" ON "instructor_cost_models"("effectiveFrom");
CREATE INDEX "instructor_cost_models_effectiveTo_idx" ON "instructor_cost_models"("effectiveTo");

CREATE UNIQUE INDEX "instructor_sessions_sessionId_key" ON "instructor_sessions"("sessionId");
CREATE INDEX "instructor_sessions_instructorId_idx" ON "instructor_sessions"("instructorId");
CREATE INDEX "instructor_sessions_sessionId_idx" ON "instructor_sessions"("sessionId");
CREATE INDEX "instructor_sessions_payrollId_idx" ON "instructor_sessions"("payrollId");
CREATE INDEX "instructor_sessions_calculatedAt_idx" ON "instructor_sessions"("calculatedAt");

CREATE INDEX "instructor_payrolls_instructorId_idx" ON "instructor_payrolls"("instructorId");
CREATE INDEX "instructor_payrolls_periodYear_periodMonth_idx" ON "instructor_payrolls"("periodYear", "periodMonth");
CREATE UNIQUE INDEX "instructor_payrolls_instructorId_periodYear_periodMonth_key" ON "instructor_payrolls"("instructorId", "periodYear", "periodMonth");

CREATE INDEX "instructor_feedback_summaries_instructorId_idx" ON "instructor_feedback_summaries"("instructorId");
CREATE INDEX "instructor_feedback_summaries_periodYear_periodMonth_idx" ON "instructor_feedback_summaries"("periodYear", "periodMonth");
CREATE UNIQUE INDEX "instructor_feedback_summaries_instructorId_periodYear_perio_key" ON "instructor_feedback_summaries"("instructorId", "periodYear", "periodMonth");

CREATE INDEX "instructor_documents_instructorId_idx" ON "instructor_documents"("instructorId");
CREATE INDEX "instructor_documents_expiresAt_idx" ON "instructor_documents"("expiresAt");

ALTER TABLE "instructor_skills" ADD CONSTRAINT "instructor_skills_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "instructors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "instructor_contracts" ADD CONSTRAINT "instructor_contracts_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "instructors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "instructor_availabilities" ADD CONSTRAINT "instructor_availabilities_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "instructors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "instructor_blackout_dates" ADD CONSTRAINT "instructor_blackout_dates_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "instructors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "instructor_cost_models" ADD CONSTRAINT "instructor_cost_models_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "instructors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "instructor_sessions" ADD CONSTRAINT "instructor_sessions_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "instructors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "instructor_sessions" ADD CONSTRAINT "instructor_sessions_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "instructor_sessions" ADD CONSTRAINT "instructor_sessions_costModelId_fkey" FOREIGN KEY ("costModelId") REFERENCES "instructor_cost_models"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "instructor_sessions" ADD CONSTRAINT "instructor_sessions_payrollId_fkey" FOREIGN KEY ("payrollId") REFERENCES "instructor_payrolls"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "instructor_payrolls" ADD CONSTRAINT "instructor_payrolls_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "instructors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "instructor_feedback_summaries" ADD CONSTRAINT "instructor_feedback_summaries_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "instructors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "instructor_documents" ADD CONSTRAINT "instructor_documents_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "instructors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


