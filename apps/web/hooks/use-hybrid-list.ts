import { useMemo } from "react";

/**
 * Mantemos a regra simples e deterministica para evitar conflitos com o
 * compiler do React. Se a lista cair abaixo do threshold, voltamos para o
 * renderer direto.
 */
export const VIRTUALIZATION_THRESHOLD = 100;

interface UseHybridListOptions {
  threshold?: number;
  enabled?: boolean;
}

export function useHybridList<T>(
  data: T[],
  options: UseHybridListOptions = {},
) {
  const { threshold = VIRTUALIZATION_THRESHOLD, enabled = true } = options;

  const shouldVirtualize = useMemo(() => {
    if (!enabled) {
      return false;
    }

    return data.length > threshold;
  }, [data.length, enabled, threshold]);

  return {
    isVirtualizing: shouldVirtualize,
    resetVirtualization: () => undefined,
  };
}
