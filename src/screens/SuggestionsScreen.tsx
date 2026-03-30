import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';

import MealCard from '../components/MealCard';
import { getSuggestions, getSuggestionsLenient } from '../services/MealMatchingService';
import type { SuggestionResult } from '../types';

export default function SuggestionsScreen() {
  const { t } = useTranslation();
  const [results, setResults] = useState<SuggestionResult[]>([]);
  const [lenientResults, setLenientResults] = useState<SuggestionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const main = await getSuggestions(5);
      setResults(main);
      if (main.length === 0) {
        const lenient = await getSuggestionsLenient(3);
        setLenientResults(lenient);
      } else {
        setLenientResults([]);
      }
    } catch {
      setError(t('suggestions.unavailable'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  function onRefresh() {
    setRefreshing(true);
    load();
  }

  function renderContent() {
    if (loading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator color="#4CAF73" size="large" />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={load}>
            <Text style={styles.retryText}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (results.length > 0) {
      return (
        <FlatList
          data={results}
          keyExtractor={(item) => item.meal.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4CAF73" />}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <MealCard result={item} onCookTonight={load} />
          )}
        />
      );
    }

    // No results at COVERAGE_MIN — show lenient fallback
    if (lenientResults.length > 0) {
      return (
        <FlatList
          data={lenientResults}
          keyExtractor={(item) => item.meal.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4CAF73" />}
          ListHeaderComponent={
            <View style={styles.lenientBanner}>
              <Text style={styles.lenientBannerText}>
                {t('suggestions.almost', { count: 2 })} — ajoute quelques ingrédients
              </Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <MealCard result={item} onCookTonight={load} />
          )}
        />
      );
    }

    return (
      <View style={styles.center}>
        <Text style={styles.emptyIcon}>🥦</Text>
        <Text style={styles.emptyText}>{t('suggestions.emptyInventory')}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('suggestions.title')}</Text>
      </View>
      {renderContent()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F0E8' },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 },
  title: { fontSize: 22, fontWeight: '700', color: '#3D2B1F' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  errorText: { fontSize: 15, color: '#E55E4D', textAlign: 'center', marginBottom: 16 },
  retryBtn: {
    backgroundColor: '#4CAF73', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8,
  },
  retryText: { color: '#fff', fontWeight: '600' },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: 16, color: '#6B5E57', textAlign: 'center', lineHeight: 24 },
  listContent: { paddingTop: 12, paddingBottom: 24 },
  lenientBanner: {
    marginHorizontal: 16, marginBottom: 12, backgroundColor: 'rgba(245,166,35,0.15)',
    borderRadius: 10, padding: 12,
  },
  lenientBannerText: { fontSize: 14, color: '#6B5E57', fontWeight: '600', textAlign: 'center' },
});
