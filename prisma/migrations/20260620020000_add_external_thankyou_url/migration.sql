-- Store the post-registration thank-you redirect on the webinar so it's dynamic
-- (changing it doesn't require re-pasting the embed snippet).
ALTER TABLE "external_webinars" ADD COLUMN IF NOT EXISTS "thankYouUrl" TEXT;
