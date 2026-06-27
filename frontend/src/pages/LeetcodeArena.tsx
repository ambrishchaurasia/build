import React, { useState } from "react";
import { CircleDot, Award, Flame, Trash2, PlusCircle } from "lucide-react";
import { dashboardApi } from "../services/dashboardApi";

interface LeetcodeArenaProps {
  telemetry: any;
  goals: any[];
  insights: any[];
  onRefresh: () => Promise<void>;
}

export default function LeetcodeArena({ telemetry, goals, insights, onRefresh }: LeetcodeArenaProps) {
  const [addingGoal, setAddingGoal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState("");

  const codingGoals = goals.filter((g) => g.category === "CODING");
  const codingInsight = insights.find((i) => i.agentType === "CODING");
  const leetcode = telemetry.leetcode;

  // Toggle Quest
  const handleToggle = async (goalId: string) => {
    try {
      await dashboardApi.toggleGoal(goalId);
      await onRefresh();
    } catch (err) {
      console.error("Failed to complete quest", err);
    }
  };

  // Add Goal
  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;
    try {
      await dashboardApi.createGoal({
        category: "CODING",
        title: newGoalTitle,
        frequency: "DAILY"
      });
      setNewGoalTitle("");
      setAddingGoal(false);
      await onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Goal
  const handleDeleteGoal = async (goalId: string) => {
    try {
      await dashboardApi.deleteGoal(goalId);
      await onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  // Circular progress calculations
  const totalTarget = 300;
  const solvedPercent = Math.min(100, Math.round((leetcode.totalSolved / totalTarget) * 100));

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-brand-yellow/5 border border-brand-yellow/10 rounded-2xl">
        <div>
          <h2 className="text-2xl font-extrabold text-white font-display flex items-center gap-2">
            <CircleDot className="text-brand-yellow w-6 h-6 animate-pulse" />
            LeetCode Arena
          </h2>
          <p className="text-sm text-neutral-400 mt-1">
            Master Data Structures & Algorithms. Currently tracked target: {totalTarget} problems solved.
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Circle Progress Card */}
        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1">
              DSA Solved Volume
            </span>
            <span className="text-3xl font-extrabold text-white block">
              {leetcode.totalSolved} <span className="text-sm text-neutral-500 font-normal">/ {totalTarget}</span>
            </span>
            <div className="mt-4 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-500">Easy</span>
                <span className="font-semibold text-white">{leetcode.easySolved}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-amber-500">Medium</span>
                <span className="font-semibold text-white">{leetcode.mediumSolved}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-rose-500">Hard</span>
                <span className="font-semibold text-white">{leetcode.hardSolved}</span>
              </div>
            </div>
          </div>

          {/* SVG Circular Ring */}
          <div className="relative w-24 h-24 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="rgba(255,255,255,0.03)"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="#eab308"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 - (251.2 * solvedPercent) / 100}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-lg font-bold text-white leading-none">{solvedPercent}%</span>
              <span className="text-[9px] text-neutral-500 mt-1 uppercase font-semibold">Ready</span>
            </div>
          </div>
        </div>

        {/* Contest rating card */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1">
              Contest Rating
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white">
                {leetcode.contestRating}
              </span>
              <span className="text-xs text-brand-yellow font-semibold flex items-center gap-0.5">
                <Award className="w-3.5 h-3.5" />
                Active Competitor
              </span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-neutral-900 text-xs text-neutral-400 flex items-center justify-between">
            <span>Global Ranking:</span>
            <span className="text-white font-semibold">#{leetcode.ranking.toLocaleString()}</span>
          </div>
        </div>

        {/* Skill Rating card */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1">
              Coding Advisor Score
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-brand-yellow">
                {telemetry.scores.codingScore}
              </span>
              <span className="text-xs text-neutral-400">/ 100 Max</span>
            </div>
          </div>
          <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden mt-4">
            <div
              className="bg-brand-yellow h-full transition-all duration-1000"
              style={{ width: `${telemetry.scores.codingScore}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Daily Coding Quests (Primary focal point) */}
      <div className="space-y-6">
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-md font-bold text-white flex items-center gap-1.5">
              <Flame className="text-brand-yellow w-5 h-5" />
              Daily Coding Quests
            </h3>
            <button
              onClick={() => setAddingGoal(true)}
              className="text-neutral-500 hover:text-brand-yellow transition-colors flex items-center gap-1 text-xs focus:outline-none cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" /> Add Quest
            </button>
          </div>

          {addingGoal && (
            <form onSubmit={handleAddGoal} className="flex gap-2 p-3 bg-neutral-900 border border-neutral-800 rounded-xl">
              <input
                type="text"
                value={newGoalTitle}
                onChange={(e) => setNewGoalTitle(e.target.value)}
                placeholder="Quest title (e.g. Solve 3 Binary Trees)"
                className="flex-1 px-3 py-1.5 bg-neutral-950 border border-neutral-800 text-xs rounded-lg text-white focus:outline-none focus:border-brand-yellow"
                required
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-brand-yellow text-neutral-950 rounded-lg text-xs font-bold"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setAddingGoal(false)}
                className="px-3 py-1.5 bg-neutral-800 text-neutral-400 rounded-lg text-xs"
              >
                Cancel
              </button>
            </form>
          )}

          <div className="space-y-2.5">
            {codingGoals.length === 0 ? (
              <p className="text-xs text-neutral-500 py-4 text-center">No coding quests added. Add one above!</p>
            ) : (
              codingGoals.map((goal) => {
                const todayCompleted = goal.lastCompleted && new Date(goal.lastCompleted).toDateString() === new Date().toDateString();
                
                return (
                  <div
                    key={goal.id}
                    className="flex items-center justify-between p-3.5 bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-800/80 rounded-xl transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleToggle(goal.id)}
                        disabled={todayCompleted}
                        className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                          todayCompleted
                            ? "bg-brand-yellow/20 border-brand-yellow text-brand-yellow"
                            : "border-neutral-700 hover:border-brand-yellow"
                        }`}
                      >
                        {todayCompleted && "✓"}
                      </button>
                      <div>
                        <span className={`text-sm font-medium block ${todayCompleted ? "text-neutral-400 line-through" : "text-white"}`}>
                          {goal.title}
                        </span>
                        <span className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wide">
                          {goal.frequency}{goal.title.toLowerCase().includes("potd") && ` • ${goal.currentStreak} Day Streak 🔥`}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="text-neutral-600 hover:text-red-500 transition-colors p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Subtle advisor suggestion foot banner (Minimized AI layout) */}
      {codingInsight && (
        <div className="bg-neutral-900/60 border border-neutral-850 hover:border-brand-yellow/20 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="inline-block px-2 py-0.5 bg-brand-yellow/10 border border-brand-yellow/30 text-brand-yellow rounded text-[9px] font-bold uppercase tracking-widest">
              Tip
            </span>
            <span className="text-neutral-300 font-medium">
              {codingInsight.recommendation}
            </span>
          </div>
          <span className="text-[9px] text-neutral-500 uppercase tracking-wider font-semibold shrink-0">
            Advisor Tier: L3 Senior Staff
          </span>
        </div>
      )}
    </div>
  );
}
