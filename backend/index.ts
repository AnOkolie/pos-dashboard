import { serve } from "bun";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { getProducts, searchInventoryByName } from "./src/routes/product";
import {
  searchCustomerByName,
  getCustomerHistory,
  getCustomerById,
} from "./src/routes/consumer";
import { getSales, getSalesToday } from "./src/routes/sales";
import {
  createCart,
  getCartById,
  removeCartById,
  checkoutCart,
  updateCart,
  removeFromCart,
} from "./src/routes/cart";

const POSTGRES_URL = process.env.POSTGRES_URL;
if (!POSTGRES_URL) {
  throw new Error("Missing POSTGRES_URL env var");
}

const client = postgres(POSTGRES_URL);
export const db = drizzle(client);

const PORT = Number(process.env.PORT ?? 3000);

const corsHeaders: HeadersInit = {
  "Access-Control-Allow-Origin": process.env.CORS_ORIGIN ?? "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function text(body: string, status = 200): Response {
  return new Response(body, { status, headers: corsHeaders });
}

if (process.env.NODE_ENV === "development") {
  const { execSync } = await import("child_process");

  try {
    execSync(`psql ${process.env.POSTGRES_URL} -f ./db/seed.sql`, {
      stdio: "inherit",
    });
    console.log("🌱 Dev seed executed");
  } catch (err) {
    console.error("Seed failed", err);
  }
}

serve({
  port: PORT,
  async fetch(request: Request): Promise<Response> {
    const { method } = request;
    const url = new URL(request.url);
    const { pathname } = url;

    // Preflight (so browser fetch works)
    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // Health / hello
    if (method === "GET" && pathname === "/api") {
      return text("Hello from Bun!");
    }

    // ---------------------------
    // INVENTORY
    // ---------------------------

    // Query-based inventory lookup: /api/inventory/product?name=Blue%20Shirt
    if (method === "GET" && pathname === "/api/inventory/product") {
      const name = (url.searchParams.get("name") ?? "").trim();
      if (!name) return json({ error: "name is required" }, 400);

      const resp = await searchInventoryByName(name);
      return resp ?? json({ error: "Failed to retrieve inventory" }, 500);
    }

    // Path-based inventory lookup: /api/inventory/product/:id (keep for compatibility)
    if (method === "GET" && pathname.startsWith("/api/inventory/product/")) {
      const resp = await getProducts(pathname);
      return resp ?? json({ error: "Failed to retrieve products" }, 500);
    }

    // (Optional compatibility) if someone hits /api/inventory/product with no trailing slash
    if (method === "GET" && pathname === "/api/inventory/product") {
      return json({ error: "Missing product name in path" }, 400);
    }

    // ---------------------------
    // CUSTOMERS
    // ---------------------------

    // Search customers by name: /api/customers/search?name=Anthony
    // IMPORTANT: keep this ABOVE /api/customers/:id
    if (method === "GET" && pathname === "/api/customers/search") {
      const name = (url.searchParams.get("name") ?? "").trim();
      if (!name) return json({ error: "name is required" }, 400);

      const resp = await searchCustomerByName(name);
      return resp ?? json({ error: "Failed to search customers" }, 500);
    }

    // Customer history: /api/customers/:id/history
    if (
      method === "GET" &&
      pathname.startsWith("/api/customers/") &&
      pathname.endsWith("/history")
    ) {
      const resp = await getCustomerHistory(pathname);
      return (
        resp ?? json({ error: "Failed to retrieve customer history" }, 500)
      );
    }

    // Customer by id: /api/customers/:id
    if (method === "GET" && pathname.startsWith("/api/customers/")) {
      const resp = await getCustomerById(pathname);
      return resp ?? json({ error: "Failed to retrieve customer" }, 500);
    }

    // ---------------------------
    // REPORTS / SALES
    // ---------------------------

    if (method === "GET" && pathname === "/api/reports/sales/today") {
      const result = await getSalesToday();
      return json(result);
    }

    if (method === "POST" && pathname === "/api/sales") {
      // getSales seems to already return a Response
      const resp = await getSales(pathname, request);
      return resp ?? json({ error: "Failed to record sale" }, 500);
    }

    // ---------------------------
    // CART
    // ---------------------------

    // Checkout: /api/cart/:id/checkout (must be before generic routes)
    if (
      method === "POST" &&
      pathname.startsWith("/api/cart/") &&
      pathname.endsWith("/checkout")
    ) {
      const resp = await checkoutCart(pathname);
      return resp ?? json({ error: "Failed to checkout cart" }, 500);
    }

    if (method === "GET" && pathname.startsWith("/api/cart")) {
      const resp = await getCartById(pathname);
      return resp ?? json({ error: "Failed to retrieve cart" }, 500);
    }

    if (method === "DELETE" && pathname.startsWith("/api/cart")) {
      const resp = await removeCartById(pathname);
      return resp ?? json({ error: "Failed to delete cart" }, 500);
    }

    if (method === "PUT" && pathname.startsWith("/api/cart")) {
      const resp = await updateCart(pathname, request);
      return resp ?? json({ error: "Failed to update cart" }, 500);
    }

    // Create cart: exact match only
    if (method === "POST" && pathname === "/api/cart") {
      const resp = await createCart(request);
      return resp ?? json({ error: "Failed to create cart" }, 500);
    }

    if (
      method === "PATCH" &&
      pathname.match(/^\/api\/cart\/\d+\/items\/\d+$/)
    ) {
      const resp = await removeFromCart(pathname, request);
      return resp ?? json({ error: "Failed to remove item" }, 500);
    }

    return json({ error: "Endpoint Not Found", pathname }, 404);
  },
});

console.log(`Hello via Bun! Listening on port ${PORT}`);
