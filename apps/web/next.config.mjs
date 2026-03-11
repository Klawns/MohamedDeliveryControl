/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    // URL da API (usado como destino do proxy)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/:path*`,
      },
    ];
  },
}

export default nextConfig
