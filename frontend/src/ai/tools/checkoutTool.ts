import { z } from "zod";
import type { TamboTool } from "@tambo-ai/react";
import type { JSONSchema7 } from "json-schema";

const CheckoutInputZ = z.object({
  cartId: z.number().int().positive(),
});

const CheckoutOutputZ = z.object({
  success: z.boolean(),
  cartId: z.number(),
  message: z.string(),
  // optionally return backend payload too
  data: z.unknown().optional(),
});

const CheckoutInputSchema: JSONSchema7 = {
  type: "object",
  additionalProperties: false,
  properties: {
    cartId: { type: "number" },
  },
  required: ["cartId"],
};

const CheckoutOutputSchema: JSONSchema7 = {
  type: "object",
  additionalProperties: false,
  properties: {
    success: { type: "boolean" },
    cartId: { type: "number" },
    message: { type: "string" },
    data: {}, // allow anything (JSONSchema7 "any" style)
  },
  required: ["success", "cartId", "message"],
};

export const checkoutCartTool: TamboTool<any, any, []> = {
  name: "checkout_cart",
  description: "Checkout a shopping cart by cartId.",

  tool: async (params: unknown) => {
    const { cartId } = CheckoutInputZ.parse(params);

    const res = await fetch(`/api/cart/${cartId}/checkout`, { method: "POST" });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return CheckoutOutputZ.parse({
        success: false,
        cartId,
        message: errText || `Checkout failed (status ${res.status})`,
      });
    }

    // backend might return json or empty; handle both
    const contentType = res.headers.get("content-type") ?? "";
    const data = contentType.includes("application/json")
      ? await res.json()
      : await res.text().catch(() => "");

    return CheckoutOutputZ.parse({
      success: true,
      cartId,
      message: `Checked out cart ${cartId}.`,
      data,
    });
  },

  inputSchema: CheckoutInputSchema,
  outputSchema: CheckoutOutputSchema,
};
