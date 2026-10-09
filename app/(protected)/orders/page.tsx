import Link from "next/link";
export default function OrdersPage() {
  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-14">
      <h1 className="text-4xl font-bold">Order history</h1>
      <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <p className="font-semibold">Order history is not available.</p>
        <p className="mt-2 text-slate-600">
          The existing database schema does not include an orders table.
        </p>
        <Link href="/products" className="mt-4 inline-block text-indigo-600">Browse products</Link>
      </div>
    </main>
  );
}
