// src/routes/consumer.ts
import { db } from "../../index";
import { customers } from "../db/schema/customers"; // adjust if your schema file is named differently
import { carts } from "../db/schema/cart";
import { cartItems } from "../db/schema/cart_item";
import { products } from "../db/schema/product";
import { eq, ilike, desc } from "drizzle-orm";

// Existing:
export async function getConsumer(pathname: string): Promise<Response | null> {
  // your existing implementation
  return null;
}

export async function searchConsumersByName(name: string): Promise<Response> {
  const rows = await db
    .select()
    .from(customers)
    .where(ilike(customers.name, `%${name}%`))
    .limit(10);

  return new Response(JSON.stringify({ results: rows }), {
    headers: { "Content-Type": "application/json" },
  });
}

// ✅ New: /api/customers/:id/history
export async function getConsumerHistory(pathname: string): Promise<Response> {
  // pathname like: /api/customers/123/history
  const parts = pathname.split("/").filter(Boolean);
  const idStr = parts[2]; // ["api","customers","123","history"]
  const customerId = Number(idStr);

  if (!Number.isFinite(customerId)) {
    return new Response(JSON.stringify({ error: "Invalid customer id" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Example: show last 10 carts and their items (adjust if your schema differs)
  const history = await db
    .select({
      cartId: carts.id,
      createdAt: carts.createdAt,
      status: carts.status,
      itemId: cartItems.id,
      quantity: cartItems.quantity,
      productName: products.name,
      price: products.price,
    })
    .from(carts)
    .leftJoin(cartItems, eq(cartItems.cartId, carts.id))
    .leftJoin(products, eq(products.id, cartItems.productId))
    .where(eq(carts.customerId, customerId))
    .orderBy(desc(carts.createdAt))
    .limit(100);

  return new Response(JSON.stringify({ customerId, history }), {
    headers: { "Content-Type": "application/json" },
  });
}
