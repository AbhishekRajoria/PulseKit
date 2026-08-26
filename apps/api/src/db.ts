import { Pool } from "pg";

const cs = process.env.DATABASE_URL;

if (!cs) throw new Error("DATABASE_URL is not set");

export const pool = new Pool({
  connectionString: cs,
});
