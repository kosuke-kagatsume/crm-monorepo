-- CreateTable
CREATE TABLE "company_plans" (
    "companyId" TEXT NOT NULL PRIMARY KEY,
    "plan" TEXT NOT NULL DEFAULT 'LITE',
    "features" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "company_plans_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "contract_history" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ledgerId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "contractAmt" DECIMAL NOT NULL,
    "durationDays" INTEGER,
    "reason" TEXT,
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "contract_history_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "project_ledgers" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "contract_history_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "budget_revisions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ledgerId" TEXT NOT NULL,
    "revisionNo" INTEGER NOT NULL,
    "note" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "budget_revisions_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "project_ledgers" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "budget_revisions_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "progress_approval_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "progressId" TEXT NOT NULL,
    "approvedBy" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "approvedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "comment" TEXT,
    CONSTRAINT "progress_approval_logs_progressId_fkey" FOREIGN KEY ("progressId") REFERENCES "ledger_progress" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "progress_approval_logs_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ledgerId" TEXT NOT NULL,
    "invoiceNo" TEXT NOT NULL,
    "billType" TEXT NOT NULL,
    "billPeriod" TEXT,
    "totalAmt" DECIMAL NOT NULL,
    "taxAmt" DECIMAL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "issuedAt" DATETIME,
    "dueDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "invoices_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "project_ledgers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "invoice_lines" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceId" TEXT NOT NULL,
    "subId" TEXT,
    "description" TEXT,
    "qty" DECIMAL,
    "unitPrice" DECIMAL,
    "amount" DECIMAL NOT NULL,
    "taxCode" TEXT,
    CONSTRAINT "invoice_lines_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "invoice_lines_subId_fkey" FOREIGN KEY ("subId") REFERENCES "ledger_subs" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceId" TEXT NOT NULL,
    "paidAmt" DECIMAL NOT NULL,
    "paidAt" DATETIME NOT NULL,
    "method" TEXT,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payments_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "retention_releases" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ledgerId" TEXT NOT NULL,
    "releaseAmt" DECIMAL NOT NULL,
    "reason" TEXT,
    "releasedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "retention_releases_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "project_ledgers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "contract_history_ledgerId_idx" ON "contract_history"("ledgerId");

-- CreateIndex
CREATE INDEX "contract_history_version_idx" ON "contract_history"("version");

-- CreateIndex
CREATE INDEX "budget_revisions_ledgerId_idx" ON "budget_revisions"("ledgerId");

-- CreateIndex
CREATE UNIQUE INDEX "budget_revisions_ledgerId_revisionNo_key" ON "budget_revisions"("ledgerId", "revisionNo");

-- CreateIndex
CREATE INDEX "progress_approval_logs_progressId_idx" ON "progress_approval_logs"("progressId");

-- CreateIndex
CREATE INDEX "progress_approval_logs_approvedBy_idx" ON "progress_approval_logs"("approvedBy");

-- CreateIndex
CREATE INDEX "invoices_ledgerId_idx" ON "invoices"("ledgerId");

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "invoices"("status");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoiceNo_key" ON "invoices"("invoiceNo");

-- CreateIndex
CREATE INDEX "invoice_lines_invoiceId_idx" ON "invoice_lines"("invoiceId");

-- CreateIndex
CREATE INDEX "payments_invoiceId_idx" ON "payments"("invoiceId");

-- CreateIndex
CREATE INDEX "payments_paidAt_idx" ON "payments"("paidAt");

-- CreateIndex
CREATE INDEX "retention_releases_ledgerId_idx" ON "retention_releases"("ledgerId");

-- CreateIndex
CREATE INDEX "retention_releases_releasedAt_idx" ON "retention_releases"("releasedAt");
