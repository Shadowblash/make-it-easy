import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, ActivityIndicator, Alert,
  Animated, Easing,
} from 'react-native';
import { useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { useTranslation } from 'react-i18next';

import {
  requestSpeechPermission, startListening, stopListening, parseVoiceInput,
  type ParsedVoiceItem,
} from '../services/VoiceService';
import { addItem } from '../services/InventoryService';
import type { Zone } from '../types';

interface Props {
  defaultZone: Zone;
  onAdded: () => void;
}

type Phase = 'idle' | 'listening' | 'confirming' | 'saving';

export default function VoiceInput({ defaultZone, onAdded }: Props) {
  const { t, i18n } = useTranslation();
  const [phase, setPhase] = useState<Phase>('idle');
  const [parsed, setParsed] = useState<ParsedVoiceItem | null>(null);
  const [transcript, setTranscript] = useState('');
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (phase === 'listening') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.25, duration: 700, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 700, easing: Easing.in(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [phase, pulseAnim]);

  // --- Speech recognition events ---

  useSpeechRecognitionEvent('result', (event) => {
    const text = event.results?.[0]?.transcript ?? '';
    if (!text) return;
    setTranscript(text);
    const item = parseVoiceInput(text);
    if (item) {
      setPhase('confirming');
      setParsed(item);
    } else {
      setPhase('idle');
      Alert.alert('', t('voice.error'));
    }
  });

  useSpeechRecognitionEvent('error', () => {
    setPhase('idle');
    Alert.alert('', t('voice.error'));
  });

  useSpeechRecognitionEvent('end', () => {
    // If we're still in listening phase (no result yet), go back to idle
    setPhase((prev) => (prev === 'listening' ? 'idle' : prev));
  });

  // --- Actions ---

  async function handleMicPress() {
    const granted = await requestSpeechPermission();
    if (!granted) {
      Alert.alert('', t('voice.error'));
      return;
    }
    const lang = i18n.language.startsWith('fr') ? 'fr-FR' : 'en-US';
    setPhase('listening');
    startListening(lang);
  }

  function handleCancel() {
    if (phase === 'listening') stopListening();
    setPhase('idle');
    setParsed(null);
    setTranscript('');
  }

  async function handleConfirm() {
    if (!parsed) return;
    setPhase('saving');
    try {
      await addItem({
        name: parsed.name,
        zone: defaultZone,
        qty: parsed.qty,
        qty_unit: parsed.unit,
        expiry_date: null,
        barcode: null,
      });
      setPhase('idle');
      setParsed(null);
      setTranscript('');
      onAdded();
    } catch {
      setPhase('confirming'); // stay on confirm screen so user can retry
      Alert.alert('', t('common.error'));
    }
  }

  function handleRetry() {
    setParsed(null);
    setTranscript('');
    const lang = i18n.language.startsWith('fr') ? 'fr-FR' : 'en-US';
    setPhase('listening');
    startListening(lang);
  }

  // --- Render ---

  return (
    <>
      {/* Mic FAB */}
      <TouchableOpacity
        style={styles.micFab}
        onPress={handleMicPress}
        accessibilityRole="button"
        accessibilityLabel={t('voice.listening')}
        disabled={phase !== 'idle'}
      >
        <Text style={styles.micIcon}>🎙️</Text>
      </TouchableOpacity>

      {/* Listening / Confirming overlay */}
      <Modal
        visible={phase !== 'idle'}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCancel}
        transparent={false}
      >
        <View style={styles.sheet}>
          <View style={styles.handle} />

          {phase === 'listening' && (
            <View style={styles.listenContent}>
              <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim }] }]}>
                <View style={styles.pulseCore} />
              </Animated.View>
              <Text style={styles.listenText}>{t('voice.listening')}</Text>
              <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} accessibilityRole="button">
                <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {(phase === 'confirming' || phase === 'saving') && parsed && (
            <View style={styles.confirmContent}>
              <Text style={styles.confirmTitle}>{t('voice.confirm')}</Text>

              {transcript ? (
                <Text style={styles.transcriptText}>"{transcript}"</Text>
              ) : null}

              <View style={styles.parsedCard}>
                <ParsedRow label="Produit" value={parsed.name} />
                {parsed.qty !== null && (
                  <ParsedRow
                    label="Quantité"
                    value={parsed.qty + (parsed.unit ? ` ${parsed.unit}` : '')}
                  />
                )}
                <ParsedRow label="Zone" value={defaultZone} />
              </View>

              <View style={styles.confirmActions}>
                <TouchableOpacity
                  style={styles.retryBtn}
                  onPress={handleRetry}
                  disabled={phase === 'saving'}
                  accessibilityRole="button"
                >
                  <Text style={styles.retryBtnText}>{t('common.retry')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.confirmBtn, phase === 'saving' && styles.confirmBtnDisabled]}
                  onPress={handleConfirm}
                  disabled={phase === 'saving'}
                  accessibilityRole="button"
                >
                  {phase === 'saving' ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.confirmBtnText}>{t('common.add')}</Text>
                  )}
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} accessibilityRole="button">
                <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </>
  );
}

function ParsedRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.parsedRow}>
      <Text style={styles.parsedLabel}>{label}</Text>
      <Text style={styles.parsedValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  micFab: {
    position: 'absolute', bottom: 24, right: 92,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#FAFAF7',
    borderWidth: 2, borderColor: '#4CAF73',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: 'rgba(61,43,31,0.15)', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1, shadowRadius: 6, elevation: 4,
  },
  micIcon: { fontSize: 22 },
  sheet: {
    flex: 1, backgroundColor: '#F5F0E8', paddingTop: 12,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(61,43,31,0.2)',
    alignSelf: 'center', marginBottom: 24,
  },
  listenContent: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24 },
  pulseRing: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(76,175,115,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  pulseCore: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: '#4CAF73',
  },
  listenText: { fontSize: 20, fontWeight: '600', color: '#3D2B1F' },
  confirmContent: { paddingHorizontal: 20, gap: 16 },
  confirmTitle: { fontSize: 22, fontWeight: '700', color: '#3D2B1F', marginBottom: 4 },
  transcriptText: { fontSize: 14, color: '#6B5E57', fontStyle: 'italic' },
  parsedCard: {
    backgroundColor: '#FAFAF7', borderRadius: 12, padding: 16, gap: 10,
    shadowColor: 'rgba(61,43,31,0.06)', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1, shadowRadius: 4, elevation: 1,
  },
  parsedRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  parsedLabel: { fontSize: 14, color: '#6B5E57', fontWeight: '500' },
  parsedValue: { fontSize: 15, fontWeight: '700', color: '#3D2B1F' },
  confirmActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  retryBtn: {
    flex: 1, height: 48, borderRadius: 10, borderWidth: 1.5, borderColor: '#4CAF73',
    alignItems: 'center', justifyContent: 'center',
  },
  retryBtnText: { fontSize: 15, fontWeight: '600', color: '#4CAF73' },
  confirmBtn: {
    flex: 2, height: 48, borderRadius: 10, backgroundColor: '#4CAF73',
    alignItems: 'center', justifyContent: 'center',
  },
  confirmBtnDisabled: { backgroundColor: 'rgba(76,175,115,0.5)' },
  confirmBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  cancelBtn: { alignItems: 'center', paddingVertical: 12 },
  cancelBtnText: { fontSize: 15, color: '#6B5E57', fontWeight: '500' },
});
