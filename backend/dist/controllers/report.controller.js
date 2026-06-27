"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportController = void 0;
const client_1 = require("@prisma/client");
const report_service_1 = require("../services/report.service");
const prisma = new client_1.PrismaClient();
class ReportController {
    /**
     * Get all weekly reports for the logged-in user
     */
    static async getWeeklyReports(req, res, next) {
        try {
            const userId = req.user?.id;
            const reports = await prisma.weeklyReport.findMany({
                where: { userId },
                orderBy: { generatedAt: "desc" }
            });
            res.status(200).json({
                success: true,
                reports: reports.map((r) => ({
                    id: r.id,
                    weekStart: r.weekStart,
                    weekEnd: r.weekEnd,
                    placementReadinessScore: r.placementReadinessScore,
                    lifeBalanceScore: r.lifeBalanceScore,
                    wins: JSON.parse(r.wins),
                    weaknesses: JSON.parse(r.weaknesses),
                    recommendations: JSON.parse(r.recommendations),
                    nextWeekPlan: JSON.parse(r.nextWeekPlan),
                    generatedAt: r.generatedAt
                }))
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Manually trigger weekly report generation
     */
    static async generateReport(req, res, next) {
        try {
            const userId = req.user?.id;
            const report = await report_service_1.ReportService.generateWeeklyReport(userId);
            res.status(201).json({
                success: true,
                message: "Weekly advisor sync report generated successfully!",
                report: {
                    id: report.id,
                    weekStart: report.weekStart,
                    weekEnd: report.weekEnd,
                    placementReadinessScore: report.placementReadinessScore,
                    lifeBalanceScore: report.lifeBalanceScore,
                    wins: JSON.parse(report.wins),
                    weaknesses: JSON.parse(report.weaknesses),
                    recommendations: JSON.parse(report.recommendations),
                    nextWeekPlan: JSON.parse(report.nextWeekPlan),
                    generatedAt: report.generatedAt
                }
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ReportController = ReportController;
