// Ingredient normalization pipeline (spec from CEO plan):
// 1. Lowercase + trim
// 2. Alias table lookup (EN→FR + FR synonyms), keys must be in STEMMED form
// 3. Simple suffix stemming (French: /[sx]$/ → '', /aux$/ → 'al')
// 4. Result: canonical French normalized string

// ─── Step 3: stemmer (lightweight suffix stripping) ──────────────────────────

function stem(word: string): string {
  if (word.endsWith('aux')) return word.slice(0, -3) + 'al';
  if (word.endsWith('s') || word.endsWith('x')) return word.slice(0, -1);
  return word;
}

// ─── Step 2: alias table ─────────────────────────────────────────────────────
// Keys are STEMMED (post-stem) forms.
// Values are the canonical French normalized form.

const ALIASES: Record<string, string> = {
  // EN → FR
  chicken: 'poulet',
  egg: 'oeuf',
  milk: 'lait',
  butter: 'beurre',
  flour: 'farine',
  sugar: 'sucre',
  salt: 'sel',
  pepper: 'poivre',
  tomato: 'tomate',
  onion: 'oignon',
  garlic: 'ail',
  carrot: 'carotte',
  potato: 'pomme de terre',
  rice: 'riz',
  pasta: 'pate',
  beef: 'boeuf',
  pork: 'porc',
  fish: 'poisson',
  shrimp: 'crevette',
  mushroom: 'champignon',
  cream: 'creme fraiche',
  cheese: 'fromage',
  bacon: 'lardons',
  ham: 'jambon',
  lemon: 'citron',
  apple: 'pomme',
  oil: 'huile olive',
  wine: 'vin',
  // FR synonyms / variants (stemmed key → canonical)
  'tomate cerise': 'tomate',
  tomate: 'tomate',
  oeuf: 'oeuf',
  pate: 'pate',
  creme: 'creme fraiche',
  lardon: 'lardons',
  champignon: 'champignon',
  pomme: 'pomme',
  carotte: 'carotte',
  courgette: 'courgette',
  aubergine: 'aubergine',
  poivron: 'poivron',
  poulet: 'poulet',
  boeuf: 'boeuf',
};

// ─── Main normalize function ──────────────────────────────────────────────────

export function normalize(raw: string): string {
  // Step 1: lowercase + trim
  const lowered = raw.toLowerCase().trim();

  // Step 3 first: stem each word of the phrase
  const stemmed = lowered
    .split(/\s+/)
    .map(stem)
    .join(' ');

  // Step 2: alias lookup on stemmed form
  if (ALIASES[stemmed]) return ALIASES[stemmed];

  // Also try single-word alias on full stemmed phrase
  const singleStemmed = stem(lowered.replace(/\s+/g, ' '));
  if (ALIASES[singleStemmed]) return ALIASES[singleStemmed];

  // No alias found — return stemmed form as canonical
  return stemmed;
}

/**
 * Normalize a list of ingredient names.
 */
export function normalizeAll(names: string[]): string[] {
  return names.map(normalize);
}
