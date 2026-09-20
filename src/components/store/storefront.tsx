"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";
import BrandLogo from "./brand-logo";
import { primaryProductAlt, primaryProductImage } from "./brand-assets";
import { formatStorePrice } from "./currency";
import CartDrawer from "./cart-drawer";
import { useCart, type StoreProduct } from "./cart-context";

export default function Storefront({ products }: { products: StoreProduct[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All pieces");
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { cartCount } = useCart();

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
    <main className="min-h-screen bg-white text-[#111111]">
      <div className="bg-[#d3146d] px-5 py-2.5 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-white sm:text-[11px]">
        Glad Style Fashion | Ready-to-wear from Lagos
      </div>

      <header className="relative mx-auto flex max-w-[1440px] items-center justify-between border-b border-black px-5 py-4 lg:px-10">
        <button
          className="grid size-10 place-items-center border border-black lg:hidden"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          {menuOpen ? <X size={20} strokeWidth={1.5} /> : <Menu size={20} strokeWidth={1.5} />}
        </button>
        <nav
          className={`${menuOpen ? "flex" : "hidden"} absolute left-0 right-0 top-full z-20 flex-col border-b border-black bg-white px-5 py-6 text-xs font-medium uppercase tracking-[0.14em] lg:static lg:flex lg:flex-row lg:items-center lg:gap-8 lg:border-0 lg:p-0`}
        >
          <a href="#shop" onClick={() => setMenuOpen(false)} className="py-3 lg:py-0">Shop</a>
          <a href="#story" onClick={() => setMenuOpen(false)} className="py-3 lg:py-0">Our story</a>
        </nav>
        <a href="#top" className="absolute left-1/2 -translate-x-1/2 bg-white px-2" aria-label="Glad Style Fashion home">
          <BrandLogo className="h-auto w-24 sm:w-44" />
        </a>
        <div className="flex items-center gap-3">
          <label className="hidden items-center gap-2 border-b border-black pb-1 lg:flex">
            <Search size={15} strokeWidth={1.5} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-28 bg-transparent text-xs outline-none placeholder:text-black/45"
              placeholder="Search"
              aria-label="Search products"
            />
          </label>
          <a href="/account" className="grid size-10 place-items-center border border-black transition-colors hover:bg-black hover:text-white" aria-label="Your account">
            <UserRound size={18} strokeWidth={1.5} />
          </a>
          <button
            className="relative grid size-10 place-items-center border border-black transition-colors hover:bg-black hover:text-white active:scale-[0.98]"
            onClick={() => setCartOpen(true)}
            aria-label="Open shopping bag"
          >
            <ShoppingBag size={19} strokeWidth={1.5} />
            {cartCount > 0 && <span className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-[#d3146d] text-[10px] font-bold text-white">{cartCount}</span>}
          </button>
        </div>
      </header>

      <section id="top" className="mx-auto grid max-w-[1440px] border-x border-black lg:grid-cols-[0.94fr_1.06fr]">
        <div className="flex min-h-[410px] flex-col justify-between border-b border-black px-5 py-8 sm:min-h-[480px] sm:px-10 sm:py-12 lg:min-h-[650px] lg:border-b-0 lg:border-r">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d3146d]">Ready-to-wear for your next plan</p>
          <div className="max-w-xl py-10">
            <h1 className="text-5xl font-medium leading-[0.92] tracking-[-0.065em] sm:text-7xl lg:text-[84px]">Dress like the moment is yours.</h1>
            <p className="mt-7 max-w-md text-base leading-7 text-black/65">New dresses with colour, ease, and the confidence to make an entrance.</p>
            <a href="#shop" className="mt-9 inline-flex items-center gap-3 bg-black px-6 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#d3146d] active:scale-[0.98]">
              Shop the collection <ArrowRight size={16} strokeWidth={1.5} />
            </a>
          </div>
          <p className="max-w-xs border-t border-black pt-4 text-xs leading-5 text-black/60">A Lagos fashion house for women who want getting dressed to feel simple and special.</p>
        </div>
        <div className="relative min-h-[420px] bg-[#f8dbe9] p-4 sm:min-h-[540px] sm:p-7 lg:min-h-[650px]">
          <img src={primaryProductImage} alt={primaryProductAlt} className="h-full w-full object-cover object-center" />
          <div className="absolute bottom-7 left-7 bg-white px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.15em] sm:bottom-10 sm:left-10">New collection</div>
        </div>
      </section>

      <section className="border-y border-black bg-[#d3146d] text-white">
        <p className="px-5 py-4 text-center text-[10px] font-medium uppercase tracking-[0.12em] sm:hidden">Ready-to-wear dresses · Lagos · Nigeria delivery: 5–7 working days</p>
        <div className="mx-auto hidden max-w-[1440px] sm:grid sm:grid-cols-3 sm:divide-x sm:divide-white/45">
          <p className="px-8 py-5 text-center text-xs font-medium uppercase tracking-[0.14em]">Ready-to-wear dresses</p>
          <p className="px-8 py-5 text-center text-xs font-medium uppercase tracking-[0.14em]">Based in Lagos</p>
          <p className="px-8 py-5 text-center text-xs font-medium uppercase tracking-[0.14em]">Nigeria delivery · 5–7 working days</p>
        </div>
      </section>

      <section id="shop" className="mx-auto max-w-[1440px] px-5 py-12 sm:px-10 sm:py-16 lg:py-24">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d3146d]">Shop ready to wear</p>
          <h2 className="mt-4 text-4xl font-medium leading-[0.98] tracking-[-0.055em] sm:text-6xl">Pieces made to be noticed.</h2>
        </div>
        <div className="mt-10 flex flex-col justify-between gap-5 border-y border-black py-4 lg:flex-row lg:items-center">
          <div className="flex flex-wrap gap-2">
            {categories.map((item) => (
              <button
                key={item}
                onClick={() => setCategory(item)}
                className={`border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors active:scale-[0.98] ${category === item ? "border-[#d3146d] bg-[#d3146d] text-white" : "border-black bg-white hover:border-[#d3146d] hover:text-[#d3146d]"}`}
              >
                {item}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 border-b border-black pb-2 lg:hidden">
            <Search size={15} strokeWidth={1.5} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-transparent text-sm outline-none placeholder:text-black/45" placeholder="Search the collection" aria-label="Search the collection" />
          </label>
        </div>
        {filteredProducts.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-2xl font-medium">No pieces match that search.</p>
            <button onClick={() => { setQuery(""); setCategory("All pieces"); }} className="mt-5 border-b border-[#d3146d] pb-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#d3146d]">View all pieces</button>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
            {filteredProducts.map((product) => (
              <article key={product.id} className="group">
                <a href={`/product/${product.slug}`} className="block overflow-hidden bg-[#f8dbe9]">
                  <img src={product.images?.[0]?.imageUrl || primaryProductImage} alt={product.images?.[0]?.altText || primaryProductAlt} className="aspect-[3/4] w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
                </a>
                <div className="flex items-start justify-between gap-3 border-b border-black py-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#d3146d]">{product.category?.name || "Glad Style Fashion"}</p>
                    <h3 className="mt-1 text-lg font-medium leading-tight"><a href={`/product/${product.slug}`} className="hover:text-[#d3146d]">{product.productName}</a></h3>
                  </div>
                  <p className="pt-4 text-sm font-medium">{formatStorePrice(product.price)}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section id="story" className="border-y border-black bg-[#f8dbe9]">
        <div className="mx-auto grid max-w-[1440px] gap-10 px-5 py-16 sm:px-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20 lg:py-24">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d3146d]">Glad Style Fashion</p>
          <div className="max-w-3xl">
            <h2 className="text-4xl font-medium leading-[0.98] tracking-[-0.055em] sm:text-6xl">Made to make getting dressed feel like the best part of the plan.</h2>
            <p className="mt-7 max-w-2xl text-base leading-7 text-black/70">We focus on ready-made pieces with a feminine point of view, so a beautiful outfit can be the easy decision.</p>
          </div>
        </div>
      </section>

      <footer className="border-t border-black bg-white">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-5 py-10 sm:px-10 md:flex-row md:items-end md:justify-between">
          <BrandLogo className="h-auto w-48" />
          <div className="flex flex-col gap-2 text-xs font-medium uppercase tracking-[0.13em] text-black/60 md:items-end">
            <span>Ready-to-wear from Lagos</span>
            <div className="flex flex-wrap gap-x-4 gap-y-2 md:justify-end">
              <a href="/shipping-delivery" className="hover:text-[#d3146d]">Shipping & delivery</a>
              <a href="/returns-exchanges" className="hover:text-[#d3146d]">Returns & exchanges</a>
              <a href="/privacy" className="hover:text-[#d3146d]">Privacy</a>
              <a href="/terms" className="hover:text-[#d3146d]">Terms</a>
            </div>
          </div>
        </div>
      </footer>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} fallbackImage={primaryProductImage} emptyContent={<p className="mt-2 text-sm text-black/55">Add a piece you will want to wear on repeat.</p>} />
    </main>
  );
}
