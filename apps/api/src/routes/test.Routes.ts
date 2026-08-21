import { Router } from "express";
import { test } from "../controllers/test.controller.ts";
import { rateLimiter } from "../middleware/rateLimiter.ts";

const router = Router();

router.get("/", rateLimiter, test);

export default router;
