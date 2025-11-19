-- Add missing columns to webinar_reminder_templates
ALTER TABLE "webinar_reminder_templates"
ADD COLUMN IF NOT EXISTS "isPostWebinar" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "watchTargetType" "ReminderWatchTargetType" NOT NULL DEFAULT 'ANY',
ADD COLUMN IF NOT EXISTS "watchTargetSeconds" INTEGER;
