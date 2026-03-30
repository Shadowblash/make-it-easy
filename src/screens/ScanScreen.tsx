import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Vibration,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useTranslation } from 'react-i18next';
import { lookupBarcode } from '../services/ScanService';
import AddItemModal from '../components/AddItemModal';
import type { Zone } from '../types';

interface Props {
  defaultZone?: Zone;
  onClose: () => void;
  onAdded: () => void;
}

export default function ScanScreen({ defaultZone = 'fridge', onClose, onAdded }: Props) {
  const { t } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();
  const [searching, setSearching] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [prefillName, setPrefillName] = useState('');
  const [prefillBarcode, setPrefillBarcode] = useState<string | undefined>();
  const lastScanned = useRef<string | null>(null);

  async function handleBarcode(barcode: string) {
    if (searching || lastScanned.current === barcode) return;
    lastScanned.current = barcode;
    setSearching(true);
    Vibration.vibrate(100);

    try {
      const product = await lookupBarcode(barcode);
      if (product) {
        setPrefillName(product.name);
        setPrefillBarcode(barcode);
      } else {
        // Not found — open modal with empty name for manual entry
        setPrefillName('');
        setPrefillBarcode(barcode);
      }
      setAddModalVisible(true);
    } finally {
      setSearching(false);
    }
  }

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.permText}>L'accès à la caméra est requis pour scanner.</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Autoriser la caméra</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelLink} onPress={onClose}>
          <Text style={styles.cancelLinkText}>{t('common.cancel')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={({ data }) => handleBarcode(data)}
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'] }}
      />

      {/* Overlay */}
      <View style={styles.overlay}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} accessibilityRole="button">
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.topTitle}>{t('scan.title')}</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Scan frame */}
        <View style={styles.frameContainer}>
          <View style={styles.frame}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
        </View>

        {/* Bottom instruction */}
        <View style={styles.bottom}>
          {searching ? (
            <View style={styles.searchingRow}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.instructionText}>{t('scan.searching')}</Text>
            </View>
          ) : (
            <Text style={styles.instructionText}>{t('scan.instruction')}</Text>
          )}
          <TouchableOpacity
            style={styles.manualBtn}
            onPress={() => { setPrefillName(''); setPrefillBarcode(undefined); setAddModalVisible(true); }}
            accessibilityRole="button"
          >
            <Text style={styles.manualBtnText}>{t('inventory.typeManually')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Add Item modal slides up after scan */}
      <AddItemModal
        visible={addModalVisible}
        defaultZone={defaultZone}
        prefillName={prefillName}
        prefillBarcode={prefillBarcode}
        onClose={() => {
          setAddModalVisible(false);
          lastScanned.current = null; // allow re-scanning after closing
        }}
        onAdded={() => {
          setAddModalVisible(false);
          onAdded();
        }}
      />
    </View>
  );
}

const FRAME_SIZE = 220;
const CORNER_SIZE = 24;
const CORNER_WIDTH = 3;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { alignItems: 'center', justifyContent: 'center', padding: 32 },
  permText: { color: '#fff', fontSize: 16, textAlign: 'center', marginBottom: 24 },
  permBtn: {
    backgroundColor: '#4CAF73', paddingHorizontal: 24, paddingVertical: 14,
    borderRadius: 12, marginBottom: 12,
  },
  permBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  cancelLink: { padding: 12 },
  cancelLinkText: { color: 'rgba(255,255,255,0.7)', fontSize: 15 },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between' },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  closeBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { color: '#fff', fontSize: 20 },
  topTitle: { color: '#fff', fontSize: 17, fontWeight: '600' },
  frameContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  frame: { width: FRAME_SIZE, height: FRAME_SIZE },
  corner: {
    position: 'absolute', width: CORNER_SIZE, height: CORNER_SIZE, borderColor: '#fff',
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH },
  cornerTR: { top: 0, right: 0, borderTopWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH },
  bottom: {
    backgroundColor: 'rgba(0,0,0,0.5)', padding: 24, paddingBottom: 48,
    alignItems: 'center', gap: 16,
  },
  searchingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  instructionText: { color: '#fff', fontSize: 15, textAlign: 'center' },
  manualBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  manualBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
