import request from "supertest";
import app from "../app.ts";

export async function loginUser(email: string) {
  const agent = request.agent(app);
  await agent
    .post("/auth/register")
    .send({ email, password: "Test@123", name: "Dev" });
  await agent.post("/auth/login").send({ email, password: "Test@123" });
  return agent;
}

export async function createProject(
  agent: ReturnType<typeof request.agent>,
  name = "My App",
) {
  const res = await agent.post("/api/v1/projects").send({ name });
  return res;
}