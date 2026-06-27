import { Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { ApiError } from "../middlewares/error.middleware";
import { logger } from "../utils/logger";

const prisma = new PrismaClient();

export class UserController {
  /**
   * Get student profile
   */
  static async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const profile = await prisma.studentProfile.findUnique({
        where: { userId }
      });

      res.status(200).json({
        success: true,
        profile
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create or update student profile
   */
  static async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id!;
      const { careerGoal, semester, cgpa, targetPlacementYear, targetCompanyType } = req.body;

      const profile = await prisma.studentProfile.upsert({
        where: { userId },
        update: {
          careerGoal,
          semester,
          cgpa,
          targetPlacementYear,
          targetCompanyType
        },
        create: {
          userId,
          careerGoal,
          semester,
          cgpa,
          targetPlacementYear,
          targetCompanyType
        }
      });

      // Reward XP for completing profile onboarding
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user && user.xp <= 100) {
        await prisma.user.update({
          where: { id: userId },
          data: { xp: user.xp + 150 } // Give 150 XP
        });
      }

      logger.info(`Profile updated for user: ${userId}`);

      res.status(200).json({
        success: true,
        message: "Profile configured successfully",
        profile
      });
    } catch (error) {
      next(error);
    }
  }
}
