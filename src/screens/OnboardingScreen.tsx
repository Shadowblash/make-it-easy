import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList, SeedMeal } from '../types';
import { SEED_MEALS } from '../constants/seedMeals';
import { completeOnboarding, saveSeedSelections } from '../services/OnboardingService';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;
};

const REQUIRED_SELECTIONS = 5;
const COLUMN_COUNT = 2;
const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 16 * 2 - 12) / COLUMN_COUNT;

export default function OnboardingScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggleMeal(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < REQUIRED_SELECTIONS) {
        next.add(id);
      }
      return next;
    });
  }

  async function handleStart() {
    const selectedMeals = SEED_MEALS.filter((m) => selected.has(m.id));
    await saveSeedSelections(selectedMeals);
    await completeOnboarding();
    navigation.replace('Main');
  }

  const canStart = selected.size === REQUIRED_SELECTIONS;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Sticky counter header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('onboarding.title')}</Text>
        <Text style={styles.subtitle}>{t('onboarding.subtitle')}</Text>
        <Text style={styles.counter}>
          {t('onboarding.counter', { count: selected.size })}
        </Text>
      </View>

      <FlatList
        data={SEED_MEALS}
        keyExtractor={(item) => item.id}
        numColumns={COLUMN_COUNT}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => (
          <MealCard
            meal={item}
            selected={selected.has(item.id)}
            onPress={() => toggleMeal(item.id)}
          />
        )}
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.startButton, !canStart && styles.startButtonDisabled]}
          onPress={handleStart}
          disabled={!canStart}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canStart }}
        >
          <Text style={styles.startButtonText}>{t('onboarding.start')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function MealCard({
  meal, selected, onPress,
}: { meal: SeedMeal; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.card, selected && styles.cardSelected]}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      {/* Illustration placeholder — real SVG loaded once assets/illustrations/ is populated */}
      <View style={[styles.illustrationPlaceholder, { backgroundColor: mealColor(meal.id) }]}>
        <Text style={styles.illustrationInitials}>{initials(meal.name)}</Text>
      </View>
      <Text style={styles.mealName} numberOfLines={2}>{meal.name}</Text>
      {selected && (
        <View style={styles.checkOverlay}>
          <Text style={styles.checkMark}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function initials(name: string): string {
  return name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
}

function mealColor(id: string): string {
  const hue = (id.charCodeAt(0) % 60) + 20; // ocre/amber range
  return `hsl(${hue}, 55%, 72%)`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F0E8' },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: '700', color: '#3D2B1F', marginBottom: 4 },
  subtitle: { fontSize: 15, color: '#6B5E57', marginBottom: 8 },
  counter: { fontSize: 13, fontWeight: '600', color: '#4CAF73' },
  grid: { paddingHorizontal: 16, paddingBottom: 16 },
  row: { gap: 12, marginBottom: 12 },
  card: {
    width: CARD_WIDTH, borderRadius: 12, backgroundColor: '#FAFAF7',
    overflow: 'hidden',
    shadowColor: 'rgba(61,43,31,0.08)', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1, shadowRadius: 4, elevation: 2,
  },
  cardSelected: { borderWidth: 2, borderColor: '#4CAF73' },
  illustrationPlaceholder: {
    height: CARD_WIDTH * 0.75, alignItems: 'center', justifyContent: 'center',
  },
  illustrationInitials: { fontSize: 28, fontWeight: '700', color: '#fff' },
  mealName: {
    fontSize: 13, fontWeight: '600', color: '#3D2B1F',
    paddingHorizontal: 10, paddingVertical: 10, lineHeight: 18,
  },
  checkOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(76,175,115,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  checkMark: { fontSize: 32, color: '#fff', fontWeight: '700' },
  footer: { padding: 16 },
  startButton: {
    backgroundColor: '#4CAF73', height: 52, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  startButtonDisabled: { backgroundColor: 'rgba(76,175,115,0.35)' },
  startButtonText: { fontSize: 17, fontWeight: '700', color: '#fff' },
});
