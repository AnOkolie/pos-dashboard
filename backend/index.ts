import { serve } from "bun";
import { drizzle } from "drizzle-orm/postgres-js";
import { and, gte, eq, sql } from "drizzle-orm";
import { products } from "./src/db/schema/product";
import { branches } from "./src/db/schema/branches";
import { inventory } from "./src/db/schema/inventory";
import postgres from "postgres";
import { sales } from "./src/db/schema/sales";
import { saleItems } from "./src/db/schema/sale_items";
import type { SalesBodyType } from "./src/types/sales";
import {
  InventoryStatusFullSchema,
  InventoryStatusSchema,
} from "./src/zod/InventorySchema";
import { customers } from "./src/db/schema/customers";

const client = postgres(process.env.POSTGRES_URL!);

export const db = drizzle(client);
const PORT = parseInt(process.env.PORT || "3000");
serve({
  port: PORT,
  async fetch(request) {
    const { method } = request;
    const { pathname } = new URL(request.url);
    if (method === "GET" && pathname === "/api") {
      return new Response("Hello from Bun!");
    }
    if (method === "GET") {
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
          return new Response(
            JSON.stringify({ message: "Product not found" }),
            { status: 404 },
          );
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
    }
    if (method === "GET") {
      const match = pathname.match(/^\/api\/customers\/([^\/]+)$/);
      const name = match?.[1];

      if (name) {
        const decodedName = decodeURIComponent(name);

        const result = await db
          .select()
          .from(customers)
          .where(eq(customers.name, decodedName));

        return new Response(JSON.stringify(result), {
          headers: { "Content-Type": "application/json" },
        });
      }
    }
    if (method === "GET" && pathname === "/api/customers/:name") {
      const match = pathname.match(/^\/api\/customers\/([^\/]+)$/);
      const name = match?.[1];
      if (name) {
        const decodedName = decodeURIComponent(name);
        const result = await db
          .select({
            name: products.name,
            price: products.price,
          })
          .from(products)
          .where(eq(products.name, decodedName));
        return new Response(JSON.stringify(result), {
          headers: { "Content-Type": "application/json" },
        });
      }
    }
    if (method === "POST" && pathname === "/api/sales") {
      const body = (await request.json()) as SalesBodyType;
      const result = await db.transaction(async (tx) => {
        const { branchId, customerId, items } = body;
        if (
          branchId == null ||
          customerId == null ||
          !Array.isArray(items) ||
          items.length === 0
        ) {
          throw new Error("Invalid request body");
        }
        // Create sale
        const [newSale] = await tx
          .insert(sales)
          .values({
            branchId,
            customerId,
            totalAmount: "0",
          })
          .returning({ id: sales.id });

        if (!newSale) throw new Error("Sale creation failed");

        let total = 0;

        for (const item of items) {
          const product = await tx
            .select()
            .from(products)
            .where(eq(products.id, item.productId))
            .limit(1);

          if (product[0] === undefined || !product.length)
            throw new Error("Product not found");

          const price = Number(product[0].price);
          total += price * item.quantity;

          // Insert sale item
          await tx.insert(saleItems).values({
            saleId: newSale.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: price.toString(),
          });
          const stock = await tx
            .select({ qty: inventory.quantity })
            .from(inventory)
            .where(
              and(
                eq(inventory.productId, item.productId),
                eq(inventory.branchId, branchId),
              ),
            );

          if (
            !stock ||
            !stock.length ||
            stock[0] === undefined ||
            stock[0].qty < item.quantity
          ) {
            throw new Error("Insufficient stock");
          }
          // Reduce inventory
          await tx
            .update(inventory)
            .set({
              quantity: sql`${inventory.quantity} - ${item.quantity}`,
            })
            .where(
              and(
                eq(inventory.productId, item.productId),
                eq(inventory.branchId, branchId),
              ),
            );
        }

        // Update total
        await tx
          .update(sales)
          .set({ totalAmount: total.toString() })
          .where(eq(sales.id, newSale.id));

        return { saleId: newSale.id, total };
      });

      return new Response(JSON.stringify(result), {
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response("Endpoint Not Found", { status: 404 });
  },
});
console.log("Hello via Bun!");
