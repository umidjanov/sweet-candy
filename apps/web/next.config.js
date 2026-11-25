/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['tailwind-merge', 'clsx', 'lucide-react'],
  experimental: {
    externalDir: true,
    outputFileTracingIncludes: {
      '/api/**': [
        '../../node_modules/.prisma/client/**/*',
        '../../node_modules/@prisma/client/**/*',
        '../api/prisma/**/*',
      ],
    },
  },
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
  webpack: (config, { isServer }) => {
    if (isServer) {
      const existing = Array.isArray(config.externals)
        ? config.externals
        : config.externals
        ? [config.externals]
        : [];
      config.externals = [
        ...existing,
        'express',
        'cors',
        'helmet',
        'multer',
        'bcryptjs',
        'jsonwebtoken',
        'dotenv',
        '@prisma/client',
        '.prisma/client',
      ];
    }
    return config;
  },
  async rewrites() {
    const explicitBackend = process.env.BACKEND_URL;
    const isExternalProxy =
      Boolean(explicitBackend) ||
      (process.env.NODE_ENV === 'development' && process.env.VERCEL !== '1');

    if (isExternalProxy) {
      const target = (explicitBackend || 'http://localhost:4000')
        .replace(/\/api\/v1\/?$/, '')
        .replace(/\/+$/, '');
      return [
        {
          source: '/api/v1/:path*',
          destination: `${target}/api/v1/:path*`,
        },
        {
          source: '/uploads/:path*',
          destination: `${target}/uploads/:path*`,
        },
      ];
    }

    // Cloud / Vercel unified deployment: route /health & /uploads through integrated Next.js Express API routes
    return [
      {
        source: '/health',
        destination: '/api/health',
      },
      {
        source: '/uploads/:path*',
        destination: '/api/uploads/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
