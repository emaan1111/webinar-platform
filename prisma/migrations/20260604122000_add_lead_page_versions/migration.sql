-- CreateTable
CREATE TABLE "lead_page_versions" (
  "id" TEXT NOT NULL,
  "leadPageId" TEXT NOT NULL,
  "htmlContent" TEXT NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'manual',
  "changeSummary" TEXT,
  "prompt" TEXT,
  "createdById" TEXT,
  "createdByEmail" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "lead_page_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lead_page_versions_leadPageId_createdAt_idx" ON "lead_page_versions"("leadPageId", "createdAt");

-- CreateIndex
CREATE INDEX "lead_page_versions_createdById_idx" ON "lead_page_versions"("createdById");

-- AddForeignKey
ALTER TABLE "lead_page_versions" ADD CONSTRAINT "lead_page_versions_leadPageId_fkey" FOREIGN KEY ("leadPageId") REFERENCES "lead_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_page_versions" ADD CONSTRAINT "lead_page_versions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
