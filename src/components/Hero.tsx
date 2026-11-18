import { OFFER, ZONES, money } from '../config';
import { pad, useCountdown, useOnScreen } from '../lib/hooks';
import { GiftBox3D } from './GiftBox3D';
import { ArrowRight, Truck, Wallet, WhatsAppIcon } from './Icons';

export function Countdown({ tone = 'dark' }: { tone?: 'dark' | 'light' }) {
  const t = useCountdown(OFFER.endsAt);
  if (t.done) return <p className={`countdown-done ${tone}`}>Final call: while stock lasts</p>;
  const cells: [number, string][] = [
    [t.d, 'Days'],
    [t.h, 'Hrs'],
    [t.m, 'Min'],
    [t.s, 'Sec'],
  ];
  return (
    <div className={`countdown ${tone}`} role="timer" aria-label={`Offer ends in ${t.d} days ${t.h} hours`}>
      {cells.map(([n, l]) => (
        <div className="cd-cell" key={l}>
          <span className="cd-num">{pad(n)}</span>
          <span className="cd-lbl">{l}</span>
        </div>
      ))}
    </div>
  );
}

export function Hero({
  onBuild,
  quickLink,
  onQuick,
  ctaRef,
}: {
  onBuild: () => void;
  quickLink: string;
  onQuick: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  ctaRef: React.Ref<HTMLButtonElement>;
}) {
  const [ref, visible] = useOnScreen<HTMLElement>('100px');
  const minFee = Math.min(...ZONES.map((z) => z.fee ?? Infinity));

  return (
    <section ref={ref} className="hero" id="top">
      <div className="hero-grain" aria-hidden="true" />
      <div className="wrap hero-grid">
        <div className="hero-copy">
          <p className="eyebrow light">
            <span className="dot" /> Black Friday · The Combo Box
          </p>
          <h1 className="hero-title">
            Eight essentials.
            <br />
            <em>One beautiful price.</em>
          </h1>
          <p className="hero-lede">
            A 55ml Gloria eau de parfum plus seven bath & body staples, boxed and delivered.
            Pay only when it arrives.
          </p>
        </div>

        <div className="hero-visual">
          <GiftBox3D paused={!visible} />
          <div className="seal" aria-hidden="true">
            <svg viewBox="0 0 100 100">
              <defs>
                <linearGradient id="sealg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#f7e6c4" />
                  <stop offset=".5" stopColor="#f0d9ae" />
                  <stop offset="1" stopColor="#d4b37a" />
                </linearGradient>
              </defs>
              <path
                fill="url(#sealg)"
                d={Array.from({ length: 48 }, (_, i) => {
                  const a = (i / 48) * Math.PI * 2;
                  const r = i % 2 ? 44 : 49;
                  return `${i ? 'L' : 'M'}${(50 + r * Math.cos(a)).toFixed(2)} ${(50 + r * Math.sin(a)).toFixed(2)}`;
                }).join(' ') + 'Z'}
              />
              <circle cx="50" cy="50" r="38" fill="none" stroke="#5b1a2b" strokeOpacity=".35" strokeDasharray="1 3" />
            </svg>
            <span>
              <small>All 8 for</small>
              <strong>{money(OFFER.unitPrice)}</strong>
            </span>
          </div>
        </div>

        <div className="hero-buy">
          <div className="price-card">
            <div className="price-main">
              <span className="price-kicker">All 8 items</span>
              <span className="price-num">{money(OFFER.unitPrice)}</span>
            </div>
            <ul className="price-facts">
              <li>
                <Wallet size={16} /> Pay on delivery
              </li>
              <li>
                <Truck size={16} /> Delivery from {money(minFee)}
              </li>
            </ul>
          </div>

          <button type="button" className="btn btn-gold btn-lg" onClick={onBuild} ref={ctaRef}>
            Build my box · 30 sec <ArrowRight size={18} />
          </button>
          <a className="btn-text light" href={quickLink} target="_blank" rel="noopener" onClick={onQuick}>
            <WhatsAppIcon size={16} /> Or just message us on WhatsApp
          </a>

          <div className="hero-timer">
            <span className="hero-timer-lbl">{OFFER.endsLabel}</span>
            <Countdown tone="light" />
          </div>
        </div>
      </div>
    </section>
  );
}
