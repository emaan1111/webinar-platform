-- Add A/B testing, smart skip, and auto-resend fields to email templates and sends

-- Reminder Email Templates: A/B testing + smart skip + auto-resend
ALTER TABLE "reminder_email_templates" ADD COLUMN IF NOT EXISTS "subjectB" TEXT;
ALTER TABLE "reminder_email_templates" ADD COLUMN IF NOT EXISTS "skipIfJoined" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "reminder_email_templates" ADD COLUMN IF NOT EXISTS "resendToNonOpeners" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "reminder_email_templates" ADD COLUMN IF NOT EXISTS "resendAfterHours" INTEGER;
ALTER TABLE "reminder_email_templates" ADD COLUMN IF NOT EXISTS "resendSubject" TEXT;

-- Reminder Email Sends: A/B variant tracking + resend flag
ALTER TABLE "reminder_email_sends" ADD COLUMN IF NOT EXISTS "abVariant" TEXT NOT NULL DEFAULT 'A';
ALTER TABLE "reminder_email_sends" ADD COLUMN IF NOT EXISTS "isResend" BOOLEAN NOT NULL DEFAULT false;

-- Follow-Up Email Templates: A/B testing + smart skip + auto-resend
ALTER TABLE "followup_email_templates" ADD COLUMN IF NOT EXISTS "subjectB" TEXT;
ALTER TABLE "followup_email_templates" ADD COLUMN IF NOT EXISTS "skipIfPurchased" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "followup_email_templates" ADD COLUMN IF NOT EXISTS "resendToNonOpeners" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "followup_email_templates" ADD COLUMN IF NOT EXISTS "resendAfterHours" INTEGER;
ALTER TABLE "followup_email_templates" ADD COLUMN IF NOT EXISTS "resendSubject" TEXT;

-- Follow-Up Email Sends: A/B variant tracking + resend flag
ALTER TABLE "followup_email_sends" ADD COLUMN IF NOT EXISTS "abVariant" TEXT NOT NULL DEFAULT 'A';
ALTER TABLE "followup_email_sends" ADD COLUMN IF NOT EXISTS "isResend" BOOLEAN NOT NULL DEFAULT false;
