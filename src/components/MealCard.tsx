import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import type { SuggestionResult } from '../types';
import { supabase } from '../services/supabase';
import { decrementItem } from '../services/InventoryService';
import { addToShoppingList } from '../services/ShoppingService';

interface Props {
  result: SuggestionResult;
  onCookTonight: () => void;
  onShoppingAdded?: () => void;
}

export default function MealCard({ result, onCookTonight, onShoppingAdded }: Props) {
  const { t } = useTranslation();
  const { meal, coverage, missingIngredients } = result;
  const [cooking, setCooking] = useState(false);
  const [addingToShopping, setAddingToShopping] = useState(false);
  const [shoppingAdded, setShoppingAdded] = useState(false);

  const haveCount = meal.ingredients.length - missingIngredients.length;
  const totalCount = meal.ingredients.length;

  async function handleAddToShopping() {
    setAddingToShopping(true);
    try {
      for (const name of missingIngredients) {
        await addToShoppingList(name, null, null, meal.id);
      }
      setShoppingAdded(true);
      onShoppingAdded?.();
    } catch { /* offline */ }
    finally { setAddingToShopping(false); }
  }

  async function handleCookTonight() {
    setCooking(true);
    try {
      // Decrement each ingredient from inventory
      for (const ing of meal.ingredients) {
        if (ing.qty && ing.qty > 0 && ing.qty_unit) {
          await decrementItem(ing.ingredient_name_normalized, ing.qty, ing.qty_unit);
        }
        // Ingredients with no qty are skipped — no reliable amount to decrement
      }

      // Log the meal as cooked, then copy its ingredients to the new meal row
      const { data: mealRow } = await supabase
        .from('meals')
        .insert({
          name: meal.name,
          cooked_at: new Date().toISOString(),
          source: 'user',
        })
        .select('id')
        .single();

      if (mealRow) {
        const ingredients = meal.ingredients.map((ing) => ({
          meal_id: mealRow.id,
          ingredient_name: ing.ingredient_name,
          ingredient_name_normalized: ing.ingredient_name_normalized,
          qty: ing.qty ?? null,
          qty_unit: ing.qty_unit ?? null,
        }));
        await supabase.from('meal_ingredients').insert(ingredients);
      }

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
          <View style={styles.missingRow}>
            <Text style={styles.missingText} numberOfLines={2}>
              {t('suggestions.missing', { items: missingIngredients.slice(0, 3).join(', ') })}
            </Text>
            <TouchableOpacity
              style={[styles.shopBtn, shoppingAdded && styles.shopBtnDone]}
              onPress={handleAddToShopping}
              disabled={addingToShopping || shoppingAdded}
              accessibilityRole="button"
              accessibilityLabel={t('suggestions.addToShopping')}
            >
              {addingToShopping ? (
                <ActivityIndicator color="#4CAF73" size="small" />
              ) : (
                <Text style={[styles.shopBtnText, shoppingAdded && styles.shopBtnTextDone]}>
                  {shoppingAdded ? '✓' : t('suggestions.addToShopping')}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Footer: cook CTA */}
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
  missingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  missingText: { flex: 1, fontSize: 13, color: '#8A8A8A', lineHeight: 18 },
  shopBtn: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6,
    borderWidth: 1, borderColor: '#4CAF73', minWidth: 36, alignItems: 'center',
  },
  shopBtnDone: { borderColor: '#4CAF73', backgroundColor: 'rgba(76,175,115,0.1)' },
  shopBtnText: { fontSize: 12, fontWeight: '600', color: '#4CAF73' },
  shopBtnTextDone: { color: '#4CAF73' },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 4 },
  cookBtn: {
    backgroundColor: '#4CAF73',
    height: 44,
    paddingHorizontal: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 160,
  },
  cookBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
