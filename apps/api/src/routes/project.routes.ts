import { Router } from "express";
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
router.patch("/:id", updateProject);
router.delete("/:id", deleteProject);
router.post("/:id/reveal-key", revealApiKey);

export default router;
