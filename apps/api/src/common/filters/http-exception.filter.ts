import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';

type RequestWithCorrelationId = Request & {
  reqId?: string;
  raw?: {
    id?: string;
  };
};

interface ExceptionResponseBody {
  message?: string | string[];
  error?: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);
  constructor(private configService: ConfigService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<RequestWithCorrelationId>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const isProduction = this.configService.get('NODE_ENV') === 'production';

    // Correlation ID from pino-http
    const correlationIdValue = request.id ?? request.reqId ?? request.raw?.id;
    const correlationId =
      typeof correlationIdValue === 'string' ? correlationIdValue : undefined;

    let message: string | string[] = 'Internal server error';
    let errorType = 'Internal Server Error';

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        const responseBody = exceptionResponse as ExceptionResponseBody;
        message = responseBody.message || exception.message;
        errorType = responseBody.error || exception.name;
      } else {
        message = exceptionResponse;
        errorType = exception.name;
      }
    } else {
      // Log unhandled errors with stack trace
      this.logger.error(
        `[UnhandledException] ${request.method} ${request.url} [ID:${correlationId}]`,
        exception instanceof Error ? exception.stack : exception,
      );
    }

    // Se for erro crítico (>=500) em produção, sanitiza a mensagem
    if (isProduction && status >= 500) {
      message =
        'Ocorreu um erro interno de processamento. Por favor, forneça o correlationId para suporte.';
      errorType = 'Critical Error';
    }

    // Sanitização adicional para 401/403 em produção para evitar leaking de lógica
    if (
      isProduction &&
      (status === 401 || status === 403) &&
      typeof message === 'string'
    ) {
      message = status === 401 ? 'Não autorizado' : 'Acesso negado';
    }

    response.status(status).json({
      statusCode: status,
      error: errorType,
      message,
      correlationId, // Importante para suporte e auditoria
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
