import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';

import {
  getShoppingList, toggleChecked, deleteShoppingItem, clearChecked,
} from '../services/ShoppingService';
import type { ShoppingListItem } from '../types';

export default function ShoppingScreen() {
  const { t } = useTranslation();
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getShoppingList();
      setItems(data);
    } catch { /* silent — offline fallback */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function handleToggle(item: ShoppingListItem) {
    // Optimistic update
    setItems((prev) =>
      prev.map((i) => i.id === item.id ? { ...i, is_checked: !i.is_checked } : i)
        .sort((a, b) => Number(a.is_checked) - Number(b.is_checked))
    );
    try {
      await toggleChecked(item.id, item.is_checked);
    } catch {
      // Rollback on failure
      setItems((prev) =>
        prev.map((i) => i.id === item.id ? { ...i, is_checked: item.is_checked } : i)
          .sort((a, b) => Number(a.is_checked) - Number(b.is_checked))
      );
    }
  }

  async function handleDelete(id: string) {
    const snapshot = items;
    setItems((prev) => prev.filter((i) => i.id !== id));
    try {
      await deleteShoppingItem(id);
    } catch {
      setItems(snapshot);
    }
  }

  async function handleClearChecked() {
    const snapshot = items;
    setItems((prev) => prev.filter((i) => !i.is_checked));
    try {
      await clearChecked();
    } catch {
      setItems(snapshot);
    }
  }

  const checkedCount = items.filter((i) => i.is_checked).length;

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.center}><ActivityIndicator color="#4CAF73" size="large" /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('shopping.title')}</Text>
        {checkedCount > 0 && (
          <TouchableOpacity onPress={handleClearChecked} accessibilityRole="button">
            <Text style={styles.clearText}>{t('shopping.clearChecked')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {items.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyText}>{t('shopping.empty')}</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#4CAF73" />}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <ShoppingRow item={item} onToggle={() => handleToggle(item)} onDelete={() => handleDelete(item.id)} t={t} />
          )}
        />
      )}
    </SafeAreaView>
  );
}

function ShoppingRow({
  item, onToggle, onDelete, t,
}: {
  item: ShoppingListItem;
  onToggle: () => void;
  onDelete: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: (k: string, o?: any) => string;
}) {
  return (
    <View style={[styles.row, item.is_checked && styles.rowChecked]}>
      <TouchableOpacity
        style={[styles.checkbox, item.is_checked && styles.checkboxChecked]}
        onPress={onToggle}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: item.is_checked }}
      >
        {item.is_checked && <Text style={styles.checkmark}>✓</Text>}
      </TouchableOpacity>

      <View style={styles.rowContent}>
        <Text style={[styles.rowName, item.is_checked && styles.rowNameChecked]} numberOfLines={1}>
          {item.ingredient_name}
        </Text>
        {item.qty !== null && (
          <Text style={styles.rowQty}>
            {item.qty} {item.qty_unit ? t(`units.${item.qty_unit}`) : ''}
          </Text>
        )}
      </View>

      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={onDelete}
        accessibilityRole="button"
        accessibilityLabel={t('common.delete')}
      >
        <Text style={styles.deleteBtnText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F0E8' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8,
  },
  title: { fontSize: 22, fontWeight: '700', color: '#3D2B1F' },
  clearText: { fontSize: 14, fontWeight: '600', color: '#4CAF73' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: 16, color: '#6B5E57', textAlign: 'center', lineHeight: 24 },
  listContent: { paddingHorizontal: 16, paddingVertical: 8 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FAFAF7', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 12,
    marginBottom: 8, minHeight: 52,
    shadowColor: 'rgba(61,43,31,0.06)', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1, shadowRadius: 3, elevation: 1,
  },
  rowChecked: { opacity: 0.5 },
  checkbox: {
    width: 24, height: 24, borderRadius: 6, borderWidth: 2,
    borderColor: '#4CAF73', alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  checkboxChecked: { backgroundColor: '#4CAF73' },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: '700' },
  rowContent: { flex: 1 },
  rowName: { fontSize: 15, fontWeight: '600', color: '#3D2B1F' },
  rowNameChecked: { textDecorationLine: 'line-through', color: '#8A8A8A' },
  rowQty: { fontSize: 13, color: '#6B5E57', marginTop: 2 },
  deleteBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  deleteBtnText: { color: '#8A8A8A', fontSize: 16 },
});
