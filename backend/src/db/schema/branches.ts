import {
  pgTable,
  integer,
  text,
  timestamp,
  numeric,
  unique,
} from "drizzle-orm/pg-core";

export const branches = pgTable("branches", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),

  name: text("name").notNull(),

  location: text("location"),

  createdAt: timestamp("created_at", { withTimezone: false }).defaultNow(),
});
