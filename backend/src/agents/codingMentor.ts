import OpenAI from "openai";
import { LeetcodeMetrics, Goal } from "@prisma/client";
import { logger } from "../utils/logger";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export interface CodingMentorOutput {
  score: number;
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
}

export class CodingMentor {
  static async analyze(
    metrics: LeetcodeMetrics | null,
    goals: Goal[],
    careerGoal: string
  ): Promise<CodingMentorOutput> {
    try {
      const metricsSummary = metrics
        ? `Solved: ${metrics.totalSolved} (Easy: ${metrics.easySolved}, Medium: ${metrics.mediumSolved}, Hard: ${metrics.hardSolved}), Rating: ${metrics.contestRating}, Rank: ${metrics.ranking}`
        : "No LeetCode data linked";

      const goalsSummary = goals.map((g) => `- Goal: ${g.title} (Streak: ${g.currentStreak} days)`).join("\n");

      if (openai) {
        logger.info("Running AI Coding Mentor via OpenAI API");
        const prompt = `
          You are a Senior Software Engineer acting as a Coding Mentor.
          Analyze this student's LeetCode/DSA metrics and current goals to assess their placement readiness.

          Career Goal: ${careerGoal}
          LeetCode Metrics: ${metricsSummary}
          Coding Habits/Goals:
          ${goalsSummary}

          Provide your analysis in EXACTLY the following JSON format:
          {
            "score": <number between 0 and 100 representing DSA strength>,
            "strengths": ["string", "string"],
            "weaknesses": ["string", "string"],
            "recommendation": "detailed coding advice and what topic to practice next"
          }
        `;

        const response = await openai.chat.completions.create({
          model: "gpt-4-turbo",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" }
        });

        const text = response.choices[0].message.content || "{}";
        return JSON.parse(text) as CodingMentorOutput;
      } else {
        logger.info("Running simulated Coding Mentor rule engine");
        return this.generateSimulatedInsight(metrics, goals, careerGoal);
      }
    } catch (error) {
      logger.error("Coding Mentor analysis failed, returning baseline", error);
      return {
        score: 50,
        strengths: ["Regular problem solving"],
        weaknesses: ["Advanced DSA concepts"],
        recommendation: "Focus on medium-difficulty LeetCode problems, especially Graphs and Dynamic Programming."
      };
    }
  }

  private static generateSimulatedInsight(
    metrics: LeetcodeMetrics | null,
    goals: Goal[],
    careerGoal: string
  ): CodingMentorOutput {
    const total = metrics?.totalSolved || 0;
    const hard = metrics?.hardSolved || 0;
    const medium = metrics?.mediumSolved || 0;
    const rating = metrics?.contestRating || 0;

    let score = 30;
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    let recommendation = "";

    // Score calculations
    if (total > 0) {
      score += Math.min(40, (total / 350) * 40); // up to +40 for solved count
      score += Math.min(20, (medium / 150) * 20); // up to +20 for medium count
      score += Math.min(10, (hard / 30) * 10); // up to +10 for hard count
    }
    
    const potdGoal = goals.find((g) => g.title.toLowerCase().includes("potd"));
    if (potdGoal && potdGoal.currentStreak > 0) {
      score += Math.min(10, potdGoal.currentStreak * 1.5); // Streak boost
    }

    score = Math.round(Math.min(100, score));

    // Strengths & Weaknesses determination based on metrics
    if (total > 200) {
      strengths.push("Solid foundational problem-solving volume");
    } else {
      weaknesses.push("Low total DSA problem volume (target 250+)");
    }

    if (medium > 80) {
      strengths.push("Good grasp of Medium-difficulty concepts");
    } else {
      weaknesses.push("Need to solve more Medium problems (standard placement level)");
    }

    if (rating > 1600) {
      strengths.push(`Strong contest presence (Rating: ${rating})`);
    } else if (rating > 0) {
      weaknesses.push("Contest performance needs consistency");
    }

    if (potdGoal && potdGoal.currentStreak >= 5) {
      strengths.push(`High daily consistency (LeetCode POTD Streak: ${potdGoal.currentStreak} Days)`);
    } else {
      weaknesses.push("Inconsistent daily practice patterns");
    }

    // Default strengths if empty
    if (strengths.length === 0) strengths.push("Initiated problem-solving journey");
    if (weaknesses.length === 0) weaknesses.push("Competitive programming rating profile");

    const activeCodingGoal = goals.find((g) => g.category === "CODING");
    const questTip = activeCodingGoal ? `Focus on completing your active quest '${activeCodingGoal.title}' daily. ` : "";

    // Recommendations tailored to careerGoal
    if (careerGoal.includes("AI") || careerGoal.includes("ML") || careerGoal.includes("Data")) {
      recommendation = `${questTip}As a prospective ${careerGoal}, prioritize linear algebra, optimization algorithms, and hash tables. Target at least 2 Medium problems daily on LeetCode. Focus on Tree traversals and dynamic arrays, which are essential for model implementation tests.`;
    } else {
      recommendation = `${questTip}To secure placement as a Software Engineer, you master Array/String sliding windows, Graph DFS/BFS, and Dynamic Programming. Since your score is ${score}/100, commit to completing the LeetCode POTD and revising LCS/DP patterns. Aim to complete another 50 Medium problems before interviewing.`;
    }

    return {
      score,
      strengths,
      weaknesses,
      recommendation
    };
  }
}
