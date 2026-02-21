import { serve } from "bun";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getProducts } from "./src/routes/product";
import { getConsumer } from "./src/routes/consumer";
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
const PORT = parseInt(process.env.PORT || "3000");
serve({
  port: PORT,
  async fetch(request: Request): Promise<Response> {
    const { method } = request;
    const { pathname } = new URL(request.url);

    if (method === "GET" && pathname === "/api") {
      return new Response("Hello from Bun!");
    }

    if (method === "GET" && pathname.startsWith("/api/inventory/products")) {
      const response = await getProducts(pathname);
      if (!response) {
        return new Response("Failed to retrieve products", { status: 500 });
      }
      return response;
    }

    if (method === "GET" && pathname.startsWith("/api/customers/")) {
      const response = await getConsumer(pathname);
      if (!response) {
        return new Response("Failed to retrieve consumer", { status: 500 });
      }
      return response;
    }

    if (method === "GET" && pathname.startsWith("/api/reports/sales/today")) {
      const result = await getSalesToday();
      return new Response(JSON.stringify(result), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (method === "POST" && pathname === "/api/sales") {
      return await getSales(pathname, request);
    }

    if (method === "GET" && pathname.startsWith("/api/cart")) {
      return await getCartById(pathname);
    }

    if (method === "DELETE" && pathname.startsWith("/api/cart")) {
      return await removeCartById(pathname);
    }

    if (method === "POST" && pathname.startsWith("/api/cart")) {
      const response = await createCart(request);
      if (!response) {
        return new Response("Failed to create cart", { status: 500 });
      }
      return response;
    }
    if (
      method === "POST" &&
      pathname.startsWith("/api/cart") &&
      pathname.endsWith("/checkout")
    ) {
      const response = await checkoutCart(pathname);
      if (!response) {
        return new Response("Failed to checkout cart", { status: 500 });
      }
      return response;
    }
    if (method === "PUT" && pathname.startsWith("/api/cart")) {
      const response = await updateCart(pathname, request);
      if (!response) {
        return new Response("Failed to update cart", { status: 500 });
      }
      return response;
    }
    return new Response("Endpoint Not Found", { status: 404 });
  },
});

console.log("Hello via Bun!");
