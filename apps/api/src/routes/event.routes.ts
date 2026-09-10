import { Router } from "express";
import { rateLimiter } from "../middleware/rateLimiter.ts";
import {
  notify,
  getAllEvents,
  getEventbyId,
} from "../controllers/event.controller.ts";
import { apiKeyAuth } from "../middleware/apiKeyAuth.ts";
import { authenticate } from "../middleware/authenticate.ts";

const router = Router();

router.get("/", authenticate, getAllEvents);
router.post("/", apiKeyAuth, rateLimiter, notify);
router.get("/:id", authenticate, getEventbyId);

export default router;

