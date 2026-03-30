import { supabase } from './supabase';
import type { ShoppingListItem, QtyUnit } from '../types';

export async function getShoppingList(): Promise<ShoppingListItem[]> {
  const { data, error } = await supabase
    .from('shopping_list')
    .select('*')
    .order('is_checked', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function addToShoppingList(
  ingredientName: string,
  qty: number | null = null,
  qtyUnit: QtyUnit | null = null,
  fromMealId: string | null = null,
): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error('Not authenticated');

  // Check if already in inventory with qty > 0
  const { data: invItems } = await supabase
    .from('inventory_items')
    .select('id, qty')
    .eq('ingredient_name_normalized', ingredientName)
    .limit(1);

  if (invItems && invItems.length > 0) return; // already in inventory

  // Check if already in shopping list — merge qty
  const { data: existing } = await supabase
    .from('shopping_list')
    .select('id, qty')
    .eq('user_id', userId)
    .eq('ingredient_name', ingredientName)
    .eq('is_checked', false)
    .limit(1);

  if (existing && existing.length > 0) {
    const item = existing[0];
    if (item.qty !== null && qty !== null) {
      await supabase
        .from('shopping_list')
        .update({ qty: item.qty + qty })
        .eq('id', item.id);
    }
    return;
  }

  await supabase.from('shopping_list').insert({
    user_id: userId,
    ingredient_name: ingredientName,
    qty,
    qty_unit: qtyUnit,
    is_checked: false,
    from_meal_id: fromMealId,
  });
}

export async function toggleChecked(id: string, current: boolean): Promise<void> {
  const { error } = await supabase
    .from('shopping_list')
    .update({ is_checked: !current })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteShoppingItem(id: string): Promise<void> {
  const { error } = await supabase.from('shopping_list').delete().eq('id', id);
  if (error) throw error;
}

export async function clearChecked(): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return;
  await supabase
    .from('shopping_list')
    .delete()
    .eq('user_id', userId)
    .eq('is_checked', true);
}
