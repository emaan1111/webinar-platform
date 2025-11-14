-- Add ClickFunnels integration fields to reminder templates

ALTER TABLE webinar_reminder_templates 
ADD COLUMN IF NOT EXISTS "clickFunnelsTag" TEXT,
ADD COLUMN IF NOT EXISTS "applyClickFunnelsTag" BOOLEAN NOT NULL DEFAULT false;

-- Success message
SELECT 'ClickFunnels reminder tag fields added successfully!' as message;
