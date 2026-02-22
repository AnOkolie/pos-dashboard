// src/db/schema/carts.ts

import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { customers } from "./customers";
import { branches } from "./branches";

export const carts = pgTable("carts", {
  id: serial("id").primaryKey(),

  customerId: integer("customer_id").references(() => customers.id),

  branchId: integer("branch_id")
    .notNull()
    .references(() => branches.id),

  token: text("token").notNull().unique(),

  status: text("status").default("active"),

  createdAt: timestamp("created_at").defaultNow(),
});
