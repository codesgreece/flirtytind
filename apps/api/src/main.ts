import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ZodValidationPipe } from './common/pipes/zod-validation.pipe';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  const prefix = config.get<string>('API_PREFIX', 'api/v1');
  app.setGlobalPrefix(prefix);

  const corsOrigins = (config.get<string>('CORS_ORIGINS') ?? '*')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({
    origin: corsOrigins.includes('*') ? true : corsOrigins,
    credentials: true,
  });

  app.useGlobalFilters(new HttpExceptionFilter());

  const uploadDir = config.get<string>('STORAGE_LOCAL_DIR', './uploads');
  const resolvedUploads = join(process.cwd(), uploadDir);
  app.useStaticAssets(resolvedUploads, { prefix: '/uploads' });

  const port = Number(config.get<string>('PORT', '3001'));
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Flirty Greece API listening on :${port}/${prefix}`);
}

bootstrap();
