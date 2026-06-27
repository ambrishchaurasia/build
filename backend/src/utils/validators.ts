import { z } from "zod";
import { Request, Response, NextFunction } from "express";
import { ApiError } from "../middlewares/error.middleware";

export const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

export const loginSchema = z.object({
  email: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(1, "Password is required")
});

export const profileSchema = z.object({
  careerGoal: z.enum([
    "Software Engineer",
    "Data Scientist",
    "AI Engineer",
    "ML Engineer",
    "Product Manager",
    "Research Engineer"
  ]),
  semester: z.number().int().min(1).max(10),
  cgpa: z.number().min(0).max(10),
  targetPlacementYear: z.number().int().min(2024).max(2035),
  targetCompanyType: z.string().min(1, "Target company type is required")
});

export const goalSchema = z.object({
  category: z.enum(["CODING", "PROJECT", "FITNESS_MIND", "HABIT"]),
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().optional(),
  frequency: z.enum(["DAILY", "WEEKLY"])
});

export const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message
        }));
        next(new ApiError(400, "Validation failed", errorMessages));
      } else {
        next(error);
      }
    }
  };
};
