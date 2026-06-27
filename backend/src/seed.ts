import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { logger } from "./utils/logger";

const prisma = new PrismaClient();

async function main() {
  logger.info("Initializing database seeding...");

  // Clean old records
  await prisma.goalLog.deleteMany({});
  await prisma.goal.deleteMany({});
  await prisma.leetcodeMetrics.deleteMany({});
  await prisma.githubMetrics.deleteMany({});
  await prisma.projectMetrics.deleteMany({});
  await prisma.weeklyReport.deleteMany({});
  await prisma.agentInsight.deleteMany({});
  await prisma.studentProfile.deleteMany({});
  await prisma.user.deleteMany({});

  const passwordHash = await bcrypt.hash("password123", 10);

  // Define 10 Demo Users
  const userTemplates = [
    {
      name: "Aditya Sharma",
      email: "aditya@studentos.ai",
      careerGoal: "Software Engineer",
      cgpa: 9.1,
      semester: 6,
      targetCompanyType: "FAANG",
      leetcode: { solved: 340, easy: 110, medium: 180, hard: 50, rating: 1850, ranking: 45000 },
      github: { repos: 14, active: 5, commits: 55, prs: 9, contributions: 180 }
    },
    {
      name: "Sneha Patel",
      email: "sneha@studentos.ai",
      careerGoal: "AI Engineer",
      cgpa: 8.8,
      semester: 6,
      targetCompanyType: "FinTech",
      leetcode: { solved: 210, easy: 80, medium: 110, hard: 20, rating: 1620, ranking: 110000 },
      github: { repos: 12, active: 4, commits: 48, prs: 6, contributions: 128 }
    },
    {
      name: "Rohan Das",
      email: "rohan@studentos.ai",
      careerGoal: "ML Engineer",
      cgpa: 9.3,
      semester: 8,
      targetCompanyType: "Research Lab",
      leetcode: { solved: 410, easy: 120, medium: 220, hard: 70, rating: 2050, ranking: 12000 },
      github: { repos: 18, active: 8, commits: 95, prs: 15, contributions: 310 }
    },
    {
      name: "Tanya Iyer",
      email: "tanya@studentos.ai",
      careerGoal: "Product Manager",
      cgpa: 8.2,
      semester: 4,
      targetCompanyType: "Startup",
      leetcode: { solved: 75, easy: 45, medium: 25, hard: 5, rating: 1350, ranking: 480000 },
      github: { repos: 5, active: 1, commits: 10, prs: 1, contributions: 25 }
    },
    {
      name: "Vikram Malhotra",
      email: "vikram@studentos.ai",
      careerGoal: "Software Engineer",
      cgpa: 7.9,
      semester: 6,
      targetCompanyType: "MNC",
      leetcode: { solved: 140, easy: 60, medium: 70, hard: 10, rating: 1480, ranking: 240000 },
      github: { repos: 8, active: 3, commits: 20, prs: 2, contributions: 56 }
    },
    {
      name: "Karan Johar", // Heavily Imbalanced: 450 solved but 0 commits to trigger penalty
      email: "karan@studentos.ai",
      careerGoal: "Software Engineer",
      cgpa: 8.5,
      semester: 6,
      targetCompanyType: "FAANG",
      leetcode: { solved: 450, easy: 150, medium: 250, hard: 50, rating: 1980, ranking: 28000 },
      github: { repos: 2, active: 0, commits: 1, prs: 0, contributions: 5 }
    },
    {
      name: "Ananya Panday",
      email: "ananya@studentos.ai",
      careerGoal: "Data Scientist",
      cgpa: 9.0,
      semester: 6,
      targetCompanyType: "Startup",
      leetcode: { solved: 120, easy: 50, medium: 60, hard: 10, rating: 1410, ranking: 320000 },
      github: { repos: 9, active: 4, commits: 32, prs: 4, contributions: 98 }
    },
    {
      name: "Kabir Singh", // Slacker profile to show lower range
      email: "kabir@studentos.ai",
      careerGoal: "Software Engineer",
      cgpa: 6.8,
      semester: 6,
      targetCompanyType: "MNC",
      leetcode: { solved: 45, easy: 30, medium: 15, hard: 0, rating: 1220, ranking: 850000 },
      github: { repos: 4, active: 1, commits: 4, prs: 0, contributions: 12 }
    },
    {
      name: "Pooja Hegde",
      email: "pooja@studentos.ai",
      careerGoal: "Research Engineer",
      cgpa: 9.5,
      semester: 8,
      targetCompanyType: "FAANG",
      leetcode: { solved: 290, easy: 100, medium: 150, hard: 40, rating: 1780, ranking: 62000 },
      github: { repos: 15, active: 6, commits: 60, prs: 8, contributions: 185 }
    },
    {
      name: "Sid Malhotra",
      email: "sid@studentos.ai",
      careerGoal: "Software Engineer",
      cgpa: 8.1,
      semester: 6,
      targetCompanyType: "Startup",
      leetcode: { solved: 180, easy: 70, medium: 95, hard: 15, rating: 1550, ranking: 165000 },
      github: { repos: 11, active: 3, commits: 25, prs: 3, contributions: 78 }
    }
  ];

  for (const t of userTemplates) {
    // 1. Create User
    const user = await prisma.user.create({
      data: {
        name: t.name,
        email: t.email,
        password: passwordHash,
        xp: Math.round(t.leetcode.solved * 3 + t.github.commits * 5),
        level: Math.floor((t.leetcode.solved * 3 + t.github.commits * 5) / 1000) + 1,
        tokens: 25,
        streakDays: 8,
        lastActiveDate: new Date()
      }
    });

    // 2. Create StudentProfile
    await prisma.studentProfile.create({
      data: {
        userId: user.id,
        careerGoal: t.careerGoal,
        semester: t.semester,
        cgpa: t.cgpa,
        targetPlacementYear: 2027,
        targetCompanyType: t.targetCompanyType
      }
    });

    // 3. Create LeetcodeMetrics
    await prisma.leetcodeMetrics.create({
      data: {
        userId: user.id,
        totalSolved: t.leetcode.solved,
        easySolved: t.leetcode.easy,
        mediumSolved: t.leetcode.medium,
        hardSolved: t.leetcode.hard,
        contestRating: t.leetcode.rating,
        ranking: t.leetcode.ranking
      }
    });

    // 4. Create GithubMetrics
    await prisma.githubMetrics.create({
      data: {
        userId: user.id,
        totalRepos: t.github.repos,
        activeRepos: t.github.active,
        commitsLast30Days: t.github.commits,
        pullRequests: t.github.prs,
        contributions: t.github.contributions
      }
    });

    // 5. Create Goals across Categories
    const goalsData = [
      { category: "CODING", title: "POTD", frequency: "DAILY" },
      { category: "CODING", title: "Revise yesterdays", frequency: "DAILY" },
      { category: "CODING", title: "Revise LCS", frequency: "WEEKLY" },
      
      { category: "PROJECT", title: "Start the SaaS idea", frequency: "DAILY" },
      { category: "PROJECT", title: "Annotate dataset of research internship", frequency: "WEEKLY" },
      { category: "PROJECT", title: "Complete app of PlantsTalk company internship", frequency: "WEEKLY" },
      
      { category: "FITNESS_MIND", title: "100 pullups", frequency: "DAILY" },
      { category: "FITNESS_MIND", title: "Meditation of Ganesh Ji 2 times", frequency: "DAILY" },
      
      { category: "HABIT", title: "No Fap Streak", frequency: "DAILY" },
      { category: "HABIT", title: "Consistent Sleep (11 PM)", frequency: "DAILY" }
    ];

    const goals = [];
    for (const g of goalsData) {
      const isCompletedRecently = Math.random() > 0.3; // 70% completion rate for seed users
      const currentStreak = isCompletedRecently ? Math.floor(Math.random() * 8) + 1 : 0;
      
      const goal = await prisma.goal.create({
        data: {
          userId: user.id,
          category: g.category,
          title: g.title,
          frequency: g.frequency,
          currentStreak,
          maxStreak: Math.max(currentStreak, 10),
          lastCompleted: isCompletedRecently ? new Date() : null
        }
      });
      goals.push(goal);

      // Create completions logs spanning last 14 days
      if (isCompletedRecently) {
        for (let i = 0; i < currentStreak; i++) {
          const completionDate = new Date();
          completionDate.setDate(completionDate.getDate() - i);
          
          await prisma.goalLog.create({
            data: {
              goalId: goal.id,
              completedAt: completionDate
            }
          });
        }
      }
    }

    // 6. Generate Historical Weekly Reports for the last 4 weeks (to drive chart metrics)
    const basePlacementScore = Math.round((t.leetcode.solved / 450 * 100 * 0.55) + (t.github.commits / 80 * 100 * 0.45));
    const isImbalanced = t.leetcode.solved > 300 && t.github.commits < 10;
    const baseLifeBalance = isImbalanced ? 35 : Math.round(75 - Math.random() * 20);

    for (let w = 4; w >= 1; w--) {
      const reportDate = new Date();
      reportDate.setDate(reportDate.getDate() - (w * 7));

      const wStart = new Date(reportDate);
      wStart.setDate(reportDate.getDate() - 7);

      // Add small variance to show a historical line chart moving upward
      const trendAdjustment = (4 - w) * 3; // +3 points each week
      const weeklyReadiness = Math.min(100, Math.max(10, basePlacementScore - 12 + trendAdjustment));
      const weeklyBalance = Math.min(100, Math.max(10, baseLifeBalance - 8 + Math.round(Math.random() * 6)));

      await prisma.weeklyReport.create({
        data: {
          userId: user.id,
          weekStart: wStart,
          weekEnd: reportDate,
          placementReadinessScore: weeklyReadiness,
          lifeBalanceScore: weeklyBalance,
          wins: JSON.stringify([
            "Successfully kept up the daily LeetCode POTD quest chain",
            "Pushed modular API endpoints for the SaaS idea",
            "Completed 100 pullups habit consistently"
          ]),
          weaknesses: JSON.stringify([
            "Low overall PR contributions on the internship repository",
            "Inconsistent sleep schedule logs flagged on Wednesday"
          ]),
          recommendations: JSON.stringify([
            "Keep practicing Medium trees and graphs on LeetCode",
            "Refactor client routing in the PlantsTalk project"
          ]),
          nextWeekPlan: JSON.stringify({
            priorityDistribution: {
              coding: 40,
              projects: 35,
              fitnessMind: 15,
              habits: 10
            },
            reason: "Maintain coding strength while slowly building up SaaS development commits.",
            tasks: [
              "Complete LeetCode POTD daily (7 consecutive days)",
              "Commit 3 times to primary SaaS repository",
              "Execute 100 pullups at least 4 times"
            ]
          }),
          generatedAt: reportDate
        }
      });
    }

    // 7. Seed Initial Agent Insights
    await prisma.agentInsight.create({
      data: {
        userId: user.id,
        agentType: "CODING",
        score: Math.min(100, Math.round(t.leetcode.solved / 5 + 30)),
        insight: JSON.stringify(["Strong performance in Arrays and Dynamic Arrays", "Active daily POTD logs"]),
        recommendation: "Concentrate on Medium Trees and Advanced DP. Try LeetCode weekly contests to boost rating."
      }
    });

    await prisma.agentInsight.create({
      data: {
        userId: user.id,
        agentType: "PROJECT",
        score: Math.min(100, Math.round(t.github.commits + 20)),
        insight: JSON.stringify(["Frequent commits last 30 days", "Practicing feature-branch version control"]),
        recommendation: "Begin the primary SaaS architecture module. Ensure unit tests are deployed via GitHub Actions."
      }
    });
  }

  logger.info("Database seeding successfully completed!");
  await prisma.$disconnect();
}

main().catch((err) => {
  logger.error("Seeding operation failed", err);
  prisma.$disconnect();
  process.exit(1);
});
