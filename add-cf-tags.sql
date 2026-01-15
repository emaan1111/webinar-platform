-- Add ClickFunnels Custom Tags columns to webinars table
ALTER TABLE "webinars" 
ADD COLUMN IF NOT EXISTS "registrationTag" TEXT,
ADD COLUMN IF NOT EXISTS "attendedTag" TEXT,
ADD COLUMN IF NOT EXISTS "mostlyAttendedTag" TEXT,
ADD COLUMN IF NOT EXISTS "partlyAttendedTag" TEXT,
ADD COLUMN IF NOT EXISTS "missedTag" TEXT,
ADD COLUMN IF NOT EXISTS "replayAttendedTag" TEXT;
