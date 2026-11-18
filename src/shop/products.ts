/**
 * THE SHOP CATALOGUE. Add, edit or remove products here.
 *
 * To add a perfume:
 *  1. Put a square photo in /public/img/products/ (WebP or JPG, ~800×800)
 *  2. Copy one of the entries below and fill it in.
 *  - price:   number in cedis, or null to show "Price on WhatsApp"
 *  - for:     'him' | 'her' | 'unisex' (unisex items also show under For him / For her)
 *  - vibe:    'fresh' | 'sweet' | 'woody' (powers the vibe filters; leave out if unsure)
 *  - img:     leave out to show a drawn bottle instead of a photo
 *  - soldOut: true greys it out but keeps it visible
 *
 * Prices come from Elite Perfumery's WhatsApp price list (Nov 2026).
 * `for` and `vibe` are best guesses from each scent's public profile: adjust freely.
 */
import type { ForId, VibeId } from '../config';

export type Category = 'perfume' | 'inspired' | 'body' | 'sets';

export interface Product {
  id: string;
  name: string;
  line?: string; // brand / range shown above the name
  category: Category;
  for: ForId[];
  vibe?: VibeId;
  size?: string;
  price: number | null;
  compareAt?: number; // optional "was" price, only if genuinely true
  notes?: string; // short italic line under the name
  description?: string;
  img?: string;
  badge?: string;
  href?: string; // link somewhere instead of adding to bag (e.g. the Combo page)
  soldOut?: boolean;
}

const P = '/img/products/';

/* ---------------- Gift sets ---------------- */
const SETS: Product[] = [
  {
    id: 'black-friday-combo',
    name: 'Black Friday Combo Box',
    line: 'Limited offer',
    category: 'sets',
    for: ['unisex'],
    size: '8 items',
    price: 300,
    notes: '55ml Gloria perfume + 7 bath & body essentials',
    description:
      'Shower gel, fluffy towel, whitening toothpaste, Head & Shoulders hair wash, 500ml liquid soap, bathing soap, 55ml Gloria perfume and a 5-in-1 toothbrush pack.',
    img: '/img/combo-set.webp',
    badge: 'Black Friday',
    href: '/#build',
  },
];

/* ---------------- Arabian & niche perfumes (photos from her catalogue) ---------------- */
const PERFUMES: Product[] = [
  { id: 'afnan-9pm-rebel', line: 'Afnan', name: '9PM Rebel', category: 'perfume', for: ['him', 'unisex'], vibe: 'sweet', size: '100ml · Eau de parfum', price: 550, img: P + 'afnan-9pm-rebel.webp' },
  { id: 'armaf-club-de-nuit-intense', line: 'Armaf', name: 'Club de Nuit Intense Man', category: 'perfume', for: ['him'], vibe: 'woody', size: 'Eau de parfum', price: 550, img: P + 'armaf-club-de-nuit-intense.webp' },
  { id: 'lattafa-khamrah-waha', line: 'Lattafa', name: 'Khamrah Waha', category: 'perfume', for: ['unisex'], vibe: 'fresh', size: 'Eau de parfum', price: 450, img: P + 'lattafa-khamrah-waha.webp' },
  { id: 'french-avenue-aether', line: 'French Avenue', name: 'Aether Extrait', category: 'perfume', for: ['unisex'], size: 'Extrait de parfum', price: 450, img: P + 'french-avenue-aether.webp', badge: 'Extrait' },
  {
    id: 'atlantis-extrait',
    line: 'French Avenue',
    name: 'Atlantis Extrait',
    category: 'perfume',
    for: ['unisex'],
    vibe: 'fresh',
    size: 'Extrait de parfum',
    price: 450,
    notes: 'Orange · Watermelon · Coconut · Cacao',
    description: 'Top: orange, mandarin orange, lemon. Heart: watermelon, coconut. Base: cacao, amberwood.',
    img: P + 'atlantis-extrait.webp',
    badge: 'Extrait',
  },
  { id: 'french-avenue-liquid-brun', line: 'French Avenue', name: 'Liquid Brun', category: 'perfume', for: ['unisex'], vibe: 'sweet', size: 'Eau de parfum', price: 420, img: P + 'french-avenue-liquid-brun.webp' },
  { id: 'lattafa-fakhar', line: 'Lattafa', name: 'Fakhar (Pride of Lattafa)', category: 'perfume', for: ['her'], vibe: 'sweet', size: 'Eau de parfum', price: 400, img: P + 'lattafa-fakhar.webp' },
  { id: 'lattafa-vintage-radio', line: 'Lattafa', name: 'Vintage Radio', category: 'perfume', for: ['unisex'], size: '100ml · Eau de parfum', price: 400, img: P + 'lattafa-vintage-radio.webp' },
  { id: 'lattafa-art-of-universe', line: 'Lattafa', name: 'Art of Universe', category: 'perfume', for: ['unisex'], size: '100ml · Eau de parfum', price: 400, img: P + 'lattafa-art-of-universe.webp' },
  { id: 'armaf-infinity', line: 'Armaf', name: 'Infinity', category: 'perfume', for: ['unisex'], size: 'Eau de parfum', price: 400, img: P + 'armaf-infinity.webp' },
  // Photos she shared without a price → shown as "Price on WhatsApp". Add the price when known.
  { id: 'riiffs-prive-gold', line: 'Riiffs', name: 'Privé Gold', category: 'perfume', for: ['unisex'], size: 'Eau de parfum', price: null, img: P + 'riiffs-prive-gold.webp' },
  { id: 'riiffs-freeze', line: 'Riiffs', name: 'Freeze', category: 'perfume', for: ['unisex'], vibe: 'fresh', size: 'Eau de parfum', price: null, img: P + 'riiffs-freeze.webp' },
  { id: 'riiffs-momento', line: 'Riiffs', name: 'Momento', category: 'perfume', for: ['unisex'], size: '100ml · Extrait de parfum', price: null, img: P + 'riiffs-momento.webp' },
  {
    id: 'gloria-wanted-279',
    line: 'Gloria Perfume',
    name: 'Wanted No. 279',
    category: 'perfume',
    for: ['him'],
    vibe: 'fresh',
    size: '55ml · Eau de parfum',
    price: null, // ← add the single-bottle price here
    description: 'The 55ml Gloria eau de parfum from our Combo Box. Ask us on WhatsApp for the single-bottle price.',
    img: '/img/perfume.webp',
  },
];

/* ---------------- Inspired-by collection: GH₵250 each (no photos yet: drawn bottle shown) ---------------- */
const inspired = (id: string, name: string, inspiredBy: string, forWho: ForId[], vibe: VibeId): Product => ({
  id: `inspired-${id}`,
  name,
  line: 'Inspired collection',
  category: 'inspired',
  for: forWho,
  vibe,
  price: 250,
  notes: `Inspired by ${inspiredBy}`,
  description: `Our take on ${inspiredBy}. Message us if you’d like to know more about how it wears.`,
});

const INSPIRED: Product[] = [
  inspired('texas', 'Texas', 'Bleu de Chanel', ['him'], 'fresh'),
  inspired('ares', 'Ares', 'Dior Sauvage', ['him'], 'fresh'),
  inspired('stronger-intensely', 'Stronger Intensely', 'Stronger With You Intensely', ['him'], 'sweet'),
  inspired('spicebomb', 'Spicebomb', 'Spicebomb', ['him'], 'woody'),
  inspired('champion', 'Champion', 'Invictus Elixir', ['him'], 'sweet'),
  inspired('stronger', 'Stronger', 'Stronger With You', ['him'], 'sweet'),
  inspired('badboy', 'Badboy', 'Carolina Herrera Bad Boy', ['him'], 'woody'),
  inspired('richi-rich', 'Richi Rich', 'Paco Rabanne 1 Million', ['him'], 'sweet'),
  inspired('heroes-energy', 'Heroes Energy', 'Versace Eros Energy', ['him'], 'fresh'),
  inspired('jpg', 'JPG', 'Jean Paul Gaultier Le Male', ['him'], 'sweet'),
  inspired('nomade', 'Nomade', 'Louis Vuitton Ombre Nomade', ['unisex'], 'woody'),
];

export const PRODUCTS: Product[] = [...SETS, ...PERFUMES, ...INSPIRED];

export const CATEGORY_LABEL: Record<Category, string> = {
  perfume: 'Perfume',
  inspired: 'Inspired-by scent',
  body: 'Body care',
  sets: 'Gift set',
};
