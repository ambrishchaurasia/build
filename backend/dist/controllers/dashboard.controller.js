"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
const client_1 = require("@prisma/client");
const leetcode_service_1 = require("../services/leetcode.service");
const github_service_1 = require("../services/github.service");
const googlefit_service_1 = require("../services/googlefit.service");
const placement_service_1 = require("../services/placement.service");
const logger_1 = require("../utils/logger");
const error_middleware_1 = require("../middlewares/error.middleware");
const prisma = new client_1.PrismaClient();
class DashboardController {
    /**
     * Fetch complete dashboard telemetry, scores, and goals
     */
    static async getDashboardData(req, res, next) {
        try {
            const userId = req.user?.id;
            // 1. Fetch user with level, xp, tokens, streaks
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
                            logs: {
                                orderBy: { completedAt: "desc" },
                                take: 15 // Last 15 completions
                            }
                        }
                    }
                }
            });
            if (!user) {
                throw new error_middleware_1.ApiError(404, "User not found");
            }
            // If profile is missing, return empty dashboard payload indicating configuration is needed
            if (!user.profile) {
                return res.status(200).json({
                    success: true,
                    needsProfile: true,
                    user: {
                        name: user.name,
                        email: user.email,
                        xp: user.xp,
                        level: user.level,
                        tokens: user.tokens
                    }
                });
            }
            // 2. Fetch latest agent insights (latest distinct by type)
            const dbInsights = await prisma.agentInsight.findMany({
                where: { userId },
                orderBy: { createdAt: "desc" },
                take: 10
            });
            const latestInsightsMap = {};
            for (const i of dbInsights) {
                if (!latestInsightsMap[i.agentType]) {
                    latestInsightsMap[i.agentType] = i;
                }
            }
            // Generate dynamic recommendations for each category based on current quests
            const agentTypes = ["CODING", "PROJECT", "FITNESS", "HABIT"];
            const dynamicInsights = agentTypes.map(agentType => {
                const existingInsight = latestInsightsMap[agentType];
                const score = existingInsight?.score || 50;
                const originalRec = existingInsight?.recommendation || "";
                const originalInsight = existingInsight?.insight
                    ? (existingInsight.insight.startsWith("[") || existingInsight.insight.startsWith("{") ? JSON.parse(existingInsight.insight) : existingInsight.insight)
                    : [];
                let rec = originalRec;
                const categoryGoals = user.goals.filter(g => {
                    if (agentType === "CODING")
                        return g.category === "CODING";
                    if (agentType === "PROJECT")
                        return g.category === "PROJECT";
                    if (agentType === "FITNESS")
                        return g.category === "FITNESS_MIND";
                    if (agentType === "HABIT")
                        return g.category === "HABIT";
                    return false;
                });
                if (categoryGoals.length > 0) {
                    const uncompleted = categoryGoals.filter(g => {
                        if (!g.lastCompleted)
                            return true;
                        return new Date(g.lastCompleted).toDateString() !== new Date().toDateString();
                    });
                    if (uncompleted.length > 0) {
                        const targetQuest = uncompleted[0];
                        if (agentType === "FITNESS" && targetQuest.title.toLowerCase().includes("ganesh")) {
                            rec = `Tip: You haven't practiced your '${targetQuest.title}' today. Perform it now to reset your focus and calm your mind!`;
                        }
                        else if (agentType === "FITNESS" && targetQuest.title.toLowerCase().includes("pull")) {
                            rec = `Tip: Don't miss your '${targetQuest.title}' today! Rounded posture from coding needs physical decompression.`;
                        }
                        else {
                            rec = `Tip: Don't forget to complete your active quest '${targetQuest.title}' today to keep your streak going!`;
                        }
                    }
                    else {
                        // All completed
                        const targetQuest = categoryGoals[0];
                        rec = `Tip: Excellent! Your active streak for '${targetQuest.title}' is going strong at ${targetQuest.currentStreak} days. Keep this routine up!`;
                    }
                }
                else {
                    // No goals added yet
                    if (agentType === "CODING") {
                        rec = `Tip: You have no active coding quests of the day. Add one (e.g. LeetCode POTD) to build daily problem-solving volume!`;
                    }
                    else if (agentType === "PROJECT") {
                        rec = `Tip: Your routine is missing a projects quest. Add one (e.g. 'Push commit to main') to structure your daily development.`;
                    }
                    else if (agentType === "FITNESS") {
                        rec = `Tip: Balance your coding sprint. Add physical quests like 100 Pullups or Ganesh Ji Meditation to prevent burnout.`;
                    }
                    else if (agentType === "HABIT") {
                        rec = `Tip: Dopamine recovery is key. Add habits like 'Sleep 8 Hours' or 'No Sugar' to improve logic retention capacity.`;
                    }
                }
                return {
                    agentType,
                    score,
                    insight: originalInsight,
                    recommendation: rec
                };
            });
            // 3. Compute current scores
            const scoringInputs = {
                leetcode: user.leetcodeMetrics,
                github: user.githubMetrics,
                fitness: user.fitnessMetrics,
                goals: user.goals
            };
            const placementScores = placement_service_1.PlacementService.calculatePlacementReadiness(scoringInputs);
            const lifeBalanceResult = placement_service_1.PlacementService.calculateLifeBalance(scoringInputs);
            res.status(200).json({
                success: true,
                needsProfile: false,
                telemetry: {
                    xp: user.xp,
                    level: user.level,
                    tokens: user.tokens,
                    streakDays: user.streakDays,
                    scores: {
                        placementScore: placementScores.placementScore,
                        lifeBalanceScore: lifeBalanceResult.lifeBalanceScore,
                        codingScore: placementScores.codingScore,
                        projectScore: placementScores.projectScore,
                        fitnessScore: lifeBalanceResult.scores.fitness,
                        habitsScore: lifeBalanceResult.scores.habits
                    },
                    leetcode: user.leetcodeMetrics || { totalSolved: 0, easySolved: 0, mediumSolved: 0, hardSolved: 0, contestRating: 0, ranking: 0 },
                    github: user.githubMetrics || { totalRepos: 0, activeRepos: 0, commitsLast30Days: 0, pullRequests: 0, contributions: 0 },
                    fitness: user.fitnessMetrics || { workoutDays: 0, steps: 0, workoutMinutes: 0 },
                    projectSummary: user.projectMetrics || { projectScore: 0, activeProjects: 0, completedProjects: 0 }
                },
                goals: user.goals,
                insights: dynamicInsights
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Synchronize Github and LeetCode metrics
     */
    static async syncMetrics(req, res, next) {
        try {
            const userId = req.user?.id;
            const { githubUsername, leetcodeUsername } = req.body;
            const userRec = await prisma.user.findUnique({ where: { id: userId } });
            let targetGithubUsername = githubUsername;
            if (!targetGithubUsername && userRec?.githubToken) {
                targetGithubUsername = "me";
            }
            if (!targetGithubUsername && !leetcodeUsername) {
                throw new error_middleware_1.ApiError(400, "Please provide a GitHub or LeetCode username to sync");
            }
            logger_1.logger.info(`Sync metrics requested for User ${userId}`);
            let lcMetrics = null;
            let ghMetrics = null;
            // 1. Sync LeetCode
            if (leetcodeUsername) {
                const stats = await leetcode_service_1.LeetcodeService.fetchUserStats(leetcodeUsername);
                lcMetrics = await prisma.leetcodeMetrics.upsert({
                    where: { userId },
                    update: {
                        username: leetcodeUsername,
                        totalSolved: stats.totalSolved,
                        easySolved: stats.easySolved,
                        mediumSolved: stats.mediumSolved,
                        hardSolved: stats.hardSolved,
                        contestRating: stats.contestRating,
                        ranking: stats.ranking,
                        lastSync: new Date()
                    },
                    create: {
                        userId,
                        username: leetcodeUsername,
                        totalSolved: stats.totalSolved,
                        easySolved: stats.easySolved,
                        mediumSolved: stats.mediumSolved,
                        hardSolved: stats.hardSolved,
                        contestRating: stats.contestRating,
                        ranking: stats.ranking
                    }
                });
            }
            // 2. Sync GitHub
            if (targetGithubUsername) {
                const stats = await github_service_1.GithubService.fetchUserStats(targetGithubUsername, userRec?.githubToken || undefined);
                ghMetrics = await prisma.githubMetrics.upsert({
                    where: { userId },
                    update: {
                        totalRepos: stats.totalRepos,
                        activeRepos: stats.activeRepos,
                        commitsLast30Days: stats.commitsLast30Days,
                        pullRequests: stats.pullRequests,
                        contributions: stats.contributions,
                        lastSync: new Date()
                    },
                    create: {
                        userId,
                        totalRepos: stats.totalRepos,
                        activeRepos: stats.activeRepos,
                        commitsLast30Days: stats.commitsLast30Days,
                        pullRequests: stats.pullRequests,
                        contributions: stats.contributions
                    }
                });
            }
            // Award XP for sync action
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (user) {
                const syncXp = 50;
                await prisma.user.update({
                    where: { id: userId },
                    data: {
                        xp: user.xp + syncXp,
                        level: Math.floor((user.xp + syncXp) / 1000) + 1
                    }
                });
            }
            res.status(200).json({
                success: true,
                message: "Metrics synchronized successfully",
                leetcode: lcMetrics,
                github: ghMetrics
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Create a custom goal / quest
     */
    static async createGoal(req, res, next) {
        try {
            const userId = req.user?.id;
            const { category, title, description, frequency } = req.body;
            const goal = await prisma.goal.create({
                data: {
                    userId,
                    category,
                    title,
                    description,
                    frequency
                }
            });
            res.status(201).json({
                success: true,
                goal
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Log goal completion and update streaks
     */
    static async toggleGoalCompletion(req, res, next) {
        try {
            const userId = req.user?.id;
            const { goalId } = req.params;
            const goal = await prisma.goal.findFirst({
                where: { id: goalId, userId }
            });
            if (!goal) {
                throw new error_middleware_1.ApiError(404, "Goal not found");
            }
            const now = new Date();
            const todayStr = now.toDateString();
            // Check if already completed today
            let alreadyCompleted = false;
            if (goal.lastCompleted) {
                alreadyCompleted = new Date(goal.lastCompleted).toDateString() === todayStr;
            }
            if (alreadyCompleted) {
                return res.status(200).json({
                    success: true,
                    message: "Goal already completed today",
                    goal
                });
            }
            // Calculate streak update
            let newStreak = 1;
            if (goal.lastCompleted) {
                const lastCompletedDate = new Date(goal.lastCompleted);
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                if (lastCompletedDate.toDateString() === yesterday.toDateString()) {
                    newStreak = goal.currentStreak + 1;
                }
                else if (lastCompletedDate.toDateString() === todayStr) {
                    newStreak = goal.currentStreak;
                }
            }
            const updatedGoal = await prisma.goal.update({
                where: { id: goalId },
                data: {
                    currentStreak: newStreak,
                    maxStreak: Math.max(goal.maxStreak, newStreak),
                    lastCompleted: now
                }
            });
            // Create completion log
            await prisma.goalLog.create({
                data: { goalId }
            });
            // Award XP for completion
            const user = await prisma.user.findUnique({ where: { id: userId } });
            let levelUp = false;
            let level = 1;
            let newXp = 0;
            if (user) {
                const goalXp = 25; // +25 XP per goal
                newXp = user.xp + goalXp;
                level = Math.floor(newXp / 1000) + 1;
                levelUp = level > user.level;
                // Check if we should update global login streak
                let newGlobalStreak = user.streakDays;
                let updateStreak = false;
                if (!user.lastActiveDate) {
                    newGlobalStreak = 1;
                    updateStreak = true;
                }
                else {
                    const lastActiveStr = new Date(user.lastActiveDate).toDateString();
                    const yesterdayStr = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
                    if (lastActiveStr === yesterdayStr) {
                        newGlobalStreak = user.streakDays + 1;
                        updateStreak = true;
                    }
                    else if (lastActiveStr !== todayStr) {
                        newGlobalStreak = 1;
                        updateStreak = true;
                    }
                }
                await prisma.user.update({
                    where: { id: userId },
                    data: {
                        xp: newXp,
                        level,
                        tokens: user.tokens + 1, // Reward 1 Token for each quest
                        streakDays: updateStreak ? newGlobalStreak : undefined,
                        lastActiveDate: now
                    }
                });
            }
            res.status(200).json({
                success: true,
                message: "Goal completed successfully!",
                xpGained: 25,
                levelUp,
                newLevel: level,
                newXp,
                goal: updatedGoal
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Delete a goal
     */
    static async deleteGoal(req, res, next) {
        try {
            const userId = req.user?.id;
            const { goalId } = req.params;
            await prisma.goal.deleteMany({
                where: { id: goalId, userId }
            });
            res.status(200).json({
                success: true,
                message: "Goal deleted successfully"
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Synchronize Google Fit metrics
     */
    static async syncGoogleFit(req, res, next) {
        try {
            const userId = req.user?.id;
            const { accessToken } = req.body;
            if (!accessToken) {
                throw new error_middleware_1.ApiError(400, "Please provide a Google Access Token to sync Fit metrics");
            }
            logger_1.logger.info(`Google Fit sync requested for User ${userId}`);
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user) {
                throw new error_middleware_1.ApiError(404, "User not found");
            }
            const stats = await googlefit_service_1.GooglefitService.fetchFitnessMetrics(accessToken, user.email || "");
            await prisma.user.update({
                where: { id: userId },
                data: { googleFitToken: accessToken }
            });
            const fitnessMetrics = await prisma.fitnessMetrics.upsert({
                where: { userId },
                update: {
                    workoutDays: stats.workoutDays,
                    steps: stats.steps,
                    workoutMinutes: stats.workoutMinutes,
                    lastUpdated: new Date()
                },
                create: {
                    userId,
                    workoutDays: stats.workoutDays,
                    steps: stats.steps,
                    workoutMinutes: stats.workoutMinutes
                }
            });
            // Award XP for sync action
            const syncXp = 50;
            await prisma.user.update({
                where: { id: userId },
                data: {
                    xp: user.xp + syncXp,
                    level: Math.floor((user.xp + syncXp) / 1000) + 1
                }
            });
            res.status(200).json({
                success: true,
                message: "Google Fit metrics synchronized successfully",
                fitness: fitnessMetrics
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.DashboardController = DashboardController;
