import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { rateLimiter } from "./rateLimiter.ts";
import { Redis } from "ioredis";

const redis = new Redis();

const makeReq = (ip: string) => {
  return { socket: { remoteAddress: ip } } as unknown as Request;
};

const makeRes = () => {
  const res = {} as Response;
  res.status = vi.fn().mockReturnThis();
  res.set = vi.fn().mockReturnThis();
  res.json = vi.fn().mockReturnThis();
  return res;
};

beforeEach(async () => {
  await redis.flushdb();
});

describe("rateLimiter", () => {
  it("allows 5 requests then blocks the 6th", async () => {
    const req = makeReq("::1");
    const next = vi.fn();

    for (let i = 0; i < 5; i++) {
      await rateLimiter(req, makeRes(), next);
      expect(next).toHaveBeenCalledTimes(i + 1);
    }

    const res = makeRes();
    await rateLimiter(req, res, next);
    expect(res.status).toHaveBeenCalledWith(429);
    expect(next).toHaveBeenCalledTimes(5);
  });

  it("Blocked responses carry the right headers", async () => {
    const req = makeReq("::1");
    const next = vi.fn();
    const res = makeRes();

    for (let i = 0; i < 5; i++) {
      await rateLimiter(req, res, next);
      expect(next).toHaveBeenCalledTimes(i + 1);
    }

    await rateLimiter(req, res, next);

    expect(res.set).toHaveBeenCalledWith("Retry-After", "60");
  });

  it("Blocked Attempt don't consume quota", async () => {
    const req = makeReq("::1");
    const next = vi.fn();
    const res = makeRes();

    for (let i = 0; i < 5; i++) {
      await rateLimiter(req, res, next);
      expect(next).toHaveBeenCalledTimes(i + 1);
    }

    expect(next).toHaveBeenCalledTimes(5);

    for (let i = 0; i < 20; i++) {
      await rateLimiter(req, res, next);
      expect(res.status).toHaveBeenCalledWith(429);
    }

    const count = await redis.zcard("ratelimit:::1");

    expect(count).toEqual(5);
  });

  it("Window slides after 60 sec", async () => {
    vi.useFakeTimers()

    try {
      const req = makeReq("::1");
      const next = vi.fn();
      const res = makeRes();

      for (let i = 0; i < 5; i++) {
        await rateLimiter(req, res, next);
        expect(next).toHaveBeenCalledTimes(i + 1);
      }

      expect(await redis.zcard("ratelimit:::1")).toEqual(5)

      vi.setSystemTime(Date.now() + 61_000);

      await rateLimiter(req, res, next);

      const count = await redis.zcard("ratelimit:::1");

      expect(count).toEqual(1)

    } finally {
      vi.useRealTimers()
    }

  });
});
