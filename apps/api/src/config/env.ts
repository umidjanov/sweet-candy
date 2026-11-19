import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env from project root or apps/api
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('4000').transform(Number),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  API_URL: z.string().default('http://localhost:4000'),
  NEXT_PUBLIC_APP_URL: z.string().default('http://localhost:3000'),
  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET must be at least 16 chars'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 chars'),
  JWT_ACCESS_EXPIRATION: z.string().default('4h'),
  JWT_REFRESH_EXPIRATION: z.string().default('4h'),
  ADMIN_EMAIL: z.string().email().default('fayzullohumidjanov@gmail.com'),
  ADMIN_INITIAL_PASSWORD: z.string().min(8).default('AdminSecurePassword2026!'),
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_BOT_USERNAME: z.string().optional().default('SweetMarketBot'),
  UPLOAD_DIR: z.string().default('./uploads'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables configuration:', parsed.error.format());
  // For resilience during dev setup with mock DB, we provide safe fallbacks
}

export const env = parsed.success
  ? parsed.data
  : {
      NODE_ENV: 'development' as const,
      PORT: 4000,
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://sweetmarket:sweetmarket_pass@localhost:5432/sweetmarket_db?schema=public',
      API_URL: process.env.API_URL || 'http://localhost:4000',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'sweetmarket_fallback_access_secret_2026_jwt_token',
      JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'sweetmarket_fallback_refresh_secret_2026_jwt_token',
      JWT_ACCESS_EXPIRATION: '15m',
      JWT_REFRESH_EXPIRATION: '7d',
      ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'fayzullohumidjanov@gmail.com',
      ADMIN_INITIAL_PASSWORD: process.env.ADMIN_INITIAL_PASSWORD || 'AdminSecurePassword2026!',
      TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',
      TELEGRAM_BOT_USERNAME: process.env.TELEGRAM_BOT_USERNAME || 'SweetMarketBot',
      UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
    };

