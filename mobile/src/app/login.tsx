import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  StyleSheet, 
  Image, 
  Dimensions, 
  KeyboardAvoidingView, 
  ScrollView, 
  Platform 
} from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Check, User, Lock } from "lucide-react-native";
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  Easing, 
  FadeIn, 
  FadeOut 
} from "react-native-reanimated";
import Svg, { Defs, RadialGradient, Stop, Circle } from "react-native-svg";
import { BlurView } from "expo-blur";
import { authApi } from "../services/authApi";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function Login() {
  const [step, setStep] = useState(0); // 0 = Welcome/Login, 3 = Success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Ambient Glow Pulse Animations
  const glowScale = useSharedValue(0.95);
  const glowOpacity = useSharedValue(0.22);

  useEffect(() => {
    glowScale.value = withRepeat(
      withTiming(1.08, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    glowOpacity.value = withRepeat(
      withTiming(0.32, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: glowScale.value }],
      opacity: glowOpacity.value,
    };
  });

  const handleNormalLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      // Map 'username' internally to 'email' as expected by backend model
      const data = await authApi.login({ 
        email: username.trim(), 
        password: password.trim() 
      });
      
      if (data.success) {
        await AsyncStorage.setItem("token", data.token);
        router.replace("/");
      } else {
        setError(data.message || "Invalid credentials.");
      }
    } catch (err: any) {
      console.error("[Login Error]", err);
      setError(
        err.response?.data?.message || 
        "Authentication failed. Please verify your credentials or server connection."
      );
    } finally {
      setLoading(false);
    }
  };


  const handleCompleteSuccess = () => {
    router.replace("/");
  };

  return (
    <View style={styles.container}>
      {/* 1. Ambient Glow */}
      <Animated.View style={[styles.glowContainer, glowStyle]}>
        <Svg width="100%" height="100%" viewBox="0 0 100 100">
          <Defs>
            <RadialGradient id="ambientGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#98FB98" stopOpacity="1.0" />
              <Stop offset="25%" stopColor="#98FB98" stopOpacity="0.7" />
              <Stop offset="50%" stopColor="#98FB98" stopOpacity="0.35" />
              <Stop offset="75%" stopColor="#98FB98" stopOpacity="0.1" />
              <Stop offset="100%" stopColor="#98FB98" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx="50" cy="50" r="50" fill="url(#ambientGlow)" />
        </Svg>
      </Animated.View>

      {/* 2. Apple-like Frosted Glass View */}
      <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFillObject} />

      {/* 3. Tiled Film Grain Overlay */}
      <Image
        source={require("../../assets/images/noise.png")}
        resizeMode="repeat"
        style={styles.grainOverlay}
      />

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
        >
          {/* Main Flow Steps Switch */}
          <View style={styles.flowWrapper}>

            {/* STEP 0: Login Screen */}
            {step === 0 && (
              <Animated.View entering={FadeIn.duration(450)} exiting={FadeOut.duration(350)} style={styles.stepContainerCenter}>
                
                <Text style={styles.akiraLogo}>BUILD</Text>
                
                <Text style={styles.welcomeSubtitle}>
                  Sign in to access your personal{"\n"}board of advisors and routine tracker
                </Text>

                {error ? (
                  <View style={styles.errorBanner}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                {/* Username & Password Fields */}
                <View style={styles.formContainer}>
                  <View style={styles.inputWrapper}>
                    <User color="#525252" size={16} style={styles.inputIcon} />
                    <TextInput
                      placeholder="Username"
                      placeholderTextColor="#525252"
                      value={username}
                      onChangeText={setUsername}
                      autoCapitalize="none"
                      style={styles.textInput}
                    />
                  </View>

                  <View style={styles.inputWrapper}>
                    <Lock color="#525252" size={16} style={styles.inputIcon} />
                    <TextInput
                      placeholder="Password"
                      placeholderTextColor="#525252"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      autoCapitalize="none"
                      style={styles.textInput}
                    />
                  </View>

                  {loading ? (
                    <ActivityIndicator color="#98FB98" size="large" style={{ marginVertical: 12 }} />
                  ) : (
                    <TouchableOpacity
                      onPress={handleNormalLogin}
                      activeOpacity={0.85}
                      style={styles.primaryYellowButton}
                    >
                      <Text style={styles.primaryYellowText}>SIGN IN</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <TouchableOpacity
                  onPress={() => router.push("/signup")}
                  style={{ marginTop: 16 }}
                >
                  <Text style={{ color: "#a1a1aa", fontSize: 13 }}>
                    Don't have an account? <Text style={{ color: "#98FB98", fontWeight: "bold" }}>Sign Up</Text>
                  </Text>
                </TouchableOpacity>


              </Animated.View>
            )}

            {/* STEP 3: Success Congratulations */}
            {step === 3 && (
              <Animated.View entering={FadeIn.duration(600)} style={styles.stepContainerCenter}>
                <View style={styles.congratulationsCard}>
                  
                  <View style={styles.successCheckCircle}>
                    <Check color="#000000" size={32} strokeWidth={3} />
                  </View>

                  <Text style={styles.serifCongratulationsTitle}>Welcome Back</Text>
                  
                  <Text style={styles.congratulationsSubtitle}>
                    Your session is authenticated.{"\n"}Entering the BUILD Arena...
                  </Text>

                  <TouchableOpacity
                    onPress={handleCompleteSuccess}
                    activeOpacity={0.8}
                    style={styles.cardCloseButton}
                  >
                    <Text style={styles.cardCloseButtonText}>Enter Arena</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            )}

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    position: "relative",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  glowContainer: {
    position: "absolute",
    width: 480,
    height: 480,
    left: -120,
    top: "15%",
  },
  grainOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.045,
  },
  flowWrapper: {
    width: "100%",
    maxWidth: 340,
    zIndex: 10,
    paddingHorizontal: 20,
  },
  stepContainerCenter: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  akiraLogo: {
    fontFamily: "Akira-Expanded",
    fontSize: 38,
    color: "#ffffff",
    textAlign: "center",
    letterSpacing: 1.5,
    marginBottom: 24,
    marginTop: 10,
  },
  welcomeSubtitle: {
    fontSize: 13,
    color: "#a1a1aa",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 28,
  },
  formContainer: {
    width: "100%",
    gap: 12,
  },
  inputWrapper: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(19, 21, 26, 0.7)",
    borderWidth: 1,
    borderColor: "#1c1d22",
    borderRadius: 14,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    paddingVertical: 12,
    color: "#ffffff",
    fontSize: 14,
  },
  primaryYellowButton: {
    width: "100%",
    backgroundColor: "#98FB98",
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#98FB98",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    marginTop: 8,
  },
  primaryYellowText: {
    color: "#000000",
    fontSize: 13,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  errorBanner: {
    padding: 12,
    backgroundColor: "rgba(127, 29, 29, 0.3)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.4)",
    borderRadius: 12,
    marginBottom: 16,
    width: "100%",
  },
  errorText: {
    color: "#f87171",
    fontSize: 11,
    textAlign: "center",
  },
  congratulationsCard: {
    width: SCREEN_WIDTH * 0.86,
    backgroundColor: "rgba(24, 24, 28, 0.75)",
    borderWidth: 1.2,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 32,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  successCheckCircle: {
    width: 64,
    height: 64,
    backgroundColor: "#98FB98",
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    shadowColor: "#98FB98",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  serifCongratulationsTitle: {
    fontFamily: "Georgia",
    fontSize: 22,
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 10,
  },
  congratulationsSubtitle: {
    fontSize: 12,
    color: "#a1a1aa",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 28,
  },
  cardCloseButton: {
    width: "100%",
    backgroundColor: "#1c1d22",
    borderWidth: 1,
    borderColor: "#2c2d35",
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  cardCloseButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "bold",
  },
  inlineChooserContainer: {
    width: "100%",
    marginTop: 28,
    paddingTop: 20,
    borderTopWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  inlineChooserTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#737373",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 14,
    textAlign: "center",
  },
  googleAccountItemInline: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "rgba(19, 21, 26, 0.6)",
    borderWidth: 1,
    borderColor: "#1c1d22",
    borderRadius: 12,
    marginBottom: 8,
  },
  avatarInitials: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "bold",
  },
  accountName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#ffffff",
  },
  accountEmail: {
    fontSize: 10,
    color: "#525252",
    marginTop: 1,
  },
});
