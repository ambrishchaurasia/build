import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { authApi } from "../services/authApi";

const CAREER_GOALS = [
  "Software Engineer",
  "Data Scientist",
  "AI Engineer",
  "ML Engineer",
  "Product Manager",
  "Research Engineer"
];

const COMPANY_TYPES = [
  { id: "FAANG", label: "FAANG (High Volume DSA & Tech)" },
  { id: "Startup", label: "Startup (Product & Dev Heavy)" },
  { id: "FinTech", label: "FinTech / Quant (System & Speed)" },
  { id: "Research", label: "Research (ML & Algorithms)" }
];

export default function Onboarding() {
  const [careerGoal, setCareerGoal] = useState("Software Engineer");
  const [semester, setSemester] = useState("6");
  const [cgpa, setCgpa] = useState("8.0");
  const [targetPlacementYear, setTargetPlacementYear] = useState("2027");
  const [targetCompanyType, setTargetCompanyType] = useState("FAANG");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showCareerDropdown, setShowCareerDropdown] = useState(false);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);

  const handleSubmit = async () => {
    const semNum = Number(semester);
    const cgpaNum = Number(cgpa);
    const yearNum = Number(targetPlacementYear);

    if (isNaN(semNum) || semNum < 1 || semNum > 10) {
      setError("Semester must be between 1 and 10");
      return;
    }
    if (isNaN(cgpaNum) || cgpaNum < 0 || cgpaNum > 10) {
      setError("CGPA must be between 0.0 and 10.0");
      return;
    }
    if (isNaN(yearNum) || yearNum < 2024 || yearNum > 2035) {
      setError("Target Placement Year must be between 2024 and 2035");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await authApi.updateProfile({
        careerGoal,
        semester: semNum,
        cgpa: cgpaNum,
        targetPlacementYear: yearNum,
        targetCompanyType
      });
      
      if (data.success) {
        router.replace("/dashboard");
      } else {
        setError(data.message || "Failed to update profile");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update profile. Please check your network.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-neutral-950 px-4 py-8" contentContainerStyle={{ paddingBottom: 60 }}>
      <View className="w-full max-w-md mx-auto mt-10 bg-neutral-900/60 p-6 rounded-2xl border border-neutral-800 shadow-xl">
        
        {/* Header */}
        <View className="mb-6">
          <View className="inline-block self-start px-3 py-1 bg-lime-500/10 border border-lime-500/30 rounded-full mb-3">
            <Text className="text-lime-400 text-xs font-semibold uppercase tracking-wider">Step 2: Initialize Stats</Text>
          </View>
          <Text className="text-2xl font-extrabold text-white mb-2 uppercase">
            Configure Profile
          </Text>
          <Text className="text-sm text-neutral-400">
            Tell your AI advisors about your career targets to customize advice priorities.
          </Text>
        </View>

        {error ? (
          <View className="p-3 bg-red-950/40 border border-red-900/50 rounded-lg mb-6">
            <Text className="text-sm text-red-400 text-center">{error}</Text>
          </View>
        ) : null}

        {/* Inputs */}
        <View className="space-y-4">
          
          {/* Career Goal Dropdown */}
          <View className="mb-4">
            <Text className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
              Career Goal Track
            </Text>
            <TouchableOpacity
              onPress={() => setShowCareerDropdown(!showCareerDropdown)}
              className="w-full px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-xl flex-row justify-between items-center"
            >
              <Text className="text-white font-medium">{careerGoal}</Text>
              <Text className="text-brand-yellow font-bold">▼</Text>
            </TouchableOpacity>

            {showCareerDropdown && (
              <View className="mt-2 bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-lg z-50">
                {CAREER_GOALS.map((goal) => (
                  <TouchableOpacity
                    key={goal}
                    onPress={() => {
                      setCareerGoal(goal);
                      setShowCareerDropdown(false);
                    }}
                    className={`px-4 py-3 border-b border-neutral-800/40 ${careerGoal === goal ? "bg-neutral-800/80" : ""}`}
                  >
                    <Text className={`text-sm ${careerGoal === goal ? "text-brand-yellow font-semibold" : "text-neutral-300"}`}>{goal}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Semester & CGPA Grid */}
          <View className="flex-row gap-4 mb-4">
            <View className="flex-1">
              <Text className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                Current Semester
              </Text>
              <TextInput
                value={semester}
                onChangeText={setSemester}
                keyboardType="number-pad"
                className="w-full px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-xl text-white font-medium"
                placeholder="e.g. 6"
                placeholderTextColor="#525252"
              />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                Current CGPA
              </Text>
              <TextInput
                value={cgpa}
                onChangeText={setCgpa}
                keyboardType="decimal-pad"
                className="w-full px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-xl text-white font-medium"
                placeholder="e.g. 8.0"
                placeholderTextColor="#525252"
              />
            </View>
          </View>

          {/* Target Placement Year */}
          <View className="mb-4">
            <Text className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
              Target Placement Year
            </Text>
            <TextInput
              value={targetPlacementYear}
              onChangeText={setTargetPlacementYear}
              keyboardType="number-pad"
              className="w-full px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-xl text-white font-medium"
              placeholder="e.g. 2027"
              placeholderTextColor="#525252"
            />
          </View>

          {/* Company Type Dropdown */}
          <View className="mb-6">
            <Text className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
              Target Company Type
            </Text>
            <TouchableOpacity
              onPress={() => setShowCompanyDropdown(!showCompanyDropdown)}
              className="w-full px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-xl flex-row justify-between items-center"
            >
              <Text className="text-white font-medium">
                {COMPANY_TYPES.find(c => c.id === targetCompanyType)?.label || targetCompanyType}
              </Text>
              <Text className="text-brand-yellow font-bold">▼</Text>
            </TouchableOpacity>

            {showCompanyDropdown && (
              <View className="mt-2 bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-lg z-50">
                {COMPANY_TYPES.map((comp) => (
                  <TouchableOpacity
                    key={comp.id}
                    onPress={() => {
                      setTargetCompanyType(comp.id);
                      setShowCompanyDropdown(false);
                    }}
                    className={`px-4 py-3 border-b border-neutral-800/40 ${targetCompanyType === comp.id ? "bg-neutral-800/80" : ""}`}
                  >
                    <Text className={`text-sm ${targetCompanyType === comp.id ? "text-brand-yellow font-semibold" : "text-neutral-300"}`}>
                      {comp.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            className="w-full py-4 bg-brand-yellow rounded-xl items-center justify-center mt-4"
          >
            {loading ? (
              <ActivityIndicator color="#0a0a0a" />
            ) : (
              <Text className="text-neutral-950 font-bold text-base uppercase">Initialize Advisor Board</Text>
            )}
          </TouchableOpacity>

        </View>

      </View>
    </ScrollView>
  );
}
