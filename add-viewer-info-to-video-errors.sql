-- Add viewer name and email columns to video_error_logs table
-- This allows tracking which specific users are experiencing video errors

ALTER TABLE video_error_logs
ADD COLUMN IF NOT EXISTS viewer_name TEXT,
ADD COLUMN IF NOT EXISTS viewer_email TEXT;

-- Create an index on viewer_email for faster lookups
CREATE INDEX IF NOT EXISTS idx_video_error_logs_viewer_email ON video_error_logs(viewer_email);

-- Create an index on viewer_name for faster searches
CREATE INDEX IF NOT EXISTS idx_video_error_logs_viewer_name ON video_error_logs(viewer_name);

-- Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'video_error_logs'
AND column_name IN ('viewer_name', 'viewer_email');
