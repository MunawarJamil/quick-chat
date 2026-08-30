-- AlterTable
ALTER TABLE "RefreshToken" ADD COLUMN     "ipAddress" TEXT,
ADD COLUMN     "userAgent" TEXT;

-- AlterTable
ALTER TABLE "Workspace" ADD COLUMN     "aiSettings" JSONB,
ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Workspace_deletedAt_idx" ON "Workspace"("deletedAt");
