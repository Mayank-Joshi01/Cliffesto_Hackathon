
import Link from "next/link";

import { ProductGrid } from "@/components/products/ProductGrid";
import { listHomeCatalog } from "@/lib/catalog";

export default async function HomePage() {
  const { products, categories, totalProducts } =
    await listHomeCatalog();

  const productCount = totalProducts ?? 0;
  const categoryCount = categories.length;

  return (
    <main className="min-h-screen bg-[var(--page-bg)] text-[var(--foreground)]">
      {/* Homepage introduction */}
      <section className="mx-auto w-full max-w-[1440px] px-3 pt-4 sm:px-5 sm:pt-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-5 rounded-xl border border-current/10 bg-[var(--background)] px-5 py-6 sm:flex-row sm:items-center sm:px-8 sm:py-8">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-violet-600 dark:text-violet-400">
              Welcome to Cliffesto
            </p>

            <h1 className="mt-2 text-2xl font-semibold leading-tight sm:text-3xl">
              Everyday finds, easy to browse.
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 opacity-70">
              Explore {productCount}{" "}
              {productCount === 1 ? "product" : "products"} across{" "}
              {categoryCount}{" "}
              {categoryCount === 1 ? "category" : "categories"}.
            </p>
          </div>

          <Link
            href="/products"
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg bg-violet-700 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
          >
            Browse all products
          </Link>
        </div>
      </section>

      {/* Products section */}
      <section
        className="mx-auto w-full max-w-[1440px] px-3 py-7 sm:px-5 sm:py-9 lg:px-8"
        aria-labelledby="shop-products-heading"
      >
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              id="shop-products-heading"
              className="text-xl font-semibold sm:text-2xl"
            >
              Shop products
            </h2>

            <p className="mt-1 text-sm opacity-70">
              Browse products in our catalog.
            </p>
          </div>

          <Link
            href="/products"
            className="inline-flex min-h-11 items-center text-sm font-medium text-violet-600 hover:underline dark:text-violet-400"
          >
            View all
          </Link>
        </div>

        {products.length > 0 ? (
          <ProductGrid products={products.slice(0, 8)} />
        ) : (
          <div className="rounded-lg border border-current/10 bg-[var(--background)] p-6">
            <p className="text-sm opacity-70">
              No products are available right now. Please check
              back soon.
            </p>
          </div>
        )}
      </section>

      {/* Categories section */}
      {categories.length > 0 && (
        <section
          id="categories"
          className="mx-auto w-full max-w-[1440px] px-3 pb-9 sm:px-5 lg:px-8"
          aria-labelledby="shop-categories-heading"
        >
          <div className="mb-4">
            <h2
              id="shop-categories-heading"
              className="text-xl font-semibold sm:text-2xl"
            >
              Shop by category
            </h2>

            <p className="mt-1 text-sm opacity-70">
              Choose a category to narrow your search.
            </p>
          </div>

          <nav
            aria-label="Shop by category"
            className="flex flex-wrap gap-2"
          >
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/categories/${encodeURIComponent(
                  category.slug
                )}`}
                className="inline-flex min-h-11 items-center rounded-lg border border-current/15 bg-[var(--background)] px-4 text-sm font-medium transition-colors hover:border-violet-500 hover:text-violet-600 dark:hover:text-violet-400"
              >
                {category.name}
              </Link>
            ))}
          </nav>
        </section>
      )}
    </main>
  );
}
