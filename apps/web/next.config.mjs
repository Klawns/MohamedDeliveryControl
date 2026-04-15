import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveApiOrigin } from './lib/resolve-api-origin.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname, '../../'),
  async rewrites() {
    const apiUrl = resolveApiOrigin();

    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/:path*`,
      },
      {
        source: '/payments/webhook',
        destination: `${apiUrl}/payments/webhook`,
      },
    ];
  },
};

export default nextConfig;
