import { supabase } from './supabase';
import type { MealPlan } from '../types';

interface MealPlanWithName extends MealPlan {
  meal_name: string;
}

export async function getWeekPlans(startDate: string, endDate: string): Promise<MealPlanWithName[]> {
  const { data, error } = await supabase
    .from('meal_plans')
    .select('id, user_id, meal_id, planned_date, meals(name)')
    .gte('planned_date', startDate)
    .lte('planned_date', endDate)
    .order('planned_date', { ascending: true });

  if (error) throw error;

  return ((data as any[]) ?? []).map((row) => ({
    id: row.id,
    user_id: row.user_id,
    meal_id: row.meal_id,
    planned_date: row.planned_date,
    meal_name: row.meals?.name ?? '',
  }));
}

export async function planMeal(mealId: string, date: string): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error('Not authenticated');

  // Upsert — one meal per day per user (unique constraint)
  const { error } = await supabase
    .from('meal_plans')
    .upsert({ user_id: userId, meal_id: mealId, planned_date: date }, { onConflict: 'user_id,planned_date' });

  if (error) throw error;
}

export async function removePlan(id: string): Promise<void> {
  const { error } = await supabase.from('meal_plans').delete().eq('id', id);
  if (error) throw error;
}
