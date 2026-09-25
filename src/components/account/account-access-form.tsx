"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { sendVerificationEmail, signIn, signUp } from "@/lib/auth-client";

export function AccountAccessForm({ mode }: { mode: "sign-in" | "register" }) {
  const router = useRouter(); const search = useSearchParams(); const [name, setName] = useState(""); const [email, setEmail] = useState(search.get("email") || ""); const [password, setPassword] = useState(""); const [showPassword, setShowPassword] = useState(false); const [message, setMessage] = useState(""); const [pending, setPending] = useState(false); const [resendAvailableAt, setResendAvailableAt] = useState<number | null>(null); const [secondsRemaining, setSecondsRemaining] = useState(0);
  const isRegister = mode === "register";
  const returnTo = search.get("returnTo")?.startsWith("/") ? search.get("returnTo")! : "/account";
  useEffect(() => {
    if (!resendAvailableAt) { setSecondsRemaining(0); return; }
    const updateCountdown = () => setSecondsRemaining(Math.max(0, Math.ceil((resendAvailableAt - Date.now()) / 1000)));
    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(timer);
  }, [resendAvailableAt]);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setPending(true); setMessage("");
    const result = isRegister ? await signUp.email({ name, email, password, callbackURL: returnTo }) : await signIn.email({ email, password });
    setPending(false);
    if (result.error) {
      if (!isRegister && (result.error.code === "EMAIL_NOT_VERIFIED" || result.error.message === "Email not verified")) {
        setMessage("EMAIL_NOT_VERIFIED");
        setResendAvailableAt(Date.now() + 60_000);
      } else setMessage(result.error.message || "We could not complete that request.");
      return;
    }
    if (isRegister) { setMessage("Your account is nearly ready. Check your inbox and spam folder for the verification email, then sign in."); return; }
    router.replace(returnTo); router.refresh();
  }
  async function resendVerification() {
    if (!email) return setMessage("Enter your email address first.");
    if (secondsRemaining > 0) return;
    setPending(true);
    const result = await sendVerificationEmail({ email, callbackURL: returnTo });
    setPending(false);
    if (result.error) { setMessage(result.error.message || "We could not resend the verification email."); return; }
    setMessage("VERIFICATION_SENT");
    setResendAvailableAt(Date.now() + 60_000);
  }
  return <form onSubmit={submit} className="mt-9 space-y-5">
    {isRegister && <label className="block"><span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em]">Full name</span><input required value={name} onChange={(event) => setName(event.target.value)} className="w-full border border-black px-4 py-3 text-sm outline-none focus:border-[#d3146d] focus:ring-1 focus:ring-[#d3146d]" /></label>}
    <label className="block"><span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em]">Email address</span><input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="w-full border border-black px-4 py-3 text-sm outline-none focus:border-[#d3146d] focus:ring-1 focus:ring-[#d3146d]" /></label>
    <label className="block"><span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em]">Password</span><span className="relative block"><input type={showPassword ? "text" : "password"} minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} className="w-full border border-black px-4 py-3 pr-16 text-sm outline-none focus:border-[#d3146d] focus:ring-1 focus:ring-[#d3146d]" /><button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} className="absolute inset-y-0 right-0 px-4 text-[10px] font-semibold uppercase tracking-[.12em] text-[#d3146d] underline">{showPassword ? "Hide" : "Show"}</button></span></label>
    {message === "EMAIL_NOT_VERIFIED" && <div role="alert" className="space-y-3 border-l-4 border-[#d3146d] bg-[#f8dbe9] px-4 py-3 text-sm leading-6"><p>Your email is not verified yet. We&apos;ll send you a verification email now. It may take a few minutes to arrive, so please check your inbox and spam folder.</p><button type="button" onClick={resendVerification} disabled={pending || secondsRemaining > 0} className="font-semibold underline disabled:cursor-not-allowed disabled:opacity-50">{secondsRemaining > 0 ? `Resend verification in ${secondsRemaining}s` : "Resend verification email"}</button></div>}
    {message === "VERIFICATION_SENT" && <div role="status" className="space-y-2 border-l-4 border-[#d3146d] bg-[#f8dbe9] px-4 py-3 text-sm leading-6"><p>Verification email sent. It may take a few minutes to arrive—please check your inbox and spam folder.</p><button type="button" onClick={resendVerification} disabled={pending || secondsRemaining > 0} className="font-semibold underline disabled:cursor-not-allowed disabled:opacity-50">{secondsRemaining > 0 ? `Send another email in ${secondsRemaining}s` : "Send another verification email"}</button></div>}
    {message && !["EMAIL_NOT_VERIFIED", "VERIFICATION_SENT"].includes(message) && <p role="alert" className="border-l-4 border-[#d3146d] bg-[#f8dbe9] px-4 py-3 text-sm leading-6">{message}</p>}
    <button disabled={pending} className="w-full bg-[#d3146d] py-4 text-xs font-semibold uppercase tracking-[0.16em] text-white hover:bg-black disabled:opacity-50">{pending ? "Please wait..." : isRegister ? "Create account" : "Sign in"}</button>
    <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold uppercase tracking-[0.12em]">{isRegister ? <><Link className="text-[#d3146d] underline" href="/account/sign-in">Already have an account? Sign in</Link><button type="button" onClick={resendVerification} disabled={pending} className="text-black/65 underline">Resend verification</button></> : <Link className="text-[#d3146d] underline" href="/account/register">New here? Create an account</Link>} {!isRegister && <Link className="text-black/65 underline" href="/account/forgot-password">Forgot password?</Link>}</div>
  </form>;
}
