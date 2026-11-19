import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import apiRouter from './routes';
import { errorHandler } from './middleware/errorHandler';
import { uploadDir } from './middleware/upload';
import { env } from './config/env';

const app = express();

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

const allowedOrigins = [
  env.NEXT_PUBLIC_APP_URL,
  'http://localhost:3000',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
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

// Serve uploaded static files
app.use('/uploads', express.static(uploadDir));

// Root info & health check
app.get('/', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'sweet-candy-api',
    docs: '/api/v1',
    health: '/health',
  });
});

app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'sweet-candy-api',
  });
});

// Mount v1 REST API
app.use('/api/v1', apiRouter);

// Centralized error handling
app.use(errorHandler);

export default app;
