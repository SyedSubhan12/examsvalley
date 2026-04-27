// COPIED FROM: upriser-web/server/db.ts
// PURPOSE:     Shared Postgres connection for Expo Router API routes.
//              Connects to the SAME database as upriser-web via DATABASE_URL.

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required for Expo Router API routes.");
}

const isServerless = process.env.VERCEL === "1";

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: isServerless ? 1 : 5,
  idleTimeoutMillis: isServerless ? 10000 : 30000,
  connectionTimeoutMillis: 30000,
  keepAlive: true,
  ssl: { rejectUnauthorized: false },
});

pool.on("error", (err) => {
  console.error("[DB] Unexpected pool error:", err);
});

export const db = drizzle(pool, { schema, logger: false });
