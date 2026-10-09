import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-2 px-4 py-6 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Link href="/" className="font-semibold text-slate-900">Cliffesto</Link>
        <p className="m-0">© {new Date().getFullYear()} Cliffesto. Thoughtful goods for everyday life.</p>
      </div>
    </footer>
  );
}
