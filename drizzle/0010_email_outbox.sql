CREATE TABLE IF NOT EXISTS "email_outbox" (
  "id" text PRIMARY KEY NOT NULL,
  "dedupe_key" text NOT NULL,
  "event_type" text NOT NULL,
  "recipient" text,
  "order_id" text,
  "invitation_id" text,
  "payload" jsonb NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "attempt_count" integer DEFAULT 0 NOT NULL,
  "next_attempt_at" timestamp DEFAULT now() NOT NULL,
  "last_attempt_at" timestamp,
  "sent_at" timestamp,
  "provider_message_id" text,
  "last_error" text,
  "locked_until" timestamp,
  "lock_token" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "email_outbox_dedupe_key_unique" UNIQUE("dedupe_key")
);--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "email_outbox" ADD CONSTRAINT "email_outbox_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "email_outbox" ADD CONSTRAINT "email_outbox_invitation_id_staff_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."staff_invitations"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "email_outbox_due_idx" ON "email_outbox" USING btree ("status", "next_attempt_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_outbox_order_idx" ON "email_outbox" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_outbox_invitation_idx" ON "email_outbox" USING btree ("invitation_id");
