import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { authDb } from "./auth-db";
import { sendEmail } from "./email";

const emailDeliveryConfigured = Boolean(
  process.env.RESEND_API_KEY && process.env.EMAIL_FROM && process.env.BETTER_AUTH_URL,
);

export const auth = betterAuth({
  database: drizzleAdapter(authDb, { provider: "pg" }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    autoSignIn: false,
    minPasswordLength: 8,
    // Better Auth intentionally swallows delivery errors. Do not create
    // unverified customer accounts until a real sender is configured.
    disableSignUp: !emailDeliveryConfigured,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Reset your Glad Style Fashion password",
        text: `Reset your password: ${url}`,
        html: `<p>Use the link below to reset your Glad Style Fashion password.</p><p><a href="${url}">Reset password</a></p>`,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Verify your Glad Style Fashion account",
        text: `Verify your email address: ${url}`,
        html: `<p>Welcome to Glad Style Fashion.</p><p><a href="${url}">Verify your email address</a></p>`,
      });
    },
  },
});
