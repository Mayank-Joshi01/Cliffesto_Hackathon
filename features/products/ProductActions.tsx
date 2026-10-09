"use client";
import { useState } from "react";
import type { Product } from "@/lib/products";

export function ProductActions({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  async function addToCart() {
    setSaving(true);
    setStatus("");
    try {
      const response = await fetch("/api/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: product.id, count: quantity }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Unable to add this product to your cart.");
      setStatus(`Added ${quantity} to cart.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to add this product to your cart.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-8 flex flex-wrap items-center gap-3">
      <label className="sr-only" htmlFor="quantity">Quantity</label>
      <input id="quantity" type="number" min={1} max={product.stock} value={quantity}
        onChange={(event) => setQuantity(Math.max(1, Math.min(product.stock, Number(event.target.value) || 1)))}
        className="w-20 rounded-xl border border-slate-300 px-3 py-3" disabled={!product.stock || saving} />
      <button disabled={!product.stock || saving} onClick={addToCart}
        className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
        {saving ? "Adding…" : "Add to cart"}
      </button>
      {status && <p role="status" className="w-full text-sm text-slate-600">{status}</p>}
    </div>
  );
}
