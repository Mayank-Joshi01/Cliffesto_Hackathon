"use client";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { CatalogCategory, CatalogProduct, CatalogSort } from "@/lib/catalog";
import { ProductGrid } from "@/components/products/ProductGrid";
import { EmptyState } from "@/components/feedback/EmptyState";
import { SupabaseCatalogNotice } from "@/components/feedback/SupabaseCatalogNotice";
import { formatPrice } from "@/lib/products";
type ResponseData = {
  data: CatalogProduct[];
  total: number;
  page: number;
  limit: number;
  categories: CatalogCategory[];
  source: "database";
  hasVisibleProducts?: boolean;
  error?: string;
};
type FilterValues = {
  category: string;
  minPrice: string;
  maxPrice: string;
};
const sortOptions: { value: CatalogSort; label: string }[] = [
  { value: "relevance", label: "Relevance" },
  { value: "smart", label: "Smart discovery" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
];
/**
 * The catalog may contain multiple records with the same category slug.
 * A category slug identifies one filter value, so expose that value once.
 * Keep the first record to preserve the label/slug users already see.
 */
function uniqueCategoryOptions(categories: CatalogCategory[]): CatalogCategory[] {
  const seen = new Set<string>();
  return categories.filter((category) => {
    const slug = category.slug.trim().toLocaleLowerCase();
    if (!slug || seen.has(slug)) return false;
    seen.add(slug);
    return true;
  });
}

function FilterForm({
  categories,
  values,
  onApply,
  onClear,
  onClose,
}: {
  categories: CatalogCategory[];
  values: FilterValues;
  onApply: (values: FilterValues) => void;
  onClear: () => void;
  onClose?: () => void;
}) {
  const idPrefix = useId();
  const minPriceId = `${idPrefix}-min-price`;
  const maxPriceId = `${idPrefix}-max-price`;
  const [validationError, setValidationError] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const minPrice = String(form.get("minPrice") ?? "").trim();
    const maxPrice = String(form.get("maxPrice") ?? "").trim();
    if (minPrice && maxPrice && Number(minPrice) > Number(maxPrice)) {
      setValidationError("Minimum price must not exceed maximum price.");
      return;
    }
    setValidationError("");
    onApply({
      category: String(form.get("category") ?? ""),
      minPrice,
      maxPrice,
    });
    onClose?.();
  }
  return (
    <form onSubmit={submit} className="space-y-5">
      <label className="block text-sm font-medium text-slate-800">
        Category
        <select name="category" defaultValue={values.category} className="mt-2 min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800">
          <option value="">All categories</option>
          {uniqueCategoryOptions(categories).map((category) => (
          <option key={category.slug.toLocaleLowerCase()} value={category.slug}>
            {category.name}
          </option>
        ))}
        </select>
      </label>
      <fieldset>
        <legend className="text-sm font-medium text-slate-800">Price range (INR)</legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <label className="sr-only" htmlFor={minPriceId}>Minimum price</label>
          <input id={minPriceId} name="minPrice" type="number" min="0" step="1" inputMode="numeric" placeholder="Min" defaultValue={values.minPrice} className="min-h-11 min-w-0 rounded-md border border-slate-300 px-3 text-sm" />
          <label className="sr-only" htmlFor={maxPriceId}>Maximum price</label>
          <input id={maxPriceId} name="maxPrice" type="number" min="0" step="1" inputMode="numeric" placeholder="Max" defaultValue={values.maxPrice} className="min-h-11 min-w-0 rounded-md border border-slate-300 px-3 text-sm" />
        </div>
      </fieldset>
      {validationError && <p role="alert" className="text-sm font-medium text-red-600">{validationError}</p>}
      <div className="grid grid-cols-2 gap-2 border-t border-slate-200 pt-4">
        <button type="button" onClick={onClear} className="min-h-11 rounded-md border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Clear filters
        </button>
        <button type="submit" className="min-h-11 rounded-md bg-indigo-600 px-3 text-sm font-medium text-white hover:bg-indigo-700">
          Apply filters
        </button>
      </div>
    </form>
  );
}
export function ProductBrowser({
  initialCategorySlug,
  initialSubcategory,
  categoryTitle,
}: {
  initialCategorySlug?: string;
  initialSubcategory?: string;
  categoryTitle?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const queryString = params.toString();
  const query = params.get("q") ?? "";
  const category = params.get("category") ?? initialCategorySlug ?? "";
  const sortParam = params.get("sort");
  const sort = sortOptions.some((option) => option.value === sortParam) ? sortParam as CatalogSort : "relevance";
  const view = params.get("view") === "list" ? "list" : "grid";
  const page = Math.max(1, Number(params.get("page") ?? 1) || 1);
  const requestKey = `${pathname}?${queryString}|${initialCategorySlug ?? ""}|${initialSubcategory ?? ""}`;
  const [result, setResult] = useState<{ key: string; value: ResponseData } | null>(null);
  const [error, setError] = useState<{ key: string; message: string } | null>(null);
  const [searchInput, setSearchInput] = useState(query);
  const [filterOpen, setFilterOpen] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const requestId = useRef(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const currentResult = result?.key === requestKey ? result.value : null;
  const currentError = error?.key === requestKey ? error.message : "";
  const loading = !currentResult && !currentError;
  const categories = currentResult?.categories ?? [];
  useEffect(() => {
    const timer = window.setTimeout(() => setSearchInput(query), 0);
    return () => window.clearTimeout(timer);
  }, [query]);
  useEffect(() => {
    const id = ++requestId.current;
    const apiParams = new URLSearchParams(queryString);
    if (initialCategorySlug && !apiParams.has("category")) apiParams.set("category", initialCategorySlug);
    if (initialSubcategory && !apiParams.has("subcategory")) apiParams.set("subcategory", initialSubcategory);
    apiParams.set("page", String(page));
    apiParams.set("limit", "12");
    const controller = new AbortController();
    fetch(`/api/products?${apiParams}`, { signal: controller.signal })
      .then(async (response) => {
        const body = await response.json() as ResponseData;
        if (!response.ok) throw new Error(body.error ?? "Unable to load products.");
        if (id === requestId.current) {
          setResult({ key: requestKey, value: body });
          setError(null);
        }
      })
      .catch((reason: unknown) => {
        if ((reason as { name?: string }).name !== "AbortError" && id === requestId.current) {
          setError({ key: requestKey, message: "Unable to load products. Please try again." });
        }
      });
    return () => controller.abort();
  }, [initialCategorySlug, initialSubcategory, page, queryString, requestKey, retryCount]);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (filterOpen && !dialog.open) dialog.showModal();
    if (!filterOpen && dialog.open) dialog.close();
  }, [filterOpen]);
  useEffect(() => {
    if (!filterOpen) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setFilterOpen(false);
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [filterOpen]);
  function updateUrl(changes: Record<string, string | null>) {
    const next = new URLSearchParams(queryString);
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === "") next.delete(key);
      else next.set(key, value);
    }
    next.delete("page");
    router.push(`${pathname}${next.size ? `?${next.toString()}` : ""}`);
  }
  function applyFilters(values: FilterValues) {
    updateUrl({
      category: values.category || initialCategorySlug || null,
      minPrice: values.minPrice.trim() || null,
      maxPrice: values.maxPrice.trim() || null,
    });
  }
  function clearFilters() {
    updateUrl({
      category: initialCategorySlug ?? null,
      minPrice: null,
      maxPrice: null,
    });
  }
  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateUrl({ q: searchInput.trim() || null });
  }
  function setSort(value: string) {
    updateUrl({ sort: value === "relevance" ? null : value });
  }
  const filterValues: FilterValues = {
    category,
    minPrice: params.get("minPrice") ?? "",
    maxPrice: params.get("maxPrice") ?? "",
  };
  const totalPages = Math.max(1, Math.ceil((currentResult?.total ?? 0) / (currentResult?.limit ?? 12)));
  const activeFilters = [
    category && { key: "category", label: categories.find((item) => item.slug === category)?.name ?? category },
    params.get("minPrice") && { key: "minPrice", label: `From ${formatPrice(Number(params.get("minPrice")))}` },
    params.get("maxPrice") && { key: "maxPrice", label: `Up to ${formatPrice(Number(params.get("maxPrice")))}` },
  ].filter((item): item is { key: string; label: string } => Boolean(item));
  const filterForm = (
    <FilterForm
      key={`${requestKey}-filter-form`}
      categories={categories}
      values={filterValues}
      onApply={applyFilters}
      onClear={clearFilters}
      onClose={() => setFilterOpen(false)}
    />
  );
  return (
    <section className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-white p-2 sm:p-3">
        <form onSubmit={submitSearch} role="search" className="flex min-h-11 items-center gap-2 rounded-md border border-slate-300 bg-slate-50 px-3 focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-200">
          <span aria-hidden="true" className="text-lg text-slate-500">⌕</span>
          <label htmlFor="listing-search" className="sr-only">Search products</label>
          <input
            id="listing-search"
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder={categoryTitle ? `Search ${categoryTitle}` : "Search products and categories"}
            className="min-w-0 flex-1 border-0 bg-transparent py-2 text-sm text-slate-800 outline-none focus:ring-0"
          />
          {searchInput && (
            <button type="button" onClick={() => { setSearchInput(""); updateUrl({ q: null }); }} aria-label="Clear search" className="inline-flex h-10 w-10 items-center justify-center rounded-full text-xl text-slate-500 hover:bg-slate-200">
              ×
            </button>
          )}
          <button type="submit" className="min-h-10 rounded-md bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-700">
            Search
          </button>
        </form>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div className="min-w-0">
          <p className="product-browser-label text-xs font-medium text-violet-700">
            {query ? "Search results" : categoryTitle ? "Category" : "The collection"}
          </p>
          <h1 className="mt-1 break-words text-slate-950">
            {query ? `Results for “${query}”` : categoryTitle ?? "Discover products"}
          </h1>
          <p className="mt-1 text-sm text-slate-600" aria-live="polite">
            {loading ? "Loading products…" : currentError ? "Results unavailable" : `${currentResult?.total ?? 0} ${currentResult?.total === 1 ? "product" : "products"}`}
          </p>
        </div>
        <label className="hidden min-h-11 items-center gap-2 text-sm text-slate-700 md:flex">
          <span className="hidden sm:inline">Sort by</span>
          <select aria-label="Sort products" value={sort} onChange={(event) => setSort(event.target.value)} className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-800">
            {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <div role="group" aria-label="Product view" className="hidden items-center rounded-md border border-slate-300 p-1 sm:flex">
          <button type="button" aria-pressed={view === "grid"} onClick={() => updateUrl({ view: null })} className={`min-h-9 rounded px-3 text-sm font-medium ${view === "grid" ? "bg-violet-100 text-violet-900" : "text-slate-600 hover:bg-slate-50"}`}>
            Grid
          </button>
          <button type="button" aria-pressed={view === "list"} onClick={() => updateUrl({ view: "list" })} className={`min-h-9 rounded px-3 text-sm font-medium ${view === "list" ? "bg-violet-100 text-violet-900" : "text-slate-600 hover:bg-slate-50"}`}>
            List
          </button>
        </div>
      </div>
      {sort === "smart" && (
        <p className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-900">
          Smart discovery prioritizes products with the largest listed discount.
        </p>
      )}
      <div className="sticky top-0 z-20 -mx-3 flex items-center gap-2 border-y border-slate-200 bg-[var(--page-bg)] px-3 py-2 sm:-mx-5 sm:px-5 lg:hidden">
        <button type="button" onClick={() => setFilterOpen(true)} className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 hover:bg-slate-50">
          <span aria-hidden="true">☷</span>
          Filters
          {activeFilters.length > 0 && <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs text-violet-800">{activeFilters.length}</span>}
        </button>
        <label className="sr-only" htmlFor="mobile-sort">Sort products</label>
        <select id="mobile-sort" aria-label="Sort products" value={sort} onChange={(event) => setSort(event.target.value)} className="min-h-11 min-w-0 max-w-[37%] flex-1 rounded-xl border border-slate-300 bg-white px-2 text-xs text-slate-800">
          {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <span className="hidden whitespace-nowrap text-xs text-slate-600 sm:inline">{currentResult?.total ?? 0} results</span>
      </div>
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2" aria-label="Active filters">
          {activeFilters.map((filter) => (
            <button key={filter.key} type="button" onClick={() => updateUrl({ [filter.key]: null })} className="inline-flex min-h-9 items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 text-xs font-semibold text-violet-800 hover:bg-violet-100">
              {filter.label}<span aria-hidden="true">×</span><span className="sr-only">Remove filter</span>
            </button>
          ))}
          <button type="button" onClick={clearFilters} className="min-h-9 px-2 text-xs font-semibold text-violet-700 underline underline-offset-2">Clear all</button>
        </div>
      )}
      <div className="grid items-start gap-7 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="sticky top-4 hidden rounded-lg border border-slate-200 bg-white p-4 lg:block">
          <h2 className="mb-4 text-base font-medium text-slate-900">Filter products</h2>
          {filterForm}
        </aside>
        <div className="min-w-0">
          {currentError ? (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-8 text-center text-red-700">
              <p>{currentError}</p>
              <button type="button" onClick={() => { setError(null); setRetryCount((count) => count + 1); }} className="mt-4 min-h-11 rounded-xl bg-red-600 px-4 font-semibold text-white">Retry</button>
            </div>
          ) : loading ? (
            <div className="grid min-w-0 grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4" aria-label="Loading products">
              {Array.from({ length: 8 }, (_, index) => <div key={index} className="aspect-[3/4] animate-pulse rounded-lg border border-slate-200 bg-slate-100" />)}
            </div>
          ) : currentResult?.data.length ? (
            <ProductGrid products={currentResult.data} variant={view === "list" ? "list" : query ? "search" : "grid"} />
          ) : currentResult?.hasVisibleProducts === false ? (
            <SupabaseCatalogNotice />
          ) : (
            <EmptyState title="No products found">
              Try changing your search or filters.
              {query && <button type="button" onClick={() => { setSearchInput(""); updateUrl({ q: null }); }} className="mt-4 block w-full font-semibold text-violet-700 underline underline-offset-2">Clear search</button>}
            </EmptyState>
          )}
          {!loading && !currentError && totalPages > 1 && (
            <nav className="mt-8 flex flex-wrap items-center justify-center gap-3" aria-label="Product pagination">
              <button type="button" disabled={page <= 1} onClick={() => { const next = new URLSearchParams(queryString); next.set("page", String(page - 1)); router.push(`${pathname}?${next.toString()}`); }} className="min-h-11 rounded-xl border border-slate-300 px-4 font-semibold disabled:cursor-not-allowed disabled:opacity-40">Previous</button>
              <span className="px-2 text-sm text-slate-600">Page {page} of {totalPages}</span>
              <button type="button" disabled={page >= totalPages} onClick={() => { const next = new URLSearchParams(queryString); next.set("page", String(page + 1)); router.push(`${pathname}?${next.toString()}`); }} className="min-h-11 rounded-xl border border-slate-300 px-4 font-semibold disabled:cursor-not-allowed disabled:opacity-40">Next</button>
            </nav>
          )}
        </div>
      </div>
      <dialog
        ref={dialogRef}
        aria-label="Product filters"
        className="filter-sheet fixed inset-x-0 bottom-0 top-auto m-0 max-h-[85vh] w-full max-w-none overflow-y-auto rounded-t-xl border border-slate-200 bg-white p-4 text-slate-900 shadow-xl backdrop:bg-black/40 sm:p-5 lg:hidden"
        onClose={() => setFilterOpen(false)}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-medium">Filter products</h2>
          <button type="button" onClick={() => setFilterOpen(false)} aria-label="Close filters" className="inline-flex h-11 w-11 items-center justify-center rounded-md text-xl hover:bg-slate-100">×</button>
        </div>
        {filterForm}
      </dialog>
    </section>
  );
}
