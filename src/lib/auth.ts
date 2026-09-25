import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { authDb } from "./auth-db";
import { brandedEmail, escapeEmailHtml, sendEmail } from "./email";

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
        text: `Reset your Glad Style Fashion password: ${url}\n\nThis link expires soon. If you did not request a password reset, you can ignore this email.`,
        html: brandedEmail({ title: "Choose a new password.", eyebrow: "Account recovery", intro: "We received a request to reset your Glad Style Fashion password.", ctaLabel: "Reset password", ctaUrl: url, expiry: "This link is time-limited. If you did not request a password reset, you can ignore this email." }),
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    expiresIn: 60 * 60,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Verify your Glad Style Fashion account",
        text: `Welcome to Glad Style Fashion. Verify your email address: ${url}\n\nThis link expires in one hour and can only be used once.`,
        html: brandedEmail({ title: "Welcome to Glad Style Fashion.", eyebrow: "Your account is almost ready", intro: `Thanks for joining us, ${escapeEmailHtml(user.name || "there")}. Please verify your email address to finish setting up your account.`, ctaLabel: "Verify email address", ctaUrl: url, expiry: "This link expires in one hour and can only be used once. If you did not create this account, you can ignore this email." }),
      });
    },
  },
});
