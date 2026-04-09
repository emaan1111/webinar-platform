-- Create popups table
CREATE TABLE IF NOT EXISTS "popups" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "fields" JSONB NOT NULL,
  "layout" JSONB,
  "styles" JSONB,
  "customHtml" TEXT,
  "useCustomHtml" BOOLEAN NOT NULL DEFAULT false,
  "submitText" TEXT NOT NULL DEFAULT 'Submit',
  "successMessage" TEXT NOT NULL DEFAULT 'Thank you for your submission!',
  "redirectUrl" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "popups_pkey" PRIMARY KEY ("id")
);

-- Create popup_leads table
CREATE TABLE IF NOT EXISTS "popup_leads" (
  "id" TEXT NOT NULL,
  "popupId" TEXT NOT NULL,
  "data" JSONB NOT NULL,
  "ip" TEXT,
  "userAgent" TEXT,
  "referrer" TEXT,
  "pageUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "popup_leads_pkey" PRIMARY KEY ("id")
);

-- Create unique index on popups slug
CREATE UNIQUE INDEX IF NOT EXISTS "popups_slug_key" ON "popups"("slug");

-- Create indexes
CREATE INDEX IF NOT EXISTS "popups_userId_idx" ON "popups"("userId");
CREATE INDEX IF NOT EXISTS "popup_leads_popupId_idx" ON "popup_leads"("popupId");
CREATE INDEX IF NOT EXISTS "popup_leads_createdAt_idx" ON "popup_leads"("createdAt");

-- Add foreign keys
ALTER TABLE "popups" ADD CONSTRAINT "popups_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "popup_leads" ADD CONSTRAINT "popup_leads_popupId_fkey" FOREIGN KEY ("popupId") REFERENCES "popups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
