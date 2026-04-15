-- Add gift fields to surveys table
ALTER TABLE surveys ADD COLUMN IF NOT EXISTS "giftTitle" TEXT;
ALTER TABLE surveys ADD COLUMN IF NOT EXISTS "giftUrl" TEXT;

-- Set initial gift for Mother's Pulse Check survey
UPDATE surveys SET 
  "giftTitle" = '3 Shifts That Correct Without Destroying Based In Sunnah',
  "giftUrl" = 'https://drive.google.com/uc?export=download&id=1yCEqXn8N9qx1kxKbCmPvyfCrvdNRWX0V'
WHERE id = 'survey_mothers_pulse_check';
