-- Emaan email-management integration.
-- Per-webinar lead-webhook URL that registrations are pushed to. The list, tag
-- and workflow are configured on the emaan endpoint behind the token, so this
-- app only needs to store the URL (and, for external webinars, which sessions
-- should push).

-- Internal webinars: push every registration when a URL is set.
ALTER TABLE "webinars" ADD COLUMN IF NOT EXISTS "emaanWebhookUrl" TEXT;

-- External webinars: push URL + scope ("ALL" = EverWebinar + live Zoom,
-- "ZOOM_ONLY" = only the live Zoom session).
ALTER TABLE "external_webinars" ADD COLUMN IF NOT EXISTS "emaanWebhookUrl" TEXT;
ALTER TABLE "external_webinars" ADD COLUMN IF NOT EXISTS "emaanSyncScope" TEXT NOT NULL DEFAULT 'ALL';
