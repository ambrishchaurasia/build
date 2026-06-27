import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Dimensions, Modal, Vibration, StyleSheet, Platform } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CircleDot, GitBranch, Activity, ShieldCheck, History, User, Flame, Zap, CheckSquare, Check } from "lucide-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withSpring,
  interpolateColor,
  useDerivedValue,
  withTiming,
  withDelay,
  SharedValue,
  runOnJS,
  Easing,
  withRepeat,
  withSequence,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { GlassView } from "expo-glass-effect";

import { authApi } from "../services/authApi";
import { dashboardApi } from "../services/dashboardApi";

import LeetcodeArena from "../components/LeetcodeArena";
import ProjectsArena from "../components/ProjectsArena";
import FitnessArena from "../components/FitnessArena";
import HabitsArena from "../components/HabitsArena";
import DailyTasks from "../components/DailyTasks";
import AccountArena from "../components/AccountArena";

type TabType = "leetcode" | "projects" | "fitness" | "habits" | "logs" | "account";

const AnimatedPath = Animated.createAnimatedComponent(Path);

// Flame particle animation removed

// Helper to color active tabs (marked as worklet for UI thread access)
const getTabColor = (tab: TabType) => {
  'worklet';
  switch (tab) {
    case "leetcode": return "#98FB98"; // Pale green
    case "projects": return "#6495ED"; // Cornflower blue
    case "fitness": return "#00D084";  // Medium spring green
    case "habits": return "#FF840D";   // Sunset orange
    case "logs": return "#ffffff";      // White
    case "account": return "#ED7864";   // Lemon Yellow
    default: return "#737373";
  }
};

interface TabButtonProps {
  index: number;
  tab: TabType;
  activeTab: TabType;
  activeIndexShared: SharedValue<number>;
  onPress: () => void;
  getTabColor: (tab: TabType) => string;
}

function TabButton({ index, tab, activeTab, activeIndexShared, onPress, getTabColor }: TabButtonProps) {
  const distance = useDerivedValue(() => {
    return Math.abs(activeIndexShared.value - index);
  });

  const iconStyle = useAnimatedStyle(() => {
    const isClose = distance.value < 0.5;
    const translateY = isClose ? -19 : 0; // Adjusted to -19 to align icon center (at y=14.5) with bubble center (at y=15)
    const scale = isClose ? 1.15 : 1.0;
    return {
      transform: [
        { translateY: withSpring(translateY, { damping: 30, stiffness: 220, overshootClamping: true }) },
        { scale: withSpring(scale, { damping: 30, stiffness: 220, overshootClamping: true }) }
      ],
    };
  });

  const textStyle = useAnimatedStyle(() => {
    const isClose = distance.value < 0.5;
    const opacity = isClose ? 0 : 1;
    const translateY = isClose ? 8 : 0;
    return {
      opacity: withSpring(opacity, { damping: 30, stiffness: 220, overshootClamping: true }),
      transform: [
        { translateY: withSpring(translateY, { damping: 30, stiffness: 220, overshootClamping: true }) }
      ],
    };
  });

  const getIcon = () => {
    const color = activeTab === tab ? "#0a0a0a" : "#737373";
    const size = 20;
    switch (tab) {
      case "leetcode": return <CircleDot color={color} size={size} />;
      case "projects": return <GitBranch color={color} size={size} />;
      case "fitness": return <Activity color={color} size={size} />;
      case "habits": return <ShieldCheck color={color} size={size} />;
      case "logs": return <CheckSquare color={color} size={size} />;
      default: return null;
    }
  };

  const getLabel = () => {
    switch (tab) {
      case "leetcode": return "LeetCode";
      case "projects": return "Projects";
      case "fitness": return "Fitness";
      case "habits": return "Habits";
      case "logs": return "Tasks";
      default: return "";
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className="flex-1 items-center justify-center h-full pt-3"
    >
      <Animated.View style={[{ alignItems: "center", justifyContent: "center" }, iconStyle]}>
        {getIcon()}
      </Animated.View>
      <Animated.Text
        style={[
          textStyle,
          {
            color: activeTab === tab ? getTabColor(tab) : "#737373",
            fontSize: 9,
            fontWeight: "bold",
            marginTop: 4,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }
        ]}
      >
        {getLabel()}
      </Animated.Text>
    </TouchableOpacity>
  );
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("logs");
  const [user, setUser] = useState<any>(null);

  // Animated Tab Bar Values
  const tabNames: TabType[] = ["logs", "leetcode", "projects", "fitness", "habits"];
  const activeIndex = tabNames.indexOf(activeTab);

  const activeIndexShared = useSharedValue(0); // Index 0 represents the Tasks tab
  const circleOpacityShared = useSharedValue(1);
  const containerWidthShared = useSharedValue(0);
  const [containerWidth, setContainerWidth] = useState(0);

  const onContainerLayout = (e: any) => {
    const w = e.nativeEvent.layout.width;
    setContainerWidth(w);
    containerWidthShared.value = w;
  };

  useEffect(() => {
    if (activeIndex === -1) {
      activeIndexShared.value = withSpring(-1.5, { damping: 30, stiffness: 220, overshootClamping: true });
      circleOpacityShared.value = withSpring(0, { damping: 30, stiffness: 220, overshootClamping: true });
    } else {
      activeIndexShared.value = withSpring(activeIndex, { damping: 30, stiffness: 220, overshootClamping: true });
      circleOpacityShared.value = withSpring(1, { damping: 30, stiffness: 220, overshootClamping: true });
    }
  }, [activeTab]);

  const animatedProps = useAnimatedProps(() => {
    const width = containerWidthShared.value;
    if (width === 0) return { d: "" };
    const tabWidth = width / 5;
    const x = (activeIndexShared.value + 0.5) * tabWidth;
    
    const path = `M 0 15
      L ${x - 40} 15
      C ${x - 22} 15, ${x - 18} 39, ${x} 39
      C ${x + 18} 39, ${x + 22} 15, ${x + 40} 15
      L ${width} 15
      L ${width} 90
      L 0 90
      Z`;
    return { d: path };
  });

  const animatedBorderProps = useAnimatedProps(() => {
    const width = containerWidthShared.value;
    if (width === 0) return { d: "" };
    const tabWidth = width / 5;
    const x = (activeIndexShared.value + 0.5) * tabWidth;
    
    const path = `M 0 15
      L ${x - 40} 15
      C ${x - 22} 15, ${x - 18} 39, ${x} 39
      C ${x + 18} 39, ${x + 22} 15, ${x + 40} 15
      L ${width} 15`;
    return { d: path };
  });

  const circleAnimatedStyle = useAnimatedStyle(() => {
    const width = containerWidthShared.value;
    if (width === 0) return { transform: [{ translateX: 0 }] };
    const tabWidth = width / 5;
    const x = (activeIndexShared.value + 0.5) * tabWidth;
    return {
      transform: [
        { translateX: x - 22 },
      ],
    };
  });

  const circleColorStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: getTabColor(activeTab),
      opacity: circleOpacityShared.value,
    };
  });
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCompletionOverlay, setShowCompletionOverlay] = useState(false);

  const loadAppData = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        router.replace("/login");
        return;
      }

      // Fetch user and dashboard stats
      const meRes = await authApi.me();
      if (meRes.success) {
        setUser(meRes.user);
        
        if (!meRes.user.hasProfile) {
          router.replace("/onboarding");
          return;
        }

        const dashRes = await dashboardApi.getDashboard();
        if (dashRes.success) {
          setDashboardData(dashRes);
        }
      } else {
        await AsyncStorage.removeItem("token");
        router.replace("/login");
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAppData();
  }, []);

  useEffect(() => {
    dashboardApi.onToggleGoalCallback = (res) => {
      if (res && res.allTasksCompleted) {
        setShowCompletionOverlay(true);
      }
    };
    return () => {
      dashboardApi.onToggleGoalCallback = null;
    };
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadAppData(false);
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem("token");
    router.replace("/login");
  };

  if (loading) {
    return (
      <View className="flex-1 bg-neutral-950 items-center justify-center">
        <ActivityIndicator size="large" color="#98FB98" />
        <Text className="text-neutral-400 text-xs font-bold uppercase tracking-widest mt-4">
          Syncing Arenas...
        </Text>
      </View>
    );
  }

  const telemetry = dashboardData?.telemetry || { xp: 0, level: 1, streakDays: 0, tokens: 0 };
  const goals = dashboardData?.goals || [];
  const insights = dashboardData?.insights || [];



  return (
    <View className="flex-1 bg-neutral-950">
      
      {/* Top Header Bar */}
      <View className="bg-neutral-900 border-b border-neutral-850 p-4 pt-16 flex-col gap-3">
        <View className="flex-row justify-between items-center">
          {/* Logo / App Name */}
          <View className="flex-row items-center gap-1.5">
            <Text style={{ fontFamily: "Akira-Expanded", fontSize: 18, color: "#ffffff", letterSpacing: 0.5, marginLeft: 16 }}>
              BUILD
            </Text>
          </View>

          {/* Level Info & Account Button */}
          <View className="flex-row items-center gap-2">
            {user && (
              <View className="flex-row items-center gap-2 bg-neutral-950 px-2.5 py-1 rounded-lg border border-neutral-800">
                <Text className="text-[10px] text-neutral-400 font-bold uppercase">Lvl {telemetry.level || user.level}</Text>
                <Text 
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  className="text-xs text-white font-bold italic" 
                  style={{ fontStyle: "italic", fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', letterSpacing: 0.5, paddingRight: 8, maxWidth: 110 }}
                >
                  {user.name}
                </Text>
              </View>
            )}

            {/* Account Settings Trigger */}
            <TouchableOpacity
              onPress={() => setActiveTab("account")}
              className="p-2 rounded-lg border items-center justify-center"
              style={{
                backgroundColor: activeTab === "account" ? "#ED7864" : "#0a0a0a",
                borderColor: activeTab === "account" ? "#ED7864" : "#1f1f1f",
              }}
            >
              <User color={activeTab === "account" ? "#ffffff" : "#a3a3a3"} size={14} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Telemetry Stats Bar */}
        <View className="flex-row justify-between items-center gap-2 mt-1">
          {/* XP Coin Bar */}
          <View className="flex-1 flex-row items-center bg-neutral-950 px-2.5 py-1.5 rounded-xl border border-neutral-800 gap-1.5">
            <Text className="text-[9px] text-neutral-500 font-black uppercase">XP</Text>
            <View className="flex-1 bg-neutral-900 h-1.5 rounded-full overflow-hidden">
              <View
                style={{ width: `${(telemetry.xp % 1000) / 10}%`, backgroundColor: "#98FB98" }}
                className="h-full"
              />
            </View>
            <Text className="text-[9px] text-white font-bold">{telemetry.xp % 1000}</Text>
          </View>

          {/* Streak Days */}
          <View className="flex-row items-center bg-neutral-950 px-2.5 py-1.5 rounded-xl border border-neutral-800 gap-1">
            <Flame color="#f97316" size={14} className="animate-bounce" />
            <Text className="text-[10px] font-black text-white">{telemetry.streakDays}d</Text>
          </View>

          {/* Zap Coins */}
          <View className="flex-row items-center bg-neutral-950 px-2.5 py-1.5 rounded-xl border border-neutral-800 gap-1">
            <Zap color="#98FB98" size={14} />
            <Text className="text-[10px] font-black text-white">{telemetry.tokens}</Text>
          </View>
        </View>
      </View>

      {/* Main Tab Content */}
      <ScrollView
        className="flex-1 px-4 py-4"
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#98FB98" />
        }
      >
        {activeTab === "leetcode" && (
          <LeetcodeArena
            telemetry={telemetry}
            goals={goals}
            insights={insights}
            onRefresh={() => loadAppData(false)}
          />
        )}
        {activeTab === "projects" && (
          <ProjectsArena
            telemetry={telemetry}
            goals={goals}
            insights={insights}
            onRefresh={() => loadAppData(false)}
          />
        )}
        {activeTab === "fitness" && (
          <FitnessArena
            telemetry={telemetry}
            goals={goals}
            insights={insights}
            onRefresh={() => loadAppData(false)}
          />
        )}
        {activeTab === "habits" && (
          <HabitsArena
            telemetry={telemetry}
            goals={goals}
            insights={insights}
            onRefresh={() => loadAppData(false)}
          />
        )}
        {activeTab === "logs" && (
          <DailyTasks
            goals={goals}
            onRefresh={() => loadAppData(false)}
          />
        )}
        {activeTab === "account" && (
          <AccountArena
            user={user}
            telemetry={telemetry}
            onRefresh={() => loadAppData(false)}
            onLogout={handleLogout}
          />
        )}
      </ScrollView>

      {/* Premium Animated Curved Bottom Navigation Bar */}
      <View
        onLayout={onContainerLayout}
        className="absolute bottom-0 left-0 right-0 h-[80px] z-50 flex-row"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        {/* SVG background with curved cutout */}
        {containerWidth > 0 && (
          <Svg width={containerWidth} height={90} style={{ position: "absolute", bottom: 0 }}>
            <AnimatedPath
              animatedProps={animatedProps}
              fill="#171717"
            />
            <AnimatedPath
              animatedProps={animatedBorderProps}
              fill="none"
              stroke="#262626"
              strokeWidth={1.2}
            />
          </Svg>
        )}

        {/* Animated Elevated Active Circle */}
        {containerWidth > 0 && (
          <Animated.View
            style={[
              {
                position: "absolute",
                top: -7, // (topEdge=15) - (radius=22) = -7
                width: 44,
                height: 44,
                borderRadius: 22,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 4,
              },
              circleAnimatedStyle,
              circleColorStyle,
            ]}
          />
        )}

        {/* Interactive Tab Buttons */}
        <View className="absolute inset-x-0 top-0 bottom-3 flex-row items-center justify-around">
          {tabNames.map((tab, index) => (
            <TabButton
              key={tab}
              index={index}
              tab={tab}
              activeTab={activeTab}
              activeIndexShared={activeIndexShared}
              onPress={() => setActiveTab(tab)}
              getTabColor={getTabColor}
            />
          ))}
        </View>
      </View>

      {/* Celebration Completion Overlay */}
      <CompletionOverlay 
        visible={showCompletionOverlay} 
        onClose={() => setShowCompletionOverlay(false)} 
      />

    </View>
  );
}

const PARTICLE_COUNT = 15;
const particles = Array.from({ length: PARTICLE_COUNT }).map((_, i) => {
  const angle = (i * 2 * Math.PI) / PARTICLE_COUNT + (Math.random() * 0.2 - 0.1);
  const distance = 80 + Math.random() * 70;
  const tx = Math.cos(angle) * distance;
  const ty = Math.sin(angle) * distance;
  const size = 12 + Math.random() * 10;
  const emojis = ["✨", "⭐", "🪙", "🎉", "🔥", "🚀"];
  const type = emojis[i % emojis.length];
  const rot = (Math.random() - 0.5) * 720;
  return { id: i, tx, ty, size, type, rot };
});

interface ParticleViewProps {
  particle: { tx: number; ty: number; size: number; type: string; rot: number };
  progress: SharedValue<number>;
}

function ParticleView({ particle, progress }: ParticleViewProps) {
  const animStyle = useAnimatedStyle(() => {
    const p = progress.value;
    const translateX = p * particle.tx;
    const translateY = p * particle.ty;
    
    let scale = 0;
    if (p < 0.15) {
      scale = (p / 0.15) * 1.3;
    } else if (p < 0.85) {
      scale = 1.3 - ((p - 0.15) / 0.7) * 0.5;
    } else {
      scale = Math.max(0, 0.8 - ((p - 0.85) / 0.15) * 0.8);
    }

    const opacity = p < 0.75 ? 1.0 : Math.max(0, 1.0 - (p - 0.75) / 0.25);
    const rotate = `${p * particle.rot}deg`;

    return {
      transform: [{ translateX }, { translateY }, { scale }, { rotate }],
      opacity,
    };
  });

  return (
    <Animated.Text style={[{ fontSize: particle.size, position: "absolute" }, animStyle]}>
      {particle.type}
    </Animated.Text>
  );
}

interface CompletionOverlayProps {
  visible: boolean;
  onClose: () => void;
}

function CompletionOverlay({ visible, onClose }: CompletionOverlayProps) {
  const [mounted, setMounted] = useState(false);
  const cardOpacity = useSharedValue(0);
  const particleProgress = useSharedValue(0);

  // Offset shared values for typographic reveal
  const trophyY = useSharedValue(60);
  const titleY = useSharedValue(60);
  const subtitleY = useSharedValue(45);
  const badgeY = useSharedValue(50);
  const calloutY = useSharedValue(45);
  const buttonY = useSharedValue(60);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      cardOpacity.value = 0;
      particleProgress.value = 0;
      
      trophyY.value = 60;
      titleY.value = 60;
      subtitleY.value = 45;
      badgeY.value = 50;
      calloutY.value = 45;
      buttonY.value = 60;

      // Subtle vibration feedback
      Vibration.vibrate(60);

      // Card fades in
      cardOpacity.value = withTiming(1.0, { duration: 300 });

      // Premium cubic bezier easing curve (easeOutExpo)
      const easeCurve = Easing.bezier(0.16, 1, 0.3, 1);

      // Staggered slide up timing animations
      trophyY.value = withDelay(80, withTiming(0, { duration: 550, easing: easeCurve }));
      titleY.value = withDelay(160, withTiming(0, { duration: 550, easing: easeCurve }));
      subtitleY.value = withDelay(240, withTiming(0, { duration: 550, easing: easeCurve }));
      badgeY.value = withDelay(320, withTiming(0, { duration: 600, easing: easeCurve }));
      calloutY.value = withDelay(400, withTiming(0, { duration: 600, easing: easeCurve }));
      buttonY.value = withDelay(480, withTiming(0, { duration: 650, easing: easeCurve }));

      // Particles float out smoothly
      particleProgress.value = withDelay(200, withTiming(1.0, { duration: 650, easing: Easing.out(Easing.quad) }));
    } else {
      setMounted(false);
    }
  }, [visible]);

  const handleClose = () => {
    // Exit transition: smooth card fade out
    cardOpacity.value = withTiming(0, { duration: 250 }, (finished) => {
      if (finished) {
        runOnJS(setMounted)(false);
        runOnJS(onClose)();
      }
    });
    // Settle elements back down slightly on exit
    const easeInCurve = Easing.quad;
    trophyY.value = withTiming(15, { duration: 200, easing: easeInCurve });
    titleY.value = withTiming(15, { duration: 200, easing: easeInCurve });
    subtitleY.value = withTiming(10, { duration: 200, easing: easeInCurve });
    badgeY.value = withTiming(10, { duration: 200, easing: easeInCurve });
    calloutY.value = withTiming(10, { duration: 200, easing: easeInCurve });
    buttonY.value = withTiming(15, { duration: 200, easing: easeInCurve });
  };

  const cardStyle = useAnimatedStyle(() => {
    return {
      opacity: cardOpacity.value,
    };
  });

  const trophyStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: trophyY.value }],
    };
  });

  const titleStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: titleY.value }],
    };
  });

  const subtitleStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: subtitleY.value }],
    };
  });

  const badgeStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: badgeY.value }],
    };
  });

  const calloutStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: calloutY.value }],
    };
  });

  const buttonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: buttonY.value }],
    };
  });

  if (!mounted) return null;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlayContainer}>
        {/* Apple-like Frosted Glass Overlay */}
        <GlassView glassEffectStyle="regular" colorScheme="dark" style={StyleSheet.absoluteFillObject} />

        <Animated.View style={[styles.celebrationCard, cardStyle]}>
          
          {/* Checkmark Confetti Container */}
          <Animated.View style={[styles.circleIconContainer, trophyStyle]}>
            {particles.map((p) => (
              <ParticleView key={p.id} particle={p} progress={particleProgress} />
            ))}
            <View style={styles.outerCircle}>
              <View style={styles.innerCircle}>
                <Check color="#ADFF2F" size={28} strokeWidth={4.5} />
              </View>
            </View>
          </Animated.View>
          
          {/* Title Mask Container */}
          <View style={styles.titleMask}>
            <Animated.Text style={[styles.celebrationTitle, titleStyle]}>
              CONGRATULATIONS
            </Animated.Text>
          </View>
          
          {/* Subtitle Mask Container */}
          <View style={styles.subtitleMask}>
            <Animated.Text style={[styles.celebrationSubtitle, subtitleStyle]}>
              Consistent execution breeds excellence. Daily quest board fully synchronized!
            </Animated.Text>
          </View>

          {/* Badge Mask Container */}
          <View style={styles.badgeMask}>
            <Animated.View style={[styles.pointsBadge, badgeStyle]}>
              <Text style={styles.pointsText}>+5 XP & TOKENS</Text>
            </Animated.View>
          </View>

          {/* Callout Mask Container */}
          <View style={styles.calloutMask}>
            <Animated.Text style={[styles.tomorrowCallout, calloutStyle]}>
              You got 5 points for the day.{"\n"}Come back tomorrow!
            </Animated.Text>
          </View>

          {/* Button Mask Container */}
          <View style={styles.buttonMask}>
            <Animated.View style={buttonStyle}>
              <TouchableOpacity onPress={handleClose} activeOpacity={0.8} style={styles.overlayButton}>
                <Text style={styles.overlayButtonText}>CLOSE</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  celebrationCard: {
    width: "90%",
    maxWidth: 320,
    backgroundColor: "#ADFF2F",
    borderRadius: 28,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  circleIconContainer: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    width: "100%",
    height: 120,
    marginBottom: 8,
  },
  outerCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  innerCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#121214",
    alignItems: "center",
    justifyContent: "center",
  },
  titleMask: {
    overflow: "hidden",
    height: 24,
    justifyContent: "center",
    marginBottom: 8,
    width: "100%",
  },
  celebrationTitle: {
    fontFamily: "Akira-Expanded",
    fontSize: 14,
    color: "#121214",
    textAlign: "center",
    letterSpacing: 0.5,
    marginBottom: 0,
  },
  subtitleMask: {
    overflow: "hidden",
    height: 38,
    justifyContent: "center",
    marginBottom: 20,
    width: "100%",
  },
  celebrationSubtitle: {
    fontSize: 11,
    color: "#262626",
    textAlign: "center",
    lineHeight: 16,
    marginBottom: 0,
    fontWeight: "bold",
  },
  badgeMask: {
    overflow: "hidden",
    height: 46,
    justifyContent: "center",
    marginBottom: 20,
    width: "100%",
    alignItems: "center",
  },
  pointsBadge: {
    backgroundColor: "rgba(0, 0, 0, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.15)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 0,
  },
  pointsText: {
    fontFamily: "Akira-Expanded",
    color: "#121214",
    fontSize: 11,
    letterSpacing: 0.5,
  },
  calloutMask: {
    overflow: "hidden",
    height: 42,
    justifyContent: "center",
    marginBottom: 24,
    width: "100%",
  },
  tomorrowCallout: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#121214",
    textAlign: "center",
    lineHeight: 16,
    marginBottom: 0,
  },
  buttonMask: {
    overflow: "hidden",
    height: 54,
    justifyContent: "center",
    width: "100%",
  },
  overlayButton: {
    width: "100%",
    backgroundColor: "#121214",
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  overlayButtonText: {
    color: "#ADFF2F",
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 1,
  },
});
