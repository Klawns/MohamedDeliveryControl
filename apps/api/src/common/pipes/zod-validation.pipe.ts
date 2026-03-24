import {
  PipeTransform,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { ZodSchema } from 'zod';

export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown, metadata: ArgumentMetadata) {
    if (metadata.type === 'body') {
      console.log(`[ZodValidationPipe] Validando body para ${metadata.metatype?.name || 'unknown'}:`, JSON.stringify(value, null, 2));
    }

    try {
      const parsedValue = this.schema.parse(value);
      return parsedValue;
    } catch (error: any) {
      if (error.errors) {
        console.error(`[ZodValidationPipe] Erro de validação:`, JSON.stringify(error.errors, null, 2));
      }

      const messages = error.errors
        ? error.errors.map((e: any) => `${e.path.join('.') || 'campo'}: ${e.message}`)
        : ['Falha na validação'];

      throw new BadRequestException({
        message: messages,
        error: 'Bad Request',
        statusCode: 400,
      }, {
        cause: error,
        description: 'Dados de entrada inválidos',
      });
    }
  }
}
