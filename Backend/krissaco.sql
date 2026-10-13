-- Krissaco Transaction Management & Audit System -- Database Setup (v2.0)
-- Schema for PostgreSQL

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
    CREATE TYPE "transactionTypeEnum" AS ENUM ('Revenue', 'Expense');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "transactionHeadEnum" AS ENUM (
        'Coffee Beans',
        'Chicory',
        'Roasting',
        'Grinding',
        'Blending',
        'Packaging',
        'Transport',
        'Promotion',
        'Commission',
        'Audit',
        'Licenses',
        'Other Operational Expenses'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role VARCHAR(50) NOT NULL, -- 'Accountant', 'Manager', 'Auditor'
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Transaction table with approval workflow & ownership
CREATE TABLE IF NOT EXISTS "transaction" (
    "TransactionID"   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "TransactionDate" DATE NOT NULL,
    "TransactionType" "transactionTypeEnum" NOT NULL,
    "TransactionHead" "transactionHeadEnum" NOT NULL,
    "Amount"          NUMERIC(12, 2) NOT NULL,
    "Vendor"          VARCHAR(150) NOT NULL,
    "Description"     VARCHAR(255) NOT NULL,
    "Remarks"         VARCHAR(255),
    "CreatedAt"       TIMESTAMPTZ NOT NULL DEFAULT now(),
    "Status"          VARCHAR(30) NOT NULL DEFAULT 'Pending', -- 'Pending', 'Approved', 'Rejected'
    "CreatedBy"       VARCHAR(100) NOT NULL DEFAULT 'accountant@krissaco.com',
    "CreatedByName"   VARCHAR(150) NOT NULL DEFAULT 'Alice Accountant',
    "ReceiptURL"      VARCHAR(500),
    "ApprovedBy"      VARCHAR(100),
    "ApprovedByName"  VARCHAR(150),
    "ApprovedAt"      TIMESTAMPTZ,
    "RejectionReason" VARCHAR(500),

    CONSTRAINT ck_amount_positive CHECK ("Amount" > 0),
    CONSTRAINT ck_date_not_future CHECK ("TransactionDate" <= CURRENT_DATE),
    CONSTRAINT ck_vendor_min_length CHECK (char_length("Vendor") >= 2),
    CONSTRAINT ck_description_min_length CHECK (char_length("Description") >= 3),
    CONSTRAINT ck_description_max_length CHECK (char_length("Description") <= 255)
);

-- 3. Audit logs table for full historical traceability
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    transaction_id VARCHAR(100),
    action VARCHAR(50) NOT NULL,
    actor_username VARCHAR(100) NOT NULL,
    actor_name VARCHAR(150) NOT NULL,
    actor_role VARCHAR(50) NOT NULL,
    details TEXT,
    timestamp TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_transaction_created_at ON "transaction" ("CreatedAt" DESC);
CREATE INDEX IF NOT EXISTS idx_transaction_date ON "transaction" ("TransactionDate");
CREATE INDEX IF NOT EXISTS idx_transaction_status ON "transaction" ("Status");
CREATE INDEX IF NOT EXISTS idx_transaction_created_by ON "transaction" ("CreatedBy");
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs ("timestamp" DESC);