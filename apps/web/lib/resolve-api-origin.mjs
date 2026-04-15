const LOCAL_API_ORIGIN = 'http://localhost:3000';

function normalizeApiOrigin(rawValue) {
  if (typeof rawValue !== 'string') {
    return null;
  }

  const trimmedValue = rawValue.trim();

  if (!trimmedValue) {
    return null;
  }

  const withProtocol =
    trimmedValue.startsWith('http://') || trimmedValue.startsWith('https://')
      ? trimmedValue
      : `https://${trimmedValue}`;

  return withProtocol.replace(/\/+$/, '');
}

export function resolveApiOrigin() {
  const configuredOrigin = normalizeApiOrigin(process.env.NEXT_PUBLIC_API_URL);

  if (configuredOrigin) {
    return configuredOrigin;
  }

  const railwayBackendOrigin = normalizeApiOrigin(
    process.env.RAILWAY_SERVICE_BACKEND_URL,
  );

  if (railwayBackendOrigin) {
    return railwayBackendOrigin;
  }

  const isRailwayEnvironment = Boolean(
    process.env.RAILWAY_PROJECT_ID ||
      process.env.RAILWAY_SERVICE_NAME ||
      process.env.RAILWAY_ENVIRONMENT,
  );

  if (process.env.NODE_ENV === 'production' && isRailwayEnvironment) {
    throw new Error(
      'Missing NEXT_PUBLIC_API_URL or RAILWAY_SERVICE_BACKEND_URL for the frontend API proxy.',
    );
  }

  return LOCAL_API_ORIGIN;
}
