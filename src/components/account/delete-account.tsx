"use client";

import { useState, useTransition } from "react";
import { deleteCustomerAccount } from "@/app/actions/account";

export function DeleteAccount() {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    startTransition(async () => {
      try {
        await deleteCustomerAccount(confirmation);
        window.location.assign("/");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "We could not delete your account.");
      }
    });
  }

  return <section className="mt-8 border border-[#d3146d] p-6 sm:p-8"><h2 className="text-2xl font-medium">Delete account</h2><p className="mt-3 max-w-xl text-sm leading-6 text-black/65">This permanently removes your customer account, saved addresses, and account access. Completed orders are kept as store records but disconnected from your account.</p>{!open ? <button type="button" onClick={() => setOpen(true)} className="mt-5 border border-[#d3146d] px-5 py-3 text-xs font-semibold uppercase tracking-[.13em] text-[#d3146d]">Delete my account</button> : <form onSubmit={submit} className="mt-5 max-w-md space-y-4"><p className="text-sm">If you are sure, type <strong>DELETE</strong> below to confirm.</p><input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Type DELETE" autoComplete="off" className="w-full border border-black px-3 py-3" /><div className="flex flex-wrap gap-3"><button type="submit" disabled={pending || confirmation !== "DELETE"} className="bg-[#d3146d] px-5 py-3 text-xs font-semibold uppercase tracking-[.13em] text-white disabled:cursor-not-allowed disabled:opacity-50">{pending ? "Deleting..." : "Permanently delete"}</button><button type="button" onClick={() => { setOpen(false); setConfirmation(""); setMessage(""); }} className="border border-black px-5 py-3 text-xs font-semibold uppercase tracking-[.13em]">Cancel</button></div>{message && <p role="alert" className="border-l-4 border-[#d3146d] bg-[#f8dbe9] px-4 py-3 text-sm">{message}</p>}</form>}</section>;
}
