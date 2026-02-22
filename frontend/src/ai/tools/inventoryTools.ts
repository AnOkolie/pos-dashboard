import { z } from "zod";
import type { TamboTool } from "@tambo-ai/react";
import type { JSONSchema7 } from "json-schema";

const GetInventoryInputZ = z.object({
  productId: z.number().int().positive(),
});

const GetInventoryOutputZ = z.object({
  success: z.boolean(),
  productId: z.number(),
  message: z.string(),
  data: z.unknown().optional(),
});

const GetInventoryInputSchema: JSONSchema7 = {
  type: "object",
  additionalProperties: false,
  properties: {
    productId: { type: "number" },
  },
  required: ["productId"],
};

const GetInventoryOutputSchema: JSONSchema7 = {
  type: "object",
  additionalProperties: false,
  properties: {
    success: { type: "boolean" },
    productId: { type: "number" },
    message: { type: "string" },
    data: {},
  },
  required: ["success", "productId", "message"],
};

export const getInventoryTool: TamboTool<any, any, []> = {
  name: "get_inventory",
  description: "Check inventory level of a product by productId.",

  tool: async (params: unknown) => {
    const { productId } = GetInventoryInputZ.parse(params);

    const res = await fetch(`/api/inventory/products/${productId}`);
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return GetInventoryOutputZ.parse({
        success: false,
        productId,
        message: errText || `Failed (status ${res.status})`,
      });
    }

    const contentType = res.headers.get("content-type") ?? "";
    const data = contentType.includes("application/json")
      ? await res.json()
      : await res.text().catch(() => "");

    return GetInventoryOutputZ.parse({
      success: true,
      productId,
      message: `Fetched inventory for product ${productId}.`,
      data,
    });
  },

  inputSchema: GetInventoryInputSchema,
  outputSchema: GetInventoryOutputSchema,
};
