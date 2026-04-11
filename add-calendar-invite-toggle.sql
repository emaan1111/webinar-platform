-- Add sendCalendarInvite toggle to webinars table
-- Defaults to true so existing webinars will send calendar invites
ALTER TABLE webinars ADD COLUMN IF NOT EXISTS "sendCalendarInvite" BOOLEAN NOT NULL DEFAULT true;
