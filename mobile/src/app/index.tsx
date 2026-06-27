import React, { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApi } from "../services/authApi";

export default function Index() {
  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const meRes = await authApi.me();
        if (meRes.success) {
          if (!meRes.user.hasProfile) {
            router.replace("/onboarding");
          } else {
            router.replace("/dashboard"); 
          }
        } else {
          await AsyncStorage.removeItem("token");
          router.replace("/login");
        }
      } catch (e) {
        console.error("Failed to load user session during redirect:", e);
        router.replace("/login");
      }
    };
    checkAuth();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: "#000000", alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator size="large" color="#98FB98" />
    </View>
  );
}
