ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "checkout_idempotency_key" text;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_authorization_url" text;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "reservation_status" text NOT NULL DEFAULT 'none';
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "reservation_expires_at" timestamp;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "reservation_released_at" timestamp;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "reservation_release_reason" text;

CREATE UNIQUE INDEX IF NOT EXISTS "orders_checkout_idempotency_key_unique"
ON "orders" ("checkout_idempotency_key")
WHERE "checkout_idempotency_key" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "orders_reservation_expiry_idx"
ON "orders" ("reservation_status", "reservation_expires_at");
