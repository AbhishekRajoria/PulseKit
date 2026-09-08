import { pool } from "../db.ts";
import type { Request, Response } from "express";
import type { ApiResponse, NotificationRow } from "../types/index.ts";

type NotificationResponse = {
  notifications: NotificationRow[];
  unread_count: number;
};

export const getNotifications = async (
  req: Request,
  res: Response<ApiResponse<NotificationResponse>>,
) => {
  try {
    const project_id = req.project_id;
    const user_Id = req.params.userId;

    const result = await pool.query(
      `SELECT id, project_id, user_id, title, body, read, created_at
      FROM notifications
      WHERE project_id = $1 AND user_id = $2
      ORDER BY created_at DESC
      LIMIT 50`,
      [project_id, user_Id],
    );

    const unread = await pool.query(
      `SELECT COUNT(*)::int AS count
      FROM notifications
      WHERE project_id = $1 AND user_id = $2 AND read = false`,
      [project_id, user_Id],
    );

    return res.json({
      success: true,
      data: {
        notifications: result.rows,
        unread_count: unread.rows[0].count,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch notifications.",
      code: "DB_ERROR",
    });
  }
};

export const markAllRead = async (
  req: Request,
  res: Response<ApiResponse<{ count: number }>>,
) => {
  const project_id = req.project_id;
  const { userId } = req.body ?? {};

  if (!userId) {
    return res.status(400).json({
      success: false,
      error: "userId is required.",
      code: "BAD_REQUEST",
    });
  }

  try {
    const result = await pool.query(
      `UPDATE notifications
      SET read = true
      WHERE project_id = $1 AND user_id = $2 AND read = false`,
      [project_id, userId],
    );

    return res.json({
      success: true,
      data: { count: result.rowCount ?? 0 },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      error: "Failed to mark all notifications as read.",
      code: "DB_ERROR",
    });
  }
};

export const markAsRead = async (
  req: Request,
  res: Response<ApiResponse<NotificationRow>>,
) => {
  const project_id = req.project_id;
  const id = req.params.id;

  try {
    const result = await pool.query(
      `UPDATE notifications
      SET read = true
      WHERE id=$1 AND project_id=$2
      RETURNING id, project_id, user_id, title, body, read, created_at`,
      [id, project_id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Notification with id:${id} not found.`,
        code: "NOT_FOUND",
      });
    }

    return res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      error: `Failed to mark notification as read.`,
      code: "DB_ERROR",
    });
  }
};
