-- First, delete the existing test user if it exists
DELETE FROM users WHERE email = 'ariba.farheen@gmail.com';

-- Now import in the correct order
-- 1. Users first (no dependencies)
-- 2. Webinars (depends on users)
-- 3. Everything else (depends on webinars/users)

-- We'll extract just the INSERT statements in the right order
