import { useState } from "react";
import axios from "axios";
import { authApi } from "../services/authApi";

interface SignupProps {
  onSignupSuccess: (token: string) => void;
  onNavigateToLogin: () => void;
}

export default function Signup({ onSignupSuccess, onNavigateToLogin }: SignupProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleAuth = async (targetEmail: string, targetName: string, avatarUrl?: string) => {
    setLoading(true);
    setError("");
    try {
      const data = await authApi.googleLogin({
        email: targetEmail,
        name: targetName,
        avatar: avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${targetName}`
      });
      if (data.success) {
        onSignupSuccess(data.token);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to authenticate via Google");
    } finally {
      setLoading(false);
    }
  };

  // Launch Google SSO popup (Real Google Login if Client ID is configured, otherwise fallback to local chooser)
  const launchGooglePopup = () => {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    // Check if Real Google Client ID is configured and GSI client is loaded
    if (googleClientId && (window as any).google?.accounts?.oauth2) {
      try {
        const client = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: googleClientId,
          scope: "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email",
          callback: async (tokenResponse: any) => {
            if (tokenResponse.access_token) {
              setLoading(true);
              try {
                // Fetch verified profile info from Google API
                const userInfoRes = await axios.get(
                  `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${tokenResponse.access_token}`
                );
                const { email: verifiedEmail, name: verifiedName, picture: verifiedPicture } = userInfoRes.data;
                await handleGoogleAuth(verifiedEmail, verifiedName, verifiedPicture);
              } catch (err) {
                setError("Failed to retrieve profile data from Google Identity Services");
                setLoading(false);
              }
            }
          }
        });
        client.requestAccessToken();
        return;
      } catch (err) {
        console.error("GSI token client initialization failed, running fallback chooser", err);
      }
    }

    // Fallback to simulated popup
    const width = 500;
    const height = 650;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    window.open(
      "/mock-google-login",
      "Google Sign In",
      `width=${width},height=${height},left=${left},top=${top},status=no,resizable=no`
    );

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "GOOGLE_AUTH_SUCCESS") {
        handleGoogleAuth(event.data.email, event.data.name);
        window.removeEventListener("message", handleMessage);
      }
    };

    window.addEventListener("message", handleMessage);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 px-4 relative">
      {/* Background radial ambient light glow */}
      <div className="absolute w-[400px] h-[400px] rounded-full bg-brand-yellow/10 blur-[80px] pointer-events-none"></div>

      <div className="w-full max-w-md glass-panel p-8 rounded-2xl shadow-2xl relative z-10 border border-neutral-800">
        <div className="text-center mb-8">
          <div className="inline-block px-3 py-1 bg-brand-yellow/10 border border-brand-yellow/30 text-brand-yellow rounded-full text-xs font-semibold tracking-wider uppercase mb-3">
            Register Character
          </div>
          <h1 className="text-3xl font-extrabold font-display tracking-tight text-white mb-2 uppercase">
            BUIL<span className="text-brand-yellow">D</span>
          </h1>
          <p className="text-sm text-neutral-400">
            Create an account to start tracking habits and streaks
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-950/40 border border-red-900/50 rounded-lg text-sm text-red-400 mb-6 text-center">
            {error}
          </div>
        )}

        <button
          onClick={launchGooglePopup}
          type="button"
          disabled={loading}
          className="w-full py-4 bg-neutral-900 hover:bg-neutral-850 text-white rounded-xl font-bold border border-neutral-800 hover:border-brand-yellow/30 transition-all cursor-pointer flex items-center justify-center gap-2.5 mb-6"
        >
          {loading ? (
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          ) : (
            <>
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#ea4335"
                  d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.488 0-6.315-2.827-6.315-6.315s2.827-6.315 6.315-6.315c1.558 0 2.978.568 4.076 1.503l3.056-3.056C19.14 2.308 15.932 1 12.24 1 5.926 1 12.24s4.926 11.24 11.24 11.24c6.315 0 11.24-4.925 11.24-11.24 0-.756-.08-1.488-.22-2.195H12.24z"
                />
              </svg>
              Continue with Google
            </>
          )}
        </button>

        <div className="text-center mt-6">
          <p className="text-sm text-neutral-500">
            Already registered?{" "}
            <button
              onClick={onNavigateToLogin}
              className="text-brand-yellow hover:underline focus:outline-none cursor-pointer font-semibold"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
