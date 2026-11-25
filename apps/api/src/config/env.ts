import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env from project root or apps/api (ignored cleanly in serverless when absent)
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../api/.env') });

export function resolveDatabaseUrl(): string | undefined {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL ||
    process.env.STORAGE_PRISMA_URL ||
    process.env.STORAGE_DATABASE_URL ||
    process.env.STORAGE_POSTGRES_URL ||
    process.env.NEON_DATABASE_URL ||
    process.env.DATABASE_POSTGRES_URL ||
    undefined
  );
}

const resolvedDbUrl = resolveDatabaseUrl();
if (resolvedDbUrl && !process.env.DATABASE_URL) {
  process.env.DATABASE_URL = resolvedDbUrl;
}

function resolveVercelOrigin(): string | undefined {
  const prodHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (prodHost) return `https://${prodHost.replace(/^https?:\/\//, '').replace(/\/+$/, '')}`;
  const previewHost = process.env.VERCEL_URL;
  if (previewHost) return `https://${previewHost.replace(/^https?:\/\//, '').replace(/\/+$/, '')}`;
  if (process.env.VERCEL === '1') return 'https://sweet-candy-ten.vercel.app';
  return undefined;
}

const vercelOrigin = resolveVercelOrigin();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('4000').transform(Number),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  API_URL: z.string().default(vercelOrigin || 'http://localhost:4000'),
  NEXT_PUBLIC_APP_URL: z.string().default(vercelOrigin || 'http://localhost:3000'),
  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET must be at least 16 chars'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 chars'),
  JWT_ACCESS_EXPIRATION: z.string().default('4h'),
  JWT_REFRESH_EXPIRATION: z.string().default('4h'),
  ADMIN_EMAIL: z.string().email().default('fayzullohumidjanov@gmail.com'),
  ADMIN_INITIAL_PASSWORD: z.string().min(8).default('AdminSecurePassword2026!'),
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_BOT_USERNAME: z.string().optional().default('sweet_candy_uz_bot'),
  UPLOAD_DIR: z.string().default('./uploads'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.warn('⚠️ Environment configuration fallback active:', JSON.stringify(parsed.error.flatten().fieldErrors));
}

export const isDatabaseConfigured = Boolean(resolveDatabaseUrl());
export const isVercelRuntime = process.env.VERCEL === '1';

export const env = parsed.success
  ? parsed.data
  : {
      NODE_ENV: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
      PORT: Number(process.env.PORT || 4000),
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://sweetmarket:sweetmarket_pass@localhost:5432/sweetmarket_db?schema=public',
      API_URL: process.env.API_URL || vercelOrigin || 'http://localhost:4000',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || vercelOrigin || 'https://sweet-candy-ten.vercel.app',
      JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'sweetmarket_fallback_access_secret_2026_jwt_token',
      JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'sweetmarket_fallback_refresh_secret_2026_jwt_token',
      JWT_ACCESS_EXPIRATION: process.env.JWT_ACCESS_EXPIRATION || '4h',
      JWT_REFRESH_EXPIRATION: process.env.JWT_REFRESH_EXPIRATION || '4h',
      ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'fayzullohumidjanov@gmail.com',
      ADMIN_INITIAL_PASSWORD: process.env.ADMIN_INITIAL_PASSWORD || 'AdminSecurePassword2026!',
      TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',
      TELEGRAM_BOT_USERNAME: process.env.TELEGRAM_BOT_USERNAME || 'sweet_candy_uz_bot',
      UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
    };

/**
 * Resolves the canonical public HTTPS app URL for Telegram Web App buttons & deep links.
 */
export function getPublicAppUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL || env.NEXT_PUBLIC_APP_URL;
  if (configured && configured.startsWith('https://')) {
    return configured.replace(/\/+$/, '');
  }
  return vercelOrigin || 'https://sweet-candy-ten.vercel.app';
}

/**
 * Resolves the canonical public HTTPS API origin when deployed to the cloud.
 */
export function getPublicApiOrigin(): string {
  const configured = process.env.API_URL || env.API_URL;
  if (configured && configured.startsWith('https://') && !configured.includes('trycloudflare.com') && !configured.includes('loca.lt')) {
    return configured.replace(/\/+$/, '');
  }
  return vercelOrigin || 'https://sweet-candy-ten.vercel.app';
}
