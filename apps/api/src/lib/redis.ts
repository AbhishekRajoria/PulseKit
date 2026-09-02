import { Redis } from "ioredis";

const redis = new Redis(process.env.REDIS_URL as string, {
  maxRetriesPerRequest: null,
});

const redisSub = new Redis(process.env.REDIS_URL as string, {
  maxRetriesPerRequest: null,
});

redis.on("error", (err) => console.error("Redis error:", err.message));
redisSub.on("error", (err) =>
  console.error("Redis subscriber error:", err.message),
);

export { redis, redisSub };
