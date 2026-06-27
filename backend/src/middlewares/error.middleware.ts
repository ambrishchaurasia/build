import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

export class ApiError extends Error {
  statusCode: number;
  errors: any[];

  constructor(statusCode: number, message: string, errors: any[] = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export const errorMiddleware = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err instanceof ApiError ? err.statusCode : 500;
  const message = err.message || "Internal Server Error";
  const errors = err instanceof ApiError ? err.errors : [];

  logger.error(`API Error: ${statusCode} - ${message}`, err);
  try {
    require("fs").appendFileSync("error.log", `\n[${new Date().toISOString()}] ${statusCode} - ${message}\n`);
  } catch (e) {}

  res.status(statusCode).json({
    success: false,
    message,
    errors,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined
  });
};
