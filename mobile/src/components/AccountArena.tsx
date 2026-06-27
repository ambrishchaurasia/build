import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, Platform } from "react-native";
import { User, LogOut, RotateCw, CheckCircle2, CircleDot, GitBranch, Activity, Check } from "lucide-react-native";
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withSequence, withTiming } from "react-native-reanimated";
import { dashboardApi } from "../services/dashboardApi";
import apiClient from "../services/apiClient";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri, useAuthRequest } from "expo-auth-session";

WebBrowser.maybeCompleteAuthSession();

const githubDiscovery = {
  authorizationEndpoint: "https://github.com/login/oauth/authorize",
  tokenEndpoint: "https://github.com/login/oauth/access_token",
  revocationEndpoint: "https://github.com/settings/connections/applications/Iv23liyyefK1nObWxkG9",
};

function AnimatedCheckmark({ color = "#0a0a0a", size = 14 }) {
  const scale = useSharedValue(0.3);

  React.useEffect(() => {
    scale.value = withSequence(
      withSpring(1.3, { damping: 8, stiffness: 120 }),
      withTiming(1.0, { duration: 150 })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <Animated.View style={animatedStyle}>
      <Check color={color} size={size} strokeWidth={3.5} />
    </Animated.View>
  );
}

interface AccountArenaProps {
  user: any;
  telemetry: any;
  onRefresh: () => Promise<void>;
  onLogout: () => void;
}

export default function AccountArena({ user, telemetry, onRefresh, onLogout }: AccountArenaProps) {
  const [lcUsername, setLcUsername] = useState(telemetry?.leetcode?.username || "");
  const [ghUsername, setGhUsername] = useState("");
  const [syncingLC, setSyncingLC] = useState(false);
  const [syncingGH, setSyncingGH] = useState(false);
  const [message, setMessage] = useState("");

  const [showLCTick, setShowLCTick] = useState(false);
  const [showGHTick, setShowGHTick] = useState(false);
  const [showGHOAuthTick, setShowGHOAuthTick] = useState(false);

  const redirectUri = makeRedirectUri({
    scheme: "mobile"
  });

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: process.env.EXPO_PUBLIC_GITHUB_CLIENT_ID || "Iv23liyyefK1nObWxkG9",
      scopes: ["repo", "user"],
      redirectUri,
    },
    githubDiscovery
  );

  const [oauthProcessed, setOauthProcessed] = useState(false);

  React.useEffect(() => {
    if (response?.type === "success" && !oauthProcessed) {
      setOauthProcessed(true);
      const { code } = response.params;
      handleGithubAuthCode(code);
    }
  }, [response, oauthProcessed]);

  React.useEffect(() => {
    if (telemetry?.leetcode?.username) {
      setLcUsername(telemetry.leetcode.username);
    }
  }, [telemetry?.leetcode?.username]);

  // Sync LeetCode
  const handleSyncLeetCode = async () => {
    if (!lcUsername) return;
    setSyncingLC(true);
    setMessage("");
    try {
      await dashboardApi.syncMetrics({ leetcodeUsername: lcUsername });
      setMessage("Successfully synchronized LeetCode metrics!");
      await onRefresh();
      setShowLCTick(true);
      setTimeout(() => setShowLCTick(false), 1500);
    } catch (err) {
      setMessage("LeetCode sync failed. Check username and try again.");
    } finally {
      setSyncingLC(false);
    }
  };

  // Sync GitHub manually
  const handleSyncGithubManual = async () => {
    if (!ghUsername) return;
    setSyncingGH(true);
    setMessage("");
    try {
      await dashboardApi.syncMetrics({ githubUsername: ghUsername });
      setMessage("Successfully synchronized GitHub repositories!");
      await onRefresh();
      setShowGHTick(true);
      setTimeout(() => setShowGHTick(false), 1500);
    } catch (err) {
      setMessage("GitHub sync failed. Check username and try again.");
    } finally {
      setSyncingGH(false);
    }
  };

  // Handle GitHub OAuth Code
  const handleGithubAuthCode = async (code: string) => {
    setSyncingGH(true);
    setMessage("");
    try {
      const codeVerifier = request?.codeVerifier;
      const res = await apiClient.post("/api/auth/github/callback", { 
        code, 
        redirectUri, 
        codeVerifier,
        clientId: process.env.EXPO_PUBLIC_GITHUB_CLIENT_ID || "Iv23liyyefK1nObWxkG9"
      });
      if (res.data.success) {
        setMessage("GitHub linked successfully!");
        await onRefresh();
      } else {
        setMessage("Failed to link GitHub via OAuth");
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || "OAuth link failed.";
      Alert.alert("GitHub Sync Failed", errMsg);
      setMessage(errMsg);
    } finally {
      setSyncingGH(false);
    }
  };

  // Connect GitHub OAuth
  const handleConnectGithub = async () => {
    console.log("GitHub Redirect URI to configure in GitHub:", redirectUri);
    Alert.alert(
      "GitHub Setup",
      `Ensure this exact callback URL is set in your GitHub OAuth App:\n\n${redirectUri}`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Continue", onPress: () => promptAsync() }
      ]
    );
  };

  // Disconnect GitHub
  const handleDisconnectGithub = async () => {
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
      setShowGHOAuthTick(true);
      setTimeout(() => setShowGHOAuthTick(false), 1500);
    } catch (err) {
      setMessage("OAuth Sync failed. Try reconnecting.");
    } finally {
      setSyncingGH(false);
    }
  };

  return (
    <View className="flex-col gap-6">
      
      {/* Header Banner */}
      <View style={{ backgroundColor: "#ED7864" }} className="flex-col p-4 rounded-2xl">
        <View className="flex-row justify-between items-baseline mb-1.5">
          <Text className="text-[10px] font-bold text-white/80 uppercase tracking-widest">
            Advisor profile & sessions track
          </Text>
        </View>
        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center gap-2">
            <Text className="text-2xl font-black text-white uppercase tracking-tight">
              ACCOUNT SETTINGS
            </Text>
          </View>
          <View className="flex-row items-center gap-1.5 bg-neutral-950 px-3 py-1.5 rounded-xl">
            <User color="#ED7864" size={12} />
            <Text className="text-[9px] text-white font-bold uppercase tracking-wider">Settings & Sync</Text>
          </View>
        </View>
      </View>

      {message ? (
        <View className="p-3.5 bg-neutral-900 border border-neutral-800 rounded-xl flex-row items-center gap-2">
          <CheckCircle2 color="#98FB98" size={16} />
          <Text className="text-xs text-brand-yellow font-bold flex-1">{message}</Text>
        </View>
      ) : null}

      {/* Main Settings List */}
      <View className="flex-col gap-6">
        
        {/* Profile Card */}
        <View className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl flex-col gap-4">
          <Text className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
            Profile Session
          </Text>
          
          <View className="flex-col gap-2">
            <View className="flex-row justify-between items-center p-3 bg-neutral-950/40 border border-neutral-850/60 rounded-xl">
              <Text className="text-xs text-neutral-400">Name:</Text>
              <Text 
                numberOfLines={1}
                ellipsizeMode="tail"
                className="text-sm font-bold text-white italic text-right flex-1 ml-4" 
                style={{ fontStyle: "italic", fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', letterSpacing: 0.5, paddingRight: 6 }}
              >
                {user?.name}
              </Text>
            </View>

            <View className="flex-row justify-between items-center p-3 bg-neutral-950/40 border border-neutral-850/60 rounded-xl">
              <Text className="text-xs text-neutral-400">Current Level:</Text>
              <Text className="text-sm font-bold text-brand-yellow uppercase">Level {telemetry?.level}</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={onLogout}
            className="w-full mt-2 p-3 bg-rose-600/10 border border-rose-900/30 rounded-xl flex-row items-center justify-center gap-2"
          >
            <LogOut color="#f43f5e" size={16} />
            <Text className="text-rose-500 font-bold text-xs uppercase tracking-wider">Logout from Session</Text>
          </TouchableOpacity>
        </View>

        {/* LeetCode Sync Card */}
        <View className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl flex-col gap-4">
          <View className="flex-row items-center gap-1.5">
            <CircleDot color="#98FB98" size={16} />
            <Text className="text-sm font-bold text-white uppercase tracking-tight">LeetCode Integration</Text>
          </View>
          <Text className="text-xs text-neutral-400 leading-normal">
            Specify your LeetCode username to pull your total completed algorithms, rankings, and contest ratings directly.
          </Text>

          <View className="flex-row gap-2 pt-2">
            <TextInput
              placeholder="LeetCode Username"
              placeholderTextColor="#525252"
              value={lcUsername}
              onChangeText={setLcUsername}
              className="flex-1 px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white"
            />
            <TouchableOpacity
              onPress={handleSyncLeetCode}
              disabled={syncingLC}
              className="px-4 py-2.5 bg-brand-yellow rounded-xl flex-row items-center justify-center"
            >
              {syncingLC ? (
                <RotateCw color="#0a0a0a" size={14} className="animate-spin" />
              ) : showLCTick ? (
                <AnimatedCheckmark color="#0a0a0a" size={14} />
              ) : (
                <Text className="text-neutral-950 font-bold text-xs uppercase tracking-wider">Sync</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* GitHub Integration Card */}
        <View className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl flex-col gap-4">
          <View className="flex-row items-center gap-1.5">
            <GitBranch color="#6495ED" size={16} />
            <Text className="text-sm font-bold text-white uppercase tracking-tight">GitHub Portfolio Sync</Text>
          </View>
          <Text className="text-xs text-neutral-400 leading-normal">
            Link via developer OAuth or input your public username to retrieve commits, contributions, and PR data.
          </Text>

          {user?.hasGithubToken ? (
            <View className="flex-col gap-3 pt-2">
              <View className="flex-row items-center justify-between p-3 bg-neutral-950 border border-neutral-800 rounded-xl">
                <View className="flex-row items-center gap-2">
                  <View className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <Text className="text-xs text-neutral-400 font-bold">Connected via OAuth</Text>
                </View>
                <TouchableOpacity
                  onPress={handleDisconnectGithub}
                  disabled={syncingGH}
                  className="px-2.5 py-1.5 bg-rose-600/10 border border-rose-900/30 rounded-lg"
                >
                  <Text className="text-rose-500 text-[10px] font-bold uppercase tracking-wider">Disconnect</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                onPress={handleSyncGithubOAuth}
                disabled={syncingGH}
                className="w-full py-3 bg-brand-cyan rounded-xl flex-row items-center justify-center gap-1.5"
              >
                {syncingGH ? (
                  <RotateCw color="#0a0a0a" size={14} className="animate-spin" />
                ) : showGHOAuthTick ? (
                  <AnimatedCheckmark color="#0a0a0a" size={14} />
                ) : (
                  <Text className="text-neutral-950 font-bold text-xs uppercase tracking-wider">Sync Repositories Telemetry</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View className="flex-col gap-3 pt-2">
              <View className="flex-row gap-2">
                <TextInput
                  placeholder="GitHub Username"
                  placeholderTextColor="#525252"
                  value={ghUsername}
                  onChangeText={setGhUsername}
                  className="flex-1 px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white"
                />
                <TouchableOpacity
                  onPress={handleSyncGithubManual}
                  disabled={syncingGH}
                  className="px-4 py-2.5 bg-brand-cyan rounded-xl flex-row items-center justify-center"
                >
                  {syncingGH ? (
                    <RotateCw color="#0a0a0a" size={14} className="animate-spin" />
                  ) : showGHTick ? (
                    <AnimatedCheckmark color="#0a0a0a" size={14} />
                  ) : (
                    <Text className="text-neutral-950 font-bold text-xs uppercase tracking-wider">Sync</Text>
                  )}
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                onPress={handleConnectGithub}
                className="w-full py-3 bg-neutral-950 border border-neutral-850 rounded-xl flex-row items-center justify-center gap-1.5"
              >
                <Text className="text-white font-bold text-xs uppercase tracking-wider">Connect Developer OAuth</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

      </View>
    </View>
  );
}
