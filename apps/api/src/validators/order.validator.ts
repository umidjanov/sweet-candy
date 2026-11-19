import { z } from 'zod';

export const createOrderSchema = z
  .object({
    sellerId: z.string().uuid('Valid seller ID is required'),
    items: z
      .array(
        z.object({
          productId: z.string().uuid('Valid product ID is required'),
          quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
        })
      )
      .min(1, 'Order must contain at least one product'),
    requestedDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Valid requested date is required',
    }),
    requestedTime: z.string().trim().min(2, 'Requested time is required (e.g. 15:00)'),
    deliveryType: z.enum(['DELIVERY', 'PICKUP']),
    deliveryAddress: z.string().trim().optional(),
    customerName: z.string().trim().min(2, 'Customer name is required'),
    customerPhone: z.string().trim().min(7, 'Customer phone number is required'),
    customerMessage: z.string().trim().optional(),
  })
  .refine(
    (data) => {
      if (data.deliveryType === 'DELIVERY' && (!data.deliveryAddress || data.deliveryAddress.trim().length < 5)) {
        return false;
      }
      return true;
    },
    {
      message: 'Delivery address is required when choosing Delivery',
      path: ['deliveryAddress'],
    }
  );

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    'PENDING',
    'ACCEPTED',
    'PREPARING',
    'READY',
    'OUT_FOR_DELIVERY',
    'COMPLETED',
    'REJECTED',
    'CANCELLED',
  ]),
  rejectionReason: z.string().optional(),
  sellerNotes: z.string().optional(),
});

