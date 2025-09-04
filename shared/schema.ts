import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const visitors = pgTable("visitors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"), // Optional - for tracking specific users
  page: text("page").notNull(),
  referrer: text("referrer"),
  userAgent: text("user_agent"),
  ip: varchar("ip"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertVisitorSchema = createInsertSchema(visitors).omit({
  id: true,
  timestamp: true,
});

export const trackVisitorSchema = insertVisitorSchema.extend({
  userId: z.string().optional(),
  page: z.string().min(1),
  referrer: z.string().optional(),
  userAgent: z.string().optional(),
  ip: z.string().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertVisitor = z.infer<typeof insertVisitorSchema>;
export type TrackVisitorData = z.infer<typeof trackVisitorSchema>;
export type Visitor = typeof visitors.$inferSelect;

export interface VisitorCounts {
  today: number;
  week: number;
  month: number;
  year: number;
}

export interface VisitorAnalytics {
  status: string;
  timestamp: string;
  data: VisitorCounts | Partial<VisitorCounts>;
  metadata: {
    endpoint: string;
    period: string;
    processing_time: string;
  };
}
