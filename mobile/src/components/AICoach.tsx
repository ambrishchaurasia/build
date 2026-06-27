import React, { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Modal } from "react-native";
import { Send, Bot, User, Zap, Calendar, ArrowRight, Sparkles, RefreshCw } from "lucide-react-native";
import { aiApi, ChatMessage } from "../services/aiApi";
import { reportApi } from "../services/reportApi";

interface AICoachProps {
  telemetry: any;
  onRefresh: () => Promise<void>;
}

export default function AICoach({ telemetry, onRefresh }: AICoachProps) {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  
  const [reports, setReports] = useState<any[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportError, setReportError] = useState("");

  const chatScrollViewRef = useRef<ScrollView>(null);

  // Fetch Reports
  const fetchReports = async () => {
    setReportsLoading(true);
    try {
      const data = await reportApi.getWeeklyReports();
      if (data.success) {
        setReports(data.reports);
      }
    } catch (err) {
      console.error("Failed to load reports", err);
    } finally {
      setReportsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    // Pre-populate welcome message
    setChatHistory([
      {
        sender: "bot",
        text: `### Welcome to your Advisor Board Hub! \n\nI am your **Life Strategist Master Agent**. I aggregate feedback from your **Coding Advisor** and **Project Advisor** to coordinate your daily priorities.\n\nAsk me questions like:\n- *"What should I focus on right now?"*\n- *"Am I placement ready?"*\n- *"What are my biggest weaknesses?"*\n- *"Review my meditation and habit streaks"*`
      }
    ]);
  }, []);

  // Scroll to bottom on history change
  useEffect(() => {
    if (chatScrollViewRef.current) {
      setTimeout(() => chatScrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [chatHistory, chatLoading]);

  // Send Message
  const handleSendMessage = async () => {
    if (!message.trim() || chatLoading) return;

    const userMsg = message;
    setMessage("");
    setChatHistory((prev) => [...prev, { sender: "user", text: userMsg }]);
    setChatLoading(true);

    try {
      const data = await aiApi.chat(userMsg, chatHistory);
      if (data.success) {
        setChatHistory((prev) => [...prev, { sender: "bot", text: data.reply }]);
        await onRefresh(); // Refresh tokens
      }
    } catch (err) {
      setChatHistory((prev) => [
        ...prev,
        { sender: "bot", text: "**Error**: Failed to communicate with Life Strategist. Check backend server connection." }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // Generate Report
  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    setReportError("");
    try {
      const data = await reportApi.generateReport();
      if (data.success) {
        await fetchReports();
        await onRefresh();
        setSelectedReport(data.report);
      }
    } catch (err: any) {
      setReportError(err.response?.data?.message || "Failed to compile weekly report");
    } finally {
      setGeneratingReport(false);
    }
  };

  const renderMessageContent = (text: string) => {
    return text.split("\n").map((line, idx) => {
      if (line.startsWith("### ")) {
        return (
          <Text key={idx} className="text-sm font-black text-brand-yellow uppercase tracking-wider mt-2.5 mb-1.5">
            {line.replace("### ", "")}
          </Text>
        );
      }
      if (line.startsWith("- ")) {
        return (
          <View key={idx} className="flex-row items-start mt-1 pl-2.5">
            <Text className="text-brand-yellow text-xs mr-1.5">•</Text>
            <Text className="text-neutral-300 text-xs flex-1 leading-relaxed">{line.replace("- ", "")}</Text>
          </View>
        );
      }
      return (
        <Text key={idx} className="text-neutral-300 text-xs mt-1 leading-relaxed">
          {line}
        </Text>
      );
    });
  };

  return (
    <View className="flex-col gap-6">
      
      {/* Header banner */}
      <View style={{ backgroundColor: "#98FB98" }} className="flex-col p-5 rounded-2xl">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Bot color="#ffffff" size={24} />
            <View>
              <Text className="text-base font-black text-white uppercase tracking-tight">AI Advisor Coach</Text>
              <Text className="text-[10px] text-white/80 font-bold uppercase tracking-wider mt-0.5">Master Integration Strategist</Text>
            </View>
          </View>
          <View className="flex-row items-center gap-1.5 bg-neutral-950 px-2.5 py-1.5 rounded-xl">
            <Zap color="#98FB98" size={12} />
            <Text className="text-[9px] text-white font-bold uppercase">{telemetry?.tokens || 0} Coins</Text>
          </View>
        </View>
      </View>

      {/* AI Chat Area */}
      <View className="bg-neutral-900 border border-neutral-800 rounded-2xl h-[360px] flex-col justify-between overflow-hidden">
        
        {/* Chat ScrollView */}
        <ScrollView
          ref={chatScrollViewRef}
          className="flex-1 p-4"
          contentContainerStyle={{ paddingBottom: 20 }}
          nestedScrollEnabled
        >
          {chatHistory.map((msg, index) => (
            <View
              key={index}
              className={`flex-row items-start mb-4 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.sender === "bot" && (
                <View className="w-7 h-7 rounded-lg bg-neutral-950 border border-neutral-850 items-center justify-center mr-2 mt-1">
                  <Bot color="#a3a3a3" size={14} />
                </View>
              )}
              
              <View
                className={`max-w-[80%] rounded-xl px-4 py-3 border ${
                  msg.sender === "user"
                    ? "bg-neutral-950 border-neutral-800"
                    : "bg-neutral-950/20 border-neutral-900/60"
                }`}
              >
                {renderMessageContent(msg.text)}
              </View>

              {msg.sender === "user" && (
                <View className="w-7 h-7 rounded-lg bg-brand-yellow/10 border border-brand-yellow/30 items-center justify-center ml-2 mt-1">
                  <User color="#98FB98" size={14} />
                </View>
              )}
            </View>
          ))}

          {chatLoading && (
            <View className="flex-row items-center gap-2.5 justify-start mt-2">
              <View className="w-7 h-7 rounded-lg bg-neutral-950 border border-neutral-850 items-center justify-center">
                <ActivityIndicator size="small" color="#98FB98" />
              </View>
              <Text className="text-neutral-500 text-xs italic">Formulating strategist response...</Text>
            </View>
          )}
        </ScrollView>

        {/* Input area */}
        <View className="p-3 border-t border-neutral-800 bg-neutral-950/40 flex-row gap-2">
          <TextInput
            placeholder="Ask your life strategist advisor..."
            placeholderTextColor="#525252"
            value={message}
            onChangeText={setMessage}
            editable={!chatLoading}
            className="flex-1 px-4 py-2 bg-neutral-900 border border-neutral-800 text-xs rounded-xl text-white"
          />
          <TouchableOpacity
            onPress={handleSendMessage}
            disabled={chatLoading}
            className="w-10 h-10 bg-brand-yellow items-center justify-center rounded-xl"
          >
            <Send color="#0a0a0a" size={16} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Weekly Reports Panel */}
      <View className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl flex-col gap-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-1.5">
            <Calendar color="#98FB98" size={18} />
            <Text className="text-sm font-bold text-white uppercase tracking-tight">Weekly Sync Reports</Text>
          </View>
          <TouchableOpacity
            onPress={handleGenerateReport}
            disabled={generatingReport}
            className="px-2.5 py-1.5 bg-neutral-950 border border-neutral-850 rounded-lg flex-row items-center gap-1"
          >
            {generatingReport ? (
              <ActivityIndicator size="small" color="#98FB98" />
            ) : (
              <>
                <RefreshCw color="#98FB98" size={10} />
                <Text className="text-brand-yellow text-[9px] font-bold uppercase tracking-wider">Generate</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {reportError ? (
          <View className="p-3 bg-red-950/30 border border-red-900/50 rounded-xl">
            <Text className="text-xs text-red-400 text-center">{reportError}</Text>
          </View>
        ) : null}

        <View className="flex-col gap-3">
          {reportsLoading && reports.length === 0 ? (
            <ActivityIndicator size="small" color="#98FB98" className="py-6" />
          ) : reports.length === 0 ? (
            <Text className="text-xs text-neutral-500 py-6 text-center font-medium">No reports compiled yet. Click Generate above!</Text>
          ) : (
            reports.map((rep) => (
              <TouchableOpacity
                key={rep.id}
                onPress={() => setSelectedReport(rep)}
                className="w-full p-4 rounded-xl border border-neutral-850 bg-neutral-950/40 flex-col gap-2"
              >
                <View className="flex-row justify-between items-center">
                  <Text className="text-xs font-bold text-white">
                    Report Ending {new Date(rep.weekEnd).toLocaleDateString()}
                  </Text>
                  <View className="bg-brand-yellow/10 px-2 py-0.5 rounded-full border border-brand-yellow/20">
                    <Text className="text-brand-yellow text-[8px] font-bold uppercase">Gen 1</Text>
                  </View>
                </View>
                <View className="flex-row gap-4 mt-1">
                  <Text className="text-[11px] text-neutral-400">
                    Readiness: <Text className="text-white font-bold">{rep.placementReadinessScore}%</Text>
                  </Text>
                  <Text className="text-[11px] text-neutral-400">
                    Balance: <Text className="text-white font-bold">{rep.lifeBalanceScore}%</Text>
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </View>

      {/* Selected Report Details Modal */}
      {selectedReport && (
        <Modal
          visible={!!selectedReport}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedReport(null)}
        >
          <View className="flex-1 bg-black/80 justify-end">
            <View className="w-full bg-neutral-950 border-t border-neutral-800 rounded-t-3xl p-6 pb-12 max-h-[85%]">
              
              {/* Modal Header */}
              <View className="flex-row justify-between items-start border-b border-neutral-900 pb-4 mb-4">
                <View>
                  <Text className="text-base font-extrabold text-white">Weekly Sync Analysis</Text>
                  <Text className="text-[10px] text-neutral-500 mt-1">
                    Range: {new Date(selectedReport.weekStart).toLocaleDateString()} to {new Date(selectedReport.weekEnd).toLocaleDateString()}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setSelectedReport(null)}
                  className="px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-xl"
                >
                  <Text className="text-neutral-400 text-xs font-bold">Close</Text>
                </TouchableOpacity>
              </View>

              <ScrollView className="flex-col gap-5">
                
                {/* Scores */}
                <View className="flex-row gap-3 mb-4">
                  <View className="flex-1 bg-neutral-900/40 p-4 rounded-xl border border-neutral-900 text-center">
                    <Text className="text-[9px] text-neutral-500 uppercase tracking-widest font-bold">Placement Index</Text>
                    <Text className="text-2xl font-black text-brand-yellow mt-1">{selectedReport.placementReadinessScore}%</Text>
                  </View>
                  <View className="flex-1 bg-neutral-900/40 p-4 rounded-xl border border-neutral-900 text-center">
                    <Text className="text-[9px] text-neutral-500 uppercase tracking-widest font-bold">Life Balance</Text>
                    <Text className="text-2xl font-black text-brand-pink mt-1">{selectedReport.lifeBalanceScore}%</Text>
                  </View>
                </View>

                {/* Priority Weights Allocation */}
                {selectedReport.nextWeekPlan?.priorityDistribution && (
                  <View className="flex-col gap-2 mb-4 bg-neutral-900 p-4 rounded-xl">
                    <Text className="text-[9px] text-neutral-450 uppercase tracking-widest font-bold">Priority Weights Allocation</Text>
                    <View className="flex-row h-3 rounded-lg overflow-hidden mt-1 bg-neutral-950">
                      <View style={{ width: `${selectedReport.nextWeekPlan.priorityDistribution.coding}%` }} className="bg-brand-yellow" />
                      <View style={{ width: `${selectedReport.nextWeekPlan.priorityDistribution.projects}%` }} className="bg-brand-cyan" />
                      <View style={{ width: `${selectedReport.nextWeekPlan.priorityDistribution.fitnessMind}%` }} className="bg-brand-purple" />
                      <View style={{ width: `${selectedReport.nextWeekPlan.priorityDistribution.habits}%` }} className="bg-brand-pink" />
                    </View>
                    <View className="flex-row flex-wrap gap-x-3 gap-y-1 mt-2">
                      <View className="flex-row items-center gap-1">
                        <View className="w-2 h-2 rounded bg-brand-yellow" />
                        <Text className="text-[9px] text-neutral-400 font-bold">Coding ({selectedReport.nextWeekPlan.priorityDistribution.coding}%)</Text>
                      </View>
                      <View className="flex-row items-center gap-1">
                        <View className="w-2 h-2 rounded bg-brand-cyan" />
                        <Text className="text-[9px] text-neutral-400 font-bold">Projects ({selectedReport.nextWeekPlan.priorityDistribution.projects}%)</Text>
                      </View>
                      <View className="flex-row items-center gap-1">
                        <View className="w-2 h-2 rounded bg-brand-purple" />
                        <Text className="text-[9px] text-neutral-400 font-bold">Fitness ({selectedReport.nextWeekPlan.priorityDistribution.fitnessMind}%)</Text>
                      </View>
                      <View className="flex-row items-center gap-1">
                        <View className="w-2 h-2 rounded bg-brand-pink" />
                        <Text className="text-[9px] text-neutral-400 font-bold">Habits ({selectedReport.nextWeekPlan.priorityDistribution.habits}%)</Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Justification Rationale */}
                {selectedReport.nextWeekPlan?.reason && (
                  <View className="p-4 bg-neutral-900 border border-neutral-850 rounded-xl mb-4">
                    <Text className="text-xs text-neutral-300 leading-normal">
                      💡 <Text className="font-bold text-white">Strategist Rationale</Text>: {selectedReport.nextWeekPlan.reason}
                    </Text>
                  </View>
                )}

                {/* Wins & Weaknesses */}
                <View className="flex-col gap-4 mb-4">
                  <View className="flex-col gap-1.5">
                    <Text className="text-[10px] text-emerald-500 uppercase tracking-widest font-black">Weekly Wins</Text>
                    {selectedReport.wins.map((win: string, idx: number) => (
                      <View key={idx} className="flex-row items-start pl-1">
                        <Text className="text-emerald-500 text-xs mr-2">✓</Text>
                        <Text className="text-neutral-300 text-xs flex-1 leading-normal">{win}</Text>
                      </View>
                    ))}
                  </View>

                  <View className="flex-col gap-1.5">
                    <Text className="text-[10px] text-rose-500 uppercase tracking-widest font-black">Neglected Risks</Text>
                    {selectedReport.weaknesses.map((weak: string, idx: number) => (
                      <View key={idx} className="flex-row items-start pl-1">
                        <Text className="text-rose-550 text-xs mr-2">⚠</Text>
                        <Text className="text-neutral-300 text-xs flex-1 leading-normal">{weak}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Action plan checklist */}
                {selectedReport.nextWeekPlan?.tasks && (
                  <View className="border-t border-neutral-900 pt-4 flex-col gap-2">
                    <View className="flex-row items-center gap-1">
                      <Sparkles color="#98FB98" size={14} />
                      <Text className="text-[10px] text-brand-yellow uppercase tracking-widest font-black">Next Week Quest Plan</Text>
                    </View>
                    {selectedReport.nextWeekPlan.tasks.map((task: string, idx: number) => (
                      <View key={idx} className="flex-row items-center gap-2.5 p-3 bg-neutral-900 border border-neutral-850 rounded-xl mt-1">
                        <ArrowRight color="#737373" size={14} className="shrink-0" />
                        <Text className="text-xs text-white flex-1">{task}</Text>
                      </View>
                    ))}
                  </View>
                )}

              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

    </View>
  );
}
