import { and, eq, sql } from "drizzle-orm";
import { db } from "../..";

import { products } from "../db/schema/product";
import { inventory } from "../db/schema/inventory";
import { cartItems } from "../db/schema/cart_item";
import { carts } from "../db/schema/cart";
import { sales } from "../db/schema/sales";
import { saleItems } from "../db/schema/sale_items";

import {
  createCartBodySchema,
  updateCartBodySchema,
  removeFromCartBodySchema,
} from "../zod/CartSchema";
import { customers } from "../db/schema/customers";
import { calculateLoyaltyPoints } from "../lib/calculateLoyaltyPoints";
import { randomUUID } from "crypto";

// ===============================
// GET CART BY ID
// ===============================
export const getCartById = async (pathname: string) => {
  const id = pathname.match(/\/api\/cart\/(\d+)/)?.[1];
  if (!id) return new Response("Invalid cart ID", { status: 400 });

  const cartId = parseInt(id, 10);

  const rows = await db
    .select({
      productName: products.name,
      productId: cartItems.productId,
      quantity: cartItems.quantity,
      price: cartItems.unitPrice,
    })
    .from(cartItems)
    .leftJoin(products, eq(products.id, cartItems.productId))
    .where(eq(cartItems.cartId, cartId));

  const total = rows.reduce(
    (sum, item) => sum + parseFloat(item.price) * item.quantity,
    0,
  );

  const cartRow = await db
    .select({ status: carts.status })
    .from(carts)
    .where(eq(carts.id, cartId));

  if (!cartRow[0]) return new Response("Cart not found", { status: 404 });

  return Response.json({
    cartId,
    status: cartRow[0].status,
    items: rows,
    total,
  });
};

// ===============================
// DELETE CART
// ===============================
export const removeCartById = async (pathname: string) => {
  const id = pathname.match(/\/api\/cart\/(\d+)/)?.[1];
  if (!id) return new Response("Invalid cart ID", { status: 400 });

  const cartId = parseInt(id, 10);

  const res = await db.delete(carts).where(eq(carts.id, cartId)).returning();

  if (!res.length) {
    return new Response("Cart not found", { status: 404 });
  }

  return Response.json({ message: "Cart deleted", cart: res[0] });
};

// ===============================
// UPDATE CART (Add / Increase Item)
// ===============================
export const updateCart = async (pathname: string, request: Request) => {
  const id = pathname.match(/\/api\/cart\/(\d+)/)?.[1];
  if (!id) return new Response("Invalid cart ID", { status: 400 });

  const cartId = parseInt(id, 10);
  const body = await request.json();
  const parsed = updateCartBodySchema.parse(body);

  if (parsed.quantity <= 0)
    return new Response("Invalid quantity", { status: 400 });

  // ---- Get cart info
  const cartRes = await db
    .select({
      status: carts.status,
      branchId: carts.branchId,
    })
    .from(carts)
    .where(eq(carts.id, cartId));

  if (!cartRes.length || cartRes[0] === undefined) {
    return new Response("Cart not found", { status: 404 });
  }
  if (cartRes[0].status === "checked_out")
    return new Response("Cart already checked out", { status: 400 });

  const branchId = cartRes[0].branchId;

  // ---- Check inventory availability
  const stock = await db
    .select({ quantity: inventory.quantity })
    .from(inventory)
    .where(
      and(
        eq(inventory.productId, parsed.productId),
        eq(inventory.branchId, branchId),
      ),
    );

  const available = stock[0]?.quantity ?? 0;

  if (available < parsed.quantity) {
    return new Response("Insufficient stock", { status: 400 });
  }

  // ---- Get product price
  const priceRes = await db
    .select({ price: products.price })
    .from(products)
    .where(eq(products.id, parsed.productId));

  if (!priceRes.length || priceRes[0] === undefined) {
    return new Response("Product not found", { status: 404 });
  }

  const unitPrice = priceRes[0].price.toString();

  // ---- Check if item already exists
  const existing = await db
    .select()
    .from(cartItems)
    .where(
      and(
        eq(cartItems.cartId, cartId),
        eq(cartItems.productId, parsed.productId),
      ),
    );

  if (existing.length && existing[0]) {
    await db
      .update(cartItems)
      .set({
        quantity: existing[0].quantity + parsed.quantity,
      })
      .where(eq(cartItems.id, existing[0].id));
  } else {
    await db.insert(cartItems).values({
      cartId,
      productId: parsed.productId,
      quantity: parsed.quantity,
      unitPrice,
    });
  }

  return Response.json({ message: "Cart updated successfully" });
};

// ===============================
// REMOVE FROM CART (FULL TRANSACTION)
// ===============================

export const removeFromCart = async (pathname: string, request: Request) => {
  const match = pathname.match(/^\/api\/cart\/(\d+)\/items\/(\d+)$/);
  const cartIdStr = match?.[1];
  const productIdStr = match?.[2];

  if (!cartIdStr) return new Response("Invalid cart ID", { status: 400 });
  if (!productIdStr) return new Response("Invalid product ID", { status: 400 });

  const cartId = Number(cartIdStr);
  const productId = Number(productIdStr);

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {}; // allow empty => default quantity 1
  }
  const { quantity } = removeFromCartBodySchema.parse(body);

  if (quantity <= 0)
    return new Response("Quantity must be greater than 0", { status: 400 });

  try {
    const result = await db.transaction(async (tx) => {
      const cartObj = await tx
        .select({ status: carts.status })
        .from(carts)
        .where(eq(carts.id, cartId));

      if (!cartObj.length) throw new Error("Cart not found");
      if (cartObj[0] && cartObj[0].status === "checked_out")
        throw new Error("Cart already checked out");

      const cartItem = await tx
        .select({ id: cartItems.id, quantity: cartItems.quantity })
        .from(cartItems)
        .where(
          and(eq(cartItems.cartId, cartId), eq(cartItems.productId, productId)),
        );

      if (!cartItem.length || cartItem[0] === undefined)
        throw new Error("Product not in cart");

      const currentQuantity = cartItem[0].quantity;
      const newQuantity = currentQuantity - quantity;

      if (newQuantity > 0) {
        await tx
          .update(cartItems)
          .set({ quantity: newQuantity })
          .where(eq(cartItems.id, cartItem[0].id));
        return {
          cartId,
          productId,
          removed: currentQuantity,
          remaining: newQuantity,
          deleted: false,
        };
      } else {
        await tx.delete(cartItems).where(eq(cartItems.id, cartItem[0].id));
        return {
          cartId,
          productId,
          removed: currentQuantity,
          remaining: 0,
          deleted: true,
        };
      }
    });
  } catch (e: any) {
    return new Response(e.message ?? "Failed to remove item", { status: 400 });
  }
};

// ===============================
// CHECKOUT CART (FULL TRANSACTION)
// ===============================
export const checkoutCart = async (pathname: string) => {
  const id = pathname.match(/\/api\/cart\/(\d+)\/checkout/)?.[1];
  if (!id) return new Response("Invalid cart ID", { status: 400 });

  const cartId = parseInt(id, 10);

  try {
    const result = await db.transaction(async (tx) => {
      // ---- Get cart
      console.log("Fetching cart info for cartId:", cartId);
      const cartRes = await tx.select().from(carts).where(eq(carts.id, cartId));

      if (!cartRes.length || cartRes[0] === undefined)
        throw new Error("Cart not found");

      const cart = cartRes[0];

      if (cart.status === "checked_out")
        throw new Error("Cart already checked out");

      // ---- Get cart items
      const items = await tx
        .select({
          productId: cartItems.productId,
          quantity: cartItems.quantity,
          price: cartItems.unitPrice,
        })
        .from(cartItems)
        .where(eq(cartItems.cartId, cartId));

      if (!items.length) throw new Error("Cart is empty");

      // ---- Validate inventory
      for (const item of items) {
        const stock = await tx
          .select({ quantity: inventory.quantity })
          .from(inventory)
          .where(
            and(
              eq(inventory.productId, item.productId),
              eq(inventory.branchId, cart.branchId),
            ),
          );

        if (
          !stock.length ||
          stock[0] === undefined ||
          stock[0].quantity < item.quantity
        ) {
          throw new Error(`Insufficient stock for product ${item.productId}`);
        }
      }

      // ---- Calculate total
      const total = items.reduce(
        (sum, item) => sum + parseFloat(item.price) * item.quantity,
        0,
      );

      // ---- Create sale
      const [sale] = await tx
        .insert(sales)
        .values({
          branchId: cart.branchId,
          customerId: cart.customerId,
          totalAmount: total.toString(),
        })
        .returning();

      if (!sale) {
        throw new Error("Failed to create sale");
      }

      // ---- Insert sale items
      await tx.insert(saleItems).values(
        items.map((item) => ({
          saleId: sale.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.price,
        })),
      );

      // ---- Deduct inventory
      for (const item of items) {
        await tx
          .update(inventory)
          .set({
            quantity: sql`${inventory.quantity} - ${item.quantity}`,
          })
          .where(
            and(
              eq(inventory.productId, item.productId),
              eq(inventory.branchId, cart.branchId),
            ),
          );
      }

      // ---- Mark cart checked out
      await tx
        .update(carts)
        .set({ status: "checked_out" })
        .where(eq(carts.id, cartId));

      if (cart.customerId) {
        await tx
          .update(customers)
          .set({
            loyaltyPoints: sql`${customers.loyaltyPoints} + ${calculateLoyaltyPoints(total)}`,
          })
          .where(eq(customers.id, cart.customerId!));
      }
      return { saleId: sale.id, total };
    });

    return Response.json({
      message: "Checkout successful",
      ...result,
    });
  } catch (err: any) {
    return new Response(err.message, { status: 400 });
  }
};

// ===============================
// CREATE CART
// ===============================
export const createCart = async (request: Request) => {
  const body = await request.json().catch(() => ({}));
  const parsed = createCartBodySchema.parse(body);
  const token = randomUUID();
  const branchId = parsed.branchId ?? 1;

  const values: any = {
    branchId,
    token,
    status: "active",
  };

  if (parsed.customerId) values.customerId = parsed.customerId;

  const [created] = await db.insert(carts).values(values).returning();
  return Response.json(created);
};
