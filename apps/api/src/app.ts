import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import apiRouter from './routes';
import { errorHandler } from './middleware/errorHandler';
import { uploadDir } from './middleware/upload';
import { env, isDatabaseConfigured, isVercelRuntime } from './config/env';
import { prisma } from './config/database';
import { ensureAppReady } from './bootstrap';

const app = express();

// Trust Vercel / reverse-proxy headers so req.protocol & req.get('host') reflect HTTPS
app.set('trust proxy', 1);

// Security middleware (allow embedding inside Telegram WebView / iframe and cross-origin image access)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    frameguard: false,
    contentSecurityPolicy: false,
  })
);

app.use(
  cors({
    origin: (_origin, callback) => {
      callback(null, true);
    },
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Bypass-Tunnel-Reminder',
      'bypass-tunnel-reminder',
    ],
  })
);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded static files from local disk first, then fall back to PostgreSQL storage (serverless persistence)
app.use('/uploads', express.static(uploadDir));
app.get('/uploads/:filename', async (req, res, next) => {
  try {
    const safeFilename = path.basename(req.params.filename);
    const file = await prisma.uploadedFile.findUnique({
      where: { filename: safeFilename },
    });

    if (!file) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Image not found' } });
    }

    res.setHeader('Content-Type', file.mimeType || 'image/jpeg');
    res.setHeader('Content-Length', String(file.size));
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return res.status(200).send(Buffer.from(file.data));
  } catch (err) {
    return next(err);
  }
});

async function buildHealthPayload() {
  let dbConnected = false;
  let dbError: string | undefined;

  if (isDatabaseConfigured || !isVercelRuntime) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbConnected = true;
    } catch (err: any) {
      dbError = err?.message || 'Database unreachable';
    }
  } else {
    dbError = 'DATABASE_URL environment variable is not configured in Vercel';
  }

  return {
    status: dbConnected ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    service: 'sweet-candy-api',
    runtime: isVercelRuntime ? 'vercel-serverless' : 'node-server',
    databaseConfigured: isDatabaseConfigured,
    databaseConnected: dbConnected,
    telegramBotConfigured: Boolean(process.env.TELEGRAM_BOT_TOKEN || env.TELEGRAM_BOT_TOKEN),
    detectedEnvKeys: Object.keys(process.env).filter((k) =>
      /^(DATABASE|POSTGRES|STORAGE|NEON|TELEGRAM|ADMIN|JWT)_/i.test(k)
    ),
    ...(dbError ? { dbError } : {}),
  };
}

// Root info & health check
app.get('/', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'sweet-candy-api',
    docs: '/api/v1',
    health: '/health',
  });
});

app.get('/health', async (_req, res) => {
  const payload = await buildHealthPayload();
  res.status(payload.databaseConnected ? 200 : 503).json(payload);
});

app.get('/api/v1/health', async (_req, res) => {
  const payload = await buildHealthPayload();
  res.status(payload.databaseConnected ? 200 : 503).json(payload);
});

// Ensure serverless cold-start initialization (admin, categories, cloud Telegram webhook)
app.use('/api/v1', async (req, _res, next) => {
  const host = req.get('x-forwarded-host') || req.get('host');
  const proto = req.get('x-forwarded-proto') || req.protocol;
  const origin =
    host && !host.includes('localhost') && !host.includes('127.0.0.1')
      ? `${proto || 'https'}://${host}`
      : undefined;

  await ensureAppReady(origin);
  next();
});

// Mount v1 REST API
app.use('/api/v1', apiRouter);

// Centralized error handling
app.use(errorHandler);

export default app;
