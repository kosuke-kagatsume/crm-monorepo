-- CreateTable
CREATE TABLE "aftercare_schedules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "storeId" TEXT,
    "projectId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "inspectionType" TEXT NOT NULL,
    "scheduledDate" DATETIME NOT NULL,
    "assignedTo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "reminderSettings" TEXT NOT NULL DEFAULT '{}',
    "lastReminderAt" DATETIME,
    "completedAt" DATETIME,
    "completedBy" TEXT,
    "notes" TEXT,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "aftercare_schedules_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "aftercare_schedules_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "aftercare_schedules_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "defect_cases" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scheduleId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "location" TEXT,
    "photos" TEXT NOT NULL DEFAULT '[]',
    "estimateId" TEXT,
    "estimateAmount" REAL,
    "status" TEXT NOT NULL DEFAULT 'identified',
    "identifiedBy" TEXT NOT NULL,
    "identifiedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" DATETIME,
    "resolvedBy" TEXT,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "defect_cases_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "aftercare_schedules" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "inspection_reminders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scheduleId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "timing" TEXT NOT NULL,
    "sentAt" DATETIME,
    "sentTo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "response" TEXT,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "inspection_reminders_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "aftercare_schedules" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "checklist_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scheduleId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "checkResult" TEXT,
    "notes" TEXT,
    "photoUrl" TEXT,
    "checkedAt" DATETIME,
    "checkedBy" TEXT,
    "sequence" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "checklist_items_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "aftercare_schedules" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "customer_satisfaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "projectId" TEXT,
    "scheduleId" TEXT,
    "npsScore" INTEGER NOT NULL,
    "satisfactionScore" REAL NOT NULL,
    "categories" TEXT NOT NULL DEFAULT '{}',
    "feedback" TEXT,
    "surveyType" TEXT NOT NULL,
    "surveyMethod" TEXT NOT NULL,
    "surveyDate" DATETIME NOT NULL,
    "respondedAt" DATETIME,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "customer_satisfaction_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "customer_satisfaction_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "warranty_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "warrantyType" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "coverageDetails" TEXT NOT NULL,
    "terms" TEXT,
    "certificateNo" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "claimCount" INTEGER NOT NULL DEFAULT 0,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "warranty_records_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "warranty_records_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "warranty_claims" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "warrantyId" TEXT NOT NULL,
    "claimNo" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "claimDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "resolution" TEXT,
    "repairCost" REAL,
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "completedAt" DATETIME,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "warranty_claims_warrantyId_fkey" FOREIGN KEY ("warrantyId") REFERENCES "warranty_records" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "journal_entries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "entryDate" DATETIME NOT NULL,
    "debitAccount" TEXT NOT NULL,
    "creditAccount" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "description" TEXT NOT NULL,
    "reference" TEXT,
    "status" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "journal_entries_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "parentId" TEXT,
    "balance" DECIMAL NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "accounts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "accounts_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "accounts" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "approval_workflows" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "expenseId" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "approverId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "comments" TEXT,
    "approvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "approval_workflows_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "expenses" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "approval_workflows_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "maintenance_contracts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "contractNumber" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "contractType" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "status" TEXT NOT NULL,
    "terms" TEXT,
    "coverageDetails" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "maintenance_contracts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "maintenance_contracts_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "inspections" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractId" TEXT NOT NULL,
    "inspectionType" TEXT NOT NULL,
    "scheduledDate" DATETIME NOT NULL,
    "completedDate" DATETIME,
    "inspector" TEXT NOT NULL,
    "findings" TEXT NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL,
    "checklist" TEXT NOT NULL DEFAULT '{}',
    "photos" TEXT NOT NULL DEFAULT '[]',
    "recommendations" TEXT,
    "nextInspectionDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "inspections_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "maintenance_contracts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "defect_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inspectionId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "location" TEXT,
    "photos" TEXT NOT NULL DEFAULT '[]',
    "estimatedCost" DECIMAL,
    "status" TEXT NOT NULL,
    "repairDate" DATETIME,
    "repairedBy" TEXT,
    "repairCost" DECIMAL,
    "warrantyApplicable" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "defect_records_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "inspections" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "maintenance_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractId" TEXT NOT NULL,
    "maintenanceType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "performedDate" DATETIME NOT NULL,
    "performedBy" TEXT NOT NULL,
    "duration" INTEGER,
    "cost" DECIMAL,
    "materials" TEXT NOT NULL DEFAULT '[]',
    "notes" TEXT,
    "nextMaintenance" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "maintenance_records_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "maintenance_contracts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "claims" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "projectId" TEXT,
    "claimNumber" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "submittedDate" DATETIME NOT NULL,
    "assignedTo" TEXT,
    "resolution" TEXT,
    "resolutionDate" DATETIME,
    "compensation" DECIMAL,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "claims_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "claims_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "project_ledgers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "storeId" TEXT,
    "projectId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "contractAmount" DECIMAL NOT NULL,
    "billingMode" TEXT NOT NULL,
    "retainagePct" DECIMAL NOT NULL DEFAULT 5.0,
    "retainageReleaseRule" TEXT NOT NULL DEFAULT 'ON_FINAL',
    "status" TEXT NOT NULL DEFAULT 'active',
    "dwSyncStatus" TEXT NOT NULL DEFAULT 'pending',
    "dwSyncAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "project_ledgers_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "project_ledgers_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "project_ledgers_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ledger_subs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ledgerId" TEXT NOT NULL,
    "tradeCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "seq" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ledger_subs_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "project_ledgers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ledger_budgets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subId" TEXT NOT NULL,
    "costCode" TEXT NOT NULL,
    "costName" TEXT NOT NULL,
    "plannedQty" DECIMAL,
    "unit" TEXT,
    "plannedAmt" DECIMAL NOT NULL,
    "taxCode" TEXT NOT NULL DEFAULT '10',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ledger_budgets_subId_fkey" FOREIGN KEY ("subId") REFERENCES "ledger_subs" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ledger_costs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subId" TEXT NOT NULL,
    "docType" TEXT NOT NULL,
    "vendorId" TEXT,
    "vendorName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL,
    "unit" TEXT,
    "unitPrice" DECIMAL,
    "amount" DECIMAL NOT NULL,
    "taxCode" TEXT NOT NULL DEFAULT '10',
    "taxAmount" DECIMAL NOT NULL DEFAULT 0,
    "invoiceNo" TEXT,
    "invoiceDate" DATETIME,
    "paymentDate" DATETIME,
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "sourceRef" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ledger_costs_subId_fkey" FOREIGN KEY ("subId") REFERENCES "ledger_subs" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ledger_progress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "progressPct" DECIMAL NOT NULL,
    "earnedValueAmt" DECIMAL NOT NULL,
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "dwSyncStatus" TEXT,
    "dwSyncAt" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ledger_progress_subId_fkey" FOREIGN KEY ("subId") REFERENCES "ledger_subs" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "change_orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ledgerId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "deltaAmt" DECIMAL NOT NULL,
    "reason" TEXT NOT NULL,
    "requestedBy" TEXT,
    "requestedAt" DATETIME,
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "dwSyncStatus" TEXT,
    "dwSyncAt" DATETIME,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "change_orders_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "project_ledgers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "retainages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ledgerId" TEXT NOT NULL,
    "pct" DECIMAL NOT NULL,
    "rule" TEXT NOT NULL,
    "heldAmt" DECIMAL NOT NULL DEFAULT 0,
    "releasedAmt" DECIMAL NOT NULL DEFAULT 0,
    "releasedAt" DATETIME,
    "releasedBy" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "retainages_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "project_ledgers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "milestone_billings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ledgerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "plannedDate" DATETIME NOT NULL,
    "plannedAmt" DECIMAL NOT NULL,
    "billedAmt" DECIMAL NOT NULL DEFAULT 0,
    "billedDate" DATETIME,
    "invoiceNo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "milestone_billings_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "project_ledgers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "reception_cards" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "storeId" TEXT,
    "customerId" TEXT,
    "visitorName" TEXT NOT NULL,
    "visitorPhone" TEXT,
    "purpose" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 3,
    "status" TEXT NOT NULL DEFAULT 'waiting',
    "assignedTo" TEXT,
    "roomId" TEXT,
    "notes" TEXT,
    "arrivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedAt" DATETIME,
    "completedAt" DATETIME,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "reception_cards_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "reception_cards_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "reception_cards_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "reception_cards_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "reception_cards_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "sentAt" DATETIME,
    "readAt" DATETIME,
    "priority" INTEGER NOT NULL DEFAULT 3,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "notifications_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "notifications_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "notifications_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_bookings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "storeId" TEXT,
    "userId" TEXT NOT NULL,
    "customerId" TEXT,
    "resourceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "purpose" TEXT,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "status" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "conflictResolution" TEXT,
    "notes" TEXT,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "confirmedAt" DATETIME,
    CONSTRAINT "bookings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "bookings_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "bookings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "bookings_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "bookings_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "resources" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_bookings" ("companyId", "createdAt", "endTime", "id", "metadata", "notes", "priority", "resourceId", "startTime", "status", "storeId", "title", "updatedAt", "userId") SELECT "companyId", "createdAt", "endTime", "id", "metadata", "notes", "priority", "resourceId", "startTime", "status", "storeId", "title", "updatedAt", "userId" FROM "bookings";
DROP TABLE "bookings";
ALTER TABLE "new_bookings" RENAME TO "bookings";
CREATE INDEX "bookings_companyId_idx" ON "bookings"("companyId");
CREATE INDEX "bookings_resourceId_idx" ON "bookings"("resourceId");
CREATE INDEX "bookings_customerId_idx" ON "bookings"("customerId");
CREATE INDEX "bookings_startTime_endTime_idx" ON "bookings"("startTime", "endTime");
CREATE INDEX "bookings_status_idx" ON "bookings"("status");
CREATE TABLE "new_resources" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "subType" TEXT,
    "name" TEXT NOT NULL,
    "capacity" INTEGER,
    "location" TEXT,
    "equipment" TEXT NOT NULL DEFAULT '[]',
    "plateNumber" TEXT,
    "maintenanceStatus" TEXT NOT NULL DEFAULT 'available',
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_resources" ("capacity", "createdAt", "id", "isActive", "location", "metadata", "name", "type", "updatedAt") SELECT "capacity", "createdAt", "id", "isActive", "location", "metadata", "name", "type", "updatedAt" FROM "resources";
DROP TABLE "resources";
ALTER TABLE "new_resources" RENAME TO "resources";
CREATE INDEX "resources_type_idx" ON "resources"("type");
CREATE INDEX "resources_maintenanceStatus_idx" ON "resources"("maintenanceStatus");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "aftercare_schedules_companyId_idx" ON "aftercare_schedules"("companyId");

-- CreateIndex
CREATE INDEX "aftercare_schedules_customerId_idx" ON "aftercare_schedules"("customerId");

-- CreateIndex
CREATE INDEX "aftercare_schedules_scheduledDate_idx" ON "aftercare_schedules"("scheduledDate");

-- CreateIndex
CREATE INDEX "aftercare_schedules_status_idx" ON "aftercare_schedules"("status");

-- CreateIndex
CREATE INDEX "defect_cases_scheduleId_idx" ON "defect_cases"("scheduleId");

-- CreateIndex
CREATE INDEX "defect_cases_severity_idx" ON "defect_cases"("severity");

-- CreateIndex
CREATE INDEX "defect_cases_status_idx" ON "defect_cases"("status");

-- CreateIndex
CREATE INDEX "inspection_reminders_scheduleId_idx" ON "inspection_reminders"("scheduleId");

-- CreateIndex
CREATE INDEX "inspection_reminders_timing_idx" ON "inspection_reminders"("timing");

-- CreateIndex
CREATE INDEX "inspection_reminders_sentAt_idx" ON "inspection_reminders"("sentAt");

-- CreateIndex
CREATE INDEX "checklist_items_scheduleId_idx" ON "checklist_items"("scheduleId");

-- CreateIndex
CREATE INDEX "checklist_items_category_idx" ON "checklist_items"("category");

-- CreateIndex
CREATE INDEX "customer_satisfaction_companyId_idx" ON "customer_satisfaction"("companyId");

-- CreateIndex
CREATE INDEX "customer_satisfaction_customerId_idx" ON "customer_satisfaction"("customerId");

-- CreateIndex
CREATE INDEX "customer_satisfaction_npsScore_idx" ON "customer_satisfaction"("npsScore");

-- CreateIndex
CREATE INDEX "customer_satisfaction_surveyDate_idx" ON "customer_satisfaction"("surveyDate");

-- CreateIndex
CREATE INDEX "warranty_records_companyId_idx" ON "warranty_records"("companyId");

-- CreateIndex
CREATE INDEX "warranty_records_customerId_idx" ON "warranty_records"("customerId");

-- CreateIndex
CREATE INDEX "warranty_records_endDate_idx" ON "warranty_records"("endDate");

-- CreateIndex
CREATE UNIQUE INDEX "warranty_records_companyId_certificateNo_key" ON "warranty_records"("companyId", "certificateNo");

-- CreateIndex
CREATE INDEX "warranty_claims_warrantyId_idx" ON "warranty_claims"("warrantyId");

-- CreateIndex
CREATE INDEX "warranty_claims_status_idx" ON "warranty_claims"("status");

-- CreateIndex
CREATE UNIQUE INDEX "warranty_claims_warrantyId_claimNo_key" ON "warranty_claims"("warrantyId", "claimNo");

-- CreateIndex
CREATE INDEX "journal_entries_companyId_idx" ON "journal_entries"("companyId");

-- CreateIndex
CREATE INDEX "journal_entries_entryDate_idx" ON "journal_entries"("entryDate");

-- CreateIndex
CREATE INDEX "accounts_companyId_idx" ON "accounts"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_companyId_code_key" ON "accounts"("companyId", "code");

-- CreateIndex
CREATE INDEX "approval_workflows_expenseId_idx" ON "approval_workflows"("expenseId");

-- CreateIndex
CREATE INDEX "approval_workflows_approverId_idx" ON "approval_workflows"("approverId");

-- CreateIndex
CREATE INDEX "maintenance_contracts_companyId_idx" ON "maintenance_contracts"("companyId");

-- CreateIndex
CREATE INDEX "maintenance_contracts_customerId_idx" ON "maintenance_contracts"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "maintenance_contracts_companyId_contractNumber_key" ON "maintenance_contracts"("companyId", "contractNumber");

-- CreateIndex
CREATE INDEX "inspections_contractId_idx" ON "inspections"("contractId");

-- CreateIndex
CREATE INDEX "inspections_scheduledDate_idx" ON "inspections"("scheduledDate");

-- CreateIndex
CREATE INDEX "defect_records_inspectionId_idx" ON "defect_records"("inspectionId");

-- CreateIndex
CREATE INDEX "defect_records_severity_idx" ON "defect_records"("severity");

-- CreateIndex
CREATE INDEX "maintenance_records_contractId_idx" ON "maintenance_records"("contractId");

-- CreateIndex
CREATE INDEX "maintenance_records_performedDate_idx" ON "maintenance_records"("performedDate");

-- CreateIndex
CREATE INDEX "claims_companyId_idx" ON "claims"("companyId");

-- CreateIndex
CREATE INDEX "claims_customerId_idx" ON "claims"("customerId");

-- CreateIndex
CREATE INDEX "claims_status_idx" ON "claims"("status");

-- CreateIndex
CREATE UNIQUE INDEX "claims_companyId_claimNumber_key" ON "claims"("companyId", "claimNumber");

-- CreateIndex
CREATE UNIQUE INDEX "project_ledgers_projectId_key" ON "project_ledgers"("projectId");

-- CreateIndex
CREATE INDEX "project_ledgers_companyId_idx" ON "project_ledgers"("companyId");

-- CreateIndex
CREATE INDEX "project_ledgers_projectId_idx" ON "project_ledgers"("projectId");

-- CreateIndex
CREATE INDEX "project_ledgers_customerId_idx" ON "project_ledgers"("customerId");

-- CreateIndex
CREATE INDEX "ledger_subs_ledgerId_idx" ON "ledger_subs"("ledgerId");

-- CreateIndex
CREATE UNIQUE INDEX "ledger_subs_ledgerId_tradeCode_seq_key" ON "ledger_subs"("ledgerId", "tradeCode", "seq");

-- CreateIndex
CREATE INDEX "ledger_budgets_subId_idx" ON "ledger_budgets"("subId");

-- CreateIndex
CREATE INDEX "ledger_budgets_costCode_idx" ON "ledger_budgets"("costCode");

-- CreateIndex
CREATE INDEX "ledger_costs_subId_idx" ON "ledger_costs"("subId");

-- CreateIndex
CREATE INDEX "ledger_costs_vendorId_idx" ON "ledger_costs"("vendorId");

-- CreateIndex
CREATE INDEX "ledger_costs_invoiceDate_idx" ON "ledger_costs"("invoiceDate");

-- CreateIndex
CREATE INDEX "ledger_progress_subId_idx" ON "ledger_progress"("subId");

-- CreateIndex
CREATE INDEX "ledger_progress_date_idx" ON "ledger_progress"("date");

-- CreateIndex
CREATE INDEX "change_orders_ledgerId_idx" ON "change_orders"("ledgerId");

-- CreateIndex
CREATE INDEX "change_orders_status_idx" ON "change_orders"("status");

-- CreateIndex
CREATE UNIQUE INDEX "change_orders_ledgerId_code_key" ON "change_orders"("ledgerId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "retainages_ledgerId_key" ON "retainages"("ledgerId");

-- CreateIndex
CREATE INDEX "milestone_billings_ledgerId_idx" ON "milestone_billings"("ledgerId");

-- CreateIndex
CREATE INDEX "milestone_billings_plannedDate_idx" ON "milestone_billings"("plannedDate");

-- CreateIndex
CREATE UNIQUE INDEX "milestone_billings_ledgerId_sequence_key" ON "milestone_billings"("ledgerId", "sequence");

-- CreateIndex
CREATE INDEX "reception_cards_companyId_idx" ON "reception_cards"("companyId");

-- CreateIndex
CREATE INDEX "reception_cards_status_idx" ON "reception_cards"("status");

-- CreateIndex
CREATE INDEX "reception_cards_assignedTo_idx" ON "reception_cards"("assignedTo");

-- CreateIndex
CREATE INDEX "notifications_companyId_idx" ON "notifications"("companyId");

-- CreateIndex
CREATE INDEX "notifications_recipientId_idx" ON "notifications"("recipientId");

-- CreateIndex
CREATE INDEX "notifications_status_idx" ON "notifications"("status");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");
