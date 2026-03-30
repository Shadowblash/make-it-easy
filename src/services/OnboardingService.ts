import * as SecureStore from 'expo-secure-store';
import type { SeedMeal, Meal, MealIngredient } from '../types';

const ONBOARDING_KEY = 'onboarding_complete';

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
 * Save seed meal selections as initial history.
 * Each selected seed meal is inserted into the local meals table with:
 * - source: 'seed'
 * - cooked_at: 6 months ago (so they don't appear as "recently cooked")
 */
export async function saveSeedSelections(meals: SeedMeal[]): Promise<void> {
  // TODO: wire to InventoryService / SupabaseService once DB is set up
  // For now, store in SecureStore as JSON (bootstrapped, small data)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const seedHistory: Meal[] = meals.map((m) => ({
    id: m.id,
    user_id: 'local',
    name: m.name,
    cooked_at: sixMonthsAgo.toISOString(),
    source: 'seed' as const,
    notes: null,
    updated_at: new Date().toISOString(),
  }));

  await SecureStore.setItemAsync('seed_history', JSON.stringify(seedHistory));
}

export async function getSeedHistory(): Promise<Meal[]> {
  try {
    const raw = await SecureStore.getItemAsync('seed_history');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
