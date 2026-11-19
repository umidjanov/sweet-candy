import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().trim().min(3, 'Product name must be at least 3 characters'),
  categoryId: z.string().uuid('Valid category ID is required'),
  description: z.string().trim().min(10, 'Description must be at least 10 characters'),
  price: z.coerce.number().positive('Price must be greater than 0'),
  currency: z.string().default('UZS'),
  preparationTimeHours: z.coerce.number().int().min(1, 'Preparation time must be at least 1 hour'),
  portionSize: z.string().nullable().optional(),
  weightGrams: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : val),
    z.coerce.number().int().positive().optional()
  ),
  minimumQuantity: z.coerce.number().int().min(1).default(1),
  availabilityStatus: z
    .enum(['AVAILABLE', 'UNAVAILABLE', 'OUT_OF_STOCK', 'PRE_ORDER_ONLY'])
    .default('AVAILABLE'),
  ingredients: z
    .array(
      z.object({
        name: z.string().trim().min(1, 'Ingredient name cannot be empty'),
        isAllergen: z.boolean().default(false),
      })
    )
    .optional()
    .default([]),
  imageUrls: z.array(z.string().url('Must be a valid URL')).optional().default([]),
});

export const updateProductSchema = createProductSchema.partial();

export const productQuerySchema = z.object({
  q: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  sellerId: z.string().uuid().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  rating: z.coerce.number().optional(),
  city: z.string().optional(),
  sort: z.enum(['newest', 'lowest_price', 'highest_price', 'popular', 'rating']).default('newest'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

