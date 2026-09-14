"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Minus, Plus, ShoppingBag, X } from "lucide-react";
import Link from "next/link";
import { useCart, type StoreProduct } from "./cart-context";

const fallbackImage =
  "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1200&q=85";

export default function ProductDetail({
  product,
}: {
  product: StoreProduct & {
    sizes?: string[] | null;
    materials?: string | null;
    careInstructions?: string | null;
  };
}) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [size, setSize] = useState(product.sizes?.[0] || "");
  const [quantity, setQuantity] = useState(1);
  const [bagOpen, setBagOpen] = useState(false);
  const { addToCart, cart, cartCount, cartTotal, updateQuantity, removeItem } = useCart();
  const images = product.images.length
    ? product.images
    : [{ imageUrl: fallbackImage, altText: product.productName }];
  const isAvailable = (product.inventoryCount ?? 0) > 0;

  function addProduct() {
    for (let count = 0; count < quantity; count += 1) addToCart(product, size);
    setBagOpen(true);
  }

  return (
    <main className="min-h-screen bg-[#f5f3ef] text-[#252525]">
      <header className="mx-auto flex max-w-350 items-center justify-between px-5 py-6 lg:px-10">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs uppercase tracking-[0.16em]"
        >
          <ArrowLeft size={16} strokeWidth={1.5} /> Back to collection
        </Link>
        <Link href="/" className="font-serif text-3xl tracking-[-0.06em]">
          gladstyle
        </Link>
        <button
          onClick={() => setBagOpen(true)}
          className="relative"
          aria-label="Open shopping bag"
        >
          <ShoppingBag size={20} strokeWidth={1.5} />
          {cartCount > 0 && (
            <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#252525] px-1 text-[9px] text-white">
              {cartCount}
            </span>
          )}
        </button>
      </header>

      <section className="mx-auto grid max-w-350 gap-10 px-5 pb-20 pt-6 lg:grid-cols-[1.25fr_0.75fr] lg:px-10 lg:pt-12">
        <div className="grid grid-cols-2 gap-3">
          {images.map((image, index) => (
            <button
              key={image.imageUrl}
              onClick={() => setSelectedImage(index)}
              className={`relative aspect-[3/4] overflow-hidden bg-[#dedbd4] ${index === selectedImage ? "ring-1 ring-[#252525]" : ""}`}
            >
              <img
                src={image.imageUrl}
                alt={image.altText || product.productName}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
        <div className="flex flex-col lg:sticky lg:top-8 lg:h-fit">
          <p className="text-xs uppercase tracking-[0.18em] text-black/50">
            {product.category?.name || "Gladstyle edition"}
          </p>
          <div className="mt-4 flex items-start justify-between gap-4">
            <h1 className="font-serif text-5xl leading-[0.92] tracking-[-0.05em]">
              {product.productName}
            </h1>
            <span className="text-lg">${Number(product.price).toFixed(2)}</span>
          </div>
          <p className="mt-7 max-w-md text-sm leading-7 text-black/65">
            {product.description ||
              "A considered piece for everyday wearing, designed with ease and made to stay in rotation."}
          </p>
          <div className="mt-10 border-y border-black/10 py-6">
            {product.sizes && product.sizes.length > 0 && (
              <div>
                <div className="mb-3 flex justify-between text-xs uppercase tracking-[0.15em]">
                  <span>Size</span>
                  <span className="text-black/50">Select one</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((item) => (
                    <button
                      key={item}
                      onClick={() => setSize(item)}
                      className={`min-w-12 border px-3 py-2 text-xs ${size === item ? "border-[#252525] bg-[#252525] text-white" : "border-black/20"}`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-6 flex items-center justify-between text-xs uppercase tracking-[0.15em]">
              <span>Quantity</span>
              <div className="flex items-center gap-4 border border-black/20 px-3 py-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <span>{quantity}</span>
                <button
                  onClick={() =>
                    setQuantity(
                      Math.min(product.inventoryCount || 1, quantity + 1),
                    )
                  }
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </div>
          </div>
          <button
            disabled={!isAvailable}
            onClick={addProduct}
            className="mt-6 flex items-center justify-center gap-3 bg-[#252525] py-4 text-xs uppercase tracking-[0.18em] text-white disabled:cursor-not-allowed disabled:bg-black/25"
          >
            {isAvailable ? "Add to bag" : "Sold out"}
            <ArrowRight size={16} strokeWidth={1.5} />
          </button>
          <div className="mt-8 divide-y divide-black/10 border-y border-black/10 text-sm">
            {[
              [
                "Details",
                product.materials ||
                  "Designed for movement and made for repeat wear.",
              ],
              [
                "Care",
                product.careInstructions ||
                  "Follow the care label. Treat it well and it will return the favor.",
              ],
              ["Delivery", "Complimentary delivery on orders over $150."],
            ].map(([title, copy]) => (
              <details key={title} className="py-4">
                <summary className="cursor-pointer list-none text-xs uppercase tracking-[0.15em]">
                  {title}
                </summary>
                <p className="mt-3 max-w-md leading-6 text-black/60">{copy}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {bagOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30"
          onClick={() => setBagOpen(false)}
        />
      )}
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-[#f5f3ef] p-6 shadow-2xl transition-transform ${bagOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between border-b border-black/10 pb-5">
          <h2 className="font-serif text-3xl">Your bag</h2>
          <button
            onClick={() => setBagOpen(false)}
            aria-label="Close shopping bag"
          >
            <X size={22} strokeWidth={1.5} />
          </button>
        </div>
        {cart.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <ShoppingBag size={28} strokeWidth={1} />
            <p className="mt-5 font-serif text-2xl">Your bag is waiting.</p>
            <Link href="/" onClick={() => setBagOpen(false)} className="mt-6 border-b border-black pb-2 text-xs uppercase tracking-[0.15em]">Continue shopping</Link>
          </div>
        ) : <>
          <div className="flex-1 divide-y divide-black/10 overflow-y-auto">
            {cart.map((item) => <div key={`${item.id}-${item.size || "default"}`} className="flex gap-4 py-5">
              <img src={item.images[0]?.imageUrl || fallbackImage} alt={item.productName} className="h-28 w-24 object-cover" />
              <div className="flex flex-1 flex-col justify-between">
                <div className="flex justify-between gap-2"><div><h3 className="font-serif text-lg">{item.productName}</h3>{item.size && <p className="mt-1 text-xs text-black/50">Size {item.size}</p>}</div><span className="text-sm">${(Number(item.price) * item.quantity).toFixed(2)}</span></div>
                <div className="flex items-center gap-3 text-xs"><button onClick={() => updateQuantity(item.id, -1, item.size)} className="border border-black/20 p-1" aria-label={`Remove one ${item.productName}`}><Minus size={13} /></button><span>{item.quantity}</span><button onClick={() => updateQuantity(item.id, 1, item.size)} className="border border-black/20 p-1" aria-label={`Add one ${item.productName}`}><Plus size={13} /></button><button onClick={() => removeItem(item.id, item.size)} className="ml-2 text-[10px] uppercase tracking-[0.12em] text-black/50 underline">Remove</button></div>
              </div>
            </div>)}
          </div>
          <div className="border-t border-black/10 pt-5"><div className="flex justify-between font-serif text-2xl"><span>Total</span><span>${cartTotal.toFixed(2)}</span></div><Link href="/checkout" onClick={() => setBagOpen(false)} className="mt-5 block w-full bg-[#252525] py-4 text-center text-xs uppercase tracking-[0.18em] text-white">Checkout</Link></div>
        </>}
      </aside>
    </main>
  );
}
