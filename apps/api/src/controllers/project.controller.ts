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

    const countRes = await pool.query(
      `SELECT COUNT(*)::int AS COUNT FROM projects WHERE user_id=$1`,
      [user_id],
    );

    if (countRes.rows[0].count >= 5) {
      return res.status(409).json({
        success: false,
        error: "Project limit reached. Maximum 5 projects per account.",
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

export const getProjectStats = async (
  req: Request,
  res: Response<
    ApiResponse<{
      event_count: number;
      notification_count: number;
      unread_count: number;
      last_event_at: string | null;
      unique_users: number;
    }>
  >,
) => {
  try {
    const user_id = req.userId;
    const { id } = req.params;

    const ownership = await pool.query(
      `SELECT id FROM projects WHERE id = $1 AND user_id = $2`,
      [id, user_id],
    );

    if (ownership.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Project ${id} doesn't exist`,
        code: "NOT_FOUND",
      });
    }

    const stats = await pool.query(
      `SELECT
        (SELECT COUNT(*)::int FROM events WHERE project_id = $1) AS event_count,
        (SELECT COUNT(*)::int FROM notifications WHERE project_id = $1) AS notification_count,
        (SELECT COUNT(*)::int FROM notifications WHERE project_id = $1 AND read = false) AS unread_count,
        (SELECT MAX(received_at) FROM events WHERE project_id = $1) AS last_event_at,
        (SELECT COUNT(DISTINCT user_id)::int FROM events WHERE project_id = $1) AS unique_users`,
      [id],
    );

    return res.json({
      success: true,
      data: stats.rows[0],
    });
  } catch (error) {
    console.error("Failed to fetch project stats:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch project stats",
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
      `SELECT id, user_id, name, rate_limit_per_min, channels, created_at
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

export const updateChannels = async (
  req: Request,
  res: Response<ApiResponse<{ channels: Project["channels"] }>>,
) => {
  try {
    const user_id = req.userId;
    const { id } = req.params;
    const body = req.body ?? {};

    if (typeof body !== "object" || Array.isArray(body)) {
      return res.status(400).json({
        success: false,
        error: "Body must be an object",
      });
    }

    const allowed = ["email", "slack", "inapp"];
    const requested = Object.keys(body).filter(
      (k) => body[k] !== undefined,
    );

    if (requested.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No channels to update",
      });
    }

    const unknown = requested.filter((k) => !allowed.includes(k));
    if (unknown.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Unknown channel${unknown.length > 1 ? "s" : ""}: ${unknown.join(", ")}`,
        code: "UNKNOWN_CHANNEL",
      });
    }

    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    for (const channel of requested) {
      const config = body[channel] ?? {};
      if (typeof config !== "object" || Array.isArray(config)) {
        return res.status(400).json({
          success: false,
          error: `Config for ${channel} must be an object`,
        });
      }

      if (channel === "email" && config.to !== undefined) {
        if (typeof config.to !== "string" || !emailRe.test(config.to.trim())) {
          return res.status(400).json({
            success: false,
            error: "A valid email address is required for the email channel",
            code: "INVALID_EMAIL",
          });
        }
      }

      if (channel === "slack" && config.webhook_url !== undefined) {
        if (
          typeof config.webhook_url !== "string" ||
          !config.webhook_url.trim().startsWith("https://")
        ) {
          return res.status(400).json({
            success: false,
            error: "Slack webhook URL must start with https://",
            code: "INVALID_WEBHOOK_URL",
          });
        }
      }
    }

    const existing = await pool.query(
      `SELECT channels FROM projects WHERE user_id=$1 AND id=$2`,
      [user_id, id],
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Project ${id} doesn't exist`,
        code: "NOT_FOUND",
      });
    }

    const current = (existing.rows[0].channels ?? {}) as Record<
      string,
      Record<string, unknown> | undefined
    >;
    const next = { ...current };

    for (const channel of requested) {
      const config = body[channel] ?? {};
      const enabled = config.enabled ?? true;

      if (enabled === false) {
        delete next[channel];
        continue;
      }

      const merged = { ...(next[channel] ?? {}) };

      for (const [field, value] of Object.entries(config)) {
        if (field === "enabled") continue;
        if (value === undefined) continue;
        merged[field] =
          typeof value === "string" ? value.trim() : value;
      }

      next[channel] = merged;
    }

    const result = await pool.query(
      `UPDATE projects
      SET channels = $1
      WHERE user_id = $2 AND id = $3
      RETURNING id, user_id, name, rate_limit_per_min, channels, created_at`,
      [JSON.stringify(next), user_id, id],
    );

    return res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Failed to update project channels:", error);
    if (error instanceof Error && "code" in error) {
      return res.status(500).json({
        success: false,
        error: error.message,
        code: error.code as string,
      });
    }
    return res.status(500).json({
      success: false,
      error: "Failed to update project channels",
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

    const result = await pool.query(
      `DELETE FROM projects
    WHERE user_id=$1 AND id=$2
    RETURNING id`,
      [user_id, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Project ${id} doesn't exist`,
        code: "NOT_FOUND",
      });
    }

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
