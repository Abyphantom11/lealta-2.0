-- CreateTable
CREATE TABLE "TrialUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "trialToken" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activatedAt" DATETIME,
    "expiresAt" DATETIME NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "hasUpgraded" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" DATETIME,
    "notificationsSent" INTEGER NOT NULL DEFAULT 0,
    "businessType" TEXT,
    "expectedLocations" INTEGER,
    "currentSolution" TEXT,
    "referralSource" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "TrialUser_email_key" ON "TrialUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "TrialUser_trialToken_key" ON "TrialUser"("trialToken");

-- CreateIndex
CREATE INDEX "TrialUser_email_idx" ON "TrialUser"("email");

-- CreateIndex
CREATE INDEX "TrialUser_trialToken_idx" ON "TrialUser"("trialToken");

-- CreateIndex
CREATE INDEX "TrialUser_expiresAt_idx" ON "TrialUser"("expiresAt");

-- CreateIndex
CREATE INDEX "TrialUser_isActive_idx" ON "TrialUser"("isActive");
