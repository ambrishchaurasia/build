import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert, Dimensions, Vibration, KeyboardAvoidingView, Platform } from "react-native";
import { 
  CircleDot, GitBranch, Activity, ShieldCheck, History, PlusCircle, 
  Calendar, Flame, Dumbbell, Heart, Brain, Pill, Coffee, Gamepad2, 
  BookOpen, Footprints, Moon, Check, Code, HelpCircle, Settings, CheckSquare
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { dashboardApi } from "../services/dashboardApi";
import { isGoalActiveOnDate, isGoalCompletedOnDate } from "../utils/dateUtils";
import OnboardingTour from "./OnboardingTour";

interface DailyTasksProps {
  goals: any[];
  onRefresh: () => Promise<void>;
}

export default function DailyTasks({ goals, onRefresh }: DailyTasksProps) {
  const [selectedDayOffset, setSelectedDayOffset] = useState<number>(0); // 0 = Today, 1 = Yesterday, etc.
  const [addingQuest, setAddingQuest] = useState(false);
  const [newQuestTitle, setNewQuestTitle] = useState("");
  const [newQuestCategory, setNewQuestCategory] = useState<"CODING" | "PROJECT" | "FITNESS_MIND" | "HABIT">("CODING");
  const [loading, setLoading] = useState(false);

  const screenWidth = Dimensions.get("window").width;
  const cardWidth = Math.floor((screenWidth - 32) / 3) - 0.5; // Math.floor prevents fractional width wrapping bugs in RN

  // Generate date object for a given day offset
  const getDateForOffset = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() - offset);
    return d;
  };

  // Helper to chunk array for row-based grid rendering
  const chunkArray = (arr: any[], size: number) => {
    const chunked = [];
    for (let i = 0; i < arr.length; i += size) {
      chunked.push(arr.slice(i, i + size));
    }
    return chunked;
  };

  const getGoalsForDate = (date: Date) => {
    return goals.filter((g) => isGoalActiveOnDate(g, date));
  };

  // Toggle Quest Completion
  const handleToggle = async (goal: any) => {
    // Subtle haptic impact feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    const selectedDate = getDateForOffset(selectedDayOffset);
    const isToday = selectedDayOffset === 0;

    // Standard API toggling works for Today
    if (isToday) {
      try {
        await dashboardApi.toggleGoal(goal.id);
        await onRefresh();
      } catch (err) {
        console.error("Failed to toggle goal", err);
      }
    } else {
      // For past days, the backend toggle API might still complete/incomplete based on current time
      // But we can let it toggle and refresh metrics
      try {
        await dashboardApi.toggleGoal(goal.id);
        await onRefresh();
      } catch (err) {
        console.error("Failed to toggle historical goal", err);
      }
    }
  };

  // Create Quest
  const handleAddQuest = async () => {
    if (!newQuestTitle.trim()) return;
    setLoading(true);
    try {
      await dashboardApi.createGoal({
        category: newQuestCategory,
        title: newQuestTitle,
        frequency: "DAILY"
      });
      setNewQuestTitle("");
      setAddingQuest(false);
      await onRefresh();
    } catch (err) {
      console.error("Failed to create quest", err);
    } finally {
      setLoading(false);
    }
  };

  // Delete Quest
  const handleDeleteQuest = (goalId: string) => {
    Alert.alert(
      "Abandon Quest",
      "Are you sure you want to delete this quest from your board?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Abandon", 
          style: "destructive",
          onPress: async () => {
            try {
              await dashboardApi.deleteGoal(goalId);
              await onRefresh();
            } catch (err) {
              console.error("Failed to delete goal", err);
            }
          }
        }
      ]
    );
  };

  // Selection dates values
  const selectedDate = getDateForOffset(selectedDayOffset);
  const activeQuests = getGoalsForDate(selectedDate);
  const completedCount = activeQuests.filter((g) => isGoalCompletedOnDate(g, selectedDate)).length;
  const totalCount = activeQuests.length;

  const getTaskPriorityRank = (title: string, category: string): number => {
    const t = title.toLowerCase();
    // 1. POTD, Coding, problem, etc.
    if (
      t.includes("potd") ||
      t.includes("code") ||
      t.includes("leetcode") ||
      t.includes("dsa") ||
      t.includes("problem") ||
      category === "CODING"
    ) {
      return 1;
    }
    // 2. Health, Mind, Meditate, Pullups, workout, gym, etc.
    if (
      t.includes("health") ||
      t.includes("mind") ||
      t.includes("meditate") ||
      t.includes("ganesh") ||
      t.includes("pullup") ||
      t.includes("gym") ||
      t.includes("workout") ||
      t.includes("fitness") ||
      category === "FITNESS_MIND"
    ) {
      return 2;
    }
    // 4. Anything that has "revise", "review", "recall"
    if (
      t.includes("revise") ||
      t.includes("review") ||
      t.includes("recall")
    ) {
      return 4;
    }
    // 3. General tasks
    return 3;
  };

  // Sort active goals: uncompleted first, completed last. Within each, order by default priority
  const sortedQuests = React.useMemo(() => {
    const uncompleted = activeQuests.filter(g => !isGoalCompletedOnDate(g, selectedDate));
    const completed = activeQuests.filter(g => isGoalCompletedOnDate(g, selectedDate));

    const sortGroup = (group: any[]) => {
      return [...group].sort((a, b) => {
        const rankA = getTaskPriorityRank(a.title, a.category);
        const rankB = getTaskPriorityRank(b.title, b.category);
        if (rankA !== rankB) {
          return rankA - rankB;
        }
        return a.title.localeCompare(b.title);
      });
    };

    return [...sortGroup(uncompleted), ...sortGroup(completed)];
  }, [activeQuests, selectedDate]);

  // Render Category Badge Color & Styling
  const getCategoryTheme = (category: string, completed: boolean) => {
    switch (category) {
      case "CODING":
        return {
          bg: completed ? "bg-brand-yellow/20 border-brand-yellow/30" : "bg-brand-yellow/10 border-brand-yellow/20",
          color: "#98FB98",
          text: "text-brand-yellow",
          border: "border-brand-yellow/30"
        };
      case "PROJECT":
        return {
          bg: completed ? "bg-brand-cyan/20 border-brand-cyan/30" : "bg-brand-cyan/10 border-brand-cyan/20",
          color: "#6495ED",
          text: "text-brand-cyan",
          border: "border-brand-cyan/30"
        };
      case "FITNESS_MIND":
        return {
          bg: completed ? "bg-brand-purple/20 border-brand-purple/30" : "bg-brand-purple/10 border-brand-purple/20",
          color: "#00D084",
          text: "text-brand-purple",
          border: "border-brand-purple/30"
        };
      case "HABIT":
        return {
          bg: completed ? "bg-brand-pink/20 border-brand-pink/30" : "bg-brand-pink/10 border-brand-pink/20",
          color: "#FF840D",
          text: "text-brand-pink",
          border: "border-brand-pink/30"
        };
      default:
        return {
          bg: completed ? "bg-neutral-900 border-neutral-800" : "bg-neutral-900 border-neutral-850",
          color: "#ffffff",
          text: "text-white",
          border: "border-neutral-800"
        };
    }
  };

  // Keyword auto-illustrator
  const getTaskIcon = (title: string, category: string, color: string) => {
    const t = title.toLowerCase();
    const size = 26;
    if (t.includes("code") || t.includes("leetcode") || t.includes("problem") || t.includes("dsa")) {
      return <Code color={color} size={size} />;
    }
    if (t.includes("git") || t.includes("commit") || t.includes("repo") || t.includes("project")) {
      return <GitBranch color={color} size={size} />;
    }
    if (t.includes("meditate") || t.includes("ganesh") || t.includes("mind") || t.includes("yoga")) {
      return <Brain color={color} size={size} />;
    }
    if (t.includes("pull") || t.includes("push") || t.includes("gym") || t.includes("workout") || t.includes("lift")) {
      return <Dumbbell color={color} size={size} />;
    }
    if (t.includes("run") || t.includes("cardio") || t.includes("walk") || t.includes("step")) {
      return <Footprints color={color} size={size} />;
    }
    if (t.includes("sleep") || t.includes("bed") || t.includes("wake")) {
      return <Moon color={color} size={size} />;
    }
    if (t.includes("supplement") || t.includes("pill") || t.includes("vitamin") || t.includes("medicine")) {
      return <Pill color={color} size={size} />;
    }
    if (t.includes("coffee") || t.includes("tea") || t.includes("drink") || t.includes("cafe")) {
      return <Coffee color={color} size={size} />;
    }
    if (t.includes("game") || t.includes("play") || t.includes("xbox") || t.includes("playstation")) {
      return <Gamepad2 color={color} size={size} />;
    }
    if (t.includes("study") || t.includes("read") || t.includes("book") || t.includes("learn")) {
      return <BookOpen color={color} size={size} />;
    }
    
    switch (category) {
      case "CODING": return <Code color={color} size={size} />;
      case "PROJECT": return <GitBranch color={color} size={size} />;
      case "FITNESS_MIND": return <Activity color={color} size={size} />;
      case "HABIT": return <ShieldCheck color={color} size={size} />;
      default: return <CheckSquare color={color} size={size} />;
    }
  };

  // Generate Past 7 Days (reversed so Today is middle/right)
  const pastOffsets = [6, 5, 4, 3, 2, 1, 0]; // 0 is Today

  return (
    <View className="flex-col gap-6">
      
      {/* Premium Header Layout */}
      <View className="flex-col p-4 bg-neutral-900 border border-neutral-800 rounded-2xl">
        <View className="flex-row justify-between items-baseline mb-2">
          <Text className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
            {selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </Text>
        </View>
        <View className="flex-row justify-between items-center">
          <Text className="text-2xl font-black text-white uppercase tracking-tight">
            LETS DO THIS
          </Text>
          <TouchableOpacity
            onPress={() => setAddingQuest(true)}
            className="flex-row items-center gap-1.5 bg-neutral-950 px-3 py-1.5 rounded-xl border border-neutral-850"
          >
            <PlusCircle color="#98FB98" size={14} />
            <Text className="text-[10px] text-white font-bold uppercase tracking-wider">New Quest</Text>
          </TouchableOpacity>
        </View>

        {/* Calendar Weekly Progress Bar */}
        <View className="flex-row justify-between items-center mt-5 pt-3 border-t border-neutral-850/60">
          {pastOffsets.map((offset) => {
            const date = getDateForOffset(offset);
            const dayGoals = getGoalsForDate(date);
            const dayCompleted = dayGoals.filter((g) => isGoalCompletedOnDate(g, date)).length;
            const dayTotal = dayGoals.length;
            const progress = dayTotal > 0 ? (dayCompleted / dayTotal) * 100 : 0;
            const isToday = offset === 0;
            const isSelected = selectedDayOffset === offset;

            // Formatted short weekday name
            const dayLabel = isToday ? "Today" : date.toLocaleDateString("en-US", { weekday: "short" });

            return (
              <TouchableOpacity
                key={offset}
                onPress={() => setSelectedDayOffset(offset)}
                className="items-center flex-1"
              >
                <Text className={`text-[9px] font-bold uppercase mb-1.5 ${
                  isSelected ? "text-white" : "text-neutral-500"
                }`}>
                  {dayLabel}
                </Text>

                {/* Dynamic progress circle fill from bottom */}
                <View
                  className={`w-9 h-9 rounded-full border items-center justify-center relative overflow-hidden ${
                    isToday ? "border-brand-yellow" : (isSelected ? "border-white" : "border-neutral-850")
                  }`}
                  style={{
                    backgroundColor: "#171717",
                    borderWidth: isToday ? 2 : 1,
                  }}
                >
                  {/* Progress background fill block */}
                  {progress > 0 && (
                    <View
                      className="absolute bottom-0 left-0 right-0 bg-emerald-500/20"
                      style={{ height: `${progress}%` }}
                    />
                  )}
                  <Text className={`text-xs font-black ${
                    isSelected ? "text-white" : "text-neutral-450"
                  }`}>
                    {date.getDate()}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Completion summary block */}
      <View className="flex-row items-center justify-between px-1">
        <View className="flex-row items-center gap-2">
          <View className="w-6 h-6 rounded-lg bg-neutral-900 border border-neutral-800 items-center justify-center">
            <Check color="#10b981" size={14} />
          </View>
          <Text className="text-sm font-black text-white">
            {completedCount} / {totalCount} <Text className="text-neutral-500 font-semibold">Completed</Text>
          </Text>
        </View>

        <View className="flex-row items-center gap-2">
          <TouchableOpacity className="w-8 h-8 rounded-xl bg-neutral-900 border border-neutral-800 items-center justify-center">
            <HelpCircle color="#a3a3a3" size={15} />
          </TouchableOpacity>
          <TouchableOpacity className="w-8 h-8 rounded-xl bg-neutral-900 border border-neutral-800 items-center justify-center">
            <Settings color="#a3a3a3" size={15} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 3-Column Continuous Grid Layout */}
      <View key={`grid-container-${selectedDayOffset}`} style={{ minHeight: 120 }}>
        {sortedQuests.length === 0 ? (
          <View className="bg-neutral-900 border border-neutral-800 rounded-2xl p-10 items-center justify-center">
            <CheckSquare color="#525252" size={32} />
            <Text className="text-xs text-neutral-500 mt-3 font-semibold text-center leading-normal">
              No active quests for this date.{"\n"}Click "New Quest" to spawn one!
            </Text>
          </View>
        ) : (
          <View 
            style={{
              flexDirection: "column",
              marginLeft: -1,
              backgroundColor: "rgba(23, 23, 23, 0.4)",
              borderTopWidth: 1,
              borderLeftWidth: 1,
              borderColor: "#262626",
              borderRadius: 16,
              overflow: "hidden",
              minHeight: Math.ceil(sortedQuests.length / 3) * 125,
            }}
          >
            {chunkArray(sortedQuests, 3).map((rowQuests, rowIndex) => {
              const paddedRow = [...rowQuests];
              while (paddedRow.length < 3) {
                paddedRow.push({ id: `placeholder-${rowIndex}-${paddedRow.length}`, isPlaceholder: true });
              }

              return (
                <View key={rowIndex} style={{ flexDirection: "row", height: 125 }}>
                  {paddedRow.map((goal) => {
                    if (goal.isPlaceholder) {
                      return (
                        <View 
                          key={goal.id}
                          style={{
                            width: cardWidth > 0 ? cardWidth : 100,
                            height: 125,
                            borderColor: "#262626",
                            borderRightWidth: 1,
                            borderBottomWidth: 1,
                          }}
                        />
                      );
                    }

                    const completed = isGoalCompletedOnDate(goal, selectedDate);
                    const theme = getCategoryTheme(goal.category, completed);

                    return (
                      <View 
                        key={goal.id}
                        style={{
                          width: cardWidth > 0 ? cardWidth : 100,
                          height: 125,
                          borderColor: "#262626",
                          borderRightWidth: 1,
                          borderBottomWidth: 1,
                        }}
                      >
                        <TouchableOpacity
                          onLongPress={() => {
                            Vibration.vibrate(50);
                            handleDeleteQuest(goal.id);
                          }}
                          onPress={() => handleToggle(goal)}
                          activeOpacity={0.9}
                          style={{
                            flex: 1,
                            padding: 10,
                            flexDirection: "column",
                            justifyContent: "space-between",
                            backgroundColor: completed ? "rgba(23, 23, 23, 0.4)" : "rgba(38, 38, 38, 0.15)",
                          }}
                        >
                          {/* Title */}
                          <Text 
                            numberOfLines={3} 
                            style={{
                              fontSize: 11,
                              fontWeight: "bold",
                              lineHeight: 15,
                              color: completed ? "#737373" : "#ffffff",
                              textDecorationLine: completed ? "line-through" : "none",
                            }}
                          >
                            {goal.title.replace(/^\[(Mind|Fitness)\]\s*/i, "")}
                          </Text>

                          {/* Card Graphic Footer */}
                          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", width: "100%", height: 36, position: "relative" }}>
                            {/* Category icon illustration */}
                            <View style={{ opacity: 0.9 }}>
                              {getTaskIcon(goal.title.replace(/^\[(Mind|Fitness)\]\s*/i, ""), goal.category, completed ? "#404040" : theme.color)}
                            </View>

                            {/* Checkbox */}
                            <View 
                              style={{
                                width: 24,
                                height: 24,
                                borderRadius: 8,
                                alignItems: "center",
                                justifyContent: "center",
                                borderWidth: 1,
                                backgroundColor: "#0a0a0a",
                                borderColor: completed ? "#10b981" : "#262626"
                              }}
                            >
                              {completed ? (
                                <Check color="#10b981" size={12} strokeWidth={3} />
                              ) : null}
                            </View>
                          </View>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Add Quest Modal Sheet */}
      <Modal
        visible={addingQuest}
        transparent
        animationType="slide"
        onRequestClose={() => setAddingQuest(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          className="flex-1 bg-black/60 justify-end"
        >
          <View className="w-full bg-neutral-950 border-t border-neutral-850 rounded-t-3xl p-6 pb-12">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-base font-black text-white uppercase tracking-tight">Spawn New Quest</Text>
              <TouchableOpacity
                onPress={() => setAddingQuest(false)}
                className="px-3 py-1 bg-neutral-900 border border-neutral-850 rounded-xl"
              >
                <Text className="text-neutral-400 text-xs font-bold">Close</Text>
              </TouchableOpacity>
            </View>

            {/* Input field */}
            <View className="mb-5">
              <Text className="text-xs font-bold text-neutral-450 uppercase mb-2">Quest Title</Text>
              <TextInput
                value={newQuestTitle}
                onChangeText={setNewQuestTitle}
                placeholder="e.g. Solve 3 Stack problems"
                placeholderTextColor="#525252"
                className="w-full px-4.5 py-4 bg-neutral-900 border border-neutral-800 rounded-xl text-white text-sm font-semibold"
              />
            </View>

            {/* Category chooser */}
            <View className="mb-6">
              <Text className="text-xs font-semibold text-neutral-450 uppercase mb-2.5">Arena Track Category</Text>
              <View className="flex-row flex-wrap gap-2">
                {[
                  { name: "Coding", category: "CODING", color: "#98FB98" },
                  { name: "Projects", category: "PROJECT", color: "#6495ED" },
                  { name: "Fitness", category: "FITNESS_MIND", color: "#00D084" },
                  { name: "Habits", category: "HABIT", color: "#FF840D" }
                ].map((item) => (
                  <TouchableOpacity
                    key={item.category}
                    onPress={() => setNewQuestCategory(item.category as any)}
                    className={`px-3.5 py-2.5 rounded-xl border flex-row items-center gap-1.5 ${
                      newQuestCategory === item.category 
                        ? "bg-neutral-900 border-neutral-700" 
                        : "bg-neutral-950 border-neutral-900"
                    }`}
                  >
                    <View className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <Text className={`text-xs font-bold ${
                      newQuestCategory === item.category ? "text-white" : "text-neutral-500"
                    }`}>{item.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Submit button */}
            <TouchableOpacity
              onPress={handleAddQuest}
              disabled={loading || !newQuestTitle.trim()}
              className="w-full py-3.5 bg-brand-yellow rounded-xl items-center justify-center"
            >
              {loading ? (
                <ActivityIndicator color="#0a0a0a" size="small" />
              ) : (
                <Text className="text-neutral-950 font-black text-sm uppercase tracking-wider">Initialize Quest</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Onboarding Guide */}
      <OnboardingTour onComplete={() => setAddingQuest(true)} />

    </View>
  );
}
