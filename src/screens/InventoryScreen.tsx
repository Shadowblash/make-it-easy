import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';

import { getInventoryByZone, deleteItem } from '../services/InventoryService';
import type { InventoryItem, Zone } from '../types';

const ZONES: Zone[] = ['pantry', 'fridge', 'freezer', 'leftovers'];

export default function InventoryScreen() {
  const { t } = useTranslation();
  const [activeZone, setActiveZone] = useState<Zone>('fridge');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    setError(null);
    try {
      const data = await getInventoryByZone(activeZone);
      setItems(data);
    } catch {
      setError(t('inventory.errorLoad'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeZone, t]);

  // Reload when screen comes into focus (after adding/editing items)
  useFocusEffect(useCallback(() => { loadItems(); }, [loadItems]));

  // Reload when zone changes
  useEffect(() => {
    setLoading(true);
    loadItems();
  }, [activeZone, loadItems]);

  async function handleDelete(item: InventoryItem) {
    Alert.alert(t('inventory.deleteConfirm'), item.name, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteItem(item.id);
          setItems((prev) => prev.filter((i) => i.id !== item.id));
        },
      },
    ]);
  }

  function onRefresh() {
    setRefreshing(true);
    loadItems();
  }

  const expiringIds = new Set(
    items
      .filter((item) => {
        if (!item.expiry_date) return false;
        const diff = new Date(item.expiry_date).getTime() - Date.now();
        return diff <= 48 * 60 * 60 * 1000; // 48h
      })
      .map((i) => i.id),
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Zone tabs */}
      <View style={styles.zoneTabs} accessibilityRole="tablist">
        {ZONES.map((zone) => {
          const hasExpiring = items.some((i) => expiringIds.has(i.id) && i.zone === zone);
          return (
            <TouchableOpacity
              key={zone}
              style={[styles.zoneTab, activeZone === zone && styles.zoneTabActive]}
              onPress={() => setActiveZone(zone)}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeZone === zone }}
            >
              <Text style={[styles.zoneTabText, activeZone === zone && styles.zoneTabTextActive]}>
                {t(`inventory.zones.${zone}`)}
              </Text>
              {hasExpiring && <View style={styles.expiryDot} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#4CAF73" size="large" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadItems}>
            <Text style={styles.retryText}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>{t('inventory.empty')}</Text>
          <TouchableOpacity style={styles.addButton} accessibilityRole="button">
            <Text style={styles.addButtonText}>{t('inventory.scan')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4CAF73" />}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <IngredientRow
              item={item}
              isExpiring={expiringIds.has(item.id)}
              onDelete={() => handleDelete(item)}
              t={t}
            />
          )}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        accessibilityRole="button"
        accessibilityLabel={t('inventory.addItem')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// ─── IngredientRow ────────────────────────────────────────────────────────────

function IngredientRow({
  item, isExpiring, onDelete, t,
}: {
  item: InventoryItem;
  isExpiring: boolean;
  onDelete: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: (key: string, opts?: any) => string;
}) {
  const expiryLabel = getExpiryLabel(item.expiry_date, t);

  return (
    <Swipeable
      renderRightActions={() => (
        <TouchableOpacity style={styles.deleteAction} onPress={onDelete} accessibilityRole="button">
          <Text style={styles.deleteActionText}>{t('common.delete')}</Text>
        </TouchableOpacity>
      )}
    >
      <View style={styles.row} accessibilityRole="none">
        <View style={styles.rowMain}>
          <Text style={styles.rowName} numberOfLines={1}>{item.name}</Text>
          {item.qty !== null && (
            <Text style={styles.rowQty}>
              {item.qty} {item.qty_unit ? t(`units.${item.qty_unit}`) : ''}
            </Text>
          )}
        </View>
        {isExpiring && expiryLabel ? (
          <View style={[styles.expiryBadge, styles.expiryBadgeRed]}>
            <Text
              style={styles.expiryBadgeText}
              accessibilityLabel={expiryLabel}
            >
              {expiryLabel}
            </Text>
          </View>
        ) : expiryLabel ? (
          <View style={[styles.expiryBadge, styles.expiryBadgeAmber]}>
            <Text style={styles.expiryBadgeText}>{expiryLabel}</Text>
          </View>
        ) : null}
      </View>
    </Swipeable>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getExpiryLabel(expiryDate: string | null, t: (k: string, o?: any) => string): string | null {
  if (!expiryDate) return null;
  const diff = new Date(expiryDate).getTime() - Date.now();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return t('inventory.expired');
  if (days === 0) return t('inventory.expiresToday');
  return t('inventory.expiresIn', { days });
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F0E8' },
  zoneTabs: {
    flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, gap: 8,
  },
  zoneTab: {
    flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8,
    backgroundColor: 'rgba(61,43,31,0.06)', position: 'relative',
  },
  zoneTabActive: { backgroundColor: '#4CAF73' },
  zoneTabText: { fontSize: 12, fontWeight: '600', color: '#6B5E57' },
  zoneTabTextActive: { color: '#fff' },
  expiryDot: {
    position: 'absolute', top: 4, right: 4,
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#E55E4D',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { fontSize: 15, color: '#E55E4D', textAlign: 'center', marginBottom: 16 },
  retryButton: {
    paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#4CAF73', borderRadius: 8,
  },
  retryText: { color: '#fff', fontWeight: '600' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyText: { fontSize: 16, color: '#6B5E57', textAlign: 'center', marginBottom: 24, lineHeight: 24 },
  addButton: {
    backgroundColor: '#4CAF73', paddingHorizontal: 24, paddingVertical: 14,
    borderRadius: 12, minHeight: 48, justifyContent: 'center',
  },
  addButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  listContent: { paddingHorizontal: 16, paddingVertical: 8 },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FAFAF7', borderRadius: 10, paddingHorizontal: 14,
    paddingVertical: 12, marginBottom: 8, minHeight: 52,
    shadowColor: 'rgba(61,43,31,0.06)', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1, shadowRadius: 3, elevation: 1,
  },
  rowMain: { flex: 1, marginRight: 8 },
  rowName: { fontSize: 15, fontWeight: '600', color: '#3D2B1F' },
  rowQty: { fontSize: 13, color: '#6B5E57', marginTop: 2 },
  expiryBadge: {
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
  },
  expiryBadgeRed: { backgroundColor: '#E55E4D' },
  expiryBadgeAmber: { backgroundColor: '#F5A623' },
  expiryBadgeText: { fontSize: 11, fontWeight: '600', color: '#fff' },
  deleteAction: {
    backgroundColor: '#E55E4D', justifyContent: 'center', alignItems: 'center',
    width: 80, borderRadius: 10, marginBottom: 8,
  },
  deleteActionText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#4CAF73', alignItems: 'center', justifyContent: 'center',
    shadowColor: 'rgba(61,43,31,0.2)', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1, shadowRadius: 8, elevation: 6,
  },
  fabText: { fontSize: 28, color: '#fff', lineHeight: 32 },
});
