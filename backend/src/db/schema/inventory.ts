import {
  pgTable,
  integer,
  text,
  timestamp,
  numeric,
  unique,
} from "drizzle-orm/pg-core";
import { branches } from "./branches";
import { products } from "./product";

export const inventory = pgTable(
  "inventory",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),

    productId: integer("product_id")
      .notNull()
      .references(() => products.id),

    branchId: integer("branch_id")
      .notNull()
      .references(() => branches.id),

    quantity: integer("quantity").notNull().default(0),

    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    uniqueProductBranch: unique().on(table.productId, table.branchId),
  }),
);
