import type { Request, Response, NextFunction } from "express";
import { pool } from "../db.ts";

export const apiKeyAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const bearer_key = req.headers.authorization;

  const api_key = bearer_key?.split(" ")[1];

  if (!api_key) {
    return res.status(401).json({
      success: false,
      error: "Missing API key. Send it as: Authorization: Bearer <your-api-key>",
      code: "MISSING_API_KEY",
    });
  }

  const project = await pool.query(
    `SELECT id, rate_limit_per_min from projects where api_key = $1`,
    [api_key],
  );

  if (project.rows.length === 0) {
    return res.status(401).json({
      success: false,
      error: "Invalid API key or project",
      code: "UNAUTHORIZED",
    });
  }

  req.project_id = project.rows[0].id;
  req.rate_limit_per_min = project.rows[0].rate_limit_per_min;

  next();
};
