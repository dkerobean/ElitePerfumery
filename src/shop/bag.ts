import { useEffect, useRef, useState } from 'react';
import { BRAND, money } from '../config';
import { deliveryLines, zoneOf, type Delivery } from '../lib/order';
import { PRODUCTS, type Product } from './products';

export type Bag = Record<string, number>; // productId -> qty

const KEY = 'ep-bag-v1';

/** Bag state, remembered on this phone between visits (best-effort). */
export function useBag() {
  // Starts empty (matches the pre-rendered page), then loads the saved bag.
  const [bag, setBag] = useState<Bag>({});
  const loaded = useRef(false);
  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || '{}') as Bag;
      // drop anything no longer in the catalogue
      const saved = Object.fromEntries(Object.entries(raw).filter(([id, q]) => q > 0 && PRODUCTS.some((p) => p.id === id)));
      if (Object.keys(saved).length) setBag(saved);
    } catch {
      /* private mode etc. */
    }
    loaded.current = true;
  }, []);
  useEffect(() => {
    if (!loaded.current) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(bag));
    } catch {
      /* private mode etc. */
    }
  }, [bag]);

  const add = (id: string, qty = 1) => setBag((b) => ({ ...b, [id]: Math.min(20, (b[id] ?? 0) + qty) }));
  const set = (id: string, qty: number) =>
    setBag((b) => {
      const n = { ...b };
      if (qty <= 0) delete n[id];
      else n[id] = Math.min(20, qty);
      return n;
    });
  const clear = () => setBag({});
  return { bag, add, set, clear };
}

export interface Line {
  product: Product;
  qty: number;
  total: number | null;
}

export function bagLines(bag: Bag): Line[] {
  return Object.entries(bag)
    .map(([id, qty]) => {
      const product = PRODUCTS.find((p) => p.id === id);
      return product ? { product, qty, total: product.price === null ? null : product.price * qty } : null;
    })
    .filter((l): l is Line => l !== null);
}

export function bagSummary(bag: Bag, d: Delivery) {
  const lines = bagLines(bag);
  const count = lines.reduce((n, l) => n + l.qty, 0);
  const pricedTotal = lines.reduce((n, l) => n + (l.total ?? 0), 0);
  const hasUnpriced = lines.some((l) => l.total === null);
  const zone = zoneOf(d.zone);
  const fee = zone?.fee ?? null;
  const feeKnown = fee !== null;
  return { lines, count, pricedTotal, hasUnpriced, zone, fee, feeKnown, total: pricedTotal + (fee ?? 0) };
}

const label = (p: Product) => {
  if (p.category === 'inspired') return `${p.name} (${p.notes ?? 'Inspired collection'})`;
  const brand = p.line && p.category === 'perfume' ? `${p.line} ` : '';
  return `${brand}${p.name}${p.size ? ` (${p.size})` : ''}`;
};

/** The structured WhatsApp order form for a shop order. */
export function shopMessage(bag: Bag, d: Delivery, ref: string) {
  const s = bagSummary(bag, d);
  const lines = [
    `*NEW ORDER: ${BRAND.name.toUpperCase()} SHOP*`,
    `Ref: ${ref}`,
    ``,
    `*ITEMS*`,
    ...s.lines.map((l) => `• ${l.qty} × ${label(l.product)}: ${l.total === null ? 'price to confirm' : money(l.total)}`),
    ``,
    ...deliveryLines(d),
    ``,
    `*PAYMENT (pay on delivery)*`,
    `• Items: ${money(s.pricedTotal)}${s.hasUnpriced ? ' + items to price' : ''}`,
    `• Delivery: ${s.feeKnown ? money(s.fee!) : 'To be confirmed'}`,
    s.feeKnown && !s.hasUnpriced ? `• *Total: ${money(s.total)}*` : `• *Total: ${money(s.total)} + ${[s.hasUnpriced && 'item prices', !s.feeKnown && 'delivery fee'].filter(Boolean).join(' + ')} to confirm*`,
    ``,
    s.feeKnown && !s.hasUnpriced
      ? `Please confirm my order and delivery time. Thank you!`
      : `Please confirm the final total and my delivery time. Thank you!`,
  ];
  return lines.join('\n');
}

export function enquiryMessage(p: Product) {
  return `Hello ${BRAND.name}, I'm interested in ${label(p)}${p.price !== null ? ` (${money(p.price)})` : ''}. Is it available?`;
}
