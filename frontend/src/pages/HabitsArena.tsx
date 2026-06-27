import React, { useState } from "react";
import { Sparkles, Trash2, PlusCircle, Calendar, ShieldCheck } from "lucide-react";
import { dashboardApi } from "../services/dashboardApi";

interface HabitsArenaProps {
  telemetry: any;
  goals: any[];
  insights?: any[];
  onRefresh: () => Promise<void>;
}

export default function HabitsArena({ telemetry, goals, insights = [], onRefresh }: HabitsArenaProps) {
  const [addingGoal, setAddingGoal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState("");

  const habitGoals = goals.filter((g) => g.category === "HABIT");
  const habitsScore = telemetry.scores.habitsScore;

  const habitInsight = insights.find((i) => i.agentType === "HABIT");
  const recommendation = habitInsight?.recommendation || "Eliminating constant short-term dopamine spikes triggers neuroplastic recovery, directly improving attention span, logic execution, and retention capacity.";

  // Toggle Quest
  const handleToggle = async (goalId: string) => {
    try {
      await dashboardApi.toggleGoal(goalId);
      await onRefresh();
    } catch (err) {
      console.error("Failed to complete habit quest", err);
    }
  };

  // Add Goal
  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;
    try {
      await dashboardApi.createGoal({
        category: "HABIT",
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

  // Generate a habit calendar representing the last 28 days (4 weeks x 7 days)
  const renderHabitGrid = () => {
    const totalDays = 28;
    const grid = [];

    // Gather completed log dates
    const completedDates = new Set<string>();
    for (const goal of goals) {
      for (const log of goal.logs || []) {
        completedDates.add(new Date(log.completedAt).toDateString());
      }
    }

    for (let i = totalDays - 1; i >= 0; i--) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - i);
      const targetDateStr = targetDate.toDateString();

      // Count goals completed on this specific day
      let completedCount = 0;
      for (const goal of goals) {
        const hasLog = (goal.logs || []).some(
          (log: any) => new Date(log.completedAt).toDateString() === targetDateStr
        );
        if (hasLog) completedCount++;
      }

      // Choose shade of pink
      let color = "bg-neutral-900";
      if (completedCount === 1) color = "bg-pink-950/80 border border-pink-900/30";
      else if (completedCount === 2) color = "bg-pink-850 border border-pink-700/40";
      else if (completedCount >= 3) color = "bg-pink-600 shadow-[0_0_8px_rgba(236,72,153,0.3)]";

      grid.push(
        <div
          key={i}
          className={`w-9 h-9 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all duration-200 cursor-default ${color} text-neutral-400 hover:scale-110`}
          title={`${completedCount} habits completed on ${targetDate.toLocaleDateString()}`}
        >
          {targetDate.getDate()}
        </div>
      );
    }

    return grid;
  };

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-brand-pink/5 border border-brand-pink/10 rounded-2xl">
        <div>
          <h2 className="text-2xl font-extrabold text-white font-display flex items-center gap-2">
            <ShieldCheck className="text-brand-pink w-6 h-6 animate-pulse" />
            Habits & Discipline Board
          </h2>
          <p className="text-sm text-neutral-400 mt-1">
            Build unshakeable personal streaks. Dopamine-detox and consistency tracking for peak cognitive performance.
          </p>
        </div>
      </div>

      {/* Stats and Heatmap Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Habit Calendar Column (2/3 width on desktop) */}
        <div className="glass-panel p-6 rounded-2xl space-y-4 lg:col-span-2">
          <div className="flex items-center gap-2">
            <Calendar className="text-brand-pink w-5 h-5" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Discipline Heatmap (Last 28 Days)
            </h3>
          </div>
          <p className="text-xs text-neutral-400">
            Consecutive habit logging intensities. Completing multiple quests increases the pink grid brightness.
          </p>

          <div className="grid grid-cols-7 gap-3 pt-2">
            {/* Headers */}
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center text-[10px] font-bold text-neutral-500 uppercase">
                {day}
              </div>
            ))}
            {renderHabitGrid()}
          </div>
        </div>

        {/* Level and Streaks summary */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1">
              Discipline Index
            </span>
            <span className="text-4xl font-extrabold text-brand-pink">
              {habitsScore} <span className="text-sm text-neutral-500 font-normal">/ 100</span>
            </span>
            <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden mt-4">
              <div
                className="bg-brand-pink h-full transition-all duration-1000"
                style={{ width: `${habitsScore}%` }}
              ></div>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <div className="p-3.5 bg-neutral-900/60 border border-neutral-800 rounded-xl flex items-center justify-between">
              <span className="text-xs text-neutral-400">Global Login Streak:</span>
              <span className="text-sm font-extrabold text-white flex items-center gap-1">
                🔥 {telemetry.streakDays} Days
              </span>
            </div>
            <div className="p-3.5 bg-neutral-900/60 border border-neutral-800 rounded-xl flex items-center justify-between">
              <span className="text-xs text-neutral-400">Streak Level:</span>
              <span className="text-sm font-extrabold text-brand-pink uppercase tracking-wide">
                Discipline Lord
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Habit Quests Checklist (Primary focal point) */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-md font-bold text-white flex items-center gap-1.5">
            <Sparkles className="text-brand-pink w-5 h-5" />
            Active Habit Streaks
          </h3>
          <button
            onClick={() => setAddingGoal(true)}
            className="text-neutral-500 hover:text-brand-pink transition-colors flex items-center gap-1 text-xs focus:outline-none cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" /> Add Streak
          </button>
        </div>

        {addingGoal && (
          <form onSubmit={handleAddGoal} className="flex gap-2 p-3 bg-neutral-900 border border-neutral-800 rounded-xl">
            <input
              type="text"
              value={newGoalTitle}
              onChange={(e) => setNewGoalTitle(e.target.value)}
              placeholder="Streak name (e.g. No Sugar, Sleep 8 Hours)"
              className="flex-1 px-3 py-1.5 bg-neutral-950 border border-neutral-800 text-xs rounded-lg text-white focus:outline-none focus:border-brand-pink"
              required
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-brand-pink text-neutral-950 rounded-lg text-xs font-bold"
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
          {habitGoals.length === 0 ? (
            <p className="text-xs text-neutral-500 py-4 text-center">No active streaks. Add one above!</p>
          ) : (
            habitGoals.map((goal) => {
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
                          ? "bg-brand-pink/20 border-brand-pink text-brand-pink"
                          : "border-neutral-700 hover:border-brand-pink"
                      }`}
                    >
                      {todayCompleted && "✓"}
                    </button>
                    <div>
                      <span className={`text-sm font-medium block ${todayCompleted ? "text-neutral-400 line-through" : "text-white"}`}>
                        {goal.title}
                      </span>
                      <span className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wide flex items-center gap-1">
                        🔥 {goal.currentStreak} Day Streak (All-Time Max: {goal.maxStreak})
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

      {/* Subtle advisor suggestion foot banner (Minimized AI layout) */}
      <div className="bg-neutral-900/60 border border-neutral-850 hover:border-brand-pink/20 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="inline-block px-2 py-0.5 bg-brand-pink/10 border border-brand-pink/30 text-brand-pink rounded text-[9px] font-bold uppercase tracking-widest">
            Tip
          </span>
          <span className="text-neutral-300 font-medium">
            {recommendation}
          </span>
        </div>
        <span className="text-[9px] text-neutral-500 uppercase tracking-wider font-semibold shrink-0">
          Advisor Tier: Behavioral Psychologist
        </span>
      </div>
    </div>
  );
}
