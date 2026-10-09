# Cliffesto

Next.js 16 storefront using Tailwind CSS v4, the Supabase JavaScript client for the public catalog, and server-side PostgreSQL (`pg`) for the existing opaque HTTP-only cookie sessions.

## Development

```powershell
Copy-Item .env.example .env.local
docker compose up -d db
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Or run the complete development stack:

```powershell
docker compose up --build
```

Stop containers without deleting the persistent database volume with `docker compose stop`.

The local PostgreSQL setup and seed script are for local development only. Product listings, search, category pages, homepage catalog sections, and product details query the existing case-sensitive Supabase `Products`, `Categories`, and `Sellers` tables through the publishable key. Search accepts `q`, `page`, `limit`, `category`, `subcategory`, price bounds, and supported sorting through `/api/products` or `/api/products/search`; recent search terms remain local to the browser. Supabase RLS must permit the intended public read operations. If the API returns no rows while records exist, check the table grants and RLS policies; do not disable RLS or use a service-role key in the application.

The existing custom authentication still uses server-side `DATABASE_URL` and the local lowercase `users`/`sessions` schema; it has not been migrated to Supabase Auth. `pnpm dev` database query logs include operation and table names but never SQL parameters. The local migration and seed scripts still target the local PostgreSQL schema; do not run them against the Supabase project. Persistent cart/address/order operations are not enabled because the available credentials and schema information do not establish a safe authenticated user relationship and the existing schema has no visible orders table. Payments remain disabled until a trusted payment provider is configured.

The availability field is rendered as supplied, but an in-stock filter is intentionally not offered until the actual field type and stored status values are verified. The configured project currently returns zero visible records for `Products`, `Categories`, and `Sellers`. The storefront now shows a separate warning instead of treating this as a normal empty catalog. Zero visible rows alone cannot distinguish an empty/wrong project from rows hidden by grants or RLS.

## Checks

```powershell
pnpm typecheck
pnpm build
pnpm lint
docker compose config
```

Environment variable names are documented in [.env.example](./.env.example). Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in an ignored local environment file to enable catalog reads. Never commit `.env.local` or put a Supabase secret/service-role key in a `NEXT_PUBLIC_` variable.

In development, open `/api/dev/database` to run read-only count queries against `Products`, active `Categories`, and `Sellers`. The endpoint returns the configured project host, visible row counts, query status, duration, and sanitized error details; it does not return record contents and is disabled outside development. If the counts are zero, verify that the host is the intended project, that those tables contain rows, and that the `anon` role has the narrow SELECT grants and RLS policies needed for the public catalog. Do not disable RLS or use a service-role key in the application. Structured `[DB REQUEST]`, `[DB RESPONSE]`, `[API REQUEST]`, and `[API RESPONSE]` JSON events appear in the Next.js terminal. Supabase requests are server-side, so they do not log database activity in the browser console.
