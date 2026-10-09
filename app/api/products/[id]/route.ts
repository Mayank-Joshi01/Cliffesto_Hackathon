import { NextResponse } from "next/server";
import { getCatalogProduct } from "@/lib/catalog";
import { withApiLogging } from "@/lib/observability";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withApiLogging(_request, "products.detail", async () => {
    try {
      const product = await getCatalogProduct((await params).id);
      return product
        ? NextResponse.json({ data: product, source: "database" })
        : NextResponse.json({ error: "Product not found." }, { status: 404 });
    } catch (error) {
      console.error("Product detail API error", error);
      return NextResponse.json({ error: "Unable to load product." }, { status: 500 });
    }
  });
}
