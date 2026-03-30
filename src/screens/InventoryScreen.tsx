import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { Zone } from '../types';

const ZONES: Zone[] = ['pantry', 'fridge', 'freezer', 'leftovers'];

export default function InventoryScreen() {
  const { t } = useTranslation();
  const [activeZone, setActiveZone] = useState<Zone>('fridge');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Zone tabs */}
      <View style={styles.zoneTabs}>
        {ZONES.map((zone) => (
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
          </TouchableOpacity>
        ))}
      </View>

      {/* Empty state placeholder — replaced by real list in next iteration */}
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>{t('inventory.empty')}</Text>
        <TouchableOpacity style={styles.addButton} accessibilityRole="button">
          <Text style={styles.addButtonText}>{t('inventory.scan')}</Text>
        </TouchableOpacity>
      </View>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} accessibilityRole="button" accessibilityLabel={t('inventory.addItem')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F0E8' },
  zoneTabs: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 8, gap: 8 },
  zoneTab: {
    flex: 1, paddingVertical: 8, alignItems: 'center',
    borderRadius: 8, backgroundColor: 'rgba(61,43,31,0.06)',
  },
  zoneTabActive: { backgroundColor: '#4CAF73' },
  zoneTabText: { fontSize: 13, fontWeight: '600', color: '#6B5E57' },
  zoneTabTextActive: { color: '#fff' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyText: { fontSize: 16, color: '#6B5E57', textAlign: 'center', marginBottom: 24, lineHeight: 24 },
  addButton: {
    backgroundColor: '#4CAF73', paddingHorizontal: 24, paddingVertical: 14,
    borderRadius: 12, minHeight: 48, justifyContent: 'center',
  },
  addButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#4CAF73', alignItems: 'center', justifyContent: 'center',
    shadowColor: 'rgba(61,43,31,0.2)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 8,
    elevation: 6,
  },
  fabText: { fontSize: 28, color: '#fff', lineHeight: 32 },
});
