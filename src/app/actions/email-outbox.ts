"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { emailOutbox } from "@/lib/schema";

export async function retryFailedEmail(emailId: string) {
  await requireAdmin();
  const [message] = await db.select({ id: emailOutbox.id, orderId: emailOutbox.orderId }).from(emailOutbox).where(and(eq(emailOutbox.id, emailId), eq(emailOutbox.status, "failed"))).limit(1);
  if (!message) throw new Error("This email is not available for retry.");
  await db.update(emailOutbox).set({
    status: "pending",
    attemptCount: 0,
    nextAttemptAt: new Date(),
    lastError: null,
    lockedUntil: null,
    lockToken: null,
    updatedAt: new Date(),
  }).where(and(eq(emailOutbox.id, emailId), eq(emailOutbox.status, "failed")));
  revalidatePath("/admin");
  if (message.orderId) revalidatePath(`/admin/orders/${message.orderId}`);
  return { success: true };
}
