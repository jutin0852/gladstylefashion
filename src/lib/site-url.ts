export function getSiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL;
  if (configuredUrl) return configuredUrl.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
