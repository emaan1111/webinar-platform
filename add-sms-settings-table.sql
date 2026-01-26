-- Add SMS Settings table
CREATE TABLE IF NOT EXISTS "sms_settings" (
  "id" TEXT NOT NULL DEFAULT 'default',
  "blockedTimezones" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "sms_settings_pkey" PRIMARY KEY ("id")
);

-- Insert default row
INSERT INTO "sms_settings" ("id", "blockedTimezones", "createdAt", "updatedAt")
VALUES ('default', ARRAY[]::TEXT[], CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

-- Verify table was created
SELECT * FROM "sms_settings";
