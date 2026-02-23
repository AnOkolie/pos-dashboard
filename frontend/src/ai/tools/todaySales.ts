// frontend/src/ai/tools/todaySales.ts
import { z } from "zod";
import type { TamboTool } from "@tambo-ai/react";
import type { JSONSchema7 } from "json-schema";

// Accept anything (Tambo may add internal keys), we don't need params anyway
const TodaySalesInputZ = z.looseObject({});

// Backend returns: [{ name, totalSold, revenue }, ...]
const TodaySalesRowZ = z.object({
  name: z.string(),
  totalSold: z.coerce.number(), // handles number/string
  revenue: z.coerce.number(),
});

const TodaySalesOutputZ = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.array(TodaySalesRowZ).optional(),
});

const TodaySalesInputSchema: JSONSchema7 = {
  type: "object",
  // allow extra keys Tambo may add:
  additionalProperties: true,
};

const TodaySalesOutputSchema: JSONSchema7 = {
  type: "object",
  additionalProperties: false,
  properties: {
    success: { type: "boolean" },
    message: { type: "string" },
    data: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          totalSold: { type: "number" },
          revenue: { type: "number" },
        },
        required: ["name", "totalSold", "revenue"],
      },
    },
  },
  required: ["success", "message"],
};

export const todaySalesTool: TamboTool<any, any, []> = {
  name: "today_sales",
  description: "Retrieve today's sales report.",

  inputSchema: TodaySalesInputSchema,
  outputSchema: TodaySalesOutputSchema,

  tool: async (params: unknown) => {
    // Don't be strict — Tambo can pass extra keys.
    TodaySalesInputZ.parse(params);

    const res = await fetch("/api/reports/sales/today");
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return TodaySalesOutputZ.parse({
        success: false,
        message:
          errText || `Failed to fetch today's sales (status ${res.status})`,
      });
    }

    const rowsRaw = await res.json();
    const rows = z.array(TodaySalesRowZ).parse(rowsRaw);

    const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
    const totalUnits = rows.reduce((s, r) => s + r.totalSold, 0);

    return TodaySalesOutputZ.parse({
      success: true,
      message: `Today's sales: ${totalUnits} units sold, $${totalRevenue.toFixed(2)} revenue.`,
      data: rows,
    });
  },
};
