import { useEffect, useMemo, useRef, useState } from 'react';
import { BRAND, OFFER, money, srcSet, type ForId } from '../config';
import { useOrderRef, useRevealOnScroll } from '../lib/hooks';
import {
  EMPTY_DELIVERY,
  isComplete,

  openWhatsApp,
  track,
  validate,
  waLink,
  type Delivery,
} from '../lib/order';
import { Announce, Nav } from '../components/Chrome';
import { DeliveryForm, focusFirstError } from '../components/DeliveryForm';
import { Footer, TrustStrip } from '../components/Sections';
import { ArrowLeft, ArrowRight, Chat, Plus, WhatsAppIcon } from '../components/Icons';
import { bagSummary, enquiryMessage, shopMessage, useBag } from './bag';
import { CATEGORY_LABEL, PRODUCTS, type Product } from './products';

/* ---------------- small pieces ---------------- */

const VIBE_TINT: Record<string, [string, string]> = {
  fresh: ['#cfe3da', '#8fb9a8'],
  sweet: ['#f1d3c2', '#c98a6a'],
  woody: ['#a77a5f', '#4a2418'],
  none: ['#e9d3a8', '#b78d52'],
};

/** Elegant bottle drawing for products that don't have a photo yet. */
function BottleArt({ p }: { p: Product }) {
  const [a, b] = VIBE_TINT[p.vibe ?? 'none'];
  const gid = `g-${p.id}`;
  return (
    <svg viewBox="0 0 120 160" className="bottle-art" aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={a} />
          <stop offset="1" stopColor={b} />
        </linearGradient>
      </defs>
      <rect x="47" y="8" width="26" height="20" rx="3" fill="#2a0a13" />
      <rect x="52" y="27" width="16" height="10" fill="#b78d52" />
      <rect x="22" y="36" width="76" height="112" rx="14" fill={`url(#${gid})`} />
      <rect x="22" y="36" width="76" height="112" rx="14" fill="none" stroke="rgba(0,0,0,.08)" />
      <rect x="30" y="44" width="10" height="92" rx="5" fill="rgba(255,255,255,.35)" />
      <rect x="30" y="82" width="60" height="38" rx="3" fill="rgba(255,255,255,.9)" />
      <text x="60" y="99" textAnchor="middle" fontFamily="Cormorant Garamond, serif" fontWeight="600" fontSize={Math.min(12, 92 / Math.max(p.name.length, 1))} fill="#2a0a13">
        {p.name}
      </text>
      <text x="60" y="111" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="4.6" letterSpacing="1.2" fill="#5b1a2b">
        ELITE PERFUMERY
      </text>
    </svg>
  );
}

/** Lifestyle photos fill the tile; cut-out product shots float on the sand background. */
const isPhoto = (p: Product) => !!p.img && p.img.startsWith('/img/products/');

function Media({ p, size = 'card' }: { p: Product; size?: 'card' | 'sheet' }) {
  return p.img ? (
    <img
      className={isPhoto(p) ? 'is-photo' : undefined}
      src={p.img}
      srcSet={srcSet(p.img)}
      sizes={size === 'card' ? '(min-width: 1100px) 280px, (min-width: 700px) 32vw, 50vw' : '(min-width: 700px) 520px, 100vw'}
      alt={`${p.line && p.category === 'perfume' ? p.line + ' ' : ''}${p.name}`}
      width={720}
      height={720}
      loading={size === 'card' ? 'lazy' : 'eager'}
      decoding="async"
    />
  ) : (
    <BottleArt p={p} />
  );
}

const priceText = (p: Product) => (p.price === null ? 'Price on WhatsApp' : money(p.price));

/* ---------------- filters ---------------- */

type Who = ForId | 'all';
type Kind = 'all' | 'fresh' | 'sweet' | 'woody' | 'inspired' | 'sets' | 'body';
type Sort = 'featured' | 'low' | 'high';

const WHO: { id: Who; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'him', label: 'For him' },
  { id: 'her', label: 'For her' },
  { id: 'unisex', label: 'Unisex' },
];
const KIND_ALL: { id: Kind; label: string }[] = [
  { id: 'all', label: 'Everything' },
  { id: 'fresh', label: 'Fresh' },
  { id: 'sweet', label: 'Sweet' },
  { id: 'woody', label: 'Woody & Strong' },
  { id: 'inspired', label: 'Inspired-by · GH₵250' },
  { id: 'sets', label: 'Gift sets' },
  { id: 'body', label: 'Body care' },
];
const isCategoryKind = (k: Kind): k is 'inspired' | 'sets' | 'body' => k === 'inspired' || k === 'sets' || k === 'body';
// only show chips that would return something
const KIND = KIND_ALL.filter(
  (k) => k.id === 'all' || PRODUCTS.some((p) => (isCategoryKind(k.id) ? p.category === k.id : p.vibe === k.id))
);

/* ---------------- page ---------------- */

export function Shop() {
  useRevealOnScroll();
  const { bag, add, set, clear } = useBag();
  const [who, setWho] = useState<Who>('all');
  const [kind, setKind] = useState<Kind>('all');
  const [sort, setSort] = useState<Sort>('featured');
  const [open, setOpen] = useState<Product | null>(null);
  const [bagOpen, setBagOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number>(0);

  const items = useMemo(() => {
    let list = PRODUCTS.filter((p) => {
      // unisex scents suit everyone, so they also appear under For him / For her
      if (who !== 'all' && !p.for.includes(who) && !p.for.includes('unisex')) return false;
      if (isCategoryKind(kind)) return p.category === kind;
      if (kind !== 'all') return p.vibe === kind;
      return true;
    });
    if (sort !== 'featured') {
      const v = (p: Product) => p.price ?? (sort === 'low' ? Infinity : -Infinity);
      list = [...list].sort((a, b) => (sort === 'low' ? v(a) - v(b) : v(b) - v(a)));
    }
    // sold-out always last
    return [...list.filter((p) => !p.soldOut), ...list.filter((p) => p.soldOut)];
  }, [who, kind, sort]);

  const count = Object.values(bag).reduce((a, b) => a + b, 0);

  const addToBag = (p: Product, qty = 1) => {
    if (p.href) {
      window.location.href = p.href;
      return;
    }
    add(p.id, qty);
    track('InitiateCheckout', (p.price ?? 0) * qty);
    setToast(`${p.name} added to your bag`);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  };

  // lock page scroll while a sheet is open; close on Escape
  useEffect(() => {
    const locked = !!open || bagOpen;
    document.documentElement.classList.toggle('is-locked', locked);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(null);
        setBagOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, bagOpen]);

  const enquiry = waLink(`Hello ${BRAND.name}, I'm looking for a perfume that isn't on your website. Can you help?`);

  return (
    <>
      <a className="skip" href="#products">
        Skip to products
      </a>
      <Announce />
      <Nav
        links={[
          { href: '/', label: 'Black Friday Combo' },
          { href: '/shop/', label: 'Shop', current: true },
          { href: BRAND.whatsappCatalogUrl, label: 'WhatsApp catalogue' },
          { href: BRAND.instagramUrl, label: 'Instagram' },
        ]}
        action={
          <button type="button" className="bag-btn" onClick={() => setBagOpen(true)} aria-label={`Open bag, ${count} items`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <path d="M5 8h14l-1.2 12.2a1 1 0 0 1-1 .8H7.2a1 1 0 0 1-1-.8L5 8z" />
              <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
            </svg>
            <span>Bag</span>
            {count > 0 && <span className="bag-count">{count}</span>}
          </button>
        }
      />

      <main>
        <header className="shop-hero">
          <div className="wrap">
            <p className="eyebrow">The collection</p>
            <h1 className="shop-title">
              Find your <em>signature.</em>
            </h1>
            <p className="sec-sub">
              Perfumes, body care and gift sets, delivered anywhere in Ghana. Order on WhatsApp and
              pay when it arrives.
            </p>
          </div>
        </header>

        <section className="wrap" aria-label="Black Friday offer">
          <a className="promo" href="/#build" data-reveal>
            <div className="promo-copy">
              <p className="eyebrow light">Black Friday · Limited</p>
              <h2>
                The Combo Box, <em>all 8 for {money(OFFER.unitPrice)}</em>
              </h2>
              <p>55ml Gloria perfume plus 7 bath & body essentials.</p>
              <span className="promo-go">
                Build your box <ArrowRight size={16} />
              </span>
            </div>
            <img src="/img/combo-set.webp" srcSet={srcSet('/img/combo-set.webp', 900)} sizes="(min-width: 900px) 420px, 90vw" decoding="async" alt="The 8 items in the Black Friday Combo Box" width={900} height={743} />
          </a>
        </section>

        <div className="filters" role="region" aria-label="Filter products">
          <div className="wrap">
            <div className="chip-row" role="group" aria-label="Who it's for">
              {WHO.map((w) => (
                <button key={w.id} type="button" className={`chip ${who === w.id ? 'is-on' : ''}`} aria-pressed={who === w.id} onClick={() => setWho(w.id)}>
                  {w.label}
                </button>
              ))}
            </div>
            <div className="chip-row" role="group" aria-label="Vibe or type">
              {KIND.map((k) => (
                <button key={k.id} type="button" className={`chip chip-soft ${kind === k.id ? 'is-on' : ''}`} aria-pressed={kind === k.id} onClick={() => setKind(k.id)}>
                  {k.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <section className="wrap shop-body" id="products">
          <div className="shop-meta">
            <p>
              {items.length} {items.length === 1 ? 'product' : 'products'}
            </p>
            <label className="sort">
              <span>Sort</span>
              <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
                <option value="featured">Featured</option>
                <option value="low">Price: low to high</option>
                <option value="high">Price: high to low</option>
              </select>
            </label>
          </div>

          {items.length === 0 ? (
            <div className="empty">
              <p className="b-q">Nothing here yet.</p>
              <p>Try another filter, or ask us. We stock more than we can list.</p>
              <button type="button" className="btn btn-dark" onClick={() => { setWho('all'); setKind('all'); }}>
                Clear filters
              </button>
            </div>
          ) : (
            <ul className="p-grid">
              {items.map((p, i) => (
                <li key={p.id} className={`p-card ${p.soldOut ? 'is-out' : ''}`} style={{ '--i': i } as React.CSSProperties}>
                  <button type="button" className="p-hit" onClick={() => (p.href ? (window.location.href = p.href) : setOpen(p))} aria-label={`View ${p.name}`}>
                    <div className="p-media">
                      {p.badge && <span className="p-badge">{p.badge}</span>}
                      {p.soldOut && <span className="p-badge is-out">Sold out</span>}
                      <Media p={p} />
                    </div>
                    <div className="p-body">
                      {p.line && <span className="p-line">{p.line}</span>}
                      <span className="p-name">{p.name}</span>
                      {p.notes && <span className="p-notes">{p.notes}</span>}
                      <span className="p-foot">
                        <span className="p-price">{priceText(p)}</span>
                        {p.size && <span className="p-size">{p.size}</span>}
                      </span>
                    </div>
                  </button>
                  {!p.soldOut &&
                    (p.price === null ? (
                      <a className="p-add" href={waLink(enquiryMessage(p))} target="_blank" rel="noopener" aria-label={`Ask about ${p.name} on WhatsApp`} onClick={(e) => openWhatsApp(waLink(enquiryMessage(p)), e)}>
                        <Chat size={18} />
                      </a>
                    ) : (
                      <button type="button" className="p-add" aria-label={p.href ? `Order ${p.name}` : `Add ${p.name} to bag`} onClick={() => addToBag(p)}>
                        {p.href ? <ArrowRight size={18} /> : <Plus size={18} />}
                      </button>
                    ))}
                </li>
              ))}
            </ul>
          )}

          <div className="ask" data-reveal>
            <div>
              <p className="eyebrow">Can’t find your scent?</p>
              <h2 className="sec-title">
                We stock <em>more than we list.</em>
              </h2>
              <p className="sec-sub">Tell us the perfume you’re after and we’ll check availability and price for you.</p>
            </div>
            <a className="btn btn-wa btn-lg" href={enquiry} target="_blank" rel="noopener" onClick={(e) => openWhatsApp(enquiry, e)}>
              <WhatsAppIcon size={20} /> Ask on WhatsApp
            </a>
          </div>
        </section>

        <TrustStrip />
      </main>
      <Footer />

      {/* mobile bag bar */}
      <div className={`sticky ${count > 0 && !bagOpen && !open ? 'is-shown' : ''}`} aria-hidden={!(count > 0)}>
        <div className="sticky-inner">
          <div className="sticky-info">
            <span className="sticky-name">Your bag · {count} {count === 1 ? 'item' : 'items'}</span>
            <span className="sticky-price">
              {money(bagSummary(bag, EMPTY_DELIVERY).pricedTotal)}
              <small> · pay on delivery</small>
            </span>
          </div>
          <button type="button" className="btn btn-gold" onClick={() => setBagOpen(true)} tabIndex={count > 0 ? 0 : -1}>
            Checkout <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {open && <ProductSheet p={open} onClose={() => setOpen(null)} onAdd={(q) => { addToBag(open, q); setOpen(null); }} />}
      {bagOpen && <BagDrawer bag={bag} set={set} clear={clear} onClose={() => setBagOpen(false)} />}

      <div className={`toast ${toast ? 'is-shown' : ''}`} role="status" aria-live="polite">
        {toast}
        {toast && (
          <button type="button" onClick={() => { setToast(null); setBagOpen(true); }}>
            View bag
          </button>
        )}
      </div>
    </>
  );
}

/* ---------------- product sheet ---------------- */

function ProductSheet({ p, onClose, onAdd }: { p: Product; onClose: () => void; onAdd: (qty: number) => void }) {
  const [qty, setQty] = useState(1);
  const ask = waLink(enquiryMessage(p));
  useEffect(() => {
    track('ViewContent', p.price ?? undefined);
  }, [p]);

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={p.name} onClick={(e) => e.stopPropagation()}>
        <button type="button" className="sheet-x" onClick={onClose} aria-label="Close">
          ×
        </button>
        <div className="sheet-media">
          {p.badge && <span className="p-badge">{p.badge}</span>}
          <Media p={p} size="sheet" />
        </div>
        <div className="sheet-body">
          {p.line && <p className="p-line">{p.line}</p>}
          <h2 className="sheet-title">{p.name}</h2>
          {p.notes && <p className="p-notes big">{p.notes}</p>}
          <div className="sheet-tags">
            <span>{CATEGORY_LABEL[p.category]}</span>
            {p.size && <span>{p.size}</span>}
            {p.for.map((f) => (
              <span key={f}>{f === 'unisex' ? 'Unisex' : `For ${f}`}</span>
            ))}
          </div>
          {p.description && <p className="sheet-desc">{p.description}</p>}

          <div className="sheet-buy">
            <span className="sheet-price">{priceText(p)}</span>
            {p.price !== null && !p.soldOut && (
              <div className="qty" role="group" aria-label="Quantity">
                <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">
                  −
                </button>
                <span aria-live="polite">{qty}</span>
                <button type="button" onClick={() => setQty((q) => Math.min(20, q + 1))} aria-label="Increase quantity">
                  +
                </button>
              </div>
            )}
          </div>

          {p.soldOut ? (
            <a className="btn btn-dark btn-lg btn-block" href={ask} target="_blank" rel="noopener" onClick={(e) => openWhatsApp(ask, e)}>
              Sold out: ask when it’s back
            </a>
          ) : p.price === null ? (
            <a className="btn btn-wa btn-lg btn-block" href={ask} target="_blank" rel="noopener" onClick={(e) => openWhatsApp(ask, e)}>
              <WhatsAppIcon size={20} /> Ask for price on WhatsApp
            </a>
          ) : (
            <button type="button" className="btn btn-dark btn-lg btn-block" onClick={() => onAdd(qty)}>
              Add to bag · {money(p.price * qty)}
            </button>
          )}
          <p className="b-assure">Pay on delivery · Delivery anywhere in Ghana</p>
        </div>
      </div>
    </div>
  );
}

/* ---------------- bag + checkout ---------------- */

function BagDrawer({
  bag,
  set,
  clear,
  onClose,
}: {
  bag: Record<string, number>;
  set: (id: string, q: number) => void;
  clear: () => void;
  onClose: () => void;
}) {
  const [stage, setStage] = useState<'bag' | 'checkout' | 'sent'>('bag');
  const [d, setD] = useState<Delivery>(EMPTY_DELIVERY);
  const [showErrors, setShowErrors] = useState(false);
  const ref = useOrderRef();
  const s = bagSummary(bag, d);
  const errors = validate(d);
  const ready = isComplete(d) && s.count > 0;
  const msg = shopMessage(bag, d, ref);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
  }, [stage]);

  const send = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!ready) {
      e.preventDefault();
      setShowErrors(true);
      focusFirstError(errors, 'bag');
      return;
    }
    track('Lead', s.total);
    setStage('sent');
    openWhatsApp(waLink(msg), e);
  };

  return (
    <div className="overlay" onClick={onClose}>
      <aside className="drawer" role="dialog" aria-modal="true" aria-label="Your bag" onClick={(e) => e.stopPropagation()}>
        <header className="drawer-head">
          {stage === 'checkout' ? (
            <button type="button" className="b-back" onClick={() => setStage('bag')}>
              <ArrowLeft size={16} /> Bag
            </button>
          ) : (
            <p className="drawer-title">Your bag {s.count > 0 && <span>({s.count})</span>}</p>
          )}
          <button type="button" className="sheet-x static" onClick={onClose} aria-label="Close bag">
            ×
          </button>
        </header>

        <div className="drawer-body" ref={bodyRef}>
          {stage === 'sent' ? (
            <div className="sent">
              <WhatsAppIcon size={40} />
              <p className="b-q">Almost done!</p>
              <p>WhatsApp is opening with your order filled in. Just press send and we’ll confirm your delivery.</p>
              <a className="btn btn-wa btn-block" href={waLink(msg)} target="_blank" rel="noopener" onClick={(e) => openWhatsApp(waLink(msg), e)}>
                <WhatsAppIcon size={18} /> Open WhatsApp again
              </a>
              <button type="button" className="btn-text dark" onClick={() => { clear(); onClose(); }}>
                I’ve sent it, empty my bag
              </button>
            </div>
          ) : s.count === 0 ? (
            <div className="empty">
              <p className="b-q">Your bag is empty.</p>
              <p>Tap + on any product to add it.</p>
              <button type="button" className="btn btn-dark" onClick={onClose}>
                Keep shopping
              </button>
            </div>
          ) : stage === 'bag' ? (
            <ul className="bag-list">
              {s.lines.map((l) => (
                <li key={l.product.id}>
                  <div className="bag-thumb">
                    <Media p={l.product} />
                  </div>
                  <div className="bag-info">
                    <span className="p-name sm">{l.product.name}</span>
                    {l.product.size && <span className="p-size">{l.product.size}</span>}
                    <div className="qty sm" role="group" aria-label={`Quantity of ${l.product.name}`}>
                      <button type="button" onClick={() => set(l.product.id, l.qty - 1)} aria-label="Decrease">
                        −
                      </button>
                      <span>{l.qty}</span>
                      <button type="button" onClick={() => set(l.product.id, l.qty + 1)} aria-label="Increase">
                        +
                      </button>
                    </div>
                  </div>
                  <div className="bag-right">
                    <span className="bag-price">{l.total === null ? 'Price on chat' : money(l.total)}</span>
                    <button type="button" className="bag-remove" onClick={() => set(l.product.id, 0)}>
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="checkout">
              <DeliveryForm value={d} onChange={(patch) => setD((v) => ({ ...v, ...patch }))} errors={errors} showErrors={showErrors} idp="bag" />
            </div>
          )}
        </div>

        {s.count > 0 && stage !== 'sent' && (
          <footer className="drawer-foot">
            <div className="receipt compact">
              <div className="r-row">
                <span>Items ({s.count})</span>
                <span>
                  {money(s.pricedTotal)}
                  {s.hasUnpriced ? ' +' : ''}
                </span>
              </div>
              <div className="r-row">
                <span>Delivery{s.zone ? ` · ${s.zone.label}` : ''}</span>
                <span>{!s.zone ? 'Next step' : s.feeKnown ? money(s.fee!) : 'Confirmed on chat'}</span>
              </div>
              <div className="r-row r-total">
                <span>Pay on delivery</span>
                <span>{money(s.total)}</span>
              </div>
            </div>
            {stage === 'bag' ? (
              <button type="button" className="btn btn-dark btn-lg btn-block" onClick={() => setStage('checkout')}>
                Checkout · delivery details <ArrowRight size={18} />
              </button>
            ) : (
              <a className="btn btn-wa btn-lg btn-block" href={waLink(msg)} target="_blank" rel="noopener" onClick={send}>
                <WhatsAppIcon size={20} /> Send order on WhatsApp
              </a>
            )}
            <p className="b-assure">
              {showErrors && !ready ? 'Please fill in the highlighted details.' : 'Nothing to pay now. You pay the rider on delivery.'}
            </p>
          </footer>
        )}
      </aside>
    </div>
  );
}
