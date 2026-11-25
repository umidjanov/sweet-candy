import { describe, it, expect, vi } from 'vitest';
import { hashPassword, comparePassword } from '../src/utils/password';
import { signAccessToken, verifyAccessToken, signRefreshToken, verifyRefreshToken } from '../src/utils/jwt';
import { customerRegisterSchema, sellerRegisterSchema, loginSchema, changePasswordSchema, adminResetPasswordSchema } from '../src/validators/auth.validator';
import { verifyEmailAddress } from '../src/utils/email-verify';
import { AuthService } from '../src/services/auth.service';
import { AdminService } from '../src/services/admin.service';
import { prisma } from '../src/config/database';
import { requireRole } from '../src/middleware/auth';
import { Request, Response } from 'express';

describe('SweetMarket Security & Authentication Suite', () => {
  it('should securely hash passwords with bcrypt and correctly verify matches and mismatches', async () => {
    const plain = 'SuperSecretPass2026!';
    const hash = await hashPassword(plain);

    expect(hash).not.toBe(plain);
    expect(hash.startsWith('$2')).toBe(true);

    const matches = await comparePassword(plain, hash);
    expect(matches).toBe(true);

    const wrongMatches = await comparePassword('InvalidPass123', hash);
    expect(wrongMatches).toBe(false);
  });

  it('should sign and verify JWT access and refresh tokens with correct payload identity', () => {
    const payload = {
      userId: 'uuid-1234-customer',
      phone: '+998901234567',
      role: 'CUSTOMER' as const,
      status: 'ACTIVE' as const,
      email: 'customer@sweetmarket.uz',
    };

    const accessToken = signAccessToken(payload);
    expect(typeof accessToken).toBe('string');

    const decoded = verifyAccessToken(accessToken);
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.role).toBe('CUSTOMER');
    expect(decoded.phone).toBe(payload.phone);

    const refreshToken = signRefreshToken({ userId: payload.userId });
    expect(typeof refreshToken).toBe('string');

    const decodedRefresh = verifyRefreshToken(refreshToken);
    expect(decodedRefresh.userId).toBe(payload.userId);
  });

  it('should validate and enforce customer registration password matching', () => {
    const mismatched = customerRegisterSchema.safeParse({
      firstName: 'Dilshod',
      lastName: 'Karimov',
      phone: '+998901234567',
      password: 'Password123!',
      confirmPassword: 'DifferentPassword!',
    });
    expect(mismatched.success).toBe(false);

    const valid = customerRegisterSchema.safeParse({
      firstName: 'Dilshod',
      lastName: 'Karimov',
      phone: '+998901234567',
      password: 'Password123!',
      confirmPassword: 'Password123!',
    });
    expect(valid.success).toBe(true);
  });

  it('should validate seller registration required fields (storeName, description, address)', () => {
    const invalidSeller = sellerRegisterSchema.safeParse({
      firstName: 'Malika',
      lastName: 'Alieva',
      phone: '+998907654321',
      password: 'BakeryPass123!',
      confirmPassword: 'BakeryPass123!',
      // Missing storeName, description, address, serviceArea
    });
    expect(invalidSeller.success).toBe(false);

    const validSeller = sellerRegisterSchema.safeParse({
      firstName: 'Malika',
      lastName: 'Alieva',
      phone: '+998907654321',
      password: 'BakeryPass123!',
      confirmPassword: 'BakeryPass123!',
      storeName: 'Sweet Petals Bakery',
      description: 'Artisan macarons and custom wedding cakes made daily.',
      address: 'Mirabad 14, Tashkent',
      serviceArea: 'Tashkent city',
    });
    expect(validSeller.success).toBe(true);
  });

  it('should validate login credentials schema', () => {
    const invalid = loginSchema.safeParse({ phone: '', password: '' });
    expect(invalid.success).toBe(false);

    const valid = loginSchema.safeParse({ phone: '+998901234567', password: 'Password123!' });
    expect(valid.success).toBe(true);
  });

  it('should enforce role-based access control (RBAC) middleware', () => {
    const adminOnlyMiddleware = requireRole('ADMIN');

    // Customer attempting admin action -> 403 Forbidden
    const customerReq = {
      user: { userId: '1', role: 'CUSTOMER', phone: '+998901234567', status: 'ACTIVE' },
    } as unknown as Request;

    const mockRes = () => {
      const res: any = {};
      res.status = vi.fn().mockReturnValue(res);
      res.json = vi.fn().mockReturnValue(res);
      return res;
    };

    const resForbidden = mockRes();
    const nextFn = vi.fn();

    adminOnlyMiddleware(customerReq, resForbidden as Response, nextFn);
    expect(resForbidden.status).toHaveBeenCalledWith(403);
    expect(nextFn).not.toHaveBeenCalled();

    // Admin attempting admin action -> next() called
    const adminReq = {
      user: { userId: '2', role: 'ADMIN', phone: '+998900000000', status: 'ACTIVE' },
    } as unknown as Request;

    const resSuccess = mockRes();
    const nextSuccess = vi.fn();

    adminOnlyMiddleware(adminReq, resSuccess as Response, nextSuccess);
    expect(nextSuccess).toHaveBeenCalled();
  });

  it('should verify email format, detect common domain typos, and normalize email', async () => {
    const empty = await verifyEmailAddress('   ', { skipDns: true });
    expect(empty.validFormat).toBe(false);
    expect(empty.reason).toBe('EMPTY');

    const badFormat = await verifyEmailAddress('not-an-email', { skipDns: true });
    expect(badFormat.validFormat).toBe(false);
    expect(badFormat.reason).toBe('INVALID_FORMAT');

    const typo = await verifyEmailAddress('Student@Gmial.com ', { skipDns: true });
    expect(typo.normalized).toBe('student@gmial.com');
    expect(typo.validFormat).toBe(true);
    expect(typo.domainValid).toBe(false);
    expect(typo.reason).toBe('TYPO_DOMAIN');
    expect(typo.suggestion).toBe('student@gmail.com');

    const valid = await verifyEmailAddress('  Ali@Gmail.COM ', { skipDns: true });
    expect(valid.normalized).toBe('ali@gmail.com');
    expect(valid.validFormat).toBe(true);
    expect(valid.domainValid).toBe(true);
    expect(valid.reason).toBe('OK');
  });

  it('should validate adminResetPasswordSchema and reset user password securely', async () => {
    expect(adminResetPasswordSchema.safeParse({ password: '123' }).success).toBe(false);
    expect(adminResetPasswordSchema.safeParse({ password: 'Sweet2026!' }).success).toBe(true);

    const findSpy = vi.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce({
      id: 'student-1',
      phone: '+998901112233',
      email: 'student@gmail.com',
      role: 'CUSTOMER',
    } as any);

    const updateSpy = vi.spyOn(prisma.user, 'update').mockResolvedValueOnce({
      id: 'student-1',
      firstName: 'Ali',
      lastName: 'Valiyev',
      phone: '+998901112233',
      email: 'student@gmail.com',
      role: 'CUSTOMER',
      status: 'ACTIVE',
      mustChangePassword: true,
    } as any);

    const revokeSpy = vi.spyOn(prisma.refreshToken, 'updateMany').mockResolvedValueOnce({ count: 1 } as any);
    const auditSpy = vi.spyOn(prisma.auditLog, 'create').mockResolvedValueOnce({ id: 'log-1' } as any);

    const result = await AdminService.resetUserPassword('admin-1', 'student-1', 'Sweet2026!', '127.0.0.1');

    expect(findSpy).toHaveBeenCalledWith({ where: { id: 'student-1' } });
    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'student-1' },
        data: expect.objectContaining({
          mustChangePassword: true,
          passwordHash: expect.stringMatching(/^\$2/),
        }),
      })
    );
    expect(revokeSpy).toHaveBeenCalledWith({ where: { userId: 'student-1' }, data: { revoked: true } });
    expect(auditSpy).toHaveBeenCalled();
    expect(result.mustChangePassword).toBe(true);

    findSpy.mockRestore();
    updateSpy.mockRestore();
    revokeSpy.mockRestore();
    auditSpy.mockRestore();
  });

  it('should check email availability cleanly via AuthService.checkEmail', async () => {
    const findFirstSpy = vi.spyOn(prisma.user, 'findFirst').mockResolvedValueOnce({ id: 'u-1' } as any);
    const existingRes = await AuthService.checkEmail('fayzulloh@gmail.com');
    expect(existingRes.email).toBe('fayzulloh@gmail.com');
    expect(existingRes.exists).toBe(true);
    expect(existingRes.available).toBe(false);
    findFirstSpy.mockRestore();
  });
});
