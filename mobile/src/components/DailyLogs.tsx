import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { History, Calendar, CheckCircle2, XCircle, Activity, GitBranch, CircleDot, ShieldCheck } from "lucide-react-native";
import { isGoalActiveOnDate, isGoalCompletedOnDate } from "../utils/dateUtils";

interface DailyLogsProps {
  goals: any[];
  onRefresh: () => Promise<void>;
}

export default function DailyLogs({ goals }: DailyLogsProps) {
  const [selectedDayOffset, setSelectedDayOffset] = useState<number>(1); // Yesterday

  // Generate date object for a given day offset
  const getDateForOffset = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() - offset);
    return d;
  };

  const pastDaysOffsets = Array.from({ length: 7 }, (_, i) => i + 1);

  const getGoalsForDate = (date: Date) => {
    return goals.filter((g) => isGoalActiveOnDate(g, date));
  };

  const formatDayName = (offset: number, date: Date) => {
    if (offset === 1) return "Yesterday";
    return date.toLocaleDateString("en-US", { weekday: "long" });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "CODING":
        return <CircleDot color="#98FB98" size={14} />;
      case "PROJECT":
        return <GitBranch color="#6495ED" size={14} />;
      case "FITNESS_MIND":
        return <Activity color="#00D084" size={14} />;
      case "HABIT":
        return <ShieldCheck color="#FF840D" size={14} />;
      default:
        return null;
    }
  };

  const getCategoryBadge = (category: string) => {
    let color = "text-brand-yellow";
    let bg = "bg-brand-yellow/10 border-brand-yellow/30";
    let label = "Coding";

    if (category === "PROJECT") {
      color = "text-brand-cyan";
      bg = "bg-brand-cyan/10 border-brand-cyan/30";
      label = "Projects";
    } else if (category === "FITNESS_MIND") {
      color = "text-brand-purple";
      bg = "bg-brand-purple/10 border-brand-purple/30";
      label = "Fitness";
    } else if (category === "HABIT") {
      color = "text-brand-pink";
      bg = "bg-brand-pink/10 border-brand-pink/30";
      label = "Habit";
    }

    return (
      <View className={`px-2 py-0.5 rounded border ${bg}`}>
        <Text className={`${color} text-[8px] font-black uppercase tracking-wider`}>{label}</Text>
      </View>
    );
  };

  const selectedDate = getDateForOffset(selectedDayOffset);
  const activeGoals = getGoalsForDate(selectedDate);
  const completedGoals = activeGoals.filter((g) => isGoalCompletedOnDate(g, selectedDate));
  const missedGoals = activeGoals.filter((g) => !isGoalCompletedOnDate(g, selectedDate));

  return (
    <View className="flex-col gap-6">
      
      {/* Header Banner */}
      <View style={{ backgroundColor: "#98FB98" }} className="flex-col p-5 rounded-2xl">
        <View className="flex-row items-center gap-2">
          <History color="#ffffff" size={24} />
          <Text className="text-xl font-black text-white uppercase tracking-tight">Daily History Log</Text>
        </View>
        <Text className="text-xs text-white/80 mt-1">
          Review completed and missed routines from the past 7 days to maintain accountability.
        </Text>
      </View>

      {/* 7-Day List (Horizontal Scroll on Mobile) */}
      <View className="flex-col gap-2">
        <Text className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1 pl-1">
          Select Archive Day
        </Text>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mb-1">
          {pastDaysOffsets.map((offset) => {
            const date = getDateForOffset(offset);
            const dayGoals = getGoalsForDate(date);
            const completedCount = dayGoals.filter((g) => isGoalCompletedOnDate(g, date)).length;
            const totalCount = dayGoals.length;
            const isSelected = selectedDayOffset === offset;

            // Color badge calculation based on completion rate
            const rate = totalCount > 0 ? completedCount / totalCount : 0;
            let completionColor = "text-neutral-500 bg-neutral-950/40 border border-neutral-900";
            if (totalCount > 0) {
              if (rate === 1) completionColor = "text-emerald-400 bg-emerald-950/20 border border-emerald-900/30";
              else if (rate >= 0.5) completionColor = "text-brand-yellow bg-brand-yellow/10 border border-brand-yellow/20";
              else completionColor = "text-rose-400 bg-rose-950/20 border border-rose-900/30";
            }

            return (
              <TouchableOpacity
                key={offset}
                onPress={() => setSelectedDayOffset(offset)}
                className={`p-3.5 rounded-xl border flex-row items-center gap-4 mr-2 ${
                  isSelected
                    ? "bg-neutral-850 border-brand-yellow"
                    : "bg-neutral-900 border-neutral-800"
                }`}
              >
                <View>
                  <Text className={`text-sm font-bold ${isSelected ? "text-white" : "text-neutral-300"}`}>
                    {formatDayName(offset, date)}
                  </Text>
                  <Text className="text-[10px] text-neutral-550 mt-0.5">
                    {date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </Text>
                </View>
                <View className={`px-2.5 py-1 rounded-lg border ${completionColor}`}>
                  <Text className="text-[10px] font-bold text-center">{completedCount}/{totalCount}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Day Details Card */}
      <View className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl flex-col gap-6">
        <View>
          <Text className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">
            Selected Day Checklist
          </Text>
          <View className="flex-row items-center gap-2">
            <Calendar color="#98FB98" size={16} />
            <Text className="text-sm font-bold text-white leading-relaxed">
              {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </Text>
          </View>
        </View>

        {activeGoals.length === 0 ? (
          <Text className="text-xs text-neutral-500 text-center py-10">
            No active quests tracked for this date.
          </Text>
        ) : (
          <View className="flex-col gap-6">
            
            {/* Completed Section */}
            <View className="flex-col gap-3">
              <View className="flex-row items-center gap-1.5">
                <CheckCircle2 color="#22c55e" size={14} />
                <Text className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                  Completed Quests ({completedGoals.length})
                </Text>
              </View>
              
              {completedGoals.length === 0 ? (
                <Text className="text-xs text-neutral-500 pl-6 italic">No quests completed on this day.</Text>
              ) : (
                <View className="flex-col gap-2">
                  {completedGoals.map((goal) => (
                    <View
                      key={goal.id}
                      className="flex-row items-center justify-between p-3.5 bg-emerald-950/5 border border-emerald-950/20 rounded-xl"
                    >
                      <View className="flex-row items-center gap-3">
                        <Text className="text-emerald-500 text-sm font-bold">✓</Text>
                        <View>
                          <Text className="text-sm font-semibold text-neutral-200">{goal.title.replace(/^\[(Mind|Fitness)\]\s*/i, "")}</Text>
                          <Text className="text-[9px] text-neutral-550 mt-0.5">Completed log registered</Text>
                        </View>
                      </View>
                      <View className="flex-row items-center gap-2">
                        {getCategoryIcon(goal.category)}
                        {getCategoryBadge(goal.category)}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Missed Section */}
            <View className="flex-col gap-3">
              <View className="flex-row items-center gap-1.5">
                <XCircle color="#737373" size={14} />
                <Text className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                  Left in To-do / Missed ({missedGoals.length})
                </Text>
              </View>
              
              {missedGoals.length === 0 ? (
                <Text className="text-xs text-neutral-500 pl-6 check-run italic">Zero missed quests! perfect run.</Text>
              ) : (
                <View className="flex-col gap-2">
                  {missedGoals.map((goal) => (
                    <View
                      key={goal.id}
                      className="flex-row items-center justify-between p-3.5 bg-neutral-950/40 border border-neutral-900 rounded-xl"
                    >
                      <View className="flex-row items-center gap-3">
                        <Text className="text-neutral-500 text-sm font-bold">✗</Text>
                        <View>
                          <Text className="text-sm font-semibold text-neutral-500 line-through">{goal.title.replace(/^\[(Mind|Fitness)\]\s*/i, "")}</Text>
                          <Text className="text-[9px] text-neutral-550 mt-0.5">Uncompleted</Text>
                        </View>
                      </View>
                      <View className="flex-row items-center gap-2">
                        {getCategoryIcon(goal.category)}
                        {getCategoryBadge(goal.category)}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

          </View>
        )}
      </View>

    </View>
  );
}
