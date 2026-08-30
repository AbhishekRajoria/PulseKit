import { Redis } from "ioredis";
import { Queue } from "bullmq";

const connection = new Redis();

const emailQueue = new Queue("email", { connection });

connection.on("error", (err) => {
  console.error("Redis connection error:", err.message);
});

export { emailQueue };
