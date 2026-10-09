import type { Product } from "@/lib/products";
import { ProductCard } from "./ProductCard";

export function ProductGrid({
  products,
  variant = "grid",
  priorityFirst = false,
}: {
  products: Product[];
  variant?: "grid" | "list" | "search" | "compact";
  priorityFirst?: boolean;
}) {
  if (variant === "list") {
    return (
      <div className="grid gap-3 sm:gap-4">
        {products.map((product, index) => <ProductCard key={product.id} product={product} variant="list" priority={priorityFirst && index === 0} />)}
      </div>
    );
  }

  if (variant === "search") {
    return (
      <div className="grid min-w-0 grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product, index) => <ProductCard key={product.id} product={product} variant="search" priority={priorityFirst && index === 0} />)}
      </div>
    );
  }

  return (
    <div className="grid min-w-0 grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product, index) => <ProductCard key={product.id} product={product} variant={variant} priority={priorityFirst && index === 0} />)}
    </div>
  );
}
