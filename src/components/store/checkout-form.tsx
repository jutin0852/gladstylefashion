"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Minus, Plus, ShoppingBag } from "lucide-react";
import { createOrder } from "../../app/actions/createOrder";
import BrandLogo from "./brand-logo";
import { primaryProductAlt, primaryProductImage } from "./brand-assets";
import { useCart } from "./cart-context";
import { formatStorePrice } from "./currency";

const fields = [
  ["customerName", "Full name", "text"],
  ["customerEmail", "Email address", "email"],
  ["customerPhone", "Phone (optional)", "tel"],
  ["street", "Street address", "text"],
  ["city", "City", "text"],
  ["state", "State / region", "text"],
  ["postalCode", "Postal code", "text"],
  ["country", "Country", "select"],
] as const;

export default function CheckoutForm({ initialCustomer }: { initialCustomer?: { name?: string | null; email?: string | null; phone?: string | null; street?: string | null; city?: string | null; state?: string | null; postalCode?: string | null } }) {
  const { cart, cartTotal, updateQuantity, clearCart } = useCart();
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);
  const [completedEmail, setCompletedEmail] = useState("");

  async function submit(formData: FormData) {
    setPending(true);
    setMessage("");
    formData.set("items", JSON.stringify(cart.map((item) => ({
      productId: item.id,
      quantity: item.quantity,
      size: item.size,
      customizations: item.customizations,
    }))));
    setCompletedEmail(String(formData.get("customerEmail") || ""));
    const result = await createOrder(formData);
    setPending(false);
    if (result.success) {
      clearCart();
      setSuccess(true);
      setMessage(`Order ${result.orderNumber} has been received. We will confirm the next steps using the contact details you provided.`);
    } else {
      setMessage(result.message);
    }
  }

  if (success) {
    return (
      <main className="min-h-screen bg-white px-5 py-5 text-[#111111] sm:px-10">
        <div className="mx-auto flex min-h-[calc(100dvh-40px)] max-w-[960px] flex-col border border-black">
          <header className="flex items-center justify-between border-b border-black px-5 py-4 sm:px-8">
            <Link href="/" aria-label="Glad Style Fashion home"><BrandLogo className="h-auto w-36 sm:w-44" /></Link>
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#d3146d]">Order received</span>
          </header>
          <div className="flex flex-1 flex-col items-center justify-center px-5 py-16 text-center">
            <div className="grid size-14 place-items-center rounded-full bg-[#d3146d] text-white"><Check size={26} strokeWidth={1.75} /></div>
            <p className="mt-7 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d3146d]">Thank you</p>
            <h1 className="mt-4 max-w-xl text-5xl font-medium leading-[0.95] tracking-[-0.06em] sm:text-7xl">Your order is in.</h1>
            <p className="mt-6 max-w-md text-sm leading-7 text-black/65">{message}</p>
            <Link href={`/account/register${completedEmail ? `?email=${encodeURIComponent(completedEmail)}` : ""}`} className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-[#d3146d] underline">Create an account to keep your delivery details</Link>
            <Link href="/" className="mt-10 inline-flex items-center gap-3 bg-black px-6 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#d3146d]">
              <ArrowLeft size={16} strokeWidth={1.5} /> Continue shopping
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (cart.length === 0) {
    return (
      <main className="min-h-screen bg-white px-5 py-5 text-[#111111] sm:px-10">
        <div className="mx-auto flex min-h-[calc(100dvh-40px)] max-w-[960px] flex-col border border-black">
          <header className="border-b border-black px-5 py-4 sm:px-8"><Link href="/" aria-label="Glad Style Fashion home"><BrandLogo className="h-auto w-36 sm:w-44" /></Link></header>
          <div className="flex flex-1 flex-col items-center justify-center px-5 text-center">
            <ShoppingBag size={30} strokeWidth={1.5} />
            <p className="mt-7 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d3146d]">Your checkout</p>
            <h1 className="mt-4 text-4xl font-medium tracking-[-0.05em] sm:text-6xl">Your bag is empty.</h1>
            <Link href="/" className="mt-9 bg-[#d3146d] px-6 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-black">Browse the collection</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-[#111111]">
      <header className="relative mx-auto flex max-w-[1440px] items-center justify-between border-b border-black px-5 py-4 lg:px-10">
        <Link href="/" className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] sm:text-xs"><ArrowLeft size={16} strokeWidth={1.5} /> <span className="hidden sm:inline">Back to collection</span></Link>
        <Link href="/" className="absolute left-1/2 -translate-x-1/2 bg-white px-2" aria-label="Glad Style Fashion home"><BrandLogo className="h-auto w-32 sm:w-44" /></Link>
        <span className="hidden text-[10px] font-semibold uppercase tracking-[0.14em] text-[#d3146d] sm:inline">Secure checkout</span>
      </header>

      <div className="mx-auto grid max-w-[1440px] lg:grid-cols-[1fr_0.82fr]">
        <section className="border-b border-black px-5 py-10 sm:px-10 lg:border-b-0 lg:border-r lg:py-16">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d3146d]">Checkout</p>
          <h1 className="mt-4 text-4xl font-medium leading-[0.96] tracking-[-0.055em] sm:text-6xl">Where should we send your order?</h1>
          <form action={submit} className="mt-10 max-w-2xl">
            <h2 className="border-b border-black pb-4 text-[11px] font-semibold uppercase tracking-[0.16em]">Contact and delivery</h2>
            <div className="mt-6 grid gap-x-5 gap-y-6 sm:grid-cols-2">
              {fields.map(([name, label, type]) => (
                <label key={name} className={name === "street" ? "sm:col-span-2" : ""}>
                  <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-black/65">{label}</span>
                  {name === "country" ? (
                    <select name="country" defaultValue="Nigeria" required className="w-full border border-black bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-[#d3146d] focus:ring-1 focus:ring-[#d3146d]">
                      <option value="Nigeria">Nigeria</option>
                    </select>
                  ) : (
                    <input
                      name={name}
                      type={type}
                      required={!name.includes("Phone")}
                      defaultValue={name === "customerName" ? initialCustomer?.name || "" : name === "customerEmail" ? initialCustomer?.email || "" : name === "customerPhone" ? initialCustomer?.phone || "" : initialCustomer?.[name as keyof typeof initialCustomer] || ""}
                      className="w-full border border-black bg-white px-4 py-3 text-sm outline-none transition-colors placeholder:text-black/35 focus:border-[#d3146d] focus:ring-1 focus:ring-[#d3146d]"
                    />
                  )}
                </label>
              ))}
            </div>
            {message && <p className="mt-6 border-l-4 border-[#d3146d] bg-[#f8dbe9] px-4 py-3 text-sm text-black/75">{message}</p>}
            <button type="submit" disabled={pending} className="mt-10 w-full bg-[#d3146d] py-4 text-xs font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-50">
              {pending ? "Placing order..." : "Place order"}
            </button>
          </form>
        </section>

        <aside className="bg-[#f8dbe9] px-5 py-10 sm:px-10 lg:py-16">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d3146d]">Order summary</p>
          <h2 className="mt-3 text-3xl font-medium tracking-[-0.04em]">Your selected pieces</h2>
          <div className="mt-7 divide-y divide-black/15 border-y border-black">
            {cart.map((item) => (
              <div key={JSON.stringify([item.id, item.size || "", item.customizations || {}])} className="flex gap-4 py-5">
                <img src={item.images?.[0]?.imageUrl || primaryProductImage} alt={item.images?.[0]?.altText || item.productName || primaryProductAlt} className="h-28 w-24 bg-white object-cover" />
                <div className="flex flex-1 flex-col justify-between">
                  <div className="flex justify-between gap-2">
                    <div>
                      <p className="text-lg font-medium leading-tight">{item.productName}</p>
                      {item.size && <p className="mt-1 text-xs text-black/60">Size {item.size}</p>}
                      {item.customizations?.notes && <p className="mt-1 text-xs text-black/50">Note: {item.customizations.notes}</p>}
                    </div>
                    <span className="text-sm font-medium">{formatStorePrice(Number(item.price) * item.quantity)}</span>
                  </div>
                  <div className="mt-3 flex items-center border border-black bg-white w-fit">
                    <button type="button" onClick={() => updateQuantity(item.id, -1, item.size, item.customizations)} className="grid size-8 place-items-center transition-colors hover:bg-black hover:text-white" aria-label={`Remove one ${item.productName}`}><Minus size={14} strokeWidth={1.5} /></button>
                    <span className="grid size-8 place-items-center border-x border-black text-xs">{item.quantity}</span>
                    <button type="button" onClick={() => updateQuantity(item.id, 1, item.size, item.customizations)} className="grid size-8 place-items-center transition-colors hover:bg-black hover:text-white" aria-label={`Add one ${item.productName}`}><Plus size={14} strokeWidth={1.5} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-between border-b border-black pb-5 text-2xl font-medium tracking-[-0.04em]"><span>Total</span><span>{formatStorePrice(cartTotal)}</span></div>
          <p className="mt-5 max-w-sm text-xs leading-5 text-black/60">Nigeria delivery is available now. Delivery is paid by the customer and takes approximately 5–7 working days after your order is confirmed.</p>
        </aside>
      </div>
    </main>
  );
}


