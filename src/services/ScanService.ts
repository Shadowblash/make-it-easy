// Open Food Facts barcode lookup
// Coverage FR: ~70% of packaged products
// Fallback: manual entry when barcode not found

export interface ProductInfo {
  name: string;        // product_name_fr if available, else product_name
  barcode: string;
  quantity?: string;   // e.g. "500 g" — raw string from OFG, user can adjust
}

const OFG_BASE = 'https://world.openfoodfacts.org/api/v2/product';

/**
 * Look up a barcode via Open Food Facts.
 * Returns null if not found — caller should fall back to manual entry.
 */
export async function lookupBarcode(barcode: string): Promise<ProductInfo | null> {
  try {
    const res = await fetch(`${OFG_BASE}/${barcode}.json?fields=product_name,product_name_fr,quantity`, {
      headers: { 'User-Agent': 'MakeItEasy/1.0 (contact@makiteasy.app)' },
    });

    if (!res.ok) return null;

    const json = await res.json();
    if (json.status !== 1 || !json.product) return null;

    const product = json.product;
    // Use FR name if available, otherwise EN name, otherwise null
    const name: string | undefined = product.product_name_fr || product.product_name;
    if (!name) return null;

    return {
      name: name.trim(),
      barcode,
      quantity: product.quantity ?? undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Parse a quantity string from Open Food Facts into numeric qty + unit.
 * Examples: "500 g" → { qty: 500, unit: 'g' }
 *           "1 L"   → { qty: 1, unit: 'L' }
 *           "6 pièces" → { qty: 6, unit: 'piece' }
 */
export function parseQuantity(raw: string): { qty: number; unit: string } | null {
  const match = raw.trim().match(/^(\d+(?:[.,]\d+)?)\s*([a-zA-ZÀ-ÿ]+)$/);
  if (!match) return null;

  const qty = parseFloat(match[1].replace(',', '.'));
  const rawUnit = match[2].toLowerCase();

  const unitMap: Record<string, string> = {
    g: 'g', gr: 'g', gram: 'g', gramme: 'g', grammes: 'g',
    kg: 'kg', kilo: 'kg', kilogramme: 'kg',
    ml: 'ml', millilitre: 'ml', millilitres: 'ml',
    l: 'L', litre: 'L', litres: 'L',
    piece: 'piece', pieces: 'piece', pièce: 'piece', pièces: 'piece',
    tranche: 'slice', tranches: 'slice', slice: 'slice',
  };

  const unit = unitMap[rawUnit];
  if (!unit) return null;

  return { qty, unit };
}
