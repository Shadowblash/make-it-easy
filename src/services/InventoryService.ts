import { supabase } from './supabase';
import { normalize } from '../utils/normalize';
import type { InventoryItem, Zone, QtyUnit } from '../types';

export type CreateItemInput = {
  name: string;
  zone: Zone;
  qty?: number | null;
  qty_unit?: QtyUnit | null;
  expiry_date?: string | null;
  barcode?: string | null;
};

export type UpdateItemInput = Partial<Omit<CreateItemInput, 'name'>> & {
  name?: string;
};

// ─── READ ─────────────────────────────────────────────────────────────────────

export async function getInventoryByZone(zone: Zone): Promise<InventoryItem[]> {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('zone', zone)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getAllInventory(): Promise<InventoryItem[]> {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/**
 * Returns items expiring within the next `withinDays` days (default 48h = 2 days).
 */
export async function getExpiringItems(withinDays = 2): Promise<InventoryItem[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + withinDays);

  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .not('expiry_date', 'is', null)
    .lte('expiry_date', cutoff.toISOString().split('T')[0]) // date only
    .order('expiry_date', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

// ─── CREATE ───────────────────────────────────────────────────────────────────

export async function addItem(input: CreateItemInput): Promise<InventoryItem> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('inventory_items')
    .insert({
      user_id: userId,
      name: input.name.trim(),
      ingredient_name_normalized: normalize(input.name),
      zone: input.zone,
      qty: input.qty ?? null,
      qty_unit: input.qty_unit ?? null,
      expiry_date: input.expiry_date ?? null,
      barcode: input.barcode ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── UPDATE ───────────────────────────────────────────────────────────────────

export async function updateItem(id: string, input: UpdateItemInput): Promise<InventoryItem> {
  const patch: Record<string, unknown> = { ...input };
  if (input.name) {
    patch.ingredient_name_normalized = normalize(input.name);
    patch.name = input.name.trim();
  }

  const { data, error } = await supabase
    .from('inventory_items')
    .update(patch)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

export async function deleteItem(id: string): Promise<void> {
  const { error } = await supabase
    .from('inventory_items')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ─── DECREMENT (used by "Je fais ça ce soir") ────────────────────────────────

/**
 * Tries to decrement an item by the given qty.
 * If qty becomes <= 0, deletes the item.
 * Returns 'decremented' | 'deleted' | 'not_found' | 'unit_mismatch'.
 */
export async function decrementItem(
  normalizedName: string,
  qty: number,
  unit: QtyUnit,
): Promise<'decremented' | 'deleted' | 'not_found' | 'unit_mismatch'> {
  const { data: items, error } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('ingredient_name_normalized', normalizedName)
    .limit(1);

  if (error) throw error;
  if (!items || items.length === 0) return 'not_found';

  const item = items[0];

  if (item.qty === null || item.qty_unit === null) {
    // No quantity tracked — just delete
    await deleteItem(item.id);
    return 'deleted';
  }

  if (item.qty_unit !== unit) return 'unit_mismatch';

  const newQty = item.qty - qty;
  if (newQty <= 0) {
    await deleteItem(item.id);
    return 'deleted';
  }

  await updateItem(item.id, { qty: newQty });
  return 'decremented';
}
