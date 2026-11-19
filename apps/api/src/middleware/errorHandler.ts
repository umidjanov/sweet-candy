import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) {
  console.error('Unhandled API Error:', {
    method: req.method,
    url: req.originalUrl,
    error: err?.message || err,
    stack: process.env.NODE_ENV === 'development' ? err?.stack : undefined,
  });

  if (err.type === 'entity.parse.failed') {
    return sendError(res, 'Malformed JSON payload', 400, 'INVALID_JSON');
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'An unexpected internal server error occurred';
  const code = err.code || 'INTERNAL_SERVER_ERROR';

  return sendError(res, message, statusCode, code);
}

