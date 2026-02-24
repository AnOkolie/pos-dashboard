import { inventory } from "../db/schema/inventory";
import { products } from "../db/schema/product";
import { and, eq } from "drizzle-orm";
import { db } from "../..";
import { corsHeaders } from "../lib/jsonWrapper";

export const getInventoryByProductId = async (pathname: string) => {
  const idStr = pathname.match(/^\/api\/inventory\/product\/(\d+)$/)?.[1];
  if (!idStr) {
    return new Response(JSON.stringify({ message: "Product ID is required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const productId = Number(idStr);
  if (!Number.isFinite(productId)) {
    return new Response(JSON.stringify({ message: "Invalid product ID" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const rows = await db
    .select({
      productName: products.name,
      branchId: inventory.branchId,
      stock: inventory.quantity,
    })
    .from(inventory)
    .innerJoin(products, eq(inventory.productId, products.id))
    .where(eq(inventory.productId, productId));

  if (rows.length === 0 || rows[0] === undefined) {
    return new Response(JSON.stringify({ message: "Product not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({
      productId,
      productName: rows[0].productName,
      branches: rows.map((r) => ({ branchId: r.branchId, stock: r.stock })),
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
};

export const updateInventory2 = async (pathname: string, body: any) => {
  const idStr = pathname.match(/^\/api\/inventory\/product\/(\d+)$/)?.[1];
  if (!idStr) {
    return new Response(JSON.stringify({ error: "Product ID is required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const productId = Number(idStr);
  if (!Number.isFinite(productId)) {
    return new Response(JSON.stringify({ error: "Invalid product ID" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const branchId = Number(body?.branchId);
  const quantity = Number(body?.quantity);

  if (!Number.isFinite(branchId) || !Number.isFinite(quantity)) {
    return new Response(
      JSON.stringify({ error: "branchId and quantity are required" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const existing = await db
    .select({ id: inventory.id })
    .from(inventory)
    .where(
      and(eq(inventory.productId, productId), eq(inventory.branchId, branchId)),
    );

  if (existing.length > 0 && existing[0] !== undefined) {
    await db
      .update(inventory)
      .set({ quantity })
      .where(eq(inventory.id, existing[0].id));
  } else {
    await db.insert(inventory).values({ productId, branchId, quantity });
  }

  return new Response(
    JSON.stringify({ message: "Inventory updated successfully" }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
};
