import { describe, it, expect, vi } from 'vitest';
import { hashPassword, comparePassword } from '../src/utils/password';
import { signAccessToken, verifyAccessToken, signRefreshToken, verifyRefreshToken } from '../src/utils/jwt';
import { customerRegisterSchema, sellerRegisterSchema, loginSchema, changePasswordSchema } from '../src/validators/auth.validator';
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
});
