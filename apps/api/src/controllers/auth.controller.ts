import type { Request, Response } from "express";
import { pool } from "../db.ts";
import bcrypt from "bcryptjs";
import type { PgError, User, ApiResponse } from "../types/index.ts";

export const register = async (
  req: Request,
  res: Response<ApiResponse<Omit<User, "password_hash">>>,
) => {
  try {
    const { email, password, name } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Missing required field: email",
        code: "MISSING_FIELD",
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        error: "Missing required field: password",
        code: "MISSING_FIELD",
      });
    }

    const hashed = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (email, password_hash, name)
    VALUES( $1, $2, $3) RETURNING id, email, name, created_at`,
      [email, hashed, name],
    );

    return res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    if (error instanceof Error && "code" in error) {
      const pgErr = error as PgError;
      if (pgErr.code === "23505") {
        return res
          .status(409)
          .json({ success: false, error: "Email already registered" });
      }
    }
    console.error("Registration failed:", error);
    return res
      .status(500)
      .json({ success: false, error: "Registration failed" });
  }
};

export const login = async (
  req: Request,
  res: Response<ApiResponse<Pick<User, "id" | "email">>>,
) => {
  try {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Missing required field: email ",
        code: "MISSING_FIELD",
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        error: "Missing required field: password",
        code: "MISSING_FIELD",
      });
    }

    const result = await pool.query(
      `SELECT * from users
    WHERE email=$1`,
      [email],
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
    }

    const user = result.rows[0];

    const compare = await bcrypt.compare(password, user.password_hash);

    if (!compare) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
    }

    res.cookie("userId", user.id, {
      signed: true,
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      error: "Login failed",
    });
  }
};

export const getMe = async (
  req: Request,
  res: Response<ApiResponse<Omit<User, "password_hash">>>,
) => {
  try {
    const userId = req.userId;

    const result = await pool.query(
      `SELECT id, name, email, created_at from users
    WHERE id=$1`,
      [userId],
    );

    if (result.rows.length === 0) {
      res.clearCookie("userId");
      return res.status(401).json({
        success: false,
        error: "Session expired",
      });
    }

    return res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("getMe failed:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch user",
    });
  }
};
