import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { sendError } from '../utils/response';
import { UserRole } from '@prisma/client';
import { prisma } from '../config/database';

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Authentication required. Missing Bearer token.', 401, 'UNAUTHORIZED');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    // Verify user is still active in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { sellerProfile: true },
    });

    if (!user) {
      return sendError(res, 'User account not found', 401, 'USER_NOT_FOUND');
    }

    if (user.status === 'SUSPENDED') {
      return sendError(res, 'Account has been suspended. Please contact support.', 403, 'ACCOUNT_SUSPENDED');
    }

    req.user = {
      userId: user.id,
      phone: user.phone,
      role: user.role,
      status: user.status,
      sellerId: user.sellerProfile?.id,
      email: user.email,
    };

    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 'Token expired. Please refresh your session.', 401, 'TOKEN_EXPIRED');
    }
    return sendError(res, 'Invalid authentication token', 401, 'INVALID_TOKEN');
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401, 'UNAUTHORIZED');
    }

    if (!roles.includes(req.user.role)) {
      return sendError(
        res,
        `Access denied. Requires one of roles: ${roles.join(', ')}`,
        403,
        'FORBIDDEN'
      );
    }

    next();
  };
}

export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { sellerProfile: true },
    });

    if (user && user.status !== 'SUSPENDED') {
      req.user = {
        userId: user.id,
        phone: user.phone,
        role: user.role,
        status: user.status,
        sellerId: user.sellerProfile?.id,
        email: user.email,
      };
    }
  } catch {
    // Ignore invalid tokens for optional auth
  }

  next();
}

