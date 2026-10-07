import { and, eq, sql } from "drizzle-orm";
import { db } from "./db";
import { transactionDb } from "./transaction-db";
import { emailOutbox } from "./schema";
import { sendEmail } from "./email";
import { EmailOutboxPayload, EmailEventType, renderTransactionalEmail } from "./email-templates";
import { getEmailRetryPlan, MAX_EMAIL_ATTEMPTS, sanitizeEmailError } from "./email-outbox-policy";

type OutboxTransaction = Parameters<Parameters<typeof transactionDb.transaction>[0]>[0];

export type QueueEmailInput = {
  dedupeKey: string;
  eventType: EmailEventType;
  recipient?: string | null;
  orderId?: string;
  invitationId?: string;
  payload: EmailOutboxPayload;
};

export async function queueEmailOutbox(tx: OutboxTransaction, input: QueueEmailInput) {
  await tx.insert(emailOutbox).values({
    dedupeKey: input.dedupeKey,
    eventType: input.eventType,
    recipient: input.recipient || null,
    orderId: input.orderId,
    invitationId: input.invitationId,
    payload: input.payload,
    status: "pending",
    attemptCount: 0,
    nextAttemptAt: new Date(),
  }).onConflictDoNothing({ target: emailOutbox.dedupeKey });
}

type ClaimedEmail = {
  id: string;
  dedupeKey: string;
  eventType: string;
  recipient: string | null;
  payload: unknown;
  attemptCount: number;
  lockToken: string;
};

const BATCH_SIZE = 20;
const LEASE_MS = 2 * 60_000;

async function claimDueEmails() {
  const lockToken = crypto.randomUUID();
  const lockedUntil = new Date(Date.now() + LEASE_MS);
  const rows = await db.execute(sql<ClaimedEmail>`
    WITH candidates AS (
      SELECT "id"
      FROM "email_outbox"
      WHERE "next_attempt_at" <= now()
        AND (
          "status" = 'pending'
          OR ("status" = 'processing' AND ("locked_until" IS NULL OR "locked_until" <= now()))
        )
      ORDER BY "created_at" ASC
      FOR UPDATE SKIP LOCKED
      LIMIT ${BATCH_SIZE}
    )
    UPDATE "email_outbox" AS outbox
    SET "status" = 'processing',
        "locked_until" = ${lockedUntil},
        "lock_token" = ${lockToken},
        "last_attempt_at" = now(),
        "updated_at" = now()
    FROM candidates
    WHERE outbox."id" = candidates."id"
    RETURNING outbox."id" AS "id",
      outbox."dedupe_key" AS "dedupeKey",
      outbox."event_type" AS "eventType",
      outbox."recipient" AS "recipient",
      outbox."payload" AS "payload",
      outbox."attempt_count" AS "attemptCount",
      outbox."lock_token" AS "lockToken"
  `);
  return { rows: rows.rows as ClaimedEmail[], lockToken };
}

function resolveRecipient(item: ClaimedEmail) {
  if (item.recipient) return item.recipient;
  if (item.eventType === "refund-required" && process.env.ADMIN_EMAIL) return process.env.ADMIN_EMAIL;
  throw new Error("Email recipient is not configured.");
}

function isEmailEventType(value: string): value is EmailEventType {
  return [
    "payment-confirmed",
    "refund-required",
    "refund-initiated",
    "refund-completed",
    "order-processing",
    "order-shipped",
    "order-delivered",
    "order-cancelled",
    "staff-invitation",
  ].includes(value);
}

async function markSent(item: ClaimedEmail, providerMessageId: string | null) {
  const updated = await db.update(emailOutbox).set({
    status: "sent",
    sentAt: new Date(),
    providerMessageId,
    lastError: null,
    lockedUntil: null,
    lockToken: null,
    updatedAt: new Date(),
  }).where(and(eq(emailOutbox.id, item.id), eq(emailOutbox.status, "processing"), eq(emailOutbox.lockToken, item.lockToken))).returning({ id: emailOutbox.id });
  return updated.length === 1;
}

async function markFailure(item: ClaimedEmail, error: unknown) {
  const attemptCount = item.attemptCount + 1;
  const plan = getEmailRetryPlan(attemptCount);
  await db.update(emailOutbox).set({
    status: plan.status,
    attemptCount,
    nextAttemptAt: plan.nextAttemptAt,
    lastError: sanitizeEmailError(error),
    lockedUntil: null,
    lockToken: null,
    updatedAt: new Date(),
  }).where(and(eq(emailOutbox.id, item.id), eq(emailOutbox.status, "processing"), eq(emailOutbox.lockToken, item.lockToken)));
  return plan.status;
}

export async function processEmailOutbox() {
  const { rows } = await claimDueEmails();
  let sent = 0;
  let retrying = 0;
  let failed = 0;

  for (const item of rows) {
    try {
      if (!isEmailEventType(item.eventType)) throw new Error("Email event type is not supported.");
      const message = renderTransactionalEmail(item.eventType, item.payload as EmailOutboxPayload, resolveRecipient(item));
      const result = await sendEmail(message, { idempotencyKey: item.dedupeKey });
      if (await markSent(item, result.providerMessageId)) sent += 1;
    } catch (error) {
      const status = await markFailure(item, error);
      if (status === "failed") failed += 1;
      else retrying += 1;
      console.error("Transactional email delivery failed", {
        id: item.id,
        eventType: item.eventType,
        attemptCount: Math.min(item.attemptCount + 1, MAX_EMAIL_ATTEMPTS),
        error: sanitizeEmailError(error),
      });
    }
  }

  return { claimed: rows.length, sent, retrying, failed };
}

/**
 * Drain after a business transaction has committed without allowing an email
 * provider or a worker/database hiccup to change the business result.
 */
export async function drainEmailOutboxBestEffort() {
  try {
    return await processEmailOutbox();
  } catch (error) {
    console.error("Transactional email outbox drain failed", {
      error: sanitizeEmailError(error),
    });
    return null;
  }
}
