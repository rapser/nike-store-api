# nike-store-api

REST API for the [Nike+Research](../..) iOS app — NestJS + Prisma + PostgreSQL (hosted on [Neon](https://neon.tech)).

## Stack

- [NestJS](https://nestjs.com) 11 (TypeScript)
- [Prisma](https://www.prisma.io) 6 ORM
- PostgreSQL (Neon, serverless)
- JWT auth (access + rotated refresh tokens) with `bcrypt` password hashing
- `@nestjs/swagger` for interactive docs

## Setup

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL / DIRECT_URL / JWT secrets — see below
npx prisma migrate dev # applies migrations against the DB in .env
npx prisma db seed     # loads demo product catalog + demo user
npm run start:dev
```

### Environment variables (`.env`)

| Variable | Description |
|---|---|
| `DATABASE_URL` | Pooled Postgres connection string (Neon host with `-pooler`) — used by the app at runtime |
| `DIRECT_URL` | Direct/unpooled connection string — used by Prisma Migrate |
| `JWT_SECRET` | Signs access tokens (15 min TTL). Generate with `openssl rand -hex 32` |
| `JWT_REFRESH_SECRET` | Signs refresh tokens (30 day TTL, rotated on use). Generate the same way |
| `PORT` | Defaults to `3000` |

See `~/Downloads/nike-store-setup/GUIA_NEON.md` for where to find the Neon connection strings.

## Running in dev

Once `.env` is filled in and migrations/seed have been applied:

```bash
cd nike-store-api
npm run start:dev
```

This starts the API on `http://localhost:3000` with hot reload (restarts on file changes). While it's running:

- Swagger UI: `http://localhost:3000/docs`
- Health check: `http://localhost:3000/health`
- Demo user: `jordan@nike.com` / `password123`

Stop it with `Ctrl+C` in that terminal. If a previous run didn't shut down cleanly and the port is stuck, check what's holding it with `lsof -i :3000 -sTCP:LISTEN -P` and kill that PID before starting again.

## Inspecting the database

The data is real — every request goes through Prisma to the actual Neon Postgres database (no mocks). Three ways to look at what's in it:

1. **Neon Console** (visual, no setup): [console.neon.tech](https://console.neon.tech) → project **Store** → branch **production** → sidebar → **Tables**. Click any table to browse its rows.
2. **Neon SQL Editor**: same project → sidebar → **SQL Editor**. List all tables with:
   ```sql
   SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
   ```
   Or query one directly, e.g. `SELECT * FROM products;`.
3. **Prisma Studio** (local UI, best for browsing/editing rows):
   ```bash
   npx prisma studio
   ```
   Opens `http://localhost:5555` connected straight to the Neon DB in `.env`, with every table navigable — also useful for deleting leftover test rows (e.g. accounts created while testing the Postman collection).

Current tables: `users`, `refresh_tokens`, `products`, `cart_items`, `favorites`, `payment_methods`, `addresses`, `orders`, `order_items`, `transactions`, `nikeplus_activities`, plus Prisma's internal `_prisma_migrations`.

## Scripts

| Command | Description |
|---|---|
| `npm run start:dev` | Run locally with hot reload |
| `npm run build` | Compile to `dist/` |
| `npm run start:prod` | Run the compiled build |
| `npm run lint` | ESLint (`--fix`) |
| `npm run test:e2e` | Boots the app and hits `/health` |
| `npm run docs:export` | Regenerate `openapi.json` from the current controllers/DTOs |
| `npx prisma studio` | Browse the database |
| `npx prisma migrate dev --name <name>` | Create + apply a new migration |
| `npx prisma db seed` | Re-run the seed (idempotent — upserts) |

## API docs

- Swagger UI: `http://localhost:3000/docs`
- Raw spec: `http://localhost:3000/docs-json`, also exported at [`~/Downloads/nike-store-setup/openapi.json`](../../../../nike-store-setup/openapi.json)
- Endpoint reference + error standard: [`~/Downloads/nike-store-setup/CONTRACT.md`](../../../../nike-store-setup/CONTRACT.md)

## Error standard

Success responses return the resource directly. Errors always look like:

```json
{ "error": { "code": "EMAIL_ALREADY_IN_USE", "message": "...", "type": "conflict_error", "requestId": "req_..." } }
```

`message` is localized (`es` by default, `en` via `Accept-Language: en`). Full details in `CONTRACT.md`.

## Payments

Checkout goes through a `PaymentGateway` interface (`src/orders/payment-gateway/`) with a `MockPaymentGateway` implementation — no real processor is wired in yet. Every charge attempt (approved or declined) is recorded in the `transactions` table regardless of outcome. To simulate a decline in dev, use a card ending in `0002`. Swapping in a real gateway (Culqi, VisaNet, ...) means adding a class that implements `PaymentGateway` and pointing the `PAYMENT_GATEWAY` provider at it in `orders.module.ts` — nothing else changes.

## Project structure

```
src/
  auth/            # register/login/refresh/logout/me, JWT strategy + guard
  products/        # catalog
  cart/            # cart CRUD
  favorites/       # favorites CRUD
  payment-methods/ # saved cards (brand + last4 only, never the full PAN)
  addresses/       # shipping addresses CRUD
  orders/          # checkout + order history, payment-gateway/ seam
  nikeplus/        # Nike+ activity stats
  health/          # liveness + DB check
  common/          # error envelope, i18n messages, guards, interceptors, middleware
  prisma/          # PrismaService/PrismaModule
prisma/
  schema.prisma
  seed.ts
```

## Status

Backend (Fases 1-7 of the project plan) is complete and verified end-to-end against Neon. iOS integration (Fases 8-13) is a separate, later effort.
