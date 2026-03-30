export interface ICacheProvider {
  /**
   * Recupera um valor do cache.
   * @param key Chave de busca
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Armazena um valor no cache.
   * @param key Chave de armazenamento
   * @param value Valor a ser armazenado
   * @param ttlSeconds Tempo de vida em segundos (opcional)
   */
  set(key: string, value: unknown, ttlSeconds?: number): Promise<void>;

  /**
   * Remove uma chave específica do cache.
   * @param key Chave a ser removida
   */
  del(key: string): Promise<void>;

  /**
   * Busca e remove uma chave de forma atômica (Redis GETDEL).
   * @param key Chave a ser buscada e removida
   */
  getDel<T>(key: string): Promise<T | null>;

  /**
   * Invalida todas as chaves que começam com um prefixo.
   * @param prefix Prefixo das chaves (ex: 'users:*')
   */
  invalidatePrefix(prefix: string): Promise<void>;
}

export const CACHE_PROVIDER = Symbol('CACHE_PROVIDER');
