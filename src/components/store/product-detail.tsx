"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Minus, Plus, ShoppingBag } from "lucide-react";
import Link from "next/link";
import BrandLogo from "./brand-logo";
import { primaryProductAlt, primaryProductImage } from "./brand-assets";
import { formatStorePrice } from "./currency";
import CartDrawer from "./cart-drawer";
import { useCart, type StoreProduct } from "./cart-context";
import { useCartFeedback } from "./use-cart-feedback";

export default function ProductDetail({
  product,
}: {
  product: StoreProduct & {
    sizes?: string[] | null;
    materials?: string | null;
    careInstructions?: string | null;
  };
}) {
  const searchParams = useSearchParams();
  const editMode = searchParams.get("edit") === "1";
  const initialSize = searchParams.get("size") || product.sizes?.[0] || "";
  const initialQuantity = Math.max(1, Number(searchParams.get("quantity")) || 1);
  const initialCustomizations = {
    color: searchParams.get("color") || undefined,
    desiredLength: searchParams.get("desiredLength") || undefined,
    customerHeight: searchParams.get("customerHeight") || undefined,
    notes: searchParams.get("notes") || undefined,
  };
  const [size, setSize] = useState(initialSize);
  const [quantity, setQuantity] = useState(initialQuantity);  const [notes, setNotes] = useState(initialCustomizations.notes || "");
  const [bagOpen, setBagOpen] = useState(false);
  const { cartCount, removeItem } = useCart();
  const { feedback, addWithFeedback } = useCartFeedback();
  const isAvailable = (product.inventoryCount ?? 0) > 0;

  function addProduct() {
    if (editMode) removeItem(product.id, initialSize, initialCustomizations);
    addWithFeedback(product, size, quantity, {      notes: notes.trim() || undefined,
    });
  }

  return (
    <main className="min-h-screen bg-white text-[#111111]">
      <header className="relative mx-auto flex max-w-[1440px] items-center justify-between border-b border-black px-5 py-4 lg:px-10">
        <Link href="/" className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] sm:text-xs">
          <ArrowLeft size={16} strokeWidth={1.5} /> <span className="hidden sm:inline">Back to collection</span>
        </Link>
        <Link href="/" className="absolute left-1/2 -translate-x-1/2 bg-white px-2" aria-label="Glad Style Fashion home">
          <BrandLogo className="h-auto w-32 sm:w-44" />
        </Link>
        <button onClick={() => setBagOpen(true)} className="relative grid size-10 place-items-center border border-black transition-colors hover:bg-black hover:text-white" aria-label="Open shopping bag">
          <ShoppingBag size={19} strokeWidth={1.5} />
          {cartCount > 0 && <span className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-[#d3146d] text-[10px] font-bold text-white">{cartCount}</span>}
        </button>
      </header>

      <section className="mx-auto grid max-w-[1440px] border-x border-black lg:grid-cols-[1.12fr_0.88fr]">
        <div className="bg-[#f8dbe9] p-4 sm:p-8">
          <img src={product.images?.[0]?.imageUrl || primaryProductImage} alt={product.images?.[0]?.altText || primaryProductAlt} className="aspect-[3/4] w-full object-cover" />
        </div>
        <div className="px-5 py-10 sm:px-10 sm:py-14 lg:sticky lg:top-0 lg:h-fit">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d3146d]">{product.category?.name || "Glad Style Fashion"}</p>
          <div className="mt-4 flex items-start justify-between gap-5 border-b border-black pb-6">
            <h1 className="max-w-md text-4xl font-medium leading-[0.96] tracking-[-0.055em] sm:text-5xl">{product.productName}</h1>
            <span className="pt-2 text-lg font-medium">{formatStorePrice(product.price)}</span>
          </div>
          <p className="mt-6 max-w-md text-sm leading-7 text-black/70">
            {product.description || "A ready-to-wear statement piece designed for plans that deserve a little more presence."}
          </p>

          <div className="mt-8 border-y border-black py-6">
            {product.sizes && product.sizes.length > 0 && (
              <div>
                <div className="mb-4 flex justify-between text-[11px] font-semibold uppercase tracking-[0.14em]">
                  <span>Choose a size</span>
                  <span className="text-[#d3146d]">Selected: {size}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((item) => (
                    <button
                      key={item}
                      onClick={() => setSize(item)}
                      className={`min-w-12 border px-4 py-3 text-xs font-semibold transition-colors ${size === item ? "border-[#d3146d] bg-[#d3146d] text-white" : "border-black bg-white hover:border-[#d3146d] hover:text-[#d3146d]"}`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-7 border-t border-black/15 pt-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em]">Additional information</p>
              <p className="mt-2 text-xs leading-5 text-black/55">Add any request or detail you want our team to know before we confirm your order.</p>
              <label className="mt-4 block"><textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} maxLength={500} placeholder="Any details you want our team to know" className="w-full resize-none border border-black bg-white px-3 py-3 text-sm outline-none placeholder:text-black/30 focus:border-[#d3146d]" /></label>
            </div>
            <div className="mt-7 flex items-center justify-between border-t border-black/15 pt-6 text-[11px] font-semibold uppercase tracking-[0.14em]">
              <span>Quantity</span>
              <div className="flex items-center border border-black">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="grid size-10 place-items-center transition-colors hover:bg-black hover:text-white" aria-label="Decrease quantity"><Minus size={15} strokeWidth={1.5} /></button>
                <span className="grid size-10 place-items-center border-x border-black text-sm">{quantity}</span>
                <button onClick={() => setQuantity(Math.min(product.inventoryCount || 1, quantity + 1))} className="grid size-10 place-items-center transition-colors hover:bg-black hover:text-white" aria-label="Increase quantity"><Plus size={15} strokeWidth={1.5} /></button>
              </div>
            </div>
          </div>

          <button disabled={!isAvailable} onClick={addProduct} className="mt-6 flex w-full items-center justify-center gap-3 bg-[#d3146d] py-4 text-xs font-semibold uppercase tracking-[0.17em] text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:bg-black/20">
            {feedback?.success ? (editMode ? "Bag updated" : "Added to bag") : isAvailable ? (editMode ? "Update selections" : "Add to bag") : "Sold out"} <ArrowRight size={16} strokeWidth={1.5} />
          </button>
          <p role="status" aria-live="polite" className="min-h-5 pt-3 text-sm text-[#d3146d]">{feedback?.success ? feedback.message : ""}</p>

          <div className="mt-7 divide-y divide-black/15 border-y border-black">
            {[
              ["Details", product.materials || "Designed for movement and made for repeat wear."],
              ["Care", product.careInstructions || "Follow the care label to preserve the fabric and finish."],
              ["Delivery", "Delivery options and charges are confirmed at checkout."],
            ].map(([title, copy]) => (
              <details key={title} className="py-4">
                <summary className="cursor-pointer list-none text-[11px] font-semibold uppercase tracking-[0.15em]">{title}</summary>
                <p className="mt-3 max-w-md text-sm leading-6 text-black/65">{copy}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <CartDrawer
        open={bagOpen}
        onClose={() => setBagOpen(false)}
        width="sm"
        fallbackImage={primaryProductImage}
        emptyContent={<Link href="/" onClick={() => setBagOpen(false)} className="mt-6 border-b border-[#d3146d] pb-2 text-xs font-semibold uppercase tracking-[0.15em] text-[#d3146d]">Continue shopping</Link>}
      />
    </main>
  );
}


