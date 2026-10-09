import Image from "next/image";
import Link from "next/link";
import { formatPrice, type Product } from "@/lib/products";
import { Badge } from "@/components/ui/Badge";

type ProductCardProps = {
  product: Product & { imageUrl?: string };
  variant?: "grid" | "list" | "search" | "compact";
};

export function ProductCard({ product, variant = "grid" }: ProductCardProps) {
  const listLayout = variant === "list" || variant === "search";
  const responsiveSearch = variant === "search";
  const compact = variant === "compact";

  return (
    <article className={`group flex overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg ${responsiveSearch ? "flex-row lg:flex-col" : listLayout ? "flex-row" : "flex-col"} ${compact ? "rounded-xl" : ""}`}>
      <Link
        href={`/products/${product.id}`}
        aria-label={`View ${product.name}`}
        className={`relative flex shrink-0 items-center justify-center overflow-hidden bg-slate-50 ${responsiveSearch ? "aspect-square w-28 sm:w-36 lg:aspect-[4/3] lg:w-full" : listLayout ? "aspect-square w-28 sm:w-40" : "aspect-[4/3] w-full"} ${compact ? "aspect-square" : ""}`}
      >
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes={listLayout ? "(max-width: 640px) 112px, 160px" : "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"}
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            unoptimized
          />
        ) : (
          <span className="text-6xl" aria-hidden="true">{product.emoji}</span>
        )}
      </Link>

      <div className={`flex min-w-0 flex-1 flex-col ${listLayout ? "p-3 sm:p-5" : "p-4 sm:p-5"}`}>
        <div className="mb-2">
          <Badge>{product.category}</Badge>
        </div>
        <h2 className={`line-clamp-2 font-semibold leading-snug text-slate-900 ${compact ? "text-sm" : "text-sm sm:text-base"}`}>
          <Link href={`/products/${product.id}`} className="rounded-sm hover:text-violet-700 focus-visible:outline">
            {product.name}
          </Link>
        </h2>
        {!compact && (
          <p className={`mt-1 line-clamp-2 text-xs leading-5 text-slate-600 ${listLayout ? "hidden sm:block" : ""}`}>
            {product.description}
          </p>
        )}
        <div className="mt-auto pt-3">
          <p className="text-lg font-bold tracking-tight text-slate-950">{formatPrice(product.price)}</p>
          {product.price !== undefined && product.originalPrice !== undefined && product.originalPrice > product.price && (
            <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="line-through">{formatPrice(product.originalPrice)}</span>
              {product.discountPercentage !== undefined && product.discountPercentage > 0 && (
                <span className="font-semibold text-emerald-700">{product.discountPercentage}% off</span>
              )}
            </p>
          )}
          <p className={`mt-1 text-xs font-medium ${product.stock > 0 ? "text-emerald-700" : "text-red-600"}`}>
            {product.availability ?? (product.stock > 0 ? "Available" : "Unavailable")}
          </p>
          <Link
            href={`/products/${product.id}`}
            className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-slate-200 px-3 py-2 text-center text-sm font-semibold text-violet-700 transition hover:border-violet-300 hover:bg-violet-50 focus-visible:outline"
          >
            View details
          </Link>
        </div>
      </div>
    </article>
  );
}
