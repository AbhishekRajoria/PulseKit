import type { Request, Response } from "express";
import { pool } from "../db.ts";
import type { ApiResponse, DeliveryRow, EventRow } from "../types/index.ts";
import { emailQueue } from "../lib/queue.ts";

export const getAllEvents = async (
  req: Request,
  res: Response<ApiResponse<(EventRow & { logs: DeliveryRow[] })[]>>,
) => {
  try {
    const user_id = req.userId;
    const project_id = req.query.project_id as string;

    if (!project_id) {
      return res.status(400).json({
        success: false,
        error: "Missing required field: project_id",
        code: "MISSING_FIELD",
      });
    }

    const ownership = await pool.query(
      `SELECT id FROM projects WHERE id = $1 AND user_id = $2`,
      [project_id, user_id],
    );

    if (ownership.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
        code: "NOT_FOUND",
      });
    }

    const result = await pool.query(
      `SELECT e.*, COALESCE(json_agg( json_build_object(
        'id', d.id, 'event_id', d.event_id, 'project_id', d.project_id, 'channel', d.channel, 'status', d.status, 'attempt_number', d.attempt_number, 'error_message', d.error_message, 'delivered_at', d.delivered_at)) FILTER (WHERE d.id IS NOT NULL), '[]') as logs
      FROM events e LEFT JOIN delivery_logs d
      ON e.id = d.event_id
      WHERE e.project_id = $1
      GROUP BY e.id`,
      [project_id],
    );

    return res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch events",
      code: "DB_ERROR",
    });
  }
};

export const notify = async (
  req: Request,
  res: Response<ApiResponse<EventRow>>,
) => {
  const { event_name, user_id } = req.body;
  const payload = req.body.payload ?? {};
  const project_id = req.project_id;

  if (!event_name) {
    return res.status(400).json({
      success: false,
      error: "Missing required field: event",
      code: "MISSING_FIELD",
    });
  }
  if (!user_id) {
    return res.status(400).json({
      success: false,
      error: "Missing required field: user_Id",
      code: "MISSING_FIELD",
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO events (project_id, event_name, user_id, payload)
        VALUES ($1, $2, $3, $4)
        RETURNING *`,
      [project_id, event_name, user_id, payload],
    );

    await emailQueue.add(
      "email",
      {
        event_id: result.rows[0].id,
        project_id,
        user_id,
        event_name,
        payload,
      },
      {
        attempts: 5,
        backoff: {
          type: "exponential",
          delay: 2000 * (0.8 + Math.random() * 0.4),
        },
      },
    );

    return res.status(202).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({
      success: false,
      error: `Failed to create event: ${message}`,
      code: "DB_ERROR",
    });
  }
};

export const getEventbyId = async (
  req: Request,
  res: Response<ApiResponse<EventRow & { logs: DeliveryRow[] }>>,
) => {
  const { id } = req.params;
  const user_id = req.userId;
  const project_id = req.query.project_id as string;

  if (!project_id) {
    return res.status(400).json({
      success: false,
      error: "Missing required field: project_id",
      code: "MISSING_FIELD",
    });
  }

  try {
    const ownership = await pool.query(
      `SELECT id FROM projects WHERE id = $1 AND user_id = $2`,
      [project_id, user_id],
    );

    if (ownership.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
        code: "NOT_FOUND",
      });
    }

    const event = await pool.query(
      `
      SELECT e.*, COALESCE(json_agg(json_build_object(
        'id', d.id, 'event_id', d.event_id, 'project_id', d.project_id, 'channel', d.channel, 'status', d.status, 'attempt_number', d.attempt_number, 'error_message', d.error_message, 'delivered_at', d.delivered_at))
        FILTER(WHERE d.id IS NOT NULL), '[]') as logs
      FROM events e LEFT JOIN delivery_logs d
      ON d.event_id = e.id
      WHERE e.id=$1 AND e.project_id=$2
      GROUP BY e.id;
      `,
      [id, project_id],
    );

    if (event.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Event with id:${id} not found.`,
        code: "NOT_FOUND",
      });
    }

    return res.json({
      success: true,
      data: event.rows[0],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      error: `Failed to fetch event with id:${id}`,
      code: "DB_ERROR",
    });
  }
};
