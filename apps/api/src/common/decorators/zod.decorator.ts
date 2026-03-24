import { Body, Query, Param } from '@nestjs/common';
import { ZodSchema } from 'zod';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe';

/**
 * Decorator to validate the HTTP Body using a Zod schema.
 * Replaces `@Body(new ZodValidationPipe(schema))`.
 */
export const ZodBody = (schema: ZodSchema) => Body(new ZodValidationPipe(schema));

/**
 * Decorator to validate the HTTP Query using a Zod schema.
 * Replaces `@Query(new ZodValidationPipe(schema))`.
 */
export const ZodQuery = (schema: ZodSchema) => Query(new ZodValidationPipe(schema));

/**
 * Decorator to validate a specific HTTP Param using a Zod schema.
 * Replaces `@Param('id', new ZodValidationPipe(schema))`.
 */
export const ZodParam = (param: string, schema: ZodSchema) => Param(param, new ZodValidationPipe(schema));
