"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, X } from "lucide-react";
import { useCart } from "./cart-context";
import { primaryProductAlt, primaryProductImage } from "./brand-assets";
import { formatStorePrice } from "./currency";

type CartDrawerProps = {
  open: boolean;
  onClose: () => void;
  fallbackImage: string;
  emptyContent: ReactNode;
  width?: "sm" | "md";
};

export default function CartDrawer({
  open,
  onClose,
  fallbackImage,
  emptyContent,
  width = "md",
}: CartDrawerProps) {
  const { cart, cartTotal, updateQuantity, removeItem } = useCart();

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      )}
      <aside
        aria-label="Shopping bag"
        aria-hidden={!open}
        inert={!open}
        className={`fixed right-0 top-0 z-50 flex h-full w-full flex-col border-l border-black bg-white p-5 shadow-2xl transition-transform sm:p-7 ${width === "sm" ? "max-w-sm" : "max-w-md"} ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between border-b border-black pb-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#d3146d]">Glad Style Fashion</p>
            <h2 className="mt-1 text-3xl font-medium tracking-[-0.04em]">Your bag</h2>
          </div>
          <button onClick={onClose} aria-label="Close shopping bag" className="grid size-10 place-items-center border border-black transition-colors hover:bg-black hover:text-white">
            <X size={22} strokeWidth={1.5} />
          </button>
        </div>
        {cart.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <ShoppingBag size={28} strokeWidth={1.5} />
            <p className="mt-5 text-2xl font-medium tracking-[-0.04em]">Your bag is waiting.</p>
            {emptyContent}
          </div>
        ) : (
          <>
            <div className="flex-1 divide-y divide-black/15 overflow-y-auto">
              {cart.map((item) => (
                <div
                  key={JSON.stringify([item.id, item.size || "", item.customizations || {}])}
                  className="flex gap-4 py-5"
                >
                  <Link href={`/product/${item.slug}?edit=1&size=${encodeURIComponent(item.size || "")}&quantity=${item.quantity}&color=${encodeURIComponent(item.customizations?.color || "")}&desiredLength=${encodeURIComponent(item.customizations?.desiredLength || "")}&customerHeight=${encodeURIComponent(item.customizations?.customerHeight || "")}&notes=${encodeURIComponent(item.customizations?.notes || "")}`} onClick={onClose} className="shrink-0" aria-label={`View ${item.productName}`}>
                    <img src={item.images?.[0]?.imageUrl || primaryProductImage || fallbackImage} alt={item.images?.[0]?.altText || primaryProductAlt} className="h-28 w-24 bg-[#f8dbe9] object-cover transition-opacity hover:opacity-75" />
                  </Link>
                  <div className="flex flex-1 flex-col justify-between">
                    <div className="flex justify-between gap-2">
                      <div>
                        <Link href={`/product/${item.slug}?edit=1&size=${encodeURIComponent(item.size || "")}&quantity=${item.quantity}&color=${encodeURIComponent(item.customizations?.color || "")}&desiredLength=${encodeURIComponent(item.customizations?.desiredLength || "")}&customerHeight=${encodeURIComponent(item.customizations?.customerHeight || "")}&notes=${encodeURIComponent(item.customizations?.notes || "")}`} onClick={onClose} className="text-lg font-medium underline decoration-black/20 underline-offset-4 hover:text-[#d3146d]">{item.productName}</Link>
                        {item.size && (
                          <p className="mt-1 text-xs text-black/50">Size {item.size}</p>
                        )}
                        {item.customizations?.notes && <p className="mt-1 text-xs text-black/50">Note: {item.customizations.notes}</p>}
                        <Link href={`/product/${item.slug}?edit=1&size=${encodeURIComponent(item.size || "")}&quantity=${item.quantity}&color=${encodeURIComponent(item.customizations?.color || "")}&desiredLength=${encodeURIComponent(item.customizations?.desiredLength || "")}&customerHeight=${encodeURIComponent(item.customizations?.customerHeight || "")}&notes=${encodeURIComponent(item.customizations?.notes || "")}`} onClick={onClose} className="mt-2 inline-block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#d3146d] underline">Edit selections</Link>
                      </div>
                      <span className="text-sm">
                        {formatStorePrice(Number(item.price) * item.quantity)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <button
                        onClick={() => updateQuantity(item.id, -1, item.size, item.customizations)}
                        className="grid size-7 place-items-center border border-black transition-colors hover:border-[#d3146d] hover:bg-[#d3146d] hover:text-white"
                        aria-label={`Remove one ${item.productName}`}
                      >
                        <Minus size={13} />
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1, item.size, item.customizations)}
                        className="grid size-7 place-items-center border border-black transition-colors hover:border-[#d3146d] hover:bg-[#d3146d] hover:text-white"
                        aria-label={`Add one ${item.productName}`}
                      >
                        <Plus size={13} />
                      </button>
                      <button
                        onClick={() => removeItem(item.id, item.size, item.customizations)}
                        className="ml-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#d3146d] underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-black pt-5">
              <div className="flex justify-between text-2xl font-medium tracking-[-0.04em]">
                <span>Total</span>
                <span>{formatStorePrice(cartTotal)}</span>
              </div>
              <Link
                href="/checkout"
                onClick={onClose}
                className="mt-5 block w-full bg-[#d3146d] py-4 text-center text-xs font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-black active:scale-[0.98]"
              >
                Checkout
              </Link>
            </div>
          </>
        )}
      </aside>
    </>
  );
}


