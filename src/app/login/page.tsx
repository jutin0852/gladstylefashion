"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { signIn } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import BrandLogo from "../../components/store/brand-logo";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const result = await signIn.email({ email, password });
    setLoading(false);
    if (result.error) return setMessage(result.error.message || "We could not sign you in with those details.");
    router.replace("/admin");
    router.refresh();
  };

  return (
    <main className="min-h-screen bg-white px-5 py-5 text-[#111111] sm:px-10">
      <div className="mx-auto grid min-h-[calc(100dvh-40px)] max-w-[1120px] border border-black lg:grid-cols-[0.78fr_1.22fr]">
        <aside className="flex flex-col justify-between border-b border-black bg-[#d3146d] p-6 text-white sm:p-9 lg:border-b-0 lg:border-r">
          <Link href="/" className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.15em]"><ArrowLeft size={15} strokeWidth={1.5} /> Back to store</Link>
          <div className="py-16 lg:py-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80">Glad Style Fashion</p>
            <h1 className="mt-4 max-w-sm text-4xl font-medium leading-[0.98] tracking-[-0.055em] sm:text-5xl">Staff access for the people running the store.</h1>
          </div>
          <p className="max-w-xs border-t border-white/50 pt-4 text-xs leading-5 text-white/85">This area is for the team handling products, stock, and customer orders.</p>
        </aside>

        <section className="flex items-center px-6 py-12 sm:px-12">
          <div className="mx-auto w-full max-w-md">
            <BrandLogo className="h-auto w-44" />
            <p className="mt-9 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d3146d]">Staff area</p>
            <h2 className="mt-3 text-4xl font-medium tracking-[-0.05em]">Sign in.</h2>
            <p className="mt-3 text-sm leading-6 text-black/65">There is no public staff sign-up. Ask the owner for an invitation if you need access.</p>

            <form className="mt-9 space-y-5" onSubmit={handleSubmit}>
              <label className="block">
                <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em]">Email address</span>
                <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="w-full border border-black px-4 py-3 text-sm outline-none transition-colors focus:border-[#d3146d] focus:ring-1 focus:ring-[#d3146d]" placeholder="you@example.com" />
              </label>
              <label className="block">
                <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em]">Password</span>
                <span className="relative block"><input type={showPassword ? "text" : "password"} required value={password} onChange={(event) => setPassword(event.target.value)} className="w-full border border-black px-4 py-3 pr-16 text-sm outline-none transition-colors focus:border-[#d3146d] focus:ring-1 focus:ring-[#d3146d]" placeholder="Your password" minLength={6} /><button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} className="absolute inset-y-0 right-0 px-4 text-[10px] font-semibold uppercase tracking-[.12em] text-[#d3146d] underline">{showPassword ? "Hide" : "Show"}</button></span>
              </label>
              {message && <p className="border-l-4 border-[#d3146d] bg-[#f8dbe9] px-4 py-3 text-sm">{message}</p>}
              <button type="submit" disabled={loading} className="w-full bg-black py-4 text-xs font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#d3146d] disabled:cursor-not-allowed disabled:opacity-50">{loading ? "Signing in..." : "Sign in to admin"}</button>
            </form>
            <div className="mt-6 flex gap-4 text-xs font-semibold uppercase tracking-[0.12em]"><Link href="/account/sign-in" className="text-[#d3146d] underline">Customer sign in</Link><Link href="/account/forgot-password" className="text-black/65 underline">Reset password</Link></div>
          </div>
        </section>
      </div>
    </main>
  );
}
