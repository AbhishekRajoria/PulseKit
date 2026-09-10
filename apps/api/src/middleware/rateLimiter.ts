import { type Request, type Response, type NextFunction } from "express";
import { redis } from "../lib/redis.ts";
// READING LUA ATOMIC SCRIPT ON STARTUP
import { readFileSync } from "node:fs";

const script = readFileSync(new URL("./script.lua", import.meta.url), "utf8");

declare module "ioredis" {
  interface Redis {
    // you write this part
    slidingWindowLimit(
      key: string,
      now: number,
      window: number,
      limit: number,
      member: string,
    ): Promise<[number, number]>;
  }
}


redis.defineCommand("slidingWindowLimit", {
  numberOfKeys: 1,
  lua: script,
});

export const rateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const project_id = req.project_id;
  const rate_limit_per_min = req.rate_limit_per_min;

  const key = "ratelimit:project:" + project_id;

  const now = Date.now();

  const member = `${now}-${Math.random()}`;

  const [allowed, count] = await redis.slidingWindowLimit(
    key,
    now,
    60000,
    rate_limit_per_min ?? 5,
    member,
  );

  if (!allowed) {
    return res
      .status(429)
      .set("Retry-After", "60")
      .json({ success: false, error: "Too many requests" });
  }
  next();
};
