export const EMAIL_RETRY_DELAYS_MS = [
  60_000,
  5 * 60_000,
  30 * 60_000,
  2 * 60 * 60_000,
  12 * 60 * 60_000,
] as const;

export const MAX_EMAIL_ATTEMPTS = EMAIL_RETRY_DELAYS_MS.length + 1;

export function getEmailRetryPlan(attemptCountAfterFailure: number, now = new Date()) {
  if (attemptCountAfterFailure >= MAX_EMAIL_ATTEMPTS) {
    return { status: "failed" as const, nextAttemptAt: now };
  }
  return {
    status: "pending" as const,
    nextAttemptAt: new Date(now.getTime() + EMAIL_RETRY_DELAYS_MS[attemptCountAfterFailure - 1]),
  };
}

export function sanitizeEmailError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown email delivery failure.";
  return message.replace(/bearer\s+\S+/gi, "Bearer [redacted]").replace(/\s+/g, " ").slice(0, 500);
}
