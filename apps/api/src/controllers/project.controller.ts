import { pool } from "../db.ts";
import type { Request, Response } from "express";
import type { ApiResponse, Project } from "../types/index.ts";
import bcrypt from "bcryptjs";

export const createProject = async (
  req: Request,
  res: Response<ApiResponse<Project>>,
) => {
  try {
    const user_id = req.userId;
    const { name, rate_limit_per_min } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: "Missing required field: name",
        code: "MISSING_FIELD",
      });
    }

    if (
      rate_limit_per_min !== undefined &&
      (rate_limit_per_min < 5 || rate_limit_per_min > 30)
    ) {
      return res.status(400).json({
        success: false,
        error: "rate_limit_per_min must be between 5 and 30",
      });
    }

    const api_key = `pk_test_${crypto.randomUUID()}`;

    const hasRateLimit = rate_limit_per_min !== undefined;
    const result = await pool.query(
      `INSERT INTO projects (user_id, name, api_key${
        hasRateLimit ? ", rate_limit_per_min" : ""
      })
    VALUES( $1, $2, $3${hasRateLimit ? ", $4" : ""} ) RETURNING id, user_id, name, api_key, rate_limit_per_min, created_at`,
      hasRateLimit
        ? [user_id, name, api_key, rate_limit_per_min]
        : [user_id, name, api_key],
    );

    return res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Failed to create project:", error);
    if (error instanceof Error && "code" in error) {
      return res.status(500).json({
        success: false,
        error: error.message,
        code: error.code as string,
      });
    }
    return res.status(500).json({
      success: false,
      error: "Failed to create project",
    });
  }
};

export const getProjects = async (
  req: Request,
  res: Response<ApiResponse<Project[]>>,
) => {
  try {
    const user_id = req.userId;

    const result = await pool.query(
      `SELECT id, user_id, name, rate_limit_per_min, created_at
      FROM projects
      WHERE user_id=$1`,
      [user_id],
    );

    return res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    if (error instanceof Error && "code" in error) {
      return res.status(500).json({
        success: false,
        error: error.message,
        code: error.code as string,
      });
    }
    return res.status(500).json({
      success: false,
      error: "Failed to fetch projects",
    });
  }
};

export const getProjectById = async (
  req: Request,
  res: Response<ApiResponse<Project>>,
) => {
  try {
    const user_id = req.userId;
    const id = req.params.id;

    const result = await pool.query(
      `SELECT id, user_id, name, rate_limit_per_min, created_at
      FROM projects
      WHERE user_id=$1 AND id=$2`,
      [user_id, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Project ${id} doesn't exist`,
        code: "NOT_FOUND",
      });
    }

    return res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error(`Failed to fetch project`, error);
    if (error instanceof Error && "code" in error) {
      return res.status(500).json({
        success: false,
        error: error.message,
        code: error.code as string,
      });
    }
    return res.status(500).json({
      success: false,
      error: "Failed to fetch project",
    });
  }
};

export const updateProject = async (
  req: Request,
  res: Response<ApiResponse<Project>>,
) => {
  try {
    const user_id = req.userId;
    const { id } = req.params;
    const { name, rate_limit_per_min } = req.body;

    const sets: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      sets.push(`name = $${paramIndex++}`);
      values.push(name);
    }

    if (rate_limit_per_min !== undefined) {
      if (rate_limit_per_min < 5 || rate_limit_per_min > 30) {
        return res.status(400).json({
          success: false,
          error: "rate_limit_per_min must be between 5 and 30",
        });
      }
      sets.push(`rate_limit_per_min = $${paramIndex++}`);
      values.push(rate_limit_per_min);
    }

    if (sets.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No fields to update",
      });
    }

    values.push(user_id, id);
    const result = await pool.query(
      `UPDATE projects
      SET ${sets.join(", ")}
      WHERE user_id = $${paramIndex++} AND id = $${paramIndex}
      RETURNING id, user_id, name, rate_limit_per_min, created_at`,
      values,
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Project ${id} doesn't exist`,
        code: "NOT_FOUND",
      });
    }

    return res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Failed to update project:", error);
    if (error instanceof Error && "code" in error) {
      return res.status(500).json({
        success: false,
        error: error.message,
        code: error.code as string,
      });
    }
    return res.status(500).json({
      success: false,
      error: "Failed to update project",
    });
  }
};

export const deleteProject = async (
  req: Request,
  res: Response<ApiResponse<Project>>,
) => {
  try {
    const user_id = req.userId;
    const { id } = req.params;

    await pool.query(
      `DELETE FROM projects
    WHERE user_id=$1 AND id=$2`,
      [user_id, id],
    );

    return res.status(204).json({
      success: true,
    });
  } catch (error) {
    console.error(error);
    if (error instanceof Error && "code" in error) {
      return res.status(500).json({
        success: false,
        error: error.message,
        code: error.code as string,
      });
    }
    return res.status(500).json({
      success: false,
      error: "Failed to delete project",
    });
  }
};

export const revealApiKey = async (
  req: Request,
  res: Response<ApiResponse<{ api_key: string }>>,
) => {
  try {
    const user_id = req.userId;
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        error: "Missing required field: password",
        code: "MISSING_FIELD",
      });
    }

    const result = await pool.query(
      `SELECT * from users
    WHERE id=$1`,
      [user_id],
    );

    if (result.rows.length === 0) {
      res.clearCookie("userId");
      return res.status(401).json({
        success: false,
        error: "Session expired",
      });
    }

    const user = result.rows[0];

    const compare = await bcrypt.compare(password, user.password_hash);

    if (!compare) {
      return res.status(401).json({
        success: false,
        error: "Incorrect Password",
      });
    }

    const key = await pool.query(
      `SELECT api_key FROM projects
      WHERE user_id=$1 AND id=$2`,
      [user_id, id],
    );

    if (key.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Project ${id} doesn't exist`,
        code: "NOT_FOUND",
      });
    }

    return res.json({
      success: true,
      data: {
        api_key: key.rows[0].api_key,
      },
    });
  } catch (error) {
    console.error(error);
    if (error instanceof Error && "code" in error) {
      return res.status(500).json({
        success: false,
        error: error.message,
        code: error.code as string,
      });
    }
    return res.status(500).json({
      success: false,
      error: "Failed to reveal API key",
    });
  }
};
