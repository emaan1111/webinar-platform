-- Fix: Grant ADMIN role to your user account
-- Replace 'your-email@example.com' with your actual email

UPDATE "User" 
SET role = 'ADMIN' 
WHERE email = 'your-email@example.com';

-- To check your current role:
SELECT email, role FROM "User";
