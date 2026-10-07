"use server";
import { createHash, randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { and, desc, eq, isNull, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { transactionDb } from "@/lib/transaction-db";
import { emailOutbox, staffInvitations, user } from "@/lib/schema";
import { queueEmailOutbox } from "@/lib/email-outbox";
import { getSessionUser, requireOwner } from "@/lib/admin-auth";

const hash = (token: string) => createHash("sha256").update(token).digest("hex");
export async function inviteStaff(email: string) {
  const owner = await requireOwner();
  const normalizedEmail = email.trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) throw new Error("Enter a valid email address.");
  const baseUrl = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (!baseUrl) throw new Error("Set BETTER_AUTH_URL before sending staff invitations.");
  const token = randomBytes(32).toString("hex");
  const invitation = await transactionDb.transaction(async (tx) => {
    const [createdInvitation] = await tx.insert(staffInvitations).values({
      email: normalizedEmail,
      role: "staff",
      tokenHash: hash(token),
      invitedByUserId: owner.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    }).returning({ id: staffInvitations.id });
    const url = `${baseUrl.replace(/\/$/, "")}/account/accept-invite?token=${token}`;
    await queueEmailOutbox(tx, {
      dedupeKey: `staff-invitation:${createdInvitation.id}`,
      eventType: "staff-invitation",
      recipient: normalizedEmail,
      invitationId: createdInvitation.id,
      payload: { invitationId: createdInvitation.id, acceptUrl: url },
    });
    return createdInvitation;
  });
  revalidatePath("/admin/staff");
  return { invitationId: invitation.id };
}
export async function acceptStaffInvitation(token: string) { const currentUser = await getSessionUser(); if (!currentUser) throw new Error("Sign in to the account that received this invitation."); const [invite] = await db.select().from(staffInvitations).where(and(eq(staffInvitations.tokenHash, hash(token)), eq(staffInvitations.email, currentUser.email.toLowerCase()), isNull(staffInvitations.acceptedAt), isNull(staffInvitations.revokedAt))).limit(1); if (!invite || invite.expiresAt < new Date()) throw new Error("This invitation is invalid or has expired."); await transactionDb.transaction(async (tx) => { await tx.update(user).set({ role: "staff", isAdmin: true, updatedAt: new Date() }).where(eq(user.id, currentUser.id)); await tx.update(staffInvitations).set({ acceptedAt: new Date() }).where(eq(staffInvitations.id, invite.id)); }); revalidatePath("/admin/staff"); }
export async function revokeInvitation(inviteId: string) { await requireOwner(); await db.update(staffInvitations).set({ revokedAt: new Date() }).where(and(eq(staffInvitations.id, inviteId), isNull(staffInvitations.acceptedAt))); await db.update(emailOutbox).set({ status: "failed", lastError: "Invitation revoked before delivery.", lockedUntil: null, lockToken: null, updatedAt: new Date() }).where(and(eq(emailOutbox.invitationId, inviteId), or(eq(emailOutbox.status, "pending"), eq(emailOutbox.status, "processing")))); revalidatePath("/admin/staff"); }
export async function getStaffData() { await requireOwner(); const members = await db.select({ id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt }).from(user).where(or(eq(user.role, "staff"), eq(user.role, "owner"))).orderBy(user.role, user.name); const invitations = await db.select().from(staffInvitations).orderBy(desc(staffInvitations.createdAt)); return { members, invitations }; }
