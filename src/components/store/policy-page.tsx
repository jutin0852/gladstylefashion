import Link from "next/link";
import BrandLogo from "./brand-logo";

type PolicySection = {
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

export default function PolicyPage({
  eyebrow,
  title,
  intro,
  sections,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  sections: PolicySection[];
}) {
  return (
    <main className="min-h-screen bg-white text-[#111111]">
      <header className="mx-auto flex max-w-[1120px] items-center justify-between border-x border-b border-black px-5 py-4 sm:px-10">
        <Link href="/" aria-label="Glad Style Fashion home"><BrandLogo className="h-auto w-36 sm:w-44" /></Link>
        <Link href="/" className="text-[10px] font-semibold uppercase tracking-[0.14em] hover:text-[#d3146d]">Back to store</Link>
      </header>
      <article className="mx-auto max-w-[1120px] border-x border-black px-5 py-14 sm:px-10 sm:py-20">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d3146d]">{eyebrow}</p>
        <h1 className="mt-4 max-w-3xl text-5xl font-medium leading-[0.95] tracking-[-0.06em] sm:text-7xl">{title}</h1>
        <p className="mt-7 max-w-2xl text-base leading-7 text-black/70">{intro}</p>
        <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.13em] text-black/50">Last updated: 18 September 2026</p>

        <div className="mt-14 divide-y divide-black border-y border-black">
          {sections.map((section) => (
            <section key={section.title} className="py-8 sm:grid sm:grid-cols-[220px_1fr] sm:gap-10">
              <h2 className="text-sm font-semibold uppercase tracking-[0.14em]">{section.title}</h2>
              <div className="mt-4 space-y-4 text-sm leading-7 text-black/70 sm:mt-0">
                {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                {section.bullets && <ul className="list-disc space-y-2 pl-5">{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>}
              </div>
            </section>
          ))}
        </div>
      </article>
      <footer className="mx-auto flex max-w-[1120px] flex-wrap gap-x-5 gap-y-3 border-x border-t border-black px-5 py-6 text-[10px] font-semibold uppercase tracking-[0.13em] text-black/60 sm:px-10">
        <Link href="/shipping-delivery" className="hover:text-[#d3146d]">Shipping & delivery</Link>
        <Link href="/returns-exchanges" className="hover:text-[#d3146d]">Returns & exchanges</Link>
        <Link href="/privacy" className="hover:text-[#d3146d]">Privacy</Link>
        <Link href="/terms" className="hover:text-[#d3146d]">Terms</Link>
      </footer>
    </main>
  );
}
