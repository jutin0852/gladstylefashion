"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, MessageCircle, Minus, Plus, ShoppingBag } from "lucide-react";
import Link from "next/link";
import BrandLogo from "./brand-logo";
import { primaryProductAlt, primaryProductImage } from "./brand-assets";
import { formatStorePrice } from "./currency";
import CartDrawer from "./cart-drawer";
import CartAddToast from "./cart-add-toast";
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
  const gallery = product.images?.length
    ? product.images
    : [{ id: 0, imageUrl: primaryProductImage, altText: primaryProductAlt }];
  const [size, setSize] = useState(initialSize);
  const [quantity, setQuantity] = useState(initialQuantity);
  const [notes, setNotes] = useState(initialCustomizations.notes || "");
  const [bagOpen, setBagOpen] = useState(false);
  const { cart, cartCount, removeItem } = useCart();
  const { feedback, addWithFeedback, dismissFeedback } = useCartFeedback();
  const stock = product.inventoryCount ?? 0;
  const isCustomWear = product.category?.slug === "custom-traditional-wear";
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "");
  const whatsappHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hello Glad Style Fashion, I am interested in the ${product.productName}. I would like to arrange a fitting consultation.`)}`
    : undefined;
  const isAvailable = stock > 0;
  const availability = !isAvailable ? "Sold out" : stock <= 5 ? "Low stock" : "Available";
  const bagQuantity = cart
    .filter(
      (item) =>
        item.id === product.id &&
        item.size === size &&
        JSON.stringify(item.customizations || {}) ===
          JSON.stringify(feedback?.customizations || {}),
    )
    .reduce((total, item) => total + item.quantity, 0);

  function addProduct() {
    if (editMode) removeItem(product.id, initialSize, initialCustomizations);
    addWithFeedback(product, size, quantity, {
      notes: notes.trim() || undefined,
    });
  }

  return (
    <main className="min-h-screen bg-white pb-24 text-[#111111] lg:pb-0">
      <header className="relative mx-auto flex max-w-[1440px] items-center justify-between border-b border-black px-5 py-4 lg:px-10">
        <Link href="/" className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] sm:text-xs">
          <ArrowLeft size={16} strokeWidth={1.5} /> <span className="hidden sm:inline">Back to collection</span>
        </Link>
        <Link href="/" className="absolute left-1/2 -translate-x-1/2 bg-white px-2" aria-label="Glad Style Fashion home">
          <BrandLogo className="h-auto w-32 sm:w-44" />
        </Link>
        <button onClick={() => setBagOpen(true)} className="relative grid size-10 place-items-center border border-black transition-colors hover:bg-black hover:text-white active:scale-[0.98]" aria-label="Open shopping bag">
          <ShoppingBag size={19} strokeWidth={1.5} />
          {cartCount > 0 && <span className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-[#d3146d] text-[10px] font-bold text-white">{cartCount}</span>}
        </button>
      </header>

      <section className="mx-auto grid max-w-[1440px] border-x border-black lg:grid-cols-[minmax(0,1.2fr)_minmax(400px,0.8fr)]">
        <div className="bg-white">
          <div className="grid gap-1 sm:grid-cols-2 sm:gap-2">
            {gallery.map((image, index) => (
              <figure key={image.id} className="relative bg-white">
                <img src={image.imageUrl} alt={image.altText || product.productName} className="aspect-[3/4] w-full object-cover" />
                <figcaption className="sr-only">{index === 0 ? "Front view" : index === 1 ? "Back view" : "Fabric and construction detail"}</figcaption>
              </figure>
            ))}
          </div>
        </div>

        <div className="px-5 py-9 sm:px-10 sm:py-12 lg:sticky lg:top-0 lg:h-fit lg:border-l lg:border-black">
          <div className="flex items-start justify-between gap-5 border-b border-black pb-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d3146d]">{product.category?.name || "Glad Style Fashion"}</p>
              <h1 className="mt-3 max-w-md text-4xl font-medium leading-[0.96] tracking-[-0.055em] sm:text-5xl">{product.productName}</h1>
            </div>
            {isCustomWear ? <span className="shrink-0 pt-7 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#d3146d]">Made for you</span> : <span className="shrink-0 pt-7 text-lg font-medium">{formatStorePrice(product.price)}</span>}
          </div>

          <p className="mt-6 max-w-xl text-sm leading-7 text-black/70">{product.description || "A ready-to-wear statement piece designed for plans that deserve a little more presence."}</p>
          {isCustomWear ? <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#d3146d]">In-person fitting required</p> : <p className={`mt-4 text-[11px] font-semibold uppercase tracking-[0.14em] ${isAvailable ? "text-[#d3146d]" : "text-black/50"}`}>{availability}</p>}

          {isCustomWear ? <div className="mt-8 border-y border-black py-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em]">How custom orders work</p>
            <p className="mt-3 max-w-xl text-sm leading-7 text-black/70">This piece is made after an in-person consultation and fitting. Message us on WhatsApp to discuss your occasion, preferred date, measurements, fabric, and finishing details.</p>
            {whatsappHref ? <a href={whatsappHref} target="_blank" rel="noreferrer" className="mt-6 flex w-full items-center justify-center gap-3 bg-[#d3146d] py-4 text-xs font-semibold uppercase tracking-[0.17em] text-white transition-colors hover:bg-black"><MessageCircle size={17} strokeWidth={1.5} /> Enquire on WhatsApp</a> : <button disabled className="mt-6 flex w-full items-center justify-center gap-3 bg-black/20 py-4 text-xs font-semibold uppercase tracking-[0.17em] text-white">WhatsApp enquiries coming soon</button>}
          </div> : <div className="mt-8 border-y border-black py-6">
            {product.sizes && product.sizes.length > 0 && (
              <div>
                <div className="mb-4 flex items-center justify-between gap-4 text-[11px] font-semibold uppercase tracking-[0.14em]">
                  <span>Choose a size</span>
                  <span className="text-[#d3146d]">{size || "Select"}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((item) => (
                    <button key={item} onClick={() => setSize(item)} className={`min-w-12 border px-4 py-3 text-xs font-semibold transition-colors active:scale-[0.98] ${size === item ? "border-[#d3146d] bg-[#d3146d] text-white" : "border-black bg-white hover:border-[#d3146d] hover:text-[#d3146d]"}`}>{item}</button>
                  ))}
                </div>
                <details className="mt-5 text-sm">
                  <summary className="cursor-pointer font-medium underline underline-offset-4">Size guide</summary>
                  <div className="mt-4 overflow-x-auto border border-black">
                    <table className="min-w-full text-left text-xs">
                      <thead className="border-b border-black bg-[#f8dbe9] text-[10px] font-semibold uppercase tracking-[0.1em]">
                        <tr><th className="px-3 py-3">Size</th><th className="px-3 py-3">Bust</th><th className="px-3 py-3">Waist</th><th className="px-3 py-3">Hips</th></tr>
                      </thead>
                      <tbody className="divide-y divide-black/15">
                        {[["S", "34–36 in", "27–29 in", "37–39 in"], ["M", "37–39 in", "30–32 in", "40–42 in"], ["L", "40–42 in", "33–35 in", "43–45 in"], ["XL", "43–45 in", "36–38 in", "46–48 in"]].map(([label, bust, waist, hips]) => <tr key={label}><td className="px-3 py-3 font-semibold">{label}</td><td className="px-3 py-3">{bust}</td><td className="px-3 py-3">{waist}</td><td className="px-3 py-3">{hips}</td></tr>)}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-3 leading-6 text-black/65">Use your body measurements and choose the larger size if you are between sizes. This is a general guide; garment-specific measurements will be added as each style is measured.</p>
                </details>
              </div>
            )}

            <div className="mt-7 border-t border-black/15 pt-6">
              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em]">Additional information</span>
                <span className="mt-2 block text-xs leading-5 text-black/55">Add any request or detail you want our team to know before we confirm your order.</span>
                <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} maxLength={500} placeholder="Any details you want our team to know" className="mt-4 w-full resize-none border border-black bg-white px-3 py-3 text-sm outline-none placeholder:text-black/30 focus:border-[#d3146d] focus:ring-1 focus:ring-[#d3146d]" />
              </label>
            </div>

            <div className="mt-7 flex items-center justify-between border-t border-black/15 pt-6 text-[11px] font-semibold uppercase tracking-[0.14em]">
              <span>Quantity</span>
              <div className="flex items-center border border-black bg-white">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="grid size-10 place-items-center transition-colors hover:bg-black hover:text-white" aria-label="Decrease quantity"><Minus size={15} strokeWidth={1.5} /></button>
                <span className="grid size-10 place-items-center border-x border-black text-sm">{quantity}</span>
                <button onClick={() => setQuantity(Math.min(stock || 1, quantity + 1))} className="grid size-10 place-items-center transition-colors hover:bg-black hover:text-white" aria-label="Increase quantity"><Plus size={15} strokeWidth={1.5} /></button>
              </div>
            </div>
          </div>}

          {!isCustomWear && <button disabled={!isAvailable} onClick={addProduct} className="mt-6 hidden w-full items-center justify-center gap-3 bg-[#d3146d] py-4 text-xs font-semibold uppercase tracking-[0.17em] text-white transition-colors hover:bg-black active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-black/20 lg:flex">
            {feedback?.success ? (editMode ? "Bag updated" : "Added to bag") : isAvailable ? (editMode ? "Update selections" : "Add to bag") : "Sold out"} <ArrowRight size={16} strokeWidth={1.5} />
          </button>}
          {!isCustomWear && <p role="status" aria-live="polite" className="hidden min-h-5 pt-3 text-sm text-[#d3146d] lg:block">{feedback?.success ? feedback.message : ""}</p>}

          <div className="mt-7 divide-y divide-black/15 border-y border-black">
            {[
              ["Fabric and feel", product.materials || "Designed for movement and made for repeat wear."],
              ["Care instructions", product.careInstructions || "Follow the care label to preserve the fabric and finish."],
              ["Delivery and returns", "Delivery takes approximately 5–7 working days after order confirmation. Delivery is paid by the customer. Read our shipping and returns policies before ordering."],
            ].map(([title, copy]) => (
              <details key={title} className="py-4">
                <summary className="cursor-pointer list-none text-[11px] font-semibold uppercase tracking-[0.15em]">{title}</summary>
                <p className="mt-3 max-w-md text-sm leading-6 text-black/65">{copy}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {!isCustomWear && <div className="fixed inset-x-0 bottom-0 z-30 border-t border-black bg-white p-3 lg:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{formatStorePrice(product.price)}</p>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-black/55">{size ? `Size ${size}` : "Choose a size"}</p>
          </div>
          <button disabled={!isAvailable} onClick={addProduct} className="bg-[#d3146d] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-black active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-black/20">{editMode ? "Update bag" : "Add to bag"}</button>
        </div>
      </div>
      }

      <CartDrawer open={bagOpen} onClose={() => setBagOpen(false)} width="sm" fallbackImage={primaryProductImage} emptyContent={<Link href="/" onClick={() => setBagOpen(false)} className="mt-6 border-b border-[#d3146d] pb-2 text-xs font-semibold uppercase tracking-[0.15em] text-[#d3146d]">Continue shopping</Link>} />
      <CartAddToast feedback={feedback} bagQuantity={bagQuantity} onDismiss={dismissFeedback} onViewBag={() => { dismissFeedback(); setBagOpen(true); }} />
    </main>
  );
}
