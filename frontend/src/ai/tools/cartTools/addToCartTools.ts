import { z } from "zod";
import type { TamboTool } from "@tambo-ai/react";
import type { JSONSchema7 } from "json-schema";
import { ensureActiveCartId } from "../../../lib/cartSession";

/* =========================
   Zod Schemas
========================= */

const AddToCartInputZ = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive(),
});

const AddToCartOutputZ = z.object({
  success: z.boolean(),
  cartId: z.number(),
  message: z.string(),
});

const AddToCartInputSchema: JSONSchema7 = {
  type: "object",
  additionalProperties: false,
  properties: {
    productId: { type: "number" },
    quantity: { type: "number" },
  },
  required: ["productId", "quantity"],
};

const AddToCartOutputSchema: JSONSchema7 = {
  type: "object",
  additionalProperties: false,
  properties: {
    success: { type: "boolean" },
    cartId: { type: "number" },
    message: { type: "string" },
  },
  required: ["success", "cartId", "message"],
};

export async function addToCart(productId: number, quantity: number) {
  const cartId = await ensureActiveCartId(1);

  const res = await fetch(`/api/cart/${cartId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId, quantity }),
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  return cartId;
}

export const addToCartTool: TamboTool<any, any, []> = {
  name: "addToCart",
  description: "Add a product to the current user's shopping cart.",

  tool: async (params: unknown) => {
    const { productId, quantity } = AddToCartInputZ.parse(params);

    try {
      const cartId = await addToCart(productId, quantity);

      return AddToCartOutputZ.parse({
        success: true,
        cartId,
        message: `Added product ${productId} (qty ${quantity}) to cart ${cartId}.`,
      });
    } catch (err) {
      return AddToCartOutputZ.parse({
        success: false,
        cartId: -1,
        message: "Failed to add item to cart.",
      });
    }
  },

  inputSchema: AddToCartInputSchema,
  outputSchema: AddToCartOutputSchema,
};
