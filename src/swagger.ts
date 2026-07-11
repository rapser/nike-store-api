import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function buildSwaggerDocument(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Nike Store API')
    .setDescription(
      'REST API for the Nike Store iOS app — auth, catalog, cart, favorites, payments, orders and Nike+.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  return SwaggerModule.createDocument(app, config);
}
