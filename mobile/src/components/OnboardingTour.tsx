import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Sparkles, ArrowRight, X, Settings, LayoutGrid, CheckCircle2 } from 'lucide-react-native';

interface OnboardingTourProps {
  onComplete: () => void;
}

const ONBOARDING_KEY = '@has_seen_onboarding';

export default function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const hasSeen = await AsyncStorage.getItem(ONBOARDING_KEY);
      if (hasSeen !== 'true') {
        setIsVisible(true);
      }
    } catch (e) {
      // Fallback
    }
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      finishOnboarding();
    }
  };

  const finishOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    } catch (e) {}
    setIsVisible(false);
    onComplete();
  };

  if (!isVisible) return null;

  const steps = [
    {
      title: "Welcome to BUILD",
      icon: <Sparkles color="#ED7864" size={24} />,
      content: "Did you know? Jotting down all tasks at the start of the day gives you a much higher chance of completing most of them. Let's set you up for success!",
      buttonText: "Let's Go"
    },
    {
      title: "Connect Your Accounts",
      icon: <Settings color="#ED7864" size={24} />,
      content: "You can automatically track your code! After this tour, tap the Settings icon (top right) to connect your GitHub and LeetCode accounts.",
      buttonText: "Next"
    },
    {
      title: "Explore the Arenas",
      icon: <LayoutGrid color="#ED7864" size={24} />,
      content: "Navigate through all 4 Arenas to track your daily routines, side projects, coding stats, and fitness goals. Everything in one place.",
      buttonText: "Next"
    },
    {
      title: "Your First Quest",
      icon: <CheckCircle2 color="#98FB98" size={24} />,
      content: "Time for action. Tap 'Spawn New Quest' right now to add your first quest for today and get the momentum going!",
      buttonText: "Spawn New Quest"
    }
  ];

  const currentStep = steps[step];

  return (
    <Modal visible={isVisible} transparent animationType="fade">
      <View className="flex-1 bg-black/80 justify-center items-center px-6">
        
        <View className="w-full bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden">
          {/* Header */}
          <View className="flex-row items-center justify-between p-5 border-b border-neutral-850">
            <View className="flex-row items-center gap-3">
              {currentStep.icon}
              <Text className="text-white font-black text-lg tracking-tight uppercase">
                {currentStep.title}
              </Text>
            </View>
            <TouchableOpacity onPress={finishOnboarding} className="p-1">
              <X color="#525252" size={20} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <View className="p-6 pb-8">
            <Text className="text-neutral-300 text-base leading-6 font-medium">
              {currentStep.content}
            </Text>
          </View>

          {/* Footer & Controls */}
          <View className="p-5 pt-0 flex-row items-center justify-between">
            {/* Progress Dots */}
            <View className="flex-row gap-2">
              {[0, 1, 2, 3].map((idx) => (
                <View 
                  key={idx} 
                  className={`h-2 rounded-full transition-all ${
                    idx === step ? "w-6 bg-brand-yellow" : "w-2 bg-neutral-800"
                  }`} 
                />
              ))}
            </View>

            <TouchableOpacity 
              onPress={handleNext}
              className="bg-brand-yellow px-5 py-3 rounded-xl flex-row items-center gap-2"
            >
              <Text className="text-neutral-950 font-black text-xs uppercase tracking-wider">
                {currentStep.buttonText}
              </Text>
              <ArrowRight color="#0a0a0a" size={16} strokeWidth={3} />
            </TouchableOpacity>
          </View>
        </View>

      </View>
    </Modal>
  );
}
