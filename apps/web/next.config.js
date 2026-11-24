/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['tailwind-merge', 'clsx', 'lucide-react'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  async rewrites() {
    const backendTarget =
      process.env.BACKEND_URL ||
      (process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes('localhost')
        ? process.env.NEXT_PUBLIC_API_URL
        : 'https://conviction-life-oven-samples.trycloudflare.com');
    if (backendTarget) {
      const cleanBase = backendTarget.replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '');
      return [
        {
          source: '/api/v1/:path*',
          destination: `${cleanBase}/api/v1/:path*`,
        },
        {
          source: '/uploads/:path*',
          destination: `${cleanBase}/uploads/:path*`,
        },
      ];
    }
    return [];
  },
};

module.exports = nextConfig;

