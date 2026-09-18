"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { signIn, signUp } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import BrandLogo from "../../components/store/brand-logo";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const signinWithGit = async () => {
    const data = await signIn.social({ provider: "github" });
    console.log(data);
  };
  const signinWithGoogle = async () => {
    const data = await signIn.social({ provider: "google" });
    console.log(data);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        const result = await signUp.email({ email, password, name });
        console.log("Sign up result:", result);
      } else {
        const result = await signIn.email({ email, password });
        console.log("Sign in result:", result);
      }
      alert("Success! Check the console for details.");
      router.push("/admin");
    } catch (error) {
      console.error("Auth error:", error);
      alert(`Authentication failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white px-5 py-5 text-[#111111] sm:px-10">
      <div className="mx-auto grid min-h-[calc(100dvh-40px)] max-w-[1120px] border border-black lg:grid-cols-[0.78fr_1.22fr]">
        <aside className="flex flex-col justify-between border-b border-black bg-[#d3146d] p-6 text-white sm:p-9 lg:border-b-0 lg:border-r">
          <Link href="/" className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.15em]"><ArrowLeft size={15} strokeWidth={1.5} /> Back to store</Link>
          <div className="py-16 lg:py-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80">Glad Style Fashion</p>
            <h1 className="mt-4 max-w-sm text-4xl font-medium leading-[0.98] tracking-[-0.055em] sm:text-5xl">Manage the collection with confidence.</h1>
          </div>
          <p className="max-w-xs border-t border-white/50 pt-4 text-xs leading-5 text-white/85">This area is for the team handling products, stock, and customer orders.</p>
        </aside>

        <section className="flex items-center px-6 py-12 sm:px-12">
          <div className="mx-auto w-full max-w-md">
            <BrandLogo className="h-auto w-44" />
            <p className="mt-9 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d3146d]">{isSignUp ? "Create your account" : "Welcome back"}</p>
            <h2 className="mt-3 text-4xl font-medium tracking-[-0.05em]">{isSignUp ? "Join the team." : "Sign in."}</h2>
            <p className="mt-3 text-sm leading-6 text-black/65">Use your administrator account to continue.</p>

            <form className="mt-9 space-y-5" onSubmit={handleSubmit}>
              {isSignUp && (
                <label className="block">
                  <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em]">Full name</span>
                  <input type="text" required value={name} onChange={(event) => setName(event.target.value)} className="w-full border border-black px-4 py-3 text-sm outline-none transition-colors focus:border-[#d3146d] focus:ring-1 focus:ring-[#d3146d]" placeholder="Your full name" />
                </label>
              )}
              <label className="block">
                <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em]">Email address</span>
                <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="w-full border border-black px-4 py-3 text-sm outline-none transition-colors focus:border-[#d3146d] focus:ring-1 focus:ring-[#d3146d]" placeholder="you@example.com" />
              </label>
              <label className="block">
                <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em]">Password</span>
                <input type="password" required value={password} onChange={(event) => setPassword(event.target.value)} className="w-full border border-black px-4 py-3 text-sm outline-none transition-colors focus:border-[#d3146d] focus:ring-1 focus:ring-[#d3146d]" placeholder="Your password" minLength={6} />
              </label>
              <button type="submit" disabled={loading} className="w-full bg-black py-4 text-xs font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#d3146d] disabled:cursor-not-allowed disabled:opacity-50">
                {loading ? "Processing..." : isSignUp ? "Create account" : "Sign in"}
              </button>
            </form>

            <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="mt-6 border-b border-[#d3146d] pb-1 text-xs font-semibold uppercase tracking-[0.13em] text-[#d3146d]">
              {isSignUp ? "Already have an account? Sign in" : "Need an account? Sign up"}
            </button>
            <div className="mt-8 flex gap-3 border-t border-black pt-6">
              <button className="border border-black px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors hover:bg-black hover:text-white" onClick={signinWithGit}>GitHub</button>
              <button className="border border-black px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors hover:bg-black hover:text-white" onClick={signinWithGoogle}>Google</button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
