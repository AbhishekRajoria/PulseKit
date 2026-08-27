import { Router } from "express";
import { rateLimiter } from "../middleware/rateLimiter.ts";
import {
  createEvent,
  getAllEvents,
  getEventbyId,
} from "../controllers/event.controller.ts";
import { apiKeyAuth } from "../middleware/apiKeyAuth.ts";

const router = Router();

router.get("/", apiKeyAuth, getAllEvents);
router.post("/", apiKeyAuth, rateLimiter, createEvent);
router.get("/:id", apiKeyAuth, getEventbyId);

export default router;
