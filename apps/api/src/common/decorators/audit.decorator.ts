import { AppLogger } from '../utils/logger.singleton';

/**
 * Decorator para auditar chamadas de métodos.
 * Registra quem chamou, quando e com quais parâmetros.
 */
export function Audit() {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    const logger = AppLogger.getInstance();

    descriptor.value = function (...args: any[]) {
      const className = target.constructor.name;
      logger.log(
        `[AUDIT] Chamando ${className}.${propertyKey} com argumentos: ${JSON.stringify(args)}`,
      );

      const result = originalMethod.apply(this, args);

      if (result instanceof Promise) {
        return result
          .then((res) => {
            logger.log(
              `[AUDIT] ${className}.${propertyKey} finalizado com sucesso.`,
            );
            return res;
          })
          .catch((err) => {
            logger.error(
              `[AUDIT] ${className}.${propertyKey} falhou com erro: ${err.message}`,
            );
            throw err;
          });
      }

      logger.log(`[AUDIT] ${className}.${propertyKey} finalizado.`);
      return result;
    };

    return descriptor;
  };
}
