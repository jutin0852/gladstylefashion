ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "role" text NOT NULL DEFAULT 'customer';
UPDATE "user" SET "role" = 'owner' WHERE "isAdmin" = true AND "role" = 'customer';

CREATE TABLE IF NOT EXISTS "customer_profiles" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL UNIQUE REFERENCES "user"("id") ON DELETE CASCADE,
  "marketing_email_opt_in" boolean DEFAULT false NOT NULL,
  "marketing_whatsapp_opt_in" boolean DEFAULT false NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "customer_addresses" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "label" text DEFAULT 'Home' NOT NULL,
  "recipient_name" text NOT NULL,
  "phone" text NOT NULL,
  "street" text NOT NULL,
  "city" text NOT NULL,
  "state" text NOT NULL,
  "postal_code" text,
  "country" text DEFAULT 'Nigeria' NOT NULL,
  "is_default" boolean DEFAULT false NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "customer_addresses_user_id_idx" ON "customer_addresses" ("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "customer_addresses_one_default_per_user" ON "customer_addresses" ("user_id") WHERE "is_default" = true;

CREATE TABLE IF NOT EXISTS "staff_invitations" (
  "id" text PRIMARY KEY NOT NULL,
  "email" text NOT NULL,
  "role" text DEFAULT 'staff' NOT NULL,
  "token_hash" text NOT NULL UNIQUE,
  "invited_by_user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "expires_at" timestamp NOT NULL,
  "accepted_at" timestamp,
  "revoked_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "staff_invitations_email_idx" ON "staff_invitations" ("email");
