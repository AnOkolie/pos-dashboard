import { z } from "zod";
import type { TamboTool } from "@tambo-ai/react";
import type { JSONSchema7 } from "json-schema";
import { saveCartId } from "../../../lib/cartSession";

const CreateCartInputZ = z.object({
  branchId: z.number().int().positive().optional(),
  customerId: z.number().int().positive().optional(),
});

const CreateCartOutputZ = z.object({
  success: z.boolean(),
  cartId: z.number(),
  message: z.string(),
  data: z.unknown().optional(),
});

const CreateCartInputSchema: JSONSchema7 = {
  type: "object",
  additionalProperties: false,
  properties: {
    branchId: { type: "number" },
    customerId: { type: "number" },
  },
  // NOTE: no required fields
};

const CreateCartOutputSchema: JSONSchema7 = {
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

const normalizeOptionalNumber = (v: unknown): number | undefined => {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
};

export const createCartTool: TamboTool<any, any, []> = {
  name: "create_cart",
  description: "Create a new active cart (guest if customerId not provided).",

  tool: async (params: unknown) => {
    const parsed = CreateCartInputZ.parse(params);
    const branchId = normalizeOptionalNumber(parsed.branchId);
    const customerId = normalizeOptionalNumber(parsed.customerId);

    const body: Record<string, unknown> = {};
    if (branchId !== undefined) body.branchId = branchId;
    if (customerId !== undefined) body.customerId = customerId;
    // Build body WITHOUT nulls

    if (typeof parsed.branchId === "number") body.branchId = parsed.branchId;
    if (typeof parsed.customerId === "number")
      body.customerId = parsed.customerId;

    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return CreateCartOutputZ.parse({
        success: false,
        cartId: -1,
        message: errText || `Create cart failed (status ${res.status})`,
      });
    }

    const data = await res.json();
    const cartId = Number(data.id ?? data.cartId ?? data.cart_id);

    if (Number.isFinite(cartId)) saveCartId(cartId);

    return CreateCartOutputZ.parse({
      success: true,
      cartId,
      message: `Created cart ${cartId}.`,
      data,
    });
  },

  inputSchema: CreateCartInputSchema,
  outputSchema: CreateCartOutputSchema,
};
