# Cliffesto

Local-first Next.js 16 storefront using Tailwind CSS v4, PostgreSQL, `pg`, and opaque HTTP-only cookie sessions.

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

The catalog is seeded with 30 products across seven categories in [db/seed.sql](./db/seed.sql). Product listing and ranked search use PostgreSQL when `DATABASE_URL` is configured, with the demo catalog in [lib/products.ts](./lib/products.ts) as a public-page fallback. Search accepts `q`, `page`, `limit`, and `category` through `/api/products` or `/api/products/search`; recent searches are kept locally in the browser. Authentication, cart, order, and payment operations use PostgreSQL when configured. Payments intentionally return a clear not-configured response rather than claiming a charge.

Signup stores a display name and validates email and password on both client and server. Run `pnpm db:migrate` after pulling schema changes; it applies all ordered SQL migrations, including the account-name migration. Email verification, password-reset delivery, and social sign-in are not configured.

## Checks

```powershell
pnpm typecheck
pnpm build
pnpm lint
docker compose config
```

Required server variables are documented in [.env.example](./.env.example). Never commit `.env.local`.
