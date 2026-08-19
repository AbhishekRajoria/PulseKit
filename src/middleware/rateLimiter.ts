import { Redis } from "ioredis";
import { type Request, type Response, type NextFunction } from "express";

const redis = new Redis();

redis.on("error", (err) => {
  console.error("Redis connection error:", err.message);
});

export const rateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const ip = req.socket.remoteAddress;

  const key = "ratelimit:" + ip;

  const now = Date.now();

  const member = `${now}-${Math.random()}`;

  let results;

  try {
    const pipeline = redis.pipeline();
    pipeline.zremrangebyscore(key, "-inf", now - 60000);
    pipeline.zadd(key, now, member);
    pipeline.zcard(key);
    pipeline.expire(key, 60);
    results = await pipeline.exec();
  } catch (err) {
    console.error("Redis error, failing open:", err);
    return next(); // return here — stops function execution
  }

  if (!results) {
    return res.status(500).json({ error: "Pipeline failed" });
  }

  const count = results[2][1] as number;

  if (count > 5) {
    return res
      .status(429)
      .set("Retry-After", "60")
      .json({ error: "Too many requests" });
  }

  next();
};
