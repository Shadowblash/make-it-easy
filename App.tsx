import 'react-native-gesture-handler'; // must be first import
import './src/i18n'; // init i18next before anything renders

import React, { useEffect } from 'react';
import { TamaguiProvider } from '@tamagui/core';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppState, type AppStateStatus } from 'react-native';

import tamaguiConfig from './src/theme/tamagui.config';
import RootNavigator from './src/navigation/RootNavigator';
import { setupNotificationChannel, scheduleExpiryNotifications } from './src/services/NotificationService';

export default function App() {
  useEffect(() => {
    // One-time setup on launch
    setupNotificationChannel();
    scheduleExpiryNotifications();

    // Re-schedule on every foreground (handles OEM background kill)
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') scheduleExpiryNotifications();
    });
    return () => sub.remove();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
          <StatusBar style="dark" backgroundColor="#F5F0E8" />
          <RootNavigator />
        </TamaguiProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
