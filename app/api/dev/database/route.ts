import { NextResponse } from "next/server";
import { sanitizeErrorMessage, withApiLogging, withDatabaseLogging } from "@/lib/observability";
import { getSupabase } from "@/lib/supabase";

export async function GET(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  return withApiLogging(request, "dev.database-check", async () => {
    const configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const configuredKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!configuredUrl || !configuredKey) {
      return NextResponse.json({
        configured: false,
        connected: false,
        error: "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
      }, { status: 503 });
    }

    let projectHost: string;
    try {
      const parsedUrl = new URL(configuredUrl);
      if (parsedUrl.protocol !== "https:" || !parsedUrl.hostname.endsWith(".supabase.co")) {
        return NextResponse.json({
          configured: true,
          connected: false,
          error: "The configured URL is not a standard HTTPS Supabase project URL.",
        }, { status: 503 });
      }
      projectHost = parsedUrl.hostname;
    } catch {
      return NextResponse.json({
        configured: true,
        connected: false,
        error: "NEXT_PUBLIC_SUPABASE_URL is not a valid URL.",
      }, { status: 503 });
    }

    const startedAt = Date.now();
    try {
      const supabase = getSupabase();
      const [products, categories, sellers] = await Promise.all([
        withDatabaseLogging("select", "Products", () =>
          supabase.from("Products").select("product_id,title", { count: "exact" }).limit(3)),
        withDatabaseLogging("select", "Categories", () =>
          supabase.from("Categories").select("category_id", { count: "exact" }).eq("is_active", true).limit(1)),
        withDatabaseLogging("select", "Sellers", () =>
          supabase.from("Sellers").select("seller_id", { count: "exact" }).limit(1)),
      ]);
      const durationMs = Date.now() - startedAt;
      const failedTable = products.error
        ? { table: "Products", error: products.error }
        : categories.error
          ? { table: "Categories", error: categories.error }
          : sellers.error
            ? { table: "Sellers", error: sellers.error }
            : null;

      if (failedTable) {
        const { error, table } = failedTable;
        const code = error.code ?? "unknown";
        const cause = code === "42501" || code.startsWith("PGRST3")
          ? "permission-or-rls"
          : code === "42P01" || code === "42703" || code.startsWith("PGRST2")
            ? "table-or-column"
            : "query-error";
        return NextResponse.json({
          configured: true,
          connected: false,
          projectHost,
          failedTable: table,
          durationMs,
          cause,
          error: { code, message: sanitizeErrorMessage(error.message) },
        }, { status: 503 });
      }

      const productCount = products.count ?? 0;
      const categoryCount = categories.count ?? 0;
      const sellerCount = sellers.count ?? 0;
      const visibleData = productCount > 0 || categoryCount > 0 || sellerCount > 0;
      return NextResponse.json({
        configured: true,
        connected: true,
        projectHost,
        tablesAccessible: true,
        visibleData,
        visibleCounts: {
          products: productCount,
          activeCategories: categoryCount,
          sellers: sellerCount,
        },
        durationMs,
        visibility: visibleData
          ? "Read-only queries succeeded. Counts include only records visible to the publishable key."
          : "All three reads succeeded but no rows are visible. Confirm this project contains the expected data and review SELECT grants and RLS policies for the anon role.",
        httpStatus: products.status,
      });
    } catch (error) {
      const message = sanitizeErrorMessage(error instanceof Error ? error.message : "Unknown connection error");
      return NextResponse.json({
        configured: true,
        connected: false,
        projectHost,
        durationMs: Date.now() - startedAt,
        cause: "request-failed",
        error: { message },
      }, { status: 503 });
    }
  });
}
