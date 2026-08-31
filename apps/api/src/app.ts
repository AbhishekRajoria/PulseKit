import express from "express";
import eventRouter from "./routes/event.routes.ts";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import { emailQueue } from "./lib/queue.ts";

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");

createBullBoard({
  queues: [new BullMQAdapter(emailQueue)],
  serverAdapter,
});

const app = express();
app.use(express.json());
app.use("/api/v1/events", eventRouter);

if (process.env.NODE_ENV !== "production") {
  app.use("/admin/queues", serverAdapter.getRouter());
}

export default app;
