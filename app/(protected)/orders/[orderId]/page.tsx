import Link from "next/link";
export default async function OrderDetailPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-14">
      <p className="text-sm text-slate-500">Order {orderId}</p>
      <h1 className="mt-2 text-4xl font-bold">Order details</h1>
      <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <p className="font-semibold">Order details are not available.</p>
        <p className="mt-2 text-slate-600">The existing database schema does not include an orders table.</p>
      </div>
      <Link href="/orders" className="mt-6 inline-block text-indigo-600">← Back to orders</Link>
    </main>
  );
}
