-- Add post-session SMS configuration to webinars table
ALTER TABLE "webinars" 
ADD COLUMN "autoSendPostSessionSMS" BOOLEAN DEFAULT false,
ADD COLUMN "postSessionSMSMinutesAfter" INTEGER DEFAULT 0,
ADD COLUMN "postSessionSMSMinWatchedMinutes" INTEGER,
ADD COLUMN "postSessionSMSMinWatchedPercentage" INTEGER,
ADD COLUMN "postSessionSMSBody" TEXT;

-- Add tracking field to registrations to prevent duplicate SMS
ALTER TABLE "registrations"
ADD COLUMN "postSessionSmsSent" BOOLEAN DEFAULT false,
ADD COLUMN "postSessionSmsSentAt" TIMESTAMP(3);

-- Create index for efficient querying
CREATE INDEX "registrations_post_sms_idx" ON "registrations" ("postSessionSmsSent", "scheduledStartTime");

-- Add comments
COMMENT ON COLUMN "webinars"."autoSendPostSessionSMS" IS 'Enable automatic post-session SMS sending';
COMMENT ON COLUMN "webinars"."postSessionSMSMinutesAfter" IS 'Minutes after session ends to send SMS (0 = immediately)';
COMMENT ON COLUMN "webinars"."postSessionSMSMinWatchedMinutes" IS 'Minimum minutes watched to qualify for SMS (null = no minimum)';
COMMENT ON COLUMN "webinars"."postSessionSMSMinWatchedPercentage" IS 'Minimum percentage watched to qualify for SMS (null = no minimum)';
COMMENT ON COLUMN "webinars"."postSessionSMSBody" IS 'SMS message template with placeholders: {name}, {webinar_title}';
COMMENT ON COLUMN "registrations"."postSessionSmsSent" IS 'Whether post-session SMS was sent to this registration';
COMMENT ON COLUMN "registrations"."postSessionSmsSentAt" IS 'When post-session SMS was sent';
