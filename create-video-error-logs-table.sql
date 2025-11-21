-- Create video error logs table to track video playback issues
CREATE TABLE IF NOT EXISTS video_error_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  webinar_id TEXT NOT NULL,
  registration_id TEXT,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  user_agent TEXT NOT NULL,
  device_info TEXT NOT NULL,
  video_url TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Add index for querying by webinar
  CONSTRAINT fk_webinar
    FOREIGN KEY (webinar_id)
    REFERENCES "Webinar"(id)
    ON DELETE CASCADE
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_video_error_logs_webinar_id ON video_error_logs(webinar_id);
CREATE INDEX IF NOT EXISTS idx_video_error_logs_created_at ON video_error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_video_error_logs_error_type ON video_error_logs(error_type);

-- Grant permissions
GRANT SELECT, INSERT ON video_error_logs TO PUBLIC;

COMMENT ON TABLE video_error_logs IS 'Logs video playback errors for debugging mobile and browser issues';
COMMENT ON COLUMN video_error_logs.error_type IS 'Type of error: player_init_failed, iframe_not_found, api_not_loaded, play_failed, timeout, etc.';
COMMENT ON COLUMN video_error_logs.device_info IS 'JSON string with device details: isMobile, browser, os, screenSize';
