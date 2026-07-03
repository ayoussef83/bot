-- DB_AUDIT fixes (2026-07-03): A1 (enum values), A3 (session reports), A4 (push/OTP),
-- B4 (session room FK), B5 (typed statuses), B7 (attendance audit)

-- A1: extend Location enum with real operating locations
ALTER TYPE "Location" ADD VALUE IF NOT EXISTS 'DOKKI';
ALTER TYPE "Location" ADD VALUE IF NOT EXISTS 'Maadi';
ALTER TYPE "Location" ADD VALUE IF NOT EXISTS 'Online';

-- B5: typed statuses
CREATE TYPE "SessionStatus" AS ENUM ('scheduled', 'completed', 'cancelled');
CREATE TYPE "EnrollmentStatus" AS ENUM ('active', 'paused', 'completed');

-- sessions.status: text -> enum (values already match)
ALTER TABLE "sessions"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "SessionStatus" USING ("status"::"SessionStatus"),
  ALTER COLUMN "status" SET DEFAULT 'scheduled';

-- student_enrollments.status: text -> enum
ALTER TABLE "student_enrollments"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "EnrollmentStatus" USING ("status"::"EnrollmentStatus"),
  ALTER COLUMN "status" SET DEFAULT 'active';

-- B4: typed room override on sessions (legacy "room" text column kept, read-only)
ALTER TABLE "sessions" ADD COLUMN "roomId" TEXT;
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_roomId_fkey"
  FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- B7: attendance audit trail
ALTER TABLE "session_attendances" ADD COLUMN "markedById" TEXT;
ALTER TABLE "session_attendances" ADD COLUMN "markedAt" TIMESTAMP(3);

-- A3: session reports
CREATE TYPE "ReportRating" AS ENUM ('needs_improvement', 'good', 'excellent');

CREATE TABLE "session_reports" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "engagementLevel" INTEGER NOT NULL,
    "clarityRating" "ReportRating" NOT NULL,
    "paceRating" "ReportRating" NOT NULL,
    "activitiesRating" "ReportRating" NOT NULL,
    "difficultyRating" "ReportRating" NOT NULL,
    "materialSuitability" INTEGER NOT NULL,
    "issues" TEXT,
    "followUps" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "session_reports_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "session_reports_sessionId_key" ON "session_reports"("sessionId");
CREATE INDEX "session_reports_instructorId_idx" ON "session_reports"("instructorId");
CREATE INDEX "session_reports_submittedAt_idx" ON "session_reports"("submittedAt");

ALTER TABLE "session_reports" ADD CONSTRAINT "session_reports_sessionId_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "session_reports" ADD CONSTRAINT "session_reports_instructorId_fkey"
  FOREIGN KEY ("instructorId") REFERENCES "instructors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- A4: push channel + devices + OTP
ALTER TYPE "NotificationChannel" ADD VALUE IF NOT EXISTS 'push';

CREATE TYPE "PushPlatform" AS ENUM ('ios', 'android');

CREATE TABLE "push_devices" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" "PushPlatform" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "push_devices_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "push_devices_token_key" ON "push_devices"("token");
CREATE INDEX "push_devices_userId_idx" ON "push_devices"("userId");
CREATE INDEX "push_devices_isActive_idx" ON "push_devices"("isActive");

ALTER TABLE "push_devices" ADD CONSTRAINT "push_devices_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "otp_codes" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "purpose" TEXT NOT NULL DEFAULT 'login',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "otp_codes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "otp_codes_phone_purpose_idx" ON "otp_codes"("phone", "purpose");
CREATE INDEX "otp_codes_expiresAt_idx" ON "otp_codes"("expiresAt");
