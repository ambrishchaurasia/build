import OpenAI from "openai";
import { FitnessMetrics, Goal } from "@prisma/client";
import { logger } from "../utils/logger";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export interface FitnessCoachOutput {
  score: number;
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
}

export class FitnessCoach {
  static async analyze(
    metrics: FitnessMetrics | null,
    goals: Goal[]
  ): Promise<FitnessCoachOutput> {
    try {
      const metricsSummary = metrics
        ? `Average Steps: ${metrics.steps}, Total Active Workout Minutes (last 7 days): ${metrics.workoutMinutes}, Active Days: ${metrics.workoutDays}/7`
        : "No Google Fit data synced";

      const goalsSummary = goals.map((g) => `- Goal: ${g.title} (Streak: ${g.currentStreak} days)`).join("\n");

      if (openai) {
        logger.info("Running AI Fitness Coach via OpenAI API");
        const prompt = `
          You are a Biohacking & Physical Fitness Coach.
          Analyze this software engineering student's physical activity metrics and current habits/goals to assess their physical readiness and prevent burnout.

          Fitness Metrics: ${metricsSummary}
          Fitness & Mind Habits/Goals:
          ${goalsSummary}

          Provide your analysis in EXACTLY the following JSON format:
          {
            "score": <number between 0 and 100 representing physical energy/fitness level>,
            "strengths": ["string", "string"],
            "weaknesses": ["string", "string"],
            "recommendation": "detailed physical coaching advice, biomechanics tips, and burnout prevention tips"
          }
        `;

        const response = await openai.chat.completions.create({
          model: "gpt-4-turbo",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" }
        });

        const text = response.choices[0].message.content || "{}";
        return JSON.parse(text) as FitnessCoachOutput;
      } else {
        logger.info("Running simulated Fitness Coach rule engine");
        return this.generateSimulatedInsight(metrics, goals);
      }
    } catch (error) {
      logger.error("Fitness Coach analysis failed, returning baseline", error);
      return {
        score: 60,
        strengths: ["Basic physical activity"],
        weaknesses: ["Developer posture and prolonged sitting"],
        recommendation: "Walk at least 8,000 steps daily. Implement scapular retractions and deep breathing exercises to reset neural pathways after coding sessions."
      };
    }
  }

  private static generateSimulatedInsight(
    metrics: FitnessMetrics | null,
    goals: Goal[]
  ): FitnessCoachOutput {
    const steps = metrics?.steps || 0;
    const minutes = metrics?.workoutMinutes || 0;

    let score = 40;
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    if (steps > 0) {
      score += Math.min(30, (steps / 10000) * 30);
    } else {
      score += 15;
    }

    if (minutes > 0) {
      score += Math.min(20, (minutes / 180) * 20);
    } else {
      score += 10;
    }

    const pullupGoal = goals.find((g) => g.title.toLowerCase().includes("pull"));
    if (pullupGoal && pullupGoal.currentStreak > 0) {
      score += Math.min(10, pullupGoal.currentStreak * 1.5);
    }

    const meditationGoal = goals.find((g) => g.title.toLowerCase().includes("meditation") || g.title.toLowerCase().includes("ganesh"));
    if (meditationGoal && meditationGoal.currentStreak > 0) {
      score += Math.min(10, meditationGoal.currentStreak * 1.5);
    }

    score = Math.round(Math.min(100, score));

    if (steps > 8000) {
      strengths.push(`Excellent daily cardiovascular base (Steps: ${steps})`);
    } else if (steps > 0) {
      weaknesses.push(`Low step counts - prone to circulation pooling (Steps: ${steps})`);
    }

    if (minutes > 150) {
      strengths.push(`Meets standard weekly physical exercise requirements (${minutes} minutes)`);
    } else if (minutes > 0) {
      weaknesses.push(`Insufficient high-intensity movement hours (${minutes} mins active/week)`);
    }

    if (pullupGoal && pullupGoal.currentStreak >= 5) {
      strengths.push(`Consistent upper body and back stamina (Pullups streak: ${pullupGoal.currentStreak} days)`);
    } else {
      weaknesses.push("Neglecting scapular retraction under rounded desk posture");
    }

    if (meditationGoal && meditationGoal.currentStreak >= 5) {
      strengths.push("Strong mindfulness routine for stress management");
    } else {
      weaknesses.push("Prone to developer mental burnout and spatial overload");
    }

    if (strengths.length === 0) strengths.push("Basic muscular recovery");
    if (weaknesses.length === 0) weaknesses.push("Sub-optimal core structural stability");

    const otherFitnessGoals = goals.filter((g) => g.category === "FITNESS_MIND" && g !== pullupGoal && g !== meditationGoal);

    let recommendation = "To mitigate the biomechanical fatigue of coding, perform scapular retractions and thoracic extensions.";
    
    if (pullupGoal) {
      recommendation += ` Complete your daily '${pullupGoal.title}' to keep back muscles active.`;
    } else {
      recommendation += " Complete your daily 100 pullups to keep back muscles active.";
    }

    if (meditationGoal) {
      recommendation += ` Maintain '${meditationGoal.title}' twice daily to balance neural fatigue and clear coding brain fog.`;
    } else {
      recommendation += " Maintain Ganesh Ji Meditation twice daily to balance neural fatigue and clear coding brain fog.";
    }

    if (otherFitnessGoals.length > 0) {
      recommendation += ` Ensure you also complete your active fitness quest '${otherFitnessGoals[0].title}' to build daily stamina.`;
    }

    return {
      score,
      strengths,
      weaknesses,
      recommendation
    };
  }
}
