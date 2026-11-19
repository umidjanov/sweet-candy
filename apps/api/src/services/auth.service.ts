import crypto from 'crypto';
import { prisma } from '../config/database';
import { env } from '../config/env';
import { hashPassword, comparePassword } from '../utils/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { TokenPayload } from '../types/auth';

export class AuthService {
  /**
   * Secure initial administrator setup
   */
  static async bootstrapAdmin() {
    try {
      const existingAdmin = await prisma.user.findFirst({
        where: {
          OR: [{ email: env.ADMIN_EMAIL }, { role: 'ADMIN' }],
        },
      });

      if (existingAdmin) {
        console.log(`[Admin Bootstrap] Administrator already present (${existingAdmin.email || existingAdmin.phone}).`);
        return;
      }

      console.log(`[Admin Bootstrap] Creating initial administrator for ${env.ADMIN_EMAIL}...`);
      const hashedPassword = await hashPassword(env.ADMIN_INITIAL_PASSWORD);

      await prisma.user.create({
        data: {
          firstName: 'Platform',
          lastName: 'Administrator',
          email: env.ADMIN_EMAIL,
          phone: '+998000000000', // Distinct administrative contact placeholder
          passwordHash: hashedPassword,
          role: 'ADMIN',
          status: 'ACTIVE',
          mustChangePassword: true,
        },
      });

      console.log('✅ [Admin Bootstrap] Administrator account bootstrapped successfully.');
    } catch (error) {
      console.error('❌ [Admin Bootstrap] Failed to bootstrap administrator:', error);
    }
  }

  static async registerCustomer(data: {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    password: string;
  }) {
    const existing = await prisma.user.findUnique({
      where: { phone: data.phone },
    });

    if (existing) {
      throw new Error('A user with this phone number already exists.');
    }

    if (data.email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email: data.email },
      });
      if (existingEmail) {
        throw new Error('A user with this email address already exists.');
      }
    }

    const hashedPassword = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        email: data.email || null,
        passwordHash: hashedPassword,
        role: 'CUSTOMER',
        status: 'ACTIVE',
        customerProfile: {
          create: {},
        },
        cart: {
          create: {},
        },
      },
      include: {
        customerProfile: true,
      },
    });

    const tokenPayload: TokenPayload = {
      userId: user.id,
      phone: user.phone,
      role: user.role,
      status: user.status,
      email: user.email,
    };

    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = await this.createRefreshToken(user.id);

    return {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        email: user.email,
        role: user.role,
        status: user.status,
      },
      accessToken,
      refreshToken,
    };
  }

  static async registerSeller(data: {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    password: string;
    storeName: string;
    description: string;
    address: string;
    city?: string;
    serviceArea: string;
    publicPhone?: string;
  }) {
    const existing = await prisma.user.findUnique({
      where: { phone: data.phone },
    });

    if (existing) {
      throw new Error('A user with this phone number already exists.');
    }

    const hashedPassword = await hashPassword(data.password);

    // Generate slug from store name
    const baseSlug = data.storeName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const slug = `${baseSlug}-${randomSuffix}`;

    const user = await prisma.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        email: data.email || null,
        passwordHash: hashedPassword,
        role: 'SELLER',
        status: 'ACTIVE',
        sellerProfile: {
          create: {
            storeName: data.storeName,
            slug,
            description: data.description,
            address: data.address,
            city: data.city || 'Tashkent',
            serviceArea: data.serviceArea,
            publicPhone: data.publicPhone || data.phone,
            approvalStatus: 'PENDING',
          },
        },
      },
      include: {
        sellerProfile: true,
      },
    });

    // Notify admins about new seller application
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'SELLER_APPLICATION',
        title: 'New Seller Application',
        message: `Store "${data.storeName}" has submitted an application for verification.`,
      },
    });

    const tokenPayload: TokenPayload = {
      userId: user.id,
      phone: user.phone,
      role: user.role,
      status: user.status,
      sellerId: user.sellerProfile?.id,
      email: user.email,
    };

    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = await this.createRefreshToken(user.id);

    return {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        email: user.email,
        role: user.role,
        status: user.status,
        sellerProfile: user.sellerProfile,
      },
      accessToken,
      refreshToken,
    };
  }

  static async login(phone: string, plainTextPassword: string) {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ phone }, { email: phone }],
      },
      include: {
        sellerProfile: true,
      },
    });

    if (!user) {
      throw new Error('Invalid phone number or password.');
    }

    if (user.status === 'SUSPENDED') {
      throw new Error('Account suspended. Please contact platform administration.');
    }

    const isValid = await comparePassword(plainTextPassword, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid phone number or password.');
    }

    const tokenPayload: TokenPayload = {
      userId: user.id,
      phone: user.phone,
      role: user.role,
      status: user.status,
      sellerId: user.sellerProfile?.id,
      email: user.email,
    };

    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = await this.createRefreshToken(user.id);

    return {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        email: user.email,
        role: user.role,
        status: user.status,
        mustChangePassword: user.mustChangePassword,
        sellerProfile: user.sellerProfile,
      },
      accessToken,
      refreshToken,
    };
  }

  static async rotateRefreshToken(oldRefreshToken: string) {
    const decoded = verifyRefreshToken(oldRefreshToken);
    const tokenHash = crypto.createHash('sha256').update(oldRefreshToken).digest('hex');

    const storedToken = await prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!storedToken || storedToken.revoked || storedToken.expiresAt < new Date()) {
      throw new Error('Invalid or expired refresh token.');
    }

    // Revoke used refresh token
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revoked: true },
    });

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { sellerProfile: true },
    });

    if (!user || user.status === 'SUSPENDED') {
      throw new Error('User inactive or suspended.');
    }

    const tokenPayload: TokenPayload = {
      userId: user.id,
      phone: user.phone,
      role: user.role,
      status: user.status,
      sellerId: user.sellerProfile?.id,
      email: user.email,
    };

    const newAccessToken = signAccessToken(tokenPayload);
    const newRefreshToken = await this.createRefreshToken(user.id);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  static async logout(refreshToken: string) {
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: { revoked: true },
    });
  }

  static async changePassword(userId: string, currentPass: string, newPass: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found.');

    const isValid = await comparePassword(currentPass, user.passwordHash);
    if (!isValid) throw new Error('Incorrect current password.');

    const newHash = await hashPassword(newPass);
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newHash,
        mustChangePassword: false,
      },
    });

    // Revoke all existing sessions upon password change
    await prisma.refreshToken.updateMany({
      where: { userId },
      data: { revoked: true },
    });
  }

  private static async createRefreshToken(userId: string): Promise<string> {
    const token = signRefreshToken({ userId });
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    // Refresh token valid for 4 hours session lifetime
    const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    return token;
  }
}

