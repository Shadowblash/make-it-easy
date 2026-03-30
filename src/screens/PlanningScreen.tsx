import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';

import { getWeekPlans, planMeal, removePlan } from '../services/PlanningService';
import { getSuggestions } from '../services/MealMatchingService';
import type { SuggestionResult } from '../types';

interface DayPlan {
  date: string;       // YYYY-MM-DD
  label: string;      // "Lun 31", "Mer 2", etc.
  isToday: boolean;
  planId: string | null;
  mealName: string | null;
}

function getWeekDays(): DayPlan[] {
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7)); // Monday of current week

  const days: DayPlan[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const iso = d.toISOString().split('T')[0];
    const isToday = iso === today.toISOString().split('T')[0];
    days.push({ date: iso, label: formatDay(d), isToday, planId: null, mealName: null });
  }
  return days;
}

function formatDay(d: Date): string {
  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  return `${dayNames[d.getDay()]} ${d.getDate()}`;
}

export default function PlanningScreen() {
  const { t } = useTranslation();
  const [days, setDays] = useState<DayPlan[]>(getWeekDays());
  const [loading, setLoading] = useState(true);
  const [pickerDate, setPickerDate] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestionResult[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);

  const load = useCallback(async () => {
    const base = getWeekDays();
    const start = base[0].date;
    const end = base[6].date;
    try {
      const plans = await getWeekPlans(start, end);
      setDays(base.map((d) => {
        const plan = plans.find((p) => p.planned_date === d.date);
        return { ...d, planId: plan?.id ?? null, mealName: plan?.meal_name ?? null };
      }));
    } catch { /* offline: keep empty */ }
    finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function openPicker(date: string) {
    setPickerDate(date);
    setPickerLoading(true);
    const results = await getSuggestions(5);
    setSuggestions(results);
    setPickerLoading(false);
  }

  async function handleSelectMeal(mealId: string, date: string) {
    await planMeal(mealId, date);
    setPickerDate(null);
    load();
  }

  async function handleRemove(planId: string) {
    Alert.alert('', t('planning.removeMeal') + ' ?', [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('planning.removeMeal'), style: 'destructive',
        onPress: async () => { await removePlan(planId); load(); },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('planning.title')}</Text>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color="#4CAF73" size="large" /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContent}>
          {days.map((day) => (
            <DayRow
              key={day.date}
              day={day}
              onPress={() => day.mealName ? handleRemove(day.planId!) : openPicker(day.date)}
              t={t}
            />
          ))}
        </ScrollView>
      )}

      {/* Meal picker bottom sheet */}
      <Modal
        visible={pickerDate !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPickerDate(null)}
      >
        <View style={styles.picker}>
          <View style={styles.pickerHandle} />
          <Text style={styles.pickerTitle}>{t('planning.addMeal')}</Text>

          {pickerLoading ? (
            <View style={styles.center}><ActivityIndicator color="#4CAF73" /></View>
          ) : suggestions.length === 0 ? (
            <View style={styles.center}>
              <Text style={styles.emptyText}>{t('suggestions.emptyInventory')}</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={{ padding: 16 }}>
              {suggestions.map((s) => (
                <TouchableOpacity
                  key={s.meal.id}
                  style={styles.pickerRow}
                  onPress={() => handleSelectMeal(s.meal.id, pickerDate!)}
                  accessibilityRole="button"
                >
                  <Text style={styles.pickerMealName}>{s.meal.name}</Text>
                  <Text style={styles.pickerCoverage}>
                    {Math.round(s.coverage * 100)}%
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <TouchableOpacity
            style={styles.pickerCancel}
            onPress={() => setPickerDate(null)}
            accessibilityRole="button"
          >
            <Text style={styles.pickerCancelText}>{t('common.cancel')}</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function DayRow({
  day, onPress, t,
}: {
  day: DayPlan;
  onPress: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: (k: string, o?: any) => string;
}) {
  return (
    <TouchableOpacity
      style={[styles.dayRow, day.isToday && styles.dayRowToday]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <View style={styles.dayLabelContainer}>
        <Text style={[styles.dayLabel, day.isToday && styles.dayLabelToday]}>{day.label}</Text>
        {day.isToday && <Text style={styles.todayBadge}>{t('planning.today')}</Text>}
      </View>
      {day.mealName ? (
        <Text style={styles.dayMeal} numberOfLines={1}>{day.mealName}</Text>
      ) : (
        <Text style={styles.dayEmpty}>+ {t('planning.addMeal')}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F0E8' },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: '700', color: '#3D2B1F' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyText: { fontSize: 15, color: '#6B5E57', textAlign: 'center' },
  listContent: { paddingHorizontal: 16, paddingVertical: 8 },
  dayRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FAFAF7', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    marginBottom: 8, minHeight: 60,
    shadowColor: 'rgba(61,43,31,0.06)', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1, shadowRadius: 3, elevation: 1,
  },
  dayRowToday: { borderWidth: 2, borderColor: '#4CAF73' },
  dayLabelContainer: { width: 72 },
  dayLabel: { fontSize: 15, fontWeight: '700', color: '#3D2B1F' },
  dayLabelToday: { color: '#4CAF73' },
  todayBadge: { fontSize: 10, fontWeight: '600', color: '#4CAF73', marginTop: 2 },
  dayMeal: { flex: 1, fontSize: 15, color: '#3D2B1F', fontWeight: '500' },
  dayEmpty: { flex: 1, fontSize: 14, color: '#8A8A8A' },
  picker: { flex: 1, backgroundColor: '#F5F0E8', paddingTop: 12 },
  pickerHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(61,43,31,0.2)',
    alignSelf: 'center', marginBottom: 16,
  },
  pickerTitle: {
    fontSize: 18, fontWeight: '700', color: '#3D2B1F',
    paddingHorizontal: 16, marginBottom: 8,
  },
  pickerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FAFAF7', borderRadius: 10, padding: 14, marginBottom: 8,
    minHeight: 52,
  },
  pickerMealName: { fontSize: 15, fontWeight: '600', color: '#3D2B1F', flex: 1 },
  pickerCoverage: { fontSize: 13, fontWeight: '700', color: '#4CAF73', marginLeft: 8 },
  pickerCancel: { margin: 16, alignItems: 'center', paddingVertical: 12 },
  pickerCancelText: { fontSize: 16, color: '#6B5E57', fontWeight: '600' },
});
