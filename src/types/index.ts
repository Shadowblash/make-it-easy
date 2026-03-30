// ─── Inventory ───────────────────────────────────────────────────────────────

export type Zone = 'pantry' | 'fridge' | 'freezer' | 'leftovers';
export type QtyUnit = 'g' | 'kg' | 'ml' | 'L' | 'piece' | 'slice';

export interface InventoryItem {
  id: string;
  user_id: string;
  name: string;
  ingredient_name_normalized: string;
  zone: Zone;
  qty: number | null;
  qty_unit: QtyUnit | null;
  expiry_date: string | null; // ISO date string
  barcode: string | null;
  updated_at: string;
  created_at: string;
}

// ─── Meals ────────────────────────────────────────────────────────────────────

export type MealSource = 'user' | 'seed';

export interface Meal {
  id: string;
  user_id: string;
  name: string;
  cooked_at: string; // ISO datetime
  source: MealSource;
  notes: string | null;
  updated_at: string;
}

export interface MealIngredient {
  id: string;
  meal_id: string;
  ingredient_name: string;
  ingredient_name_normalized: string;
  qty: number | null;
  qty_unit: QtyUnit | null;
}

// ─── Seed meals ───────────────────────────────────────────────────────────────

export interface SeedMeal {
  id: string;
  name: string;
  ingredients: string[]; // normalized names
  illustration_key: string; // maps to assets/illustrations/meals/{key}.svg
  prep_minutes: number;
}

// ─── Suggestions ─────────────────────────────────────────────────────────────

export interface SuggestionResult {
  meal: Meal & { ingredients: MealIngredient[] };
  score: number;
  coverage: number; // 0–1, fraction of ingredients available
  missingIngredients: string[];
}

// ─── Shopping list ────────────────────────────────────────────────────────────

export interface ShoppingListItem {
  id: string;
  user_id: string;
  ingredient_name: string;
  qty: number | null;
  qty_unit: QtyUnit | null;
  is_checked: boolean;
  from_meal_id: string | null;
  created_at: string;
}

// ─── Meal plans ───────────────────────────────────────────────────────────────

export interface MealPlan {
  id: string;
  user_id: string;
  meal_id: string;
  planned_date: string; // ISO date string
}

// ─── Navigation ───────────────────────────────────────────────────────────────

export type RootStackParamList = {
  Auth: undefined;
  Onboarding: undefined;
  Main: undefined;
};

export type MainTabParamList = {
  Inventory: undefined;
  Suggestions: undefined;
  Shopping: undefined;
  Planning: undefined;
  Stats: undefined;
};
