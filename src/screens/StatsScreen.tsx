import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';

import { getMonthlyStats, type MonthlyStats } from '../services/StatsService';

export default function StatsScreen() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<MonthlyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getMonthlyStats();
      setStats(data);
    } catch { /* offline */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.center}><ActivityIndicator color="#4CAF73" size="large" /></View>
      </SafeAreaView>
    );
  }

  const isEmpty = !stats || stats.mealsCooked === 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#4CAF73" />}
      >
        <Text style={styles.title}>{t('stats.title')}</Text>
        <Text style={styles.period}>{t('stats.thisMonth')}</Text>

        {isEmpty ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>{t('stats.empty')}</Text>
          </View>
        ) : (
          <>
            {/* Big numbers */}
            <View style={styles.statGrid}>
              <StatCard
                value={String(stats!.mealsCooked)}
                label={t('stats.mealsCooked')}
                color="#4CAF73"
              />
              <StatCard
                value={`~${stats!.estimatedSavingsEur}€`}
                label={t('stats.estimatedSavings', { amount: '' }).replace(' ', '')}
                color="#F5A623"
              />
            </View>

            {/* Top meals */}
            {stats!.topMeals.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('stats.topMeals')}</Text>
                {stats!.topMeals.map((meal, i) => (
                  <View key={meal.name} style={styles.topMealRow}>
                    <Text style={styles.topMealRank}>#{i + 1}</Text>
                    <Text style={styles.topMealName} numberOfLines={1}>{meal.name}</Text>
                    <Text style={styles.topMealCount}>{meal.count}×</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F0E8' },
  content: { padding: 16, paddingBottom: 48 },
  title: { fontSize: 22, fontWeight: '700', color: '#3D2B1F', marginBottom: 4 },
  period: { fontSize: 14, color: '#6B5E57', marginBottom: 20 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyText: { fontSize: 16, color: '#6B5E57', textAlign: 'center' },
  statGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: {
    flex: 1, backgroundColor: '#FAFAF7', borderRadius: 12, padding: 16,
    shadowColor: 'rgba(61,43,31,0.06)', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1, shadowRadius: 4, elevation: 1,
  },
  statValue: { fontSize: 32, fontWeight: '700', marginBottom: 4 },
  statLabel: { fontSize: 13, color: '#6B5E57', fontWeight: '500' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#3D2B1F', marginBottom: 12 },
  topMealRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FAFAF7',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 8, minHeight: 48,
  },
  topMealRank: { fontSize: 14, fontWeight: '700', color: '#8A8A8A', width: 32 },
  topMealName: { flex: 1, fontSize: 15, fontWeight: '600', color: '#3D2B1F' },
  topMealCount: { fontSize: 14, fontWeight: '700', color: '#4CAF73' },
});
