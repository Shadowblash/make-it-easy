import { supabase } from './supabase';

// Average price per kg by category (FR indicative prices from plan spec)
const PRICE_PER_KG: Record<string, number> = {
  meat: 12,
  vegetable: 3,
  dairy: 5,
  grocery: 4,
};

const DEFAULT_PRICE_PER_KG = 4;

export interface MonthlyStats {
  mealsCooked: number;
  itemsConsumedBeforeExpiry: number;
  estimatedSavingsEur: number;
  topMeals: { name: string; count: number }[];
}

export async function getMonthlyStats(): Promise<MonthlyStats> {
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // Meals cooked this month (user source only)
  const { data: meals, error: mealsError } = await supabase
    .from('meals')
    .select('id, name')
    .gte('cooked_at', firstOfMonth)
    .eq('source', 'user');

  if (mealsError) throw mealsError;

  const mealsCooked = meals?.length ?? 0;

  // Top meals (all time, user source)
  const { data: allMeals } = await supabase
    .from('meals')
    .select('name')
    .eq('source', 'user')
    .order('cooked_at', { ascending: false })
    .limit(100);

  const countMap: Record<string, number> = {};
  for (const m of allMeals ?? []) {
    countMap[m.name] = (countMap[m.name] ?? 0) + 1;
  }
  const topMeals = Object.entries(countMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  // Waste avoided: items that had expiry_date set and were consumed (deleted)
  // Proxy: count inventory items created this month that had expiry_date
  // (Actual "consumed before expiry" would need an audit log — V1 estimation)
  const itemsConsumedBeforeExpiry = mealsCooked * 3; // rough proxy: 3 ingredients saved per meal

  // Savings: mealsCooked × avg 4 ingredients × avg 200g × avg price/kg
  const estimatedSavingsEur = Math.round(mealsCooked * 4 * 0.2 * DEFAULT_PRICE_PER_KG * 10) / 10;

  return { mealsCooked, itemsConsumedBeforeExpiry, estimatedSavingsEur, topMeals };
}
