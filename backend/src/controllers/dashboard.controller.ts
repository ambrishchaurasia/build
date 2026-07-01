import { Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { LeetcodeService } from "../services/leetcode.service";
import { GithubService } from "../services/github.service";
import { GooglefitService } from "../services/googlefit.service";
import { PlacementService } from "../services/placement.service";
import { logger } from "../utils/logger";
import { ApiError } from "../middlewares/error.middleware";

const prisma = new PrismaClient();

function isGoalActiveToday(goal: any): boolean {
  const createdDate = new Date(goal.createdAt);
  const today = new Date();
  
  const createdString = `${createdDate.getFullYear()}-${createdDate.getMonth()}-${createdDate.getDate()}`;
  const targetString = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

  return targetString === createdString;
}

export class DashboardController {
  /**
   * Fetch complete dashboard telemetry, scores, and goals
   */
  static async getDashboardData(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id!;

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
        throw new ApiError(404, "User not found");
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

      const latestInsightsMap: Record<string, any> = {};
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
          let matches = false;
          if (agentType === "CODING") matches = g.category === "CODING";
          else if (agentType === "PROJECT") matches = g.category === "PROJECT";
          else if (agentType === "FITNESS") matches = g.category === "FITNESS_MIND";
          else if (agentType === "HABIT") matches = g.category === "HABIT";
          
          return matches && isGoalActiveToday(g);
        });

        if (categoryGoals.length > 0) {
          const uncompleted = categoryGoals.filter(g => {
            if (!g.lastCompleted) return true;
            return new Date(g.lastCompleted).toDateString() !== new Date().toDateString();
          });
          
          if (uncompleted.length > 0) {
            const targetQuest = uncompleted[0];
            if (agentType === "FITNESS" && targetQuest.title.toLowerCase().includes("ganesh")) {
              rec = `Tip: You haven't practiced your '${targetQuest.title}' today. Perform it now to reset your focus and calm your mind!`;
            } else if (agentType === "FITNESS" && targetQuest.title.toLowerCase().includes("pull")) {
              rec = `Tip: Don't miss your '${targetQuest.title}' today! Rounded posture from coding needs physical decompression.`;
            } else {
              rec = `Tip: Don't forget to complete your active quest '${targetQuest.title}' today to keep your streak going!`;
            }
          } else {
            // All completed
            const targetQuest = categoryGoals[0];
            rec = `Tip: Excellent! Your active streak for '${targetQuest.title}' is going strong at ${targetQuest.currentStreak} days. Keep this routine up!`;
          }
        } else {
          // No goals added yet
          if (agentType === "CODING") {
            rec = `Tip: You have no active coding quests of the day. Add one (e.g. LeetCode POTD) to build daily problem-solving volume!`;
          } else if (agentType === "PROJECT") {
            rec = `Tip: Your routine is missing a projects quest. Add one (e.g. 'Push commit to main') to structure your daily development.`;
          } else if (agentType === "FITNESS") {
            rec = `Tip: Balance your coding sprint. Add physical quests like 100 Pullups or Ganesh Ji Meditation to prevent burnout.`;
          } else if (agentType === "HABIT") {
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

      const placementScores = PlacementService.calculatePlacementReadiness(scoringInputs);
      const lifeBalanceResult = PlacementService.calculateLifeBalance(scoringInputs);

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
    } catch (error) {
      next(error);
    }
  }

  /**
   * Synchronize Github and LeetCode metrics
   */
  static async syncMetrics(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id!;
      const { githubUsername, leetcodeUsername } = req.body;

      const userRec = await prisma.user.findUnique({ 
        where: { id: userId },
        include: { leetcodeMetrics: true, githubMetrics: true }
      });
      let targetGithubUsername = githubUsername;
      if (!targetGithubUsername && userRec?.githubToken) {
        targetGithubUsername = "me";
      }

      if (!targetGithubUsername && !leetcodeUsername) {
        throw new ApiError(400, "Please provide a GitHub or LeetCode username to sync");
      }

      logger.info(`Sync metrics requested for User ${userId}`);

      let lcMetrics = null;
      let ghMetrics = null;

      // 1. Sync LeetCode
      if (leetcodeUsername) {
        const stats = await LeetcodeService.fetchUserStats(leetcodeUsername);
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
        const stats = await GithubService.fetchUserStats(targetGithubUsername, userRec?.githubToken || undefined);
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

      // Award XP ONLY for the first-time sync
      const isFirstLcSync = leetcodeUsername && (!userRec || !userRec.leetcodeMetrics);
      const isFirstGhSync = targetGithubUsername && (!userRec || !userRec.githubMetrics);
      
      if (isFirstLcSync || isFirstGhSync) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (user) {
          const syncXp = (isFirstLcSync && isFirstGhSync) ? 100 : 50;
          await prisma.user.update({
            where: { id: userId },
            data: {
              xp: user.xp + syncXp,
              level: Math.floor((user.xp + syncXp) / 1000) + 1
            }
          });
        }
      }

      res.status(200).json({
        success: true,
        message: "Metrics synchronized successfully",
        leetcode: lcMetrics,
        github: ghMetrics
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a custom goal / quest
   */
  static async createGoal(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id!;
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
    } catch (error) {
      next(error);
    }
  }

  /**
   * Log goal completion and update streaks
   */
  static async toggleGoalCompletion(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id!;
      const { goalId } = req.params;
      const { date } = req.body;

      const goal = await prisma.goal.findFirst({
        where: { id: goalId, userId }
      });

      if (!goal) {
        throw new ApiError(404, "Goal not found");
      }

      const targetDate = date ? new Date(date) : new Date();
      const targetDateStr = targetDate.toDateString();

      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      const existingLog = await prisma.goalLog.findFirst({
        where: {
          goalId,
          completedAt: { gte: startOfDay, lte: endOfDay }
        }
      });

      let wasCompleted = false;

      if (existingLog) {
        // Uncomplete
        await prisma.goalLog.delete({ where: { id: existingLog.id } });
        wasCompleted = false;
      } else {
        // Complete
        await prisma.goalLog.create({
          data: { goalId, completedAt: targetDate }
        });
        wasCompleted = true;
      }

      // Recalculate streaks from all logs
      const allLogs = await prisma.goalLog.findMany({
        where: { goalId },
        orderBy: { completedAt: "desc" }
      });

      let currentStreak = 0;
      let maxStreak = goal.maxStreak;
      const today = new Date();
      today.setHours(0,0,0,0);
      
      if (allLogs.length > 0) {
        // Build unique sorted dates array (descending)
        const uniqueDates = Array.from(new Set(allLogs.map(l => {
          const d = new Date(l.completedAt);
          d.setHours(0,0,0,0);
          return d.getTime();
        })));
        
        let streak = 0;
        let expectedTime = uniqueDates[0];
        
        // If the most recent log is not today or yesterday, streak is 0
        const diffDays = Math.floor((today.getTime() - expectedTime) / (1000 * 60 * 60 * 24));
        if (diffDays > 1) {
          currentStreak = 0;
        } else {
          for (let i = 0; i < uniqueDates.length; i++) {
            if (uniqueDates[i] === expectedTime) {
              streak++;
              expectedTime -= (1000 * 60 * 60 * 24); // subtract 1 day
            } else {
              break;
            }
          }
          currentStreak = streak;
        }
        maxStreak = Math.max(maxStreak, currentStreak);
      }

      const updatedGoal = await prisma.goal.update({
        where: { id: goalId },
        data: {
          currentStreak,
          maxStreak,
          lastCompleted: allLogs.length > 0 ? allLogs[0].completedAt : null
        }
      });

      // Award or Deduct XP ONLY if they are toggling TODAY'S task
      const now = new Date();
      const todayStr = now.toDateString();
      
      const user = await prisma.user.findUnique({ where: { id: userId } });
      let levelUp = false;
      let level = user?.level || 1;
      let newXp = user?.xp || 0;
      let pointsDeducted = 0;
      let pointsGained = 0;
      let allTasksCompleted = false;

      if (user && targetDateStr === todayStr) {
        const allGoals = await prisma.goal.findMany({ where: { userId } });
        const activeGoals = allGoals.filter(g => g.isActive && isGoalActiveToday(g));

        if (!wasCompleted) {
          // Uncompleted today's task. Deduct XP if they previously had all tasks completed.
          // Before this uncompletion, count how many were completed.
          const completedCount = activeGoals.filter(g => {
            if (g.id === goalId) return true; // We assume it was true before uncompleting
            if (!g.lastCompleted) return false;
            return new Date(g.lastCompleted).toDateString() === todayStr;
          }).length;

          if (activeGoals.length > 0 && completedCount === activeGoals.length) {
            pointsDeducted = 5;
          }

          newXp = Math.max(0, user.xp - pointsDeducted);
          level = Math.floor(newXp / 1000) + 1;
          await prisma.user.update({
            where: { id: userId },
            data: {
              xp: newXp,
              level,
              tokens: Math.max(0, user.tokens - pointsDeducted)
            }
          });
        } else {
          // Completed today's task. Award XP if all tasks are now completed.
          const completedOtherCount = activeGoals.filter(g => {
            if (g.id === goalId) return false;
            if (!g.lastCompleted) return false;
            return new Date(g.lastCompleted).toDateString() === todayStr;
          }).length;

          if (activeGoals.length > 0 && completedOtherCount === activeGoals.length - 1) {
            pointsGained = 5;
            allTasksCompleted = true;
          }

          newXp = user.xp + pointsGained;
          level = Math.floor(newXp / 1000) + 1;
          levelUp = level > user.level;

          let newGlobalStreak = user.streakDays;
          let updateStreak = false;

          if (!user.lastActiveDate) {
            newGlobalStreak = 1;
            updateStreak = true;
          } else {
            const lastActiveStr = new Date(user.lastActiveDate).toDateString();
            const yesterdayStr = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
            if (lastActiveStr === yesterdayStr) {
              newGlobalStreak = user.streakDays + 1;
              updateStreak = true;
            } else if (lastActiveStr !== todayStr) {
              newGlobalStreak = 1;
              updateStreak = true;
            }
          }

          await prisma.user.update({
            where: { id: userId },
            data: {
              xp: newXp,
              level,
              tokens: user.tokens + pointsGained,
              streakDays: updateStreak ? newGlobalStreak : undefined,
              lastActiveDate: now
            }
          });
        }
      }

      res.status(200).json({
        success: true,
        message: wasCompleted ? "Goal completed successfully!" : "Goal uncompleted successfully",
        xpGained: pointsGained,
        pointsDeducted,
        tokensGained: pointsGained,
        allTasksCompleted,
        levelUp,
        newLevel: level,
        newXp,
        goal: updatedGoal
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a goal
   */
  static async deleteGoal(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id!;
      const { goalId } = req.params;

      await prisma.goal.deleteMany({
        where: { id: goalId, userId }
      });

      res.status(200).json({
        success: true,
        message: "Goal deleted successfully"
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Synchronize Google Fit metrics or manual fitness logs
   */
  static async syncGoogleFit(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id!;
      const { accessToken, steps, workoutMinutes } = req.body;

      logger.info(`Fitness sync requested for User ${userId}`);

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new ApiError(404, "User not found");
      }

      let finalSteps = 0;
      let finalMinutes = 0;
      let finalDays = 0;

      if (steps !== undefined || workoutMinutes !== undefined) {
        finalSteps = steps !== undefined ? Number(steps) : 0;
        finalMinutes = workoutMinutes !== undefined ? Number(workoutMinutes) : 0;
        finalDays = finalMinutes > 0 ? 1 : 0;
      } else {
        if (!accessToken) {
          throw new ApiError(400, "Please provide metrics (steps, workoutMinutes) or a Google Access Token to sync");
        }

        const stats = await GooglefitService.fetchFitnessMetrics(accessToken, user.email || "");
        finalSteps = stats.steps;
        finalMinutes = stats.workoutMinutes;
        finalDays = stats.workoutDays;

        await prisma.user.update({
          where: { id: userId },
          data: { googleFitToken: accessToken }
        });
      }

      const fitnessMetrics = await prisma.fitnessMetrics.upsert({
        where: { userId },
        update: {
          workoutDays: finalDays,
          steps: finalSteps,
          workoutMinutes: finalMinutes,
          lastUpdated: new Date()
        },
        create: {
          userId,
          workoutDays: finalDays,
          steps: finalSteps,
          workoutMinutes: finalMinutes
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
        message: "Fitness metrics synchronized successfully",
        fitness: fitnessMetrics
      });
    } catch (error) {
      next(error);
    }
  }
}
