import {
  pgTable,
  integer,
  text,
  timestamp,
  numeric,
  unique,
} from "drizzle-orm/pg-core";

import { branches } from "./branches";
import { customers } from "./customers";

export const sales = pgTable("sales", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),

  branchId: integer("branch_id")
    .notNull()
    .references(() => branches.id),

  customerId: integer("customer_id").references(() => customers.id),

  totalAmount: numeric("total_amount", {
    precision: 10,
    scale: 2,
  }).notNull(),

  createdAt: timestamp("created_at").defaultNow(),
});
