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
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let errorType = 'Internal Error';

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
        `Unhandled exception at ${request.url}: ${exception.message}`,
        exception.stack,
      );
      message = exception.message; // or restrict to 'Internal Server Error' in production
    }

    // Always log client bad requests or unexpected errors
    if (status >= 500) {
      this.logger.error(
        `[${request.method}] ${request.url} - ${status} - ${JSON.stringify(message)}`,
      );
    } else {
      this.logger.warn(
        `[${request.method}] ${request.url} - ${status} - ${JSON.stringify(message)}`,
      );
    }

    // This matches the frontend expectations from apps/web/lib/api-error.ts:
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
