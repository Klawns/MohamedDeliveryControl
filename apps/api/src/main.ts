import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { Logger } from 'nestjs-pino';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

function getTrustProxySetting(rawValue?: string) {
  const raw = rawValue?.trim();

  if (!raw || raw === 'false' || raw === '0') {
    return false;
  }

  if (raw === 'true') {
    return true;
  }

  if (/^\d+$/.test(raw)) {
    return Number(raw);
  }

  return raw;
}

interface ExpressAppLike {
  set(name: string, value: string | number | boolean): void;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
    bufferLogs: true,
  });
  const configService = app.get(ConfigService);

  app.use(helmet());

  const logger = app.get(Logger);
  app.useLogger(logger);
  app.useGlobalInterceptors(new ResponseInterceptor());
  const httpApp = app
    .getHttpAdapter()
    .getInstance() as unknown as ExpressAppLike;
  httpApp.set(
    'trust proxy',
    getTrustProxySetting(configService.get<string>('TRUST_PROXY')),
  );

  const frontendUrl = configService.get<string>('FRONTEND_URL');
  if (!frontendUrl && configService.get<string>('NODE_ENV') === 'production') {
    throw new Error('FRONTEND_URL must be defined');
  }

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      const envUrls = (frontendUrl || '').split(',').map((url) => url.trim());
      const allowed = [
        ...envUrls,
        'http://localhost:3000',
        'http://localhost:5173',
      ]
        .filter(Boolean)
        .map((url) => url.replace(/\/$/, ''));

      const currentOrigin = origin?.replace(/\/$/, '');

      if (!origin || allowed.includes(currentOrigin!)) {
        callback(null, true);
      } else {
        logger.error(
          `[CORS] Bloqueado: ${origin}. Permitidos: ${allowed.join(', ')}`,
        );
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders:
      'Content-Type, Accept, Authorization, X-Requested-With, x-session-mode',
  });

  app.use(cookieParser());

  const port = configService.get<number>('PORT') || 3000;
  logger.log(`[Bootstrap] Configured PORT: ${port}`);
  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}`);
}

void bootstrap();
