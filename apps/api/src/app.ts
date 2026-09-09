import express from "express";

import eventRouter from "./routes/event.routes.ts";
import notificationRouter from "./routes/notification.routes.ts";
import authRouter from "./routes/auth.routes.ts";

import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import { emailQueue } from "./lib/queue.ts";
import { pool } from "./db.ts";

import cookieParser from "cookie-parser";

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");

createBullBoard({
  queues: [new BullMQAdapter(emailQueue)],
  serverAdapter,
});

const app = express();

app.use(express.json());
app.use(cookieParser(process.env.COOKIE_SECRET));

app.use("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).json({
      success: true,
    });
  } catch (error) {
    console.error("Health check DB probe failed:", error);
    res.status(503).json({ success: false });
  }
});

app.use("/auth", authRouter);

app.use("/api/v1/events", eventRouter);

app.use("/api/v1/notifications", notificationRouter);

if (process.env.NODE_ENV !== "production") {
  app.use("/admin/queues", serverAdapter.getRouter());
}

export default app;
