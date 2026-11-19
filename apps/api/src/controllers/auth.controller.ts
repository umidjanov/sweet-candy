import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { sendSuccess, sendError } from '../utils/response';
import { prisma } from '../config/database';

export class AuthController {
  static async registerCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.registerCustomer(req.body);
      return sendSuccess(res, result, 'Customer registered successfully', 201);
    } catch (err: any) {
      return sendError(res, err.message, 400, 'REGISTRATION_FAILED');
    }
  }

  static async registerSeller(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.registerSeller(req.body);
      return sendSuccess(res, result, 'Seller registered successfully. Store submitted for approval.', 201);
    } catch (err: any) {
      return sendError(res, err.message, 400, 'SELLER_REGISTRATION_FAILED');
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const identifier = req.body.phone || req.body.email || req.body.identifier;
      const { password } = req.body;
      const result = await AuthService.login(identifier, password);

      // Set HttpOnly refresh token cookie (4 hours session lifetime)
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 4 * 60 * 60 * 1000,
      });

      return sendSuccess(res, result, 'Logged in successfully');
    } catch (err: any) {
      return sendError(res, err.message, 401, 'LOGIN_FAILED');
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
      if (!refreshToken) {
        return sendError(res, 'Refresh token required', 401, 'MISSING_REFRESH_TOKEN');
      }

      const result = await AuthService.rotateRefreshToken(refreshToken);

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return sendSuccess(res, result, 'Token refreshed');
    } catch (err: any) {
      return sendError(res, err.message, 401, 'REFRESH_FAILED');
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
      if (refreshToken) {
        await AuthService.logout(refreshToken);
      }
      res.clearCookie('refreshToken');
      return sendSuccess(res, null, 'Logged out successfully');
    } catch (err: any) {
      next(err);
    }
  }

  static async me(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return sendError(res, 'Unauthenticated', 401, 'UNAUTHORIZED');
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          email: true,
          role: true,
          status: true,
          mustChangePassword: true,
          sellerProfile: true,
          customerProfile: true,
        },
      });

      return sendSuccess(res, user);
    } catch (err) {
      next(err);
    }
  }

  static async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return sendError(res, 'Unauthenticated', 401, 'UNAUTHORIZED');
      }

      const { currentPassword, newPassword } = req.body;
      await AuthService.changePassword(req.user.userId, currentPassword, newPassword);

      return sendSuccess(res, null, 'Password changed successfully');
    } catch (err: any) {
      return sendError(res, err.message, 400, 'PASSWORD_CHANGE_FAILED');
    }
  }
}

