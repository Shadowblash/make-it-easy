import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { decrementItem } from '../services/InventoryService';
import type { QtyUnit } from '../types';

export interface MismatchItem {
  displayName: string;
  normalizedName: string;
  invQty: number;
  invUnit: QtyUnit;
}

interface Props {
  items: MismatchItem[];
  onDone: () => void;
}

export default function IncompatibleUnitModal({ items, onDone }: Props) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const [qtyInput, setQtyInput] = useState('');

  const current = items[index];
  const isLast = index === items.length - 1;

  function advance() {
    if (isLast) {
      onDone();
    } else {
      setIndex((i) => i + 1);
      setQtyInput('');
    }
  }

  async function handleConfirm() {
    const qty = parseFloat(qtyInput.replace(',', '.'));
    if (!isNaN(qty) && qty > 0) {
      await decrementItem(current.normalizedName, qty, current.invUnit);
    }
    advance();
  }

  async function handleSkip() {
    advance();
  }

  if (!current) return null;

  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleSkip}
      transparent={false}
    >
      <KeyboardAvoidingView
        style={styles.sheet}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.handle} />

        <Text style={styles.title}>{t('incompatibleUnit.title')}</Text>

        <View style={styles.itemCard}>
          <Text style={styles.itemName}>{current.displayName}</Text>
          <Text style={styles.itemInfo}>
            {current.invQty} {t(`units.${current.invUnit}`)} {t('incompatibleUnit.inInventory')}
          </Text>
        </View>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor="#8A8A8A"
            value={qtyInput}
            onChangeText={setQtyInput}
            autoFocus
          />
          <View style={styles.unitPill}>
            <Text style={styles.unitPillText}>{t(`units.${current.invUnit}`)}</Text>
          </View>
        </View>

        {items.length > 1 && (
          <Text style={styles.counter}>{index + 1}/{items.length}</Text>
        )}

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.skipBtn}
            onPress={handleSkip}
            accessibilityRole="button"
          >
            <Text style={styles.skipText}>{t('incompatibleUnit.skip')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.confirmBtn, !qtyInput && styles.confirmBtnDisabled]}
            onPress={handleConfirm}
            disabled={!qtyInput}
            accessibilityRole="button"
          >
            <Text style={styles.confirmText}>{t('incompatibleUnit.confirm')}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: '#F5F0E8', paddingTop: 12, paddingHorizontal: 20 },
  handle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(61,43,31,0.2)',
    alignSelf: 'center', marginBottom: 28,
  },
  title: { fontSize: 20, fontWeight: '700', color: '#3D2B1F', marginBottom: 20 },
  itemCard: {
    backgroundColor: '#FAFAF7', borderRadius: 12, padding: 16, marginBottom: 20,
    shadowColor: 'rgba(61,43,31,0.06)', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1, shadowRadius: 4, elevation: 1,
  },
  itemName: { fontSize: 17, fontWeight: '700', color: '#3D2B1F', marginBottom: 4 },
  itemInfo: { fontSize: 13, color: '#6B5E57' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  input: {
    flex: 1, height: 56, backgroundColor: '#FAFAF7', borderRadius: 12,
    paddingHorizontal: 16, fontSize: 24, fontWeight: '700', color: '#3D2B1F',
    borderWidth: 1.5, borderColor: '#4CAF73',
  },
  unitPill: {
    backgroundColor: '#4CAF73', borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  unitPillText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  counter: { fontSize: 13, color: '#8A8A8A', textAlign: 'center', marginBottom: 20 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  skipBtn: {
    flex: 1, height: 52, borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(61,43,31,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  skipText: { fontSize: 15, fontWeight: '600', color: '#6B5E57' },
  confirmBtn: {
    flex: 2, height: 52, borderRadius: 12, backgroundColor: '#4CAF73',
    alignItems: 'center', justifyContent: 'center',
  },
  confirmBtnDisabled: { backgroundColor: 'rgba(76,175,115,0.4)' },
  confirmText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
