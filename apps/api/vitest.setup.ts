import { pool } from "./src/db.ts";
import { afterAll } from "vitest";

if (!process.env.DATABASE_URL?.endsWith("pulsedb_test")) {
  throw new Error(
    "vitest.setup: refusing to run — DATABASE_URL must point at pulsedb_test",
  );
}

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error("vitest.setup: refusing to run — REDIS_URL is not set");
}

let parsedRedisUrl: URL;
try {
  parsedRedisUrl = new URL(redisUrl);
} catch {
  throw new Error("vitest.setup: refusing to run — REDIS_URL is invalid");
}

if (
  parsedRedisUrl.hostname !== "localhost" &&
  parsedRedisUrl.hostname !== "127.0.0.1"
) {
  throw new Error(
    "vitest.setup: refusing to run — REDIS_URL must point at localhost or 127.0.0.1",
  );
}

const redisDb = parsedRedisUrl.pathname.replace("/", "");
if (redisDb !== "15") {
  throw new Error(
    "vitest.setup: refusing to run — REDIS_URL must use dedicated test database 15",
  );
}

export async function truncateTables() {
  await pool.query(
    "TRUNCATE users, projects, events, delivery_logs, notifications RESTART IDENTITY CASCADE",
  );
}

afterAll(async () => pool.end());
