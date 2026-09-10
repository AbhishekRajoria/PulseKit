import { Router } from "express";
import { rateLimiter } from "../middleware/rateLimiter.ts";
import {
  createProject,
  deleteProject,
  getProjectById,
  getProjects,
  revealApiKey,
  updateProject,
} from "../controllers/project.controller.ts";

const router = Router();

router.get("/", getProjects);
router.post("/", createProject);
router.get("/:id", getProjectById);
router.put("/:id", updateProject);
router.delete("/:id", deleteProject);
router.get("/:id", revealApiKey);

export default router;
