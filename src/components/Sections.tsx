import { useState } from 'react';
import { BRAND, FAQS, OFFER, ZONES, money } from '../config';
import { Countdown } from './Hero';
import { ArrowRight, Chat, Gift, Instagram, Plus, Truck, Wallet, WhatsAppIcon } from './Icons';

export function TrustStrip() {
  const items = [
    { icon: <Wallet size={20} />, t: 'Pay on delivery', s: 'Nothing upfront' },
    { icon: <Truck size={20} />, t: 'Nationwide', s: 'Anywhere in Ghana' },
    { icon: <Chat size={20} />, t: 'Via WhatsApp', s: 'Chat to a real person' },
    { icon: <Gift size={20} />, t: 'Gift-ready', s: 'Boxed and packed with care' },
  ];
  return (
    <section className="trust" aria-label="Why order from us">
      <ul className="wrap trust-list">
        {items.map((i) => (
          <li key={i.t}>
            <span className="trust-icon">{i.icon}</span>
            <span>
              <strong>{i.t}</strong>
              <small>{i.s}</small>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function HowItWorks() {
  const steps = [
    { t: 'Build your box', s: 'Tell us who the perfume is for, pick a vibe, choose how many boxes and where we’re delivering.' },
    { t: 'Send on WhatsApp', s: 'Your order and total are typed out for you. Press send and we confirm your delivery time.' },
    { t: 'Pay when it arrives', s: 'Check your box at the door, then pay the rider. No deposits, no stress.' },
  ];
  return (
    <section className="section how" id="how">
      <div className="wrap">
        <header className="sec-head center" data-reveal>
          <p className="eyebrow">How it works</p>
          <h2 className="sec-title">
            Three steps. <em>Zero risk.</em>
          </h2>
        </header>
        <ol className="how-list">
          {steps.map((st, i) => (
            <li key={st.t} data-reveal style={{ '--d': `${i * 90}ms` } as React.CSSProperties}>
              <span className="how-no">0{i + 1}</span>
              <h3>{st.t}</h3>
              <p>{st.s}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function Delivery() {
  return (
    <section className="section delivery" id="delivery">
      <div className="wrap delivery-grid">
        <header className="sec-head" data-reveal>
          <p className="eyebrow">Delivery</p>
          <h2 className="sec-title">
            Clear fees. <em>No surprises.</em>
          </h2>
          <p className="sec-sub">
            We deliver anywhere in Ghana, and you always pay on delivery. Here’s exactly what
            delivery costs.
          </p>
        </header>
        <ul className="fee-table" data-reveal>
          {ZONES.map((z) => (
            <li key={z.id}>
              <span>
                <strong>{z.label}</strong>
                <small>{z.areas}</small>
              </span>
              <span className="fee">{z.fee !== null ? money(z.fee) : 'Ask us'}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function More() {
  return (
    <section className="section more" id="more">
      <div className="wrap more-grid">
        <div className="more-card" data-reveal>
          <img className="more-mark" src="/img/mark-light.png" alt="" width={61} height={80} loading="lazy" />
          <p className="eyebrow light">Beyond Black Friday</p>
          <h2 className="sec-title light">
            The full <em>Elite</em> collection
          </h2>
          <p className="more-sub">
            Perfumes, body care and gift sets. Shop the collection here, or browse our WhatsApp
            catalogue and Instagram.
          </p>
          <div className="more-ctas">
            <a className="btn btn-gold" href="/shop/">
              Shop the collection <ArrowRight size={18} />
            </a>
            <a className="btn btn-ghost-light" href={BRAND.whatsappCatalogUrl} target="_blank" rel="noopener">
              <WhatsAppIcon size={18} /> WhatsApp catalogue
            </a>
            <a className="btn btn-ghost-light" href={BRAND.instagramUrl} target="_blank" rel="noopener">
              <Instagram size={18} /> {BRAND.instagramHandle}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="section faq" id="faq">
      <div className="wrap faq-grid">
        <header className="sec-head" data-reveal>
          <p className="eyebrow">Questions</p>
          <h2 className="sec-title">
            Good to <em>know.</em>
          </h2>
          <p className="sec-sub">
            Anything else? Message us on WhatsApp at{' '}
            <a href={`https://wa.me/${BRAND.whatsappNumber}`} target="_blank" rel="noopener">
              {BRAND.whatsappDisplay}
            </a>
            .
          </p>
        </header>
        <div className="faq-list" data-reveal>
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div className={`faq-item ${isOpen ? 'is-open' : ''}`} key={f.q}>
                <button type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : i)}>
                  <span>{f.q}</span>
                  <Plus size={18} className="faq-icon" />
                </button>
                <div className="faq-a" role="region">
                  <div>
                    <p>{f.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function FinalCta({ onBuild }: { onBuild: () => void }) {
  return (
    <section className="final">
      <div className="wrap final-inner" data-reveal>
        <img src="/img/mark-light.png" alt="" width={46} height={60} loading="lazy" />
        <h2 className="final-title">
          Your box is <em>one message</em> away.
        </h2>
        <p className="final-sub">
          8 essentials · {money(OFFER.unitPrice)} · pay on delivery
        </p>
        <Countdown tone="light" />
        <button type="button" className="btn btn-gold btn-lg" onClick={onBuild}>
          Build my box <ArrowRight size={18} />
        </button>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer-inner">
        <img src="/img/wordmark-light.png" alt={BRAND.name} width={130} height={88} loading="lazy" />
        <div className="footer-links">
          <a href={`https://wa.me/${BRAND.whatsappNumber}`} target="_blank" rel="noopener">
            <WhatsAppIcon size={16} /> {BRAND.whatsappDisplay}
          </a>
          <a href={BRAND.instagramUrl} target="_blank" rel="noopener">
            <Instagram size={16} /> {BRAND.instagramHandle}
          </a>
        </div>
        <p className="footer-fine">© {new Date().getFullYear()} {BRAND.name} · Accra, Ghana · Delivery nationwide</p>
      </div>
    </footer>
  );
}
