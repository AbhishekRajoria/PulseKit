import request from "supertest";
import app from "../app.ts";
import { beforeEach, describe, expect, it } from "vitest";
import { truncateTables } from "../../vitest.setup.ts";

beforeEach(async () => truncateTables());

describe("auth", () => {
  describe("POST /auth/register", () => {
    it("registers a user and never returns the hash", async () => {
      const res = await request(app).post("/auth/register").send({
        email: "pulsekit@test.com",
        password: "test@123",
        name: "TestUser",
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe("pulsekit@test.com");
      expect(res.body.data).not.toHaveProperty("password_hash");
    });
    it("sets the signed userId cookie so register auto-sessions the user", async () => {
      const agent = request.agent(app);

      const reg = await agent.post("/auth/register").send({
        email: "cookie@test.com",
        password: "test@123",
        name: "Cookie",
      });

      expect(reg.status).toBe(201);
      expect(String(reg.headers["set-cookie"])).toContain("userId=");

      const me = await agent.get("/auth/me");
      expect(me.status).toBe(200);
      expect(me.body.data.id).toBe(reg.body.data.id);
    });
    it("400s on missing email", async () => {
      const res = await request(app)
        .post("/auth/register")
        .send({ password: "SuperSecret1" }); // no email field

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("MISSING_FIELD");
    });
    it("409s when the email is already taken", async () => {
      const payload = {
        email: "bob@test.com",
        password: "SuperSecret1",
        name: "Bob",
      };
      await request(app).post("/auth/register").send(payload); // first: 201
      const second = await request(app).post("/auth/register").send(payload); // again

      expect(second.status).toBe(409);
    });
  });

  describe("POST /auth/login + GET /auth/me", () => {
    it("logs in and holds the session cookie across calls", async () => {
      const agent = request.agent(app);

      await agent.post("/auth/register").send({
        email: "pulsekit@test.com",
        password: "test@123",
        name: "TestUser",
      });

      const res = await agent.post("/auth/login").send({
        email: "pulsekit@test.com",
        password: "test@123",
      });

      const me = await agent.get("/auth/me");

      expect(me.status).toBe(200);
      expect(me.body.data.id).toBe(res.body.data.id);
    });
    it("401s /me without a cookie", async () => {
      const res = await request(app).get("/auth/me");
      expect(res.status).toBe(401);
    });
    it("returns the same 401 body for unknown email and wrong password", async () => {
      // precondition: a real user must exist, or "wrong password" can't be distinguished
      await request(app).post("/auth/register").send({
        email: "dave@test.com",
        password: "SuperSecret1",
        name: "Dave",
      });

      // wrong password — user EXISTS, password wrong
      const wrongPass = await request(app)
        .post("/auth/login")
        .send({ email: "dave@test.com", password: "WrongPassword1" });
      // unknown email — user NEVER existed
      const unknownEmail = await request(app)
        .post("/auth/login")
        .send({ email: "ghost@test.com", password: "SuperSecret1" });

      expect(wrongPass.status).toBe(401);
      expect(unknownEmail.status).toBe(401);
      expect(wrongPass.body.error).toBe(unknownEmail.body.error); // the claim
      expect(wrongPass.body.error).toBe("Invalid email or password");
    });
  });
});
