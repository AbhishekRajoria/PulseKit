import { Router } from "express";
import { apiKeyAuth } from "../middleware/apiKeyAuth.ts";
import {
  getNotifications,
  markAllRead,
  markAsRead,
} from "../controllers/notification.controller.ts";

const router = Router();

router.patch("/read-all", apiKeyAuth, markAllRead);
router.get("/:userId", apiKeyAuth, getNotifications);
router.patch("/:id/read", apiKeyAuth, markAsRead);

export default router;
