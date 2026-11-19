import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().trim().min(2, 'Category name must be at least 2 characters'),
  slug: z.string().trim().min(2, 'Slug must be at least 2 characters'),
  description: z.string().trim().optional(),
  imageUrl: z.string().url().optional(),
  parentId: z.string().uuid().optional().nullable(),
  displayOrder: z.coerce.number().int().default(0),
});

export const updateCategorySchema = createCategorySchema.partial();

