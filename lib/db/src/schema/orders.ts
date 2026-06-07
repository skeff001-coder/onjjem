import { pgTable, serial, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  stripeSessionId: text("stripe_session_id").notNull().unique(),
  productId: text("product_id").notNull(),
  priceId: text("price_id").notNull(),
  photoObjectPath: text("photo_object_path").notNull(),
  customerEmail: text("customer_email").notNull(),
  shippingAddress: jsonb("shipping_address"),
  status: text("status").notNull().default("pending"),
  prodigiOrderId: text("prodigi_order_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;
