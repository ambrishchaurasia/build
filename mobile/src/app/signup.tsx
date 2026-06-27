import React, { useState } from "react";
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
import Svg, { Defs, RadialGradient, Stop, Circle } from "react-native-svg";
import { BlurView } from "expo-blur";
import { authApi } from "../services/authApi";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function Signup() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [success, setSuccess] = useState(false);

  const handleNormalSignup = async () => {
    if (!username.trim() || !password.trim()) {
      setError("Please enter both a username and password.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      // Map UI username to backend's required 'name' and 'email' parameters
      const data = await authApi.signup({
        name: username.trim(),
        email: username.trim(),
        password: password.trim()
      });
      if (data.success) {
        await AsyncStorage.setItem("token", data.token);
        setSuccess(true);
      } else {
        setError(data.message || "Registration failed.");
      }
    } catch (err: any) {
      console.error("[Signup Error]", err);
      
      if (!err.response) {
        const { API_URL } = require('../services/apiClient');
        setError(`Network Error: ${err.message}. Target: ${API_URL}`);
      } else {
        const data = err.response?.data;
        if (data?.message === "Validation failed" && data?.errors?.length > 0) {
          setError(data.errors.map((e: any) => e.message).join("\n"));
        } else {
          setError(
            data?.message ||
            "Registration failed. Username may already be taken."
          );
        }
      }
    } finally {
      setLoading(false);
    }
  };


  const handleCompleteSuccess = () => {
    router.replace("/");
  };

  if (success) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <View style={styles.congratulationsCard}>
          <View style={styles.successCheckCircle}>
            <Check color="#000000" size={32} strokeWidth={3} />
          </View>
          <Text style={styles.serifCongratulationsTitle}>Account Created</Text>
          <Text style={styles.congratulationsSubtitle}>
            Your BUILD character is ready.{"\n"}Entering the arena...
          </Text>
          <TouchableOpacity
            onPress={handleCompleteSuccess}
            activeOpacity={0.8}
            style={styles.cardCloseButton}
          >
            <Text style={styles.cardCloseButtonText}>Enter Arena</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 1. Ambient Glow (Cyan gradient for Signup to distinguish it from Login) */}
      <View style={styles.glowContainer}>
        <Svg width="100%" height="100%" viewBox="0 0 100 100">
          <Defs>
            <RadialGradient id="ambientGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#6495ED" stopOpacity="0.4" />
              <Stop offset="50%" stopColor="#6495ED" stopOpacity="0.15" />
              <Stop offset="100%" stopColor="#6495ED" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx="50" cy="50" r="50" fill="url(#ambientGlow)" />
        </Svg>
      </View>

      {/* 2. Apple-like Frosted Glass View */}
      <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFillObject} />

      {/* 3. Noise grain */}
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
          <View style={styles.flowWrapper}>
            <View style={styles.stepContainerCenter}>
              <Text style={styles.akiraLogo}>BUILD</Text>
              <Text style={styles.serifWelcomeTitle}>Register Character</Text>
              <Text style={styles.welcomeSubtitle}>
                Create your BUILD profile and begin tracking daily streaks
              </Text>

              {error ? (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {/* Form Input Fields */}
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
                    placeholder="Password (min 6 chars)"
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
                    onPress={handleNormalSignup}
                    activeOpacity={0.85}
                    style={styles.primaryYellowButton}
                  >
                    <Text style={styles.primaryYellowText}>REGISTER</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                onPress={() => router.push("/login")}
                style={{ marginTop: 16 }}
              >
                <Text style={{ color: "#a1a1aa", fontSize: 13 }}>
                  Already registered? <Text style={{ color: "#98FB98", fontWeight: "bold" }}>Sign In</Text>
                </Text>
              </TouchableOpacity>


            </View>
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
  serifWelcomeTitle: {
    fontFamily: "Georgia",
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 8,
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
