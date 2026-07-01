import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Modal } from "react-native";
import { GitBranch, Flame, Trash2, PlusCircle } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { dashboardApi } from "../services/dashboardApi";
import { isGoalActiveOnDate } from "../utils/dateUtils";

interface ProjectsArenaProps {
  telemetry: any;
  goals: any[];
  insights: any[];
  onRefresh: () => Promise<void>;
}

export default function ProjectsArena({ telemetry, goals, insights, onRefresh }: ProjectsArenaProps) {
  const [addingGoal, setAddingGoal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [loading, setLoading] = useState(false);

  const projectGoals = goals.filter((g) => g.category === "PROJECT" && isGoalActiveOnDate(g, new Date()));
  const projectInsight = insights.find((i) => i.agentType === "PROJECT");
  const github = telemetry?.github || { totalRepos: 0, activeRepos: 0, commitsLast30Days: 0, pullRequests: 0, contributions: 0 };

  const getLocalTip = () => {
    const uncompleted = projectGoals.filter(
      (goal) => !(goal.lastCompleted && new Date(goal.lastCompleted).toDateString() === new Date().toDateString())
    );

    const pool = [
      "Shipping a small feature daily compounds. 1 commit a day builds complete production software in months.",
      "Just ship it! Perfect is the enemy of shipped. Get feedback early and iterate.",
      "Plan less, code more. Real understanding comes from breaking things and building them back up.",
      "Break large features into tiny pull requests. Small changes are easy to test and deploy.",
      "Write clean code, but don't over-engineer. Solve the problem you have today, not the one you might have tomorrow."
    ];
    const dayIndex = new Date().getDate();
    const fact = pool[dayIndex % pool.length];

    if (uncompleted.length === 0) {
      if (projectGoals.length > 0) {
        return `All project tasks completed!`;
      }
      return `No project tasks active. Add one above!`;
    }

    const firstQuest = uncompleted[0].title;
    return `Next milestone: "${firstQuest}". ${fact}`;
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
        category: "PROJECT",
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

  // Generate mock contribution calendar (12 weeks, 7 days a week)
  const renderContributionGrid = () => {
    const weeks = 12;
    const days = 7;
    const grid = [];

    // Deterministic cyan contribution shading based on mock commits count
    for (let w = 0; w < weeks; w++) {
      const weekCols = [];
      for (let d = 0; d < days; d++) {
        const index = w * 7 + d;
        let color = "bg-neutral-900"; // default empty
        if (github.commitsLast30Days > 0) {
          const mod = index % 5;
          if (mod === 1) color = "bg-cyan-950";
          else if (mod === 2) color = "bg-cyan-900";
          else if (mod === 3) color = "bg-cyan-700";
          else if (mod === 4 && w > 4) color = "bg-brand-cyan";
        }
        weekCols.push(
          <View
            key={d}
            className={`w-3.5 h-3.5 rounded-sm ${color} mb-1`}
          />
        );
      }
      grid.push(
        <View key={w} className="flex-col mr-1">
          {weekCols}
        </View>
      );
    }

    return grid;
  };

  return (
    <View className="flex-col gap-6">
      
      {/* Header banner */}
      <View style={{ backgroundColor: "#6495ED" }} className="flex-col p-4 rounded-2xl">
        <View className="flex-row justify-between items-baseline mb-1.5">
          <Text className="text-[10px] font-bold text-white/80 uppercase tracking-widest">
            Portfolio & Repository Track
          </Text>
        </View>
        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center gap-2">
            <Text className="text-2xl font-black text-white uppercase tracking-tight">
              PROJECTS ARENA
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setAddingGoal(true)}
            className="flex-row items-center gap-1.5 bg-neutral-950 px-3 py-1.5 rounded-xl border border-neutral-850"
          >
            <PlusCircle color="#6495ED" size={12} />
            <Text className="text-[9px] text-white font-bold uppercase tracking-wider">New Quest</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Daily Project Quests */}
      <View className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl flex-col gap-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-1.5">
            <Flame color="#6495ED" size={18} />
            <Text className="text-sm font-bold text-white uppercase tracking-tight">Active Project Quests</Text>
          </View>
        </View>

        <View className="flex-col gap-2.5">
          {projectGoals.length === 0 ? (
            <Text className="text-xs text-neutral-500 py-4 text-center font-medium">No project quests active. Tapping "New Quest" in the banner above spawns one!</Text>
          ) : (
            projectGoals.map((goal) => {
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
                          ? "bg-brand-cyan/20 border-brand-cyan"
                          : "border-neutral-700"
                      }`}
                    >
                      {todayCompleted ? <Text className="text-brand-cyan font-bold text-xs">✓</Text> : null}
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

      {/* Commit heatmap calendar */}
      <View className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl flex-col gap-4">
        <View>
          <Text className="text-sm font-bold text-white uppercase tracking-tight">Commit Contribution Heatmap</Text>
          <Text className="text-xs text-neutral-400 mt-0.5">
            Consistency grid of repository pushes and branch updates over the last 12 weeks.
          </Text>
        </View>
        
        {/* Render grid inside horizontally scrollable view */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row py-2">
          {renderContributionGrid()}
        </ScrollView>

        <View className="flex-row justify-between items-center text-[10px] text-neutral-500 uppercase font-semibold">
          <Text className="text-[10px] text-neutral-500 font-bold">12 Weeks Ago</Text>
          <View className="flex-row items-center gap-1">
            <Text className="text-[10px] text-neutral-500 mr-1">Less</Text>
            <View className="w-2.5 h-2.5 bg-neutral-950 border border-neutral-900 rounded-sm" />
            <View className="w-2.5 h-2.5 bg-cyan-950 rounded-sm" />
            <View className="w-2.5 h-2.5 bg-cyan-900 rounded-sm" />
            <View className="w-2.5 h-2.5 bg-cyan-700 rounded-sm" />
            <View className="w-2.5 h-2.5 bg-brand-cyan rounded-sm" />
            <Text className="text-[10px] text-neutral-500 ml-1">More</Text>
          </View>
          <Text className="text-[10px] text-neutral-500 font-bold">Today</Text>
        </View>
      </View>

      {/* Subtle advisor suggestion foot banner */}
      <View className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl flex-row items-center justify-between gap-3">
        <View className="flex-row items-center flex-1 gap-2">
          <View className="px-1.5 py-0.5 bg-brand-cyan/10 border border-brand-cyan/30 rounded">
            <Text className="text-brand-cyan text-[8px] font-black uppercase tracking-widest">Tip</Text>
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
              <Text className="text-base font-black text-white uppercase tracking-tight">Spawn Project Quest</Text>
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
                placeholder="e.g. Deploy backend to Render"
                placeholderTextColor="#525252"
                className="w-full px-4.5 py-4 bg-neutral-900 border border-neutral-800 rounded-xl text-white text-sm font-semibold"
                autoFocus
              />
            </View>

            {/* Submit button */}
            <TouchableOpacity
              onPress={handleAddGoal}
              disabled={loading || !newGoalTitle.trim()}
              className="w-full py-3.5 bg-brand-cyan rounded-xl items-center justify-center"
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
