"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportService = void 0;
const client_1 = require("@prisma/client");
const placement_service_1 = require("./placement.service");
const codingMentor_1 = require("../agents/codingMentor");
const projectMentor_1 = require("../agents/projectMentor");
const fitnessCoach_1 = require("../agents/fitnessCoach");
const lifeStrategist_1 = require("../agents/lifeStrategist");
const logger_1 = require("../utils/logger");
const error_middleware_1 = require("../middlewares/error.middleware");
const prisma = new client_1.PrismaClient();
class ReportService {
    /**
     * Generates a comprehensive report for the user, triggers AI analysis, and saves to database.
     */
    static async generateWeeklyReport(userId) {
        try {
            logger_1.logger.info(`Starting weekly report generation for user: ${userId}`);
            // 1. Fetch user data with profile, metrics, and goals
            const user = await prisma.user.findUnique({
                where: { id: userId },
                include: {
                    profile: true,
                    leetcodeMetrics: true,
                    githubMetrics: true,
                    projectMetrics: true,
                    fitnessMetrics: true,
                    goals: {
                        include: {
                            logs: true
                        }
                    }
                }
            });
            if (!user) {
                throw new error_middleware_1.ApiError(404, "User not found");
            }
            if (!user.profile) {
                throw new error_middleware_1.ApiError(400, "Please configure your career profile first before generating reports");
            }
            // 2. Fetch/update metrics to ensure analysis uses latest telemetry
            let leetcodeMetrics = user.leetcodeMetrics;
            let githubMetrics = user.githubMetrics;
            let fitnessMetrics = user.fitnessMetrics;
            // Ensure dummy values or sync values exist
            if (!leetcodeMetrics) {
                leetcodeMetrics = await prisma.leetcodeMetrics.create({
                    data: {
                        userId,
                        totalSolved: 120,
                        easySolved: 50,
                        mediumSolved: 60,
                        hardSolved: 10,
                        contestRating: 1450,
                        ranking: 210000
                    }
                });
            }
            if (!githubMetrics) {
                githubMetrics = await prisma.githubMetrics.create({
                    data: {
                        userId,
                        totalRepos: 6,
                        activeRepos: 2,
                        commitsLast30Days: 12,
                        pullRequests: 2,
                        contributions: 48
                    }
                });
            }
            if (!fitnessMetrics) {
                fitnessMetrics = await prisma.fitnessMetrics.create({
                    data: {
                        userId,
                        workoutDays: 3,
                        steps: 7500,
                        workoutMinutes: 120
                    }
                });
            }
            // 3. Compute Scores
            const scoringInputs = {
                leetcode: leetcodeMetrics,
                github: githubMetrics,
                fitness: fitnessMetrics,
                goals: user.goals
            };
            const placementScores = placement_service_1.PlacementService.calculatePlacementReadiness(scoringInputs);
            const lifeBalanceResult = placement_service_1.PlacementService.calculateLifeBalance(scoringInputs);
            // 4. Run AI Agent Analyses
            const codingAnalysis = await codingMentor_1.CodingMentor.analyze(leetcodeMetrics, user.goals, user.profile.careerGoal);
            const projectAnalysis = await projectMentor_1.ProjectMentor.analyze(githubMetrics, user.goals, user.profile.careerGoal);
            const fitnessAnalysis = await fitnessCoach_1.FitnessCoach.analyze(fitnessMetrics, user.goals);
            // Extract all goals count
            const allGoalsCount = {
                coding: user.goals.filter(g => g.category === "CODING").length,
                project: user.goals.filter(g => g.category === "PROJECT").length,
                fitness: user.goals.filter(g => g.category === "FITNESS_MIND").length,
                habit: user.goals.filter(g => g.category === "HABIT").length
            };
            const lifeSynthesis = await lifeStrategist_1.LifeStrategist.synthesize(user.profile, codingAnalysis, projectAnalysis, {
                placementScore: placementScores.placementScore,
                lifeBalanceScore: lifeBalanceResult.lifeBalanceScore
            }, allGoalsCount);
            // 5. Save Agent Insights (upsert / recreate for today)
            await prisma.agentInsight.create({
                data: {
                    userId,
                    agentType: "CODING",
                    score: codingAnalysis.score,
                    insight: JSON.stringify(codingAnalysis.strengths),
                    recommendation: codingAnalysis.recommendation
                }
            });
            await prisma.agentInsight.create({
                data: {
                    userId,
                    agentType: "PROJECT",
                    score: projectAnalysis.score,
                    insight: JSON.stringify(projectAnalysis.strengths),
                    recommendation: projectAnalysis.recommendation
                }
            });
            await prisma.agentInsight.create({
                data: {
                    userId,
                    agentType: "FITNESS",
                    score: fitnessAnalysis.score,
                    insight: JSON.stringify(fitnessAnalysis.strengths),
                    recommendation: fitnessAnalysis.recommendation
                }
            });
            // 6. Save Weekly Report
            const now = new Date();
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - 7);
            const report = await prisma.weeklyReport.create({
                data: {
                    userId,
                    weekStart,
                    weekEnd: now,
                    placementReadinessScore: placementScores.placementScore,
                    lifeBalanceScore: lifeBalanceResult.lifeBalanceScore,
                    wins: JSON.stringify(lifeSynthesis.wins),
                    weaknesses: JSON.stringify(lifeSynthesis.weaknesses),
                    recommendations: JSON.stringify(lifeSynthesis.recommendations),
                    nextWeekPlan: JSON.stringify({
                        priorityDistribution: lifeSynthesis.priorityDistribution,
                        reason: lifeSynthesis.reason,
                        tasks: lifeSynthesis.nextWeekPlan
                    })
                }
            });
            // Update project metrics summary in DB
            await prisma.projectMetrics.upsert({
                where: { userId },
                update: {
                    projectScore: projectAnalysis.score,
                    activeProjects: githubMetrics.activeRepos,
                    completedProjects: Math.max(1, githubMetrics.totalRepos - githubMetrics.activeRepos),
                    lastUpdated: now
                },
                create: {
                    userId,
                    projectScore: projectAnalysis.score,
                    activeProjects: githubMetrics.activeRepos,
                    completedProjects: Math.max(1, githubMetrics.totalRepos - githubMetrics.activeRepos),
                    lastUpdated: now
                }
            });
            // Increment User XP and Level
            const xpGain = 150; // default weekly gain
            const newXp = user.xp + xpGain;
            const newLevel = Math.floor(newXp / 1000) + 1;
            await prisma.user.update({
                where: { id: userId },
                data: {
                    xp: newXp,
                    level: newLevel,
                    tokens: user.tokens + 10 // Gain 10 tokens per report
                }
            });
            logger_1.logger.info(`Weekly report generated successfully for: ${userId}. New XP: ${newXp}`);
            return report;
        }
        catch (error) {
            logger_1.logger.error("Failed to generate weekly report", error);
            throw error;
        }
    }
}
exports.ReportService = ReportService;
