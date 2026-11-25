import { Response } from 'express';

if (!(BigInt.prototype as any).toJSON) {
  (BigInt.prototype as any).toJSON = function () {
    return this.toString();
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    [key: string]: any;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200,
  meta?: ApiResponse['meta']
): Response {
  const payload: ApiResponse<T> = {
    success: true,
    data,
    ...(message && { message }),
    ...(meta && { meta }),
  };
  return res.status(statusCode).json(payload);
}

export function sendError(
  res: Response,
  message: string,
  statusCode = 400,
  code = 'BAD_REQUEST',
  details?: any
): Response {
  const isDbMissing = String(message || '').includes('Environment variable not found: DATABASE_URL');
  const finalStatus = isDbMissing ? 503 : statusCode;
  const finalCode = isDbMissing ? 'DATABASE_NOT_CONFIGURED' : code;
  const finalMessage = isDbMissing
    ? 'Vercel-da bulutli baza (DATABASE_URL) ulanmagan. Vercel -> Storage -> Neon Postgres ulab, Redeploy qiling.'
    : message;

  const payload: ApiResponse = {
    success: false,
    error: {
      code: finalCode,
      message: finalMessage,
      ...(details && { details }),
    },
  };
  return res.status(finalStatus).json(payload);
}

