import React, { useState, useEffect, useRef } from "react";
import { Send, Bot, User, Zap, Calendar, ArrowRight, Sparkles, RefreshCcw } from "lucide-react";
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

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fetch Reports
  const fetchReports = async () => {
    setReportsLoading(true);
    try {
      const data = await reportApi.getWeeklyReports();
      if (data.success) {
        setReports(data.reports);
      }
    } catch (err) {
      console.error(err);
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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, chatLoading]);

  // Send Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
      {/* AI Chat section (Left 2 columns on desktop) */}
      <div className="lg:col-span-2 glass-panel rounded-2xl flex flex-col justify-between overflow-hidden h-full border border-neutral-800">
        {/* Chat Header */}
        <div className="p-4 bg-neutral-900/60 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center border border-neutral-700 animate-pulse">
              <Bot className="w-5 h-5 text-neutral-300" />
            </div>
            <div>
              <span className="text-sm font-bold text-white block leading-none">Life Strategist</span>
              <span className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider">Master Integration Advisor</span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-neutral-400 bg-neutral-950 px-2.5 py-1.5 rounded-lg border border-neutral-900 font-bold uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5 text-brand-yellow" />
            {telemetry.tokens} Tokens Available
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 text-sm">
          {chatHistory.map((msg, index) => (
            <div
              key={index}
              className={`flex gap-4 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.sender === "bot" && (
                <div className="w-7 h-7 rounded-lg bg-neutral-900 border border-neutral-850 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-neutral-400" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-xl px-4.5 py-3 leading-relaxed whitespace-pre-wrap ${
                  msg.sender === "user"
                    ? "bg-neutral-900 border border-neutral-800 text-white text-right"
                    : "bg-neutral-950/20 text-neutral-200 border border-neutral-900/40"
                }`}
              >
                {/* Simulated simple Markdown parsing for response bullet points */}
                {msg.text.split("\n").map((line, lIdx) => {
                  if (line.startsWith("### ")) {
                    return <h3 key={lIdx} className="text-sm font-bold text-brand-yellow uppercase tracking-wide mt-3 mb-1.5 first:mt-0">{line.replace("### ", "")}</h3>;
                  }
                  if (line.startsWith("- ")) {
                    return <li key={lIdx} className="ml-4 list-disc text-xs text-neutral-300 mt-1">{line.replace("- ", "")}</li>;
                  }
                  return <p key={lIdx} className="text-xs text-neutral-300 mt-1 first:mt-0">{line}</p>;
                })}
              </div>
              {msg.sender === "user" && (
                <div className="w-7 h-7 rounded-lg bg-brand-yellow/10 border border-brand-yellow/30 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-brand-yellow" />
                </div>
              )}
            </div>
          ))}

          {chatLoading && (
            <div className="flex gap-4 justify-start">
              <div className="w-7 h-7 rounded-lg bg-neutral-900 border border-neutral-850 flex items-center justify-center shrink-0 animate-spin">
                <Bot className="w-4 h-4 text-neutral-500" />
              </div>
              <div className="bg-neutral-900/20 text-neutral-500 rounded-xl px-4 py-2 border border-neutral-850 flex items-center gap-2 text-xs">
                Analyzing metrics database and formulating advice...
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Chat input */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-neutral-800 bg-neutral-950/40 flex gap-2">
          <input
            type="text"
            placeholder="Ask your life strategist (e.g. 'What is my priority today?')"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={chatLoading}
            className="flex-1 px-4 py-3 bg-neutral-900 border border-neutral-800 text-xs rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-brand-yellow/50 transition-colors"
          />
          <button
            type="submit"
            disabled={chatLoading}
            className="w-12 h-12 bg-brand-yellow text-neutral-950 flex items-center justify-center rounded-xl hover:bg-yellow-400 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Weekly reports history side panel */}
      <div className="glass-panel rounded-2xl p-6 border border-neutral-800 flex flex-col justify-between overflow-hidden h-full">
        <div className="space-y-6 flex-1 overflow-y-auto pb-4 scrollbar-thin">
          <div className="flex items-center justify-between">
            <h3 className="text-md font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="text-neutral-500 w-5 h-5" />
              Weekly Reports
            </h3>
            <button
              onClick={handleGenerateReport}
              disabled={generatingReport}
              className="px-2.5 py-1.5 bg-neutral-900 border border-neutral-800 text-[10px] text-brand-yellow font-bold uppercase tracking-wider rounded-lg flex items-center gap-1 hover:border-brand-yellow transition-all disabled:opacity-50 cursor-pointer"
            >
              <RefreshCcw className={`w-3 h-3 ${generatingReport ? "animate-spin" : ""}`} />
              Generate
            </button>
          </div>

          {reportError && (
            <div className="p-3 bg-red-950/30 border border-red-900/50 rounded-xl text-[11px] text-red-400 text-center">
              {reportError}
            </div>
          )}

          {/* List reports */}
          <div className="space-y-3">
            {reportsLoading && reports.length === 0 ? (
              <p className="text-xs text-neutral-500 text-center py-8">Loading history reports...</p>
            ) : reports.length === 0 ? (
              <p className="text-xs text-neutral-500 text-center py-8">No reports generated. Click Generate above!</p>
            ) : (
              reports.map((rep) => (
                <button
                  key={rep.id}
                  onClick={() => setSelectedReport(rep)}
                  className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    selectedReport?.id === rep.id
                      ? "bg-brand-yellow/5 border-brand-yellow/40 shadow-lg"
                      : "bg-neutral-900/40 border-neutral-850 hover:bg-neutral-900"
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="text-xs font-bold text-white">
                      Report Ending {new Date(rep.weekEnd).toLocaleDateString()}
                    </span>
                    <span className="text-[10px] text-brand-yellow font-bold uppercase tracking-widest bg-brand-yellow/10 px-2 py-0.5 rounded-full">
                      Gen 1
                    </span>
                  </div>
                  <div className="flex gap-4 mt-3 text-[11px] text-neutral-400">
                    <div>
                      Readiness: <span className="text-white font-bold">{rep.placementReadinessScore}%</span>
                    </div>
                    <div>
                      Balance: <span className="text-white font-bold">{rep.lifeBalanceScore}%</span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Selected Report details Modal/Panel */}
        {selectedReport && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="w-full max-w-2xl bg-neutral-950 border border-neutral-800 rounded-3xl p-8 max-h-[85vh] overflow-y-auto space-y-6">
              <div className="flex justify-between items-start border-b border-neutral-900 pb-4">
                <div>
                  <h3 className="text-xl font-extrabold text-white font-display">
                    Weekly Sync Analysis
                  </h3>
                  <p className="text-xs text-neutral-500 mt-1">
                    Week range: {new Date(selectedReport.weekStart).toLocaleDateString()} to {new Date(selectedReport.weekEnd).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="px-3.5 py-1.5 bg-neutral-900 border border-neutral-800 text-neutral-400 text-xs rounded-xl font-bold hover:border-brand-yellow cursor-pointer"
                >
                  Close
                </button>
              </div>

              {/* Scores indicators */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-neutral-900/40 p-4 rounded-2xl border border-neutral-850 text-center">
                  <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-semibold block">Placement Index</span>
                  <span className="text-3xl font-extrabold text-brand-yellow block mt-1">{selectedReport.placementReadinessScore}%</span>
                </div>
                <div className="bg-neutral-900/40 p-4 rounded-2xl border border-neutral-850 text-center">
                  <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-semibold block">Life Balance Index</span>
                  <span className="text-3xl font-extrabold text-brand-pink block mt-1">{selectedReport.lifeBalanceScore}%</span>
                </div>
              </div>

              {/* Priorities distribution bar */}
              <div className="space-y-2">
                <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-bold block">
                  Priority Weights Allocation
                </span>
                {selectedReport.nextWeekPlan?.priorityDistribution ? (
                  <div>
                    <div className="flex h-3.5 rounded-lg overflow-hidden">
                      <div
                        style={{ width: `${selectedReport.nextWeekPlan.priorityDistribution.coding}%` }}
                        className="bg-brand-yellow"
                        title={`Coding: ${selectedReport.nextWeekPlan.priorityDistribution.coding}%`}
                      ></div>
                      <div
                        style={{ width: `${selectedReport.nextWeekPlan.priorityDistribution.projects}%` }}
                        className="bg-brand-cyan"
                        title={`Projects: ${selectedReport.nextWeekPlan.priorityDistribution.projects}%`}
                      ></div>
                      <div
                        style={{ width: `${selectedReport.nextWeekPlan.priorityDistribution.fitnessMind}%` }}
                        className="bg-brand-purple"
                        title={`Fitness: ${selectedReport.nextWeekPlan.priorityDistribution.fitnessMind}%`}
                      ></div>
                      <div
                        style={{ width: `${selectedReport.nextWeekPlan.priorityDistribution.habits}%` }}
                        className="bg-brand-pink"
                        title={`Habits: ${selectedReport.nextWeekPlan.priorityDistribution.habits}%`}
                      ></div>
                    </div>
                    {/* Legend */}
                    <div className="flex flex-wrap gap-4 mt-2 text-[10px] text-neutral-500 font-semibold uppercase">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded bg-brand-yellow"></span>
                        Coding ({selectedReport.nextWeekPlan.priorityDistribution.coding}%)
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded bg-brand-cyan"></span>
                        Projects ({selectedReport.nextWeekPlan.priorityDistribution.projects}%)
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded bg-brand-purple"></span>
                        Fitness ({selectedReport.nextWeekPlan.priorityDistribution.fitnessMind}%)
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded bg-brand-pink"></span>
                        Habits ({selectedReport.nextWeekPlan.priorityDistribution.habits}%)
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-neutral-500">Distribution weights config missing.</p>
                )}
              </div>

              {/* Focus justification */}
              {selectedReport.nextWeekPlan?.reason && (
                <div className="p-4 bg-neutral-900 border border-neutral-850 rounded-2xl text-xs text-neutral-300">
                  💡 **Strategist Rationale**: {selectedReport.nextWeekPlan.reason}
                </div>
              )}

              {/* Lists content */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-2">
                  <h4 className="text-[10px] text-emerald-500 uppercase tracking-widest font-black">
                    Weekly Wins
                  </h4>
                  <ul className="text-xs text-neutral-350 space-y-2">
                    {selectedReport.wins.map((win: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-emerald-500">✓</span>
                        <span>{win}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="text-[10px] text-rose-500 uppercase tracking-widest font-black">
                    Neglected Risks
                  </h4>
                  <ul className="text-xs text-neutral-350 space-y-2">
                    {selectedReport.weaknesses.map((weak: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-rose-500">⚠</span>
                        <span>{weak}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action plan checklist */}
              {selectedReport.nextWeekPlan?.tasks && (
                <div className="border-t border-neutral-900 pt-4 space-y-2">
                  <h4 className="text-[10px] text-brand-yellow uppercase tracking-widest font-black flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Next Week Arena Quest Plan
                  </h4>
                  <div className="space-y-2.5 mt-2">
                    {selectedReport.nextWeekPlan.tasks.map((task: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2.5 p-3 bg-neutral-900/30 border border-neutral-850 rounded-xl">
                        <ArrowRight className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
                        <span className="text-xs text-white">{task}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
