"use client";

import Link from "next/link";
import { Check, ShoppingBag, X } from "lucide-react";
import type { CartFeedback } from "./use-cart-feedback";
import { formatStorePrice } from "./currency";

export default function CartAddToast({
  feedback,
  bagQuantity,
  onDismiss,
  onViewBag,
}: {
  feedback: CartFeedback | null;
  bagQuantity: number;
  onDismiss: () => void;
  onViewBag: () => void;
}) {
  if (!feedback?.success) return null;

  const image = feedback.product.images?.[0];
  return (
    <>
      <button
        aria-label="Dismiss added to bag message"
        className="fixed inset-0 z-40 cursor-default bg-transparent"
        onClick={onDismiss}
      />
      <section
        aria-live="polite"
        className="fixed inset-x-4 bottom-4 z-50 border border-black bg-white p-4 shadow-[8px_8px_0_#d3146d] sm:inset-x-auto sm:right-6 sm:top-6 sm:bottom-auto sm:w-[390px]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-black pb-3">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#d3146d]">
            <Check size={15} strokeWidth={2} /> Added to your bag
          </div>
          <button onClick={onDismiss} aria-label="Close added to bag message" className="-mr-1 -mt-1 grid size-7 place-items-center transition-colors hover:bg-black hover:text-white"><X size={17} strokeWidth={1.5} /></button>
        </div>
        <div className="flex gap-3 py-4">
          {image && <img src={image.imageUrl} alt={image.altText || feedback.product.productName} className="h-20 w-16 bg-[#f8dbe9] object-cover" />}
          <div className="min-w-0 flex-1">
            <p className="text-base font-medium leading-tight">{feedback.product.productName}</p>
            <p className="mt-1 text-xs text-black/60">{feedback.size ? `Size ${feedback.size}` : "Size to be confirmed"} | {bagQuantity} in your bag</p>
            <p className="mt-2 text-sm font-medium">{formatStorePrice(Number(feedback.product.price) * feedback.quantity)}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={onViewBag} className="flex items-center justify-center gap-2 border border-black px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors hover:border-[#d3146d] hover:text-[#d3146d] active:scale-[0.98]"><ShoppingBag size={15} strokeWidth={1.5} /> View bag</button>
          <Link href="/checkout" onClick={onDismiss} className="flex items-center justify-center bg-[#d3146d] px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-black active:scale-[0.98]">Checkout</Link>
        </div>
      </section>
    </>
  );
}
