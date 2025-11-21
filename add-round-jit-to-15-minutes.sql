-- Add roundJITTo15Minutes column to webinars table
-- This allows users to enable/disable 15-minute rounding for Just-In-Time schedules

ALTER TABLE webinars 
ADD COLUMN IF NOT EXISTS "roundJITTo15Minutes" BOOLEAN NOT NULL DEFAULT true;

-- Update existing webinars to have rounding enabled (current behavior)
UPDATE webinars 
SET "roundJITTo15Minutes" = true 
WHERE "roundJITTo15Minutes" IS NULL;
