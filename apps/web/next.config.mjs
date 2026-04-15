/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  async rewrites() {
    // URL da API (usado como destino do proxy)
    let apiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000").trim();

    // Garante que a URL tenha o protocolo (essencial para o Next.js build não falhar)
    if (apiUrl && !apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
      apiUrl = `https://${apiUrl}`;
    }

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
}

export default nextConfig
