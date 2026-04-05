-- Create table to track processed WebinarJam registrations
-- This prevents duplicate Facebook CAPI events when polling

CREATE TABLE IF NOT EXISTS webinarjam_processed_registrations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  webinarjam_webinar_id TEXT NOT NULL,
  webinarjam_user_id TEXT NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  webinar_name TEXT,
  schedule_date TIMESTAMP,
  registered_at TIMESTAMP NOT NULL,
  facebook_sent BOOLEAN DEFAULT false,
  facebook_sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Unique constraint to prevent duplicates
  CONSTRAINT unique_wj_registration UNIQUE (webinarjam_webinar_id, webinarjam_user_id)
);

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_wj_processed_webinar_id ON webinarjam_processed_registrations(webinarjam_webinar_id);
CREATE INDEX IF NOT EXISTS idx_wj_processed_email ON webinarjam_processed_registrations(email);
CREATE INDEX IF NOT EXISTS idx_wj_processed_registered_at ON webinarjam_processed_registrations(registered_at);
CREATE INDEX IF NOT EXISTS idx_wj_processed_facebook_sent ON webinarjam_processed_registrations(facebook_sent);
