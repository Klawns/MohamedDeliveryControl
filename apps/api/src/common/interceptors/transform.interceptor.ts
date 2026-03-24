import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  data: T;
  meta?: any;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T> | T> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T> | T> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest();

    // Check for v=2 in query or x-api-version=2 in headers
    const isV2 = req.query.v === '2' || req.headers['x-api-version'] === '2';

    return next.handle().pipe(
      map((res) => {
        // Se NÃO for v2, retorna o payload nativo sem interferência
        if (!isV2) {
          return res;
        }

        // --- LÓGICA V2 (Padronização) ---
        
        // Se já está no formato esperado, ou é null/undefined
        if (res && res.data !== undefined) {
          return res;
        }

        // Transformar listas paginadas (como retorna "rides", "total" etc)
        // Isso é meio empírico mas cobre o padrão atual
        if (res && typeof res === 'object') {
          const { rides, total, hasNextPage, nextCursor, ...otherProps } = res as any;
          if (rides !== undefined) {
            return {
              data: rides,
              meta: {
                total,
                hasNextPage,
                nextCursor,
                ...otherProps
              }
            };
          }
          
          if (res.clients !== undefined) {
            const { clients, total, ...others } = res as any;
            return {
              data: clients,
              meta: { total, ...others }
            };
          }
        }

        // Para arrays diretos ou retornos de objeto simples
        return {
          data: res,
        };
      }),
    );
  }
}
