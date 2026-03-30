// Typed Database schema for Supabase client.
// Regenerate after schema changes:
//   npx supabase gen types typescript --project-id edwerlzrirmgxzcurmks > src/types/supabase.ts

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type Zone = 'pantry' | 'fridge' | 'freezer' | 'leftovers';
export type QtyUnit = 'g' | 'kg' | 'ml' | 'L' | 'piece' | 'slice';
export type MealSource = 'user' | 'seed';

type InventoryItemRow = {
  id: string;
  user_id: string;
  name: string;
  ingredient_name_normalized: string;
  zone: Zone;
  qty: number | null;
  qty_unit: QtyUnit | null;
  expiry_date: string | null;
  barcode: string | null;
  updated_at: string;
  created_at: string;
};

type InventoryItemInsert = {
  id?: string;
  user_id?: string;
  name: string;
  ingredient_name_normalized: string;
  zone?: Zone;
  qty?: number | null;
  qty_unit?: QtyUnit | null;
  expiry_date?: string | null;
  barcode?: string | null;
  updated_at?: string;
  created_at?: string;
};

type InventoryItemUpdate = {
  id?: string;
  user_id?: string;
  name?: string;
  ingredient_name_normalized?: string;
  zone?: Zone;
  qty?: number | null;
  qty_unit?: QtyUnit | null;
  expiry_date?: string | null;
  barcode?: string | null;
  updated_at?: string;
  created_at?: string;
};

type MealRow = {
  id: string;
  user_id: string;
  name: string;
  cooked_at: string;
  source: MealSource;
  notes: string | null;
  updated_at: string;
};

type MealInsert = {
  id?: string;
  user_id?: string;
  name: string;
  cooked_at?: string;
  source?: MealSource;
  notes?: string | null;
  updated_at?: string;
};

type MealIngredientRow = {
  id: string;
  meal_id: string;
  ingredient_name: string;
  ingredient_name_normalized: string;
  qty: number | null;
  qty_unit: QtyUnit | null;
};

type MealIngredientInsert = {
  id?: string;
  meal_id: string;
  ingredient_name: string;
  ingredient_name_normalized: string;
  qty?: number | null;
  qty_unit?: QtyUnit | null;
};

type ShoppingListRow = {
  id: string;
  user_id: string;
  ingredient_name: string;
  qty: number | null;
  qty_unit: QtyUnit | null;
  is_checked: boolean;
  from_meal_id: string | null;
  created_at: string;
};

type ShoppingListInsert = {
  id?: string;
  user_id?: string;
  ingredient_name: string;
  qty?: number | null;
  qty_unit?: QtyUnit | null;
  is_checked?: boolean;
  from_meal_id?: string | null;
  created_at?: string;
};

type MealPlanRow = {
  id: string;
  user_id: string;
  meal_id: string;
  planned_date: string;
};

type MealPlanInsert = {
  id?: string;
  user_id?: string;
  meal_id: string;
  planned_date: string;
};

export interface Database {
  public: {
    Tables: {
      inventory_items: {
        Row: InventoryItemRow;
        Insert: InventoryItemInsert;
        Update: InventoryItemUpdate;
        Relationships: [];
      };
      meals: {
        Row: MealRow;
        Insert: MealInsert;
        Update: Partial<MealInsert>;
        Relationships: [];
      };
      meal_ingredients: {
        Row: MealIngredientRow;
        Insert: MealIngredientInsert;
        Update: Partial<MealIngredientInsert>;
        Relationships: [];
      };
      shopping_list: {
        Row: ShoppingListRow;
        Insert: ShoppingListInsert;
        Update: Partial<ShoppingListInsert>;
        Relationships: [];
      };
      meal_plans: {
        Row: MealPlanRow;
        Insert: MealPlanInsert;
        Update: Partial<MealPlanInsert>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      zone: Zone;
      qty_unit: QtyUnit;
      meal_source: MealSource;
    };
    CompositeTypes: Record<string, never>;
  };
}
