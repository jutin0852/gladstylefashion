"use client";
import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const handleSignOut = async () => {
    setPending(true);
    try {
      await signOut({
        fetchOptions: {
          onSuccess: () => {
            router.replace("/");
            router.refresh();
          },
        },
      });
    } finally {
      setPending(false);
    }
  };

  return <button type="button" onClick={handleSignOut} disabled={pending} className="border border-black px-4 py-2 text-[11px] font-semibold uppercase tracking-[.14em] transition-colors hover:bg-black hover:text-white disabled:cursor-wait disabled:opacity-60">{pending ? "Logging out…" : "Log out"}</button>;
}
