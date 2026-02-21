import { z } from "zod";

export const cartItemBodySchema = z.object({
  cart_id: z.number(),
  quantity: z.number().int().positive(),
});

export const createCartBodySchema = z.object({
  branchId: z.number().int().positive(),
  customerId: z.number().int().positive(),
});

export const updateCartBodySchema = z.object({
  quantity: z.number().int().positive(),
  productId: z.number().int().positive(),
});
