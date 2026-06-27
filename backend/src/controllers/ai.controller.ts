import { Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { logger } from "../utils/logger";
import { ApiError } from "../middlewares/error.middleware";

const prisma = new PrismaClient();
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export class AiController {
  /**
   * Chat with the Life Strategist Agent, loaded with RAG context
   */
  static async chat(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id!;
      const { message, chatHistory } = req.body;

      if (!message) {
        throw new ApiError(400, "Message is required");
      }

      // 1. Gather RAG Context
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          profile: true,
          leetcodeMetrics: true,
          githubMetrics: true,
          goals: {
            include: { logs: true }
          }
        }
      });

      if (!user) {
        throw new ApiError(404, "User not found");
      }

      const latestReport = await prisma.weeklyReport.findFirst({
        where: { userId },
        orderBy: { generatedAt: "desc" }
      });

      const metricsContext = `
        User Name: ${user.name}
        Career Goal: ${user.profile?.careerGoal || "Not Configured"}
        Placement Readiness Score: ${latestReport?.placementReadinessScore || "N/A"}
        Life Balance Score: ${latestReport?.lifeBalanceScore || "N/A"}
        
        LeetCode Solved: ${user.leetcodeMetrics?.totalSolved || 0} (Easy: ${user.leetcodeMetrics?.easySolved || 0}, Medium: ${user.leetcodeMetrics?.mediumSolved || 0}, Hard: ${user.leetcodeMetrics?.hardSolved || 0})
        GitHub Commits (30d): ${user.githubMetrics?.commitsLast30Days || 0}
        GitHub Contributions: ${user.githubMetrics?.contributions || 0}
        
        Current Goals & Streaks:
        ${user.goals.map(g => `- [${g.category}] ${g.title}: Streak of ${g.currentStreak} Days (Completed: ${g.lastCompleted ? "Yes today" : "No"})`).join("\n")}
      `;

      if (openai) {
        logger.info("Executing OpenAI chatbot session");
        
        const systemPrompt = `
          You are the Master Life Strategist, a student's personal board of advisors.
          Your task is to guide the student based on their automated stats, daily goals, and streaks.
          Be supportive, direct, and actionable. Frame your advice around placements, portfolio value, and mental balance.
          
          Here is the student's current telemetry context:
          ${metricsContext}

          Keep your answers concise and formatted in markdown.
        `;

        const messages = [
          { role: "system", content: systemPrompt },
          ...(chatHistory || []).map((h: any) => ({
            role: h.sender === "user" ? "user" : "assistant",
            content: h.text
          })),
          { role: "user", content: message }
        ];

        const chatCompletion = await openai.chat.completions.create({
          model: "gpt-4-turbo",
          messages: messages as any,
          max_tokens: 500
        });

        const reply = chatCompletion.choices[0].message.content || "I couldn't process your request.";
        
        // Subtract 1 token for chat support
        if (user.tokens > 0) {
          await prisma.user.update({
            where: { id: userId },
            data: { tokens: user.tokens - 1 }
          });
        }

        return res.status(200).json({
          success: true,
          reply
        });
      } else {
        logger.info("Executing local mock chatbot query");
        const reply = this.generateSimulatedReply(message, user, latestReport);
        
        // Simulated tokens decrease
        if (user.tokens > 0) {
          await prisma.user.update({
            where: { id: userId },
            data: { tokens: user.tokens - 1 }
          });
        }

        return res.status(200).json({
          success: true,
          reply
        });
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate highly realistic responses locally based on user data
   */
  private static generateSimulatedReply(message: string, user: any, latestReport: any): string {
    const text = message.toLowerCase();
    const codingScore = latestReport?.placementReadinessScore ? Math.round(latestReport.placementReadinessScore * 1.1) : 40;
    const projectScore = latestReport?.placementReadinessScore ? Math.round(latestReport.placementReadinessScore * 0.9) : 35;
    
    let response = "";

    if (text.includes("focus") || text.includes("priority") || text.includes("should i do")) {
      response = `### Life Strategist Guidance on Focus Priorities\n\nBased on your metrics, here is where you should dedicate your energy:\n\n1. **Balance Review**: Your **Placement Readiness** is **${latestReport?.placementReadinessScore || 50}/100**. 
      - If your coding goals (like POTD) are active, keep doing them!
      - If your projects are stagnant (commits: ${user.githubMetrics?.commitsLast30Days || 0} in 30 days), immediately open your IDE and start **${user.goals.find((g: any) => g.category === "PROJECT")?.title || "your primary project"}**.\n
2. **Weekly Strategy**:
   - Dedicate **50% of your effort to Projects** this week.
   - Dedicate **30% to LeetCode Medium** problems.
   - Dedicate **20% to Fitness & Mind** (Meditation & pullups consistency) to avoid burnout.`;
    } else if (text.includes("weakness") || text.includes("risk") || text.includes("lagging")) {
      response = `### Advisor Alert: Key Risk Areas Identified\n\nLooking at your weekly metrics and habit logs, here are your primary vulnerabilities:\n\n- **Project Stagnation**: You have active repos but low PR counts. You need to simulate real-world industry habits by creating branches and merge conflicts rather than committing straight to main.\n- **Daily Goal Consistency**: Your current streak is **${user.streakDays} days**. Any missed day resets your multipliers. Make sure you don't break the chain on **Meditation** or **LeetCode POTD**.\n- **Discipline Check**: If you're maintaining a **No Fap** or **Sleep** streak, that mental discipline directly correlates with your interview focus. Keep pushing!`;
    } else if (text.includes("placement") || text.includes("ready") || text.includes("job")) {
      response = `### Placement Readiness Assessment\n\n* **Status**: In Progress\n* **Readiness Score**: **${latestReport?.placementReadinessScore || 45}/100**\n\n**To get FAANG or high-growth startup ready, you need:**\n1. **LeetCode**: Solve at least **250+ problems** (currently: ${user.leetcodeMetrics?.totalSolved || 0}) with a contest rating exceeding 1600.\n2. **GitHub Portfolio**: At least 1 main project containing custom dataset annotations or production-ready SaaS features with direct Vercel/Render deployments.\n3. **Consistency**: Your overall Life Balance Index is at **${latestReport?.lifeBalanceScore || 40}/100**. Imbalances tell interviewers that you lack discipline outside of homework. Balance your coding days with mock interviews and fitness.`;
    } else if (text.includes("streak") || text.includes("no fap") || text.includes("meditation") || text.includes("pullup")) {
      const ganeshGoal = user.goals.find((g: any) => g.title.toLowerCase().includes("ganesh"));
      const fapGoal = user.goals.find((g: any) => g.title.toLowerCase().includes("fap") || g.title.toLowerCase().includes("no fap"));
      
      response = `### Habits & Discipline Summary\n\nI see you're actively tracking your personal growth habits. This is what makes StudentOS AI unique!\n\n- **Ganesh Ji Meditation**: ${ganeshGoal ? `Currently at a 🔥 **${ganeshGoal.currentStreak} Day Streak**! This meditation improves neural clarity and keeps anxiety low during exam phases.` : "Not currently active. Go to the Settings tab to add your Ganesh Ji Meditation habit!"}\n- **Discipline Streak**: ${fapGoal ? `Currently at a 🔥 **${fapGoal.currentStreak} Day Streak**! Excellent self-discipline. Every day you maintain this control boosts your executive function.` : "No-Fap or sleep tracking helps build cognitive focus. Set this goal in Settings to build streaks!"}\n\nKeep the chain green! These habits build the discipline needed for 6-hour coding stretches.`;
    } else {
      response = `### Hello ${user.name}! I am your AI Life Strategist.\n\nI analyze your LeetCode metrics (${user.leetcodeMetrics?.totalSolved || 0} solved), GitHub contributions, and daily habit streaks (like Pullups and Meditation) to keep you balanced.\n\nHere are some questions you can ask me:\n- *"What should I focus on today?"*\n- *"What is my biggest weakness?"*\n- *"Am I placement ready?"*\n- *"Review my meditation and habits streak"*`;
    }

    return response;
  }
}
