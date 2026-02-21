import { serve } from "bun";
import { drizzle } from "drizzle-orm/postgres-js";
import { and, gte, eq, sql, desc } from "drizzle-orm";
import { products } from "../db/schema/product";
import { branches } from "../db/schema/branches";
import { inventory } from "../db/schema/inventory";
import postgres from "postgres";
import { sales } from "../db/schema/sales";
import { saleItems } from "../db/schema/sale_items";
import type { SalesBodyType } from "../types/sales";
import {
  InventoryStatusFullSchema,
  InventoryStatusSchema,
} from "../zod/InventorySchema";
import { customers } from "../db/schema/customers";
import { db } from "../..";

export const getConsumer = async (pathname: string) => {
  const match = pathname.match(/^\/api\/customers\/(\d+)$/);
  const id = match?.[1];

  if (id) {
    const result = await db
      .select()
      .from(customers)
      .where(eq(customers.id, parseInt(id)));

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const getCustomerHistory = async (customerId: number) => {
  const rows = await db
    .select({
      customerName: customers.name,
      loyaltyPoints: customers.loyaltyPoints,
      saleId: sales.id,
      totalAmount: sales.totalAmount,
      createdAt: sales.createdAt,
      productId: saleItems.productId,
      quantity: saleItems.quantity,
      unitPrice: saleItems.unitPrice,
    })
    .from(customers)
    .leftJoin(sales, eq(customers.id, sales.customerId))
    .leftJoin(saleItems, eq(sales.id, saleItems.saleId))
    .where(eq(customers.id, customerId))
    .orderBy(desc(sales.createdAt));

  if (rows.length === 0 || rows[0] === undefined) {
    return new Response("Customer not found", { status: 404 });
  }

  // Group items by sale
  const salesMap = new Map<number, any>();

  for (const row of rows) {
    if (!row.saleId) continue;

    if (!salesMap.has(row.saleId)) {
      salesMap.set(row.saleId, {
        saleId: row.saleId,
        createdAt: row.createdAt,
        totalAmount: row.totalAmount,
        items: [],
      });
    }

    if (row.productId) {
      salesMap.get(row.saleId).items.push({
        productId: row.productId,
        quantity: row.quantity,
        unitPrice: row.unitPrice,
      });
    }
  }

  const totalSpent = Array.from(salesMap.values()).reduce(
    (sum, s) => sum + (s.totalAmount ?? 0),
    0,
  );

  const result = {
    name: rows[0].customerName,
    loyaltyPoints: rows[0].loyaltyPoints,
    totalSpent,
    salesHistory: Array.from(salesMap.values()),
  };

  return Response.json(result);
};
