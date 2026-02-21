// src/db/schema/cart_items.ts

import {
  pgTable,
  serial,
  integer,
  numeric,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { carts } from "./cart";
import { products } from "./product";

export const cartItems = pgTable(
  "cart_items",
  {
    id: serial("id").primaryKey(),

    cartId: integer("cart_id")
      .notNull()
      .references(() => carts.id, { onDelete: "cascade" }),

    productId: integer("product_id")
      .notNull()
      .references(() => products.id),

    quantity: integer("quantity").notNull(),

    unitPrice: numeric("unit_price", {
      precision: 10,
      scale: 2,
    }).notNull(),
  },
  (table) => ({
    cartProductUnique: uniqueIndex("cart_product_unique").on(
      table.cartId,
      table.productId,
    ),
  }),
);
