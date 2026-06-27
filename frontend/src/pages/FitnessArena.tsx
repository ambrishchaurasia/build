import { useState } from "react";
import { Flame, Trash2, PlusCircle, Activity } from "lucide-react";
import { dashboardApi } from "../services/dashboardApi";

interface FitnessArenaProps {
  telemetry: any;
  goals: any[];
  insights: any[];
  onRefresh: () => Promise<void>;
}

export default function FitnessArena({ telemetry, goals, insights, onRefresh }: FitnessArenaProps) {
  const [addingGoal, setAddingGoal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState("");

  const fitnessGoals = goals.filter((g) => g.category === "FITNESS_MIND");
  const fitnessScore = telemetry.scores.fitnessScore;
  const fitnessInsight = insights?.find((i) => i.agentType === "FITNESS");

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
        category: "FITNESS_MIND",
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

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-brand-purple/5 border border-brand-purple/10 rounded-2xl gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white font-display flex items-center gap-2">
            <Activity className="text-brand-purple w-6 h-6 animate-pulse" />
            Fitness & Mind Arena
          </h2>
          <p className="text-sm text-neutral-400 mt-1">
            Build cognitive clarity and physical stamina. Strong focus habits prevent developer burnout.
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1">
              Active Mind Score
            </span>
            <span className="text-3xl font-extrabold text-white flex items-center gap-2">
              {fitnessScore} <span className="text-xs text-neutral-500 font-normal">/ 100</span>
            </span>
          </div>
          <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden mt-4">
            <div
              className="bg-brand-purple h-full transition-all duration-1000"
              style={{ width: `${fitnessScore}%` }}
            ></div>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1">
              Google Fit Activity
            </span>
            <span className="text-sm font-semibold text-white block mt-2 leading-relaxed">
              🔥 {telemetry.fitness?.steps || 0} steps/day avg<br />
              ⏱️ {telemetry.fitness?.workoutMinutes || 0} mins workout<br />
              📅 {telemetry.fitness?.workoutDays || 0}/7 active days
            </span>
          </div>
          <div className="text-[10px] text-neutral-500 mt-2 uppercase font-semibold">
            Synced from health APIs
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1">
              Ganesh Ji Meditation Status
            </span>
            <span className="text-sm font-semibold text-white block mt-2">
              {goals.find(g => g.title.toLowerCase().includes("ganesh"))?.currentStreak > 0
                ? `Active Streak: ${goals.find(g => g.title.toLowerCase().includes("ganesh"))?.currentStreak} days 🕉️`
                : "Awaiting Meditation Quest"}
            </span>
          </div>
          <div className="text-[10px] text-neutral-500 mt-4 uppercase font-semibold">
            Target: Twice daily for neural focus
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1">
              Stamina Habit
            </span>
            <span className="text-sm font-semibold text-white block mt-2">
              {goals.find(g => g.title.toLowerCase().includes("pull"))?.currentStreak > 0
                ? `Active Streak: ${goals.find(g => g.title.toLowerCase().includes("pull"))?.currentStreak} days 💪`
                : "Awaiting Pullup Quest"}
            </span>
          </div>
          <div className="text-[10px] text-neutral-500 mt-4 uppercase font-semibold">
            Target: 100 pullups daily
          </div>
        </div>
      </div>

      {/* Daily Fitness Quests (Primary focal point) */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-md font-bold text-white flex items-center gap-1.5">
            <Flame className="text-brand-purple w-5 h-5" />
            Daily Fitness & Mind Quests
          </h3>
          <button
            onClick={() => setAddingGoal(true)}
            className="text-neutral-500 hover:text-brand-purple transition-colors flex items-center gap-1 text-xs focus:outline-none cursor-pointer"
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
              placeholder="Quest title (e.g. 20 mins cardio)"
              className="flex-1 px-3 py-1.5 bg-neutral-950 border border-neutral-800 text-xs rounded-lg text-white focus:outline-none focus:border-brand-purple"
              required
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-brand-purple text-neutral-950 rounded-lg text-xs font-bold"
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
          {fitnessGoals.length === 0 ? (
            <p className="text-xs text-neutral-500 py-4 text-center">No physical/mind quests active. Add one above!</p>
          ) : (
            fitnessGoals.map((goal) => {
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
                          ? "bg-brand-purple/20 border-brand-purple text-brand-purple"
                          : "border-neutral-700 hover:border-brand-purple"
                      }`}
                    >
                      {todayCompleted && "✓"}
                    </button>
                    <div>
                      <span className={`text-sm font-medium block ${todayCompleted ? "text-neutral-400 line-through" : "text-white"}`}>
                        {goal.title}
                      </span>
                      <span className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wide">
                        {goal.frequency} • {goal.currentStreak} Day Streak 🔥
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
      <div className="bg-neutral-900/60 border border-neutral-850 hover:border-brand-purple/20 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="inline-block px-2 py-0.5 bg-brand-purple/10 border border-brand-purple/30 text-brand-purple rounded text-[9px] font-bold uppercase tracking-widest">
            Tip
          </span>
          <span className="text-neutral-300 font-medium">
            {fitnessInsight?.recommendation || "As an engineering student, long hours at the keyboard contract your chest. Perform 100 Pullups and Ganesh Ji Meditation to maintain neuro-physical balance."}
          </span>
        </div>
        <span className="text-[9px] text-neutral-500 uppercase tracking-wider font-semibold shrink-0">
          Advisor Tier: Physical Coach & BioHacker
        </span>
      </div>
    </div>
  );
}
