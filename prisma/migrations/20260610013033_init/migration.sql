-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "subscriptionStatus" TEXT NOT NULL DEFAULT 'incomplete',
    "adminEmail" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "tagline" TEXT NOT NULL DEFAULT '',
    "logoUrl" TEXT,
    "themeColor" TEXT NOT NULL DEFAULT '#185FA5',
    "subdomain" TEXT NOT NULL,
    "customDomain" TEXT,
    "address" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "website" TEXT NOT NULL DEFAULT '',
    "license" TEXT NOT NULL DEFAULT '',
    "acceptingProjects" BOOLEAN NOT NULL DEFAULT true,
    "offlineMessage" TEXT NOT NULL DEFAULT '',
    "services" TEXT NOT NULL DEFAULT '[]',
    "gcal" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "usedAt" DATETIME,
    CONSTRAINT "PasswordResetToken_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "clientEmail" TEXT NOT NULL,
    "clientPhone" TEXT NOT NULL DEFAULT '',
    "clientBiz" TEXT NOT NULL DEFAULT '',
    "clientType" TEXT NOT NULL DEFAULT 'homeowner',
    "projectName" TEXT NOT NULL,
    "projectType" TEXT NOT NULL DEFAULT '',
    "address" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'pending_review',
    "startDate" TEXT,
    "gcalSynced" BOOLEAN NOT NULL DEFAULT false,
    "gcalEventId" TEXT,
    "gcalLink" TEXT,
    "adminNotes" TEXT NOT NULL DEFAULT '',
    "estimateId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Project_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Estimate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT,
    "documentType" TEXT NOT NULL DEFAULT 'estimate',
    "documentNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "clientBizName" TEXT NOT NULL DEFAULT '',
    "clientName" TEXT NOT NULL DEFAULT '',
    "clientEmail" TEXT NOT NULL DEFAULT '',
    "clientPhone" TEXT NOT NULL DEFAULT '',
    "clientType" TEXT NOT NULL DEFAULT '',
    "projectName" TEXT NOT NULL DEFAULT '',
    "projectAddress" TEXT NOT NULL DEFAULT '',
    "projectType" TEXT NOT NULL DEFAULT '',
    "scopeOfWork" TEXT NOT NULL DEFAULT '',
    "assumptions" TEXT NOT NULL DEFAULT '',
    "exclusions" TEXT NOT NULL DEFAULT '',
    "discountAmt" REAL NOT NULL DEFAULT 0,
    "markupRate" REAL NOT NULL DEFAULT 0,
    "taxRate" REAL NOT NULL DEFAULT 0,
    "notes" TEXT NOT NULL DEFAULT '',
    "contractAmount" REAL NOT NULL DEFAULT 0,
    "amountPaid" REAL NOT NULL DEFAULT 0,
    "amountDue" REAL NOT NULL DEFAULT 0,
    "total" REAL NOT NULL DEFAULT 0,
    "paymentMethods" TEXT NOT NULL DEFAULT '{}',
    "approvedByName" TEXT NOT NULL DEFAULT '',
    "approvalSignature" TEXT,
    "convertedToInvoiceId" TEXT,
    "convertedFromEstimateId" TEXT,
    "milestoneId" TEXT,
    "createdByName" TEXT NOT NULL DEFAULT '',
    "sentByName" TEXT NOT NULL DEFAULT '',
    "dateSent" TEXT,
    "dateViewed" TEXT,
    "dateApproved" TEXT,
    "paidAt" TEXT,
    "revisionNumber" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Estimate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EstimateLineItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "estimateId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT NOT NULL DEFAULT '',
    "qty" REAL NOT NULL DEFAULT 1,
    "unit" TEXT NOT NULL DEFAULT 'ea',
    "unitPrice" REAL NOT NULL DEFAULT 0,
    "discountPct" REAL NOT NULL DEFAULT 0,
    "lineTotal" REAL NOT NULL DEFAULT 0,
    "category" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "EstimateLineItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EstimateLineItem_estimateId_fkey" FOREIGN KEY ("estimateId") REFERENCES "Estimate" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EstimateMilestone" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "estimateId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "label" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "amount" REAL NOT NULL DEFAULT 0,
    "amountBilled" REAL NOT NULL DEFAULT 0,
    "dueDate" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    CONSTRAINT "EstimateMilestone_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EstimateMilestone_estimateId_fkey" FOREIGN KEY ("estimateId") REFERENCES "Estimate" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EstimatePayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "estimateId" TEXT NOT NULL,
    "amount" REAL NOT NULL DEFAULT 0,
    "method" TEXT NOT NULL DEFAULT '',
    "reference" TEXT NOT NULL DEFAULT '',
    "note" TEXT NOT NULL DEFAULT '',
    "paidAt" TEXT NOT NULL,
    "recordedByName" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "EstimatePayment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EstimatePayment_estimateId_fkey" FOREIGN KEY ("estimateId") REFERENCES "Estimate" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EstimateAttachment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "estimateId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL DEFAULT '',
    "sizeBytes" INTEGER NOT NULL DEFAULT 0,
    "storagePath" TEXT NOT NULL DEFAULT '',
    "publicUrl" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "EstimateAttachment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EstimateAttachment_estimateId_fkey" FOREIGN KEY ("estimateId") REFERENCES "Estimate" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EstimateActivity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "estimateId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "actorName" TEXT NOT NULL DEFAULT '',
    "actorType" TEXT NOT NULL DEFAULT 'admin',
    "description" TEXT NOT NULL DEFAULT '',
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EstimateActivity_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EstimateActivity_estimateId_fkey" FOREIGN KEY ("estimateId") REFERENCES "Estimate" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ServiceCatalog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "unit" TEXT NOT NULL DEFAULT 'ea',
    "unitPrice" REAL NOT NULL DEFAULT 0,
    "category" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "ServiceCatalog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EstimateTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "projectType" TEXT NOT NULL DEFAULT '',
    "items" TEXT NOT NULL DEFAULT '[]',
    CONSTRAINT "EstimateTemplate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_adminEmail_key" ON "Tenant"("adminEmail");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_subdomain_key" ON "Tenant"("subdomain");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");
