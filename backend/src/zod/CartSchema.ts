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
