// COPIED FROM: upriser-web/shared/schema.ts (users table only)
// PURPOSE:     Minimal Drizzle schema for the Expo Router API routes — just what the mobile
//              auth endpoint needs. Must stay in sync with the upriser-web schema migration.

import { pgTable, text, varchar, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: varchar("id", { length: 36 }).primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password"),
  googleId: text("google_id").unique(),
  authProvider: text("auth_provider").notNull().default("local"),
  name: text("name").notNull(),
  role: text("role").notNull().default("student"),
  avatar: text("avatar"),
  boardIds: text("board_ids").array(),
  subjectIds: text("subject_ids").array(),
  isActive: boolean("is_active").notNull().default(true),
  isEmailVerified: boolean("is_email_verified").notNull().default(false),
  emailVerificationToken: text("email_verification_token"),
  emailVerificationExpires: timestamp("email_verification_expires"),
  emailVerificationResendCount: integer("email_verification_resend_count").notNull().default(0),
  lastResentAt: timestamp("last_resent_at"),
  isApproved: boolean("is_approved").notNull().default(true),
  approvedBy: varchar("approved_by", { length: 36 }),
  approvedAt: timestamp("approved_at"),
  username: text("username").unique(),
  bio: text("bio"),
  qualifications: text("qualifications").array(),
  experienceYears: integer("experience_years"),
  rating: text("rating").default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  lastLoginAt: timestamp("last_login_at"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
