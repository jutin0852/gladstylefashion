"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { acceptStaffInvitation } from "@/app/actions/staff";
export function AcceptInvite({ token }: { token: string }) { const [message, setMessage] = useState(""); const [pending, startTransition] = useTransition(); const router = useRouter(); return <div><button disabled={pending} onClick={() => startTransition(async () => { try { await acceptStaffInvitation(token); router.replace("/admin"); router.refresh(); } catch (error) { setMessage(error instanceof Error ? error.message : "We could not accept the invitation."); } })} className="mt-8 bg-[#d3146d] px-6 py-4 text-xs font-semibold uppercase tracking-[.14em] text-white hover:bg-black">{pending ? "Accepting..." : "Accept invitation"}</button>{message && <p className="mt-5 text-sm text-[#d3146d]">{message}</p>}</div>; }
