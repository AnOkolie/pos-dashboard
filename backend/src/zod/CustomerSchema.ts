import { z } from "zod";

export const CustomerProfileSchema = z.object({
  name: z.string(),
  loyaltyPoints: z.number(),
  totalSpent: z.number(),
  purchases: z.array(
    z.object({
      date: z.string(),
      total: z.number(),
      branch: z.string(),
    }),
  ),
});
