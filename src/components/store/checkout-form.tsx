"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Minus, Plus, ShoppingBag } from "lucide-react";
import { createOrder } from "../../app/actions/createOrder";
import { useCart } from "./cart-context";

const fields = [
  ["customerName", "Full name", "text"],
  ["customerEmail", "Email address", "email"],
  ["customerPhone", "Phone (optional)", "tel"],
  ["street", "Street address", "text"],
  ["city", "City", "text"],
  ["state", "State / region", "text"],
  ["postalCode", "Postal code", "text"],
  ["country", "Country", "text"],
] as const;

export default function CheckoutForm() {
  const { cart, cartTotal, updateQuantity, clearCart } = useCart();
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);

  async function submit(formData: FormData) {
    setPending(true);
    setMessage("");
    formData.set(
      "items",
      JSON.stringify(
        cart.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
          size: item.size,
        })),
      ),
    );

    
    const result = await createOrder(formData);
    setPending(false);
    if (result.success) {
      clearCart();
      setSuccess(true);
      setMessage(
        `Order ${result.orderNumber} is confirmed. We will email you the details.`,
      );
    } else {
      setMessage(result.message);
    }
  }

  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f3ef] px-5 text-center text-[#252525]">
        <div className="max-w-lg">
          <p className="text-xs uppercase tracking-[0.2em] text-black/50">
            Thank you
          </p>
          <h1 className="mt-5 font-serif text-6xl tracking-[-0.05em]">
            Order received.
          </h1>
          <p className="mt-6 text-sm leading-7 text-black/60">{message}</p>
          <Link
            href="/"
            className="mt-9 inline-flex items-center gap-3 border-b border-black pb-2 text-xs uppercase tracking-[0.15em]"
          >
            <ArrowLeft size={16} strokeWidth={1.5} /> Continue shopping
          </Link>
        </div>
      </main>
    );
  }

  if (cart.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f3ef] px-5 text-center">
        <div>
          <ShoppingBag size={28} className="mx-auto" strokeWidth={1} />
          <h1 className="mt-5 font-serif text-4xl">Your bag is empty.</h1>
          <Link
            href="/"
            className="mt-8 inline-flex border-b border-black pb-2 text-xs uppercase tracking-[0.15em]"
          >
            Browse the collection
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f3ef] text-[#252525]">
      <header className="mx-auto flex max-w-300 items-center justify-between px-5 py-6 lg:px-10">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs uppercase tracking-[0.16em]"
        >
          <ArrowLeft size={16} strokeWidth={1.5} /> Back to collection
        </Link>
        <Link href="/" className="font-serif text-3xl tracking-[-0.06em]">
          gladstyle
        </Link>
      
      </header>
      <div className="mx-auto grid max-w-300 gap-12 px-5 pb-20 pt-8 lg:grid-cols-[1fr_380px] lg:px-10 lg:pt-16">
        <section>
          <p className="text-xs uppercase tracking-[0.2em] text-black/50">
            Checkout
          </p>
          <h1 className="mt-4 font-serif text-6xl tracking-[-0.06em]">
            Let&apos;s get this to you.
          </h1>
          <form action={submit} className="mt-12">
            <h2 className="border-b border-black/10 pb-4 text-xs uppercase tracking-[0.18em]">
              Contact and delivery
            </h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {fields.map(([name, label, type]) => (
                <label
                  key={name}
                  className={name === "street" ? "sm:col-span-2" : ""}
                >
                  <span className="mb-2 block text-xs text-black/55">
                    {label}
                  </span>
                  <input
                    name={name}
                    type={type}
                    required={!name.includes("Phone")}
                    className="w-full border-b border-black/25 bg-transparent px-0 py-3 text-sm outline-none focus:border-black"
                  />
                </label>
              ))}
            </div>
            {message && (
              <p className="mt-6 text-sm text-[#9b3b29]">{message}</p>
            )}
            <button
              type="submit"
              disabled={pending}
              className="mt-10 w-full bg-[#252525] py-4 text-xs uppercase tracking-[0.18em] text-white disabled:opacity-50"
            >
              {pending ? "Placing order..." : "Place order"}
            </button>
          </form>
        </section>
        <aside className="h-fit border-t border-black/10 pt-5 lg:border-l lg:border-t-0 lg:pl-8">
          <h2 className="font-serif text-3xl">Your order</h2>
          <div className="mt-6 divide-y divide-black/10">
            {cart.map((item) => (
              <div key={item.id} className="flex gap-4 py-4">
                <img
                  src={
                    item.images[0]?.imageUrl ||
                    "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=300&q=80"
                  }
                  alt={item.productName}
                  className="h-24 w-20 object-cover"
                />
                <div className="flex-1">
                  <div className="flex justify-between gap-2">
                    <div>
                      <p className="font-serif text-lg">{item.productName}</p>
                      {item.size && (
                        <p className="mt-1 text-xs text-black/50">
                          Size {item.size}
                        </p>
                      )}
                    </div>
                    <span className="text-sm">
                      ${(Number(item.price) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-3 text-xs">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, -1, item.size)}
                      aria-label={`Remove one ${item.productName}`}
                    >
                      <Minus size={14} />
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, 1, item.size)}
                      aria-label={`Add one ${item.productName}`}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-between border-t border-black/10 pt-5 font-serif text-2xl">
            <span>Total</span>
            <span>${cartTotal.toFixed(2)}</span>
          </div>
        </aside>
      </div>
    </main>
  );
}
