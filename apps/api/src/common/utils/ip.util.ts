/**
 * Normalizes an IP address, handling IPv6-mapped IPv4 addresses.
 * @param ip The IP address to normalize.
 * @returns The normalized IP address.
 */
export function normalizeIp(ip: string | undefined): string {
  if (!ip) return '';

  if (ip === '::1') return '127.0.0.1';

  if (ip.startsWith('::ffff:')) {
    return ip.substring(7);
  }

  return ip;
}

interface RequestIpContext {
  ip?: string;
  socket?: {
    remoteAddress?: string;
  };
  app?: {
    get?: (name: string) => unknown;
  };
}

/**
 * Extracts the client IP conservatively.
 * It only trusts request.ip when Express trust proxy is explicitly enabled.
 */
export function getClientIp(request: RequestIpContext): string {
  const trustProxy = request.app?.get?.('trust proxy');
  const shouldUseForwardedIp =
    trustProxy !== undefined && trustProxy !== false && trustProxy !== 0;

  if (shouldUseForwardedIp && request.ip) {
    return normalizeIp(request.ip);
  }

  return normalizeIp(request.socket?.remoteAddress || request.ip);
}
