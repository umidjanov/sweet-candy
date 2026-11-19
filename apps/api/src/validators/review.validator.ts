import { z } from 'zod';

export const createReviewSchema = z.object({
  orderId: z.string().uuid('Valid order ID is required'),
  productId: z.string().uuid('Valid product ID is required'),
  rating: z.coerce.number().int().min(1).max(5, 'Rating must be between 1 and 5'),
  comment: z.string().trim().min(5, 'Review comment must be at least 5 characters'),
  imageUrl: z.string().url().optional(),
});

