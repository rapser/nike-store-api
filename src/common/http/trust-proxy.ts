import { NestExpressApplication } from '@nestjs/platform-express';

/**
 * Render pone un proxy delante de la app, así que sin esto Express ve como IP
 * de todos los clientes la del proxy, y el rate limiter les da un único cupo
 * compartido. Con `trust proxy = 1` confía en el primer salto (el de Render)
 * y toma la IP real del cliente de `X-Forwarded-For`.
 *
 * El `1` supone que Render es el único proxy: si se pone otro delante
 * (Cloudflare, un balanceador), hay que subirlo.
 */
export function configureTrustProxy(app: NestExpressApplication): void {
  app.set('trust proxy', 1);
}
