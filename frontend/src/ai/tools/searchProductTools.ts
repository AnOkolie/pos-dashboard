import { z } from "zod";
import type { TamboTool } from "@tambo-ai/react";
import type { JSONSchema7 } from "json-schema";

const SearchProductsInputZ = z.object({
  query: z.string().min(1),
});

const SearchProductsOutputZ = z.object({
  success: z.boolean(),
  query: z.string(),
  message: z.string(),
  data: z.unknown().optional(),
});

const SearchProductsInputSchema: JSONSchema7 = {
  type: "object",
  additionalProperties: false,
  properties: {
    query: { type: "string" },
  },
  required: ["query"],
};

const SearchProductsOutputSchema: JSONSchema7 = {
  type: "object",
  additionalProperties: false,
  properties: {
    success: { type: "boolean" },
    query: { type: "string" },
    message: { type: "string" },
    data: {},
  },
  required: ["success", "query", "message"],
};

export const searchProductsTool: TamboTool<any, any, []> = {
  name: "search_products",
  description:
    "Search for store products by name. Use this when you need a product ID.",

  tool: async (params: unknown) => {
    const { query } = SearchProductsInputZ.parse(params);

    const res = await fetch(
      `/api/inventory/products?name=${encodeURIComponent(query)}`,
    );

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return SearchProductsOutputZ.parse({
        success: false,
        query,
        message: errText || `Search failed (status ${res.status})`,
      });
    }

    const contentType = res.headers.get("content-type") ?? "";
    const data = contentType.includes("application/json")
      ? await res.json()
      : await res.text().catch(() => "");

    return SearchProductsOutputZ.parse({
      success: true,
      query,
      message: `Found results for "${query}".`,
      data,
    });
  },

  inputSchema: SearchProductsInputSchema,
  outputSchema: SearchProductsOutputSchema,
};
