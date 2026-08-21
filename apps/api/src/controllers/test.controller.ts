import { type Request, type Response } from "express";

export const test = (req: Request, res: Response) => {
  console.log("reached");
  return res.json("Hello");
};

