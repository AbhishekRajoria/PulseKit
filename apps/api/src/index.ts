import express, { type Express, type Request, type Response } from "express";
import testRouter from "./routes/test.Routes.ts";

const app: Express = express();

app.use(express.json());

app.use("/", testRouter);

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
