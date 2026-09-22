"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Clock3, TriangleAlert } from "lucide-react";
import BrandLogo from "./brand-logo";
import { useCart } from "./cart-context";

export default function PaymentConfirmation({ result }: { result: { state: "paid" | "pending" | "failed" | "review"; orderNumber?: string; message?: string } }) {
  const { clearCart } = useCart();
  const paid = result.state === "paid" || result.state === "review";
  const hasClearedCart = useRef(false);
  useEffect(() => {
    if (paid && !hasClearedCart.current) {
      hasClearedCart.current = true;
      clearCart();
    }
  }, [clearCart, paid]);

  const isPaid = result.state === "paid";
  const isPending = result.state === "pending";
  const Icon = isPaid ? Check : isPending ? Clock3 : TriangleAlert;
  const heading = isPaid ? "Payment received." : isPending ? "Confirming your payment." : result.state === "review" ? "Payment received." : "Payment not completed.";
  const detail = isPaid
    ? `Order ${result.orderNumber} is confirmed. We will contact you with delivery updates.`
    : result.state === "review"
      ? `Order ${result.orderNumber} needs a quick stock check before fulfilment. We will contact you shortly.`
      : result.message || "Please return to checkout and try again.";

  return <main className="min-h-screen bg-white px-5 py-5 text-[#111111] sm:px-10">
    <div className="mx-auto flex min-h-[calc(100dvh-40px)] max-w-[960px] flex-col border border-black">
      <header className="flex items-center justify-between border-b border-black px-5 py-4 sm:px-8">
        <Link href="/" aria-label="Glad Style Fashion home"><BrandLogo className="h-auto w-36 sm:w-44" /></Link>
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#d3146d]">Secure payment</span>
      </header>
      <div className="flex flex-1 flex-col items-center justify-center px-5 py-16 text-center">
        <div className="grid size-14 place-items-center rounded-full bg-[#d3146d] text-white"><Icon size={26} strokeWidth={1.75} /></div>
        <p className="mt-7 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d3146d]">Glad Style Fashion</p>
        <h1 className="mt-4 max-w-xl text-5xl font-medium leading-[0.95] tracking-[-0.06em] sm:text-7xl">{heading}</h1>
        <p className="mt-6 max-w-md text-sm leading-7 text-black/65">{detail}</p>
        {isPending && <Link href="/checkout" className="mt-10 inline-flex items-center gap-3 bg-black px-6 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#d3146d]"><ArrowLeft size={16} strokeWidth={1.5} /> Back to checkout</Link>}
        {!isPending && <Link href="/" className="mt-10 inline-flex items-center gap-3 bg-black px-6 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#d3146d]"><ArrowLeft size={16} strokeWidth={1.5} /> Continue shopping</Link>}
      </div>
    </div>
  </main>;
}
