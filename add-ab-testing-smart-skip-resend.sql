-- Add A/B testing, smart skip, and auto-resend fields to email templates and sends

-- Reminder Email Templates: A/B testing + smart skip + auto-resend
ALTER TABLE "reminder_email_templates" ADD COLUMN IF NOT EXISTS "subject_b" TEXT;
ALTER TABLE "reminder_email_templates" ADD COLUMN IF NOT EXISTS "skip_if_joined" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "reminder_email_templates" ADD COLUMN IF NOT EXISTS "resend_to_non_openers" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "reminder_email_templates" ADD COLUMN IF NOT EXISTS "resend_after_hours" INTEGER;
ALTER TABLE "reminder_email_templates" ADD COLUMN IF NOT EXISTS "resend_subject" TEXT;

-- Reminder Email Sends: A/B variant tracking + resend flag
ALTER TABLE "reminder_email_sends" ADD COLUMN IF NOT EXISTS "ab_variant" TEXT NOT NULL DEFAULT 'A';
ALTER TABLE "reminder_email_sends" ADD COLUMN IF NOT EXISTS "is_resend" BOOLEAN NOT NULL DEFAULT false;

-- Follow-Up Email Templates: A/B testing + smart skip + auto-resend
ALTER TABLE "followup_email_templates" ADD COLUMN IF NOT EXISTS "subject_b" TEXT;
ALTER TABLE "followup_email_templates" ADD COLUMN IF NOT EXISTS "skip_if_purchased" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "followup_email_templates" ADD COLUMN IF NOT EXISTS "resend_to_non_openers" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "followup_email_templates" ADD COLUMN IF NOT EXISTS "resend_after_hours" INTEGER;
ALTER TABLE "followup_email_templates" ADD COLUMN IF NOT EXISTS "resend_subject" TEXT;

-- Follow-Up Email Sends: A/B variant tracking + resend flag
ALTER TABLE "followup_email_sends" ADD COLUMN IF NOT EXISTS "ab_variant" TEXT NOT NULL DEFAULT 'A';
ALTER TABLE "followup_email_sends" ADD COLUMN IF NOT EXISTS "is_resend" BOOLEAN NOT NULL DEFAULT false;
