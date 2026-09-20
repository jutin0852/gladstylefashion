import { createAuthClient } from "better-auth/react";

export const { signIn, signUp, signOut, requestPasswordReset, resetPassword, sendVerificationEmail } = createAuthClient({
  baseURL:
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.BETTER_AUTH_URL,
});
