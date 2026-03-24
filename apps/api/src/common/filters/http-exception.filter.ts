import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let errorType = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse() as any;

      if (typeof exceptionResponse === 'object') {
        message = exceptionResponse.message || exception.message;
        errorType = exceptionResponse.error || exception.name;
      } else {
        message = exceptionResponse;
        errorType = exception.name;
      }
    } else if (exception instanceof Error) {
      this.logger.error(
        `[Unhandled] ${request.method} ${request.url}: ${exception.message}`,
        exception.stack,
      );
      message = exception.message;
    }

    if (status >= 500) {
      this.logger.error(`[Error] ${request.method} ${request.url} - ${status}`, exception);
    }

    // Este formato é idêntico ao esperado pelo `api-error.ts` no frontend:
    // interface ApiErrorResponse { message?: string | string[]; error?: string; statusCode?: number; }
    response.status(status).json({
      statusCode: status,
      error: errorType,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
