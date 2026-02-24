import { and, eq, sql } from "drizzle-orm";
import { products } from "../db/schema/product";
import { inventory } from "../db/schema/inventory";
import { sales } from "../db/schema/sales";
import { saleItems } from "../db/schema/sale_items";
import type { SalesBodyType } from "../types/sales";
import { db } from "../..";
import { corsHeaders } from "../lib/jsonWrapper";

export const getSales = async (pathname: string, request: Request) => {
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

  return JSON.stringify(result);
};

export const getSalesToday = async () => {
  const rows = await db
    .select({
      name: products.name,
      totalSold: sql<number>`COALESCE(SUM(${saleItems.quantity}), 0)`,
      revenue: sql<number>`
        COALESCE(SUM(${saleItems.quantity} * ${saleItems.unitPrice}), 0)
      `,
    })
    .from(saleItems)
    .innerJoin(sales, eq(saleItems.saleId, sales.id))
    .innerJoin(products, eq(saleItems.productId, products.id))
    .where(
      sql`${sales.createdAt} >= CURRENT_DATE
                AND ${sales.createdAt} < CURRENT_DATE + INTERVAL '1 day'`,
    )
    .groupBy(products.id, products.name);

  return rows;
};
