import { z } from 'zod';

const normalizeOptionalString = (value: unknown) => {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
};

const optionalString = z.preprocess(
  normalizeOptionalString,
  z.string().min(1).optional(),
);

const optionalInt = z.preprocess((value) => {
  if (value === '' || value === undefined || value === null) {
    return undefined;
  }

  return value;
}, z.coerce.number().int().positive().optional());

const optionalBoolString = z.enum(['true', 'false']).optional();

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    FRONTEND_URL: optionalString,
    COOKIE_DOMAIN: optionalString,
    TRUST_PROXY: optionalString,

    ENABLE_DEBUG_ENDPOINTS: z.enum(['true', 'false']).default('false'),
    INTERNAL_DEBUG_KEY: optionalString,
    DEBUG_IP_ALLOWLIST: optionalString,

    DB_PROVIDER: z.preprocess(
      (value) =>
        typeof value === 'string' ? value.trim().toLowerCase() : value,
      z.enum(['postgres', 'sqlite']).default('sqlite'),
    ),
    DB_FALLBACK_TO_SQLITE: z.enum(['true', 'false']).default('false'),
    DATABASE_URL: optionalString,
    DATABASE_AUTH_TOKEN: optionalString,
    POSTGRES_USER: optionalString,
    POSTGRES_PASSWORD: optionalString,
    POSTGRES_DB: optionalString,
    PGUSER: optionalString,
    PGPASSWORD: optionalString,
    PGDATABASE: optionalString,
    PGHOST: optionalString,
    PGPORT: optionalInt,
    POSTGRES_SSL_ENABLED: optionalBoolString,
    POSTGRES_SSL_REJECT_UNAUTHORIZED: optionalBoolString,
    POSTGRES_SSL_CA: optionalString,
    POSTGRES_SSL_CA_BASE64: optionalString,
    POSTGRES_SSL_CERT: optionalString,
    POSTGRES_SSL_CERT_BASE64: optionalString,
    POSTGRES_SSL_KEY: optionalString,
    POSTGRES_SSL_KEY_BASE64: optionalString,

    JWT_SECRET: optionalString,
    JWT_SECRET_CURRENT: optionalString,
    JWT_SECRET_CURRENT_ID: optionalString,
    JWT_SECRET_PREVIOUS: optionalString,
    JWT_SECRET_PREVIOUS_ID: optionalString,
    JWT_ISSUER: optionalString,
    JWT_AUDIENCE: optionalString,

    GOOGLE_CLIENT_ID: optionalString,
    GOOGLE_CLIENT_SECRET: optionalString,
    GOOGLE_CALLBACK_URL: optionalString,

    REDIS_URL: optionalString,
    REDISURL: optionalString,
    REDIS_HOST: optionalString,
    REDISHOST: optionalString,
    REDIS_PORT: optionalInt,
    REDISPORT: optionalInt,
    REDIS_PASSWORD: optionalString,
    REDISPASSWORD: optionalString,
    REDIS_USER: optionalString,
    REDISUSER: optionalString,

    STORAGE_TYPE: z.preprocess(
      (value) =>
        typeof value === 'string' ? value.trim().toUpperCase() : value,
      z.enum(['R2']).default('R2'),
    ),
    R2_ACCOUNT_ID: optionalString,
    R2_ACCESS_KEY_ID: optionalString,
    R2_SECRET_ACCESS_KEY: optionalString,
    R2_BUCKET: optionalString,
    R2_PUBLIC_URL: optionalString,

    WEBHOOK_WINDOW_SECONDS: optionalInt,
  })
  .passthrough()
  .superRefine((env, ctx) => {
    const requireField = (field: string, message: string) => {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [field],
        message,
      });
    };

    const validateUrlList = (raw: string, field: string) => {
      const origins = raw
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean);

      if (origins.length === 0) {
        requireField(field, 'Informe ao menos uma URL valida.');
        return;
      }

      for (const origin of origins) {
        try {
          new URL(origin);
        } catch {
          requireField(field, `URL invalida: ${origin}`);
        }
      }
    };

    const validateUrl = (raw: string, field: string) => {
      try {
        new URL(raw);
      } catch {
        requireField(field, 'Informe uma URL valida.');
      }
    };

    if (!env.JWT_SECRET && !env.JWT_SECRET_CURRENT) {
      requireField(
        'JWT_SECRET_CURRENT',
        'Defina JWT_SECRET_CURRENT ou JWT_SECRET.',
      );
    }

    if (env.JWT_SECRET_CURRENT_ID && !env.JWT_SECRET_CURRENT) {
      requireField(
        'JWT_SECRET_CURRENT',
        'JWT_SECRET_CURRENT e obrigatorio quando JWT_SECRET_CURRENT_ID estiver definido.',
      );
    }

    if (env.JWT_SECRET_PREVIOUS_ID && !env.JWT_SECRET_PREVIOUS) {
      requireField(
        'JWT_SECRET_PREVIOUS',
        'JWT_SECRET_PREVIOUS e obrigatorio quando JWT_SECRET_PREVIOUS_ID estiver definido.',
      );
    }

    if (env.FRONTEND_URL) {
      validateUrlList(env.FRONTEND_URL, 'FRONTEND_URL');
    } else if (env.NODE_ENV === 'production') {
      requireField('FRONTEND_URL', 'FRONTEND_URL e obrigatorio em producao.');
    }

    const debugEnabled = env.ENABLE_DEBUG_ENDPOINTS === 'true';
    if (
      debugEnabled &&
      (!env.INTERNAL_DEBUG_KEY || env.INTERNAL_DEBUG_KEY.length < 16)
    ) {
      requireField(
        'INTERNAL_DEBUG_KEY',
        'INTERNAL_DEBUG_KEY deve ter pelo menos 16 caracteres quando o debug estiver habilitado.',
      );
    }

    if (
      debugEnabled &&
      env.NODE_ENV === 'production' &&
      !env.DEBUG_IP_ALLOWLIST
    ) {
      requireField(
        'DEBUG_IP_ALLOWLIST',
        'DEBUG_IP_ALLOWLIST e obrigatorio quando ENABLE_DEBUG_ENDPOINTS=true em producao.',
      );
    }

    const googleFields = [
      env.GOOGLE_CLIENT_ID,
      env.GOOGLE_CLIENT_SECRET,
      env.GOOGLE_CALLBACK_URL,
    ];

    if (googleFields.some(Boolean) && !googleFields.every(Boolean)) {
      requireField(
        'GOOGLE_CLIENT_ID',
        'GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET e GOOGLE_CALLBACK_URL devem ser definidos juntos.',
      );
    }

    if (env.GOOGLE_CALLBACK_URL) {
      validateUrl(env.GOOGLE_CALLBACK_URL, 'GOOGLE_CALLBACK_URL');
    }

    if (env.DB_PROVIDER === 'sqlite' && !env.DATABASE_URL) {
      requireField(
        'DATABASE_URL',
        'DATABASE_URL e obrigatorio quando DB_PROVIDER=sqlite.',
      );
    }

    if (env.DB_PROVIDER === 'postgres') {
      const hasDetailedConfig = Boolean(
        env.PGHOST &&
        env.PGPORT &&
        (env.POSTGRES_DB || env.PGDATABASE) &&
        (env.POSTGRES_USER || env.PGUSER) &&
        (env.POSTGRES_PASSWORD || env.PGPASSWORD),
      );

      if (!env.DATABASE_URL && !hasDetailedConfig) {
        requireField(
          'DATABASE_URL',
          'Configure DATABASE_URL ou informe PGHOST, PGPORT, POSTGRES_DB/PGDATABASE, POSTGRES_USER/PGUSER e POSTGRES_PASSWORD/PGPASSWORD.',
        );
      }

      const sslEnabled =
        env.POSTGRES_SSL_ENABLED === undefined
          ? env.NODE_ENV === 'production'
          : env.POSTGRES_SSL_ENABLED === 'true';
      const rejectUnauthorized =
        env.POSTGRES_SSL_REJECT_UNAUTHORIZED === undefined
          ? true
          : env.POSTGRES_SSL_REJECT_UNAUTHORIZED === 'true';

      if (env.NODE_ENV === 'production' && sslEnabled && !rejectUnauthorized) {
        requireField(
          'POSTGRES_SSL_REJECT_UNAUTHORIZED',
          'POSTGRES_SSL_REJECT_UNAUTHORIZED=false nao e permitido em producao.',
        );
      }

      if (env.POSTGRES_SSL_CA && env.POSTGRES_SSL_CA_BASE64) {
        requireField(
          'POSTGRES_SSL_CA_BASE64',
          'Use POSTGRES_SSL_CA ou POSTGRES_SSL_CA_BASE64, nao ambos.',
        );
      }

      if (env.POSTGRES_SSL_CERT && env.POSTGRES_SSL_CERT_BASE64) {
        requireField(
          'POSTGRES_SSL_CERT_BASE64',
          'Use POSTGRES_SSL_CERT ou POSTGRES_SSL_CERT_BASE64, nao ambos.',
        );
      }

      if (env.POSTGRES_SSL_KEY && env.POSTGRES_SSL_KEY_BASE64) {
        requireField(
          'POSTGRES_SSL_KEY_BASE64',
          'Use POSTGRES_SSL_KEY ou POSTGRES_SSL_KEY_BASE64, nao ambos.',
        );
      }

      if (
        (env.POSTGRES_SSL_CERT || env.POSTGRES_SSL_CERT_BASE64) &&
        !(env.POSTGRES_SSL_KEY || env.POSTGRES_SSL_KEY_BASE64)
      ) {
        requireField(
          'POSTGRES_SSL_KEY',
          'POSTGRES_SSL_KEY e obrigatorio quando um certificado cliente for informado.',
        );
      }

      if (
        (env.POSTGRES_SSL_KEY || env.POSTGRES_SSL_KEY_BASE64) &&
        !(env.POSTGRES_SSL_CERT || env.POSTGRES_SSL_CERT_BASE64)
      ) {
        requireField(
          'POSTGRES_SSL_CERT',
          'POSTGRES_SSL_CERT e obrigatorio quando uma chave cliente for informada.',
        );
      }
    }

    if (env.STORAGE_TYPE === 'R2') {
      const requiredR2Fields = [
        'R2_ACCOUNT_ID',
        'R2_ACCESS_KEY_ID',
        'R2_SECRET_ACCESS_KEY',
        'R2_BUCKET',
        'R2_PUBLIC_URL',
      ] as const;

      for (const field of requiredR2Fields) {
        if (!env[field]) {
          requireField(field, `${field} e obrigatorio quando STORAGE_TYPE=R2.`);
        }
      }

      if (env.R2_PUBLIC_URL) {
        validateUrl(env.R2_PUBLIC_URL, 'R2_PUBLIC_URL');
      }
    }
  });

export function validateEnv(config: Record<string, unknown>) {
  const parsed = envSchema.safeParse(config);

  if (parsed.success) {
    return parsed.data;
  }

  const message = parsed.error.issues
    .map((issue) => {
      const path = issue.path.join('.') || 'env';
      return `${path}: ${issue.message}`;
    })
    .join('; ');

  throw new Error(`Invalid environment configuration. ${message}`);
}
