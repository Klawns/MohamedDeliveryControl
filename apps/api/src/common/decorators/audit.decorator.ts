import { SetMetadata } from '@nestjs/common';

export const AUDIT_KEY = 'audit_metadata';

export interface AuditOptions {
  /**
   * Nome da ação para o log de auditoria.
   * Se não for fornecido, o nome do método será usado.
   */
  action?: string;

  /**
   * Índices dos argumentos que são seguros para logar.
   * Se não for fornecido, nenhum argumento será logado por segurança.
   * @deprecated Use o interceptor global para logs mais seguros.
   */
  sanitizedFields?: number[];
}

/**
 * Decorator para marcar métodos que devem ser auditados.
 * A lógica de auditoria real é processada pelo AuditInterceptor.
 */
export const Audit = (options: AuditOptions = {}) =>
  SetMetadata(AUDIT_KEY, options);
