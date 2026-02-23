import { db } from "../../index";
import { customers } from "../db/schema/customers"; // adjust if your schema file is named differently
import { carts } from "../db/schema/cart";
import { cartItems } from "../db/schema/cart_item";
import { products } from "../db/schema/product";
import { eq, ilike, desc } from "drizzle-orm";

export async function getCustomerById(pathname: string): Promise<Response> {
  const id = pathname.match(/\/api\/customers\/(\d+)/)?.[1];
  if (!id) return new Response("Invalid customer ID", { status: 400 });

  const customerId = Number(id);

  const row = await db
    .select({
      id: customers.id,
      name: customers.name,
      email: customers.email,
      phone: customers.phone,
      loyaltyPoints: customers.loyaltyPoints, // or customers.loyalty_points depending on your schema
      createdAt: customers.createdAt,
    })
    .from(customers)
    .where(eq(customers.id, customerId))
    .then((res) => res[0]);

  if (!row) {
    return new Response(JSON.stringify({ error: "Customer not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify(row), {
    headers: { "Content-Type": "application/json" },
  });
}

export async function searchCustomerByName(name: string): Promise<Response> {
  const rows = await db
    .select()
    .from(customers)
    .where(ilike(customers.name, `%${name}%`))
    .limit(10);

  return new Response(JSON.stringify({ results: rows }), {
    headers: { "Content-Type": "application/json" },
  });
}

export async function getCustomerHistory(pathname: string): Promise<Response> {
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
