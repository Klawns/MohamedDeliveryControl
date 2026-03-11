import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // Habilita confiança no proxy (essencial para Railway/Render/Vercel lerem HTTPS e IPs corretamente)
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  const frontendUrl = process.env.FRONTEND_URL;
  if (!frontendUrl && process.env.NODE_ENV === 'production') {
    throw new Error('FRONTEND_URL must be defined');
  }

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      const allowed = [frontendUrl, 'http://localhost:3000'].map(u => u?.replace(/\/$/, ''));
      if (!origin || allowed.includes(origin.replace(/\/$/, ''))) {
        callback(null, true);
      } else {
        console.error(`[CORS] Bloqueado: ${origin}. Permitidos: ${allowed.join(', ')}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });

  app.use(cookieParser());

  // Middleware de diagnóstico para o Railway
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (process.env.NODE_ENV === 'production') {
      const hasAccessToken = !!(req.cookies['access_token'] || req.cookies['admin_access_token']);
      console.log(`[Request] ${req.method} ${req.url} - Origin: ${req.get('origin')} - Has Cookies: ${hasAccessToken}`);
    }
    next();
  });

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
