// frontend/src/ai/tools/loyaltyPointsTool.ts
import { z } from "zod";
import type { TamboTool } from "@tambo-ai/react";
import type { JSONSchema7 } from "json-schema";

const LoyaltyInputZ = z
  .object({
    customerId: z.number().int().positive().optional(),
    customerName: z.string().min(1).optional(),
  })
  .passthrough()
  .refine((v) => !!v.customerId || !!v.customerName, {
    message: "Provide customerId or customerName",
  });

const CustomerRowZ = z.object({
  id: z.number(),
  name: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  loyaltyPoints: z.number().optional().nullable(),

  loyalty_points: z.number().optional().nullable(),
});

const LoyaltyOutputZ = z.object({
  success: z.boolean(),
  message: z.string(),
  data: CustomerRowZ.optional(),
});

const LoyaltyInputSchema: JSONSchema7 = {
  type: "object",
  additionalProperties: true,
  properties: {
    customerId: { type: "number" },
    customerName: { type: "string" },
  },
  oneOf: [{ required: ["customerId"] }, { required: ["customerName"] }],
};

const LoyaltyOutputSchema: JSONSchema7 = {
  type: "object",
  additionalProperties: false,
  properties: {
    success: { type: "boolean" },
    message: { type: "string" },
    data: {
      type: "object",
      additionalProperties: true,
    },
  },
  required: ["success", "message"],
};

async function fetchJsonMaybe(res: Response) {
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) return res.json();
  return res.text();
}

async function resolveCustomerIdByName(
  customerName: string,
): Promise<number | null> {
  const res = await fetch(
    `/api/customers/search?name=${encodeURIComponent(customerName)}`,
  );
  if (!res.ok) return null;

  const payload = await fetchJsonMaybe(res);

  const results = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as any)?.results)
      ? (payload as any).results
      : [];

  if (!results.length) return null;

  const first = results[0];
  const id = Number(first?.id);
  return Number.isFinite(id) && id > 0 ? id : null;
}

async function fetchCustomerById(customerId: number) {
  const res = await fetch(`/api/customers/${customerId}`);
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(
      errText || `Failed to fetch customer (status ${res.status})`,
    );
  }

  const raw = await fetchJsonMaybe(res);
  const parsed = CustomerRowZ.passthrough().parse(raw);

  const points =
    (parsed as any).loyaltyPoints ?? (parsed as any).loyalty_points ?? 0;

  return {
    ...parsed,
    loyaltyPoints: Number(points) || 0,
  };
}

export const loyaltyPointsTool: TamboTool<any, any, []> = {
  name: "customer_loyalty_points",
  description:
    "Look up a customer's loyalty points. Provide customerId or customerName. Uses real data only.",

  inputSchema: LoyaltyInputSchema,
  outputSchema: LoyaltyOutputSchema,

  tool: async (params: unknown) => {
    const input = LoyaltyInputZ.parse(params);

    try {
      let customerId = input.customerId ?? null;

      if (!customerId && input.customerName) {
        customerId = await resolveCustomerIdByName(input.customerName);
        console.log("id is: " + customerId);
        if (!customerId) {
          return LoyaltyOutputZ.parse({
            success: false,
            message: `No customer found matching "${input.customerName}".`,
          });
        }
      }

      if (!customerId) {
        return LoyaltyOutputZ.parse({
          success: false,
          message: "Missing customerId/customerName.",
        });
      }

      const customer = await fetchCustomerById(customerId);

      return LoyaltyOutputZ.parse({
        success: true,
        message: `${customer.name ?? `Customer #${customer.id}`} has ${customer.loyaltyPoints ?? 0} loyalty points.`,
        data: customer,
      });
    } catch (e: any) {
      return LoyaltyOutputZ.parse({
        success: false,
        message: e?.message ?? "Failed to fetch loyalty points.",
      });
    }
  },
};

export const loyaltyTools = [loyaltyPointsTool];
