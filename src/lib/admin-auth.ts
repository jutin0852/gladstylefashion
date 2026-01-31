import { headers } from "next/headers";
import { auth } from "./auth";
import { redirect } from "next/navigation";
import { db } from "./db";
import { user } from "./schema";
import { eq } from "drizzle-orm";

export async function getCurrentUser() {
  // not loggedin
  const session = await auth.api.getSession({
    headers: await headers(), // you need to pass the headers
  });
  if (!session) {
    redirect("/login"); // redirect to login if not logged in
  }
  const userData = await db
    .select()
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  if (userData.length === 0) return null;
  console.log("current user data:", session.user, userData[0]);
  return userData[0];
}

export async function requireAdmin() {
  const userData = await getCurrentUser();
  if (!userData?.isAdmin) {
    redirect("/unauthorised");
  }
  return userData;
}

export async function isCurrentUserAdmin() {
  const currentUser = await getCurrentUser();
  return currentUser?.isAdmin || false;
}
