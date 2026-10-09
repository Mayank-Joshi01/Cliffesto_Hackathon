import { getSupabase } from "@/lib/supabase";
import type { Product } from "@/lib/products";
import { withDatabaseLogging } from "@/lib/observability";

export type CatalogProduct = Product & {
  imageUrl?: string;
  brand?: string;
  originalPrice?: number;
  discountPercentage?: number;
  availability?: string;
  sellerName?: string;
  colors?: string[];
  sizes?: string[];
  material?: string;
  codAvailable?: string;
  returnPolicy?: string;
  deliveryTime?: string;
  seller?: CatalogSeller;
};

export type CatalogCategory = {
  id: string;
  name: string;
  slug: string;
  parentCategory?: string;
  level: number;
  productCount?: number;
  imageUrl?: string;
};

export type CatalogSeller = {
  name: string;
  rating?: number;
  totalProducts?: number;
  yearsOnPlatform?: number;
  location?: string;
  verified?: boolean;
  responseTime?: string;
  returnPolicy?: string;
  codAccepted?: boolean;
};

export type CatalogSort = "relevance" | "smart" | "price-asc" | "price-desc";

type ProductRow = {
  product_id: string | number;
  title: string | null;
  category: string | null;
  subcategory: string | null;
  brand: string | null;
  original_price: number | string | null;
  discounted_price: number | string | null;
  discount_percentage: number | string | null;
  availability: string | boolean | null;
  seller_name: string | null;
  image_url: string | null;
  product_url: string | null;
  description: string | null;
  colors_available: unknown;
  sizes_available: unknown;
  material: string | null;
  cod_available: string | boolean | null;
  return_policy: string | null;
  delivery_time: string | null;
  source_page: string | null;
};

type CategoryRow = {
  category_id: string | number;
  name: string;
  parent_category: string | null;
  level: number | null;
  product_count: number | null;
  url: string | null;
  image_url: string | null;
  is_active: boolean | null;
};

type SellerRow = {
  seller_id: string | number;
  name: string;
  rating: number | string | null;
  total_products: number | null;
  years_on_platform: number | null;
  location: string | null;
  verified: boolean | null;
  response_time: string | null;
  return_policy: string | null;
  cod_accepted: boolean | null;
};

const productColumns = "product_id,title,category,subcategory,brand,original_price,discounted_price,discount_percentage,availability,seller_name,image_url,product_url,description,colors_available,sizes_available,material,cod_available,return_policy,delivery_time,source_page";
const categoryColumns = "category_id,name,parent_category,level,product_count,url,image_url,is_active";
const sellerColumns = "seller_id,name,rating,total_products,years_on_platform,location,verified,response_time,return_policy,cod_accepted";

function numberOrUndefined(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function listValue(value: unknown): string[] {
  if (value === null || value === undefined) return [];
  if (Array.isArray(value)) return value.flatMap(listValue);
  if (typeof value === "string") {
    return value.split(/[,|]/).map((item) => item.trim()).filter(Boolean);
  }
  if (typeof value === "number" || typeof value === "bigint" || typeof value === "boolean") {
    return [String(value)];
  }
  if (typeof value === "object") {
    try {
      const serialized = JSON.stringify(value);
      return serialized ? [serialized] : [];
    } catch {
      return [];
    }
  }
  return [];
}

function availabilityValue(value: ProductRow["availability"]) {
  if (typeof value === "boolean") return value ? "Available" : "Unavailable";
  return value?.trim() || "Availability not provided";
}

function isAvailable(value: ProductRow["availability"]) {
  if (typeof value === "boolean") return value;
  if (!value) return false;
  return /^(available|in[\s_-]*stock|limited|true|yes|1)$/i.test(value.trim());
}

function mapProduct(row: ProductRow): CatalogProduct {
  const price = numberOrUndefined(row.discounted_price) ?? numberOrUndefined(row.original_price);
  const stock = isAvailable(row.availability) ? 1 : 0;
  return {
    id: String(row.product_id),
    name: row.title?.trim() || "Untitled product",
    category: row.category?.trim() || "Uncategorized",
    subcategory: row.subcategory?.trim() || undefined,
    price,
    description: row.description?.trim() || "",
    emoji: "🛍️",
    stock,
    imageUrl: row.image_url?.trim() || undefined,
    brand: row.brand?.trim() || undefined,
    originalPrice: numberOrUndefined(row.original_price),
    discountPercentage: numberOrUndefined(row.discount_percentage),
    availability: availabilityValue(row.availability),
    sellerName: row.seller_name?.trim() || undefined,
    colors: listValue(row.colors_available),
    sizes: listValue(row.sizes_available),
    material: row.material?.trim() || undefined,
    codAvailable: typeof row.cod_available === "boolean"
      ? row.cod_available ? "Available" : "Unavailable"
      : row.cod_available?.trim() || undefined,
    returnPolicy: row.return_policy?.trim() || undefined,
    deliveryTime: row.delivery_time?.trim() || undefined,
  };
}

function categorySlug(category: CategoryRow) {
  const source = category.url?.trim();
  if (source) {
    if (!source.includes("/") && !source.includes(":")) return source;
    try {
      const path = new URL(source, "https://category.invalid").pathname;
      const lastSegment = path.split("/").filter(Boolean).at(-1);
      if (lastSegment) return decodeURIComponent(lastSegment);
    } catch {
      // A malformed optional URL falls through to the stable category ID.
    }
  }
  return String(category.category_id);
}

function mapCategory(row: CategoryRow): CatalogCategory {
  return {
    id: String(row.category_id),
    name: row.name,
    slug: categorySlug(row),
    parentCategory: row.parent_category ?? undefined,
    level: numberOrUndefined(row.level) ?? 1,
    productCount: numberOrUndefined(row.product_count),
    imageUrl: row.image_url?.trim() || undefined,
  };
}

function mapSeller(row: SellerRow): CatalogSeller {
  return {
    name: row.name,
    rating: numberOrUndefined(row.rating),
    totalProducts: numberOrUndefined(row.total_products),
    yearsOnPlatform: numberOrUndefined(row.years_on_platform),
    location: row.location?.trim() || undefined,
    verified: row.verified ?? undefined,
    responseTime: row.response_time?.trim() || undefined,
    returnPolicy: row.return_policy?.trim() || undefined,
    codAccepted: row.cod_accepted ?? undefined,
  };
}

export async function listCategories() {
  const { data, error } = await withDatabaseLogging("select", "Categories", () =>
    getSupabase()
      .from("Categories")
      .select(categoryColumns)
      .eq("is_active", true)
      .order("level", { ascending: true })
      .order("name", { ascending: true }),
  );
  if (error) throw new Error(`Unable to load categories (${error.code ?? "database error"}).`);
  return (data as CategoryRow[]).map(mapCategory);
}

async function resolveCategory(slug: string) {
  const categories = await listCategories();
  return categories.find((category) =>
    category.slug.toLocaleLowerCase() === slug.toLocaleLowerCase() ||
    category.id === slug ||
    category.name.toLocaleLowerCase().replace(/\s+/g, "-") === slug.toLocaleLowerCase()
  );
}

function searchTerm(value: string) {
  return value.replace(/[\\%_*(),]/g, " ").replace(/\s+/g, " ").trim();
}

function scalarFilter(value: string | number) {
  return String(value).replace(/[(),\\]/g, "");
}

export async function searchCatalog(input: {
  query: string;
  page: number;
  limit: number;
  category?: string;
  subcategory?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: CatalogSort;
}) {
  const page = Math.max(1, Math.floor(input.page));
  const limit = Math.min(48, Math.max(1, Math.floor(input.limit)));
  const offset = (page - 1) * limit;
  const sort = input.sort ?? "relevance";
  const supabase = getSupabase();
  const categories = await listCategories();
  let category: CatalogCategory | undefined;

  if (input.category) {
    category = categories.find((item) =>
      item.slug.toLocaleLowerCase() === input.category?.toLocaleLowerCase() ||
      item.id === input.category ||
      item.name.toLocaleLowerCase().replace(/\s+/g, "-") === input.category?.toLocaleLowerCase()
    );
    if (!category) {
      return { data: [], total: 0, page, limit, categories, source: "database" as const };
    }
  }

  let query = supabase.from("Products").select(productColumns, { count: "exact" });
  if (category) {
    if (category.level > 1) {
      query = query.eq("subcategory", category.name);
      if (category.parentCategory) {
        const parent = categories.find((item) =>
          item.id === category.parentCategory ||
          item.name === category.parentCategory ||
          item.slug === category.parentCategory
        );
        query = query.eq("category", parent?.name ?? category.parentCategory);
      }
    } else query = query.eq("category", category.name);
  }
  if (input.subcategory) query = query.eq("subcategory", input.subcategory);

  const term = searchTerm(input.query.trim().slice(0, 100));
  if (term) {
    query = query.or([
      `title.ilike.%${term}%`,
      `description.ilike.%${term}%`,
      `brand.ilike.%${term}%`,
      `category.ilike.%${term}%`,
      `subcategory.ilike.%${term}%`,
    ].join(","));
  }
  if (input.minPrice !== undefined) {
    query = query.or(`discounted_price.gte.${input.minPrice},and(discounted_price.is.null,original_price.gte.${input.minPrice})`);
  }
  if (input.maxPrice !== undefined) {
    query = query.or(`discounted_price.lte.${input.maxPrice},and(discounted_price.is.null,original_price.lte.${input.maxPrice})`);
  }

  if (sort === "price-asc") query = query.order("discounted_price", { ascending: true, nullsFirst: false });
  else if (sort === "price-desc") query = query.order("discounted_price", { ascending: false, nullsFirst: false });
  else if (sort === "smart") query = query.order("discount_percentage", { ascending: false, nullsFirst: false });
  else if (term) query = query.order("title", { ascending: true });
  query = query.order("product_id", { ascending: true }).range(offset, offset + limit - 1);

  const { data, error, count } = await withDatabaseLogging("select", "Products", () => query);
  if (error) throw new Error(`Unable to search products (${error.code ?? "database error"}).`);

  const products = (data as ProductRow[]).map(mapProduct);
  let hasVisibleProducts = (count ?? 0) > 0;
  if (!hasVisibleProducts && (input.query || input.category || input.subcategory || input.minPrice !== undefined || input.maxPrice !== undefined)) {
    const { count: visibleCount, error: countError } = await withDatabaseLogging("select", "Products", () =>
      supabase.from("Products").select("product_id", { count: "exact", head: true }),
    );
    if (countError) throw new Error(`Unable to check catalog visibility (${countError.code ?? "database error"}).`);
    hasVisibleProducts = (visibleCount ?? 0) > 0;
  }
  return {
    data: products,
    total: count ?? 0,
    hasVisibleProducts,
    page,
    limit,
    categories,
    source: "database" as const,
  };
}

export async function listHomeCatalog() {
  const supabase = getSupabase();
  const [categories, productsResult, countResult] = await Promise.all([
    listCategories(),
    withDatabaseLogging("select", "Products", () =>
      supabase.from("Products").select(productColumns).order("discount_percentage", { ascending: false, nullsFirst: false }).limit(8)),
    withDatabaseLogging("select", "Products", () =>
      supabase.from("Products").select("product_id", { count: "exact", head: true })),
  ]);
  if (productsResult.error) throw new Error(`Unable to load featured products (${productsResult.error.code ?? "database error"}).`);
  if (countResult.error) throw new Error(`Unable to count products (${countResult.error.code ?? "database error"}).`);
  return {
    categories,
    products: (productsResult.data as ProductRow[]).map(mapProduct),
    totalProducts: countResult.count ?? 0,
  };
}

export async function getCatalogProduct(id: string): Promise<CatalogProduct | undefined> {
  const { data, error } = await withDatabaseLogging("select", "Products", () =>
    getSupabase()
      .from("Products")
      .select(productColumns)
      .eq("product_id", scalarFilter(id))
      .maybeSingle(),
  );
  if (error) throw new Error(`Unable to load product (${error.code ?? "database error"}).`);
  if (!data) return undefined;

  const product = mapProduct(data as ProductRow);
  if (product.sellerName) {
    const { data: seller, error: sellerError } = await withDatabaseLogging("select", "Sellers", () =>
      getSupabase()
        .from("Sellers")
        .select(sellerColumns)
        .eq("name", product.sellerName)
        .limit(1)
        .maybeSingle(),
    );
    if (sellerError) {
      console.error("Seller details are unavailable for this product.", sellerError.code);
    } else if (seller) {
      product.seller = mapSeller(seller as SellerRow);
    }
  }
  return product;
}

export async function getRelatedCatalogProducts(category: string, productId: string, subcategory?: string) {
  let query = getSupabase()
    .from("Products")
    .select(productColumns)
    .eq("category", category)
    .neq("product_id", scalarFilter(productId));
  if (subcategory) query = query.eq("subcategory", subcategory);
  const { data, error } = await withDatabaseLogging("select", "Products", () =>
    query.order("discount_percentage", { ascending: false, nullsFirst: false }).limit(4),
  );
  if (error) throw new Error(`Unable to load related products (${error.code ?? "database error"}).`);
  return (data as ProductRow[]).map(mapProduct);
}

export async function getCategory(slug: string) {
  return resolveCategory(slug);
}