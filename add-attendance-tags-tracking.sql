-- Add attendance tags tracking fields to Registration model
-- Prevents duplicate tagging when users leave and rejoin

ALTER TABLE "registrations" 
ADD COLUMN IF NOT EXISTS "attendanceTagsApplied" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "attendanceTagsAppliedAt" TIMESTAMP(3);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS "registrations_attendance_tagging_idx" 
ON "registrations" ("attendanceTagsApplied", "scheduledStartTime") 
WHERE "attendanceTagsApplied" = false AND "scheduledStartTime" IS NOT NULL;

COMMENT ON COLUMN "registrations"."attendanceTagsApplied" IS 'Whether ClickFunnels attendance tags have been applied for this registration';
COMMENT ON COLUMN "registrations"."attendanceTagsAppliedAt" IS 'When attendance tags were applied';
