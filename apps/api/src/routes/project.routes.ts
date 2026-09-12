import { Router } from "express";
import {
  createProject,
  deleteProject,
  getProjectById,
  getProjects,
  getProjectStats,
  revealApiKey,
  updateProject,
} from "../controllers/project.controller.ts";

const router = Router();

router.get("/", getProjects);
router.post("/", createProject);
router.get("/:id", getProjectById);
router.get("/:id/stats", getProjectStats);
router.patch("/:id", updateProject);
router.delete("/:id", deleteProject);
router.post("/:id/reveal-key", revealApiKey);

export default router;
