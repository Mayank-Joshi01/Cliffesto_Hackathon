
import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { LogoutButton } from "@/features/auth/LogoutButton";
import { query } from "@/lib/db";

import ProfileActions, {
  type AccountAddress,
} from "./ProfileActions";

export default async function AccountPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { rows: addresses } = await query<AccountAddress>(
    `SELECT
       id,
       full_name,
       line1,
       city,
       postal_code,
       country
     FROM addresses
     WHERE user_id = $1
     ORDER BY created_at DESC, id DESC`,
    [user.id],
  );

  const accountLinks = [
    { label: "Profile", href: "/account/profile" },
    { label: "Addresses", href: "/account/addresses" },
    { label: "Orders", href: "/account/orders" },
    { label: "Cart", href: "/cart" },
  ];

  return (
    <main className="min-h-screen min-w-0 bg-[var(--background)] px-4 py-8 text-[var(--foreground)] sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-5xl">
        <header className="mb-8 border-b border-current/10 pb-6">
          <h1 className="text-2xl font-semibold sm:text-3xl">
            My Account
          </h1>

          <p className="mt-2 break-all text-sm opacity-70">
            {user.email}
          </p>

          <p className="mt-2 text-sm opacity-70">
            Manage your profile, addresses, and orders.
          </p>
        </header>

        <nav
          aria-label="Account navigation"
          className="mb-10 grid grid-cols-2 gap-3 lg:grid-cols-4"
        >
          {accountLinks.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className="rounded-xl border border-current/15 p-4 transition-colors hover:border-violet-500 hover:bg-violet-500/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 sm:p-5"
            >
              <span className="block text-sm font-semibold">
                {label}
              </span>

              <span className="mt-2 block text-xs opacity-65">
                Manage {label.toLowerCase()} →
              </span>
            </Link>
          ))}
        </nav>

        <section aria-label="Account settings" className="min-w-0">
          <ProfileActions
            initialName={user.name ?? ""}
            email={user.email}
            initialAddresses={addresses}
          />
        </section>

        <footer className="mt-10 flex flex-col gap-4 border-t border-current/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold">
              Sign out
            </h2>

            <p className="mt-1 text-sm opacity-70">
              Sign out of your account on this device.
            </p>
          </div>

          <div className="w-full sm:w-auto">
            <LogoutButton />
          </div>
        </footer>
      </div>
    </main>
  );
}
