-- Add mostlyAttendedThreshold field to Webinar model
-- This allows admins to set a custom timestamp (in seconds) where users who watch past it get the MOSTLY_ATTENDED tag

ALTER TABLE "webinars" 
ADD COLUMN IF NOT EXISTS "mostlyAttendedThreshold" INTEGER;

COMMENT ON COLUMN "webinars"."mostlyAttendedThreshold" IS 'Timestamp in seconds - users who watch past this get MOSTLY_ATTENDED tag. If null, only ATTENDED tag is applied.';
