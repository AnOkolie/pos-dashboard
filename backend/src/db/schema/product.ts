import {
  pgTable,
  integer,
  text,
  timestamp,
  numeric,
  unique,
} from "drizzle-orm/pg-core";

export const products = pgTable("products", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),

  name: text("name").notNull(),

  description: text("description"),

  price: numeric("price", { precision: 10, scale: 2 }).notNull(),

  sku: text("sku").unique(),

  createdAt: timestamp("created_at").defaultNow(),
  quantity: integer("quantity").default(0),
});
