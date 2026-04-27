// COPIED FROM: upriser-web/server/storage.ts (user methods only)
// PURPOSE:     User CRUD operations against the shared Postgres DB for Expo Router API routes.

import { db } from "./db";
import { users, type User, type InsertUser } from "./schema";
import { eq, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function getUser(id: string): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user;
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const normalizedEmail = email.trim().toLowerCase();
  const [user] = await db
    .select()
    .from(users)
    .where(sql`lower(${users.email}) = ${normalizedEmail}`);
  return user;
}

export async function getUserByGoogleId(googleId: string): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
  return user;
}

export async function createUser(data: Omit<InsertUser, "id">): Promise<User> {
  const id = randomUUID();
  const [user] = await db.insert(users).values({ ...data, id }).returning();
  return user;
}

export async function updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
  const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
  return user;
}
