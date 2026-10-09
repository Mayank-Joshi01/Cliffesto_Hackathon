"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Check,
  Minus,
  Plus,
  ShoppingBag,
  Tag,
  Trash2,
} from "lucide-react";
import { formatPrice } from "@/lib/products";

type CartItem = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  originalPrice: number;
  size: string;
  sizes: string[];
  quantity: number;
  seller: string;
};

const initialItems: CartItem[] = [
  {
    id: "linen-shirt",
    name: "Relaxed Fit Linen Shirt",
    description: "Breathable linen blend · Full sleeves",
    imageUrl:
      "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=480&q=85",
    price: 1199,
    originalPrice: 1999,
    size: "M",
    sizes: ["S", "M", "L", "XL"],
    quantity: 1,
    seller: "The Everyday Edit",
  },
  {
    id: "sneakers",
    name: "Classic Low-Top Sneakers",
    description: "Canvas upper · Cushioned sole",
    imageUrl:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=480&q=85",
    price: 2199,
    originalPrice: 3499,
    size: "UK 8",
    sizes: ["UK 6", "UK 7", "UK 8", "UK 9", "UK 10"],
    quantity: 1,
    seller: "Northstar Footwear",
  },
  {
    id: "crossbody-bag",
    name: "Everyday Mini Crossbody",
    description: "Structured vegan leather · Adjustable strap",
    imageUrl:
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=480&q=85",
    price: 1499,
    originalPrice: 2499,
    size: "One size",
    sizes: ["One size"],
    quantity: 1,
    seller: "Forma Accessories",
  },
];

type EditingSize = { id: string; value: string } | null;

export default function CartPage() {
  const [items, setItems] = useState(initialItems);
  const [editingSize, setEditingSize] = useState<EditingSize>(null);

  const totals = useMemo(() => {
    const itemCount = items.reduce(
      (count, item) => count + item.quantity,
      0,
    );

    const productTotal = items.reduce(
      (total, item) => total + item.originalPrice * item.quantity,
      0,
    );

    const discountTotal = items.reduce(
      (total, item) =>
        total + (item.originalPrice - item.price) * item.quantity,
      0,
    );

    return {
      itemCount,
      productTotal,
      discountTotal,
      orderTotal: productTotal - discountTotal,
    };
  }, [items]);

  function changeQuantity(id: string, amount: number) {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: Math.min(
                5,
                Math.max(1, item.quantity + amount),
              ),
            }
          : item,
      ),
    );
  }

  function removeItem(id: string) {
    setItems((current) => current.filter((item) => item.id !== id));

    if (editingSize?.id === id) {
      setEditingSize(null);
    }
  }

  function saveSize() {
    if (!editingSize) return;

    setItems((current) =>
      current.map((item) =>
        item.id === editingSize.id
          ? { ...item, size: editingSize.value }
          : item,
      ),
    );

    setEditingSize(null);
  }

  return (
    <main className="min-h-screen bg-[var(--page-bg)] px-3 py-5 text-slate-900 sm:px-5 sm:py-8 lg:py-10">
      <div className="mx-auto w-full max-w-7xl">
        {/* Header */}
        <header className="mb-5 sm:mb-8">
          <p className="text-xs font-medium text-indigo-600 sm:text-sm">
            Cliffesto Store
          </p>

          <div className="mt-2 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-slate-900">
                Shopping Cart
              </h1>

              <p className="mt-1 text-xs text-slate-500 sm:mt-2 sm:text-sm">
                Review your items before placing your order.
              </p>
            </div>

            <span className="shrink-0 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 sm:px-4 sm:text-sm">
              {totals.itemCount}{" "}
              {totals.itemCount === 1 ? "item" : "items"}
            </span>
          </div>
        </header>

        {/* Empty cart */}
        {items.length === 0 ? (
          <section className="rounded-lg border border-slate-200 bg-white px-5 py-10 text-center sm:px-6 sm:py-12">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 sm:h-16 sm:w-16">
              <ShoppingBag className="h-7 w-7 sm:h-8 sm:w-8" />
            </div>

            <h2 className="mt-4 text-lg font-semibold sm:mt-5 sm:text-xl">
              Your cart is empty
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Looks like you haven&apos;t found your next favorite yet.
            </p>

            <Link
              href="/products"
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md bg-indigo-600 px-5 text-sm font-medium text-white transition hover:bg-indigo-700 sm:mt-6"
            >
              Explore products
            </Link>
          </section>
        ) : (
          <div className="grid min-w-0 grid-cols-1 items-start gap-4 md:gap-6 lg:grid-cols-[minmax(0,1fr)_350px] lg:gap-8">
            {/* Product details */}
            <section
              aria-labelledby="product-details-heading"
              className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white"
            >
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-6 sm:py-5 lg:px-7">
                <h2
                  id="product-details-heading"
                  className="text-base font-semibold sm:text-lg"
                >
                  Product Details
                </h2>

                <span className="shrink-0 text-xs text-slate-500 sm:text-sm">
                  {items.length}{" "}
                  {items.length === 1 ? "product" : "products"}
                </span>
              </div>

              <ul className="divide-y divide-slate-100 px-4 sm:px-6 lg:px-7">
                {items.map((item) => {
                  const discount = Math.round(
                    ((item.originalPrice - item.price) /
                      item.originalPrice) *
                      100,
                  );

                  const isEditing = editingSize?.id === item.id;

                  return (
                    <li key={item.id} className="py-5 sm:py-6">
                      <div className="flex min-w-0 gap-3 sm:gap-5">
                        {/* Product image */}
                        <div className="relative aspect-square h-24 w-24 shrink-0 overflow-hidden rounded-md bg-slate-100 sm:h-32 sm:w-32">
                          <Image
                            src={item.imageUrl}
                            alt={item.name}
                            fill
                            sizes="(max-width: 640px) 96px, 128px"
                            unoptimized
                            className="object-cover"
                          />
                        </div>

                        {/* Product information */}
                        <div className="min-w-0 flex-1">
                          <div className="flex min-w-0 flex-col gap-2 md:flex-row md:items-start md:justify-between md:gap-3">
                            <div className="min-w-0">
                              <h3 className="break-words text-sm font-semibold leading-5 text-slate-900 sm:text-base md:text-lg">
                                {item.name}
                              </h3>

                              <p className="mt-1 break-words text-xs leading-5 text-slate-500 sm:text-sm">
                                {item.description}
                              </p>
                            </div>

                            {/* Prices */}
                            <div className="shrink-0 md:text-right">
                              <p className="text-base font-bold sm:text-lg">
                                {formatPrice(item.price)}
                              </p>

                              <div className="mt-1 flex flex-wrap items-center gap-2 md:justify-end">
                                <span className="text-xs text-slate-400 line-through sm:text-sm">
                                  {formatPrice(item.originalPrice)}
                                </span>

                                <span className="text-xs font-semibold text-emerald-700">
                                  {discount}% OFF
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Size and quantity */}
                          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-3 sm:mt-4 sm:gap-x-5">
                            <div className="flex items-center gap-2 text-xs text-slate-600 sm:text-sm">
                              <span className="text-slate-500">
                                Size:
                              </span>

                              {isEditing ? (
                                <select
                                  aria-label={`Choose size for ${item.name}`}
                                  value={editingSize.value}
                                  onChange={(event) =>
                                    setEditingSize({
                                      id: item.id,
                                      value: event.target.value,
                                    })
                                  }
                                  className="min-h-11 max-w-28 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs font-semibold focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 sm:text-sm"
                                >
                                  {item.sizes.map((size) => (
                                    <option key={size} value={size}>
                                      {size}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span className="font-semibold text-slate-800">
                                  {item.size}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500 sm:text-sm">
                                Qty:
                              </span>

                              <div className="inline-flex h-11 items-center rounded-md border border-slate-200">
                                <button
                                  type="button"
                                  onClick={() =>
                                    changeQuantity(item.id, -1)
                                  }
                                  disabled={item.quantity <= 1}
                                  aria-label={`Decrease quantity of ${item.name}`}
                                  className="flex h-11 w-11 items-center justify-center rounded-l-md text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
                                >
                                  <Minus className="h-3.5 w-3.5" />
                                </button>

                                <span
                                  aria-live="polite"
                                  className="min-w-8 text-center text-xs font-semibold sm:text-sm"
                                >
                                  {item.quantity}
                                </span>

                                <button
                                  type="button"
                                  onClick={() =>
                                    changeQuantity(item.id, 1)
                                  }
                                  disabled={item.quantity >= 5}
                                  aria-label={`Increase quantity of ${item.name}`}
                                  className="flex h-11 w-11 items-center justify-center rounded-r-md text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Edit controls */}
                          {isEditing && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={saveSize}
                                className="min-h-11 rounded-lg bg-indigo-600 px-3 text-xs font-semibold text-white hover:bg-indigo-700"
                              >
                                Save size
                              </button>

                              <button
                                type="button"
                                onClick={() => setEditingSize(null)}
                                className="min-h-11 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                              >
                                Cancel
                              </button>
                            </div>
                          )}

                          {/* Actions and seller */}
                          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-slate-100 pt-3 sm:mt-5 sm:gap-x-5 sm:pt-4">
                            <button
                              type="button"
                              onClick={() =>
                                isEditing
                                  ? saveSize()
                                  : setEditingSize({
                                      id: item.id,
                                      value: item.size,
                                    })
                              }
                              className="inline-flex min-h-11 items-center text-xs font-bold tracking-wide text-slate-700 transition hover:text-indigo-600 sm:text-sm"
                            >
                              {isEditing ? "SAVE" : "EDIT"}
                            </button>

                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className="inline-flex min-h-11 items-center gap-1.5 text-xs font-bold tracking-wide text-slate-700 transition hover:text-red-600 sm:text-sm"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              REMOVE
                            </button>

                            <p className="w-full break-words text-xs text-slate-500 sm:ml-auto sm:w-auto sm:text-right">
                              Sold by{" "}
                              <span className="font-semibold text-slate-700">
                                {item.seller}
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>

            {/* Price details */}
            <aside
              aria-labelledby="price-details-heading"
              className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-2xl sm:p-6 lg:sticky lg:top-6"
            >
              <h2
                id="price-details-heading"
                className="text-base font-semibold sm:text-lg"
              >
                Price Details ({totals.itemCount}{" "}
                {totals.itemCount === 1 ? "Item" : "Items"})
              </h2>

              <dl className="mt-5 space-y-4 text-sm sm:mt-6">
                <div className="flex items-start justify-between gap-4">
                  <dt className="min-w-0 text-slate-600">
                    Product Price
                  </dt>

                  <dd className="shrink-0 font-medium text-slate-800">
                    {formatPrice(totals.productTotal)}
                  </dd>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <dt className="min-w-0 text-slate-600">
                    Total Discounts
                  </dt>

                  <dd className="shrink-0 font-medium text-emerald-700">
                    −{formatPrice(totals.discountTotal)}
                  </dd>
                </div>
              </dl>

              <div className="my-5 border-t border-dashed border-slate-200" />

              <div className="flex items-center justify-between gap-3">
                <h3 className="text-base font-semibold sm:text-lg">
                  Order Total
                </h3>

                <p className="shrink-0 text-lg font-bold sm:text-xl">
                  {formatPrice(totals.orderTotal)}
                </p>
              </div>

              {/* Discount savings */}
              <div className="mt-5 flex items-start gap-3 rounded-lg bg-emerald-50 px-3 py-3 text-emerald-800 sm:px-4 sm:py-3.5">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </div>

                <p className="text-xs leading-5 sm:text-sm">
                  Yay! You save{" "}
                  <span className="font-bold">
                    {formatPrice(totals.discountTotal)}
                  </span>{" "}
                  on this order.
                </p>
              </div>

              {/* Payment navigation */}
              <Link
                href="/checkout"
                className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:mt-6 sm:min-h-14 sm:text-base"
              >
                <span>Proceed to Payment</span>
                <span aria-hidden>→</span>
              </Link>

              <p className="mt-3 text-center text-xs leading-5 text-slate-400">
                Shipping and taxes, if applicable, are calculated at checkout.
              </p>

              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500 sm:mt-5">
                <Tag className="h-3.5 w-3.5 shrink-0" />
                <span>Offers and discounts are applied to your order.</span>
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}