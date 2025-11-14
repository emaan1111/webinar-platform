-- Add Reminder System Tables
-- This script safely adds the reminder tables to your existing database

-- Create enums if they don't exist
DO $$ BEGIN
    CREATE TYPE "ReminderStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'CANCELLED', 'SKIPPED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ReminderChannel" AS ENUM ('EMAIL', 'SMS', 'BOTH');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create webinar_reminder_templates table
CREATE TABLE IF NOT EXISTS "webinar_reminder_templates" (
    "id" TEXT NOT NULL,
    "webinarId" TEXT NOT NULL,
    "minutesBefore" INTEGER NOT NULL,
    "channel" "ReminderChannel" NOT NULL DEFAULT 'EMAIL',
    "emailSubject" TEXT NOT NULL DEFAULT 'Your webinar starts soon!',
    "emailBody" TEXT NOT NULL,
    "smsBody" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webinar_reminder_templates_pkey" PRIMARY KEY ("id")
);

-- Create webinar_reminders_sent table
CREATE TABLE IF NOT EXISTS "webinar_reminders_sent" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "status" "ReminderStatus" NOT NULL DEFAULT 'PENDING',
    "channel" "ReminderChannel" NOT NULL DEFAULT 'EMAIL',
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "lastRetryAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webinar_reminders_sent_pkey" PRIMARY KEY ("id")
);

-- Create indexes for webinar_reminder_templates
CREATE INDEX IF NOT EXISTS "webinar_reminder_templates_webinarId_idx" ON "webinar_reminder_templates"("webinarId");
CREATE INDEX IF NOT EXISTS "webinar_reminder_templates_minutesBefore_idx" ON "webinar_reminder_templates"("minutesBefore");

-- Create indexes for webinar_reminders_sent
CREATE INDEX IF NOT EXISTS "webinar_reminders_sent_templateId_idx" ON "webinar_reminders_sent"("templateId");
CREATE INDEX IF NOT EXISTS "webinar_reminders_sent_registrationId_idx" ON "webinar_reminders_sent"("registrationId");
CREATE INDEX IF NOT EXISTS "webinar_reminders_sent_scheduledFor_idx" ON "webinar_reminders_sent"("scheduledFor");
CREATE INDEX IF NOT EXISTS "webinar_reminders_sent_status_idx" ON "webinar_reminders_sent"("status");
CREATE INDEX IF NOT EXISTS "webinar_reminders_sent_status_scheduledFor_idx" ON "webinar_reminders_sent"("status", "scheduledFor");

-- Add foreign key constraints
ALTER TABLE "webinar_reminder_templates"
    DROP CONSTRAINT IF EXISTS "webinar_reminder_templates_webinarId_fkey",
    ADD CONSTRAINT "webinar_reminder_templates_webinarId_fkey" 
    FOREIGN KEY ("webinarId") REFERENCES "webinars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "webinar_reminders_sent"
    DROP CONSTRAINT IF EXISTS "webinar_reminders_sent_templateId_fkey",
    ADD CONSTRAINT "webinar_reminders_sent_templateId_fkey" 
    FOREIGN KEY ("templateId") REFERENCES "webinar_reminder_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "webinar_reminders_sent"
    DROP CONSTRAINT IF EXISTS "webinar_reminders_sent_registrationId_fkey",
    ADD CONSTRAINT "webinar_reminders_sent_registrationId_fkey" 
    FOREIGN KEY ("registrationId") REFERENCES "registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Success message
SELECT 'Reminder system tables created successfully!' as message;
