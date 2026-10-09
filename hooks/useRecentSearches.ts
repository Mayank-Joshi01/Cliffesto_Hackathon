"use client";

import { useCallback, useEffect, useState } from "react";

const KEY = "cliffesto_recent_searches";
const MAX = 8;

export function useRecentSearches() {
  const [searches, setSearches] = useState<string[]>([]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const stored = JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
        if (Array.isArray(stored)) setSearches(stored.filter((item): item is string => typeof item === "string").slice(0, MAX));
      } catch {
        setSearches([]);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  const persist = useCallback((next: string[]) => {
    setSearches(next);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch (error) {
      console.error("Unable to save recent searches.", error);
    }
  }, []);
  const add = useCallback((value: string) => {
    const normalized = value.trim().replace(/\s+/g, " ");
    if (!normalized) return;
    persist([normalized, ...searches.filter((item) => item.toLowerCase() !== normalized.toLowerCase())].slice(0, MAX));
  }, [persist, searches]);
  const remove = useCallback((value: string) => persist(searches.filter((item) => item !== value)), [persist, searches]);
  const clear = useCallback(() => persist([]), [persist]);
  return { searches, add, remove, clear };
}
