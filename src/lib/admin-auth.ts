import { headers } from "next/headers";
import { auth } from "./auth";
import { redirect } from "next/navigation";
import { db } from "./db";
import { user } from "./schema";
import { eq } from "drizzle-orm";

export async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const userData = await db
    .select()
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  return userData[0] || null;
}

export async function getCurrentUser() {
  const currentUser = await getSessionUser();
  if (!currentUser) redirect("/login");
  return currentUser;
}

export async function requireAdmin() {
  const userData = await getCurrentUser();
  if (userData.role !== "staff" && userData.role !== "owner") {
    redirect("/unauthorised");
  }
  return userData;
}

export const requireStaff = requireAdmin;

export async function requireOwner() {
  const currentUser = await getCurrentUser();
  if (currentUser.role !== "owner") redirect("/unauthorised");
  return currentUser;
}

export async function isCurrentUserAdmin() {
  const currentUser = await getSessionUser();
  return currentUser?.role === "staff" || currentUser?.role === "owner";
}
