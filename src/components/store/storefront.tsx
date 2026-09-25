"use client";

import { useMemo, useState } from "react";
import { Menu, Search, ShoppingBag, SlidersHorizontal, UserRound, X } from "lucide-react";
import BrandLogo from "./brand-logo";
import { primaryProductAlt, primaryProductImage } from "./brand-assets";
import { formatStorePrice } from "./currency";
import CartDrawer from "./cart-drawer";
import { useCart, type StoreProduct } from "./cart-context";

const allPieces = "All pieces";
const allSizes = "All sizes";

type PriceRange = "all" | "under-50000" | "50000-100000" | "over-100000";
type SortOrder = "newest" | "price-low" | "price-high";

export default function Storefront({ products }: { products: StoreProduct[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(allPieces);
  const [size, setSize] = useState(allSizes);
  const [priceRange, setPriceRange] = useState<PriceRange>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { cartCount } = useCart();

  const categories = useMemo(() => {
    const names = products
      .map((product) => product.category?.name)
      .filter((name): name is string => Boolean(name));
    return [allPieces, ...Array.from(new Set(names))];
  }, [products]);

  const sizes = useMemo(() => {
    const availableSizes = products.flatMap((product) => product.sizes || []);
    return [allSizes, ...Array.from(new Set(availableSizes))];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const matchingProducts = products.filter((product) => {
      const matchesCategory = category === allPieces || product.category?.name === category;
      const matchesQuery =
        !normalizedQuery ||
        product.productName.toLowerCase().includes(normalizedQuery) ||
        product.description?.toLowerCase().includes(normalizedQuery) ||
        product.category?.name.toLowerCase().includes(normalizedQuery);
      const matchesSize = size === allSizes || product.sizes?.includes(size);
      const price = Number(product.price);
      const matchesPrice =
        priceRange === "all" ||
        (priceRange === "under-50000" && price < 50000) ||
        (priceRange === "50000-100000" && price >= 50000 && price <= 100000) ||
        (priceRange === "over-100000" && price > 100000);
      return matchesCategory && matchesQuery && matchesSize && matchesPrice;
    });

    return [...matchingProducts].sort((first, second) => {
      if (sortOrder === "price-low") return Number(first.price) - Number(second.price);
      if (sortOrder === "price-high") return Number(second.price) - Number(first.price);
      return 0;
    });
  }, [category, priceRange, products, query, size, sortOrder]);

  function resetFilters() {
    setCategory(allPieces);
    setSize(allSizes);
    setPriceRange("all");
    setQuery("");
  }

  return (
    <main id="top" className="min-h-screen bg-[#fffdfd] text-[#111111]">
      <header className="relative border-b border-black/10 bg-[#fffdfd]">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
          <button className="grid size-9 place-items-center lg:hidden" onClick={() => setMenuOpen((open) => !open)} aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen}>
            {menuOpen ? <X size={20} strokeWidth={1.35} /> : <Menu size={21} strokeWidth={1.35} />}
          </button>

          <nav className={`${menuOpen ? "flex" : "hidden"} absolute inset-x-0 top-full z-30 flex-col border-b border-black/10 bg-[#fffdfd] px-5 py-5 text-[11px] font-medium uppercase tracking-[0.12em] lg:static lg:flex lg:flex-row lg:items-center lg:gap-7 lg:border-0 lg:p-0`} aria-label="Main navigation">
            <a href="#shop" onClick={() => setMenuOpen(false)} className="py-3 transition-colors hover:text-[#c71964] lg:py-0">Shop</a>
            <a href="#story" onClick={() => setMenuOpen(false)} className="py-3 transition-colors hover:text-[#c71964] lg:py-0">Our story</a>
          </nav>

          <a href="#top" className="absolute left-1/2 -translate-x-1/2" aria-label="Glad Style Fashion home">
            <BrandLogo className="h-auto w-28 sm:w-40" />
          </a>

          <div className="flex items-center gap-1 sm:gap-3">
            <label className="hidden items-center gap-2 border-b border-black/30 pb-1 lg:flex">
              <Search size={15} strokeWidth={1.35} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} className="w-24 bg-transparent text-xs outline-none placeholder:text-black/45" placeholder="Search" aria-label="Search products" />
            </label>
            <a href="/account" className="grid size-9 place-items-center transition-colors hover:text-[#c71964]" aria-label="Your account"><UserRound size={18} strokeWidth={1.35} /></a>
            <button className="relative grid size-9 place-items-center transition-colors hover:text-[#c71964] active:scale-[0.98]" onClick={() => setCartOpen(true)} aria-label="Open shopping bag">
              <ShoppingBag size={19} strokeWidth={1.35} />
              {cartCount > 0 && <span className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-[#c71964] text-[9px] font-semibold text-white">{cartCount}</span>}
            </button>
          </div>
        </div>
      </header>

      <section id="shop" className="mx-auto max-w-[1500px] px-5 pb-16 pt-7 sm:px-8 sm:pb-20 sm:pt-10 lg:px-12">
        <div className="flex items-end justify-between gap-6 border-b border-black/15 pb-5">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#c71964]">New arrivals</p>
            <h1 className="mt-2 text-2xl font-medium tracking-[-0.035em] sm:text-3xl">Pieces for every plan.</h1>
          </div>
          <p className="hidden text-xs text-black/55 sm:block">{filteredProducts.length} {filteredProducts.length === 1 ? "piece" : "pieces"}</p>
        </div>

        <div className="border-b border-black/15 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {categories.map((item) => (
              <button key={item} onClick={() => setCategory(item)} className={`shrink-0 border px-4 py-2 text-[10px] font-medium uppercase tracking-[0.11em] transition-colors active:scale-[0.98] ${category === item ? "border-black bg-black text-white" : "border-black/20 bg-transparent hover:border-[#c71964] hover:text-[#c71964]"}`}>
                {item}
              </button>
            ))}
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setFiltersOpen((open) => !open)} aria-expanded={filtersOpen} className="inline-flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.12em] transition-colors hover:text-[#c71964]">
                <SlidersHorizontal size={15} strokeWidth={1.4} /> Filters
              </button>
              <label className="hidden items-center gap-2 text-[10px] font-medium uppercase tracking-[0.12em] lg:flex">
                Sort
                <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value as SortOrder)} className="bg-transparent text-xs normal-case outline-none">
                  <option value="newest">Newest</option>
                  <option value="price-low">Price: low to high</option>
                  <option value="price-high">Price: high to low</option>
                </select>
              </label>
            </div>
          </div>
          <label className="mt-4 flex items-center gap-2 border-b border-black/30 pb-2 lg:hidden">
            <Search size={15} strokeWidth={1.35} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-transparent text-sm outline-none placeholder:text-black/45" placeholder="Search the collection" aria-label="Search the collection" />
          </label>
          {filtersOpen && (
            <div className="mt-5 grid gap-5 border-t border-black/10 pt-5 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
              <fieldset>
                <legend className="mb-3 text-[10px] font-medium uppercase tracking-[0.12em]">Size</legend>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((item) => (
                    <button key={item} onClick={() => setSize(item)} className={`min-w-10 border px-3 py-2 text-[10px] font-medium uppercase tracking-[0.1em] transition-colors active:scale-[0.98] ${size === item ? "border-black bg-black text-white" : "border-black/20 hover:border-[#c71964] hover:text-[#c71964]"}`}>
                      {item}
                    </button>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend className="mb-3 text-[10px] font-medium uppercase tracking-[0.12em]">Price</legend>
                <div className="flex flex-wrap gap-2">
                  {([
                    ["all", "Any price"],
                    ["under-50000", "Under ₦50k"],
                    ["50000-100000", "₦50k to ₦100k"],
                    ["over-100000", "Over ₦100k"],
                  ] as const).map(([value, label]) => (
                    <button key={value} onClick={() => setPriceRange(value)} className={`border px-3 py-2 text-[10px] font-medium uppercase tracking-[0.1em] transition-colors active:scale-[0.98] ${priceRange === value ? "border-black bg-black text-white" : "border-black/20 hover:border-[#c71964] hover:text-[#c71964]"}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </fieldset>
              <div className="flex items-center justify-between gap-4 lg:block">
                <label className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.12em] lg:hidden">
                  Sort
                  <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value as SortOrder)} className="bg-transparent text-xs normal-case outline-none">
                    <option value="newest">Newest</option>
                    <option value="price-low">Price: low to high</option>
                    <option value="price-high">Price: high to low</option>
                  </select>
                </label>
                <button onClick={resetFilters} className="text-[10px] font-medium uppercase tracking-[0.12em] text-black/55 underline underline-offset-4 transition-colors hover:text-[#c71964]">Clear filters</button>
              </div>
            </div>
          )}
        </div>

        {filteredProducts.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-xl font-medium">No pieces match that search.</p>
            <button onClick={resetFilters} className="mt-5 border-b border-[#c71964] pb-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#c71964]">View all pieces</button>
          </div>
        ) : (
          <div className={`mt-6 grid grid-cols-2 gap-x-2 gap-y-8 sm:gap-x-4 sm:gap-y-10 ${filteredProducts.length > 2 ? "lg:grid-cols-4" : "lg:grid-cols-2 lg:max-w-[760px]"}`}>
            {filteredProducts.map((product) => {
              const primaryImage = product.images?.[0];
              const secondaryImage = product.images?.[1];
              return (
                <article key={product.id} className="group min-w-0">
                  <a href={`/product/${product.slug}`} className="relative block overflow-hidden bg-[#faedf1]">
                    <img src={primaryImage?.imageUrl || primaryProductImage} alt={primaryImage?.altText || product.productName || primaryProductAlt} className={`aspect-[3/4] w-full object-cover transition duration-500 group-hover:scale-[1.015] ${secondaryImage ? "group-hover:opacity-0" : ""}`} />
                    {secondaryImage && <img src={secondaryImage.imageUrl} alt="" aria-hidden="true" className="absolute inset-0 aspect-[3/4] w-full object-cover opacity-0 transition duration-500 group-hover:opacity-100" />}
                  </a>
                  <div className="flex flex-col gap-1 pt-3 sm:flex-row sm:items-start sm:justify-between sm:gap-3 sm:pt-4">
                    <div className="min-w-0 max-w-full">
                      {product.category?.name && <p className="mb-1 text-[9px] font-medium uppercase tracking-[0.1em] text-black/45">{product.category.name}</p>}
                      <h2 className="break-words text-sm font-medium leading-5 sm:text-base"><a href={`/product/${product.slug}`} className="transition-colors hover:text-[#c71964]">{product.productName}</a></h2>
                    </div>
                    <p className="shrink-0 pt-0.5 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-[#c71964] sm:text-right sm:text-xs">{formatStorePrice(product.price)}</p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section id="story" className="border-y border-black/15 bg-[#faedf1]">
        <div className="mx-auto grid max-w-[1500px] gap-7 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 lg:px-12">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#c71964]">Glad Style Fashion</p>
          <div className="max-w-2xl">
            <h2 className="text-3xl font-medium leading-tight tracking-[-0.045em] sm:text-5xl">For the days you want to feel put together.</h2>
            <p className="mt-5 max-w-xl text-sm leading-6 text-black/65 sm:text-base sm:leading-7">Feminine ready-to-wear for everyday plans, standout moments, and the ones in between. Explore the collection or begin a custom-made look with us.</p>
          </div>
        </div>
      </section>

      <footer className="bg-[#fffdfd]">
        <div className="mx-auto grid max-w-[1500px] gap-10 px-5 py-10 sm:px-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-end lg:px-12">
          <div className="max-w-sm">
            <BrandLogo className="h-auto w-40" />
            <p className="mt-4 text-xs leading-5 text-black/55">Women&apos;s ready-to-wear and custom pieces.</p>
            <div className="mt-6 flex items-center gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-black/45">Follow us</p>
              <a href="https://www.instagram.com/gladstylefashion/" target="_blank" rel="noreferrer" className="grid size-9 place-items-center rounded-full border border-black/15 bg-white transition-transform hover:-translate-y-0.5" aria-label="Follow Glad Style Fashion on Instagram">
                <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
                  <defs><linearGradient id="instagram-gradient" x1="0" x2="1" y1="1" y2="0"><stop offset="0" stopColor="#f58529" /><stop offset="0.45" stopColor="#dd2a7b" /><stop offset="1" stopColor="#8134af" /></linearGradient></defs>
                  <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="url(#instagram-gradient)" strokeWidth="2" />
                  <circle cx="12" cy="12" r="4" fill="none" stroke="url(#instagram-gradient)" strokeWidth="2" />
                  <circle cx="17.5" cy="6.5" r="1.2" fill="#dd2a7b" />
                </svg>
              </a>
              <a href="https://www.facebook.com/gladstylefashion" target="_blank" rel="noreferrer" className="grid size-9 place-items-center rounded-full border border-black/15 bg-white transition-transform hover:-translate-y-0.5" aria-label="Follow Glad Style Fashion on Facebook">
                <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="#1877f2" /><path d="M13.4 19v-6h2l.3-2.3h-2.3V9.2c0-.7.2-1.2 1.2-1.2h1.2V6a15 15 0 0 0-1.7-.1c-1.7 0-2.9 1-2.9 3v1.8H9.3V13h1.9v6h2.2Z" fill="white" /></svg>
              </a>
            </div>
          </div>
          <div className="flex max-w-xl flex-wrap items-center gap-x-5 gap-y-3 text-[10px] font-medium uppercase tracking-[0.12em] text-black/60 md:justify-end">
            <a href="/shipping-delivery" className="hover:text-[#c71964]">Shipping and delivery</a>
            <a href="/returns-exchanges" className="hover:text-[#c71964]">Returns and exchanges</a>
            <a href="/privacy" className="hover:text-[#c71964]">Privacy</a>
            <a href="/terms" className="hover:text-[#c71964]">Terms</a>
          </div>
        </div>
      </footer>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} fallbackImage={primaryProductImage} emptyContent={<p className="mt-2 text-sm text-black/55">Your bag is waiting for a piece you will wear on repeat.</p>} />
    </main>
  );
}
