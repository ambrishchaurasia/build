"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlacementService = void 0;
const logger_1 = require("../utils/logger");
class PlacementService {
    /**
     * Calculates the overall Placement Readiness Score (0 - 100)
     */
    static calculatePlacementReadiness(inputs) {
        const { leetcode, github, fitness, goals } = inputs;
        // 1. Calculate Coding Score (0 - 100)
        let leetcodeBase = 0;
        if (leetcode) {
            // 300 solved count is considered target (0-100 scaled)
            const solvedFactor = Math.min(100, (leetcode.totalSolved / 300) * 100);
            // 1800 rating is considered target (rating starting from 1200)
            const ratingFactor = Math.min(100, Math.max(0, ((leetcode.contestRating - 1200) / 600) * 100));
            leetcodeBase = (solvedFactor * 0.7) + (ratingFactor * 0.3);
        }
        else {
            leetcodeBase = 30; // default baseline
        }
        // Factor in Coding Goal Completions (20% weight on habits)
        const codingGoals = goals.filter((g) => g.category === "CODING");
        const codingGoalCompletion = this.calculateGoalCompletionRate(codingGoals);
        const codingScore = Math.round((leetcodeBase * 0.8) + (codingGoalCompletion * 0.2));
        // 2. Calculate Project Score (0 - 100)
        let githubBase = 0;
        if (github) {
            // 40 commits in 30 days is target
            const commitsFactor = Math.min(100, (github.commitsLast30Days / 40) * 100);
            // 150 contributions is target
            const contribFactor = Math.min(100, (github.contributions / 150) * 100);
            githubBase = (commitsFactor * 0.6) + (contribFactor * 0.4);
        }
        else {
            githubBase = 25; // default baseline
        }
        // Factor in Project Goal Completions (20% weight on habits)
        const projectGoals = goals.filter((g) => g.category === "PROJECT");
        const projectGoalCompletion = this.calculateGoalCompletionRate(projectGoals);
        const projectScore = Math.round((githubBase * 0.8) + (projectGoalCompletion * 0.2));
        // 3. Calculate Fitness Score (0 - 100)
        let fitnessBase = 0;
        if (fitness) {
            // 10000 steps daily is target
            const stepsFactor = Math.min(100, (fitness.steps / 10000) * 100);
            // 180 workout minutes weekly is target
            const workoutFactor = Math.min(100, (fitness.workoutMinutes / 180) * 100);
            fitnessBase = (stepsFactor * 0.5) + (workoutFactor * 0.5);
        }
        else {
            fitnessBase = 50; // default baseline
        }
        // Factor in Fitness Goal Completions (30% weight)
        const fitnessGoals = goals.filter((g) => g.category === "FITNESS_MIND");
        const fitnessGoalCompletion = this.calculateGoalCompletionRate(fitnessGoals);
        const fitnessScore = Math.round((fitnessBase * 0.7) + (fitnessGoalCompletion * 0.3));
        // 4. Final Placement Readiness (50% Coding, 40% Projects, 10% Fitness)
        const placementScore = Math.round((codingScore * 0.50) + (projectScore * 0.40) + (fitnessScore * 0.10));
        logger_1.logger.debug(`Scoring placement: Coding=${codingScore}, Project=${projectScore}, Fitness=${fitnessScore}, Final=${placementScore}`);
        return {
            placementScore,
            codingScore,
            projectScore,
            fitnessScore
        };
    }
    /**
     * Calculates the Life Balance Score (0 - 100), penalizing severe over-specialization.
     */
    static calculateLifeBalance(inputs) {
        const { fitness, goals } = inputs;
        // Calculate completion rates for the 4 categories
        const codingGoals = goals.filter((g) => g.category === "CODING");
        const codingScore = Math.round(this.calculateGoalCompletionRate(codingGoals));
        const projectGoals = goals.filter((g) => g.category === "PROJECT");
        const projectScore = Math.round(this.calculateGoalCompletionRate(projectGoals));
        // Calculate Fitness score reflecting both Google Fit aggregate activity and daily fitness quests
        let fitnessBase = 0;
        if (fitness) {
            const stepsFactor = Math.min(100, (fitness.steps / 10000) * 100);
            const workoutFactor = Math.min(100, (fitness.workoutMinutes / 180) * 100);
            fitnessBase = (stepsFactor * 0.5) + (workoutFactor * 0.5);
        }
        else {
            fitnessBase = 50;
        }
        const fitnessGoals = goals.filter((g) => g.category === "FITNESS_MIND");
        const fitnessGoalCompletion = this.calculateGoalCompletionRate(fitnessGoals);
        const fitnessScore = Math.round((fitnessBase * 0.7) + (fitnessGoalCompletion * 0.3));
        const habitGoals = goals.filter((g) => g.category === "HABIT");
        const habitsScore = Math.round(this.calculateGoalCompletionRate(habitGoals));
        const scoresList = [codingScore, projectScore, fitnessScore, habitsScore];
        const avgScore = scoresList.reduce((a, b) => a + b, 0) / scoresList.length;
        // Detect imbalance (Max difference penalty)
        const maxScore = Math.max(...scoresList);
        const minScore = Math.min(...scoresList);
        const difference = maxScore - minScore;
        // Deduct points based on the size of the gap (severe imbalance)
        const penalty = difference * 0.3;
        let lifeBalanceScore = Math.round(avgScore - penalty);
        // Bounded between 10 and 100
        lifeBalanceScore = Math.max(10, Math.min(100, lifeBalanceScore));
        logger_1.logger.debug(`Scoring life balance: Avg=${avgScore}, Diff=${difference}, Penalty=${penalty}, Final=${lifeBalanceScore}`);
        return {
            lifeBalanceScore,
            scores: {
                coding: codingScore,
                projects: projectScore,
                fitness: fitnessScore,
                habits: habitsScore
            }
        };
    }
    /**
     * Helper to compute completion rate of goals in the past 7 days
     */
    static calculateGoalCompletionRate(categoryGoals) {
        if (categoryGoals.length === 0)
            return 70; // baseline completion rate for unconfigured categories to avoid 0 score
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        let totalPossibleCompletions = 0;
        let totalActualCompletions = 0;
        for (const goal of categoryGoals) {
            if (!goal.isActive)
                continue;
            // Daily goals can be completed 7 times a week
            if (goal.frequency === "DAILY") {
                totalPossibleCompletions += 7;
            }
            else {
                totalPossibleCompletions += 1;
            }
            // Count completions in the last 7 days
            const recentLogs = goal.logs.filter((log) => new Date(log.completedAt) >= oneWeekAgo);
            totalActualCompletions += recentLogs.length;
        }
        if (totalPossibleCompletions === 0)
            return 100;
        // Scale rate out of 100
        const rate = (totalActualCompletions / totalPossibleCompletions) * 100;
        return Math.min(100, rate);
    }
}
exports.PlacementService = PlacementService;
