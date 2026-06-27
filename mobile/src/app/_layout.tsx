import { Slot } from 'expo-router';
import { View, StatusBar } from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import '../global.css';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Akira-Expanded': require('../../assets/fonts/Akira-Expanded.otf'),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
      <StatusBar barStyle="light-content" />
      <Slot />
    </View>
  );
}
