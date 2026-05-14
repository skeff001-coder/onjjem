import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const pendingAnimations = pgTable("pending_animations", {
  ref:             text("ref").primaryKey(),
  email:           text("email").notNull(),
  plan:            text("plan").notNull(), // 'single' | 'monthly' | 'annual'
  stripeSessionId: text("stripe_session_id"),
  paid:            boolean("paid").default(false).notNull(),
  animated:        boolean("animated").default(false).notNull(),
  imageB64:        text("image_b64"), // cleared after animation
  expiresAt:       timestamp("expires_at").notNull(),
  createdAt:       timestamp("created_at").defaultNow().notNull(),
});

export const videoSubscriptions = pgTable("video_subscriptions", {
  id:                   serial("id").primaryKey(),
  email:                text("email").notNull(),
  plan:                 text("plan").notNull(),
  stripeCustomerId:     text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  accessUntil:          timestamp("access_until"), // null = single-use (check animated flag instead)
  isActive:             boolean("is_active").default(true).notNull(),
  createdAt:            timestamp("created_at").defaultNow().notNull(),
});

export type PendingAnimation   = typeof pendingAnimations.$inferSelect;
export type VideoSubscription  = typeof videoSubscriptions.$inferSelect;
