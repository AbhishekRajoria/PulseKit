import type { NextFunction, Request, Response } from "express";

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const userId = req.signedCookies.userId;

  if (!userId) {
    return res.status(401).json({
      success: false,
      error: "Unauthenticated",
      code: "UNAUTHENTICATED",
    });
  }

  req.userId = userId;
  next();
};
