// index.ts (or wherever your Bun serve() router is)

import { serve } from "bun";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { getProducts, searchInventoryByName } from "./src/routes/product";
import {
  getConsumer,
  searchConsumersByName,
  getConsumerHistory,
} from "./src/routes/consumer";

import { getSales, getSalesToday } from "./src/routes/sales";
import {
  createCart,
  getCartById,
  removeCartById,
  checkoutCart,
  updateCart,
} from "./src/routes/cart";

const client = postgres(process.env.POSTGRES_URL!);
export const db = drizzle(client);

const PORT = parseInt(process.env.PORT || "3000", 10);

serve({
  port: PORT,
  async fetch(request: Request): Promise<Response> {
    const { method } = request;
    const url = new URL(request.url);
    const { pathname } = url;

    if (method === "GET" && pathname === "/api") {
      return new Response("Hello from Bun!");
    }

    // ---------------------------
    // INVENTORY (supports prompt: "Check stock for Blue Shirt in all branches")
    // ---------------------------

    // New: query-based lookup /api/inventory/products?name=Blue%20Shirt
    // (Helpful because it avoids messy URL encoding in /:name paths)
    if (method === "GET" && pathname === "/api/inventory/products") {
      const name = url.searchParams.get("name") ?? "";
      if (!name.trim()) {
        return new Response(JSON.stringify({ error: "name is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      return await searchInventoryByName(name);
    }

    // Keep existing singular route too: /api/inventory/product/:name
    if (method === "GET" && pathname.startsWith("/api/inventory/product")) {
      const response = await getProducts(pathname);
      if (!response)
        return new Response("Failed to retrieve products", { status: 500 });
      return response;
    }

    // ---------------------------
    // CUSTOMERS (supports prompt: "Pull up profile for Anthony")
    // ---------------------------

    // New: /api/customers/search?name=Anthony
    if (method === "GET" && pathname === "/api/customers/search") {
      const name = url.searchParams.get("name") ?? "";
      if (!name.trim()) {
        return new Response(JSON.stringify({ error: "name is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      return await searchConsumersByName(name);
    }

    // New: /api/customers/:id/history
    if (
      method === "GET" &&
      pathname.startsWith("/api/customers/") &&
      pathname.endsWith("/history")
    ) {
      return await getConsumerHistory(pathname);
    }

    // Existing: /api/customers/:id
    if (method === "GET" && pathname.startsWith("/api/customers/")) {
      const response = await getConsumer(pathname);
      if (!response)
        return new Response("Failed to retrieve consumer", { status: 500 });
      return response;
    }

    // ---------------------------
    // REPORTS (supports prompt: "chart of today's sales")
    // ---------------------------
    if (method === "GET" && pathname === "/api/reports/sales/today") {
      const result = await getSalesToday();
      return new Response(JSON.stringify(result), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (method === "POST" && pathname === "/api/sales") {
      return await getSales(pathname, request);
    }

    // ---------------------------
    // CART (supports prompt: "Add 2 espressos", checkout, etc.)
    // ---------------------------

    // Checkout must be before generic POST /api/cart
    if (
      method === "POST" &&
      pathname.startsWith("/api/cart/") &&
      pathname.endsWith("/checkout")
    ) {
      const response = await checkoutCart(pathname);
      if (!response)
        return new Response("Failed to checkout cart", { status: 500 });
      return response;
    }

    if (method === "GET" && pathname.startsWith("/api/cart")) {
      return await getCartById(pathname);
    }

    if (method === "DELETE" && pathname.startsWith("/api/cart")) {
      return await removeCartById(pathname);
    }

    if (method === "PUT" && pathname.startsWith("/api/cart")) {
      const response = await updateCart(pathname, request);
      if (!response)
        return new Response("Failed to update cart", { status: 500 });
      return response;
    }

    // Create cart only on exact /api/cart
    if (method === "POST" && pathname === "/api/cart") {
      const response = await createCart(request);
      if (!response)
        return new Response("Failed to create cart", { status: 500 });
      return response;
    }

    return new Response("Endpoint Not Found", { status: 404 });
  },
});

console.log("Hello via Bun!");
