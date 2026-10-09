import Link from "next/link";

export function SupabaseCatalogNotice() {
  return (
    <div role="status" className="rounded-2xl border border-amber-300 bg-amber-50 p-6 text-left text-amber-950">
      <h2 className="font-bold">No products are visible to this app</h2>
      <p className="mt-2 text-sm leading-6">
        The database may be empty, this may be the wrong Supabase project, or its
        public <code>anon</code> role may not have a SELECT grant and matching
        Row Level Security policy. Check the project URL and the read permissions
        for <code>Products</code> before changing any data or schema.
      </p>
      {process.env.NODE_ENV === "development" && (
        <Link
          href="/api/dev/database"
          className="mt-4 inline-flex min-h-10 items-center rounded-lg border border-amber-400 bg-white px-4 text-sm font-semibold text-amber-950 underline underline-offset-2"
        >
          Run read-only Supabase diagnostics
        </Link>
      )}
    </div>
  );
}
