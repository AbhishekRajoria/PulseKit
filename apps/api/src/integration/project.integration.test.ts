import request from "supertest";
import app from "../app.ts";
import { beforeEach, describe, expect, it } from "vitest";
import { truncateTables } from "../../vitest.setup.ts";

beforeEach(async () => truncateTables());

async function loginUser(email: string) {
  const agent = request.agent(app);
  await agent
    .post("/auth/register")
    .send({ email, password: "Test@123", name: "Dev" });
  await agent.post("/auth/login").send({ email, password: "Test@123" });
  return agent;
}

async function createProject(
  agent: ReturnType<typeof request.agent>,
  name = "My App",
) {
  const res = await agent.post("/api/v1/projects").send({ name });
  return res;
}

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
