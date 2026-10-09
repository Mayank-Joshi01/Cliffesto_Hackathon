import Image from "next/image";
import Link from "next/link";
import { formatPrice, type Product } from "@/lib/products";
import { Badge } from "@/components/ui/Badge";

type ProductCardProps = {
  product: Product & { imageUrl?: string };
  variant?: "grid" | "list" | "search" | "compact";
  priority?: boolean;
};

export function ProductCard({ product, variant = "grid", priority = false }: ProductCardProps) {
  const listLayout = variant === "list" || variant === "search";
  const responsiveSearch = variant === "search";
  const compact = variant === "compact";

  return (
    <article className={`group flex min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white transition-colors hover:border-slate-300 ${responsiveSearch ? "flex-row lg:flex-col" : listLayout ? "flex-row" : "flex-col"}`}>
      <Link
        href={`/products/${product.id}`}
        aria-label={`View ${product.name}`}
        className={`relative flex shrink-0 items-center justify-center overflow-hidden bg-slate-50 ${responsiveSearch ? "aspect-square w-24 sm:w-32 lg:aspect-square lg:w-full" : listLayout ? "aspect-square w-24 sm:w-36" : "aspect-square w-full"}`}
      >
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes={listLayout ? "(max-width: 640px) 96px, 144px" : "(max-width: 360px) 100vw, (max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"}
            loading={priority ? "eager" : "lazy"}
            className="object-contain p-2 transition-transform duration-200 group-hover:scale-[1.02]"
          />
        ) : (
          <span className="text-5xl" aria-hidden="true">{product.emoji}</span>
        )}
      </Link>

      <div className={`flex min-w-0 flex-1 flex-col ${listLayout ? "p-2.5 sm:p-4" : "p-3"}`}>
        <div className="mb-1.5">
          <Badge>{product.category}</Badge>
        </div>
        <h2 className="product-card-title line-clamp-2 text-slate-900">
          <Link href={`/products/${product.id}`} className="rounded-sm hover:text-violet-700 focus-visible:outline">
            {product.name}
          </Link>
        </h2>
        {!compact && product.description && (
          <p className={`mt-1 line-clamp-2 text-xs leading-5 text-slate-600 ${listLayout ? "hidden sm:block" : ""}`}>
            {product.description}
          </p>
        )}
        <div className="mt-auto pt-3">
          <p className="product-card-price text-slate-950">{formatPrice(product.price)}</p>
          <p className={`mt-1 text-xs ${product.stock > 0 ? "text-emerald-700" : "text-red-600"}`}>
            {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
          </p>
          <Link
            href={`/products/${product.id}`}
            className="mt-2 inline-flex min-h-10 w-full items-center justify-center rounded-md border border-slate-200 px-2 text-center text-xs font-medium text-violet-700 transition-colors hover:border-violet-300 hover:bg-violet-50 focus-visible:outline"
          >
            View details
          </Link>
        </div>
      </div>
    </article>
  );
}
