import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { RedisIoAdapter } from './realtime/redis-io.adapter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });
  const config = app.get(ConfigService);

  validateJwtSecrets(config);

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

  const redisAdapter = new RedisIoAdapter(app);
  await redisAdapter.connectToRedis();
  app.useWebSocketAdapter(redisAdapter);

  const port = Number(config.get<string>('PORT', '3001'));
  await app.listen(port);

  const closeRedis = async () => {
    await redisAdapter.close();
  };
  app.enableShutdownHooks();
  process.on('SIGINT', () => void closeRedis());
  process.on('SIGTERM', () => void closeRedis());

  // eslint-disable-next-line no-console
  console.log(`Flirty Greece API listening on :${port}/${prefix}`);
}

function validateJwtSecrets(config: ConfigService) {
  if ((config.get<string>('NODE_ENV') ?? 'development') !== 'production') {
    return;
  }
  const access = config.get<string>('JWT_ACCESS_SECRET') ?? '';
  const refresh = config.get<string>('JWT_REFRESH_SECRET') ?? '';
  if (access.length < 32 || refresh.length < 32) {
    throw new Error(
      'JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be at least 32 characters in production',
    );
  }
}

bootstrap();
