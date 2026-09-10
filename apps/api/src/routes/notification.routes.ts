import { Router } from "express";
import { apiKeyAuth } from "../middleware/apiKeyAuth.ts";
import { rateLimiter } from "../middleware/rateLimiter.ts";
import {
  getNotifications,
  markAllRead,
  markAsRead,
} from "../controllers/notification.controller.ts";
import { authenticate } from "../middleware/authenticate.ts";

const router = Router();

router.get("/:userId", apiKeyAuth, rateLimiter, getNotifications);
router.patch("/read-all", authenticate, markAllRead);
router.patch("/:id/read", authenticate, markAsRead);

export default router;
