import request from "supertest";
import app from "../app.ts";
import { beforeEach, describe, expect, it } from "vitest";
import { truncateTables } from "../../vitest.setup.ts";
import { createProject, loginUser } from "./helpers.ts";
import { pool } from "../db.ts";

beforeEach(async () => truncateTables());

describe("POST /api/v1/projects", () => {
  it("401s without auth", async () => {
    const res = await request(app).post("/api/v1/projects").send({
      name: "Test Project",
    });

    expect(res.status).toBe(401);
  });

  it("creates a project with a pk_test_ key", async () => {
    const agent = await loginUser("pulsekit@test.com");

    const res = await createProject(agent);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.api_key).toMatch(/^pk_test_/);
    expect(res.body.data.rate_limit_per_min).toBe(30);
  });

  it("400s when name is missing", async () => {
    const agent = await loginUser("pulsekit2@test.com");

    const res = await agent.post("/api/v1/projects").send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe("MISSING_FIELD");
  });

  it("allows the 5th project but 409s on the 6th", async () => {
    const agent = await loginUser("pulsekit3@test.com");

    for (let i = 1; i < 6; i++) {
      const res = await createProject(agent, `Test_Project_${i}`);

      expect(res.status).toBe(201);
    }

    const failed = await createProject(agent, `Test_Project_${6}`);

    expect(failed.status).toBe(409);
  });
});

describe("GET /api/v1/projects/:id", () => {
  it("404s when another user tries to read the project", async () => {
    const agent1 = await loginUser("user1@test.com");
    const agent2 = await loginUser("user2@test.com");

    const created = await createProject(agent1);
    const res = await agent2.get(`/api/v1/projects/${created.body.data.id}`);

    expect(res.status).toBe(404);
  });
});

describe("PATCH /api/v1/projects/:id/channels", () => {
  it("401s without auth", async () => {
    const res = await request(app)
      .patch("/api/v1/projects/some-id/channels")
      .send({ email: { enabled: true } });

    expect(res.status).toBe(401);
  });

  it("enables email with a valid to address", async () => {
    const agent = await loginUser("channels1@test.com");
    const created = await createProject(agent);
    const id = created.body.data.id;

    const res = await agent
      .patch(`/api/v1/projects/${id}/channels`)
      .send({ email: { enabled: true, to: "dev@example.com" } });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.channels.email).toEqual({ to: "dev@example.com" });
  });

  it("merges instead of replacing untouched channels", async () => {
    const agent = await loginUser("channels2@test.com");
    const created = await createProject(agent);
    const id = created.body.data.id;

    await agent
      .patch(`/api/v1/projects/${id}/channels`)
      .send({ email: { enabled: true, to: "dev@example.com" } });

    const res = await agent
      .patch(`/api/v1/projects/${id}/channels`)
      .send({ slack: { enabled: true, webhook_url: "https://hooks.slack.com/abc" } });

    expect(res.status).toBe(200);
    expect(res.body.data.channels.email).toEqual({ to: "dev@example.com" });
    expect(res.body.data.channels.slack).toEqual({
      webhook_url: "https://hooks.slack.com/abc",
    });
  });

  it("removes a channel key entirely when disabled", async () => {
    const agent = await loginUser("channels3@test.com");
    const created = await createProject(agent);
    const id = created.body.data.id;

    await agent
      .patch(`/api/v1/projects/${id}/channels`)
      .send({ email: { enabled: true, to: "dev@example.com" } });

    const res = await agent
      .patch(`/api/v1/projects/${id}/channels`)
      .send({ email: { enabled: false } });

    expect(res.status).toBe(200);
    expect(res.body.data.channels.email).toBeUndefined();
  });

  it("400s on an invalid email to address", async () => {
    const agent = await loginUser("channels4@test.com");
    const created = await createProject(agent);
    const id = created.body.data.id;

    const res = await agent
      .patch(`/api/v1/projects/${id}/channels`)
      .send({ email: { enabled: true, to: "not-an-email" } });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID_EMAIL");
  });

  it("400s on a non-https slack webhook", async () => {
    const agent = await loginUser("channels5@test.com");
    const created = await createProject(agent);
    const id = created.body.data.id;

    const res = await agent
      .patch(`/api/v1/projects/${id}/channels`)
      .send({ slack: { enabled: true, webhook_url: "http://hooks.slack.com/abc" } });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID_WEBHOOK_URL");
  });

  it("400s on an unknown channel", async () => {
    const agent = await loginUser("channels6@test.com");
    const created = await createProject(agent);
    const id = created.body.data.id;

    const res = await agent
      .patch(`/api/v1/projects/${id}/channels`)
      .send({ sms: { enabled: true } });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("UNKNOWN_CHANNEL");
  });

  it("404s when another user tries to configure a project's channels", async () => {
    const agent1 = await loginUser("channels7@test.com");
    const agent2 = await loginUser("channels8@test.com");

    const created = await createProject(agent1);

    const res = await agent2
      .patch(`/api/v1/projects/${created.body.data.id}/channels`)
      .send({ email: { enabled: true, to: "dev@example.com" } });

    expect(res.status).toBe(404);
  });
});

describe("PATCH /api/v1/projects/:id", () => {
  it("renames a project and updates its rate limit", async () => {
    const agent = await loginUser("proj-patch1@test.com");
    const project = await createProject(agent, "Old Name");
    const id = project.body.data.id;

    const res = await agent
      .patch(`/api/v1/projects/${id}`)
      .send({ name: "New Name", rate_limit_per_min: 15 });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("New Name");
    expect(res.body.data.rate_limit_per_min).toBe(15);
  });

  it("400s when rate limit is out of range", async () => {
    const agent = await loginUser("proj-patch2@test.com");
    const project = await createProject(agent);
    const id = project.body.data.id;

    const res = await agent
      .patch(`/api/v1/projects/${id}`)
      .send({ rate_limit_per_min: 100 });

    expect(res.status).toBe(400);
  });

  it("400s when there is nothing to update", async () => {
    const agent = await loginUser("proj-patch3@test.com");
    const project = await createProject(agent);
    const id = project.body.data.id;

    const res = await agent.patch(`/api/v1/projects/${id}`).send({});

    expect(res.status).toBe(400);
  });

  it("404s when another user tries to update the project", async () => {
    const agent1 = await loginUser("proj-patch-owner@test.com");
    const agent2 = await loginUser("proj-patch-other@test.com");
    const project = await createProject(agent1);
    const id = project.body.data.id;

    const res = await agent2
      .patch(`/api/v1/projects/${id}`)
      .send({ name: "Hijack" });

    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/v1/projects/:id", () => {
  it("deletes the project and cascades its events", async () => {
    const agent = await loginUser("proj-del1@test.com");
    const project = await createProject(agent);
    const id = project.body.data.id;

    const ingest = await request(app)
      .post("/api/v1/events")
      .set("Authorization", `Bearer ${project.body.data.api_key}`)
      .send({ event_name: "payment.failed", user_id: "user_1" });
    expect(ingest.status).toBe(202);

    const del = await agent.delete(`/api/v1/projects/${id}`);
    expect(del.status).toBe(204);

    const get = await agent.get(`/api/v1/projects/${id}`);
    expect(get.status).toBe(404);

    const events = await pool.query(
      `SELECT COUNT(*)::int AS c FROM events WHERE project_id=$1`,
      [id],
    );
    expect(events.rows[0].c).toBe(0);
  });

  it("404s when another user deletes (nothing deleted)", async () => {
    const agent1 = await loginUser("proj-del-owner@test.com");
    const agent2 = await loginUser("proj-del-other@test.com");
    const project = await createProject(agent1);
    const id = project.body.data.id;

    const res = await agent2.delete(`/api/v1/projects/${id}`);
    expect(res.status).toBe(404);

    const stillThere = await agent1.get(`/api/v1/projects/${id}`);
    expect(stillThere.status).toBe(200);
  });
});
