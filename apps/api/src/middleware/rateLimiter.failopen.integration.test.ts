import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";

// Redis is DOWN in this file — every command rejects. Proves the limiter
// fails open (next()) instead of 500ing ingest when Upstash is unreachable
// (2026-09-26 outage: cap exceeded → HTML 500 on every POST).
vi.mock("../lib/redis.ts", () => ({
  redis: {
    defineCommand: vi.fn(),
    slidingWindowLimit: vi.fn().mockRejectedValue(new Error("Redis down")),
  },
  redisSub: { on: vi.fn() },
}));

import { rateLimiter } from "./rateLimiter.ts";

const mockRes = () =>
  ({
    status: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  }) as unknown as Response;

describe("rateLimiter fail-open", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls next() without responding when Redis throws", async () => {
    const req = {
      project_id: "project-a",
      rate_limit_per_min: 5,
    } as unknown as Request;
    const res = mockRes();
    const next = vi.fn();

    await rateLimiter(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });
});
