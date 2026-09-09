import { Queue } from "bullmq";
import { redis } from "./redis.ts";

const emailQueue = new Queue("email", { connection: redis });



export { emailQueue };
