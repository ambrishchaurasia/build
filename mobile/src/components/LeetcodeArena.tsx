import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Modal } from "react-native";
import { CircleDot, Award, Flame, Trash2, PlusCircle } from "lucide-react-native";
import Svg, { Circle as SvgCircle } from "react-native-svg";
import * as Haptics from "expo-haptics";
import { dashboardApi } from "../services/dashboardApi";
import { isGoalActiveOnDate } from "../utils/dateUtils";

interface LeetcodeArenaProps {
  telemetry: any;
  goals: any[];
  insights: any[];
  onRefresh: () => Promise<void>;
}

export default function LeetcodeArena({ telemetry, goals, insights, onRefresh }: LeetcodeArenaProps) {
  const [addingGoal, setAddingGoal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [loading, setLoading] = useState(false);

  const codingGoals = goals.filter((g) => g.category === "CODING" && isGoalActiveOnDate(g, new Date()));
  const codingInsight = insights.find((i) => i.agentType === "CODING");
  const leetcode = telemetry?.leetcode || { totalSolved: 0, easySolved: 0, mediumSolved: 0, hardSolved: 0, contestRating: 0, ranking: 0 };

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
        category: "CODING",
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

  // Circular progress calculations
  const totalTarget = 300;
  const solvedPercent = Math.min(100, Math.round((leetcode.totalSolved / totalTarget) * 100));

  // Svg circular values
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * solvedPercent) / 100;

  const getLocalTip = () => {
    const uncompleted = codingGoals.filter(
      (goal) => !(goal.lastCompleted && new Date(goal.lastCompleted).toDateString() === new Date().toDateString())
    );

    const pool = [
      "Daily LeetCode practice builds muscle memory, making complex algorithms feel intuitive and easy over time.",
      "If you get stuck on a problem for more than 30 minutes, read the editorial. Learning the pattern is what matters.",
      "Write your code on paper first. It forces you to trace execution mentally and prevents bugs.",
      "Solve one problem daily. Consistent small inputs build massive problem-solving confidence.",
      "Mastering patterns (like Two Pointers or Sliding Window) is infinitely better than memorizing individual solutions."
    ];
    const dayIndex = new Date().getDate();
    const fact = pool[dayIndex % pool.length];

    if (uncompleted.length === 0) {
      if (codingGoals.length > 0) {
        return `All coding quests completed! ${fact}`;
      }
      return `No coding quests active. Add one above! ${fact}`;
    }

    // Check for specific keywords
    const hasPotd = uncompleted.some((g) => g.title.toLowerCase().includes("potd") || g.title.toLowerCase().includes("problem of the day"));
    if (hasPotd) {
      return `Complete your Problem of the Day (POTD)! ${fact}`;
    }

    const firstQuest = uncompleted[0].title;
    return `Focus: "${firstQuest}". ${fact}`;
  };

  return (
    <View className="flex-col gap-6">
      
      {/* Header banner */}
      <View style={{ backgroundColor: "#98FB98" }} className="flex-col p-4 rounded-2xl">
        <View className="flex-row justify-between items-baseline mb-1.5">
          <Text className="text-[10px] font-bold text-white/80 uppercase tracking-widest">
            DSA Track Target: {totalTarget} Problems
          </Text>
        </View>
        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center gap-2">
            <Text className="text-2xl font-black text-white uppercase tracking-tight">
              LEETCODE ARENA
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setAddingGoal(true)}
            className="flex-row items-center gap-1.5 bg-neutral-950 px-3 py-1.5 rounded-xl border border-neutral-850"
          >
            <PlusCircle color="#98FB98" size={12} />
            <Text className="text-[9px] text-white font-bold uppercase tracking-wider">New Quest</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 1st: Daily Coding Quests */}
      <View className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl flex-col gap-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-1.5">
            <Flame color="#98FB98" size={18} />
            <Text className="text-sm font-bold text-white uppercase tracking-tight">Daily Coding Quests</Text>
          </View>
        </View>

        <View className="flex-col gap-2.5">
          {codingGoals.length === 0 ? (
            <Text className="text-xs text-neutral-500 py-4 text-center font-medium">No coding quests added. Tapping "New Quest" in the banner above spawns one!</Text>
          ) : (
            codingGoals.map((goal) => {
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
                          ? "bg-brand-yellow/20 border-brand-yellow"
                          : "border-neutral-700"
                      }`}
                    >
                      {todayCompleted ? <Text className="text-brand-yellow font-bold text-xs">✓</Text> : null}
                    </View>
                    
                    <View className="flex-1">
                      <Text className={`text-sm font-semibold ${todayCompleted ? "text-neutral-500 line-through" : "text-white"}`}>
                        {goal.title}
                      </Text>
                      <Text className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider mt-0.5">
                        {goal.frequency}{goal.title.toLowerCase().includes("potd") && ` • ${goal.currentStreak} Day Streak 🔥`}
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

      {/* 2nd: DSA Solved Volume */}
      <View className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl flex-row justify-between items-center">
        <View className="flex-1">
          <Text className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">
            DSA Solved Volume
          </Text>
          <View className="flex-row items-baseline">
            <Text className="text-3xl font-black text-white">{leetcode.totalSolved}</Text>
            <Text className="text-xs text-neutral-500 font-normal ml-1">/ {totalTarget}</Text>
          </View>

          <View className="mt-3 flex-col gap-1 w-28">
            <View className="flex-row justify-between text-xs">
              <Text className="text-emerald-500 font-bold text-[11px]">Easy</Text>
              <Text className="font-bold text-white text-[11px]">{leetcode.easySolved}</Text>
            </View>
            <View className="flex-row justify-between text-xs">
              <Text className="text-amber-500 font-bold text-[11px]">Medium</Text>
              <Text className="font-bold text-white text-[11px]">{leetcode.mediumSolved}</Text>
            </View>
            <View className="flex-row justify-between text-xs">
              <Text className="text-rose-500 font-bold text-[11px]">Hard</Text>
              <Text className="font-bold text-white text-[11px]">{leetcode.hardSolved}</Text>
            </View>
          </View>
        </View>

        {/* SVG Circular Ring */}
        <View className="relative w-24 h-24 items-center justify-center">
          <View className="transform -rotate-90">
            <Svg width="96" height="96" viewBox="0 0 100 100">
              <SvgCircle
                cx="50"
                cy="50"
                r={radius}
                stroke="rgba(255,255,255,0.03)"
                strokeWidth="8"
                fill="transparent"
              />
              <SvgCircle
                cx="50"
                cy="50"
                r={radius}
                stroke="#98FB98"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
              />
            </Svg>
          </View>
          <View className="absolute items-center justify-center">
            <Text className="text-lg font-black text-white">{solvedPercent}%</Text>
            <Text className="text-[8px] text-neutral-500 uppercase tracking-widest mt-0.5 font-bold">Ready</Text>
          </View>
        </View>
      </View>

      {/* Subtle advisor suggestion foot banner */}
      <View className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl flex-row items-center justify-between gap-3">
        <View className="flex-row items-center flex-1 gap-2">
          <View className="px-1.5 py-0.5 bg-brand-yellow/10 border border-brand-yellow/30 rounded">
            <Text className="text-brand-yellow text-[8px] font-black uppercase tracking-widest">Tip</Text>
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
              <Text className="text-base font-black text-white uppercase tracking-tight">Spawn Coding Quest</Text>
              <TouchableOpacity
                onPress={() => setAddingGoal(false)}
                className="px-3 py-1 bg-neutral-900 border border-neutral-850 rounded-xl"
              >
                <Text className="text-neutral-400 text-xs font-bold">Close</Text>
              </TouchableOpacity>
            </View>

            {/* Input field */}
            <View className="mb-6">
              <Text className="text-xs font-bold text-neutral-450 uppercase mb-2">Quest Title</Text>
              <TextInput
                value={newGoalTitle}
                onChangeText={setNewGoalTitle}
                placeholder="e.g. Solve 3 Binary Trees or POTD"
                placeholderTextColor="#525252"
                className="w-full px-4.5 py-4 bg-neutral-900 border border-neutral-800 rounded-xl text-white text-sm font-semibold"
                autoFocus
              />
            </View>

            {/* Submit button */}
            <TouchableOpacity
              onPress={handleAddGoal}
              disabled={loading || !newGoalTitle.trim()}
              className="w-full py-3.5 bg-brand-yellow rounded-xl items-center justify-center"
            >
              {loading ? (
                <ActivityIndicator color="#0a0a0a" size="small" />
              ) : (
                <Text className="text-neutral-950 font-black text-sm uppercase tracking-wider">Initialize Quest</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}
