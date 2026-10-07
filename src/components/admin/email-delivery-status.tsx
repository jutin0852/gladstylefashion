"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { retryFailedEmail } from "@/app/actions/email-outbox";

type EmailStatus = {
  id: string;
  eventType: string;
  status: string;
  attemptCount: number;
  lastAttemptAt: Date | null;
  sentAt: Date | null;
  providerMessageId: string | null;
  lastError: string | null;
};

function label(eventType: string) {
  return eventType.replaceAll("-", " ");
}

export function EmailDeliveryStatus({ emails }: { emails: EmailStatus[] }) {
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (!emails.length) return null;

  return (
    <div className="rounded-lg border p-4">
      <h2 className="font-medium">Email delivery</h2>
      <div className="mt-3 space-y-3">
        {emails.map((email) => (
          <div key={email.id} className="border-t pt-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="capitalize">{label(email.eventType)}</span>
              <span className={email.status === "failed" ? "font-semibold text-destructive" : "capitalize text-muted-foreground"}>{email.status}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Attempts: {email.attemptCount} · Last attempt: {email.lastAttemptAt ? new Date(email.lastAttemptAt).toLocaleString("en-GB") : "Not attempted"}</p>
            {email.sentAt ? <p className="mt-1 text-xs text-muted-foreground">Sent: {new Date(email.sentAt).toLocaleString("en-GB")}</p> : null}
            {email.providerMessageId ? <p className="mt-1 break-all text-xs text-muted-foreground">Provider ID: {email.providerMessageId}</p> : null}
            {email.lastError ? <p className="mt-2 text-xs text-destructive">{email.lastError}</p> : null}
            {email.status === "failed" ? <button type="button" disabled={pending} onClick={() => startTransition(async () => { try { await retryFailedEmail(email.id); setMessage("Email requeued."); router.refresh(); } catch (error) { setMessage(error instanceof Error ? error.message : "Could not retry email."); } })} className="mt-2 text-xs font-semibold underline disabled:opacity-50">Retry delivery</button> : null}
          </div>
        ))}
      </div>
      {message ? <p className="mt-3 text-xs text-muted-foreground">{message}</p> : null}
    </div>
  );
}
