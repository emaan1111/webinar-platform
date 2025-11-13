-- Import data to Replit in correct order to avoid foreign key issues
-- Run this AFTER: npx prisma migrate deploy

BEGIN;

-- Disable triggers temporarily
SET session_replication_role = replica;

-- 1. Users first (no dependencies)
TRUNCATE users CASCADE;

-- 2. Templates (no dependencies)
TRUNCATE templates, thank_you_templates, countdown_templates, registration_pages, countdown_pages CASCADE;

-- 3. Webinars (depends on users)
TRUNCATE webinars CASCADE;

-- 4. Everything else
TRUNCATE webinar_schedules, registrations, attendee_sessions, chat_messages, reactions, page_visits CASCADE;

-- Re-enable triggers
SET session_replication_role = DEFAULT;

COMMIT;

-- Now copy the actual INSERT statements from data_only.sql
\echo 'Ready to import data. Upload data_only.sql and run: psql $DATABASE_URL -f data_only.sql'
