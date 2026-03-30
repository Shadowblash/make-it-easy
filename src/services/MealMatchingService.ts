import { supabase } from './supabase';
import type { SuggestionResult } from '../types';
import type { QtyUnit, MealSource } from '../types/supabase';

// ─── Constants (tunable via plan spec) ───────────────────────────────────────

const VOCAB_MAX = 500;
const SCORE_THRESHOLD = 0.3;
const COVERAGE_MIN = 0.6;
const FREQUENCY_WEIGHT = 0.2;
const SEED_SOURCE_WEIGHT = 0.5;
const RECENCY_PENALTY = 0.15;
const RECENCY_DAYS = 7;

// ─── Local types for nested query result ─────────────────────────────────────

interface MealIngredientRow {
  id: string;
  meal_id: string;
  ingredient_name: string;
  ingredient_name_normalized: string;
  qty: number | null;
  qty_unit: QtyUnit | null;
}

interface MealWithIngredients {
  id: string;
  user_id: string;
  name: string;
  cooked_at: string;
  source: MealSource;
  notes: string | null;
  updated_at: string;
  meal_ingredients: MealIngredientRow[];
}

// ─── Cosine similarity ────────────────────────────────────────────────────────

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function buildVector(ingredients: string[], vocab: string[]): number[] {
  return vocab.map((v) => (ingredients.includes(v) ? 1 : 0));
}

// ─── Shared data fetcher ──────────────────────────────────────────────────────

async function fetchMealsWithIngredients(): Promise<MealWithIngredients[]> {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const { data, error } = await supabase
    .from('meals')
    .select(`
      id, name, cooked_at, source, notes, updated_at, user_id,
      meal_ingredients ( id, meal_id, ingredient_name, ingredient_name_normalized, qty, qty_unit )
    `)
    .gte('cooked_at', sixMonthsAgo.toISOString())
    .order('cooked_at', { ascending: false });

  if (error) throw error;
  return (data as unknown as MealWithIngredients[]) ?? [];
}

// ─── Main matching function ───────────────────────────────────────────────────

export async function getSuggestions(topN = 5): Promise<SuggestionResult[]> {
  const { data: inventoryData, error: invError } = await supabase
    .from('inventory_items')
    .select('ingredient_name_normalized');

  if (invError) throw invError;

  const inventoryNames = (inventoryData ?? []).map((i) => i.ingredient_name_normalized);
  if (inventoryNames.length === 0) return [];

  const meals = await fetchMealsWithIngredients();
  if (meals.length === 0) return [];

  const { vocab, inventoryVec, countByName, seenNames } = buildMatchingContext(meals, inventoryNames);
  const now = Date.now();
  const results: SuggestionResult[] = [];

  for (const [, meal] of seenNames) {
    const mealIngredients = meal.meal_ingredients.map((i) => i.ingredient_name_normalized);
    if (mealIngredients.length === 0) continue;

    const covered = mealIngredients.filter((i) => inventoryNames.includes(i));
    const coverage = covered.length / mealIngredients.length;
    if (coverage < COVERAGE_MIN) continue;

    const mealVec = buildVector(mealIngredients, vocab);
    const cosine = cosineSimilarity(inventoryVec, mealVec);
    if (cosine < SCORE_THRESHOLD) continue;

    const key = meal.name.toLowerCase().trim();
    const { count, source } = countByName.get(key) ?? { count: 1, source: 'user' as MealSource };
    const sourceWeight = source === 'seed' ? SEED_SOURCE_WEIGHT : 1.0;
    const frequencyBonus = Math.log(count) * FREQUENCY_WEIGHT * sourceWeight;

    const daysSince = (now - new Date(meal.cooked_at).getTime()) / (1000 * 60 * 60 * 24);
    const recencyPenalty = daysSince < RECENCY_DAYS ? RECENCY_PENALTY : 0;

    const score = cosine + frequencyBonus - recencyPenalty;
    const missingIngredients = mealIngredients.filter((i) => !inventoryNames.includes(i));

    results.push({
      meal: { ...meal, ingredients: meal.meal_ingredients },
      score,
      coverage,
      missingIngredients,
    });
  }

  results.sort((a, b) => {
    if (Math.abs(b.score - a.score) > 0.001) return b.score - a.score;
    return new Date(a.meal.cooked_at).getTime() - new Date(b.meal.cooked_at).getTime();
  });

  return results.slice(0, topN);
}

/**
 * Lenient version — returns best suggestions even below COVERAGE_MIN.
 * Used for "À X ingrédients près" fallback.
 */
export async function getSuggestionsLenient(topN = 3): Promise<SuggestionResult[]> {
  const { data: inventoryData } = await supabase
    .from('inventory_items')
    .select('ingredient_name_normalized');

  const inventoryNames = (inventoryData ?? []).map((i) => i.ingredient_name_normalized);
  const meals = await fetchMealsWithIngredients();
  if (meals.length === 0) return [];

  const { vocab, inventoryVec, seenNames } = buildMatchingContext(meals, inventoryNames);

  const results: SuggestionResult[] = [];
  for (const [, meal] of seenNames) {
    const mealIngredients = meal.meal_ingredients.map((i) => i.ingredient_name_normalized);
    if (mealIngredients.length === 0) continue;

    const covered = mealIngredients.filter((i) => inventoryNames.includes(i));
    const coverage = covered.length / mealIngredients.length;
    const cosine = cosineSimilarity(inventoryVec, buildVector(mealIngredients, vocab));
    const missingIngredients = mealIngredients.filter((i) => !inventoryNames.includes(i));

    results.push({
      meal: { ...meal, ingredients: meal.meal_ingredients },
      score: cosine,
      coverage,
      missingIngredients,
    });
  }

  results.sort((a, b) => b.coverage - a.coverage || b.score - a.score);
  return results.slice(0, topN);
}

// ─── Shared context builder ───────────────────────────────────────────────────

function buildMatchingContext(
  meals: MealWithIngredients[],
  inventoryNames: string[],
) {
  const freqMap: Record<string, number> = {};
  for (const meal of meals) {
    for (const ing of meal.meal_ingredients) {
      freqMap[ing.ingredient_name_normalized] = (freqMap[ing.ingredient_name_normalized] ?? 0) + 1;
    }
  }

  const vocab = Object.entries(freqMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, VOCAB_MAX)
    .map(([name]) => name);

  const inventoryVec = buildVector(inventoryNames, vocab);

  const seenNames = new Map<string, MealWithIngredients>();
  const countByName = new Map<string, { count: number; source: MealSource }>();

  for (const meal of meals) {
    const key = meal.name.toLowerCase().trim();
    if (!seenNames.has(key)) seenNames.set(key, meal);
    const prev = countByName.get(key);
    countByName.set(key, { count: (prev?.count ?? 0) + 1, source: meal.source });
  }

  return { vocab, inventoryVec, countByName, seenNames };
}
