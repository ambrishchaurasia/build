import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Modal } from "react-native";
import { Sparkles, Trash2, PlusCircle, Calendar, ShieldCheck } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { dashboardApi } from "../services/dashboardApi";
import { isGoalActiveOnDate } from "../utils/dateUtils";

interface HabitsArenaProps {
  telemetry: any;
  goals: any[];
  insights?: any[];
  onRefresh: () => Promise<void>;
}

export default function HabitsArena({ telemetry, goals, insights = [], onRefresh }: HabitsArenaProps) {
  const [addingGoal, setAddingGoal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [loading, setLoading] = useState(false);

  const habitGoals = goals.filter((g) => g.category === "HABIT" && isGoalActiveOnDate(g, new Date()));
  const habitsScore = telemetry?.scores?.habitsScore || 0;

  const habitInsight = insights.find((i) => i.agentType === "HABIT");
  const recommendation = habitInsight?.recommendation || "Eliminating constant short-term dopamine spikes triggers neuroplastic recovery, directly improving attention span, logic execution, and retention capacity.";

  const getLocalTip = () => {
    const uncompleted = habitGoals.filter(
      (goal) => !(goal.lastCompleted && new Date(goal.lastCompleted).toDateString() === new Date().toDateString())
    );

    const pool = [
      "Getting 1% better every day amounts to a 37.78x improvement in 365 days. Tiny changes compound massively.",
      "Stop biting your nails and replace nervous habits with conscious, deep breathing.",
      "Consistency beats intensity. A small daily routine maintained is better than a massive effort abandoned.",
      "It takes 21 days to build a habit and 90 days to build a lifestyle. Stick to it!",
      "Dopamine recovery starts with saying no to immediate gratification. Protect your focus."
    ];
    const dayIndex = new Date().getDate();
    const fact = pool[dayIndex % pool.length];

    if (uncompleted.length === 0) {
      if (habitGoals.length > 0) {
        return `All habits checked for today!`;
      }
      return `No active habits. Add one above!`;
    }

    const firstQuest = uncompleted[0].title;
    return `Don't break the chain for: "${firstQuest}". ${fact}`;
  };

  // Toggle Quest
  const handleToggle = async (goalId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    try {
      await dashboardApi.toggleGoal(goalId);
      await onRefresh();
    } catch (err) {
      console.error("Failed to complete quest", err);
    }
  };

  // Add Goal
  const handleAddGoal = async () => {
    if (!newGoalTitle.trim()) return;
    setLoading(true);
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
      console.error("Failed to create quest", err);
    } finally {
      setLoading(false);
    }
  };

  // Delete Goal
  const handleDeleteGoal = async (goalId: string) => {
    try {
      await dashboardApi.deleteGoal(goalId);
      await onRefresh();
    } catch (err) {
      console.error("Failed to delete quest", err);
    }
  };

  // Generate habit calendar for the last 28 days (4 weeks x 7 days)
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

      // Choose shade of brand-pink
      let color = "bg-neutral-950/40 border border-neutral-850/60";
      let textColor = "text-neutral-500";
      if (completedCount === 1) {
        color = "bg-brand-pink/20 border border-brand-pink/30";
        textColor = "text-white";
      } else if (completedCount === 2) {
        color = "bg-brand-pink/40 border border-brand-pink/50";
        textColor = "text-white";
      } else if (completedCount >= 3) {
        color = "bg-brand-pink border border-brand-pink";
        textColor = "text-white";
      }

      grid.push(
        <View
          key={i}
          className={`w-10 h-10 rounded-lg items-center justify-center ${color} mb-2`}
        >
          <Text className={`${textColor} text-[10px] font-bold`}>{targetDate.getDate()}</Text>
        </View>
      );
    }

    return grid;
  };

  return (
    <View className="flex-col gap-6">
      
      {/* Header banner */}
      <View style={{ backgroundColor: "#FF840D" }} className="flex-col p-4 rounded-2xl">
        <View className="flex-row justify-between items-baseline mb-1.5">
          <Text className="text-[10px] font-bold text-white/80 uppercase tracking-widest">
            Dopamine recovery & focus track
          </Text>
        </View>
        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center gap-2">
            <Text className="text-2xl font-black text-white uppercase tracking-tight">
              HABITS BOARD
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setAddingGoal(true)}
            className="flex-row items-center gap-1.5 bg-neutral-950 px-3 py-1.5 rounded-xl border border-neutral-850"
          >
            <PlusCircle color="#FF840D" size={12} />
            <Text className="text-[9px] text-white font-bold uppercase tracking-wider">New Quest</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Habit Quests Checklist */}
      <View className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl flex-col gap-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-1.5">
            <Sparkles color="#FF840D" size={18} />
            <Text className="text-sm font-bold text-white uppercase tracking-tight">Active Habits</Text>
          </View>
        </View>

        <View className="flex-col gap-2.5">
          {habitGoals.length === 0 ? (
            <Text className="text-xs text-neutral-500 py-4 text-center font-medium">No active habits. Tapping "New Quest" in the banner above spawns one!</Text>
          ) : (
            habitGoals.map((goal) => {
              const todayCompleted = goal.lastCompleted && new Date(goal.lastCompleted).toDateString() === new Date().toDateString();
              
              return (
                <View
                  key={goal.id}
                  className="flex-row items-center justify-between p-3.5 bg-neutral-950/40 border border-neutral-850/60 rounded-xl"
                >
                  <TouchableOpacity
                    onPress={() => handleToggle(goal.id)}
                    activeOpacity={0.7}
                    className="flex-row items-center flex-1 gap-3"
                  >
                    <View
                      className={`w-6 h-6 rounded-lg items-center justify-center border ${
                        todayCompleted
                          ? "bg-brand-pink/20 border-brand-pink"
                          : "border-neutral-700"
                      }`}
                    >
                      {todayCompleted ? <Text className="text-brand-pink font-bold text-xs">✓</Text> : null}
                    </View>
                    
                    <View className="flex-1">
                      <Text className={`text-sm font-semibold ${todayCompleted ? "text-neutral-500 line-through" : "text-white"}`}>
                        {goal.title}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleDeleteGoal(goal.id)}
                    className="p-1"
                  >
                    <Trash2 color="#737373" size={16} />
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>
      </View>

      {/* Habit Calendar Column (Discipline Heatmap) */}
      <View className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl flex-col gap-3">
        <View className="flex-row items-center gap-2 mb-1">
          <Calendar color="#FF840D" size={18} />
          <Text className="text-sm font-bold text-white uppercase tracking-tight">Discipline Heatmap (28 Days)</Text>
        </View>
        <Text className="text-xs text-neutral-400 leading-normal">
          Completing multiple daily habits increases the orange grid intensity.
        </Text>

        <View className="flex-col pt-2">
          {/* Headers */}
          <View className="flex-row justify-between mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <View key={day} className="w-10 items-center">
                <Text className="text-[10px] font-bold text-neutral-500 uppercase">{day}</Text>
              </View>
            ))}
          </View>

          {/* Grid */}
          <View className="flex-row flex-wrap justify-between">
            {renderHabitGrid()}
          </View>
        </View>
      </View>

      {/* Subtle advisor suggestion foot banner */}
      <View className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl flex-row items-center justify-between gap-3">
        <View className="flex-row items-center flex-1 gap-2">
          <View className="px-1.5 py-0.5 bg-brand-pink/10 border border-brand-pink/30 rounded">
            <Text className="text-brand-pink text-[8px] font-black uppercase tracking-widest">Tip</Text>
          </View>
          <Text className="text-neutral-300 text-xs font-semibold flex-1 leading-normal">
            {getLocalTip()}
          </Text>
        </View>
      </View>

      {/* Add Quest Modal Sheet */}
      <Modal
        visible={addingGoal}
        transparent
        animationType="slide"
        onRequestClose={() => setAddingGoal(false)}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <View className="w-full bg-neutral-950 border-t border-neutral-850 rounded-t-3xl p-6 pb-12">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-base font-black text-white uppercase tracking-tight">Spawn Habit</Text>
              <TouchableOpacity
                onPress={() => setAddingGoal(false)}
                className="px-3 py-1 bg-neutral-900 border border-neutral-850 rounded-xl"
              >
                <Text className="text-neutral-400 text-xs font-bold">Close</Text>
              </TouchableOpacity>
            </View>

            {/* Input field */}
            <View className="mb-6">
              <Text className="text-xs font-bold text-neutral-450 uppercase mb-2">Habit Name</Text>
              <TextInput
                value={newGoalTitle}
                onChangeText={setNewGoalTitle}
                placeholder="e.g. No Sugar or Sleep 8 Hours"
                placeholderTextColor="#525252"
                className="w-full px-4.5 py-4 bg-neutral-900 border border-neutral-800 rounded-xl text-white text-sm font-semibold"
                autoFocus
              />
            </View>

            {/* Submit button */}
            <TouchableOpacity
              onPress={handleAddGoal}
              disabled={loading || !newGoalTitle.trim()}
              className="w-full py-3.5 bg-brand-pink rounded-xl items-center justify-center"
            >
              {loading ? (
                <ActivityIndicator color="#0a0a0a" size="small" />
              ) : (
                <Text className="text-neutral-950 font-black text-sm uppercase tracking-wider">Initialize Habit</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}
