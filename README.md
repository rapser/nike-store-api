# nike-store-api

API REST para el app iOS [Nike+Research](../..) — NestJS + Prisma + PostgreSQL (hospedado en [Neon](https://neon.tech)), desplegada en [Render](https://render.com).

## Stack

- [NestJS](https://nestjs.com) 11 (TypeScript)
- [Prisma](https://www.prisma.io) 6 ORM
- PostgreSQL (Neon, serverless)
- Autenticación JWT (access token + refresh token rotado) con hash de contraseñas via `bcrypt`
- `@nestjs/swagger` para documentación interactiva

## Instalación

```bash
npm install
cp .env.example .env   # completa DATABASE_URL / DIRECT_URL / JWT secrets — ver abajo
npx prisma migrate dev # aplica las migraciones contra la base definida en .env
npx prisma db seed     # carga el catálogo demo de productos + usuario demo
npm run start:dev
```

### Variables de entorno (`.env`)

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Connection string de Postgres **pooled** (host de Neon con `-pooler`) — la usa la app en tiempo de ejecución |
| `DIRECT_URL` | Connection string **directa/sin pool** — la usa Prisma Migrate |
| `JWT_SECRET` | Firma los access tokens (TTL 15 min). Generar con `openssl rand -hex 32` |
| `JWT_REFRESH_SECRET` | Firma los refresh tokens (TTL 30 días, se rota en cada uso). Generar igual que el anterior |
| `PORT` | Por defecto `3000` |

## Configuración de Neon (paso a paso)

Así se configuró la base de datos de este proyecto en Neon:

1. Crear una cuenta / iniciar sesión en [console.neon.tech](https://console.neon.tech).
2. Crear un **proyecto** nuevo (en este caso llamado **Store**) — Neon crea automáticamente una rama (branch) de base de datos llamada **production**.
3. Dentro del proyecto, ir a **Connection Details** (o "Connect") en el dashboard. Neon te da dos formatos de connection string para la misma base:
   - Uno con `-pooler` en el hostname (ej. `ep-xxxx-pooler.region.aws.neon.tech`) → esta es la conexión **pooled**, pensada para que la app la use en producción, ya que soporta muchas conexiones concurrentes de forma eficiente (serverless). Va en `DATABASE_URL`.
   - Uno sin `-pooler` (ej. `ep-xxxx.region.aws.neon.tech`) → esta es la conexión **directa**, necesaria para que Prisma Migrate pueda hacer operaciones de esquema (crear tablas, etc.) que no funcionan bien a través del pooler. Va en `DIRECT_URL`.
4. Ambos connection strings deben incluir `?sslmode=require&channel_binding=require` al final — Neon exige SSL.
5. Pegar ambos valores en tu `.env` local (`DATABASE_URL` y `DIRECT_URL`).
6. `prisma/schema.prisma` ya está configurado para usar las dos variables:
   ```prisma
   datasource db {
     provider  = "postgresql"
     url       = env("DATABASE_URL")
     directUrl = env("DIRECT_URL")
   }
   ```
7. Correr `npx prisma migrate dev` — esto crea todas las tablas en la rama `production` de Neon según `prisma/schema.prisma`, y genera el cliente de Prisma localmente.
8. Correr `npx prisma db seed` — carga el catálogo demo de productos y un usuario de prueba (`jordan@nike.com` / `password123`).
9. Verificar que todo cargó bien entrando a **Tables** en el dashboard de Neon, o con `npx prisma studio` (ver sección "Inspeccionar la base de datos" más abajo).

A partir de ahí, tanto el backend corriendo en local como el desplegado en Render apuntan a la **misma** base de Neon (mismas variables `DATABASE_URL`/`DIRECT_URL`), así que los datos son compartidos entre ambos ambientes.

## Despliegue a Render (paso a paso)

Así se desplegó este backend a [Render](https://render.com):

1. Mergear la rama de trabajo a `main` en GitHub — Render despliega desde una rama fija, en este caso `main`.
2. Entrar al [dashboard de Render](https://dashboard.render.com) → **New** → **Web Service** (no "Static Site" ni "Private Service" — un API server es un "Web Service": app dinámica, ideal para APIs y backends de apps móviles).
3. Conectar la cuenta de GitHub (si no está conectada) y seleccionar el repo `nike-store-api`.
4. En la configuración:
   - **Branch:** `main`
   - **Root Directory:** vacío (el proyecto está en la raíz del repo)
   - **Runtime:** Node (detectado automáticamente)
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start:prod` (corre `node dist/main`, el build ya compilado — **no** usar `npm run start`, que es el modo desarrollo)
   - **Instance Type:** Free (ver limitaciones abajo)
5. Antes de desplegar, agregar las **variables de entorno** (sección "Environment Variables" del mismo formulario, o después en la pestaña "Environment"):
   - `DATABASE_URL` → el connection string **pooled** de Neon
   - `DIRECT_URL` → el connection string **directo** de Neon
   - `JWT_SECRET`
   - `JWT_REFRESH_SECRET`
   - `NODE_ENV` = `production`
   - (`PORT` **no** se agrega — Render la inyecta sola y `src/main.ts` ya la respeta con `process.env.PORT`)
6. **Requisito importante:** el `package.json` de este repo tiene un script `"postinstall": "prisma generate"`. Sin esto, Render instala las dependencias pero nunca regenera el cliente de Prisma contra `schema.prisma`, y la app crashea al arrancar. Esto es un paso obligatorio en cualquier proyecto con Prisma desplegado a un hosting nuevo (no es específico de Render).
7. Configurar el **Health Check Path** en `/health` (endpoint ya expuesto por `src/health/`, revisa conectividad a la base con un `SELECT 1`).
8. Click en **Deploy Web Service**.
9. Una vez desplegado, Render asigna una URL pública (tipo `https://nike-store-api-xxxx.onrender.com`) — esa URL es la que se usa como `API_BASE_URL` de producción en el app iOS (`Nike+Research/Configuration/Production.xcconfig`).

### Limitaciones del plan Free de Render a tener en cuenta

- **Spin down por inactividad:** si no hay tráfico por ~15 minutos, la instancia se apaga. La siguiente request puede tardar 30-60 segundos en responder mientras Render la "despierta" (cold start). Por eso el timeout de las requests en el app iOS se subió a 90 segundos (ver `AppConfig.swift`).
- **Sin "one-off jobs":** no se puede correr `npx prisma migrate deploy` como un job aislado en la infraestructura de Render — hay que correrlo manualmente desde una máquina local apuntando al `DIRECT_URL` de producción cada vez que haya una migración nueva.
- Sin acceso SSH, sin scaling, sin discos persistentes — ninguno de estos aplica a este proyecto (no se necesita almacenamiento local ni escalado horizontal).

## Corriendo en desarrollo

Con `.env` completado y las migraciones/seed ya aplicadas:

```bash
cd nike-store-api
npm run start:dev
```

Esto levanta la API en `http://localhost:3000` con hot reload (reinicia con cada cambio de archivo). Mientras está corriendo:

- Swagger UI: `http://localhost:3000/docs`
- Health check: `http://localhost:3000/health`
- Usuario demo: `jordan@nike.com` / `password123`

Detenerla con `Ctrl+C` en esa terminal. Si una corrida anterior no cerró bien y el puerto quedó ocupado, revisa qué proceso lo tiene con `lsof -i :3000 -sTCP:LISTEN -P` y mátalo antes de volver a levantar el servidor.

## Inspeccionar la base de datos

Los datos son reales — cada request pasa por Prisma hacia la base de datos real en Neon Postgres (no hay mocks). Tres formas de ver qué hay ahí:

1. **Neon Console** (visual, sin configuración): [console.neon.tech](https://console.neon.tech) → proyecto **Store** → rama **production** → barra lateral → **Tables**. Click en cualquier tabla para ver sus filas.
2. **Neon SQL Editor**: mismo proyecto → barra lateral → **SQL Editor**. Listar todas las tablas con:
   ```sql
   SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
   ```
   O consultar una directamente, ej. `SELECT * FROM products;`.
3. **Prisma Studio** (UI local, mejor para navegar/editar filas):
   ```bash
   npx prisma studio
   ```
   Abre `http://localhost:5555` conectado directo a la base de Neon definida en `.env`, con todas las tablas navegables — también sirve para borrar filas de prueba sobrantes (ej. cuentas creadas al probar la colección de Postman).

Tablas actuales: `users`, `refresh_tokens`, `products`, `cart_items`, `favorites`, `payment_methods`, `addresses`, `orders`, `order_items`, `transactions`, `nikeplus_activities`, más la tabla interna de Prisma `_prisma_migrations`.

## Scripts

| Comando | Descripción |
|---|---|
| `npm run start:dev` | Corre en local con hot reload |
| `npm run build` | Compila a `dist/` |
| `npm run start:prod` | Corre el build ya compilado |
| `npm run lint` | ESLint (`--fix`) |
| `npm run test:e2e` | Levanta la app y prueba `/health` |
| `npm run docs:export` | Regenera `openapi.json` desde los controllers/DTOs actuales |
| `npx prisma studio` | Navegar la base de datos |
| `npx prisma migrate dev --name <nombre>` | Crear + aplicar una migración nueva |
| `npx prisma migrate deploy` | Aplicar migraciones pendientes en producción (correr manualmente contra `DIRECT_URL` de Render — ver sección de Render) |
| `npx prisma db seed` | Volver a correr el seed (idempotente — hace upsert) |

## Documentación de la API

- Swagger UI: `http://localhost:3000/docs`
- Spec cruda: `http://localhost:3000/docs-json`, también exportada en [`~/Downloads/nike-store-setup/openapi.json`](../../../../nike-store-setup/openapi.json)
- Referencia de endpoints + estándar de errores: [`~/Downloads/nike-store-setup/CONTRACT.md`](../../../../nike-store-setup/CONTRACT.md)

## Estándar de errores

Las respuestas exitosas devuelven el recurso directamente. Los errores siempre tienen esta forma:

```json
{ "error": { "code": "EMAIL_ALREADY_IN_USE", "message": "...", "type": "conflict_error", "requestId": "req_..." } }
```

`message` está localizado (`es` por defecto, `en` vía header `Accept-Language: en`). Detalle completo en `CONTRACT.md`.

## Pagos

El checkout pasa por una interfaz `PaymentGateway` (`src/orders/payment-gateway/`) con una implementación `MockPaymentGateway` — todavía no hay un procesador real conectado. Cada intento de cobro (aprobado o rechazado) queda registrado en la tabla `transactions` sin importar el resultado. Para simular un rechazo en desarrollo, usa una tarjeta terminada en `0002`. Conectar un gateway real (Culqi, VisaNet, ...) implica agregar una clase que implemente `PaymentGateway` y apuntar el provider `PAYMENT_GATEWAY` a ella en `orders.module.ts` — nada más cambia.

## Estructura del proyecto

```
src/
  auth/            # register/login/refresh/logout/me, estrategia JWT + guard
  products/        # catálogo
  cart/            # CRUD del carrito
  favorites/       # CRUD de favoritos
  payment-methods/ # tarjetas guardadas (solo brand + últimos 4 dígitos, nunca el PAN completo)
  addresses/       # CRUD de direcciones de envío
  orders/          # checkout + historial de pedidos, seam de payment-gateway
  nikeplus/        # estadísticas de actividad Nike+
  health/          # chequeo de liveness + conexión a la base
  common/          # envelope de errores, mensajes i18n, guards, interceptors, middleware
  prisma/          # PrismaService/PrismaModule
prisma/
  schema.prisma
  seed.ts
```

## Arquitectura

Hoy es un **monolito modular**: un solo proceso Node, un solo deploy en Render, pero internamente separado en módulos de NestJS con límites claros (uno por dominio: `auth`, `products`, `cart`, `favorites`, `payment-methods`, `addresses`, `orders`, `nikeplus`, `health`). Cada módulo sigue la misma capa estándar de Nest:

```
Controller (HTTP + validación de DTOs)
    ↓
Service (lógica de negocio)
    ↓
PrismaService (acceso a datos, inyectado vía DI)
```

Piezas transversales, registradas globalmente en `app.module.ts` en vez de repetidas por módulo:

- **`RequestIdMiddleware`** — genera un `requestId` por request, usado en logs y en el envelope de error, para poder rastrear una llamada específica.
- **`HttpExceptionFilter`** — normaliza cualquier excepción al mismo formato `{ error: { code, message, type, requestId } }`.
- **`LoggingInterceptor`** — loguea cada request/response.
- **`JwtAuthGuard`** (global, con `@Public()` para excepciones como login/register/products) + **`ThrottlerGuard`** (rate limiting: 100 requests/60s por IP).
- **`PaymentGateway`** (`src/orders/payment-gateway/`) — la única dependencia externa (pasarela de pagos) está detrás de una interfaz, con `MockPaymentGateway` como implementación actual. Cambiar a un procesador real no toca nada fuera de esa carpeta.

Autenticación **stateless**: cada request se valida por JWT (access token de corta duración + refresh token rotado y persistido en `refresh_tokens`), no hay sesión en memoria del servidor — esto es lo que hace posible correr varias instancias del API sin coordinarlas entre sí (ver escalabilidad abajo).

## Escalabilidad futura

El diseño actual ya deja varios caminos abiertos sin necesitar una reescritura:

- **Escalar horizontalmente el API tal cual está.** Como la auth es stateless (JWT, sin sesión en memoria) y Neon ya maneja el pooling de conexiones, se pueden levantar más instancias del mismo proceso Nest detrás de un load balancer sin cambios de código — solo pasar de un plan Free/single-instance de Render a uno que soporte múltiples instancias.
- **Separar módulos en servicios independientes si el tráfico lo justifica.** Como cada dominio ya es un módulo de Nest con su propio Controller/Service (no hay lógica cruzada entre carpetas), el candidato más claro para separar primero sería `orders/` (checkout + pagos), ya que suele ser el cuello de botella en un e-commerce — se movería a su propio servicio sin tocar `products/`, `cart/`, etc.
- **Cache para lecturas de alto tráfico.** `GET /products` es público y de solo lectura — es el candidato natural para una capa de cache (Redis, o cache HTTP con `Cache-Control`) antes de escalar la base de datos.
- **Colas para trabajo asíncrono.** Hoy el checkout llama a `PaymentGateway` de forma síncrona dentro del request. Si se conecta un gateway real con latencia variable (Culqi, VisaNet), conviene mover la confirmación de pago a una cola (ej. BullMQ) y responder al cliente antes de que el pago termine de procesarse, actualizando el estado del pedido después.
- **Base de datos:** Neon ya soporta *read replicas* y *autoscaling* de cómputo en planes pagos — si las lecturas (catálogo, historial de pedidos) se vuelven el cuello de botella antes que las escrituras, se pueden apuntar esas queries a una réplica sin cambiar el esquema.
- **Observabilidad:** el `requestId` por request y el `LoggingInterceptor` ya existen — el siguiente paso natural al escalar sería exportar esos logs a un servicio centralizado (ej. Datadog, Grafana Loki) en vez de solo stdout, para poder correlacionar errores entre múltiples instancias.

## Estado

El backend (Fases 1-7 del plan del proyecto) está completo y verificado de punta a punta contra Neon, y desplegado en Render. La integración con iOS (Fases 8-13) fue un esfuerzo posterior, ya completado en el app.
