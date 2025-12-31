-- CreateEnum
CREATE TYPE "IntegrationProvider" AS ENUM ('zoho_email', 'smsmisr');

-- CreateEnum
CREATE TYPE "MessageChannel" AS ENUM ('email', 'sms');

-- CreateTable
CREATE TABLE "integration_configs" (
    "id" TEXT NOT NULL,
    "provider" "IntegrationProvider" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB,
    "secrets" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integration_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_templates" (
    "id" TEXT NOT NULL,
    "channel" "MessageChannel" NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "message_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "integration_configs_provider_key" ON "integration_configs"("provider");

-- CreateIndex
CREATE INDEX "message_templates_channel_isActive_idx" ON "message_templates"("channel", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "message_templates_channel_key_key" ON "message_templates"("channel", "key");
