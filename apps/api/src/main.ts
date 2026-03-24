import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { Request, Response, NextFunction } from 'express';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // Registro de Interceptor e Filtro Globais
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  // Habilita confiança no proxy (essencial para Railway/Render/Vercel lerem HTTPS e IPs corretamente)
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  const frontendUrl = process.env.FRONTEND_URL;
  if (!frontendUrl && process.env.NODE_ENV === 'production') {
    throw new Error('FRONTEND_URL must be defined');
  }

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      const allowed = [frontendUrl, 'http://localhost:3000']
        .filter(Boolean)
        .map((u) => u!.trim().replace(/\/$/, ''));
      if (!origin || allowed.includes(origin.trim().replace(/\/$/, ''))) {
        callback(null, true);
      } else {
        console.error(
          `[CORS] Bloqueado: ${origin}. Permitidos: ${allowed.join(', ')}`,
        );
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });

  app.use(cookieParser());

  // Middleware de diagnóstico
  app.use((req: Request, res: Response, next: NextFunction) => {
    const isProd = process.env.NODE_ENV === 'production';
    const hasAccessToken = !!(
      req.cookies['access_token'] || req.cookies['admin_access_token']
    );
    console.log(
      `[Request] ${req.method} ${req.url} - Origin: ${req.get('origin')} - Has Cookies: ${hasAccessToken}`,
    );
    next();
  });

  const port = process.env.PORT || 3000;
  console.log(`[Bootstrap] Configured PORT: ${process.env.PORT} - Using: ${port}`);
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
