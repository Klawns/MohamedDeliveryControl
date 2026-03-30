import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { z } from 'zod';

const jwtHeaderSchema = z
  .object({
    kid: z.string().optional(),
  })
  .passthrough();

type SecretCallback = (error: Error | null, secret?: string | Buffer) => void;
type RequestWithCookies = {
  cookies?: Record<string, string | undefined>;
  headers: Record<string, string | string[] | undefined>;
};

function extractCookieToken(req: RequestWithCookies | undefined) {
  if (!req?.cookies) {
    return null;
  }

  const accessCookie = req.cookies['access_token'] ?? null;
  const adminAccessCookie = req.cookies['admin_access_token'] ?? null;

  if (!accessCookie && !adminAccessCookie) {
    return null;
  }

  const csrfHeader = req.headers['x-requested-with'];
  if (!csrfHeader) {
    return null;
  }

  const sessionMode = req.headers['x-session-mode'];
  return sessionMode === 'admin' ? adminAccessCookie : accessCookie;
}

function resolveJwtSecret(
  configService: ConfigService,
  rawJwtToken: string,
): string | Buffer | undefined {
  try {
    const [headerB64] = rawJwtToken.split('.');
    const headerJson = Buffer.from(headerB64 ?? '', 'base64url').toString();
    const parsedHeader = jwtHeaderSchema.safeParse(
      JSON.parse(headerJson) as unknown,
    );
    const kid = parsedHeader.success ? parsedHeader.data.kid : undefined;

    const currentKid = configService.get<string>('JWT_SECRET_CURRENT_ID');
    const previousKid = configService.get<string>('JWT_SECRET_PREVIOUS_ID');

    if (kid && kid === currentKid) {
      return configService.get<string>('JWT_SECRET_CURRENT');
    }

    if (kid && kid === previousKid) {
      return configService.get<string>('JWT_SECRET_PREVIOUS');
    }
  } catch {
    // Fallback below keeps the normal JWT validation path intact.
  }

  return (
    configService.get<string>('JWT_SECRET_CURRENT') ??
    configService.get<string>('JWT_SECRET')
  );
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        extractCookieToken,
      ]),
      ignoreExpiration: false,
      secretOrKeyProvider: (
        _req: RequestWithCookies,
        rawJwtToken: string,
        done: SecretCallback,
      ) => {
        done(null, resolveJwtSecret(configService, rawJwtToken));
      },
      issuer: configService.get<string>('JWT_ISSUER', 'mohamed-delivery-api'),
      audience: configService.get<string>(
        'JWT_AUDIENCE',
        'mohamed-delivery-app',
      ),
    });
  }

  validate(payload: { sub: string; role: 'admin' | 'user' }) {
    return {
      id: payload.sub,
      role: payload.role,
    };
  }
}
