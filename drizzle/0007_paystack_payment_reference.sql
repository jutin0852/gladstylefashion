CREATE UNIQUE INDEX IF NOT EXISTS "orders_payment_intent_id_unique"
ON "orders" ("payment_intent_id")
WHERE "payment_intent_id" IS NOT NULL;
