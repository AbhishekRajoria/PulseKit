import request from "supertest";
import app from "../app.ts";
import { beforeEach, describe, expect, it } from "vitest";
import { truncateTables } from "../../vitest.setup.ts";
import { createProject, loginUser } from "./helpers.ts";
import { emailQueue } from "../lib/queue.ts";
import { redis, redisSub } from "../lib/redis.ts";

const waitForJobSettled = async (timeoutMs = 5000) => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const { completed, waiting, active } = await emailQueue.getJobCounts();
    if (completed + waiting + active > 0) return true;
    await new Promise((r) => setTimeout(r, 200));
  }
  return false;
};

beforeEach(async () => {
  await truncateTables();
  await redis.flushdb();
});

describe("POST /api/v1/events ", () => {
  it("ingests an event, returns 202 and queues a job", async () => {
    const agent = await loginUser("pulsekit@test.com");
    const created = await createProject(agent);

    const apiKey = created.body.data.api_key;

    const res = await request(app)
      .post("/api/v1/events")
      .set("Authorization", `Bearer ${apiKey}`)
      .send({ event_name: "payment.failed", user_id: "user_123" });

    expect(res.status).toBe(202);
    expect(res.body.success).toBe(true);
    expect(res.body.data.eventId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    expect(typeof res.body.data.receivedAt).toBe("string");
    expect(await waitForJobSettled()).toBe(true);
  });

  it("broadcasts event_received on ingest so the live feed updates immediately", async () => {
    const agent = await loginUser("pulsekit@test.com");
    const created = await createProject(agent);

    const apiKey = created.body.data.api_key;
    const projectId = created.body.data.id;

    let resolveMsg: (msg: { type: string; data: unknown }) => void;
    const msgPromise = new Promise<{ type: string; data: unknown }>(
      (r) => (resolveMsg = r),
    );
    const onMessage = (_channel: string, message: string) => {
      const parsed = JSON.parse(message);
      if (parsed.type === "event_received") resolveMsg(parsed);
    };

    await redisSub.unsubscribe();
    redisSub.on("message", onMessage);
    await redisSub.subscribe("delivery_updates");

    const res = await request(app)
      .post("/api/v1/events")
      .set("Authorization", `Bearer ${apiKey}`)
      .send({ event_name: "payment.failed", user_id: "user_123" });

    expect(res.status).toBe(202);

    const msg = await msgPromise;
    // cleanup the per-test listener so other tests don't see it
    redisSub.off("message", onMessage);
    await redisSub.unsubscribe();

    expect(msg.data).toMatchObject({
      projectId,
      eventId: res.body.data.eventId,
      eventName: "payment.failed",
      userId: "user_123",
    });
    expect(typeof (msg.data as { receivedAt: unknown }).receivedAt).toBe(
      "string",
    );
  });

  it("400s when event_name is missing", async () => {
    const agent = await loginUser("pulsekit@test.com");

    const created = await createProject(agent);

    const apiKey = created.body.data.api_key;

    const res = await request(app)
      .post("/api/v1/events")
      .set("Authorization", `Bearer ${apiKey}`)
      .send({ user_id: "user_123" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe("MISSING_FIELD");
  });

  it("401s on a wrong API key", async () => {
    const res = await request(app)
      .post("/api/v1/events")
      .set("Authorization", `Bearer pk_test_fake`)
      .send({ user_id: "user_123" });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe("UNAUTHORIZED");
  });

  it("tripwire: a dashboard cookie cannot auth the SDK route", async () => {
    const agent = await loginUser("pulsekit@test.com");

    const res = await request(app)
      .post("/api/v1/events")
      .send({ event_name: "payment.failed", user_id: "user_123" });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe("MISSING_API_KEY");
  });

  it("tripwire: an API key cannot auth a dashboard route", async () => {
    const agent = await loginUser("pulsekit@test.com");

    const created = await createProject(agent);

    const apiKey = created.body.data.api_key;

    const res = await request(app)
      .get(`/api/v1/events?project_id=fakeid`)
      .set("Authorization", `Bearer ${apiKey}`);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe("UNAUTHENTICATED");
  });
});
