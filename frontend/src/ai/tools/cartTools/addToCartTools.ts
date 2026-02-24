import { z } from "zod";
import type { TamboTool } from "@tambo-ai/react";
import type { JSONSchema7 } from "json-schema";
import { ensureActiveCartId } from "../../../lib/cartSession";

/* =========================
   Zod Schemas
========================= */

const AddToCartInputZ = z.object({
  productName: z.string().min(1),
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
    productName: { type: "string" },
    quantity: { type: "number" },
  },
  required: ["productName", "quantity"],
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
  //const cartId = await ensureActiveCartId(1);
  const cartId = await ensureActiveCartId(1);
  console.log(
    `Attempting to add product ${productId} (qty ${quantity}) to cart ${cartId}`,
  );
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
    const { productName, quantity } = AddToCartInputZ.parse(params);

    const searchRes = await fetch(
      `/api/inventory/product?name=${encodeURIComponent(productName)}`,
    );
    const searchData = await searchRes.json();
    console.log(`Search results for "${productName}":`, searchData?.results);
    const firstMatch = searchData?.results?.[0];

    if (!firstMatch) {
      return AddToCartOutputZ.parse({
        success: false,
        cartId: -1,
        message: `Product "${productName}" not found.`,
      });
    }

    const productId = firstMatch.productId;
    console.log(
      `Found product "${productName}" with ID ${productId}. Adding to cart...`,
    );

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
