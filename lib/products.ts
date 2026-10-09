export type Product = {
  id: string;
  name: string;
  category: string;
  price: number | undefined;
  description: string;
  emoji: string;
  stock: number;
  subcategory?: string;
  brand?: string;
  imageUrl?: string;
  originalPrice?: number;
  discountPercentage?: number;
  availability?: string;
};

export function formatPrice(price: number | undefined) {
  if (price === undefined || !Number.isFinite(price)) return "Price unavailable";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(price);
}
