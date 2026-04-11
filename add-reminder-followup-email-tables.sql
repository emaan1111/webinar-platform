-- ============================================================
-- Reminder & Follow-Up Email Templates + Tracking
-- ============================================================

-- Add reminderEmailSource to webinars table
ALTER TABLE "webinars" ADD COLUMN IF NOT EXISTS "reminderEmailSource" TEXT NOT NULL DEFAULT 'internal';

-- ─── Reminder Email Templates ───────────────────────────────

CREATE TABLE IF NOT EXISTS "reminder_email_templates" (
  "id"             TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "webinarId"      TEXT NOT NULL,
  "name"           TEXT NOT NULL DEFAULT 'Reminder',
  "subject"        TEXT NOT NULL,
  "htmlBody"       TEXT NOT NULL,
  "fromName"       TEXT,
  "minutesBefore"  INTEGER NOT NULL,
  "isActive"       BOOLEAN NOT NULL DEFAULT true,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "reminder_email_templates_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "reminder_email_templates_webinarId_fkey"
    FOREIGN KEY ("webinarId") REFERENCES "webinars"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "reminder_email_templates_webinarId_idx"
  ON "reminder_email_templates"("webinarId");
CREATE INDEX IF NOT EXISTS "reminder_email_templates_minutesBefore_idx"
  ON "reminder_email_templates"("minutesBefore");

-- ─── Reminder Email Sends ───────────────────────────────────

CREATE TABLE IF NOT EXISTS "reminder_email_sends" (
  "id"             TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "templateId"     TEXT NOT NULL,
  "registrationId" TEXT NOT NULL,
  "to"             TEXT NOT NULL,
  "subject"        TEXT NOT NULL,
  "status"         TEXT NOT NULL DEFAULT 'PENDING',
  "scheduledFor"   TIMESTAMPTZ,
  "sentAt"         TIMESTAMPTZ,
  "openedAt"       TIMESTAMPTZ,
  "clickedAt"      TIMESTAMPTZ,
  "openCount"      INTEGER NOT NULL DEFAULT 0,
  "clickCount"     INTEGER NOT NULL DEFAULT 0,
  "userAgent"      TEXT,
  "errorMessage"   TEXT,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "reminder_email_sends_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "reminder_email_sends_templateId_fkey"
    FOREIGN KEY ("templateId") REFERENCES "reminder_email_templates"("id") ON DELETE CASCADE,
  CONSTRAINT "reminder_email_sends_registrationId_fkey"
    FOREIGN KEY ("registrationId") REFERENCES "registrations"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "reminder_email_sends_templateId_idx"
  ON "reminder_email_sends"("templateId");
CREATE INDEX IF NOT EXISTS "reminder_email_sends_registrationId_idx"
  ON "reminder_email_sends"("registrationId");
CREATE INDEX IF NOT EXISTS "reminder_email_sends_status_scheduledFor_idx"
  ON "reminder_email_sends"("status", "scheduledFor");
CREATE INDEX IF NOT EXISTS "reminder_email_sends_sentAt_idx"
  ON "reminder_email_sends"("sentAt");

-- ─── Follow-Up Email Templates ──────────────────────────────

CREATE TABLE IF NOT EXISTS "followup_email_templates" (
  "id"             TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "webinarId"      TEXT NOT NULL,
  "name"           TEXT NOT NULL DEFAULT 'Follow-Up',
  "subject"        TEXT NOT NULL,
  "htmlBody"       TEXT NOT NULL,
  "fromName"       TEXT,
  "delayMinutes"   INTEGER NOT NULL,
  "audienceType"   TEXT NOT NULL DEFAULT 'all',
  "isActive"       BOOLEAN NOT NULL DEFAULT true,
  "sortOrder"      INTEGER NOT NULL DEFAULT 0,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "followup_email_templates_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "followup_email_templates_webinarId_fkey"
    FOREIGN KEY ("webinarId") REFERENCES "webinars"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "followup_email_templates_webinarId_idx"
  ON "followup_email_templates"("webinarId");
CREATE INDEX IF NOT EXISTS "followup_email_templates_audienceType_idx"
  ON "followup_email_templates"("audienceType");

-- ─── Follow-Up Email Sends ──────────────────────────────────

CREATE TABLE IF NOT EXISTS "followup_email_sends" (
  "id"             TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "templateId"     TEXT NOT NULL,
  "registrationId" TEXT NOT NULL,
  "to"             TEXT NOT NULL,
  "subject"        TEXT NOT NULL,
  "status"         TEXT NOT NULL DEFAULT 'PENDING',
  "scheduledFor"   TIMESTAMPTZ,
  "sentAt"         TIMESTAMPTZ,
  "openedAt"       TIMESTAMPTZ,
  "clickedAt"      TIMESTAMPTZ,
  "openCount"      INTEGER NOT NULL DEFAULT 0,
  "clickCount"     INTEGER NOT NULL DEFAULT 0,
  "userAgent"      TEXT,
  "errorMessage"   TEXT,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "followup_email_sends_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "followup_email_sends_templateId_fkey"
    FOREIGN KEY ("templateId") REFERENCES "followup_email_templates"("id") ON DELETE CASCADE,
  CONSTRAINT "followup_email_sends_registrationId_fkey"
    FOREIGN KEY ("registrationId") REFERENCES "registrations"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "followup_email_sends_templateId_idx"
  ON "followup_email_sends"("templateId");
CREATE INDEX IF NOT EXISTS "followup_email_sends_registrationId_idx"
  ON "followup_email_sends"("registrationId");
CREATE INDEX IF NOT EXISTS "followup_email_sends_status_scheduledFor_idx"
  ON "followup_email_sends"("status", "scheduledFor");
CREATE INDEX IF NOT EXISTS "followup_email_sends_sentAt_idx"
  ON "followup_email_sends"("sentAt");

-- ─── Extend EmailTrackingEvent for new email types ──────────

ALTER TABLE "email_tracking_events" ADD COLUMN IF NOT EXISTS "emailType" TEXT NOT NULL DEFAULT 'confirmation';
ALTER TABLE "email_tracking_events" ADD COLUMN IF NOT EXISTS "reminderEmailSendId" TEXT;
ALTER TABLE "email_tracking_events" ADD COLUMN IF NOT EXISTS "followUpEmailSendId" TEXT;

-- Make sendId nullable for new email types (existing rows keep their sendId)
ALTER TABLE "email_tracking_events" ALTER COLUMN "sendId" DROP NOT NULL;

ALTER TABLE "email_tracking_events"
  ADD CONSTRAINT "email_tracking_events_reminderEmailSendId_fkey"
    FOREIGN KEY ("reminderEmailSendId") REFERENCES "reminder_email_sends"("id") ON DELETE CASCADE;

ALTER TABLE "email_tracking_events"
  ADD CONSTRAINT "email_tracking_events_followUpEmailSendId_fkey"
    FOREIGN KEY ("followUpEmailSendId") REFERENCES "followup_email_sends"("id") ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS "email_tracking_events_reminderEmailSendId_idx"
  ON "email_tracking_events"("reminderEmailSendId");
CREATE INDEX IF NOT EXISTS "email_tracking_events_followUpEmailSendId_idx"
  ON "email_tracking_events"("followUpEmailSendId");
