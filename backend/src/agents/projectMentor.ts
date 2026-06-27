import OpenAI from "openai";
import { GithubMetrics, Goal } from "@prisma/client";
import { logger } from "../utils/logger";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export interface ProjectMentorOutput {
  score: number;
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
}

export class ProjectMentor {
  static async analyze(
    metrics: GithubMetrics | null,
    goals: Goal[],
    careerGoal: string
  ): Promise<ProjectMentorOutput> {
    try {
      const metricsSummary = metrics
        ? `Repos: ${metrics.totalRepos} (Active: ${metrics.activeRepos}), Commits (30d): ${metrics.commitsLast30Days}, PRs: ${metrics.pullRequests}, Contributions Score: ${metrics.contributions}`
        : "No GitHub data linked";

      const goalsSummary = goals.map((g) => `- Project Goal: ${g.title} (Streak: ${g.currentStreak} days)`).join("\n");

      if (openai) {
        logger.info("Running AI Project Mentor via OpenAI API");
        const prompt = `
          You are a Senior Engineering Manager acting as a Project Mentor.
          Analyze this student's GitHub metrics and project development goals.

          Career Goal: ${careerGoal}
          GitHub Metrics: ${metricsSummary}
          Project Development Goals:
          ${goalsSummary}

          Provide your analysis in EXACTLY the following JSON format:
          {
            "score": <number between 0 and 100 representing portfolio strength>,
            "strengths": ["string", "string"],
            "weaknesses": ["string", "string"],
            "recommendation": "detailed portfolio and project development advice"
          }
        `;

        const response = await openai.chat.completions.create({
          model: "gpt-4-turbo",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" }
        });

        const text = response.choices[0].message.content || "{}";
        return JSON.parse(text) as ProjectMentorOutput;
      } else {
        logger.info("Running simulated Project Mentor rule engine");
        return this.generateSimulatedInsight(metrics, goals, careerGoal);
      }
    } catch (error) {
      logger.error("Project Mentor analysis failed, returning baseline", error);
      return {
        score: 45,
        strengths: ["Initiated multiple project repositories"],
        weaknesses: ["Abandoned project cleanup"],
        recommendation: "Build a single comprehensive production-ready SaaS application with unit tests and clear README instead of small templates."
      };
    }
  }

  private static generateSimulatedInsight(
    metrics: GithubMetrics | null,
    goals: Goal[],
    careerGoal: string
  ): ProjectMentorOutput {
    const totalRepos = metrics?.totalRepos || 0;
    const activeRepos = metrics?.activeRepos || 0;
    const commits = metrics?.commitsLast30Days || 0;
    const prs = metrics?.pullRequests || 0;

    let score = 25;
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    let recommendation = "";

    // Score calculations
    if (totalRepos > 0) {
      score += Math.min(25, (totalRepos / 15) * 25); // up to +25 for repos
      score += Math.min(30, (commits / 50) * 30); // up to +30 for commit activity
      score += Math.min(15, (prs / 8) * 15); // up to +15 for PR pull requests
    }

    const projectGoals = goals.filter((g) => g.category === "PROJECT");
    const activeGoalCount = projectGoals.filter((g) => g.isActive).length;
    const completionCount = projectGoals.filter((g) => g.lastCompleted).length;
    
    if (activeGoalCount > 0) {
      score += Math.round((completionCount / activeGoalCount) * 10); // Habit completion boost
    }

    score = Math.round(Math.min(100, score));

    // Strengths & Weaknesses
    if (commits > 30) {
      strengths.push("Excellent active code commit frequency");
    } else {
      weaknesses.push("Low recent commit frequency (aim for 25+ commits a month)");
    }

    if (prs > 4) {
      strengths.push("Practicing professional PR workflow processes");
    } else {
      weaknesses.push("Underutilizing branching and Pull Requests for version control");
    }

    if (activeRepos >= 3) {
      strengths.push("Active progress across multiple codebases");
    } else {
      weaknesses.push("Lack of active development cycles in projects");
    }

    const saasGoal = goals.find((g) => g.title.toLowerCase().includes("saas"));
    if (saasGoal && saasGoal.lastCompleted) {
      strengths.push("Active focus on building SaaS project architecture");
    }

    if (strengths.length === 0) strengths.push("Basic Git repository familiarity");
    if (weaknesses.length === 0) weaknesses.push("Project documentation and unit testing coverage");

    const activeProjectGoal = goals.find((g) => g.category === "PROJECT");
    const questTip = activeProjectGoal ? `Focus on completing your active quest '${activeProjectGoal.title}' daily. ` : "";

    // Recommendations tailored to careerGoal
    if (careerGoal.includes("AI") || careerGoal.includes("ML")) {
      recommendation = `${questTip}For an ${careerGoal} career, prioritize building full-stack ML pipelines. Move away from generic Jupyter notebooks and package your model endpoints as robust APIs using FastAPI or Express. Document your datasets, deploy to Render/Vercel, and write a stellar README detailing training accuracy, metrics, and dataset annotation pipelines.`;
    } else {
      recommendation = `${questTip}To secure placement as a Software Engineer, focus on completing your primary SaaS project. Ensure your repository has multiple components, a clean Git history with feature branches/PRs, active CI/CD actions, and full deployment links. Make sure your PlantsTalk or React App includes unit tests to showcase production-level quality.`;
    }

    return {
      score,
      strengths,
      weaknesses,
      recommendation
    };
  }
}
