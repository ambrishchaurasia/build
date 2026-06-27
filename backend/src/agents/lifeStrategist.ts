import OpenAI from "openai";
import { StudentProfile } from "@prisma/client";
import { CodingMentorOutput } from "./codingMentor";
import { ProjectMentorOutput } from "./projectMentor";
import { logger } from "../utils/logger";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export interface LifeStrategistOutput {
  priorityDistribution: {
    coding: number;
    projects: number;
    fitnessMind: number;
    habits: number;
  };
  reason: string;
  wins: string[];
  weaknesses: string[];
  recommendations: string[];
  nextWeekPlan: string[];
}

export class LifeStrategist {
  static async synthesize(
    profile: StudentProfile,
    codingInsight: CodingMentorOutput,
    projectInsight: ProjectMentorOutput,
    scores: { placementScore: number; lifeBalanceScore: number },
    allGoalsCount: { coding: number; project: number; fitness: number; habit: number }
  ): Promise<LifeStrategistOutput> {
    try {
      if (openai) {
        logger.info("Running Master Life Strategist via OpenAI API");
        const prompt = `
          You are the Master Life Strategist and student career coach.
          Synthesize feedback from the Coding Mentor and Project Mentor.

          Student Profile: Career goal is ${profile.careerGoal}, CGPA is ${profile.cgpa}, Target Placement Year ${profile.targetPlacementYear}.
          Coding Advisor Output: Score ${codingInsight.score}, Strengths: ${codingInsight.strengths.join(", ")}, Weaknesses: ${codingInsight.weaknesses.join(", ")}
          Project Advisor Output: Score ${projectInsight.score}, Strengths: ${projectInsight.strengths.join(", ")}, Weaknesses: ${projectInsight.weaknesses.join(", ")}
          Placement Readiness Score: ${scores.placementScore}/100
          Life Balance Score: ${scores.lifeBalanceScore}/100

          Provide a unified action plan resolving conflicts (e.g. if one area is severely lagging, increase its priority distribution percentage).
          
          Respond in EXACTLY the following JSON format:
          {
            "priorityDistribution": {
              "coding": <number percentage e.g. 40>,
              "projects": <number percentage e.g. 30>,
              "fitnessMind": <number percentage e.g. 20>,
              "habits": <number percentage e.g. 10>
            },
            "reason": "explanation of focus weight choices",
            "wins": ["string", "string"],
            "weaknesses": ["string", "string"],
            "recommendations": ["string", "string"],
            "nextWeekPlan": ["string", "string"]
          }
          The sum of priorityDistribution percentages MUST be exactly 100.
        `;

        const response = await openai.chat.completions.create({
          model: "gpt-4-turbo",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" }
        });

        const text = response.choices[0].message.content || "{}";
        return JSON.parse(text) as LifeStrategistOutput;
      } else {
        logger.info("Running simulated Life Strategist rule engine");
        return this.generateSimulatedInsight(profile, codingInsight, projectInsight, scores);
      }
    } catch (error) {
      logger.error("Life Strategist synthesis failed, returning fallback", error);
      return {
        priorityDistribution: { coding: 40, projects: 40, fitnessMind: 10, habits: 10 },
        reason: "Maintain an even split between DSA problem practice and repository portfolio work.",
        wins: ["Maintained baseline consistency across core profiles"],
        weaknesses: ["Imbalance in daily goal tracking"],
        recommendations: ["Synchronize daily LeetCode POTD and commit daily to GitHub"],
        nextWeekPlan: ["Complete LeetCode POTD everyday", "Commit 3 times to primary SaaS repository"]
      };
    }
  }

  private static generateSimulatedInsight(
    profile: StudentProfile,
    codingInsight: CodingMentorOutput,
    projectInsight: ProjectMentorOutput,
    scores: { placementScore: number; lifeBalanceScore: number }
  ): LifeStrategistOutput {
    // Determine allocation percentages based on which score is lower
    let codingPct = 40;
    let projectPct = 30;
    let fitnessPct = 15;
    let habitPct = 15;

    let reason = "";
    const wins: string[] = [];
    const weaknesses: string[] = [];
    const recommendations: string[] = [];
    const nextWeekPlan: string[] = [];

    // Prioritize coding if coding is lower, or project if projects are lower
    if (codingInsight.score < projectInsight.score - 10) {
      codingPct = 50;
      projectPct = 20;
      reason = `DSA performance (${codingInsight.score}) is lagging behind your project portfolio. Academic deadlines and placement readiness require strong problem solving, so coding allocation is boosted to 50%.`;
      recommendations.push("Increase daily LeetCode problem volume, focusing on medium-difficulty arrays and strings.");
      nextWeekPlan.push("Complete LeetCode POTD daily (7 consecutive days)");
      nextWeekPlan.push("Revise yesterdays mistakes and practice 3 LCS questions");
    } else if (projectInsight.score < codingInsight.score - 10) {
      codingPct = 25;
      projectPct = 45;
      reason = `Project maturity (${projectInsight.score}) is lower than DSA profile (${codingInsight.score}). To maximize placement success, you need an active repository. Project allocation is boosted to 45%.`;
      recommendations.push("Prioritize committing features to your main SaaS idea and completing outstanding internship apps.");
      nextWeekPlan.push("Work on the SaaS codebase 4 days this week");
      nextWeekPlan.push("Complete PlantsTalk company internship app and push code to GitHub");
    } else {
      codingPct = 35;
      projectPct = 35;
      reason = "Coding and Project profiles are balanced. Continue with a steady split of 35% each, dedicating the remaining 30% to fitness, meditation, and healthy streaks to maintain high cognitive performance.";
      recommendations.push("Maintain current dual-tracking habits. Balance DSA practice with modular feature pushes.");
      nextWeekPlan.push("Keep POTD streak alive");
      nextWeekPlan.push("Implement the main schema and mock databases for the SaaS project");
    }

    // Wins determination
    if (scores.placementScore > 75) {
      wins.push("Exceptional placement readiness posture");
    } else {
      wins.push("Initiated active discipline across coding and projects");
    }
    
    if (codingInsight.strengths.length > 0) wins.push(codingInsight.strengths[0]);
    if (projectInsight.strengths.length > 0) wins.push(projectInsight.strengths[0]);

    // Weaknesses determination
    if (scores.lifeBalanceScore < 45) {
      weaknesses.push("Severe schedule imbalance - neglecting fitness or habits");
      recommendations.push("Make sure to perform your 100 pullups and Ganesh Ji meditations to maintain high focus levels and avoid burnout.");
      nextWeekPlan.push("Execute 100 pullups at least 4 times next week");
      nextWeekPlan.push("Perform meditation of Ganesh Ji twice daily for mental clarity");
    }
    if (codingInsight.weaknesses.length > 0) weaknesses.push(codingInsight.weaknesses[0]);
    if (projectInsight.weaknesses.length > 0) weaknesses.push(projectInsight.weaknesses[0]);

    // Streaks warning
    weaknesses.push("Streak maintenance requires high discipline (e.g. POTD and No Fap)");

    // Standardize lists
    if (nextWeekPlan.length < 3) {
      nextWeekPlan.push("Track your habits on the Habits & Streaks board");
    }

    return {
      priorityDistribution: {
        coding: codingPct,
        projects: projectPct,
        fitnessMind: fitnessPct,
        habits: habitPct
      },
      reason,
      wins: wins.slice(0, 3),
      weaknesses: weaknesses.slice(0, 3),
      recommendations: recommendations.slice(0, 3),
      nextWeekPlan
    };
  }
}
