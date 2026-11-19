/**
 * EVERYTHING BUSINESS-RELATED LIVES IN THIS FILE.
 * Prices, delivery fees, deadline, contact details, items, FAQ.
 * Edit here — the whole page updates.
 */

export const BRAND = {
  name: 'Elite Perfumery',
  instagramHandle: '@perfumery.elite',
  instagramUrl: 'https://www.instagram.com/perfumery.elite/',
  whatsappNumber: '233246850861', // international format, no "+"
  whatsappDisplay: '024 685 0861',
  whatsappCatalogUrl: 'https://wa.me/c/233246850861',
};

export const OFFER = {
  name: 'Black Friday Combo',
  unitPrice: 300, // GH₵ for one full box of 8 items
  /** Countdown target. Ghana is GMT (UTC+0), so "Z" = Accra time. */
  endsAt: '2026-11-28T00:00:00Z',
  endsLabel: 'Ends midnight, Friday 27 November',
};

export const CURRENCY = 'GH₵';
export const money = (n: number) => `${CURRENCY}${n.toLocaleString('en-GH')}`;

/** Cache-bust query string for unhashed /img/* assets behind Cloudflare's 7-day edge cache. */
export const IMG_V = '?v=2';
export const imgUrl = (src: string) => (src.includes('?') ? src : `${src}${IMG_V}`);

/**
 * srcset for a /img/…/name.webp photo, using the -240 / -480 copies made by
 * `python3 scripts/optimize-images.py`. Phones then download only the size they show.
 */
export function srcSet(src: string, fullWidth = 720) {
  const clean = src.split('?')[0];
  if (!clean.endsWith('.webp')) return undefined;
  const b = clean.slice(0, -5);
  return `${b}-240.webp${IMG_V} 240w, ${b}-480.webp${IMG_V} 480w, ${clean}${IMG_V} ${fullWidth}w`;
}

export interface Item {
  id: string;
  no: string;
  name: string;
  detail: string;
  img: string;
}

/** The 8 items in the box — names match the flyer. */
export const ITEMS: Item[] = [
  {
    id: 'perfume',
    no: '01',
    name: '55ml Gloria Perfume',
    detail: 'Eau de parfum, matched to who it’s for and the mood you pick.',
    img: '/img/perfume.webp',
  },
  {
    id: 'shower-gel',
    no: '02',
    name: 'Shower Gel',
    detail: '500ml body wash with lotus & rice water.',
    img: '/img/shower-gel.webp',
  },
  {
    id: 'shampoo',
    no: '03',
    name: 'Head & Shoulders Hair Wash',
    detail: 'Menthol Fresh anti-dandruff shampoo.',
    img: '/img/shampoo.webp',
  },
  {
    id: 'liquid-soap',
    no: '04',
    name: '500ml Liquid Soap',
    detail: 'Clear, concentrated, pump bottle.',
    img: '/img/liquid-soap.webp',
  },
  {
    id: 'towel',
    no: '05',
    name: 'Fluffy Towel',
    detail: 'Soft, thick and absorbent.',
    img: '/img/towel.webp',
  },
  {
    id: 'toothpaste',
    no: '06',
    name: 'Whitening Toothpaste',
    detail: 'Premium cool-mint whitening gel.',
    img: '/img/toothpaste.webp',
  },
  {
    id: 'soap',
    no: '07',
    name: 'Bathing Soap',
    detail: 'Rich jasmine-scented bar.',
    img: '/img/soap.webp',
  },
  {
    id: 'toothbrushes',
    no: '08',
    name: '5-in-1 Toothbrush',
    detail: 'Five soft-bristle brushes in one pack.',
    img: '/img/toothbrushes.webp',
  },
];

export type ForId = 'him' | 'her' | 'unisex';
export type VibeId = 'fresh' | 'sweet' | 'woody';
export type DealId = 'one' | 'two' | 'three';
export type ZoneId = 'accra' | 'kasoa' | 'elsewhere';

export const FOR_OPTIONS: { id: ForId; label: string; note: string }[] = [
  { id: 'him', label: 'For him', note: 'Bold, clean, masculine' },
  { id: 'her', label: 'For her', note: 'Soft, warm, feminine' },
  { id: 'unisex', label: 'Either / Unisex', note: 'Easy to share or gift' },
];

export const VIBE_OPTIONS: {
  id: VibeId;
  label: string;
  notes: string;
  when: string;
  swatch: string;
}[] = [
  {
    id: 'fresh',
    label: 'Fresh',
    notes: 'Citrus · clean musk · aquatic',
    when: 'Everyday, office, church, hot afternoons',
    swatch: 'linear-gradient(135deg,#e8f1ec 0%,#bcd9cf 45%,#f3e9c9 100%)',
  },
  {
    id: 'sweet',
    label: 'Sweet',
    notes: 'Vanilla · amber · soft florals',
    when: 'Dates, weddings, evenings out',
    swatch: 'linear-gradient(135deg,#f8e3d6 0%,#e9b7a0 50%,#c98a6a 100%)',
  },
  {
    id: 'woody',
    label: 'Woody & Strong',
    notes: 'Oud · spice · smoky woods',
    when: 'Events, nights out, all-day projection',
    swatch: 'linear-gradient(135deg,#7a4b35 0%,#4a2418 55%,#2a120c 100%)',
  },
];

/**
 * Bundle options. Prices are per order (not per box).
 * Want a multi-box discount? Just lower `price` here, e.g. two: 560.
 */
export const DEALS: { id: DealId; boxes: number; label: string; note: string; price: number; tag?: string }[] = [
  { id: 'one', boxes: 1, label: '1 Combo Box', note: 'Restock your own bathroom', price: 300 },
  { id: 'two', boxes: 2, label: '2 Combo Boxes', note: 'One for you, one to gift', price: 600, tag: 'Gift pair' },
  { id: 'three', boxes: 3, label: '3 Combo Boxes', note: 'For the family or the office', price: 900 },
];

export const ZONES: { id: ZoneId; label: string; areas: string; fee: number | null }[] = [
  { id: 'accra', label: 'Within Accra', areas: 'All Accra neighbourhoods', fee: 40 },
  { id: 'kasoa', label: 'Kasoa & Amasaman', areas: 'Kasoa, Amasaman and nearby', fee: 60 },
  { id: 'elsewhere', label: 'Rest of Ghana', areas: 'Any town or region', fee: null },
];

export const FAQS: { q: string; a: string }[] = [
  {
    q: 'Is it really GH₵300 for all 8 items?',
    a: 'Yes. One price covers the 55ml Gloria perfume, shower gel, Head & Shoulders hair wash, 500ml liquid soap, fluffy towel, whitening toothpaste, bathing soap and the 5-in-1 toothbrush pack.',
  },
  {
    q: 'Do I pay before or after delivery?',
    a: 'After. We offer payment on delivery, so you only pay when your box is in your hands.',
  },
  {
    q: 'How much is delivery?',
    a: 'GH₵40 anywhere within Accra and GH₵60 to Kasoa and Amasaman. We deliver anywhere in Ghana; for other locations we confirm the fee with you on WhatsApp before you commit.',
  },
  {
    q: 'Can I choose the perfume scent?',
    a: 'Yes. Tell us who it’s for and the vibe you like (fresh, sweet or woody) and we’ll match a Gloria scent to you. If you have a specific one in mind, mention it in the chat.',
  },
  {
    q: 'Can I order more than one box?',
    a: 'Of course. Pick 2 or 3 boxes in the builder. They make easy gifts for Christmas, birthdays or the office.',
  },
  {
    q: 'What happens after I tap “Claim on WhatsApp”?',
    a: 'WhatsApp opens with your full order form already written: boxes, scent, delivery location, contact number and total. Just hit send and we’ll confirm your delivery time.',
  },
];
