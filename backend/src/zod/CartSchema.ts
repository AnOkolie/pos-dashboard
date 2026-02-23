import { z } from "zod";

export const CartSchema = z.object({
  cartId: z.number(),
  items: z.array(
    z.object({
      productName: z.string(),
      quantity: z.number(),
      price: z.number(),
    }),
  ),
  total: z.number(),
});

export const cartItemBodySchema = z.object({
  cart_id: z.number(),
  quantity: z.number().int().positive(),
});

export const createCartBodySchema = z.object({
  branchId: z.number().int().positive().optional(),
  customerId: z.number().int().positive().optional(),
});

export const updateCartBodySchema = z.object({
  quantity: z.number().int().positive(),
  productId: z.number().int().positive(),
});

export const removeFromCartBodySchema = z.object({
  quantity: z.number().int().positive().default(1),
});
