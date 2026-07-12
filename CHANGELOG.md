# Changelog

## [Unreleased] — `feature/backend-scaffold-fases-1-7`

Backend built from scratch per `PLAN.md`, Fases 1-7. Replaces the previous empty Express scaffold entirely.

### Added

- NestJS 11 project scaffold (TypeScript, npm), module structure per feature (`auth`, `products`, `cart`, `favorites`, `payment-methods`, `addresses`, `orders`, `nikeplus`, `health`, `common`, `prisma`).
- Prisma schema against Neon Postgres: `User`, `RefreshToken`, `Product`, `CartItem`, `Favorite`, `PaymentMethod`, `Address`, `Order`, `OrderItem`, `Transaction`, `NikePlusActivity`. Initial migration + seed (4 products, demo user `jordan@nike.com`, Nike+ activities).
- Auth module: register/login/refresh/logout/me with JWT access (15m) + rotated refresh tokens (30d, hashed at rest), bcrypt password hashing, global `JwtAuthGuard` with `@Public()` opt-out.
- Feature modules: Products (catalog), Cart, Favorites, PaymentMethods (stores brand + last4 only, never the full card number), Addresses, Orders (checkout with a pluggable `PaymentGateway` interface + `MockPaymentGateway`, `Transaction` audit record on every charge attempt), NikePlus, Health (`/health`, checks DB connectivity).
- Cross-cutting: global `ValidationPipe` with a custom exception factory producing field-level `details`, global `HttpExceptionFilter` implementing the fintech-style error envelope, `helmet`, `@nestjs/throttler` (100 req/min), CORS, `RequestIdMiddleware` + `LoggingInterceptor`, i18n (es/en) for error messages via `Accept-Language`.
- Swagger UI at `/docs`, `openapi.json` export script (`npm run docs:export`), `CONTRACT.md`.
- Reference docs copied to `~/Downloads/nike-store-setup/`: `GUIA_NEON.md`, `CONTRACT.md`, `openapi.json`, `.env.example`, `01_create_tables.sql`, `02_seed_data.sql`, `schema.prisma`.

### Fixed

- `node_modules/` was previously committed to git (leftover from the initial Express scaffold); untracked via `git rm --cached` and covered by a proper `.gitignore` (`node_modules/`, `dist/`, `.env`, logs, coverage).

### Verified

- `npm run build`, `npm run lint`, `npm run test:e2e` all pass.
- Manual end-to-end run against the real Neon database: register → login → me → list products → add to cart → add payment method → checkout (approved, cart cleared) → checkout decline path (card ending `0002`) → validation errors in `es`/`en` → 401 without a token → 409 on duplicate email.

### Not included (deferred)

- iOS integration (Fases 8-13 of `PLAN.md`).
- Real payment gateway integration (Culqi/VisaNet) — pending merchant credentials.
- iOS app internationalization (`Localizable.strings`).
- Render.com deployment.
