import { getClientIp, normalizeIp } from './ip.util';

describe('ip.util', () => {
  it('should normalize ipv6 localhost', () => {
    expect(normalizeIp('::1')).toBe('127.0.0.1');
  });

  it('should use the socket address when trust proxy is disabled', () => {
    const request = {
      ip: '203.0.113.10',
      socket: { remoteAddress: '::ffff:127.0.0.1' },
      app: {
        get: jest.fn().mockReturnValue(false),
      },
    };

    expect(getClientIp(request)).toBe('127.0.0.1');
  });

  it('should use request.ip when trust proxy is enabled', () => {
    const request = {
      ip: '::ffff:198.51.100.24',
      socket: { remoteAddress: '::ffff:127.0.0.1' },
      app: {
        get: jest.fn().mockReturnValue(1),
      },
    };

    expect(getClientIp(request)).toBe('198.51.100.24');
  });
});
