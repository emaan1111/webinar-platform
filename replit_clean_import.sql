-- Clean import script for Replit
-- This deletes existing data in reverse dependency order, then imports

-- Step 1: Delete all existing data (in reverse dependency order to avoid FK errors)
DELETE FROM reactions;
DELETE FROM chat_messages;
DELETE FROM webinar_sales;
DELETE FROM offer_analytics;
DELETE FROM analytics;
DELETE FROM engagement_events;
DELETE FROM page_visits;
DELETE FROM attendee_sessions;
DELETE FROM registrations;
DELETE FROM "Offer";
DELETE FROM webinar_schedules;
DELETE FROM webinars;
DELETE FROM images;
DELETE FROM countdown_pages;
DELETE FROM registration_pages;
DELETE FROM countdown_templates;
DELETE FROM thank_you_templates;
DELETE FROM templates;
DELETE FROM users WHERE email = 'ariba.farheen@gmail.com'; -- Only delete your test user

-- Now the database is clean and ready for import
SELECT 'Cleanup complete. Database ready for import.' as status;
