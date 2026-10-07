ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "inventory_migration_status" text NOT NULL DEFAULT 'legacy';--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "inventory_reconciliation_required" boolean NOT NULL DEFAULT false;--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "product_variants" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"size" text NOT NULL,
	"sku" text NOT NULL,
	"inventory_count" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "product_variants_sku_unique" UNIQUE("sku"),
	CONSTRAINT "product_variants_inventory_nonnegative" CHECK ("inventory_count" >= 0),
	CONSTRAINT "product_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade
);--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "product_variants_product_size_unique" ON "product_variants" USING btree ("product_id","size");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_variants_product_active_idx" ON "product_variants" USING btree ("product_id","is_active");--> statement-breakpoint

ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "variant_id" text;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "variant_sku" text;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint

-- Products without size options can be migrated safely to one variant.
INSERT INTO "product_variants" ("id", "product_id", "size", "sku", "inventory_count", "is_active")
SELECT 'pv_' || p."id", p."id", 'ONE_SIZE',
       coalesce(nullif(p."sku", ''), 'LEGACY-' || p."id") || '-ONE-SIZE',
       coalesce(p."inventory_count", 0), coalesce(p."is_active", true)
FROM "products" p
WHERE coalesce(jsonb_array_length(p."sizes"), 0) = 0
  AND NOT EXISTS (SELECT 1 FROM "product_variants" v WHERE v."product_id" = p."id");--> statement-breakpoint

UPDATE "products" p
SET "inventory_migration_status" = 'migrated'
WHERE coalesce(jsonb_array_length(p."sizes"), 0) = 0;--> statement-breakpoint

-- Sized products receive zero-stock rows only. Their legacy aggregate stock is
-- intentionally preserved until an administrator reconciles every size.
INSERT INTO "product_variants" ("id", "product_id", "size", "sku", "inventory_count", "is_active")
SELECT 'pv_' || p."id" || '_' || md5(size_name), p."id", size_name,
       coalesce(nullif(p."sku", ''), 'LEGACY-' || p."id") || '-' || upper(regexp_replace(size_name, '[^A-Za-z0-9]+', '-', 'g')) || '-' || substr(md5(size_name), 1, 6),
       0, coalesce(p."is_active", true)
FROM "products" p
CROSS JOIN LATERAL jsonb_array_elements_text(coalesce(p."sizes", '[]'::jsonb)) AS sizes(size_name)
WHERE jsonb_array_length(coalesce(p."sizes", '[]'::jsonb)) > 0
  AND NOT EXISTS (SELECT 1 FROM "product_variants" v WHERE v."product_id" = p."id" AND v."size" = size_name);--> statement-breakpoint

UPDATE "products"
SET "inventory_migration_status" = 'legacy', "inventory_reconciliation_required" = true
WHERE jsonb_array_length(coalesce("sizes", '[]'::jsonb)) > 0
  AND "inventory_migration_status" = 'legacy';
