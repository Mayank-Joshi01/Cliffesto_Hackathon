import { NextResponse } from "next/server";
import { searchCatalog } from "@/lib/catalog";
import { withApiLogging } from "@/lib/observability";
export async function GET(request: Request) {
  return withApiLogging(request, "products.list", async () => {
  const url = new URL(request.url);
  const page = Math.max(1, Math.floor(Number(url.searchParams.get("page") ?? 1) || 1));
  const limit = Math.min(48, Math.max(1, Math.floor(Number(url.searchParams.get("limit") ?? 12) || 12)));
  const rawMinPrice = url.searchParams.get("minPrice");
  const rawMaxPrice = url.searchParams.get("maxPrice");
  const minPrice = rawMinPrice === null || rawMinPrice === "" ? undefined : Number(rawMinPrice);
  const maxPrice = rawMaxPrice === null || rawMaxPrice === "" ? undefined : Number(rawMaxPrice);
  if ((minPrice !== undefined && (!Number.isFinite(minPrice) || minPrice < 0)) ||
    (maxPrice !== undefined && (!Number.isFinite(maxPrice) || maxPrice < 0)) ||
    (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice)) {
    return NextResponse.json({ error: "Price range is invalid." }, { status: 400 });
  }
  const requestedSort = url.searchParams.get("sort");
  const sort = requestedSort === "smart" || requestedSort === "price-asc" || requestedSort === "price-desc"
    ? requestedSort
    : "relevance";
  try {
    const result = await searchCatalog({
      query: url.searchParams.get("q") ?? "",
      page,
      limit,
      category: url.searchParams.get("category") ?? undefined,
      subcategory: url.searchParams.get("subcategory") ?? undefined,
      minPrice,
      maxPrice,
      sort,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Product catalog API error", error);
    return NextResponse.json({ error: "Unable to load products." }, { status: 500 });
  }
  });
}
