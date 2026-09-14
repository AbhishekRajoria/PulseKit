import { beforeEach, describe, expect, it } from "vitest";
import { truncateTables } from "../../vitest.setup.ts";
import { redis } from "../lib/redis.ts";
import { loginUser } from "./helpers.ts";

beforeEach(async () => {
  await truncateTables();
  await redis.flushdb();
});

describe("POST /api/v1/events rate limiting", () => {
  it("allows 5 requests then 429s the 6th with Retry-After: 60", async () => {
    const agent = await loginUser("pulsekit@test.com");

    const created = await agent.post("/api/v1/projects").send({
      name: "Test Project",
      rate_limit_per_min: 5,
    });

    for (let i = 0; i < 5; i++) {
      const res = await agent
        .post(`/api/v1/events`)
        .set("Authorization", `Bearer ${created.body.data.api_key}`)
        .send({ event_name: "payment.failed", user_id: "user_123" });

      expect(res.status).toBe(202);
    }

    const res = await agent
      .post(`/api/v1/events`)
      .set("Authorization", `Bearer ${created.body.data.api_key}`)
      .send({ event_name: "payment.failed", user_id: "user_123" });

    expect(res.status).toBe(429);
    expect(res.headers["retry-after"]).toBe("60");
  });

  it("blocked requests do not consume quota (zcard stays at 5)", async () => {
    const agent = await loginUser("pulsekit@test.com");

    const created = await agent.post("/api/v1/projects").send({
      name: "Test Project",
      rate_limit_per_min: 5,
    });

    for (let i = 0; i < 5; i++) {
      const res = await agent
        .post(`/api/v1/events`)
        .set("Authorization", `Bearer ${created.body.data.api_key}`)
        .send({ event_name: "payment.failed", user_id: "user_123" });

      expect(res.status).toBe(202);
    }

    const res = await agent
      .post(`/api/v1/events`)
      .set("Authorization", `Bearer ${created.body.data.api_key}`)
      .send({ event_name: "payment.failed", user_id: "user_123" });

    expect(res.status).toBe(429);
    expect(res.headers["retry-after"]).toBe("60");
    expect(await redis.zcard(`ratelimit:project:${created.body.data.id}`)).toBe(
      5,
    );
  });
});
