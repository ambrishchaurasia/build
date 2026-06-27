import React, { useState } from "react";
import { authApi } from "../services/authApi";

interface ProfileOnboardingProps {
  onOnboardingComplete: () => void;
}

export default function ProfileOnboarding({ onOnboardingComplete }: ProfileOnboardingProps) {
  const [careerGoal, setCareerGoal] = useState("Software Engineer");
  const [semester, setSemester] = useState(6);
  const [cgpa, setCgpa] = useState(8.0);
  const [targetPlacementYear, setTargetPlacementYear] = useState(2027);
  const [targetCompanyType, setTargetCompanyType] = useState("FAANG");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await authApi.updateProfile({
        careerGoal,
        semester: Number(semester),
        cgpa: Number(cgpa),
        targetPlacementYear: Number(targetPlacementYear),
        targetCompanyType
      });
      onOnboardingComplete();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update profile. Please check your fields.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 px-4 py-12">
      <div className="absolute w-[450px] h-[450px] rounded-full bg-brand-yellow/5 blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-xl glass-panel p-10 rounded-3xl shadow-2xl relative z-10 border border-neutral-800">
        <div className="mb-8">
          <div className="inline-block px-3 py-1 bg-lime-500/10 border border-lime-500/30 text-lime-400 rounded-full text-xs font-semibold tracking-wider uppercase mb-3">
            Step 2: Initialize Stats
          </div>
          <h1 className="text-3xl font-extrabold font-display tracking-tight text-white mb-2">
            Configure Academic Profile
          </h1>
          <p className="text-sm text-neutral-400">
            Tell your AI advisors about your career targets to customize advice priorities.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-950/40 border border-red-900/50 rounded-lg text-sm text-red-400 mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                Career Goal Track
              </label>
              <select
                value={careerGoal}
                onChange={(e) => setCareerGoal(e.target.value)}
                className="w-full px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-brand-yellow/50 transition-colors"
              >
                <option value="Software Engineer">Software Engineer</option>
                <option value="Data Scientist">Data Scientist</option>
                <option value="AI Engineer">AI Engineer</option>
                <option value="ML Engineer">ML Engineer</option>
                <option value="Product Manager">Product Manager</option>
                <option value="Research Engineer">Research Engineer</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                Current Semester
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={semester}
                onChange={(e) => setSemester(Number(e.target.value))}
                className="w-full px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-brand-yellow/50 transition-colors"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                Current CGPA (out of 10)
              </label>
              <input
                type="number"
                step="0.01"
                min={0}
                max={10}
                value={cgpa}
                onChange={(e) => setCgpa(Number(e.target.value))}
                className="w-full px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-brand-yellow/50 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                Target Placement Year
              </label>
              <input
                type="number"
                min={2024}
                max={2035}
                value={targetPlacementYear}
                onChange={(e) => setTargetPlacementYear(Number(e.target.value))}
                className="w-full px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-brand-yellow/50 transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
              Target Company Type
            </label>
            <select
              value={targetCompanyType}
              onChange={(e) => setTargetCompanyType(e.target.value)}
              className="w-full px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-brand-yellow/50 transition-colors"
            >
              <option value="FAANG">FAANG (High Volume DSA & Tech rounds)</option>
              <option value="Startup">Early Stage Startup (Product & Dev Heavy)</option>
              <option value="FinTech">FinTech / Quantitative (System Design & Speed)</option>
              <option value="Research">Academic / AI Research (ML & Algorithms)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-brand-yellow text-neutral-950 rounded-xl font-bold hover:bg-yellow-400 active:scale-98 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-4"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              "Initialize Advisor Board"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
