import { z } from "zod";

export const InventoryStatusSchema = z.object({
  productName: z.string(),
  branchName: z.string(),
  quantity: z.number(),
});

export const InventoryStatusFullSchema = z.object({
  productName: z.string(),
  branches: z.array(
    z.object({
      branchName: z.string(),
      stock: z.number(),
    }),
  ),
});
