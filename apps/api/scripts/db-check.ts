import { DatabaseError, Pool } from "pg";

const cs = process.env.DATABASE_URL;

if (!cs) throw new Error("DATABASE_URL is not set");

const pool = new Pool({
  connectionString: cs,
});

try {
  const result = await pool.query("SELECT 1 AS ok");
  console.log("Database connected:", result.rows[0]);
} catch (err: unknown) {
  if (err instanceof DatabaseError) {
    if (err.code === "28P01") {
      console.error("Incorrect Credentials.");
    }
  } else if (err instanceof Error) {
    console.log(err);
  }
  process.exitCode = 1;
} finally {
  await pool.end();
}
