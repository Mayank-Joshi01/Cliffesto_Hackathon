
import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/products/ProductCard";
import { GoBackLink } from "@/components/layout/GoBackLink";
import { listHomeCatalog } from "@/lib/catalog";
export const metadata: Metadata = {
  title: "Page not found | Cliffesto",
  description: "The page you're looking for could not be found.",
};

async function ProductDiscovery() {
  let products: Awaited<ReturnType<typeof listHomeCatalog>>["products"] = [];

  try {
    const catalog = await listHomeCatalog();
    products = catalog.products.slice(0, 4);
  } catch (error) {
    console.error(
      "Unable to load product recommendations for the 404 page.",
      error,
    );
    return null;
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="discovery-heading"
      className="not-found-discovery"
    >
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3 sm:mb-6">
        <div>
          <p className="mb-2 text-xs font-medium text-violet-700 dark:text-violet-400">
            Recommended products
          </p>

          <h2
            id="discovery-heading"
            className="text-xl font-semibold text-[var(--foreground)] sm:text-2xl"
          >
            Continue shopping
          </h2>
        </div>

        <Link
          href="/products"
          className="text-sm font-medium text-violet-700 underline-offset-4 hover:underline dark:text-violet-400"
        >
          View all products
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            variant="compact"
          />
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

      <span className="not-found-spark not-found-spark-one">
        ✳
      </span>

      <span className="not-found-spark not-found-spark-two">
        ✦
      </span>

      <svg
        viewBox="0 0 320 250"
        fill="none"
        className="not-found-bag"
      >
        <ellipse
          cx="160"
          cy="221"
          rx="94"
          ry="13"
          fill="currentColor"
          opacity=".08"
        />

        <path
          d="M104 94h112l14 112c1.2 9.5-6.2 18-15.8 18h-108.4c-9.6 0-17-8.5-15.8-18L104 94Z"
          fill="var(--surface)"
          stroke="var(--accent-border)"
          strokeWidth="3"
        />

        <path
          d="m104 94 14 112c1.2 9.5-6.2 18-15.8 18h-2.5c-9.6 0-17-8.5-15.8-18L98 94h6Z"
          fill="var(--accent-soft)"
        />

        <path
          d="M128 100V79c0-18 14.3-32 32-32s32 14 32 32v21"
          stroke="var(--accent)"
          strokeWidth="8"
          strokeLinecap="round"
        />

        <path
          d="M128 100V79c0-18 14.3-32 32-32"
          stroke="var(--surface)"
          strokeWidth="3"
          strokeLinecap="round"
          opacity=".75"
        />

        <rect
          x="140"
          y="122"
          width="42"
          height="43"
          rx="9"
          fill="var(--accent-soft)"
        />

        <path
          d="M153 143h16M161 135v16"
          stroke="var(--accent)"
          strokeWidth="3"
          strokeLinecap="round"
        />

        <path
          d="M205 172c-5 7-13 11-22 11"
          stroke="var(--accent-border)"
          strokeWidth="3"
          strokeLinecap="round"
        />

        <circle
          cx="215"
          cy="82"
          r="21"
          fill="var(--surface)"
          stroke="var(--accent-border)"
          strokeWidth="2"
        />

        <path
          d="m208 75 14 14m0-14-14 14"
          stroke="var(--accent)"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>

      <span className="not-found-number" aria-hidden="true">
        404
      </span>
    </div>
  );
}

export default function NotFound() {
  return (
    <main className="not-found-page">
      <section
        className="not-found-hero"
        aria-labelledby="not-found-heading"
      >
        <LostBagIllustration />

        <div className="not-found-copy">
          <p className="not-found-eyebrow">
            <span />
            Page not found
          </p>

          <h1 id="not-found-heading">
            We couldn't find that page.
          </h1>

          <p className="not-found-description">
            The page you're looking for doesn't exist or may
            have been moved. You can return to the homepage
            or browse our products.
          </p>

          <nav
            aria-label="Not found page actions"
            className="not-found-actions"
          >
            <Link href="/" className="site-button-accent">
              Go to Home
            </Link>

            <Link
              href="/products"
              className="site-button-outline"
            >
              Browse Products
            </Link>

            <GoBackLink />
          </nav>
        </div>
      </section>

      <ProductDiscovery />
    </main>
  );
}
