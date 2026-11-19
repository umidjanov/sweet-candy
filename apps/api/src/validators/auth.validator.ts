import { z } from 'zod';

const phoneRegex = /^\+?[0-9\s\-()]{8,20}$/;

export const customerRegisterSchema = z
  .object({
    firstName: z.string().trim().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().trim().min(2, 'Last name must be at least 2 characters'),
    phone: z.string().trim().regex(phoneRegex, 'Invalid phone number format. Example: +998901234567'),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const sellerRegisterSchema = z
  .object({
    firstName: z.string().trim().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().trim().min(2, 'Last name must be at least 2 characters'),
    phone: z.string().trim().regex(phoneRegex, 'Invalid phone number format. Example: +998901234567'),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Please confirm your password'),
    storeName: z.string().trim().min(3, 'Store name must be at least 3 characters'),
    description: z.string().trim().min(10, 'Store description must be at least 10 characters'),
    address: z.string().trim().min(5, 'Store address is required'),
    city: z.string().trim().default('Tashkent'),
    serviceArea: z.string().trim().min(3, 'Service area is required (e.g. Tashkent, Mirabad district)'),
    publicPhone: z.string().trim().regex(phoneRegex, 'Invalid public phone').optional().or(z.literal('')),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const loginSchema = z
  .object({
    phone: z.string().trim().optional(),
    email: z.string().trim().optional(),
    identifier: z.string().trim().optional(),
    password: z.string().min(1, 'Password is required'),
  })
  .refine((data) => !!(data.phone || data.email || data.identifier), {
    message: 'Phone number or email is required',
    path: ['phone'],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    confirmNewPassword: z.string().min(8, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'New passwords do not match',
    path: ['confirmNewPassword'],
  });

