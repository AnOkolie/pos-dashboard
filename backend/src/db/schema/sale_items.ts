import { pgTable, integer, numeric } from "drizzle-orm/pg-core";
import { products } from "./product";
import { sales } from "./sales";

export const saleItems = pgTable("sale_items", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),

  saleId: integer("sale_id")
    .notNull()
    .references(() => sales.id, { onDelete: "cascade" }),

  productId: integer("product_id")
    .notNull()
    .references(() => products.id),

  quantity: integer("quantity").notNull(),

  unitPrice: numeric("unit_price", {
    precision: 10,
    scale: 2,
  }).notNull(),
});
