import { eq } from "drizzle-orm";
import { db } from "./db";
import { user } from "./schema";

export const makeUserAdmin = async (email: string) => {
  try {
    const result = await db
      .update(user)
      .set({ isAdmin: true })
      .where(eq(user.email, email))
      .returning();

    if (result.length === 0) {
      console.log("No user found with the given email.");
      return false; // No user found with the given email
    }
    console.log("User updated to admin:", result[0]);
    return true; // User updated successfully
  } catch (error) {
    console.error("Error making user admin:", error);
    return false; // Error occurred
  }
};

export const checkAdminStatus = async (email: string) => {
  try {
    const users = await db.select().from(user).where(eq(user.email, email));
    if (users.length === 0) {
      console.log("No user found with the given email.", email);
      return false; // No user found with the given email
    }
    console.log("admin status:", users[0].isAdmin );
    return users[0].isAdmin; // Return the isAdmin status
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false; // Error occurred
  }
};
