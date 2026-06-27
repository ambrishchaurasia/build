import React, { useState } from "react";
import { GitBranch, Flame, Trash2, PlusCircle } from "lucide-react";
import { dashboardApi } from "../services/dashboardApi";

interface ProjectsArenaProps {
  telemetry: any;
  goals: any[];
  insights: any[];
  onRefresh: () => Promise<void>;
}

export default function ProjectsArena({ telemetry, goals, insights, onRefresh }: ProjectsArenaProps) {
  const [addingGoal, setAddingGoal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState("");

  const projectGoals = goals.filter((g) => g.category === "PROJECT");
  const projectInsight = insights.find((i) => i.agentType === "PROJECT");
  const github = telemetry.github;

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
        category: "PROJECT",
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

  // Generate mock contribution calendar (12 weeks, 7 days a week)
  const renderContributionGrid = () => {
    const weeks = 12;
    const days = 7;
    const grid = [];

    // Let's create a deterministic pattern based on active commits to make it look full
    for (let w = 0; w < weeks; w++) {
      const weekCols = [];
      for (let d = 0; d < days; d++) {
        // Generate shade of cyan based on modulo and week index
        const index = w * 7 + d;
        let color = "bg-neutral-900"; // default
        if (github.commitsLast30Days > 0) {
          const mod = index % 5;
          if (mod === 1) color = "bg-cyan-950";
          else if (mod === 2) color = "bg-cyan-800";
          else if (mod === 3) color = "bg-cyan-600";
          else if (mod === 4 && w > 4) color = "bg-cyan-400";
        }
        weekCols.push(
          <div
            key={d}
            className={`w-3.5 h-3.5 rounded-sm ${color} heatmap-dot`}
            title={`Contributions index: ${index}`}
          ></div>
        );
      }
      grid.push(
        <div key={w} className="flex flex-col gap-1">
          {weekCols}
        </div>
      );
    }

    return grid;
  };

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-brand-cyan/5 border border-brand-cyan/10 rounded-2xl">
        <div>
          <h2 className="text-2xl font-extrabold text-white font-display flex items-center gap-2">
            <GitBranch className="text-brand-cyan w-6 h-6 animate-pulse" />
            Projects & Code Arena
          </h2>
          <p className="text-sm text-neutral-400 mt-1">
            Build production-ready portfolios. Tracks repositories, branches, commits, and Pull Requests.
          </p>
        </div>
      </div>

      {/* Daily Project Quests (Primary focal point - MOVED UP) */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-md font-bold text-white flex items-center gap-1.5">
            <Flame className="text-brand-cyan w-5 h-5" />
            Active Project Quests
          </h3>
          <button
            onClick={() => setAddingGoal(true)}
            className="text-neutral-500 hover:text-brand-cyan transition-colors flex items-center gap-1 text-xs focus:outline-none cursor-pointer"
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
              placeholder="Quest title (e.g. Deploy backend to Render)"
              className="flex-1 px-3 py-1.5 bg-neutral-950 border border-neutral-800 text-xs rounded-lg text-white focus:outline-none focus:border-brand-cyan"
              required
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-brand-cyan text-neutral-950 rounded-lg text-xs font-bold"
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
          {projectGoals.length === 0 ? (
            <p className="text-xs text-neutral-500 py-4 text-center">No project quests active. Add one above!</p>
          ) : (
            projectGoals.map((goal) => {
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
                          ? "bg-brand-cyan/20 border-brand-cyan text-brand-cyan"
                          : "border-neutral-700 hover:border-brand-cyan"
                      }`}
                    >
                      {todayCompleted && "✓"}
                    </button>
                    <div>
                      <span className={`text-sm font-medium block ${todayCompleted ? "text-neutral-400 line-through" : "text-white"}`}>
                        {goal.title}
                      </span>
                      <span className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wide">
                        {goal.frequency}
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

      {/* Commit calendar heatmap panel (MOVED TO BOTTOM) */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Commit Contribution Heatmap
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            Consistency grid of repository pushes and branch updates over the last 12 weeks.
          </p>
        </div>
        
        {/* Render grid */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
          {renderContributionGrid()}
        </div>

        <div className="flex justify-between items-center text-[10px] text-neutral-500 uppercase font-semibold">
          <span>12 Weeks Ago</span>
          <div className="flex items-center gap-1">
            <span>Less</span>
            <div className="w-2.5 h-2.5 bg-neutral-900 rounded-sm"></div>
            <div className="w-2.5 h-2.5 bg-cyan-950 rounded-sm"></div>
            <div className="w-2.5 h-2.5 bg-cyan-800 rounded-sm"></div>
            <div className="w-2.5 h-2.5 bg-cyan-600 rounded-sm"></div>
            <div className="w-2.5 h-2.5 bg-cyan-400 rounded-sm"></div>
            <span>More</span>
          </div>
          <span>Today</span>
        </div>
      </div>

      {/* Subtle advisor suggestion foot banner (Minimized AI layout) */}
      {projectInsight && (
        <div className="bg-neutral-900/60 border border-neutral-850 hover:border-brand-cyan/20 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="inline-block px-2 py-0.5 bg-brand-cyan/10 border border-brand-cyan/30 text-brand-cyan rounded text-[9px] font-bold uppercase tracking-widest">
              Tip
            </span>
            <span className="text-neutral-300 font-medium">
              {projectInsight.recommendation}
            </span>
          </div>
          <span className="text-[9px] text-neutral-500 uppercase tracking-wider font-semibold shrink-0">
            Advisor Tier: L4 Principal Architect
          </span>
        </div>
      )}
    </div>
  );
}
