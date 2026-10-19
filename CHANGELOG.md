# Changelog

## [Unreleased] — `feature/catalogo-30-productos`

### Changed

- Catálogo ampliado de 15 a **30 productos**, con variedad más allá del calzado: camisetas de Alianza Lima (hombre, mujer y niños), accesorios (gorra, mochila Elemental 21 L, pack de medias, pelota Academy Total 90, canilleras Mercurial Lite), ropa de entrenamiento (short y polo Stride Dri-FIT, bra Swift) y más calzado (V2K Run, Air Max 90, ACG Pegasus Trail GORE-TEX, sandalias Pacific). Todo de [nike.com.pe](https://www.nike.com.pe/), con sus precios reales en soles (S/ 89.90 – S/ 1,019.90).
- `buildImages` recibe ahora el **número de vistas por producto** en vez de asumir 6. No todos publican la misma cantidad: unas zapatillas suelen tener 8 (se recortan a 6), pero una camiseta o una gorra pueden tener una sola, y pedir una vista inexistente dejaba un hueco en el carrusel del detalle. También acepta `png`, que es el formato del Air Max 90.

### Verified

- `npx tsc --noEmit`, `npm run build` y `npm run lint` pasan.
- Las 148 URLs de imagen que genera el seed responden `200`.

### Pendiente

- Correr `npx prisma db seed` contra Neon para que el catálogo nuevo quede vivo — quedó bloqueado en la sesión por ser base compartida.

## [Unreleased] — `feature/catalogo-peru`

### Changed

- Catálogo sembrado con los 15 productos reales de [nike.com.pe](https://www.nike.com.pe/) (Pegasus Plus 2, Air Jordan 1/4, Air Force 1, Dunk Low, Kobe 8 Protro, Total 90, Free Metcon 7, Spizike Low), con **precios en soles (PEN)** tal como aparecen en la tienda peruana. Reemplazan a los 4 productos dummy en USD.
- `Product.images` ahora guarda **URLs absolutas** del CDN de nike.com.pe (6 vistas por producto, `?sw=900&sh=900`) en vez de nombres de asset del bundle del app iOS. El app las descarga en runtime.
- El seed borra los productos que ya no están en el catálogo. `cart_items` y `favorites` caen en cascada; un producto referenciado por `order_items` (`onDelete: Restrict`) no se puede borrar, así que su fila se recicla con un producto real de nike.com.pe en vez de quedarse con datos en USD e imágenes del bundle (es el caso de `875942-100`). Los pedidos ya emitidos no cambian: `order_items` guarda su propio `shoeName` y `shoePrice`, un snapshot de la compra.
- Ejemplos de `productId` en Swagger (`POST /cart`, `POST /favorites`) actualizados al nuevo formato de id (GTIN, ej. `194500874572`); `openapi.json` regenerado.

### Verified

- `npx tsc --noEmit`, `npm run build` y `npm run lint` pasan.
- Las 90 URLs de imagen (15 productos × 6 vistas) responden `200` con contenido distinto por vista.
- Seed corrido contra Neon: `GET /products` en Render devuelve 15 productos, todos con 6 URLs `https` del CDN.

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
