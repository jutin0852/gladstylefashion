import assert from "node:assert/strict";
import { test } from "node:test";
import { getEmailRetryPlan, MAX_EMAIL_ATTEMPTS } from "./email-outbox-policy";
import { renderTransactionalEmail } from "./email-templates";
import { sendEmail } from "./email";

test("email retry policy uses bounded progressive delays", () => {
  const now = new Date("2026-01-01T00:00:00.000Z");
  assert.equal(getEmailRetryPlan(1, now).nextAttemptAt.getTime(), now.getTime() + 60_000);
  assert.equal(getEmailRetryPlan(2, now).nextAttemptAt.getTime(), now.getTime() + 5 * 60_000);
  assert.equal(getEmailRetryPlan(5, now).nextAttemptAt.getTime(), now.getTime() + 12 * 60 * 60_000);
  assert.equal(getEmailRetryPlan(MAX_EMAIL_ATTEMPTS, now).status, "failed");
});

test("transactional templates are selected from known event types", () => {
  const message = renderTransactionalEmail("payment-confirmed", {
    orderNumber: "GS-TEST-1",
    customerName: "Test Customer",
    totalAmount: "50000.00",
    items: [{ name: "Magenta Boubou", quantity: 1, size: "M", totalPrice: "50000.00" }],
  }, "delivered@example.test");
  assert.equal(message.to, "delivered@example.test");
  assert.match(message.subject, /GS-TEST-1/);
  assert.match(message.text, /50,000/);
  assert.match(message.html, /Magenta Boubou/);
  assert.throws(() => renderTransactionalEmail("unknown-event" as never, {}, "delivered@example.test"), /not supported|missing/i);
});

test("Resend boundary captures provider IDs and sends an idempotency key", async () => {
  const originalFetch = globalThis.fetch;
  const originalApiKey = process.env.RESEND_API_KEY;
  const originalFrom = process.env.EMAIL_FROM;
  let capturedHeaders: Headers | null = null;
  try {
    process.env.RESEND_API_KEY = "test-only-key";
    process.env.EMAIL_FROM = "Test <test@example.test>";
    globalThis.fetch = async (_input, init) => {
      capturedHeaders = new Headers(init?.headers);
      return new Response(JSON.stringify({ id: "provider-test-id" }), { status: 200, headers: { "content-type": "application/json" } });
    };
    const result = await sendEmail({ to: "delivered@example.test", subject: "Test", text: "Test", html: "<p>Test</p>" }, { idempotencyKey: "payment-confirmed:test-order" });
    assert.equal(result.providerMessageId, "provider-test-id");
    assert.equal((capturedHeaders as Headers | null)?.get("Idempotency-Key"), "payment-confirmed:test-order");
  } finally {
    globalThis.fetch = originalFetch;
    if (originalApiKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = originalApiKey;
    if (originalFrom === undefined) delete process.env.EMAIL_FROM;
    else process.env.EMAIL_FROM = originalFrom;
  }
});

test("Resend boundary converts provider failure into a safe error", async () => {
  const originalFetch = globalThis.fetch;
  const originalApiKey = process.env.RESEND_API_KEY;
  const originalFrom = process.env.EMAIL_FROM;
  try {
    process.env.RESEND_API_KEY = "test-only-key";
    process.env.EMAIL_FROM = "Test <test@example.test>";
    globalThis.fetch = async () => new Response(JSON.stringify({ message: "secret provider detail" }), { status: 503 });
    await assert.rejects(() => sendEmail({ to: "delivered@example.test", subject: "Test", text: "Test", html: "<p>Test</p>" }), /503/);
    await assert.rejects(() => sendEmail({ to: "delivered@example.test", subject: "Test", text: "Test", html: "<p>Test</p>" }), (error: Error) => !error.message.includes("secret provider detail"));
  } finally {
    globalThis.fetch = originalFetch;
    if (originalApiKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = originalApiKey;
    if (originalFrom === undefined) delete process.env.EMAIL_FROM;
    else process.env.EMAIL_FROM = originalFrom;
  }
});

test("Resend boundary times out without exposing credentials", async () => {
  const originalFetch = globalThis.fetch;
  const originalApiKey = process.env.RESEND_API_KEY;
  const originalFrom = process.env.EMAIL_FROM;
  try {
    process.env.RESEND_API_KEY = "test-only-key";
    process.env.EMAIL_FROM = "Test <test@example.test>";
    globalThis.fetch = async (_input, init) => await new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new Error("aborted")), { once: true });
    });
    await assert.rejects(() => sendEmail({ to: "delivered@example.test", subject: "Test", text: "Test", html: "<p>Test</p>" }, { timeoutMs: 5 }), /timed out/);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalApiKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = originalApiKey;
    if (originalFrom === undefined) delete process.env.EMAIL_FROM;
    else process.env.EMAIL_FROM = originalFrom;
  }
});
