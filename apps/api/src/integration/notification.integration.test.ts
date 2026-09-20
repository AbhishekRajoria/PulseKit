import request from "supertest";
import app from "../app.ts";
import { beforeEach, describe, expect, it } from "vitest";
import { truncateTables } from "../../vitest.setup.ts";
import { createProject, loginUser } from "./helpers.ts";
import { pool } from "../db.ts";

const seedNotification = async (projectId: string, userId: string) => {
  const res = await pool.query(
    `INSERT INTO notifications (project_id, user_id, title, body)
    VALUES ($1, $2, $3, $4)
    RETURNING id, project_id, user_id, title, body, read`,
    [projectId, userId, "Payment failed", "Retry scheduled"],
  );
  return res.rows[0];
};

describe("GET /api/v1/notifications/project/:projectId/user/:userId", () => {
  it("returns the owner's notifications and unread count", async () => {
    const agent = await loginUser("owner@test.com");
    const created = await createProject(agent);
    const projectId = created.body.data.id;

    await seedNotification(projectId, "user_123");

    const res = await agent.get(
      `/api/v1/notifications/project/${projectId}/user/user_123`,
    );

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.notifications).toHaveLength(1);
    expect(res.body.data.notifications[0].title).toBe("Payment failed");
    expect(res.body.data.unread_count).toBe(1);
  });

  it("404s when another user tries to read the project's inbox", async () => {
    const owner = await loginUser("owner@test.com");
    const intruder = await loginUser("intruder@test.com");

    const created = await createProject(owner);
    const projectId = created.body.data.id;

    await seedNotification(projectId, "user_123");

    const res = await intruder.get(
      `/api/v1/notifications/project/${projectId}/user/user_123`,
    );

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe("NOT_FOUND");
  });

  it("404s for a non-existent project", async () => {
    const agent = await loginUser("owner@test.com");

    const res = await agent.get(
      `/api/v1/notifications/project/00000000-0000-0000-0000-000000000000/user/user_123`,
    );

    expect(res.status).toBe(404);
  });
});