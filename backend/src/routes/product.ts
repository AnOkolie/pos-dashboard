import { eq, ilike } from "drizzle-orm";
import { products } from "../db/schema/product";
import { branches } from "../db/schema/branches";
import { inventory } from "../db/schema/inventory";
import { InventoryStatusFullSchema } from "../zod/InventorySchema";
import { db } from "../..";

export const getProducts = async (pathname: string) => {
  const match = pathname.match(/\/api\/inventory\/product\/(\d+)/)?.[1];
  const id = match;

  if (id) {
    const decodedId = parseInt(id, 10);
    const rows = await db
      .select({
        productName: products.name,
        branchName: branches.name,
        quantity: inventory.quantity,
      })
      .from(inventory)
      .innerJoin(products, eq(inventory.productId, products.id))
      .innerJoin(branches, eq(inventory.branchId, branches.id))
      .where(eq(products.id, decodedId));

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

export async function searchInventoryByName(
  productName: string,
): Promise<Response> {
  const rows = await db
    .select({
      productId: products.id,
      productName: products.name,
      branchId: branches.id,
      branchName: branches.name,
      quantity: inventory.quantity,
    })
    .from(products)
    .innerJoin(inventory, eq(inventory.productId, products.id))
    .innerJoin(branches, eq(branches.id, inventory.branchId))
    .where(ilike(products.name, `%${productName}%`));

  return new Response(JSON.stringify({ query: productName, results: rows }), {
    headers: { "Content-Type": "application/json" },
  });
}
