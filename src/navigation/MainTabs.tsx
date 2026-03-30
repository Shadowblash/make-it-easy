import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';

import InventoryScreen from '../screens/InventoryScreen';
import SuggestionsScreen from '../screens/SuggestionsScreen';
import ShoppingScreen from '../screens/ShoppingScreen';
import PlanningScreen from '../screens/PlanningScreen';
import StatsScreen from '../screens/StatsScreen';
import type { MainTabParamList } from '../types';

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_BAR_HEIGHT = 56;

export default function MainTabs() {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#F5F0E8',
          borderTopColor: 'rgba(61,43,31,0.1)',
          height: TAB_BAR_HEIGHT,
          paddingBottom: 6,
          paddingTop: 6,
        },
        tabBarActiveTintColor: '#4CAF73',
        tabBarInactiveTintColor: '#8A8A8A',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Inventory"
        component={InventoryScreen}
        options={{
          title: t('tabs.inventory'),
          tabBarIcon: ({ color }) => <TabIcon emoji="📦" color={color} />,
          tabBarAccessibilityLabel: t('tabs.inventory'),
        }}
      />
      <Tab.Screen
        name="Suggestions"
        component={SuggestionsScreen}
        options={{
          title: t('tabs.suggestions'),
          tabBarIcon: ({ color }) => <TabIcon emoji="✨" color={color} />,
          tabBarAccessibilityLabel: t('tabs.suggestions'),
        }}
      />
      <Tab.Screen
        name="Shopping"
        component={ShoppingScreen}
        options={{
          title: t('tabs.shopping'),
          tabBarIcon: ({ color }) => <TabIcon emoji="🛒" color={color} />,
          tabBarAccessibilityLabel: t('tabs.shopping'),
        }}
      />
      <Tab.Screen
        name="Planning"
        component={PlanningScreen}
        options={{
          title: t('tabs.planning'),
          tabBarIcon: ({ color }) => <TabIcon emoji="📅" color={color} />,
          tabBarAccessibilityLabel: t('tabs.planning'),
        }}
      />
      <Tab.Screen
        name="Stats"
        component={StatsScreen}
        options={{
          title: t('tabs.stats'),
          tabBarIcon: ({ color }) => <TabIcon emoji="📊" color={color} />,
          tabBarAccessibilityLabel: t('tabs.stats'),
        }}
      />
    </Tab.Navigator>
  );
}

// Simple text-based tab icon — replace with proper SVG icons later
function TabIcon({ emoji, color }: { emoji: string; color: string }) {
  return <Text style={{ fontSize: 18, color }}>{emoji}</Text>;
}
