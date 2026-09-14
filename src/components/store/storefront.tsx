"use client";

import { useMemo, useState } from "react";
import { useCart, type StoreProduct } from "./cart-context";
import Link from "next/link";
import {
  ArrowRight,
  ChevronDown,
  Heart,
  Menu,
  Search,
  ShoppingBag,
  X,
} from "lucide-react";

const fallbackImages = [
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=85",
];

export default function Storefront({ products }: { products: StoreProduct[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All pieces");
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { cart, cartCount, cartTotal, addToCart, updateQuantity, removeItem } =
    useCart();

  const categories = useMemo(() => {
    const names = products
      .map((product) => product.category?.name)
      .filter((name): name is string => Boolean(name));
    return ["All pieces", ...Array.from(new Set(names))];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory =
        category === "All pieces" || product.category?.name === category;
      const matchesQuery =
        !normalizedQuery ||
        product.productName.toLowerCase().includes(normalizedQuery) ||
        product.description?.toLowerCase().includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [category, products, query]);

  return (
    <main className="min-h-screen bg-[#f5f3ef] text-[#252525]">
      <div className="border-b border-[#252525]/10 bg-[#d9e8df] px-5 py-2 text-center text-[11px] font-medium uppercase tracking-[0.2em]">
        Complimentary delivery on orders over $150
      </div>

      <header className="mx-auto flex max-w-350 items-center justify-between px-5 py-6 lg:px-10">
        <button
          className="flex items-center gap-2 lg:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Open menu"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <nav
          className={`${menuOpen ? "flex" : "hidden"} absolute left-0 top-[93px] z-20 w-full flex-col gap-5 border-b border-black/10 bg-[#f5f3ef] px-5 py-6 text-xs uppercase tracking-[0.18em] lg:static lg:flex lg:w-auto lg:flex-row lg:border-0 lg:bg-transparent lg:p-0`}
        >
          <a href="#shop">Shop</a>
          <a href="#story">Our story</a>
          <a href="#journal">Journal</a>
        </nav>
        <a
          href="#top"
          className="font-serif text-3xl tracking-[-0.06em] lg:absolute lg:left-1/2 lg:-translate-x-1/2"
        >
          gladstyle
        </a>
        <div className="flex items-center gap-4">
          <label className="hidden items-center gap-2 border-b border-black/30 pb-1 lg:flex">
            <Search size={16} strokeWidth={1.5} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-32 bg-transparent text-xs outline-none placeholder:text-black/50"
              placeholder="Search"
              aria-label="Search products"
            />
          </label>
          <button
            className="relative"
            onClick={() => setCartOpen(true)}
            aria-label="Open shopping bag"
          >
            <ShoppingBag size={20} strokeWidth={1.5} />
            {cartCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#252525] px-1 text-[9px] text-white">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <section
        id="top"
        className="mx-auto grid max-w-350 gap-8 px-5 pb-16 pt-8 lg:grid-cols-[1fr_1.15fr] lg:px-10 lg:pb-24 lg:pt-14"
      >
        <div className="flex flex-col justify-end pb-2 lg:pb-12">
          <p className="mb-6 text-xs uppercase tracking-[0.22em] text-black/55">
            Edition 01 / Spring 2026
          </p>
          <h1 className="max-w-xl font-serif text-6xl leading-[0.88] tracking-[-0.06em] sm:text-8xl">
            Clothes with room to become you.
          </h1>
          <p className="mt-8 max-w-sm text-sm leading-6 text-black/65">
            Considered silhouettes, honest materials, and everyday pieces made
            for a life in motion.
          </p>
          <a
            href="#shop"
            className="mt-10 flex w-fit items-center gap-3 border-b border-black pb-2 text-xs uppercase tracking-[0.18em]"
          >
            Explore the collection <ArrowRight size={16} strokeWidth={1.5} />
          </a>
        </div>
        <div className="relative min-h-[480px] overflow-hidden bg-[#d7c6bb] sm:min-h-[620px]">
          <img
            src={fallbackImages[0]}
            alt="Gladstyle spring collection"
            className="h-full w-full object-cover object-center mix-blend-multiply"
          />
          <div className="absolute bottom-5 left-5 bg-[#f5f3ef] px-4 py-3 text-xs uppercase tracking-[0.15em]">
            The soft structure edit
          </div>
        </div>
      </section>

      <section
        id="shop"
        className="border-t border-black/10 px-5 py-14 lg:px-10 lg:py-20"
      >
        <div className="mx-auto max-w-350">
          <div className="mb-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <p className="mb-3 text-xs uppercase tracking-[0.2em] text-black/50">
                The collection
              </p>
              <h2 className="font-serif text-5xl tracking-[-0.05em]">
                Good things, well made.
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {categories.map((item) => (
                <button
                  key={item}
                  onClick={() => setCategory(item)}
                  className={`border px-4 py-2 text-[11px] uppercase tracking-[0.12em] transition ${category === item ? "border-[#252525] bg-[#252525] text-white" : "border-black/15 hover:border-black/50"}`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          {filteredProducts.length === 0 ? (
            <div className="border-y border-black/10 py-20 text-center font-serif text-3xl">
              Nothing here yet.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-3 gap-y-12 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-5">
              {filteredProducts.map((product, index) => {
                const image =
                  product.images[0]?.imageUrl ||
                  fallbackImages[index % fallbackImages.length];
                return (
                  <article key={product.id} className="group">
                    <div className="relative aspect-[3/4] overflow-hidden bg-[#dedbd4]">
                      <a
                        href={`/product/${product.slug}`}
                        className="block h-full w-full"
                      >
                        <img
                          src={image}
                          alt={
                            product.images[0]?.altText || product.productName
                          }
                          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                        />
                      </a>
                      {product.featured && (
                        <span className="absolute left-3 top-3 bg-[#d9e8df] px-2 py-1 text-[10px] uppercase tracking-[0.13em]">
                          Featured
                        </span>
                      )}
                      <button
                        className="absolute right-3 top-3 opacity-0 transition group-hover:opacity-100"
                        aria-label={`Save ${product.productName}`}
                      >
                        <Heart size={18} strokeWidth={1.5} />
                      </button>
                      <button
                        onClick={() => {
                          addToCart(product);
                          setCartOpen(true);
                        }}
                        className="absolute bottom-3 left-3 right-3 translate-y-3 bg-[#252525] py-3 text-[10px] uppercase tracking-[0.16em] text-white opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100"
                      >
                        Add to bag
                      </button>
                    </div>
                    <div className="flex items-start justify-between gap-3 pt-4">
                      <div>
                        <h3 className="font-serif text-lg leading-tight">
                          {product.productName}
                        </h3>
                        <p className="mt-1 text-xs text-black/50">
                          {product.category?.name || "Gladstyle edition"}
                        </p>
                      </div>
                      <p className="text-sm">
                        ${Number(product.price).toFixed(2)}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section
        id="story"
        className="grid border-t border-black/10 bg-[#cbd8d0] px-5 py-20 lg:grid-cols-2 lg:px-10 lg:py-28"
      >
        <p className="text-xs uppercase tracking-[0.2em] text-black/55">
          A slower wardrobe
        </p>
        <div className="mt-8 max-w-xl lg:mt-0">
          <h2 className="font-serif text-5xl leading-[0.95] tracking-[-0.05em]">
            Less noise. More wearing.
          </h2>
          <p className="mt-7 text-sm leading-7 text-black/65">
            We design for repeat days and long relationships. Each Gladstyle
            piece begins with a useful shape, a beautiful fabric, and the
            question: will you still reach for this next year?
          </p>
          <a
            href="#top"
            className="mt-9 flex w-fit items-center gap-3 border-b border-black pb-2 text-xs uppercase tracking-[0.18em]"
          >
            Read our story <ArrowRight size={16} strokeWidth={1.5} />
          </a>
        </div>
      </section>

      <footer
        id="journal"
        className="mx-auto flex max-w-350 flex-col gap-6 px-5 py-10 text-xs uppercase tracking-[0.15em] text-black/55 sm:flex-row sm:items-center sm:justify-between lg:px-10"
      >
        <span>Gladstyle / 2026</span>
        <span>Made for the in-between</span>
        <span>Contact / Instagram</span>
      </footer>

      {cartOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30"
          onClick={() => setCartOpen(false)}
        />
      )}
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-[#f5f3ef] p-6 shadow-2xl transition-transform ${cartOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between border-b border-black/10 pb-5">
          <h2 className="font-serif text-3xl">Your bag</h2>
          <button
            onClick={() => setCartOpen(false)}
            aria-label="Close shopping bag"
          >
            <X size={22} strokeWidth={1.5} />
          </button>
        </div>
        {cart.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <ShoppingBag size={28} strokeWidth={1} />
            <p className="mt-5 font-serif text-2xl">Your bag is waiting.</p>
            <p className="mt-2 text-sm text-black/55">
              Add something considered to get started.
            </p>
          </div>
        ) : (
          <>
            <div className="flex-1 divide-y divide-black/10 overflow-y-auto">
              {cart.map((item) => (
                <div key={item.id} className="flex gap-4 py-5">
                  <img
                    src={item.images[0]?.imageUrl || fallbackImages[0]}
                    alt={item.productName}
                    className="h-28 w-24 object-cover"
                  />
                  <div className="flex flex-1 flex-col justify-between">
                    <div className="flex justify-between gap-2">
                      <div>
                        <h3 className="font-serif text-lg">
                          {item.productName}
                        </h3>
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
                    <div className="flex items-center gap-3 text-xs">
                      <button
                        onClick={() => updateQuantity(item.id, -1, item.size)}
                        className="border border-black/20 px-2 py-1"
                      >
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1, item.size)}
                        className="border border-black/20 px-2 py-1"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeItem(item.id, item.size)}
                        className="ml-2 text-[10px] uppercase tracking-[0.12em] text-black/50 underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-black/10 pt-5">
              <div className="flex justify-between font-serif text-2xl">
                <span>Total</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
              <Link
                href="/checkout"
                className="mt-5 block w-full bg-[#252525] py-4 text-center text-xs uppercase tracking-[0.18em] text-white"
              >
                Checkout{" "}
                <ChevronDown
                  className="ml-2 inline rotate-[-90deg]"
                  size={14}
                />
              </Link>
            </div>
          </>
        )}
      </aside>
    </main>
  );
}
