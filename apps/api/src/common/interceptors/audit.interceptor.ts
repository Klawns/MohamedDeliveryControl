/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Audit logging reads heterogeneous Nest request/response payloads at runtime. */
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AUDIT_KEY, AuditOptions } from '../decorators/audit.decorator';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger('AuditInterceptor');

  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const handler = context.getHandler();
    const auditOptions = this.reflector.get<AuditOptions>(AUDIT_KEY, handler);

    if (!auditOptions) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const { method, url, user } = request;
    const userId = user?.id || 'anonymous';
    const actionName = auditOptions.action || handler.name;

    this.logger.log(
      `[AUDIT] Iniciando: Usuário ${userId} chamando ${method} ${url} (Ação: ${actionName})`,
    );

    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        this.logger.log(
          `[AUDIT] Sucesso: ${actionName} finalizado para o usuário ${userId} em ${duration}ms`,
        );
      }),
      catchError((err) => {
        const duration = Date.now() - startTime;
        this.logger.error(
          `[AUDIT] Falha: ${actionName} falhou para o usuário ${userId} após ${duration}ms. Erro: ${err.message}`,
        );
        return throwError(() => err);
      }),
    );
  }
}
