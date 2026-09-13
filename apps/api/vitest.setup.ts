import { pool } from "./src/db.ts";
import { afterAll } from "vitest";

if (!process.env.DATABASE_URL?.endsWith("pulsedb_test")) {
  throw new Error(
    "vitest.setup: refusing to run — DATABASE_URL must point at pulsedb_test",
  );
}

export async function truncateTables() {
  await pool.query(
    "TRUNCATE users, projects, events, delivery_logs, notifications RESTART IDENTITY CASCADE",
  );
}

afterAll(async () => pool.end());
