"use client";
import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import React from "react";

export default function SignOutButton() {
  const router = useRouter();
  const handleSignOut = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/login"); // redirect to login page
        },
      },
    });
  };

  return <button onClick={handleSignOut}>signOut</button>;
}
