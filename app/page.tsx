
import Link from "next/link";
import Image from "next/image";
import { connection } from "next/server";
import type { ReactNode } from "react";
import { listHomeCatalog, type CatalogCategory } from "@/lib/catalog";
import { ProductCard } from "@/components/products/ProductCard";
import { SupabaseCatalogNotice } from "@/components/feedback/SupabaseCatalogNotice";

type ButtonVariant = "dark" | "light" | "purple";

type ShopButtonProps = {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
};

function ShopButton({
  href,
  children,
  variant = "dark",
  className = "",
}: ShopButtonProps) {
  const variantClass = {
    dark: "site-button-primary",
    light: "site-button-light",
    purple: "site-button-accent",
  }[variant];

  return (
    <Link
      href={href}
      className={`group ${variantClass} gap-3 text-sm no-underline shadow-md hover:-translate-y-0.5 hover:shadow-lg ${className}`}
    >
      <span>{children}</span>
      <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1">
        ↗
      </span>
    </Link>
  );
}

const categoryStyles = [
  { icon: "👗", bg: "bg-rose-50", text: "text-slate-900" },
  { icon: "✨", bg: "bg-violet-50", text: "text-violet-800" },
  { icon: "🏡", bg: "bg-amber-50", text: "text-slate-900" },
  { icon: "📱", bg: "bg-sky-50", text: "text-slate-900" },
  { icon: "💄", bg: "bg-pink-50", text: "text-slate-900" },
  { icon: "👟", bg: "bg-emerald-50", text: "text-emerald-700" },
  { icon: "🎒", bg: "bg-orange-50", text: "text-slate-900" },
  { icon: "🎁", bg: "bg-indigo-50", text: "text-indigo-800" },
];

const benefits = [
  {
    icon: "🔎",
    title: "Easy discovery",
    description: "Explore products across categories in one place.",
  },
  {
    icon: "💜",
    title: "Everyday favorites",
    description: "Discover products suited to your lifestyle.",
  },
  {
    icon: "✨",
    title: "Fresh inspiration",
    description: "Find something interesting in every collection.",
  },
];

function SectionHeading({
  label,
  title,
  description,
}: {
  label: string;
  title: string;
  description?: string;
}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-700">
        {label}
      </p>

      <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
        {title}
      </h2>

      {description && (
        <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
          {description}
        </p>
      )}
    </div>
  );
}

export default async function HomePage() {
  await connection();
  let categories: CatalogCategory[] = [];
  let displayedProducts: Awaited<ReturnType<typeof listHomeCatalog>>["products"] = [];
  let totalProducts = 0;
  let catalogError = false;
  try {
    const catalog = await listHomeCatalog();
    categories = catalog.categories.filter((category) => category.level <= 1);
    displayedProducts = catalog.products;
    totalProducts = catalog.totalProducts;
  } catch {
    catalogError = true;
    console.error("Homepage catalog data is unavailable.");
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[var(--page-bg)] text-slate-900">

      {/* Announcement */}
      <div className="brand-panel px-4 py-3 text-center">
        <p className="text-xs font-medium text-white sm:text-sm">
          Discover something different, every day.{" "}
          <Link
            href="/products"
            className="font-bold text-amber-200 underline underline-offset-4"
          >
            Shop now ↗
          </Link>
        </p>
      </div>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-5 pb-12 pt-8 sm:px-8 lg:py-14">
        <div className="theme-hero relative isolate overflow-hidden rounded-[2rem] lg:rounded-[2.5rem]">

          <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-violet-300/40 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-pink-200/50 blur-3xl" />

          <div className="relative grid items-center gap-10 px-7 py-14 sm:px-12 lg:grid-cols-2 lg:px-16 lg:py-20">

            {/* Hero content */}
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-wider text-violet-800 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-violet-600" />
                Your everyday discovery store
              </div>

              <h1 className="mt-8 max-w-2xl text-5xl font-black leading-[1.08] tracking-[-0.055em] text-slate-950 sm:text-6xl lg:text-[4.5rem]">
                Find your next
                <span className="mt-1 block text-violet-700">
                  little obsession.
                </span>
              </h1>

              <p className="mt-7 max-w-lg text-base leading-8 text-slate-600 sm:text-lg">
                Fresh finds, clever essentials, and products worth
                falling for. Explore collections curated for your
                everyday moments.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-4">
                <ShopButton href="/products" variant="dark">
                  Explore the collection
                </ShopButton>

                <a
                  href="#categories"
                  className="site-button-outline gap-2 shadow-sm hover:shadow-md"
                >
                  Browse categories
                  <span aria-hidden="true">↓</span>
                </a>
              </div>

              {/* Catalog stats */}
              <div className="mt-12 flex flex-wrap items-center gap-8 border-t border-violet-900/10 pt-7">
                <div>
                  <p className="text-3xl font-black text-slate-950">
                    {totalProducts}
                  </p>
                  <p className="mt-1 text-xs font-medium text-slate-500">
                    Products to explore
                  </p>
                </div>

                <div className="h-12 w-px bg-violet-900/15" />

                <div>
                  <p className="text-3xl font-black text-slate-950">
                    {categories.length}
                  </p>
                  <p className="mt-1 text-xs font-medium text-slate-500">
                    Collections
                  </p>
                </div>
              </div>
            </div>

            {/* Hero illustration */}
            <div
              className="relative flex min-h-[350px] items-center justify-center sm:min-h-[450px] lg:min-h-[490px]"
              aria-hidden="true"
            >
              <div className="absolute h-72 w-72 rounded-full border border-white/80 sm:h-96 sm:w-96" />

              <div className="absolute h-56 w-56 rounded-full border border-white/60 sm:h-80 sm:w-80" />

              <div className="theme-promo-card relative z-10 w-60 -rotate-[8deg] rounded-[2rem] border-4 border-white p-5 shadow-2xl shadow-violet-900/15 transition-transform duration-500 hover:rotate-0 sm:w-72">
                <div className="flex justify-between text-xs font-extrabold tracking-wide text-slate-700/70">
                  <span>THE DAILY EDIT</span>
                  <span>✦</span>
                </div>

                <div className="flex h-48 items-center justify-center text-[8rem] sm:h-56">
                  🛍️
                </div>

                <div className="rounded-2xl bg-white/75 p-4">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-800">
                    New discoveries
                  </p>
                  <p className="mt-2 text-lg font-extrabold text-slate-950">
                    Little joys, big love.
                  </p>
                </div>
              </div>

              <div className="absolute right-1 top-12 z-20 rotate-12 rounded-3xl border border-white bg-amber-100 p-5 text-5xl shadow-xl sm:right-4">
                ✨
              </div>

              <div className="absolute bottom-8 left-0 z-20 -rotate-12 rounded-3xl border border-white bg-white p-5 shadow-xl sm:left-4">
                <div className="text-4xl">💜</div>
                <p className="mt-2 text-xs font-extrabold text-violet-800">
                  Discover more
                </p>
              </div>

              <div className="absolute bottom-0 right-0 rounded-full bg-violet-700 px-5 py-3 text-xs font-extrabold text-white shadow-xl sm:right-4">
                MADE TO DISCOVER ✦
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-8">
        <div className="grid gap-6 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm md:grid-cols-3">
          {benefits.map((item) => (
            <div key={item.title} className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-2xl">
                {item.icon}
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-950">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section
        id="categories"
        className="mx-auto max-w-7xl scroll-mt-24 px-5 py-12 sm:px-8"
      >
        <div className="flex flex-wrap items-end justify-between gap-5">
          <SectionHeading
            label="Explore collections"
            title="Shop by category."
            description="Find what you're looking for, organized around your interests."
          />

          <Link
            href="/products"
            className="text-sm font-bold text-violet-700 hover:text-violet-800"
          >
            View all products ↗
          </Link>
        </div>

        {categories.length > 0 ? (
          <div className="mt-9 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {categories.map((category, index) => {
              const style =
                categoryStyles[index % categoryStyles.length];

              const count = category.productCount;

              return (
                <Link
                  key={category.id}
                  href={`/categories/${encodeURIComponent(category.slug)}`}
                  className={`group flex min-h-48 flex-col justify-between rounded-3xl border border-transparent p-5 transition-all duration-300 hover:-translate-y-1 hover:border-violet-200 hover:shadow-xl hover:shadow-violet-900/5 sm:p-6 ${style.bg}`}
                >
                  <div className="flex items-start justify-between">
                    {category.imageUrl ? (
                      <div className="relative h-16 w-16 overflow-hidden rounded-xl bg-white/70">
                        <Image src={category.imageUrl} alt="" fill sizes="64px" className="object-cover" unoptimized />
                      </div>
                    ) : (
                      <span className="text-5xl transition-transform duration-300 group-hover:scale-110">
                        {style.icon}
                      </span>
                    )}

                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg text-slate-950 transition-colors group-hover:bg-violet-100"
                    >
                      ↗
                    </span>
                  </div>

                  <div>
                    <h3 className={`text-lg font-extrabold sm:text-xl ${style.text}`}>
                      {category.name}
                    </h3>

                    {count !== undefined && count >= 0 && (
                      <p className="mt-2 text-xs font-medium text-slate-500">
                        {count} {count === 1 ? "product" : "products"}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="mt-8 text-sm text-slate-500">
            {catalogError ? "Collections are temporarily unavailable." : "New collections are coming soon."}
          </p>
        )}
      </section>

      {/* Promotional banner */}
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="brand-panel relative isolate overflow-hidden rounded-[2rem] px-8 py-12 sm:px-12 lg:px-16 lg:py-16">
          <div className="pointer-events-none absolute -right-20 -top-32 h-96 w-96 rounded-full bg-violet-600/25 blur-3xl" />

          <div className="relative z-10 flex flex-col items-start justify-between gap-9 md:flex-row md:items-center">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-violet-300">
                The discovery edit
              </p>

              <h2 className="mt-5 text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl">
                Unexpected finds.
                <br />
                Everyday favorites.
              </h2>

              <p className="mt-5 max-w-lg text-sm leading-7 text-violet-200 sm:text-base">
                Explore the collection and find something
                that feels just right for you.
              </p>
            </div>

            <ShopButton
              href="/products"
              variant="light"
              className="w-full sm:w-auto"
            >
              Start exploring
            </ShopButton>
          </div>
        </div>
      </section>

      {/* Featured products */}
      <section className="mx-auto max-w-7xl px-5 pb-24 pt-6 sm:px-8">
        <div className="mb-9 flex flex-wrap items-end justify-between gap-5">
          <SectionHeading
            label="Curated for you"
            title="Worth a closer look."
            description="Explore standout picks from our growing collection."
          />

          <Link
            href="/products"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-violet-700 transition-all hover:border-violet-300 hover:bg-violet-50"
          >
            View all products ↗
          </Link>
        </div>

        {displayedProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {displayedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}
          </div>
        ) : !catalogError && totalProducts === 0 ? (
          <SupabaseCatalogNotice />
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <div className="text-5xl">📦</div>
            <h3 className="mt-5 text-xl font-bold text-slate-900">
              Something good is coming.
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              {catalogError ? "The catalog is temporarily unavailable." : "Products will appear here when they are added."}
            </p>
          </div>
        )}
      </section>

      {/* Final CTA */}
      <section className="border-t border-slate-200 bg-white px-5 py-20 text-center sm:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="text-5xl text-violet-600">
            ✦
          </div>

          <h2 className="mt-5 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Your next favorite is waiting.
          </h2>

          <p className="mx-auto mt-5 max-w-lg text-sm leading-7 text-slate-500 sm:text-base">
            From everyday essentials to delightful discoveries,
            explore products that fit your lifestyle.
          </p>

          <div className="mt-9 flex justify-center">
            <ShopButton href="/products" variant="purple">
              Discover all products
            </ShopButton>
          </div>
        </div>
      </section>
    </main>
  );
}
