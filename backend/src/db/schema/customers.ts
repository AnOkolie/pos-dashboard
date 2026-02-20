import {
  pgTable,
  integer,
  text,
  timestamp,
  numeric,
  unique,
} from "drizzle-orm/pg-core";

export const customers = pgTable("customers", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),

  name: text("name").notNull(),

  email: text("email").unique(),

  phone: text("phone"),

  loyaltyPoints: integer("loyalty_points").default(0),

  createdAt: timestamp("created_at").defaultNow(),
});
