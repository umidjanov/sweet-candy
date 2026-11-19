import { UserRole, UserStatus } from '@prisma/client';

export interface TokenPayload {
  userId: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  sellerId?: string;
  email?: string | null;
}

export interface AuthUser extends TokenPayload {
  firstName: string;
  lastName: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

