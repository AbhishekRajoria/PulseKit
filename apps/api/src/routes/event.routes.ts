import { Router } from "express";
import { rateLimiter } from "../middleware/rateLimiter.ts";
import {
  createEvent,
  getAllEvents,
  getEventbyId,
} from "../controllers/event.controller.ts";

const router = Router();

router.get("/", getAllEvents);
router.post("/", rateLimiter, createEvent);
router.get("/:id", getEventbyId);

export default router;
