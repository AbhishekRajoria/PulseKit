import express from "express";
import eventRouter from "./routes/event.routes.ts";

const app = express();
app.use(express.json());
app.use("/api/events", eventRouter);

export default app;
