"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const prisma = new client_1.PrismaClient();
class UserController {
    /**
     * Get student profile
     */
    static async getProfile(req, res, next) {
        try {
            const userId = req.user?.id;
            const profile = await prisma.studentProfile.findUnique({
                where: { userId }
            });
            res.status(200).json({
                success: true,
                profile
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Create or update student profile
     */
    static async updateProfile(req, res, next) {
        try {
            const userId = req.user?.id;
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
            logger_1.logger.info(`Profile updated for user: ${userId}`);
            res.status(200).json({
                success: true,
                message: "Profile configured successfully",
                profile
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.UserController = UserController;
