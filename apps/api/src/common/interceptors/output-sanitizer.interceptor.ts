/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Output sanitization walks arbitrary JSON payloads by design. */
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * OutputSanitizerInterceptor
 * Interceptor global de segurança que remove campos sensíveis de QUALQUER resposta JSON.
 * Atua como uma última linha de defesa (Defense in Depth).
 */
@Injectable()
export class OutputSanitizerInterceptor implements NestInterceptor {
  // Lista de campos que NUNCA devem sair na resposta JSON
  private readonly BANNED_FIELDS = [
    'password',
    'passwordHash',
    'hash',
    'salt',
    'secret',
    'apiKey',
    'webhookSecret',
    'internalKey',
    'creditCard',
    'cvv',
    'token',
    'refreshToken',
    'accessToken',
    'authToken',
    'privateKey',
    'credentials',
    'ssn',
    'cpf',
    'cnpj',
  ];

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(map((data) => this.sanitize(data)));
  }

  private sanitize(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    if (data instanceof Date) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitize(item));
    }

    const sanitizedData = { ...data };

    for (const key in sanitizedData) {
      if (
        this.BANNED_FIELDS.some((field) =>
          key.toLowerCase().includes(field.toLowerCase()),
        )
      ) {
        delete sanitizedData[key];
      } else if (typeof sanitizedData[key] === 'object') {
        sanitizedData[key] = this.sanitize(sanitizedData[key]);
      }
    }

    return sanitizedData;
  }
}
