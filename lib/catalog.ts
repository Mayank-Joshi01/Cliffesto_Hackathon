import { query } from "@/lib/db";
import { products as mockProducts, type Product } from "@/lib/products";

export type CatalogProduct = Product & { imageUrl?: string; categorySlug?: string };
export type CatalogCategory = { name: string; slug: string };
export type CatalogSort = "relevance" | "smart" | "price-asc" | "price-desc" | "newest";

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  category: string;
  category_slug: string | null;
  description: string;
  price: string;
  stock: number;
  image_url: string | null;
};

const selectProducts = `
  SELECT p.id, p.slug, p.name, COALESCE(c.name, 'Uncategorized') AS category, c.slug AS category_slug,
         p.description, p.price::text, p.stock, pi.url AS image_url
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
  LEFT JOIN LATERAL (
    SELECT url FROM product_images WHERE product_id = p.id ORDER BY sort_order, id LIMIT 1
  ) pi ON true
  WHERE p.is_active = true
`;

function mapProduct(row: ProductRow): CatalogProduct {
  return {
    id: row.slug,
    name: row.name,
    category: row.category,
    categorySlug: row.category_slug ?? row.category.toLowerCase().replace(/\s+/g, "-"),
    description: row.description,
    price: Number(row.price),
    stock: row.stock,
    emoji: "🛍️",
    imageUrl: row.image_url ?? undefined,
  };
}

function canUseDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (character) => `\\${character}`);
}

export async function listCatalog() {
  if (!canUseDatabase()) return mockProducts;
  try {
    const result = await query<ProductRow>(`${selectProducts} ORDER BY p.created_at DESC, p.name ASC`);
    return result.rows.map(mapProduct);
  } catch (error) {
    console.error("Catalog database read failed; using demo catalog.", error);
    return mockProducts;
  }
}

export async function searchCatalog(input: {
  query: string;
  page: number;
  limit: number;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sort?: CatalogSort;
}) {
  const q = input.query.trim().slice(0, 100);
  const offset = (input.page - 1) * input.limit;
  const sort = input.sort ?? "relevance";
  if (!canUseDatabase()) {
    const normalized = q.toLowerCase();
    const filtered = mockProducts.filter((product) =>
      (!normalized || [product.name, product.category, product.description].some((value) => value.toLowerCase().includes(normalized))) &&
      (!input.category || product.category.toLowerCase().replace(/\s+/g, "-") === input.category) &&
      (input.minPrice === undefined || product.price >= input.minPrice) &&
      (input.maxPrice === undefined || product.price <= input.maxPrice) &&
      (input.inStock !== true || product.stock > 0)
    );
    if (sort === "relevance" && normalized) {
      const score = (product: Product) => {
        const name = product.name.toLowerCase();
        const category = product.category.toLowerCase();
        if (name === normalized) return 100;
        if (name.startsWith(normalized)) return 80;
        if (name.includes(normalized)) return 60;
        if (category.includes(normalized)) return 40;
        return 20;
      };
      filtered.sort((a, b) => score(b) - score(a));
    }
    if (sort === "price-asc") filtered.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") filtered.sort((a, b) => b.price - a.price);
    if (sort === "smart") filtered.sort((a, b) => Number(b.stock > 0) - Number(a.stock > 0) || a.price - b.price);
    const categories = [...new Set(mockProducts.map((product) => product.category))]
      .map((name) => ({ name, slug: name.toLowerCase().replace(/\s+/g, "-") }))
      .sort((a, b) => a.name.localeCompare(b.name));
    return {
      data: filtered.slice(offset, offset + input.limit),
      total: filtered.length,
      page: input.page,
      limit: input.limit,
      categories,
      source: "mock" as const,
    };
  }

  const values: unknown[] = [];
  const conditions = ["p.is_active = true"];
  if (q) {
    values.push(escapeLike(q));
    conditions.push(`(
      p.name ILIKE '%' || $${values.length} || '%' ESCAPE '\\' OR
      p.description ILIKE '%' || $${values.length} || '%' ESCAPE '\\' OR
      c.name ILIKE '%' || $${values.length} || '%' ESCAPE '\\'
    )`);
  }
  if (input.category) {
    values.push(input.category);
    conditions.push(`c.slug = $${values.length}`);
  }
  if (input.minPrice !== undefined) {
    values.push(input.minPrice);
    conditions.push(`p.price >= $${values.length}`);
  }
  if (input.maxPrice !== undefined) {
    values.push(input.maxPrice);
    conditions.push(`p.price <= $${values.length}`);
  }
  if (input.inStock) conditions.push("p.stock > 0");
  const where = ` WHERE ${conditions.join(" AND ")}`;
  const searchRank = q && sort === "relevance" ? `CASE
    WHEN lower(p.name) = lower($1) THEN 100
    WHEN lower(p.name) LIKE lower($1) || '%' ESCAPE '\\' THEN 80
    WHEN lower(p.name) ILIKE '%' || $1 || '%' ESCAPE '\\' THEN 60
    WHEN c.name ILIKE '%' || $1 || '%' ESCAPE '\\' THEN 40
    WHEN p.description ILIKE '%' || $1 || '%' ESCAPE '\\' THEN 20
    ELSE 10
  END` : "";
  const pageValues = [...values, input.limit, offset];
  const orderBy = sort === "price-asc"
    ? "p.price ASC, p.name ASC, "
    : sort === "price-desc"
      ? "p.price DESC, p.name ASC, "
      : sort === "smart"
        ? "CASE WHEN p.stock > 0 THEN 0 ELSE 1 END ASC, p.price ASC, "
        : sort === "newest"
          ? "p.created_at DESC, "
          : searchRank
            ? `${searchRank} DESC, `
            : "p.created_at DESC, ";
  const [countResult, categoriesResult, result] = await Promise.all([
    query<{ count: string }>(`SELECT count(*)::text AS count FROM products p LEFT JOIN categories c ON c.id = p.category_id${where}`, values),
    query<CatalogCategory>(`
      SELECT DISTINCT c.name, c.slug
      FROM categories c
      INNER JOIN products p ON p.category_id = c.id
      WHERE p.is_active = true
      ORDER BY c.name ASC
    `),
    query<ProductRow>(`${selectProducts.replace("WHERE p.is_active = true", "")}${where} ORDER BY ${orderBy}p.created_at DESC, p.name ASC LIMIT $${pageValues.length - 1} OFFSET $${pageValues.length}`, pageValues),
  ]);
  return {
    data: result.rows.map(mapProduct),
    total: Number(countResult.rows[0]?.count ?? 0),
    page: input.page,
    limit: input.limit,
    categories: categoriesResult.rows,
    source: "database" as const,
  };
}

export async function getCatalogProduct(slug: string): Promise<CatalogProduct | undefined> {
  if (!canUseDatabase()) return mockProducts.find((product) => product.id === slug);
  try {
    const result = await query<ProductRow>(`${selectProducts} AND p.slug = $1 LIMIT 1`, [slug]);
    return result.rows[0] ? mapProduct(result.rows[0]) : mockProducts.find((product) => product.id === slug);
  } catch (error) {
    console.error("Catalog product read failed; using demo catalog.", error);
    return mockProducts.find((product) => product.id === slug);
  }
}

export async function getRelatedCatalogProducts(category: string, productId: string) {
  if (!canUseDatabase()) {
    return mockProducts.filter((product) => product.category === category && product.id !== productId).slice(0, 4);
  }
  try {
    const result = await query<ProductRow>(
      `${selectProducts} AND c.name = $1 AND p.slug <> $2 ORDER BY p.created_at DESC, p.name ASC LIMIT 4`,
      [category, productId],
    );
    return result.rows.map(mapProduct);
  } catch (error) {
    console.error("Related catalog products read failed; using demo catalog.", error);
    return mockProducts.filter((product) => product.category === category && product.id !== productId).slice(0, 4);
  }
}
