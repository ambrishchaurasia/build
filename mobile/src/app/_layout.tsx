import { Slot } from 'expo-router';
import { View, StatusBar, ActivityIndicator } from 'react-native';
import { useFonts } from 'expo-font';
import '../global.css';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Akira-Expanded': require('../../assets/fonts/Akira-Expanded.otf'),
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#98FB98" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
      <StatusBar barStyle="light-content" />
      <Slot />
    </View>
  );
}
