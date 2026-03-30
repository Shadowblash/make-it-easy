import * as SecureStore from 'expo-secure-store';
import { supabase } from './supabase';
import { normalize } from '../utils/normalize';
import type { SeedMeal } from '../types';

const ONBOARDING_KEY = 'onboarding_complete';
const SEED_SYNCED_KEY = 'seed_history_synced';

export async function hasCompletedOnboarding(): Promise<boolean> {
  try {
    const value = await SecureStore.getItemAsync(ONBOARDING_KEY);
    return value === 'true';
  } catch {
    return false;
  }
}

export async function completeOnboarding(): Promise<void> {
  await SecureStore.setItemAsync(ONBOARDING_KEY, 'true');
}

/**
 * Insert selected seed meals into Supabase as meal history.
 * cooked_at = 6 months ago → eligible for suggestions, not "recently cooked".
 * source = 'seed' → frequency_bonus × 0.5 (yields to real user meals quickly).
 */
export async function saveSeedSelections(meals: SeedMeal[]): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error('Not authenticated');

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const cookedAt = sixMonthsAgo.toISOString();

  for (const seedMeal of meals) {
    // Insert meal
    const { data: mealRow, error: mealErr } = await supabase
      .from('meals')
      .insert({
        user_id: userId,
        name: seedMeal.name,
        cooked_at: cookedAt,
        source: 'seed',
        notes: null,
      })
      .select('id')
      .single();

    if (mealErr || !mealRow) continue;

    // Insert meal_ingredients
    const ingredients = seedMeal.ingredients.map((raw) => ({
      meal_id: mealRow.id,
      ingredient_name: raw,
      ingredient_name_normalized: normalize(raw),
      qty: null,
      qty_unit: null,
    }));

    await supabase.from('meal_ingredients').insert(ingredients);
  }

  await SecureStore.setItemAsync(SEED_SYNCED_KEY, 'true');
}

export async function isSeedSynced(): Promise<boolean> {
  try {
    const v = await SecureStore.getItemAsync(SEED_SYNCED_KEY);
    return v === 'true';
  } catch {
    return false;
  }
}
