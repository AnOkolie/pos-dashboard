import { z } from "zod";
export const SalesChartSchema = z.array(
  z.object({
    productName: z.string(),
    totalSold: z.number(),
    revenue: z.number(),
  }),
);
