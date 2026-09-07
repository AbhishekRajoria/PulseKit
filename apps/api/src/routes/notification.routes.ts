import { Router } from "express";
import { apiKeyAuth } from "../middleware/apiKeyAuth.ts";
import {
  getNotifications,
  markAsRead,
} from "../controllers/notification.controller.ts";

const router = Router();

router.get("/:userId", apiKeyAuth, getNotifications);
router.patch("/:id/read", apiKeyAuth, markAsRead);

export default router;
