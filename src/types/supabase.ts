// Auto-generated types for Supabase tables.
// Regenerate after schema changes:
//   npx supabase gen types typescript --project-id <id> > src/types/supabase.ts

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type Zone = 'pantry' | 'fridge' | 'freezer' | 'leftovers';
export type QtyUnit = 'g' | 'kg' | 'ml' | 'L' | 'piece' | 'slice';
export type MealSource = 'user' | 'seed';

export interface Database {
  public: {
    Tables: {
      inventory_items: {
        Row: {
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
        Insert: {
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
        Update: Partial<Database['public']['Tables']['inventory_items']['Insert']>;
      };
      meals: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          cooked_at: string;
          source: MealSource;
          notes: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          name: string;
          cooked_at?: string;
          source?: MealSource;
          notes?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['meals']['Insert']>;
      };
      meal_ingredients: {
        Row: {
          id: string;
          meal_id: string;
          ingredient_name: string;
          ingredient_name_normalized: string;
          qty: number | null;
          qty_unit: QtyUnit | null;
        };
        Insert: {
          id?: string;
          meal_id: string;
          ingredient_name: string;
          ingredient_name_normalized: string;
          qty?: number | null;
          qty_unit?: QtyUnit | null;
        };
        Update: Partial<Database['public']['Tables']['meal_ingredients']['Insert']>;
      };
      shopping_list: {
        Row: {
          id: string;
          user_id: string;
          ingredient_name: string;
          qty: number | null;
          qty_unit: QtyUnit | null;
          is_checked: boolean;
          from_meal_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          ingredient_name: string;
          qty?: number | null;
          qty_unit?: QtyUnit | null;
          is_checked?: boolean;
          from_meal_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['shopping_list']['Insert']>;
      };
      meal_plans: {
        Row: {
          id: string;
          user_id: string;
          meal_id: string;
          planned_date: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          meal_id: string;
          planned_date: string;
        };
        Update: Partial<Database['public']['Tables']['meal_plans']['Insert']>;
      };
    };
    Views: {};
    Functions: {};
    Enums: {
      zone: Zone;
      qty_unit: QtyUnit;
      meal_source: MealSource;
    };
  };
}
