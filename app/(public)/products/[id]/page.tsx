
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { formatPrice } from "@/lib/products";
import { getCatalogProduct, getRelatedCatalogProducts } from "@/lib/catalog";
import { ProductActions } from "@/features/products/ProductActions";
import { ProductGrid } from "@/components/products/ProductGrid";

type ProductPageProps = {
  params: Promise<{ id: string }>;
};

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-4 border-b border-slate-100 py-4 last:border-0 sm:grid-cols-[180px_minmax(0,1fr)]">
      <dt className="text-sm font-medium text-slate-500">
        {label}
      </dt>
      <dd className="min-w-0 break-words text-sm font-semibold text-slate-900">
        {value}
      </dd>
    </div>
  );
}

function SectionTitle({
  eyebrow,
  title,
}: {
  eyebrow?: string;
  title: string;
}) {
  return (
    <div className="mb-7">
      {eyebrow && (
        <p className="mb-2 text-xs font-medium text-violet-700">
          {eyebrow}
        </p>
      )}
      <h2 className="text-slate-950">
        {title}
      </h2>
    </div>
  );
}

export default async function ProductPage({
  params,
}: ProductPageProps) {
  const { id } = await params;
  const product = await getCatalogProduct(id);

  if (!product) {
    notFound();
  }

  const related = await getRelatedCatalogProducts(product.category, product.id);

  const inStock = product.stock > 0;

  const stockMessage = !inStock
    ? "Currently unavailable"
    : product.stock <= 5
      ? `Only ${product.stock} left in stock`
      : "Available to order";

  const description =
    product.description?.trim() || "No description available.";

  const descriptionParagraphs = description
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <main className="min-h-screen bg-[var(--page-bg)] text-slate-900">
      {/* Breadcrumbs */}
      <nav
        aria-label="Breadcrumb"
        className="border-b border-slate-200 bg-white"
      >
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-3 py-3 text-xs text-slate-500 sm:px-6 sm:py-4 sm:text-sm">
          <Link
            href="/"
            className="transition hover:text-violet-700"
          >
            Home
          </Link>

          <span aria-hidden="true">/</span>

          <Link
            href="/products"
            className="transition hover:text-violet-700"
          >
            Products
          </Link>

          <span aria-hidden="true">/</span>

          <span className="font-medium text-slate-600">
            {product.category}
          </span>

          <span aria-hidden="true">/</span>

          <span
            className="max-w-[220px] truncate font-semibold text-slate-950"
            aria-current="page"
          >
            {product.name}
          </span>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-3 pb-12 pt-5 sm:px-6 sm:pb-16 sm:pt-7">
        {/* Main product layout */}
        <div className="grid min-w-0 items-start gap-5 sm:gap-7 lg:grid-cols-12 lg:gap-8">
          {/* Product gallery */}
          <section
            aria-label="Product visual"
            className="lg:col-span-5"
          >
            <div className="lg:sticky lg:top-6">
              <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white">
                {product.imageUrl ? (
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 42vw"
                    className="relative z-10 object-contain p-3 sm:p-6"
                  />
                ) : (
                  <div
                    className="relative flex h-full w-full items-center justify-center text-[6rem] sm:text-[8rem]"
                    role="img"
                    aria-label={`Product illustration for ${product.name}`}
                  >
                    {product.emoji}
                  </div>
                )}

                <div className="absolute left-3 top-3 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700">
                  {product.category}
                </div>
              </div>
            </div>
          </section>

          {/* Product information */}
          <section className="min-w-0 lg:col-span-4">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`inline-flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium ${
                  inStock
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    inStock ? "bg-emerald-500" : "bg-red-500"
                  }`}
                />
                {inStock ? "In stock" : "Out of stock"}
              </span>
            </div>

            <h1 className="mt-3 text-slate-950">
              {product.name}
            </h1>

            <p className="mt-3 text-sm text-slate-500">
              Explore product details, availability, and purchasing options.
            </p>

            <div className="mt-5 border-y border-slate-200 py-5">
              <p className="text-xs font-medium text-slate-500">
                Product price
              </p>

              <div className="mt-2 flex flex-wrap items-end gap-3">
                <span className="product-detail-price text-slate-950">
                  {formatPrice(product.price)}
                </span>
              </div>

              <p className="mt-3 text-xs leading-5 text-slate-500">
                Any applicable shipping charges or additional costs
                should be confirmed during checkout.
              </p>
            </div>

            {/* Overview */}
            <div className="mt-7">
              <h2 className="text-lg font-bold text-slate-950">
                About this product
              </h2>

              <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-600">
                {description}
              </p>

              <a
                href="#full-description"
                className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-violet-700 hover:text-violet-900"
              >
                Read full description
                <span aria-hidden="true">↓</span>
              </a>
            </div>

            {/* Product facts */}
            <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="text-base font-bold text-slate-950">
                  Product at a glance
                </h2>
              </div>

              <dl className="px-5">
                <DetailRow
                  label="Category"
                  value={product.category}
                />

                <DetailRow
                  label="Product ID"
                  value={String(product.id)}
                />

                <DetailRow
                  label="Price"
                  value={formatPrice(product.price)}
                />

                <DetailRow
                  label="Availability"
                  value={stockMessage}
                />

                <DetailRow
                  label="Units in stock"
                  value={product.stock}
                />
              </dl>
            </div>

            {/* Page links */}
            <div className="mt-8">
              <h2 className="text-base font-bold">
                Explore product information
              </h2>

              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href="#full-description"
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:border-violet-400"
                >
                  Description ↓
                </a>

                <a
                  href="#specifications"
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:border-violet-400"
                >
                  Specifications ↓
                </a>

                <a
                  href="#shopping-information"
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:border-violet-400"
                >
                  Shopping information ↓
                </a>

                {related.length > 0 && (
                  <a
                    href="#related-products"
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:border-violet-400"
                  >
                    Similar products ↓
                  </a>
                )}
              </div>
            </div>
          </section>

          {/* Purchase panel */}
          <aside className="lg:col-span-3">
            <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
              <p className="text-xs font-medium text-slate-500">
                Purchase options
              </p>

              <p className="product-detail-price mt-4 text-slate-950">
                {formatPrice(product.price)}
              </p>

              <div className="mt-5 border-t border-slate-100 pt-5">
                <p className="text-sm font-semibold text-slate-900">
                  Availability
                </p>

                <p
                  className={`mt-2 text-sm font-semibold ${
                    inStock ? "text-emerald-700" : "text-red-600"
                  }`}
                >
                  {stockMessage}
                </p>
              </div>

              <div className="mt-6">
                <ProductActions product={product} />
              </div>

              <p className="mt-5 text-xs leading-6 text-slate-500">
                Product availability and final order details are
                subject to confirmation during checkout.
              </p>

              <div className="mt-6 divide-y divide-slate-100 border-t border-slate-100">
                <div className="flex items-start gap-3 py-4">
                  <span className="text-xl" aria-hidden="true">
                    📦
                  </span>

                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      Order information
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Review the total and available fulfillment
                      options before placing an order.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 py-4">
                  <span className="text-xl" aria-hidden="true">
                    🔒
                  </span>

                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      Checkout
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Continue through the existing Cliffesto
                      checkout flow.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 py-4">
                  <span className="text-xl" aria-hidden="true">
                    ℹ️
                  </span>

                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      Need more information?
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Check the product description and available
                      specifications below.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Link
              href="/products"
              className="mt-4 flex min-h-11 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-violet-700 transition hover:border-violet-300 hover:bg-violet-50"
            >
              ← Continue shopping
            </Link>
          </aside>
        </div>

        {/* Detailed information */}
        <div className="mt-16 grid gap-8 lg:grid-cols-12">
          <div className="space-y-8 lg:col-span-8">
            {/* Description */}
            <section
              id="full-description"
              className="scroll-mt-8 rounded-lg border border-slate-200 bg-white p-4 sm:p-6"
            >
              <SectionTitle
                eyebrow="Get to know your product"
                title="Product description"
              />

              <div className="space-y-5 text-sm leading-8 text-slate-600 sm:text-base">
                {descriptionParagraphs.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </section>

            {/* Specifications */}
            <section
              id="specifications"
              className="scroll-mt-8 rounded-lg border border-slate-200 bg-white p-4 sm:p-6"
            >
              <SectionTitle
                eyebrow="The details"
                title="Product specifications"
              />

              <p className="mb-6 text-sm leading-7 text-slate-500">
                Verified details currently available in our product catalog.
              </p>

              <dl className="overflow-hidden rounded-2xl border border-slate-200 px-5 sm:px-6">
                <DetailRow
                  label="Product name"
                  value={product.name}
                />

                <DetailRow
                  label="Product identifier"
                  value={String(product.id)}
                />

                <DetailRow
                  label="Product category"
                  value={product.category}
                />

                <DetailRow
                  label="Listed price"
                  value={formatPrice(product.price)}
                />

                <DetailRow
                  label="Stock availability"
                  value={stockMessage}
                />
              </dl>

              <p className="mt-5 text-xs leading-6 text-slate-500">
                Additional technical specifications, dimensions,
                materials, or model details will appear when they
                are available in the product catalog.
              </p>
            </section>

            {/* Shopping and policies */}
            <section
              id="shopping-information"
              className="scroll-mt-8 rounded-lg border border-slate-200 bg-white p-4 sm:p-6"
            >
              <SectionTitle
                eyebrow="Before you order"
                title="Shopping information"
              />

              <div className="divide-y divide-slate-100">
                <details className="group py-5" open>
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-bold text-slate-900">
                    Product availability
                    <span className="text-xl font-normal text-violet-700 transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>

                  <p className="mt-4 text-sm leading-7 text-slate-600">
                    {inStock
                      ? `${product.stock} unit${product.stock === 1 ? "" : "s"} currently listed as available. Stock can change before an order is placed.`
                      : "This product is currently out of stock."}
                  </p>
                </details>

                <details className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-bold text-slate-900">
                    Delivery information
                    <span className="text-xl font-normal text-violet-700 transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>

                  <p className="mt-4 text-sm leading-7 text-slate-600">
                    Delivery availability, shipping charges, and
                    estimated timelines have not been provided
                    for this product.
                  </p>
                </details>

                <details className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-bold text-slate-900">
                    Returns and replacements
                    <span className="text-xl font-normal text-violet-700 transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>

                  <p className="mt-4 text-sm leading-7 text-slate-600">
                    Product-specific return and replacement terms
                    are not currently available in the product data.
                    Confirm the applicable policy before purchasing.
                  </p>
                </details>

                <details className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-bold text-slate-900">
                    Warranty details
                    <span className="text-xl font-normal text-violet-700 transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>

                  <p className="mt-4 text-sm leading-7 text-slate-600">
                    No product-specific warranty information has
                    been supplied in the catalog.
                  </p>
                </details>

                <details className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-bold text-slate-900">
                    Additional product information
                    <span className="text-xl font-normal text-violet-700 transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>

                  <p className="mt-4 text-sm leading-7 text-slate-600">
                    For more information, refer to the product
                    description and specification table above.
                  </p>
                </details>
              </div>
            </section>
          </div>

          {/* Side information */}
          <aside className="space-y-6 lg:col-span-4">
            <div className="rounded-lg border border-violet-100 bg-violet-50 p-4 sm:p-6">
              <span className="text-xs font-medium text-violet-700">
                Cliffesto product guide
              </span>

              <h2 className="mt-4 text-2xl font-bold leading-tight tracking-tight text-slate-950">
                Everything important.
                <br />
                In one place.
              </h2>

              <p className="mt-4 text-sm leading-7 text-slate-600">
                Compare the product information, check
                availability, and review your purchase options
                before making a decision.
              </p>

              <a
                href="#specifications"
                className="site-button-primary mt-6 rounded-full px-6 py-3 text-sm"
              >
                View specifications ↗
              </a>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
              <h2 className="text-lg font-bold">
                Quick product summary
              </h2>

              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4 text-sm">
                  <span className="text-slate-500">
                    Category
                  </span>
                  <span className="text-right font-semibold">
                    {product.category}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4 text-sm">
                  <span className="text-slate-500">
                    Price
                  </span>
                  <span className="font-bold">
                    {formatPrice(product.price)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-slate-500">
                    Status
                  </span>
                  <span
                    className={`text-right font-bold ${
                      inStock
                        ? "text-emerald-700"
                        : "text-red-600"
                    }`}
                  >
                    {inStock ? "Available" : "Unavailable"}
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <section
            id="related-products"
            className="mt-20 scroll-mt-8"
          >
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="mb-2 text-xs font-medium text-violet-700">
                  Keep exploring
                </p>

                <h2 className="text-slate-950">
                  You might also like
                </h2>

                <p className="mt-3 text-sm text-slate-500">
                  More products from the {product.category} category.
                </p>
              </div>

              <Link
                href="/products"
                className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-violet-700 transition hover:border-violet-300"
              >
                Explore all products ↗
              </Link>
            </div>

            <ProductGrid products={related} />
          </section>
        )}

        {/* Bottom call to action */}
        <section className="brand-panel mt-10 rounded-lg px-5 py-7 text-white sm:px-8">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-medium text-violet-300">
                Discover more with Cliffesto
              </p>

              <h2 className="mt-3">
                Find what fits your everyday.
              </h2>

              <p className="mt-3 text-sm leading-6 text-violet-100/80">
                Explore more products and discover something new.
              </p>
            </div>

            <Link
              href="/products"
              className="site-button-light shrink-0 rounded-full px-7 py-3.5 text-sm"
            >
              Continue shopping ↗
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
