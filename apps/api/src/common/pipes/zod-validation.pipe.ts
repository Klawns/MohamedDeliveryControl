/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Zod validation errors are dynamic runtime objects at this framework boundary. */
import {
  PipeTransform,
  ArgumentMetadata,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ZodSchema } from 'zod';

export class ZodValidationPipe implements PipeTransform {
  private readonly logger = new Logger(ZodValidationPipe.name);
  constructor(private schema: ZodSchema) {}

  transform(value: unknown, metadata: ArgumentMetadata) {
    if (metadata.type === 'body') {
      this.logger.debug(
        `Validando body para ${metadata.metatype?.name || 'unknown'}`,
      );
    }

    try {
      const parsedValue = this.schema.parse(value);
      return parsedValue;
    } catch (error: any) {
      if (error.errors) {
        this.logger.error('Erro de validação', {
          fields: error.errors.map((e: any) => e.path.join('.')),
        });
      }

      const messages = error.errors
        ? error.errors.map(
            (e: any) => `${e.path.join('.') || 'campo'}: ${e.message}`,
          )
        : ['Falha na validação'];

      throw new BadRequestException(
        {
          message: messages,
          error: 'Bad Request',
          statusCode: 400,
        },
        {
          cause: error,
          description: 'Dados de entrada inválidos',
        },
      );
    }
  }
}
