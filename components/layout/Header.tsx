"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  LoaderCircle,
  Search,
  ShoppingBag,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState, type FocusEvent, type FormEvent, type KeyboardEvent } from "react";
import { useRecentSearches } from "@/hooks/useRecentSearches";
import type { CatalogCategory, CatalogProduct } from "@/lib/catalog";
import { formatPrice } from "@/lib/products";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

type SearchResponse = {
  data?: CatalogProduct[];
  categories?: CatalogCategory[];
  error?: string;
};

type Suggestion = {
  id: string;
  label: string;
  detail: string;
  href: string;
  imageUrl?: string;
  emoji?: string;
  price?: number;
};

const MAX_PRODUCT_SUGGESTIONS = 5;
const MAX_CATEGORY_SUGGESTIONS = 3;

export function Header() {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/signup";
  const router = useRouter();
  const listboxId = useId();
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const requestId = useRef(0);
  const { searches, add, remove, clear } = useRecentSearches();

  const query = input.trim().replace(/\s+/g, " ");
  const categorySuggestions = useMemo(
    () => categories
      .filter((category) => category.name.toLowerCase().includes(query.toLowerCase()))
      .slice(0, MAX_CATEGORY_SUGGESTIONS),
    [categories, query],
  );
  const suggestions: Suggestion[] = [
    ...products.map((product) => ({
      id: `product-${product.id}`,
      label: product.name,
      detail: product.category,
      href: `/products/${encodeURIComponent(product.id)}`,
      imageUrl: product.imageUrl,
      emoji: product.emoji,
      price: product.price,
    })),
    ...categorySuggestions.map((category) => ({
      id: `category-${category.slug}`,
      label: category.name,
      detail: "Category",
      href: `/categories/${encodeURIComponent(category.slug)}`,
    })),
  ];

  useEffect(() => {
    const syncFromUrl = () => {
      setInput(new URLSearchParams(window.location.search).get("q") ?? "");
    };
    const timer = window.setTimeout(syncFromUrl, 0);
    window.addEventListener("popstate", syncFromUrl);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("popstate", syncFromUrl);
    };
  }, [pathname]);

  useEffect(() => {
    function closeOnOutside(event: PointerEvent) {
      if (!searchRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", closeOnOutside);
    return () => document.removeEventListener("pointerdown", closeOnOutside);
  }, []);

  useEffect(() => {
    const id = ++requestId.current;
    if (isAuthPage || !open || query.length < 1) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setSearchError("");
      try {
        const params = new URLSearchParams({ q: query, limit: String(MAX_PRODUCT_SUGGESTIONS) });
        const response = await fetch(`/api/products/search?${params}`, { signal: controller.signal });
        const result = await response.json() as SearchResponse;
        if (!response.ok) throw new Error(result.error ?? "Search is temporarily unavailable.");
        if (id === requestId.current) {
          setProducts(result.data ?? []);
          setCategories(result.categories ?? []);
          setActiveIndex(-1);
        }
      } catch (error) {
        if ((error as { name?: string }).name === "AbortError") return;
        if (id === requestId.current) {
          setProducts([]);
          setCategories([]);
          setSearchError("Suggestions are temporarily unavailable. You can still view all results.");
        }
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [isAuthPage, open, query]);

  function submitSearch(value: string) {
    const normalized = value.trim().replace(/\s+/g, " ");
    add(normalized);
    setOpen(false);
    setActiveIndex(-1);
    router.push(normalized ? `/search?q=${encodeURIComponent(normalized)}` : "/search");
  }

  function chooseSuggestion(suggestion: Suggestion) {
    if (suggestion.id.startsWith("product-")) add(suggestion.label);
    else add(query);
    setOpen(false);
    setActiveIndex(-1);
    router.push(suggestion.href);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (activeIndex >= 0 && suggestions[activeIndex]) {
      chooseSuggestion(suggestions[activeIndex]);
      return;
    }
    submitSearch(input);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    } else if (event.key === "ArrowDown" && open && suggestions.length > 0) {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % suggestions.length);
    } else if (event.key === "ArrowUp" && open && suggestions.length > 0) {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
    } else if (event.key === "Home" && open && suggestions.length > 0) {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === "End" && open && suggestions.length > 0) {
      event.preventDefault();
      setActiveIndex(suggestions.length - 1);
    }
  }

  function handleFocusOut(event: FocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  const showRecent = open && !query && searches.length > 0;
  const showSuggestions = open && Boolean(query);

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="site-logo" aria-label="Cliffesto home">
          cliffesto<span>.</span>
        </Link>

        {!isAuthPage && (
          <div ref={searchRef} className="site-search" onBlur={handleFocusOut}>
            <form role="search" onSubmit={onSubmit} className="site-search-form">
              <label htmlFor="navbar-search" className="sr-only">Search products and categories</label>
              <Search size={19} aria-hidden="true" className="site-search-icon" />
              <input
                id="navbar-search"
                type="search"
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={open}
                aria-controls={listboxId}
                aria-activedescendant={activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined}
                value={input}
                onFocus={() => setOpen(true)}
                onChange={(event) => {
                  setInput(event.target.value);
                  setOpen(true);
                  setActiveIndex(-1);
                  setProducts([]);
                  setCategories([]);
                  setLoading(Boolean(event.target.value.trim()));
                  setSearchError("");
                }}
                onKeyDown={onKeyDown}
                placeholder="Search products, brands, and categories..."
                autoComplete="off"
              />
              {input && (
                <button
                  type="button"
                  onClick={() => {
                    setInput("");
                    setProducts([]);
                    setCategories([]);
                    setLoading(false);
                    setSearchError("");
                    setActiveIndex(-1);
                    setOpen(true);
                    document.getElementById("navbar-search")?.focus();
                  }}
                  className="site-search-clear"
                  aria-label="Clear search"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              )}
              <button type="submit" className="site-search-submit">
                Search
              </button>
            </form>

            {open && (
              <div className="site-search-dropdown">
                {showRecent && (
                  <section aria-label="Recent searches" className="site-search-recent">
                    <div className="site-search-section-heading">
                      <h2>Recent searches</h2>
                      <button type="button" onClick={clear}>Clear history</button>
                    </div>
                    <ul>
                      {searches.map((search) => (
                        <li key={search}>
                          <button type="button" onClick={() => submitSearch(search)}>
                            <Search size={15} aria-hidden="true" />
                            <span>{search}</span>
                            <span className="sr-only">Search again</span>
                          </button>
                          <button type="button" onClick={() => remove(search)} aria-label={`Remove ${search} from recent searches`}>
                            <X size={15} aria-hidden="true" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {showSuggestions && (
                  <div id={listboxId} role="listbox" aria-label="Search suggestions" aria-busy={loading}>
                    {loading && (
                      <p className="site-search-status" role="status">
                        <LoaderCircle size={16} aria-hidden="true" /> Searching the catalog…
                      </p>
                    )}
                    {!loading && searchError && <p className="site-search-status" role="status">{searchError}</p>}
                    {!loading && !searchError && suggestions.length === 0 && (
                      <p className="site-search-status" role="status">No matching products or categories found.</p>
                    )}
                    {!loading && suggestions.length > 0 && (
                      <ul className="site-search-suggestions">
                        {suggestions.map((suggestion, index) => (
                          <li key={suggestion.id}>
                            <Link
                              id={`${listboxId}-option-${index}`}
                              href={suggestion.href}
                              role="option"
                              aria-selected={activeIndex === index}
                              className={`site-search-option ${activeIndex === index ? "is-active" : ""}`}
                              onClick={(event) => {
                                event.preventDefault();
                                chooseSuggestion(suggestion);
                              }}
                            >
                              <span className="site-search-thumb">
                                {suggestion.imageUrl
                                  ? <Image src={suggestion.imageUrl} alt="" fill sizes="44px" className="object-cover" />
                                  : suggestion.emoji
                                    ? <span aria-hidden="true">{suggestion.emoji}</span>
                                    : <ShoppingBag size={18} aria-hidden="true" />}
                              </span>
                              <span className="site-search-option-copy">
                                <strong>{suggestion.label}</strong>
                                <small>{suggestion.detail}</small>
                              </span>
                              {suggestion.price !== undefined && <span className="site-search-price">{formatPrice(suggestion.price)}</span>}
                              {activeIndex === index && <Check size={16} aria-hidden="true" className="site-search-selected" />}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                    <button type="button" className="site-search-view-all" onClick={() => submitSearch(input)}>
                      View all results for “{query}” <ArrowRight size={16} aria-hidden="true" />
                    </button>
                  </div>
                )}

                {!query && !showRecent && (
                  <p className="site-search-status">Search the Cliffesto catalog by product or category.</p>
                )}
              </div>
            )}
          </div>
        )}

        <nav className="site-header-nav" aria-label="Main navigation">
          <ThemeToggle />
          {!isAuthPage && (
            <>
              <Link href="/products" className="site-header-link">Products</Link>
              <Link href="/account" aria-label="Account" className="site-header-icon-link">
                <UserRound size={20} aria-hidden="true" /><span className="sr-only">Account</span>
              </Link>
              <Link href="/cart" aria-label="Shopping cart" className="site-header-icon-link">
                <ShoppingBag size={20} aria-hidden="true" /><span className="sr-only">Shopping cart</span>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
