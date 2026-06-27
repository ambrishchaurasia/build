import { useEffect, useState, useRef } from "react";
import apiClient from "../services/apiClient";
import { RefreshCw, CheckCircle2, XCircle } from "lucide-react";

export default function GithubCallbackPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const requested = useRef(false);

  useEffect(() => {
    if (requested.current) return;
    requested.current = true;

    const exchangeCode = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");

        if (!code) {
          setStatus("error");
          setErrorMsg("No authorization code received from GitHub.");
          return;
        }

        const res = await apiClient.post("/api/auth/github/callback", { 
          code,
          clientId: import.meta.env.VITE_GITHUB_CLIENT_ID
        });

        if (res.data?.success) {
          setStatus("success");
          setTimeout(() => {
            window.location.href = "/";
          }, 1500);
        } else {
          setStatus("error");
          setErrorMsg(res.data?.message || "Verification failed");
        }
      } catch (err: any) {
        console.error(err);
        setStatus("error");
        setErrorMsg(err.response?.data?.message || "Failed to link GitHub account.");
      }
    };

    exchangeCode();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 px-4 relative">
      <div className="absolute w-[300px] h-[300px] rounded-full bg-brand-cyan/10 blur-[80px] pointer-events-none"></div>

      <div className="w-full max-w-md glass-panel p-8 rounded-2xl shadow-2xl relative z-10 border border-neutral-800 text-center space-y-6">
        <div className="text-xl font-extrabold font-display tracking-tight text-white flex items-center justify-center gap-1.5 uppercase">
          <span className="w-6.5 h-6.5 bg-brand-cyan text-neutral-950 rounded-lg flex items-center justify-center text-sm font-bold">B</span>
          BUIL<span className="text-brand-cyan">D</span>
        </div>

        {status === "loading" && (
          <div className="space-y-4">
            <RefreshCw className="w-10 h-10 text-brand-cyan animate-spin mx-auto" />
            <h2 className="text-lg font-bold text-white">Linking GitHub Account</h2>
            <p className="text-xs text-neutral-400">Authenticating with GitHub and syncing developer telemetry...</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <h2 className="text-lg font-bold text-white">Connection Successful!</h2>
            <p className="text-xs text-neutral-400">Your GitHub account has been connected. Redirecting to Arena...</p>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <XCircle className="w-12 h-12 text-rose-500 mx-auto" />
            <h2 className="text-lg font-bold text-white">Linking Failed</h2>
            <p className="text-xs text-rose-400">{errorMsg}</p>
            <button
              onClick={() => { window.location.href = "/"; }}
              className="mt-2 px-4 py-2 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              Back to Arena
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
