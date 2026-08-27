import type { Request, Response, NextFunction } from "express";
import { pool } from "../db.ts";

export const apiKeyAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const bearer_key = req.headers.authorization;
  
  let api_key = bearer_key?.split(" ")[1];

  // Dev fallback — skip auth check in development
  if (!api_key && process.env.NODE_ENV !== "production") {
    api_key = "dev_apikey_123";
  }

  const project = await pool.query(
    `SELECT id from projects where api_key = $1`,
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

  next();
};
