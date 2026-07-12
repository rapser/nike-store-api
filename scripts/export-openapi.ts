import { NestFactory } from '@nestjs/core';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { AppModule } from '../src/app.module';
import { buildSwaggerDocument } from '../src/swagger';

async function run() {
  const app = await NestFactory.create(AppModule, { logger: false });
  const document = buildSwaggerDocument(app);
  const outPath = join(__dirname, '..', 'openapi.json');
  writeFileSync(outPath, JSON.stringify(document, null, 2));
  console.log(`Wrote ${outPath}`);
  await app.close();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
