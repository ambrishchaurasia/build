import { useState } from "react";
import { User, LogOut, RotateCw, CheckCircle, CircleDot, GitBranch, Activity } from "lucide-react";
import { dashboardApi } from "../services/dashboardApi";

interface AccountArenaProps {
  user: any;
  telemetry: any;
  onRefresh: () => Promise<void>;
  onLogout: () => void;
}

export default function AccountArena({ user, telemetry, onRefresh, onLogout }: AccountArenaProps) {
  const [lcUsername, setLcUsername] = useState("");
  const [ghUsername, setGhUsername] = useState("");
  const [syncingLC, setSyncingLC] = useState(false);
  const [syncingGH, setSyncingGH] = useState(false);
  const [syncingFIT, setSyncingFIT] = useState(false);
  const [message, setMessage] = useState("");

  // Sync LeetCode
  const handleSyncLeetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lcUsername) return;
    setSyncingLC(true);
    setMessage("");
    try {
      await dashboardApi.syncMetrics({ leetcodeUsername: lcUsername });
      setMessage("Successfully synchronized LeetCode metrics!");
      await onRefresh();
    } catch (err) {
      setMessage("LeetCode sync failed. Check username and try again.");
    } finally {
      setSyncingLC(false);
    }
  };

  // Sync GitHub manually
  const handleSyncGithubManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ghUsername) return;
    setSyncingGH(true);
    setMessage("");
    try {
      await dashboardApi.syncMetrics({ githubUsername: ghUsername });
      setMessage("Successfully synchronized GitHub repositories!");
      await onRefresh();
    } catch (err) {
      setMessage("GitHub sync failed. Check username and try again.");
    } finally {
      setSyncingGH(false);
    }
  };

  // Connect GitHub OAuth
  const handleConnectGithub = () => {
    const githubClientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
    if (githubClientId) {
      window.location.href = `https://github.com/login/oauth/authorize?client_id=${githubClientId}&scope=repo,user`;
    } else {
      window.location.href = `/github-callback?code=simulated_code_${Math.random().toString(36).substring(2, 10)}`;
    }
  };

  // Disconnect GitHub
  const handleDisconnectGithub = async () => {
    if (!window.confirm("Are you sure you want to disconnect your GitHub account?")) return;
    setSyncingGH(true);
    setMessage("");
    try {
      await dashboardApi.disconnectGithub();
      setMessage("Successfully disconnected GitHub account!");
      await onRefresh();
    } catch (err) {
      setMessage("Disconnect failed.");
    } finally {
      setSyncingGH(false);
    }
  };

  // Sync GitHub OAuth Telemetry
  const handleSyncGithubOAuth = async () => {
    setSyncingGH(true);
    setMessage("");
    try {
      await dashboardApi.syncMetrics({});
      setMessage("Successfully synchronized GitHub OAuth stats!");
      await onRefresh();
    } catch (err) {
      setMessage("OAuth Sync failed. Try reconnecting.");
    } finally {
      setSyncingGH(false);
    }
  };

  // Connect & Sync Google Fit
  const handleConnectGoogleFit = () => {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    
    if (googleClientId && (window as any).google?.accounts?.oauth2) {
      try {
        setSyncingFIT(true);
        setMessage("");
        const client = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: googleClientId,
          scope: "https://www.googleapis.com/auth/fitness.activity.read",
          callback: async (tokenResponse: any) => {
            if (tokenResponse.access_token) {
              try {
                const res = await dashboardApi.syncGoogleFit({ accessToken: tokenResponse.access_token });
                if (res.success) {
                  setMessage("Successfully synced Google Fit metrics!");
                  await onRefresh();
                } else {
                  setMessage("Failed to sync Google Fit data.");
                }
              } catch (err) {
                setMessage("Failed to sync Google Fit data.");
              } finally {
                setSyncingFIT(false);
              }
            } else {
              setSyncingFIT(false);
            }
          }
        });
        client.requestAccessToken();
        return;
      } catch (err) {
        console.error("GSI token client initialization failed", err);
      }
    }

    triggerSimulatedSync();
  };

  const triggerSimulatedSync = async () => {
    setSyncingFIT(true);
    setMessage("");
    try {
      const res = await dashboardApi.syncGoogleFit({ accessToken: "simulated_fit_token_" + Math.random().toString(36).substring(2, 10) });
      if (res.success) {
        setMessage("Successfully synchronized Google Fit stats (Simulated fallback)!");
        await onRefresh();
      } else {
        setMessage("Failed to sync simulated Google Fit data.");
      }
    } catch (err) {
      setMessage("Failed to sync simulated Google Fit data.");
    } finally {
      setSyncingFIT(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-neutral-900/60 border border-neutral-900 rounded-2xl">
        <div>
          <h2 className="text-2xl font-extrabold text-white font-display flex items-center gap-2">
            <User className="text-brand-yellow w-6 h-6" />
            Account Settings
          </h2>
          <p className="text-sm text-neutral-400 mt-1">
            Manage your profiles, OAuth connections, data synchronization settings, and sessions.
          </p>
        </div>
      </div>

      {message && (
        <div className="p-3.5 bg-neutral-900 border border-neutral-850 text-xs text-brand-yellow rounded-xl flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Profile Card */}
        <div className="glass-panel p-6 rounded-2xl space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Profile Session
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-neutral-950 border border-neutral-900 rounded-xl gap-4">
                <span className="text-xs text-neutral-400 shrink-0">Name:</span>
                <span className="text-sm font-bold text-white truncate max-w-[200px]" title={user?.name}>{user?.name}</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-neutral-950 border border-neutral-900 rounded-xl">
                <span className="text-xs text-neutral-400">Current Level:</span>
                <span className="text-sm font-bold text-brand-yellow uppercase">
                  Level {telemetry?.level}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="w-full mt-4 p-3 bg-rose-600/10 border border-rose-900/30 hover:bg-rose-600 hover:text-white text-rose-400 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Logout from Session
          </button>
        </div>

        {/* LeetCode Sync Card */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <CircleDot className="text-brand-yellow w-4 h-4" />
            LeetCode Integration
          </h3>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Specify your LeetCode username to pull your total completed algorithms, rankings, and contest ratings directly.
          </p>

          <form onSubmit={handleSyncLeetCode} className="flex gap-2 pt-2">
            <input
              type="text"
              placeholder="LeetCode Username"
              value={lcUsername}
              onChange={(e) => setLcUsername(e.target.value)}
              className="flex-1 px-3.5 py-2 bg-neutral-950 border border-neutral-900 rounded-xl text-xs text-white focus:outline-none focus:border-brand-yellow/50"
            />
            <button
              type="submit"
              disabled={syncingLC}
              className="px-4 py-2 bg-brand-yellow text-neutral-950 font-bold rounded-xl text-xs flex items-center gap-1.5 hover:bg-yellow-400 transition-all cursor-pointer"
            >
              {syncingLC ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : "Sync Data"}
            </button>
          </form>
        </div>

        {/* GitHub Integration Card */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <GitBranch className="text-brand-cyan w-4 h-4" />
            GitHub Portfolio Sync
          </h3>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Link via developer OAuth or input your public username to retrieve commits, contributions, and PR data.
          </p>

          {user?.hasGithubToken ? (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between p-3 bg-neutral-950 border border-neutral-900 rounded-xl">
                <span className="text-xs text-neutral-400 font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Connected via OAuth
                </span>
                <button
                  type="button"
                  onClick={handleDisconnectGithub}
                  disabled={syncingGH}
                  className="px-2.5 py-1 bg-rose-600/10 hover:bg-rose-600 hover:text-white border border-rose-900/30 text-rose-400 rounded-lg text-[10px] font-bold transition-all"
                >
                  Disconnect
                </button>
              </div>
              <button
                type="button"
                onClick={handleSyncGithubOAuth}
                disabled={syncingGH}
                className="w-full py-2.5 bg-brand-cyan text-neutral-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 hover:bg-cyan-400 transition-all cursor-pointer"
              >
                {syncingGH ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : "Sync Repositories Telemetry"}
              </button>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <form onSubmit={handleSyncGithubManual} className="flex gap-2">
                <input
                  type="text"
                  placeholder="GitHub Username"
                  value={ghUsername}
                  onChange={(e) => setGhUsername(e.target.value)}
                  className="flex-1 px-3.5 py-2 bg-neutral-950 border border-neutral-900 rounded-xl text-xs text-white focus:outline-none focus:border-brand-cyan/50"
                />
                <button
                  type="submit"
                  disabled={syncingGH}
                  className="px-4 py-2 bg-brand-cyan text-neutral-950 font-bold rounded-xl text-xs flex items-center gap-1.5 hover:bg-cyan-400 transition-all cursor-pointer"
                >
                  {syncingGH ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : "Sync"}
                </button>
              </form>
              <button
                type="button"
                onClick={handleConnectGithub}
                className="w-full py-2.5 bg-neutral-900 border border-neutral-850 hover:border-brand-cyan/35 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                Connect Developer OAuth Securely
              </button>
            </div>
          )}
        </div>

        {/* Google Fit Card */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="text-brand-purple w-4 h-4" />
            Google Fit Fitness Sync
          </h3>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Synchronize steps count delta and active exercise workout days from your Google account.
          </p>

          <div className="pt-2">
            {user?.hasGoogleFitToken ? (
              <div className="flex items-center justify-between p-3 bg-neutral-950 border border-neutral-900 rounded-xl">
                <span className="text-xs text-neutral-400 font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Google Fit Linked
                </span>
                <button
                  onClick={handleConnectGoogleFit}
                  disabled={syncingFIT}
                  className="px-3.5 py-1.5 bg-brand-purple text-neutral-950 font-bold rounded-lg text-xs hover:bg-purple-400 transition-all cursor-pointer flex items-center gap-1"
                >
                  {syncingFIT ? <RotateCw className="w-3 h-3 animate-spin" /> : "Sync Fit"}
                </button>
              </div>
            ) : (
              <button
                onClick={handleConnectGoogleFit}
                disabled={syncingFIT}
                className="w-full py-2.5 bg-brand-purple text-neutral-950 font-bold rounded-xl text-xs hover:bg-purple-400 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                {syncingFIT ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : "Connect Google Fit Telemetry"}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
