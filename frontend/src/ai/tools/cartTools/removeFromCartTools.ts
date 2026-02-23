import { z } from "zod";
import type { TamboTool } from "@tambo-ai/react";
import type { JSONSchema7 } from "json-schema";
import { getOrCreateCartId } from "../../../lib/cartSession";

const RemoveItemInputZ = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive().optional(),
});

const RemoveItemOutputZ = z.object({
  success: z.boolean(),
  cartId: z.number(),
  message: z.string(),
  data: z.unknown().optional(),
});

const RemoveItemInputSchema: JSONSchema7 = {
  type: "object",
  additionalProperties: false,
  properties: {
    productId: { type: "number" },
    quantity: { type: "number" },
  },
  required: ["productId"],
};

const RemoveItemOutputSchema: JSONSchema7 = {
  type: "object",
  additionalProperties: false,
  properties: {
    success: { type: "boolean" },
    cartId: { type: "number" },
    message: { type: "string" },
    data: {},
  },
  required: ["success", "cartId", "message"],
};

export const removeFromCartTool: TamboTool<any, any, []> = {
  name: "remove_from_cart",
  description:
    "Decrease quantity of a product in the current cart (removes item if quantity reaches 0).",

  tool: async (params: unknown) => {
    const { productId, quantity } = RemoveItemInputZ.parse(params);
    const cartId = await getOrCreateCartId(1);

    const res = await fetch(`/api/cart/${cartId}/items/${productId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: quantity ?? 1 }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return RemoveItemOutputZ.parse({
        success: false,
        cartId,
        message: errText || `Failed (status ${res.status})`,
      });
    }

    const data = await res.json().catch(() => undefined);

    return RemoveItemOutputZ.parse({
      success: true,
      cartId,
      message: `Removed ${quantity ?? 1} of product ${productId} from cart ${cartId}.`,
      data,
    });
  },

  inputSchema: RemoveItemInputSchema,
  outputSchema: RemoveItemOutputSchema,
};
