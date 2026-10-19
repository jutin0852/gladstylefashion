-- Invoices & receipts: additive schema for the owner's invoice feature.
--
-- Creates five NEW tables only. It never alters, renames, or drops existing
-- objects, and every statement is guarded so a second run is a no-op.
-- Run once, inside one transaction, after a Neon restore point exists.
-- See docs/invoice-release-checklist.md before running anywhere.

BEGIN;

CREATE TABLE IF NOT EXISTS "document_counters" (
  "kind" text PRIMARY KEY NOT NULL,
  "last_number" integer DEFAULT 0 NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "invoices" (
  "id" text PRIMARY KEY NOT NULL,
  "invoice_number" integer NOT NULL,
  "customer_name" text NOT NULL,
  "customer_phone" text,
  "customer_email" text,
  "invoice_date" timestamp DEFAULT now() NOT NULL,
  "status" text DEFAULT 'draft' NOT NULL,
  "notes" text,
  "total_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
  "created_by_user_id" text,
  "voided_at" timestamp,
  "void_reason" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "invoices_invoice_number_unique" UNIQUE("invoice_number")
);

CREATE TABLE IF NOT EXISTS "invoice_sections" (
  "id" text PRIMARY KEY NOT NULL,
  "invoice_id" text NOT NULL,
  "position" integer NOT NULL,
  "title" text
);

CREATE TABLE IF NOT EXISTS "invoice_items" (
  "id" text PRIMARY KEY NOT NULL,
  "invoice_id" text NOT NULL,
  "section_id" text NOT NULL,
  "position" integer NOT NULL,
  "description" text NOT NULL,
  "quantity" integer,
  "amount" numeric(12, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS "invoice_payments" (
  "id" text PRIMARY KEY NOT NULL,
  "invoice_id" text NOT NULL,
  "receipt_number" integer NOT NULL,
  "amount" numeric(12, 2) NOT NULL,
  "paid_at" timestamp DEFAULT now() NOT NULL,
  "method" text NOT NULL,
  "bank" text,
  "cheque_number" text,
  "received_from" text NOT NULL,
  "being_payment_for" text NOT NULL,
  "balance_after" numeric(12, 2) NOT NULL,
  "recorded_by_user_id" text,
  "voided_at" timestamp,
  "void_reason" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "invoice_payments_receipt_number_unique" UNIQUE("receipt_number"),
  CONSTRAINT "invoice_payments_amount_positive" CHECK ("amount" > 0)
);

DO $$ BEGIN
  ALTER TABLE "invoices" ADD CONSTRAINT "invoices_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "invoice_sections" ADD CONSTRAINT "invoice_sections_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_section_id_invoice_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "invoice_sections"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "invoice_payments" ADD CONSTRAINT "invoice_payments_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "invoice_payments" ADD CONSTRAINT "invoice_payments_recorded_by_user_id_user_id_fk" FOREIGN KEY ("recorded_by_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "invoices_created_idx" ON "invoices" USING btree ("created_at");
CREATE INDEX IF NOT EXISTS "invoices_customer_name_idx" ON "invoices" USING btree ("customer_name");
CREATE INDEX IF NOT EXISTS "invoice_sections_invoice_idx" ON "invoice_sections" USING btree ("invoice_id", "position");
CREATE INDEX IF NOT EXISTS "invoice_items_invoice_idx" ON "invoice_items" USING btree ("invoice_id", "position");
CREATE INDEX IF NOT EXISTS "invoice_items_section_idx" ON "invoice_items" USING btree ("section_id", "position");
CREATE INDEX IF NOT EXISTS "invoice_payments_invoice_idx" ON "invoice_payments" USING btree ("invoice_id", "paid_at");

COMMIT;
