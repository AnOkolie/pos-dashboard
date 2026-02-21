import { serve } from "bun";
import { drizzle } from "drizzle-orm/postgres-js";
import { and, gte, eq, sql } from "drizzle-orm";
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

export const getProducts = async (pathname: string) => {
  const match = pathname.match(/^\/api\/inventory\/product\/([^\/]+)$/);
  const name = match?.[1];

  if (name) {
    const decodedName = decodeURIComponent(name);

    const rows = await db
      .select({
        productName: products.name,
        branchName: branches.name,
        quantity: inventory.quantity,
      })
      .from(inventory)
      .innerJoin(products, eq(inventory.productId, products.id))
      .innerJoin(branches, eq(inventory.branchId, branches.id))
      .where(eq(products.name, decodedName));

    if (rows.length === 0 || rows[0] === undefined) {
      return new Response(JSON.stringify({ message: "Product not found" }), {
        status: 404,
      });
    }

    const response = {
      productName: rows[0].productName,
      branches: rows.map((row) => ({
        branchName: row.branchName,
        stock: row.quantity,
      })),
    };
    const validated = InventoryStatusFullSchema.parse(response);
    return new Response(JSON.stringify(validated), {
      headers: { "Content-Type": "application/json" },
    });
  }
};
