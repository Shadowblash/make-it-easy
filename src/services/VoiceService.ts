import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
import type { QtyUnit } from '../types';

export interface ParsedVoiceItem {
  name: string;
  qty: number | null;
  unit: QtyUnit | null;
}

// Maps spoken unit words (FR + EN) to QtyUnit
const UNIT_MAP: Record<string, QtyUnit> = {
  // grams
  g: 'g', gramme: 'g', grammes: 'g', gram: 'g', grams: 'g',
  // kilograms
  kg: 'kg', kilo: 'kg', kilos: 'kg', kilogramme: 'kg', kilogrammes: 'kg',
  kilogram: 'kg', kilograms: 'kg',
  // milliliters
  ml: 'ml', millilitre: 'ml', millilitres: 'ml', milliliter: 'ml', milliliters: 'ml',
  // liters
  l: 'L', litre: 'L', litres: 'L', liter: 'L', liters: 'L',
  // pieces
  pièce: 'piece', pièces: 'piece', piece: 'piece', pieces: 'piece',
  unité: 'piece', unités: 'piece', unit: 'piece', units: 'piece',
  boite: 'piece', boites: 'piece', boîte: 'piece', boîtes: 'piece', box: 'piece',
  pot: 'piece', pots: 'piece', can: 'piece', cans: 'piece',
  bouteille: 'piece', bouteilles: 'piece', bottle: 'piece', bottles: 'piece',
  sachet: 'piece', sachets: 'piece', bag: 'piece', bags: 'piece',
  // slices
  tranche: 'slice', tranches: 'slice', slice: 'slice', slices: 'slice',
};

// French filler words to strip before the ingredient name
const FILLERS = /^(ajouter?\s+|add\s+)?(du\s+|de\s+la\s+|de\s+l['']|des\s+|de\s+|d['']|some\s+|a\s+|an\s+)?/i;

/**
 * Parse a voice transcript into a structured item.
 * Examples:
 *   "ajouter 500g de farine"   → { name: 'farine', qty: 500, unit: 'g' }
 *   "deux kilos de tomates"    → { name: 'tomates', qty: 2, unit: 'kg' }
 *   "du lait"                  → { name: 'lait', qty: null, unit: null }
 *   "3 oeufs"                  → { name: 'oeufs', qty: 3, unit: 'piece' }
 */
export function parseVoiceInput(transcript: string): ParsedVoiceItem | null {
  const text = transcript.trim().toLowerCase();
  if (!text) return null;

  // Written-out numbers (FR + EN, 1–12)
  const WORD_NUMS: Record<string, number> = {
    un: 1, une: 1, one: 1, deux: 2, two: 2, trois: 3, three: 3,
    quatre: 4, four: 4, cinq: 5, five: 5, six: 6, sept: 7, seven: 7,
    huit: 8, eight: 8, neuf: 9, nine: 9, dix: 10, ten: 10,
    onze: 11, eleven: 11, douze: 12, twelve: 12,
  };

  // Match: [add] [qty] [unit] [filler] name
  // e.g. "ajouter 500 g de farine", "2kg de sucre", "trois oeufs"
  const pattern = /^(?:ajouter?\s+|add\s+)?(\d+(?:[.,]\d+)?|[a-zéèêàâùûîôç]+)?\s*([a-zéèêàâùûîôç]+)?\s*(?:de\s+l[''a-z]+|du\s+|de\s+la\s+|des\s+|de\s+|d['']\s*)?(.+)?$/i;
  const m = text.match(pattern);

  if (!m) return null;

  let qty: number | null = null;
  let unit: QtyUnit | null = null;
  let nameRaw = '';

  const part1 = m[1]?.trim() ?? '';
  const part2 = m[2]?.trim() ?? '';
  const part3 = m[3]?.trim() ?? '';

  // Try to extract numeric or word-number qty from part1
  const numericQty = parseFloat(part1.replace(',', '.'));
  if (!isNaN(numericQty)) {
    qty = numericQty;
    // part2 might be a unit
    if (part2 && UNIT_MAP[part2]) {
      unit = UNIT_MAP[part2];
      nameRaw = part3;
    } else if (part2) {
      // no unit, part2 + part3 = name
      nameRaw = [part2, part3].filter(Boolean).join(' ');
    } else {
      nameRaw = part3;
    }
  } else if (WORD_NUMS[part1]) {
    qty = WORD_NUMS[part1];
    if (part2 && UNIT_MAP[part2]) {
      unit = UNIT_MAP[part2];
      nameRaw = part3;
    } else if (part2) {
      nameRaw = [part2, part3].filter(Boolean).join(' ');
    } else {
      nameRaw = part3;
    }
  } else if (part1 && UNIT_MAP[part1]) {
    // e.g. "g farine" (unlikely but handle)
    unit = UNIT_MAP[part1];
    nameRaw = [part2, part3].filter(Boolean).join(' ');
  } else {
    // No qty — entire text is the name after stripping fillers
    nameRaw = text.replace(FILLERS, '');
  }

  // Strip remaining fillers from nameRaw
  nameRaw = nameRaw.replace(FILLERS, '').trim();

  if (!nameRaw) return null;

  // Capitalize first letter
  const name = nameRaw.charAt(0).toUpperCase() + nameRaw.slice(1);

  return { name, qty, unit };
}

export async function requestSpeechPermission(): Promise<boolean> {
  const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
  return granted;
}

export function startListening(lang: string = 'fr-FR'): void {
  ExpoSpeechRecognitionModule.start({
    lang,
    interimResults: false,
    continuous: false,
    requiresOnDeviceRecognition: false,
  });
}

export function stopListening(): void {
  ExpoSpeechRecognitionModule.stop();
}
