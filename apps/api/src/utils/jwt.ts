import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { TokenPayload } from '../types/auth';

export function signAccessToken(payload: TokenPayload): string {
  const options: SignOptions = {
    expiresIn: (env.JWT_ACCESS_EXPIRATION as any) || '15m',
  };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
}

export function signRefreshToken(payload: { userId: string }): string {
  const options: SignOptions = {
    expiresIn: (env.JWT_REFRESH_EXPIRATION as any) || '7d',
  };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, options);
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string): { userId: string } {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as { userId: string };
}
