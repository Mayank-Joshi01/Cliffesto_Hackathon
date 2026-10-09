import Link from "next/link";
import { ProductGrid } from "@/components/products/ProductGrid";
import { listCatalog } from "@/lib/catalog";

export default async function HomePage() {
  const products = await listCatalog();
  const categoriesBySlug = new Map<string, { name: string; slug: string }>();
  for (const product of products) {
    const slug = product.categorySlug ?? product.category.toLowerCase().replace(/\s+/g, "-");
    categoriesBySlug.set(slug, { name: product.category, slug });
  }
  const categories = Array.from(categoriesBySlug.values())
    .sort((left, right) => left.name.localeCompare(right.name));

  return (
    <main className="min-h-screen bg-[var(--page-bg)] text-slate-900">
      <section className="mx-auto w-full max-w-[1440px] px-3 pt-4 sm:px-5 sm:pt-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-5 rounded-xl border border-slate-200 bg-white px-5 py-6 sm:flex-row sm:items-center sm:px-8 sm:py-8">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-violet-700">Welcome to Cliffesto</p>
            <h1 className="mt-2 text-slate-950">Everyday finds, easy to browse.</h1>
            <p className="mt-2 max-w-xl text-sm text-slate-600">
              Explore {products.length} {products.length === 1 ? "product" : "products"} across{" "}
              {categories.length} {categories.length === 1 ? "category" : "categories"}.
            </p>
          </div>
          <Link href="/products" className="site-button-accent shrink-0 rounded-lg px-5 py-2.5 text-sm">
            Browse all products
          </Link>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1440px] px-3 py-7 sm:px-5 sm:py-9 lg:px-8" aria-labelledby="shop-products-heading">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="shop-products-heading" className="text-slate-950">Shop products</h2>
            <p className="mt-1 text-sm text-slate-600">Browse the latest items in our catalog.</p>
          </div>
          <Link href="/products" className="min-h-11 inline-flex items-center text-sm font-medium text-violet-700 hover:underline">
            View all
          </Link>
        </div>
        {products.length > 0 ? (
          <ProductGrid products={products.slice(0, 8)} priorityFirst />
        ) : (
          <p className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
            No products are available right now. Please check back soon.
          </p>
        )}
      </section>

      {categories.length > 0 && (
        <section id="categories" className="mx-auto w-full max-w-[1440px] px-3 pb-9 sm:px-5 lg:px-8" aria-labelledby="shop-categories-heading">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="shop-categories-heading" className="text-slate-950">Shop by category</h2>
              <p className="mt-1 text-sm text-slate-600">Choose a category to narrow your search.</p>
            </div>
          </div>
          <nav aria-label="Shop by category" className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/categories/${encodeURIComponent(category.slug)}`}
                className="inline-flex min-h-11 items-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:border-violet-300 hover:text-violet-700"
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
