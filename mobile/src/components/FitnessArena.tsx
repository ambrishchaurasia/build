import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Modal } from "react-native";
import { Flame, Trash2, PlusCircle, Activity, Brain, Dumbbell } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { dashboardApi } from "../services/dashboardApi";
import { isGoalActiveOnDate } from "../utils/dateUtils";

interface FitnessArenaProps {
  telemetry: any;
  goals: any[];
  insights: any[];
  onRefresh: () => Promise<void>;
}

export default function FitnessArena({ telemetry, goals, insights, onRefresh }: FitnessArenaProps) {
  const [addingGoal, setAddingGoal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newQuestType, setNewQuestType] = useState<"MIND" | "FITNESS">("FITNESS");
  const [loading, setLoading] = useState(false);

  const isMindQuest = (title: string) => {
    const t = title.toLowerCase();
    if (title.startsWith("[Mind]")) return true;
    if (title.startsWith("[Fitness]")) return false;
    return (
      t.includes("meditate") ||
      t.includes("meditation") ||
      t.includes("ganesh") ||
      t.includes("mind") ||
      t.includes("breath") ||
      t.includes("focus") ||
      t.includes("read") ||
      t.includes("study") ||
      t.includes("learn") ||
      t.includes("brain") ||
      t.includes("think") ||
      t.includes("journal") ||
      t.includes("pray") ||
      t.includes("chant") ||
      t.includes("silence") ||
      t.includes("reflect") ||
      t.includes("mental") ||
      t.includes("calm") ||
      t.includes("peace") ||
      t.includes("yoga")
    );
  };

  const fitnessGoals = goals.filter((g) => g.category === "FITNESS_MIND" && isGoalActiveOnDate(g, new Date()));
  const mindQuests = fitnessGoals.filter((g) => isMindQuest(g.title));
  const coreFitnessQuests = fitnessGoals.filter((g) => !isMindQuest(g.title));
  const fitnessInsight = insights?.find((i) => i.agentType === "FITNESS");

  const getLocalTip = () => {
    // Combine mind and body quests
    const activeQuests = [...mindQuests, ...coreFitnessQuests];
    const uncompleted = activeQuests.filter(
      (goal) => !(goal.lastCompleted && new Date(goal.lastCompleted).toDateString() === new Date().toDateString())
    );

    const pool = [
      "Doing just 10 pull-ups daily builds shoulder stability, core strength, and spinal decompression over time.",
      "Go out for a run! Even a 10-minute jog increases cardiovascular endurance and clears mental clutter.",
      "Hydrate before you feel thirsty. Muscle performance drops by 10% with even minor dehydration.",
      "Rest is part of training. Ensure 7-8 hours of sleep to let muscle tissue repair and rebuild.",
      "Physical action drives cognitive clarity. Sweat daily to keep your mind sharp."
    ];
    const dayIndex = new Date().getDate();
    const fact = pool[dayIndex % pool.length];

    if (uncompleted.length === 0) {
      if (activeQuests.length > 0) {
        return `All physical and mental quests completed! ${fact}`;
      }
      return `No fitness quests active today. Add a target above! ${fact}`;
    }

    const firstQuest = uncompleted[0].title.replace(/^\[(Mind|Fitness)\]\s*/i, "");
    return `Let's get it done! Focus: "${firstQuest}". ${fact}`;
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
      const finalTitle = newQuestType === "MIND"
        ? `[Mind] ${newGoalTitle.trim()}`
        : `[Fitness] ${newGoalTitle.trim()}`;
      await dashboardApi.createGoal({
        category: "FITNESS_MIND",
        title: finalTitle,
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

  return (
    <View className="flex-col gap-6">
      
      {/* Header banner */}
      <View style={{ backgroundColor: "#00D084" }} className="flex-col p-4 rounded-2xl">
        <View className="flex-row justify-between items-baseline mb-1.5">
          <Text className="text-[10px] font-bold text-white/80 uppercase tracking-widest">
            Cognitive & Body stamina track
          </Text>
        </View>
        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center gap-2">
            <Text className="text-2xl font-black text-white uppercase tracking-tight">
              FITNESS ARENA
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setAddingGoal(true)}
            className="flex-row items-center gap-1.5 bg-neutral-950 px-3 py-1.5 rounded-xl border border-neutral-850"
          >
            <PlusCircle color="#00D084" size={12} />
            <Text className="text-[9px] text-white font-bold uppercase tracking-wider">New Quest</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Mind Quests Section */}
      <View className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl flex-col gap-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-1.5">
            <Brain color="#00D084" size={18} />
            <Text className="text-sm font-bold text-white uppercase tracking-tight">Mind Quests</Text>
          </View>
        </View>

        <View className="flex-col gap-2.5">
          {mindQuests.length === 0 ? (
            <Text className="text-xs text-neutral-500 py-4 text-center font-medium">No mind quests active. Tapping "New Quest" in the banner above spawns one!</Text>
          ) : (
            mindQuests.map((goal) => {
              const todayCompleted = goal.lastCompleted && new Date(goal.lastCompleted).toDateString() === new Date().toDateString();
              const displayTitle = goal.title.replace(/^\[(Mind|Fitness)\]\s*/i, "");
              
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
                          ? "bg-brand-purple/20 border-brand-purple"
                          : "border-neutral-700"
                      }`}
                    >
                      {todayCompleted ? <Text className="text-brand-purple font-bold text-xs">✓</Text> : null}
                    </View>
                    
                    <View className="flex-1">
                      <Text className={`text-sm font-semibold ${todayCompleted ? "text-neutral-500 line-through" : "text-white"}`}>
                        {displayTitle}
                      </Text>
                      <Text className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider mt-0.5">
                        {goal.frequency} • {goal.currentStreak} Day Streak 🔥
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

      {/* Fitness Quests Section */}
      <View className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl flex-col gap-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-1.5">
            <Dumbbell color="#00D084" size={18} />
            <Text className="text-sm font-bold text-white uppercase tracking-tight">Fitness Quests</Text>
          </View>
        </View>

        <View className="flex-col gap-2.5">
          {coreFitnessQuests.length === 0 ? (
            <Text className="text-xs text-neutral-500 py-4 text-center font-medium">No fitness quests active. Tapping "New Quest" in the banner above spawns one!</Text>
          ) : (
            coreFitnessQuests.map((goal) => {
              const todayCompleted = goal.lastCompleted && new Date(goal.lastCompleted).toDateString() === new Date().toDateString();
              const displayTitle = goal.title.replace(/^\[(Mind|Fitness)\]\s*/i, "");
              
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
                          ? "bg-brand-purple/20 border-brand-purple"
                          : "border-neutral-700"
                      }`}
                    >
                      {todayCompleted ? <Text className="text-brand-purple font-bold text-xs">✓</Text> : null}
                    </View>
                    
                    <View className="flex-1">
                      <Text className={`text-sm font-semibold ${todayCompleted ? "text-neutral-500 line-through" : "text-white"}`}>
                        {displayTitle}
                      </Text>
                      <Text className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider mt-0.5">
                        {goal.frequency} • {goal.currentStreak} Day Streak 🔥
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



      {/* Subtle advisor suggestion foot banner */}
      <View className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl flex-row items-center justify-between gap-3">
        <View className="flex-row items-center flex-1 gap-2">
          <View className="px-1.5 py-0.5 bg-brand-purple/10 border border-brand-purple/30 rounded">
            <Text className="text-brand-purple text-[8px] font-black uppercase tracking-widest">Tip</Text>
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
              <Text className="text-base font-black text-white uppercase tracking-tight">Spawn Fitness/Mind Quest</Text>
              <TouchableOpacity
                onPress={() => setAddingGoal(false)}
                className="px-3 py-1 bg-neutral-900 border border-neutral-850 rounded-xl"
              >
                <Text className="text-neutral-400 text-xs font-bold">Close</Text>
              </TouchableOpacity>
            </View>

            {/* Input field */}
            <View className="mb-5">
              <Text className="text-xs font-bold text-neutral-450 uppercase mb-2">Quest Title</Text>
              <TextInput
                value={newGoalTitle}
                onChangeText={setNewGoalTitle}
                placeholder="e.g. 50 pullups or 15 mins meditation"
                placeholderTextColor="#525252"
                className="w-full px-4.5 py-4 bg-neutral-900 border border-neutral-800 rounded-xl text-white text-sm font-semibold"
                autoFocus
              />
            </View>

            {/* Quest Type selector */}
            <View className="mb-6">
              <Text className="text-xs font-semibold text-neutral-450 uppercase mb-2.5">Track Category</Text>
              <View className="flex-row gap-2">
                {[
                  { name: "Fitness (Body)", category: "FITNESS", color: "#00D084" },
                  { name: "Mind (Focus)", category: "MIND", color: "#8b5cf6" }
                ].map((item) => (
                  <TouchableOpacity
                    key={item.category}
                    onPress={() => setNewQuestType(item.category as any)}
                    className={`px-3.5 py-2.5 rounded-xl border flex-row items-center gap-1.5 flex-1 justify-center ${
                      newQuestType === item.category 
                        ? "bg-neutral-900 border-neutral-700" 
                        : "bg-neutral-950 border-neutral-900"
                    }`}
                  >
                    <View className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <Text className={`text-xs font-bold ${
                      newQuestType === item.category ? "text-white" : "text-neutral-500"
                    }`}>{item.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Submit button */}
            <TouchableOpacity
              onPress={handleAddGoal}
              disabled={loading || !newGoalTitle.trim()}
              className="w-full py-3.5 bg-brand-purple rounded-xl items-center justify-center"
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
