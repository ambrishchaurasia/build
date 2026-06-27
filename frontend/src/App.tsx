import { useState, useEffect } from "react";
import { CircleDot, GitBranch, Activity, ShieldCheck, History, User, Flame, Zap, RefreshCw } from "lucide-react";
import { authApi } from "./services/authApi";
import { dashboardApi } from "./services/dashboardApi";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ProfileOnboarding from "./pages/ProfileOnboarding";
import LeetcodeArena from "./pages/LeetcodeArena";
import ProjectsArena from "./pages/ProjectsArena";
import FitnessArena from "./pages/FitnessArena";
import HabitsArena from "./pages/HabitsArena";
import DailyLogs from "./pages/DailyLogs";
import AccountArena from "./pages/AccountArena";
import GoogleChooserPage from "./pages/GoogleChooserPage";
import GithubCallbackPage from "./pages/GithubCallbackPage";
import SplashScreen from "./pages/SplashScreen";


export default function App() {
  if (window.location.pathname === "/mock-google-login") {
    return <GoogleChooserPage />;
  }
  if (window.location.pathname === "/github-callback") {
    return <GithubCallbackPage />;
  }

  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [authScreen, setAuthScreen] = useState<"login" | "signup">("login");
  const [user, setUser] = useState<any>(null);
  const [profileOnboarded, setProfileOnboarded] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"leetcode" | "projects" | "fitness" | "habits" | "logs" | "account">("leetcode");
  const [showSplash, setShowSplash] = useState(true);

  // Load Session and Dashboard data
  const loadAppData = async () => {
    setLoading(true);
    try {
      if (token) {
        // Fetch current user details
        const meRes = await authApi.me();
        if (meRes.success) {
          setUser(meRes.user);
          
          if (!meRes.user.hasProfile) {
            setProfileOnboarded(false);
          } else {
            setProfileOnboarded(true);
            // Fetch dashboard telemetry
            const dashRes = await dashboardApi.getDashboard();
            if (dashRes.success) {
              setDashboardData(dashRes);
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to load session details", error);
      // If unauthorized, clear session
      handleLogout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppData();
  }, [token]);

  const handleLoginSuccess = (newToken: string) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  };

  const handleSignupSuccess = (newToken: string) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setDashboardData(null);
    setProfileOnboarded(true);
  };

  const handleOnboardingComplete = () => {
    setProfileOnboarded(true);
    loadAppData();
  };

  // Main screen routing loader
  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  if (loading && token) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-950 text-neutral-400">
        <RefreshCw className="w-8 h-8 text-brand-yellow animate-spin mb-4" />
        <span className="text-xs uppercase tracking-widest font-bold font-display">Initializing BUILD Arena...</span>
      </div>
    );
  }

  // Not Logged In
  if (!token) {
    return authScreen === "login" ? (
      <Login
        onLoginSuccess={handleLoginSuccess}
        onNavigateToSignup={() => setAuthScreen("signup")}
      />
    ) : (
      <Signup
        onSignupSuccess={handleSignupSuccess}
        onNavigateToLogin={() => setAuthScreen("login")}
      />
    );
  }

  // Profile onboarding flow
  if (!profileOnboarded) {
    return <ProfileOnboarding onOnboardingComplete={handleOnboardingComplete} />;
  }

  // Loaded Dashboard payload
  const telemetry = dashboardData?.telemetry;
  const goals = dashboardData?.goals || [];
  const insights = dashboardData?.insights || [];

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col">
      {/* Top Header Bar */}
      <header className="glass-panel sticky top-0 z-40 px-4 py-3 md:px-6 md:py-4 flex flex-col md:flex-row md:items-center justify-between border-b border-neutral-900 gap-3 md:gap-4">
        <div className="flex items-center gap-3">
          <div className="text-xl font-extrabold font-display tracking-tight text-white flex items-center gap-1.5 uppercase">
            <span className="w-6.5 h-6.5 bg-brand-yellow text-neutral-950 rounded-lg flex items-center justify-center text-sm font-bold">B</span>
            BUIL<span className="text-brand-yellow">D</span>
          </div>
          {user && (
            <div className="hidden md:flex items-center gap-2 border-l border-neutral-800 pl-3.5">
              <div className="w-5 h-5 rounded bg-neutral-900 border border-neutral-800 text-[10px] flex items-center justify-center font-bold text-neutral-400">
                Lvl {telemetry?.level || user.level}
              </div>
              <span className="text-xs text-neutral-400 font-semibold truncate max-w-[150px]" title={user.name}>{user.name}</span>
            </div>
          )}
        </div>

        {/* XP progress, flame stats, coins */}
        {telemetry && (
          <div className="flex items-center justify-between w-full md:w-auto gap-2 md:gap-4.5 flex-wrap">
            {/* XP progress bar */}
            <div className="flex items-center gap-1.5 md:gap-2.5 bg-neutral-950 px-2.5 md:px-3.5 py-1.5 rounded-xl border border-neutral-900">
              <span className="text-[9px] md:text-[10px] text-neutral-500 font-bold uppercase tracking-wider">XP:</span>
              <div className="w-16 md:w-24 bg-neutral-900 h-1.5 md:h-2 rounded-full overflow-hidden">
                <div
                  className="bg-brand-yellow h-full transition-all duration-1000"
                  style={{ width: `${(telemetry.xp % 1000) / 10}%` }}
                ></div>
              </div>
              <span className="text-[9px] md:text-[10px] text-white font-bold">
                {telemetry.xp % 1000}
                <span className="hidden sm:inline"> / 1000</span>
              </span>
            </div>

            {/* Streak flame */}
            <div className="flex items-center gap-1 md:gap-1.5 bg-neutral-950 px-2.5 md:px-3.5 py-1.5 rounded-xl border border-neutral-900">
              <Flame className="w-4 h-4 md:w-4.5 md:h-4.5 text-orange-500 animate-bounce" />
              <span className="text-[10px] md:text-xs font-black text-white">
                {telemetry.streakDays}
                <span className="hidden sm:inline"> Days</span>
              </span>
            </div>

            {/* Tokens */}
            <div className="flex items-center gap-1 md:gap-1.5 bg-neutral-950 px-2.5 md:px-3.5 py-1.5 rounded-xl border border-neutral-900">
              <Zap className="w-4 h-4 md:w-4.5 md:h-4.5 text-brand-yellow" />
              <span className="text-[10px] md:text-xs font-black text-white">
                {telemetry.tokens}
                <span className="hidden sm:inline"> XP Coins</span>
              </span>
            </div>

            {/* Account Settings Trigger (Top Right) */}
            <button
              onClick={() => setActiveTab("account")}
              className={`p-2 rounded-xl border transition-all cursor-pointer focus:outline-none flex items-center justify-center ${
                activeTab === "account"
                  ? "bg-brand-yellow text-neutral-950 border-brand-yellow shadow-md shadow-brand-yellow/10"
                  : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-white"
              }`}
              title="Account Settings"
            >
              <User className="w-4 h-4 md:w-4.5 md:h-4.5 shrink-0" />
            </button>
          </div>
        )}
      </header>

      {/* Main Body Layout */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto p-4 md:p-6 gap-6 pb-20 md:pb-6">
        {/* Navigation Sidebar (Desktop) / Navigation Bottom (Mobile) */}
        <nav className="fixed bottom-4 left-4 right-4 z-50 bg-neutral-950/90 backdrop-blur-lg border border-neutral-900/80 p-1.5 rounded-2xl shadow-xl shadow-black/40 md:relative md:bottom-auto md:left-auto md:right-auto md:z-30 md:bg-neutral-900/40 md:p-2.5 md:rounded-2xl md:border md:border-neutral-900 md:w-60 md:h-fit md:sticky md:top-28 shrink-0">
          <div className="flex flex-row md:flex-col gap-1 w-full justify-around md:justify-start">
            <button
              onClick={() => setActiveTab("leetcode")}
              className={`flex-1 md:flex-initial py-1.5 md:py-2.5 px-1 md:px-3.5 rounded-xl text-[9px] md:text-xs font-bold uppercase tracking-wider flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-2.5 transition-all focus:outline-none cursor-pointer ${
                activeTab === "leetcode"
                  ? "bg-brand-yellow text-neutral-950 shadow-md shadow-brand-yellow/15"
                  : "text-neutral-400 hover:bg-neutral-900/60 hover:text-white"
              }`}
            >
              <CircleDot className="w-4 h-4 shrink-0" />
              <span className="text-[9px] md:text-xs font-bold tracking-tight md:tracking-wider">LeetCode</span>
            </button>

            <button
              onClick={() => setActiveTab("projects")}
              className={`flex-1 md:flex-initial py-1.5 md:py-2.5 px-1 md:px-3.5 rounded-xl text-[9px] md:text-xs font-bold uppercase tracking-wider flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-2.5 transition-all focus:outline-none cursor-pointer ${
                activeTab === "projects"
                  ? "bg-brand-cyan text-neutral-950 shadow-md shadow-brand-cyan/15"
                  : "text-neutral-400 hover:bg-neutral-900/60 hover:text-white"
              }`}
            >
              <GitBranch className="w-4 h-4 shrink-0" />
              <span className="text-[9px] md:text-xs font-bold tracking-tight md:tracking-wider">Projects</span>
            </button>

            <button
              onClick={() => setActiveTab("fitness")}
              className={`flex-1 md:flex-initial py-1.5 md:py-2.5 px-1 md:px-3.5 rounded-xl text-[9px] md:text-xs font-bold uppercase tracking-wider flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-2.5 transition-all focus:outline-none cursor-pointer ${
                activeTab === "fitness"
                  ? "bg-brand-purple text-neutral-950 shadow-md shadow-brand-purple/15"
                  : "text-neutral-400 hover:bg-neutral-900/60 hover:text-white"
              }`}
            >
              <Activity className="w-4 h-4 shrink-0" />
              <span className="text-[9px] md:text-xs font-bold tracking-tight md:tracking-wider">
                Fitness<span className="hidden md:inline"> & Mind</span>
              </span>
            </button>

            <button
              onClick={() => setActiveTab("habits")}
              className={`flex-1 md:flex-initial py-1.5 md:py-2.5 px-1 md:px-3.5 rounded-xl text-[9px] md:text-xs font-bold uppercase tracking-wider flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-2.5 transition-all focus:outline-none cursor-pointer ${
                activeTab === "habits"
                  ? "bg-brand-pink text-neutral-950 shadow-md shadow-brand-pink/15"
                  : "text-neutral-400 hover:bg-neutral-900/60 hover:text-white"
              }`}
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span className="text-[9px] md:text-xs font-bold tracking-tight md:tracking-wider">
                Habits<span className="hidden md:inline"> Board</span>
              </span>
            </button>

            <button
              onClick={() => setActiveTab("logs")}
              className={`flex-1 md:flex-initial py-1.5 md:py-2.5 px-1 md:px-3.5 rounded-xl text-[9px] md:text-xs font-bold uppercase tracking-wider flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-2.5 transition-all focus:outline-none cursor-pointer ${
                activeTab === "logs"
                  ? "bg-white text-neutral-950 shadow-md shadow-white/10"
                  : "text-neutral-400 hover:bg-neutral-900/60 hover:text-white"
              }`}
            >
              <History className="w-4 h-4 shrink-0" />
              <span className="text-[9px] md:text-xs font-bold tracking-tight md:tracking-wider">
                <span className="hidden md:inline">Daily </span>Logs
              </span>
            </button>
          </div>
        </nav>

        {/* Content Body Switch */}
        <main className="flex-1 overflow-hidden min-w-0">
          {telemetry ? (
            <>
              {activeTab === "leetcode" && (
                <LeetcodeArena
                  telemetry={telemetry}
                  goals={goals}
                  insights={insights}
                  onRefresh={loadAppData}
                />
              )}
              {activeTab === "projects" && (
                <ProjectsArena
                  telemetry={telemetry}
                  goals={goals}
                  insights={insights}
                  onRefresh={loadAppData}
                />
              )}
              {activeTab === "fitness" && (
                <FitnessArena
                  telemetry={telemetry}
                  goals={goals}
                  insights={insights}
                  onRefresh={loadAppData}
                />
              )}
              {activeTab === "habits" && (
                <HabitsArena
                  telemetry={telemetry}
                  goals={goals}
                  insights={insights}
                  onRefresh={loadAppData}
                />
              )}
              {activeTab === "logs" && (
                <DailyLogs
                  goals={goals}
                  onRefresh={loadAppData}
                />
              )}
              {activeTab === "account" && (
                <AccountArena
                  user={user}
                  telemetry={telemetry}
                  onRefresh={loadAppData}
                  onLogout={handleLogout}
                />
              )}
            </>
          ) : (
            <div className="glass-panel p-10 rounded-3xl text-center border border-neutral-850">
              <RefreshCw className="w-6 h-6 text-brand-yellow animate-spin mx-auto mb-3" />
              <p className="text-sm text-neutral-400">Loading student dashboards and syncing advisor board...</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
