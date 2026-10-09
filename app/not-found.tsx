import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/products/ProductCard";
import { GoBackLink } from "@/components/layout/GoBackLink";
import { listCatalog } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Page not found | Cliffesto",
  description: "We couldn't find that page. Discover thoughtful goods at Cliffesto.",
};

async function ProductDiscovery() {
  let products;

  try {
    products = (await listCatalog()).slice(0, 4);
  } catch (error) {
    console.error("Unable to load product recommendations for the not-found page.", error);
    return null;
  }

  if (!products.length) return null;

  return (
    <section aria-labelledby="discovery-heading" className="not-found-discovery">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3 sm:mb-6">
        <div>
          <p className="mb-2 text-xs font-medium text-violet-700">A little inspiration</p>
          <h2 id="discovery-heading" className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            Let&apos;s find something you&apos;ll love.
          </h2>
        </div>
        <Link href="/products" className="rounded-sm text-sm font-semibold text-violet-700 underline-offset-4 hover:underline">
          View all products
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} variant="compact" />
        ))}
      </div>
    </section>
  );
}

function LostBagIllustration() {
  return (
    <div className="not-found-art" aria-hidden="true">
      <span className="not-found-orbit not-found-orbit-one" />
      <span className="not-found-orbit not-found-orbit-two" />
      <span className="not-found-spark not-found-spark-one">✳</span>
      <span className="not-found-spark not-found-spark-two">✦</span>
      <svg viewBox="0 0 320 250" fill="none" className="not-found-bag">
        <ellipse cx="160" cy="221" rx="94" ry="13" fill="currentColor" opacity=".08" />
        <path d="M104 94h112l14 112c1.2 9.5-6.2 18-15.8 18h-108.4c-9.6 0-17-8.5-15.8-18L104 94Z" fill="var(--surface)" stroke="var(--accent-border)" strokeWidth="3" />
        <path d="m104 94 14 112c1.2 9.5-6.2 18-15.8 18h-2.5c-9.6 0-17-8.5-15.8-18L98 94h6Z" fill="var(--accent-soft)" />
        <path d="M128 100V79c0-18 14.3-32 32-32s32 14 32 32v21" stroke="var(--accent)" strokeWidth="8" strokeLinecap="round" />
        <path d="M128 100V79c0-18 14.3-32 32-32" stroke="var(--surface)" strokeWidth="3" strokeLinecap="round" opacity=".75" />
        <rect x="140" y="122" width="42" height="43" rx="9" fill="var(--accent-soft)" />
        <path d="M153 143h16M161 135v16" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
        <path d="M205 172c-5 7-13 11-22 11" stroke="var(--accent-border)" strokeWidth="3" strokeLinecap="round" />
        <circle cx="215" cy="82" r="21" fill="var(--surface)" stroke="var(--accent-border)" strokeWidth="2" />
        <path d="m208 75 14 14m0-14-14 14" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <span className="not-found-number" aria-hidden="true">404</span>
    </div>
  );
}

export default function NotFound() {
  return (
    <main className="not-found-page">
      <section className="not-found-hero" aria-labelledby="not-found-heading">
        <LostBagIllustration />
        <div className="not-found-copy">
          <p className="not-found-eyebrow"><span /> Lost in the aisles</p>
          <h1 id="not-found-heading">Oops! This page wandered off.</h1>
          <p className="not-found-description">
            We couldn&apos;t find the page you&apos;re looking for. But don&apos;t worry—there are plenty of great finds waiting for you.
          </p>
          <nav aria-label="Not found page actions" className="not-found-actions">
            <Link href="/" className="site-button-accent">Back to Home</Link>
            <Link href="/products" className="site-button-outline">Explore Products</Link>
            <GoBackLink />
          </nav>
        </div>
      </section>
      <ProductDiscovery />
    </main>
  );
}
