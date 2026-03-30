import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import type { SuggestionResult } from '../types';
import { addItem } from '../services/InventoryService';
import { supabase } from '../services/supabase';
import { decrementItem } from '../services/InventoryService';

interface Props {
  result: SuggestionResult;
  onCookTonight: () => void;
}

export default function MealCard({ result, onCookTonight }: Props) {
  const { t } = useTranslation();
  const { meal, coverage, missingIngredients, score } = result;
  const [cooking, setCooking] = useState(false);

  const haveCount = meal.ingredients.length - missingIngredients.length;
  const totalCount = meal.ingredients.length;

  async function handleCookTonight() {
    setCooking(true);
    try {
      // Decrement each ingredient from inventory
      for (const ing of meal.ingredients) {
        if (ing.qty && ing.qty_unit) {
          await decrementItem(ing.ingredient_name_normalized, ing.qty, ing.qty_unit);
        } else {
          // No qty — just mark as used (delete the item)
          await decrementItem(ing.ingredient_name_normalized, 0, 'piece');
        }
      }

      // Log the meal as cooked
      await supabase.from('meals').insert({
        name: meal.name,
        cooked_at: new Date().toISOString(),
        source: 'user',
      });

      onCookTonight();
      Alert.alert('', t('suggestions.cookSuccess'));
    } catch {
      Alert.alert('', t('suggestions.cookError'));
    } finally {
      setCooking(false);
    }
  }

  return (
    <View style={styles.card}>
      {/* Illustration placeholder — replaced with SVG assets once commissioned */}
      <View style={[styles.illustration, { backgroundColor: mealColor(meal.id) }]}>
        <Text style={styles.illustrationInitials}>{initials(meal.name)}</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.mealName} numberOfLines={2}>{meal.name}</Text>

        {/* Coverage bar */}
        <View style={styles.coverageRow}>
          <View style={styles.coverageBarBg}>
            <View style={[styles.coverageBarFill, { width: `${coverage * 100}%` as any }]} />
          </View>
          <Text style={styles.coverageText}>
            {t('suggestions.ingredients', { have: haveCount, total: totalCount })}
          </Text>
        </View>

        {/* Missing ingredients */}
        {missingIngredients.length > 0 && (
          <Text style={styles.missingText} numberOfLines={2}>
            {t('suggestions.missing', { items: missingIngredients.slice(0, 3).join(', ') })}
          </Text>
        )}

        {/* Footer: prep time + CTA */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cookBtn}
            onPress={handleCookTonight}
            disabled={cooking}
            accessibilityRole="button"
            accessibilityLabel={t('suggestions.cookTonight')}
          >
            {cooking ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.cookBtnText}>{t('suggestions.cookTonight')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function initials(name: string): string {
  return name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
}

function mealColor(id: string): string {
  const hue = (id.charCodeAt(0) % 60) + 20;
  return `hsl(${hue}, 50%, 70%)`;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FAFAF7',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: 'rgba(61,43,31,0.08)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  illustration: {
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationInitials: {
    fontSize: 40,
    fontWeight: '700',
    color: '#fff',
    opacity: 0.9,
  },
  body: { padding: 14 },
  mealName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3D2B1F',
    marginBottom: 10,
    lineHeight: 26,
  },
  coverageRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  coverageBarBg: {
    flex: 1, height: 6, backgroundColor: 'rgba(61,43,31,0.1)', borderRadius: 3, overflow: 'hidden',
  },
  coverageBarFill: { height: '100%', backgroundColor: '#4CAF73', borderRadius: 3 },
  coverageText: { fontSize: 12, fontWeight: '600', color: '#6B5E57', minWidth: 80 },
  missingText: { fontSize: 13, color: '#8A8A8A', marginBottom: 10, lineHeight: 18 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 4 },
  cookBtn: {
    backgroundColor: '#4CAF73',
    height: 44,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 160,
  },
  cookBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
