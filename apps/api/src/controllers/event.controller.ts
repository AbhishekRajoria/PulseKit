import type { Request, Response } from "express";
import { pool } from "../db.ts";
import type { ApiResponse, Event } from "../types/index.ts";

export const getAllEvents = async (
  req: Request,
  res: Response<ApiResponse<Event[]>>,
) => {
  try {
    const project_id = req.project_id;

    const result = await pool.query(
      `SELECT e.*, d.status, d.channel
      from events e LEFT JOIN delivery_logs d
      ON e.id = d.event_id
      where e.project_id = $1`,
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

export const createEvent = async (
  req: Request,
  res: Response<ApiResponse<Event>>,
) => {
  const { event_name, user_id, payload } = req.body;
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

    return res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      error: `Failed to create event: ${(error as Error).message}`,
      code: "DB_ERROR",
    });
  }
};

export const getEventbyId = async (
  req: Request,
  res: Response<ApiResponse<Event[]>>,
) => {
  const { id } = req.params;
  const project_id = req.project_id;

  try {
    const event = await pool.query(
      `
      SELECT *
      FROM events
      where id=$1 AND project_id=$2`,
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
