const ERROR_MESSAGES: Record<string, string> = {
  'Plano n\u00e3o encontrado.':
    'Seu plano nao foi encontrado. Entre em contato com o suporte.',
  'Plano nao encontrado.':
    'Seu plano nao foi encontrado. Entre em contato com o suporte.',
  'Seu periodo gratuito de 7 dias expirou. Assine para continuar.':
    'Seu periodo gratuito expirou. Assine para continuar usando as funcionalidades do sistema.',
  Unauthorized: 'Sessao expirada. Faca login novamente.',
  Forbidden: 'Voce nao tem permissao para realizar esta acao.',
};

interface ApiErrorResponse {
  message?: string | string[];
  error?: string;
  statusCode?: number;
  data?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object';
}

function mapFriendlyMessage(message: string) {
  return ERROR_MESSAGES[message] || message;
}

function extractMessage(payload: unknown): string | null {
  if (!isRecord(payload)) {
    return null;
  }

  const candidate = payload.message ?? payload.error;

  if (Array.isArray(candidate)) {
    const messages = candidate.filter(
      (item): item is string => typeof item === 'string',
    );

    return messages.length > 0 ? messages.join(', ') : null;
  }

  return typeof candidate === 'string' ? mapFriendlyMessage(candidate) : null;
}

function extractResponseData(error: unknown): ApiErrorResponse | null {
  if (!isRecord(error) || !isRecord(error.response)) {
    return null;
  }

  const data = error.response.data;
  return isRecord(data) ? (data as ApiErrorResponse) : null;
}

export function getApiErrorStatus(error: unknown): number | null {
  if (!isRecord(error) || !isRecord(error.response)) {
    return null;
  }

  const status = error.response.status;

  if (typeof status === 'number') {
    return status;
  }

  const responseData = extractResponseData(error);
  return typeof responseData?.statusCode === 'number'
    ? responseData.statusCode
    : null;
}

export function isApiErrorStatus(error: unknown, status: number) {
  return getApiErrorStatus(error) === status;
}

export function parseApiError(
  error: unknown,
  fallback = 'Ocorreu um erro inesperado. Tente novamente.',
): string {
  if (!error) {
    return fallback;
  }

  const responseData = extractResponseData(error);
  const responseMessage =
    extractMessage(responseData) || extractMessage(responseData?.data);

  if (responseMessage) {
    return responseMessage;
  }

  if (error instanceof Error) {
    return mapFriendlyMessage(error.message);
  }

  if (typeof error === 'string') {
    return mapFriendlyMessage(error);
  }

  return fallback;
}
