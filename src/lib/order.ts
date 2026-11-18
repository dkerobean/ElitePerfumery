import {
  BRAND,
  DEALS,
  FOR_OPTIONS,
  OFFER,
  VIBE_OPTIONS,
  ZONES,
  money,
  type DealId,
  type ForId,
  type VibeId,
  type ZoneId,
} from '../config';

/** Delivery details: shared by the Combo builder and the shop bag. */
export interface Delivery {
  zone: ZoneId | null;
  area: string;
  phone: string;
  name: string;
}

export const EMPTY_DELIVERY: Delivery = { zone: null, area: '', phone: '', name: '' };

export interface Order extends Delivery {
  forWho: ForId | null;
  vibe: VibeId | null;
  deal: DealId;
}

export const EMPTY_ORDER: Order = {
  forWho: null,
  vibe: null,
  deal: 'one',
  zone: null,
  area: '',
  phone: '',
  name: '',
};

export function summarize(o: Order) {
  const deal = DEALS.find((d) => d.id === o.deal) ?? DEALS[0];
  const zone = ZONES.find((z) => z.id === o.zone) ?? null;
  const forWho = FOR_OPTIONS.find((f) => f.id === o.forWho) ?? null;
  const vibe = VIBE_OPTIONS.find((v) => v.id === o.vibe) ?? null;
  const fee = zone?.fee ?? null;
  const total = deal.price + (fee ?? 0);
  return { deal, zone, forWho, vibe, fee, total, feeKnown: fee !== null };
}

/* ---------- Phone ---------- */

/**
 * Normalises Ghana numbers to local 10-digit form (0XXXXXXXXX).
 * Accepts 024 123 4567, 0241234567, +233 24 123 4567, 233241234567, 241234567.
 * Returns null when it isn't a valid Ghana mobile/landline number.
 */
export function normalizePhone(raw: string): string | null {
  let d = (raw ?? '').replace(/\D/g, '');
  if (d.startsWith('00233')) d = d.slice(5);
  else if (d.startsWith('233')) d = d.slice(3);
  if (d.length === 9) d = '0' + d;
  return /^0[235]\d{8}$/.test(d) ? d : null;
}

export const formatPhone = (local: string) => `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;

/* ---------- Validation ---------- */

export type FieldError = Partial<Record<'zone' | 'area' | 'phone', string>>;

export function validate(o: Delivery): FieldError {
  const e: FieldError = {};
  if (!o.zone) e.zone = 'Choose where we should deliver.';
  if (o.area.trim().length < 3)
    e.area = o.zone === 'elsewhere' ? 'Enter your town and a landmark.' : 'Enter your area and a nearby landmark.';
  if (!o.phone.trim()) e.phone = 'Enter a number the rider can call.';
  else if (!normalizePhone(o.phone)) e.phone = 'Enter a valid Ghana number, e.g. 024 123 4567.';
  return e;
}

export const isComplete = (o: Delivery) => Object.keys(validate(o)).length === 0;

/* ---------- WhatsApp message ---------- */

/** Short reference so the shop can match chats to ad traffic. */
export function makeRef() {
  return `EP-${Math.floor(1000 + Math.random() * 9000)}`;
}

export const zoneOf = (id: ZoneId | null) => ZONES.find((z) => z.id === id) ?? null;

/** The shared DELIVERY DETAILS block used in every WhatsApp order. */
export function deliveryLines(d: Delivery) {
  const phone = normalizePhone(d.phone);
  return [
    `*DELIVERY DETAILS*`,
    `• Name: ${d.name.trim() || 'Not given'}`,
    `• Phone: ${phone ? formatPhone(phone) : d.phone.trim() || 'Not given'}`,
    `• Zone: ${zoneOf(d.zone)?.label ?? 'Not chosen'}`,
    `• Location: ${d.area.trim() || 'Not given'}`,
  ];
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Builds the pre-filled WhatsApp message. Uses WhatsApp formatting
 * (*bold*) so it arrives as a clean, scannable order form.
 */
export function orderMessage(o: Order, ref: string) {
  const s = summarize(o);
  const forWho = s.forWho ? cap(s.forWho.label.replace(/^For /, '')) : 'Not sure, please advise';
  const vibe = s.vibe?.label ?? 'Not sure, please advise';
  const boxes = s.deal.boxes;

  const lines = [
    `*NEW ORDER: ${OFFER.name.toUpperCase()}*`,
    `Ref: ${ref}`,
    ``,
    `*ORDER*`,
    `• Item: ${boxes} × Combo Box (8 items${boxes > 1 ? ' each' : ''})`,
    `• Perfume for: ${forWho}`,
    `• Scent vibe: ${vibe}`,
    ``,
    ...deliveryLines(o),
    ``,
    `*PAYMENT (pay on delivery)*`,
    `• Items: ${money(s.deal.price)}`,
    `• Delivery: ${s.zone ? (s.feeKnown ? money(s.fee!) : 'To be confirmed') : 'To be confirmed'}`,
    s.feeKnown
      ? `• *Total: ${money(s.total)}*`
      : `• *Total: ${money(s.deal.price)} + delivery fee*`,
    ``,
    s.feeKnown
      ? `Please confirm my order and delivery time. Thank you!`
      : `Please confirm the delivery fee to my location and my delivery time. Thank you!`,
  ];
  return lines.join('\n');
}

export function waLink(text: string) {
  return `https://wa.me/${BRAND.whatsappNumber}?text=${encodeURIComponent(text)}`;
}

/**
 * Opens WhatsApp. On phones we navigate in the same tab: Instagram/Facebook
 * in-app browsers (where ad traffic lands) often block or mishandle new tabs,
 * while a same-tab wa.me link hands off to the WhatsApp app reliably.
 */
export function openWhatsApp(url: string, e?: { preventDefault: () => void }) {
  const touch = window.matchMedia?.('(pointer: coarse)').matches;
  if (!touch) return; // desktop: let the <a target="_blank"> open WhatsApp Web
  e?.preventDefault();
  window.location.href = url;
}

export const QUICK_MESSAGE = `Hello ${BRAND.name}, I saw the ${OFFER.name} (all 8 items for ${money(OFFER.unitPrice)}) and I'd like to order.`;

/** Fires Meta Pixel / GA4 events if those snippets are installed in index.html. */
export function track(event: 'Lead' | 'InitiateCheckout' | 'ViewContent', value?: number) {
  const w = window as unknown as {
    fbq?: (...a: unknown[]) => void;
    gtag?: (...a: unknown[]) => void;
  };
  try {
    w.fbq?.('track', event, value ? { value, currency: 'GHS' } : undefined);
    w.gtag?.('event', event === 'Lead' ? 'generate_lead' : event.toLowerCase(), value ? { value, currency: 'GHS' } : {});
  } catch {
    /* analytics must never block the order */
  }
}
