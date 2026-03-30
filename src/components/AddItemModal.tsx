import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Modal, ScrollView, Platform, KeyboardAvoidingView, ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { addItem } from '../services/InventoryService';
import type { Zone, QtyUnit } from '../types';

const ZONES: Zone[] = ['pantry', 'fridge', 'freezer', 'leftovers'];
const UNITS: QtyUnit[] = ['g', 'kg', 'ml', 'L', 'piece', 'slice'];

interface Props {
  visible: boolean;
  defaultZone?: Zone;
  prefillName?: string;
  prefillBarcode?: string;
  onClose: () => void;
  onAdded: () => void;
}

export default function AddItemModal({
  visible, defaultZone = 'fridge', prefillName = '', prefillBarcode,
  onClose, onAdded,
}: Props) {
  const { t } = useTranslation();
  const [name, setName] = useState(prefillName);
  const [zone, setZone] = useState<Zone>(defaultZone);
  const [qty, setQty] = useState('');
  const [unit, setUnit] = useState<QtyUnit>('piece');
  const [expiry, setExpiry] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens
  React.useEffect(() => {
    if (visible) {
      setName(prefillName);
      setZone(defaultZone);
      setQty('');
      setUnit('piece');
      setExpiry('');
      setError(null);
    }
  }, [visible, prefillName, defaultZone]);

  async function handleSave() {
    if (!name.trim()) { setError('Le nom est requis'); return; }
    if (expiry && !parseExpiryDate(expiry)) { setError('Date invalide (JJ/MM/AAAA)'); return; }
    setSaving(true);
    setError(null);
    try {
      await addItem({
        name: name.trim(),
        zone,
        qty: qty ? parseFloat(qty) : null,
        qty_unit: qty ? unit : null,
        expiry_date: expiry ? parseExpiryDate(expiry) : null,
        barcode: prefillBarcode ?? null,
      });
      onAdded();
      onClose();
    } catch (e: any) {
      setError(e.message ?? t('common.error'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.sheet} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Handle */}
        <View style={styles.handle} />

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.title}>{t('inventory.addItem')}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityRole="button">
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Name */}
          <Text style={styles.label}>{t('inventory.addItem')}</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Ex: Poulet, Tomates..."
            placeholderTextColor="#8A8A8A"
            autoFocus
            returnKeyType="done"
          />

          {/* Zone */}
          <Text style={styles.label}>Zone</Text>
          <View style={styles.segmentRow}>
            {ZONES.map((z) => (
              <TouchableOpacity
                key={z}
                style={[styles.segment, zone === z && styles.segmentActive]}
                onPress={() => setZone(z)}
                accessibilityRole="button"
                accessibilityState={{ selected: zone === z }}
              >
                <Text style={[styles.segmentText, zone === z && styles.segmentTextActive]}>
                  {t(`inventory.zones.${z}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Qty + Unit (optional) */}
          <Text style={styles.label}>{t('inventory.qty')} <Text style={styles.optional}>(optionnel)</Text></Text>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.qtyInput]}
              value={qty}
              onChangeText={setQty}
              placeholder="500"
              placeholderTextColor="#8A8A8A"
              keyboardType="decimal-pad"
            />
            <View style={styles.unitRow}>
              {UNITS.map((u) => (
                <TouchableOpacity
                  key={u}
                  style={[styles.unitChip, unit === u && styles.unitChipActive]}
                  onPress={() => setUnit(u)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: unit === u }}
                >
                  <Text style={[styles.unitChipText, unit === u && styles.unitChipTextActive]}>
                    {t(`units.${u}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Expiry date */}
          <Text style={styles.label}>{t('inventory.expiryDate')} <Text style={styles.optional}>(optionnel)</Text></Text>
          <TextInput
            style={styles.input}
            value={expiry}
            onChangeText={setExpiry}
            placeholder="JJ/MM/AAAA"
            placeholderTextColor="#8A8A8A"
            keyboardType="numbers-and-punctuation"
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
            accessibilityRole="button"
          >
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{t('common.add')}</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/** Parse DD/MM/YYYY or YYYY-MM-DD to ISO date string. Returns null for invalid dates. */
function parseExpiryDate(input: string): string | null {
  const ddmm = input.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmm) {
    const day = parseInt(ddmm[1], 10);
    const month = parseInt(ddmm[2], 10);
    const year = parseInt(ddmm[3], 10);
    if (month < 1 || month > 12) return null;
    if (day < 1 || day > daysInMonth(month, year)) return null;
    return `${ddmm[3]}-${ddmm[2].padStart(2, '0')}-${ddmm[1].padStart(2, '0')}`;
  }
  const iso = input.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    const month = parseInt(iso[2], 10);
    const day = parseInt(iso[3], 10);
    const year = parseInt(iso[1], 10);
    if (month < 1 || month > 12) return null;
    if (day < 1 || day > daysInMonth(month, year)) return null;
    return input;
  }
  return null;
}

function daysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate();
}

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: '#F5F0E8' },
  handle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(61,43,31,0.2)',
    alignSelf: 'center', marginTop: 12,
  },
  content: { padding: 20, paddingBottom: 8 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: '700', color: '#3D2B1F' },
  closeBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { fontSize: 18, color: '#6B5E57' },
  label: { fontSize: 13, fontWeight: '600', color: '#6B5E57', marginBottom: 6, marginTop: 14 },
  optional: { fontWeight: '400', color: '#8A8A8A' },
  input: {
    backgroundColor: '#FAFAF7', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 16, color: '#3D2B1F', borderWidth: 1, borderColor: 'rgba(61,43,31,0.1)',
    minHeight: 48,
  },
  segmentRow: { flexDirection: 'row', gap: 6 },
  segment: {
    flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8,
    backgroundColor: 'rgba(61,43,31,0.06)',
  },
  segmentActive: { backgroundColor: '#4CAF73' },
  segmentText: { fontSize: 11, fontWeight: '600', color: '#6B5E57' },
  segmentTextActive: { color: '#fff' },
  row: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  qtyInput: { width: 90 },
  unitRow: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  unitChip: {
    paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8,
    backgroundColor: 'rgba(61,43,31,0.06)', minHeight: 36, justifyContent: 'center',
  },
  unitChipActive: { backgroundColor: '#4CAF73' },
  unitChipText: { fontSize: 13, fontWeight: '600', color: '#6B5E57' },
  unitChipTextActive: { color: '#fff' },
  errorText: { color: '#E55E4D', fontSize: 14, marginTop: 12 },
  footer: { padding: 16, paddingTop: 8 },
  saveBtn: {
    backgroundColor: '#4CAF73', height: 52, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  saveBtnDisabled: { backgroundColor: 'rgba(76,175,115,0.5)' },
  saveBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
