"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { MapPin, CreditCard, Banknote, Pencil } from "lucide-react";

export type AccountAddress = {
  id: string;
  full_name: string;
  line1: string;
  city: string;
  postal_code: string;
  country: string;
};

type AddressFields = Omit<AccountAddress, "id">;

const emptyAddress = (): AddressFields => ({
  full_name: "",
  line1: "",
  city: "",
  postal_code: "",
  country: "IN",
});

export default function CheckoutPage() {
  // Address State
  const [address, setAddress] = useState<AccountAddress | null>(null);
  const [isEditingAddress, setIsEditingAddress] = useState(true); // Defaults to true if no address
  const [addressDraft, setAddressDraft] = useState<AddressFields>(emptyAddress());
  
  // Payment State
  const [paymentMode, setPaymentMode] = useState<string>("card");

  // Form State
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function openEditAddress() {
    setAddressDraft(
      address
        ? {
            full_name: address.full_name,
            line1: address.line1,
            city: address.city,
            postal_code: address.postal_code,
            country: address.country,
          }
        : emptyAddress()
    );
    setIsEditingAddress(true);
  }

  async function submitAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);

    try {
      const response = await fetch("/account/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: address ? "update-address" : "create-address",
          id: address?.id,
          ...addressDraft,
        }),
      });
      
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setError(result?.error || "Unable to save address. Try again.");
        return;
      }

      setAddress(result?.address);
      setIsEditingAddress(false);
    } catch {
      setError("Connection error. Check your network and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-3 py-7 sm:px-5 sm:py-10">
      <h1 className="text-slate-900">Checkout</h1>
      
      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <div className="space-y-6">
          
          {/* Shipping Address Section */}
          <section className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-slate-900">
                <MapPin className="h-5 w-5 text-indigo-600" />
                Shipping Address
              </h2>
              {address && !isEditingAddress && (
                <button
                  type="button"
                  onClick={openEditAddress}
                  className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </button>
              )}
            </div>

            {isEditingAddress ? (
              <form onSubmit={submitAddress} className="space-y-4">
                <div>
                  <label htmlFor="full_name" className="mb-1.5 block text-sm font-medium text-slate-700">Full Name</label>
                  <input
                    id="full_name"
                    required
                    value={addressDraft.full_name}
                    onChange={(e) => setAddressDraft({ ...addressDraft, full_name: e.target.value })}
                    className="min-h-11 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
                <div>
                  <label htmlFor="line1" className="mb-1.5 block text-sm font-medium text-slate-700">Address Line 1</label>
                  <input
                    id="line1"
                    required
                    value={addressDraft.line1}
                    onChange={(e) => setAddressDraft({ ...addressDraft, line1: e.target.value })}
                    className="min-h-11 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="city" className="mb-1.5 block text-sm font-medium text-slate-700">City</label>
                    <input
                      id="city"
                      required
                      value={addressDraft.city}
                      onChange={(e) => setAddressDraft({ ...addressDraft, city: e.target.value })}
                      className="min-h-11 w-full min-w-0 rounded-md border border-slate-300 px-3 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                  <div>
                    <label htmlFor="postal_code" className="mb-1.5 block text-sm font-medium text-slate-700">Postal Code</label>
                    <input
                      id="postal_code"
                      required
                      value={addressDraft.postal_code}
                      onChange={(e) => setAddressDraft({ ...addressDraft, postal_code: e.target.value })}
                      className="min-h-11 w-full min-w-0 rounded-md border border-slate-300 px-3 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                </div>
                
                {error && <p className="text-sm font-medium text-red-600">{error}</p>}
                
                <div className="flex gap-3 pt-2">
                  {address && (
                    <button
                      type="button"
                      onClick={() => setIsEditingAddress(false)}
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {busy ? "Saving..." : "Save Address"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
                <p className="font-medium text-slate-900">{address?.full_name}</p>
                <p>{address?.line1}</p>
                <p>{address?.city}, {address?.postal_code}</p>
                <p>{address?.country}</p>
              </div>
            )}
          </section>

          {/* Payment Method Section */}
          <section className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
            <h2 className="mb-4 text-slate-900">Payment Method</h2>
            <div className="space-y-3">
              <label
                className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-md border p-3 transition ${
                  paymentMode === "card" ? "border-indigo-600 bg-indigo-50/50" : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMode"
                  value="card"
                  checked={paymentMode === "card"}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-600"
                />
                <CreditCard className="h-5 w-5 text-slate-600" />
                <span className="font-medium text-slate-900">Credit / Debit Card</span>
              </label>

              <label
                className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-md border p-3 transition ${
                  paymentMode === "cod" ? "border-indigo-600 bg-indigo-50/50" : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMode"
                  value="cod"
                  checked={paymentMode === "cod"}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-600"
                />
                <Banknote className="h-5 w-5 text-slate-600" />
                <span className="font-medium text-slate-900">Cash on Delivery</span>
              </label>
            </div>
          </section>
        </div>

        {/* Order Summary */}
        <aside className="h-fit rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
          <h2 className="text-slate-900">Order summary</h2>
          <div className="mt-6 space-y-4 text-sm text-slate-600">
            <p>Prices are recalculated from trusted catalog data when an order is created.</p>
            
            <div className="border-t border-slate-200 pt-4">
              <div className="flex justify-between font-medium text-slate-900">
                <span>Total</span>
                <span>$0.00</span>
              </div>
            </div>

            <button
              disabled={!address || isEditingAddress}
              className="mt-6 min-h-11 w-full rounded-md bg-slate-900 px-5 text-center text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Place Order
            </button>
            {(!address || isEditingAddress) && (
              <p className="text-center text-xs text-red-500">
                Please save your shipping address to proceed.
              </p>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}