import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ApiError } from "./error.middleware";
import { logger } from "../utils/logger";

const JWT_SECRET = process.env.JWT_SECRET || "studentos-ai-super-secret-key";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    let token = "";

    // 1. Check Authorization Header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    // 2. Check Cookie (manual parsing to avoid adding extra dependency)
    if (!token && req.headers.cookie) {
      const parsedCookies = Object.fromEntries(
        req.headers.cookie.split(";").map((c) => {
          const [key, ...val] = c.trim().split("=");
          return [key, val.join("=")];
        })
      );
      token = parsedCookies["accessToken"];
    }

    if (!token) {
      throw new ApiError(401, "Authentication token is missing");
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      email?: string;
    };

    req.user = {
      id: decoded.id,
      email: decoded.email || ""
    };

    next();
  } catch (error) {
    logger.warn("Authentication failed", error);
    next(new ApiError(401, "Unauthorized access"));
  }
};
