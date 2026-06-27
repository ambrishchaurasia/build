import { useState } from "react";
import { History, Calendar, CheckCircle2, XCircle, Activity, GitBranch, CircleDot, ShieldCheck } from "lucide-react";

interface DailyLogsProps {
  goals: any[];
  onRefresh: () => Promise<void>;
}

export default function DailyLogs({ goals }: DailyLogsProps) {
  const [selectedDayOffset, setSelectedDayOffset] = useState<number>(1); // Defaults to 1 day ago (Yesterday)

  // Generate date object for a given day offset
  const getDateForOffset = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() - offset);
    return d;
  };

  // List of offsets for the past 7 days (1 = Yesterday, 7 = 7 Days Ago)
  const pastDaysOffsets = Array.from({ length: 7 }, (_, i) => i + 1);

  // Helper to determine if a goal was active on a past date
  const isGoalActiveOnDate = (goal: any, date: Date) => {
    const createdDate = new Date(goal.createdAt);
    
    // Normalize dates to midnight for simple comparison
    const targetDateMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const createdDateMidnight = new Date(createdDate.getFullYear(), createdDate.getMonth(), createdDate.getDate());
    
    // Active if created on/before target date
    if (createdDateMidnight <= targetDateMidnight) return true;
    
    // Fallback: If goal was created today, but we are looking at logs in the past 7 days,
    // assume it was active (this supports newly seeded database environments)
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    if (createdDateMidnight.getTime() === todayMidnight.getTime()) return true;
    
    // Also active if completed log exists on that day
    return goal.logs?.some(
      (log: any) => new Date(log.completedAt).toDateString() === date.toDateString()
    );
  };

  // Helper to check if a goal was completed on a target date
  const isGoalCompletedOnDate = (goal: any, date: Date) => {
    return (goal.logs || []).some(
      (log: any) => new Date(log.completedAt).toDateString() === date.toDateString()
    );
  };

  // Get active goals for a specific date
  const getGoalsForDate = (date: Date) => {
    return goals.filter((g) => isGoalActiveOnDate(g, date));
  };

  // Get formatted day name
  const formatDayName = (offset: number, date: Date) => {
    if (offset === 1) return "Yesterday";
    return date.toLocaleDateString("en-US", { weekday: "long" });
  };

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "CODING":
        return <CircleDot className="w-3.5 h-3.5 text-brand-yellow" />;
      case "PROJECT":
        return <GitBranch className="w-3.5 h-3.5 text-brand-cyan" />;
      case "FITNESS_MIND":
        return <Activity className="w-3.5 h-3.5 text-brand-purple" />;
      case "HABIT":
        return <ShieldCheck className="w-3.5 h-3.5 text-brand-pink" />;
      default:
        return null;
    }
  };

  // Get category label and badge style
  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "CODING":
        return (
          <span className="px-2 py-0.5 bg-brand-yellow/10 border border-brand-yellow/30 text-brand-yellow rounded text-[9px] font-bold uppercase tracking-wider">
            Coding
          </span>
        );
      case "PROJECT":
        return (
          <span className="px-2 py-0.5 bg-brand-cyan/10 border border-brand-cyan/30 text-brand-cyan rounded text-[9px] font-bold uppercase tracking-wider">
            Projects
          </span>
        );
      case "FITNESS_MIND":
        return (
          <span className="px-2 py-0.5 bg-brand-purple/10 border border-brand-purple/30 text-brand-purple rounded text-[9px] font-bold uppercase tracking-wider">
            Fitness
          </span>
        );
      case "HABIT":
        return (
          <span className="px-2 py-0.5 bg-brand-pink/10 border border-brand-pink/30 text-brand-pink rounded text-[9px] font-bold uppercase tracking-wider">
            Habit
          </span>
        );
      default:
        return null;
    }
  };

  const selectedDate = getDateForOffset(selectedDayOffset);
  const activeGoals = getGoalsForDate(selectedDate);
  const completedGoals = activeGoals.filter((g) => isGoalCompletedOnDate(g, selectedDate));
  const missedGoals = activeGoals.filter((g) => !isGoalCompletedOnDate(g, selectedDate));

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-neutral-900/60 border border-neutral-900 rounded-2xl">
        <div>
          <h2 className="text-2xl font-extrabold text-white font-display flex items-center gap-2">
            <History className="text-brand-yellow w-6 h-6 animate-pulse" />
            Daily History Log
          </h2>
          <p className="text-sm text-neutral-400 mt-1">
            Review completed and missed routines from the past 7 days to maintain accountability.
          </p>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: 7-Day List */}
        <div className="space-y-3">
          <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-1">
            Select Archive Day
          </span>
          <div className="space-y-2">
            {pastDaysOffsets.map((offset) => {
              const date = getDateForOffset(offset);
              const dayGoals = getGoalsForDate(date);
              const completedCount = dayGoals.filter((g) => isGoalCompletedOnDate(g, date)).length;
              const totalCount = dayGoals.length;
              const isSelected = selectedDayOffset === offset;

              // Color badge calculation based on completion rate
              const rate = totalCount > 0 ? completedCount / totalCount : 0;
              let completionColor = "text-neutral-500 bg-neutral-900/50 border border-neutral-850";
              if (totalCount > 0) {
                if (rate === 1) completionColor = "text-emerald-400 bg-emerald-950/20 border border-emerald-900/30";
                else if (rate >= 0.5) completionColor = "text-brand-yellow bg-brand-yellow/10 border border-brand-yellow/20";
                else completionColor = "text-rose-400 bg-rose-950/20 border border-rose-900/30";
              }

              return (
                <button
                  key={offset}
                  onClick={() => setSelectedDayOffset(offset)}
                  className={`w-full text-left p-3.5 rounded-xl transition-all cursor-pointer flex items-center justify-between border ${
                    isSelected
                      ? "bg-neutral-850 border-brand-yellow shadow-md shadow-brand-yellow/5"
                      : "bg-neutral-900/60 border-neutral-900 hover:bg-neutral-900"
                  }`}
                >
                  <div>
                    <span className={`text-sm font-bold block ${isSelected ? "text-white" : "text-neutral-300"}`}>
                      {formatDayName(offset, date)}
                    </span>
                    <span className="text-xs text-neutral-500 font-medium">
                      {date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <div className={`px-2.5 py-1 rounded-lg text-xs font-bold ${completionColor}`}>
                    {completedCount} / {totalCount}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Day Details */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-panel p-6 rounded-2xl space-y-6">
            <div>
              <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1">
                Selected Day Checklist
              </span>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand-yellow" />
                {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
              </h3>
            </div>

            {activeGoals.length === 0 ? (
              <p className="text-sm text-neutral-500 text-center py-10">
                No active quests tracked for this date.
              </p>
            ) : (
              <div className="space-y-6">
                {/* Completed Section */}
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold text-emerald-500 uppercase tracking-widest flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Completed Quests ({completedGoals.length})
                  </h4>
                  {completedGoals.length === 0 ? (
                    <p className="text-xs text-neutral-500 italic pl-6">No quests completed on this day.</p>
                  ) : (
                    <div className="space-y-2">
                      {completedGoals.map((goal) => (
                        <div
                          key={goal.id}
                          className="flex items-center justify-between p-3.5 bg-emerald-950/5 border border-emerald-950/30 rounded-xl"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-emerald-500 text-sm">✓</span>
                            <div>
                              <span className="text-sm font-semibold text-neutral-200 block">
                                {goal.title}
                              </span>
                              <span className="text-[10px] text-neutral-500 font-semibold uppercase mt-0.5 block">
                                Completed log registered
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(goal.category)}
                            {getCategoryBadge(goal.category)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Left in Todo / Missed Section */}
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
                    <XCircle className="w-4 h-4 text-neutral-500" />
                    Left in To-do / Missed ({missedGoals.length})
                  </h4>
                  {missedGoals.length === 0 ? (
                    <p className="text-xs text-neutral-500 italic pl-6">Zero missed quests! perfect run.</p>
                  ) : (
                    <div className="space-y-2">
                      {missedGoals.map((goal) => (
                        <div
                          key={goal.id}
                          className="flex items-center justify-between p-3.5 bg-neutral-900/40 border border-neutral-900 rounded-xl"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-neutral-600 text-sm">✗</span>
                            <div>
                              <span className="text-sm font-semibold text-neutral-400 block line-through">
                                {goal.title}
                              </span>
                              <span className="text-[10px] text-neutral-600 font-semibold uppercase mt-0.5 block">
                                Uncompleted
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(goal.category)}
                            {getCategoryBadge(goal.category)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
