import { Controller, Get } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import { App } from 'supertest/types';
import { configureTrustProxy } from './trust-proxy';

const LIMIT = 2;

@Controller('ping')
class PingController {
  @Get()
  ping() {
    return { ok: true };
  }
}

async function buildApp(
  withTrustProxy: boolean,
): Promise<NestExpressApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [ThrottlerModule.forRoot([{ ttl: 60_000, limit: LIMIT }])],
    controllers: [PingController],
    providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
  }).compile();

  const app = moduleRef.createNestApplication<NestExpressApplication>();
  if (withTrustProxy) configureTrustProxy(app);
  await app.init();
  return app;
}

/** Gasta el cupo de una IP (simulada con X-Forwarded-For) y devuelve el status siguiente. */
async function exhaust(app: NestExpressApplication, ip: string) {
  const server = app.getHttpServer() as App;
  for (let i = 0; i < LIMIT; i++) {
    await request(server).get('/ping').set('X-Forwarded-For', ip).expect(200);
  }
  return request(server).get('/ping').set('X-Forwarded-For', ip);
}

describe('configureTrustProxy', () => {
  let app: NestExpressApplication;

  afterEach(async () => {
    await app.close();
  });

  it('con trust proxy, cada IP real tiene su propio cupo', async () => {
    app = await buildApp(true);

    const blocked = await exhaust(app, '203.0.113.1');
    expect(blocked.status).toBe(429);

    // Otro cliente no se ve afectado porque el primero agotó su cupo.
    await request(app.getHttpServer())
      .get('/ping')
      .set('X-Forwarded-For', '203.0.113.2')
      .expect(200);
  });

  it('sin trust proxy, todos comparten un solo cupo (el bug que se corrige)', async () => {
    app = await buildApp(false);

    const blocked = await exhaust(app, '203.0.113.1');
    expect(blocked.status).toBe(429);

    // Un cliente distinto también queda bloqueado.
    await request(app.getHttpServer())
      .get('/ping')
      .set('X-Forwarded-For', '203.0.113.2')
      .expect(429);
  });
});
