import { useCallback, useMemo, useState } from 'react';
import { OFFER, money } from './config';
import { Announce, Nav } from './components/Chrome';
import { useOnScreen, useRevealOnScroll } from './lib/hooks';
import {
  EMPTY_ORDER,
  QUICK_MESSAGE,
  isComplete,
  makeRef,
  openWhatsApp,
  orderMessage,
  summarize,
  track,
  waLink,
  type Order,
} from './lib/order';
import { Hero } from './components/Hero';
import { Inside, Marquee } from './components/Inside';
import { Builder } from './components/Builder';
import { Delivery, Faq, FinalCta, Footer, HowItWorks, More, TrustStrip } from './components/Sections';
import { ArrowRight, WhatsAppIcon } from './components/Icons';

export default function App() {
  const [order, setOrderState] = useState<Order>(EMPTY_ORDER);
  const [step, setStep] = useState(0);
  const orderRef = useMemo(makeRef, []);
  const setOrder = useCallback((fn: (o: Order) => Order) => setOrderState(fn), []);
  useRevealOnScroll();

  const [ctaRef, ctaVisible] = useOnScreen<HTMLButtonElement>('0px');
  const [buildRef, buildVisible] = useOnScreen<HTMLDivElement>('-20% 0px -20% 0px');

  const quickLink = waLink(QUICK_MESSAGE);
  const goBuild = () => {
    document.getElementById('build')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    track('ViewContent', OFFER.unitPrice);
  };

  const s = summarize(order);
  const ready = isComplete(order);
  const showSticky = !ctaVisible && !buildVisible;

  return (
    <>
      <a className="skip" href="#build">
        Skip to order builder
      </a>
      <Announce />
      <Nav
        homeHref="#top"
        links={[
          { href: '#inside', label: 'What’s inside' },
          { href: '#build', label: 'Scent picker' },
          { href: '/shop/', label: 'Shop perfumes' },
          { href: '#faq', label: 'FAQ' },
        ]}
        action={
          <button type="button" className="btn btn-dark btn-sm" onClick={goBuild}>
            Order now
          </button>
        }
      />

      <main>
        <Hero
          onBuild={goBuild}
          quickLink={quickLink}
          onQuick={(e) => {
            track('Lead', OFFER.unitPrice);
            openWhatsApp(quickLink, e);
          }}
          ctaRef={ctaRef}
        />
        <Marquee />
        <TrustStrip />
        <Inside onBuild={goBuild} />
        <div ref={buildRef}>
          <Builder order={order} setOrder={setOrder} step={step} setStep={setStep} orderRef={orderRef} />
        </div>
        <HowItWorks />
        <Delivery />
        <More />
        <Faq />
        <FinalCta onBuild={goBuild} />
      </main>
      <Footer />

      <div className={`sticky ${showSticky ? 'is-shown' : ''}`} aria-hidden={!showSticky}>
        <div className="sticky-inner">
          <div className="sticky-info">
            <span className="sticky-name">{ready ? s.deal.label : 'Combo Box · 8 items'}</span>
            <span className="sticky-price">
              {money(ready && s.feeKnown ? s.total : s.deal.price)}
              <small>{ready && s.feeKnown ? ' total · pay on delivery' : ' · pay on delivery'}</small>
            </span>
          </div>
          {ready ? (
            <a
              className="btn btn-wa"
              href={waLink(orderMessage(order, orderRef))}
              target="_blank"
              rel="noopener"
              tabIndex={showSticky ? 0 : -1}
              onClick={(e) => {
                track('Lead', s.total);
                openWhatsApp(waLink(orderMessage(order, orderRef)), e);
              }}
            >
              <WhatsAppIcon size={18} /> Claim
            </a>
          ) : (
            <button type="button" className="btn btn-gold" onClick={goBuild} tabIndex={showSticky ? 0 : -1}>
              Build box <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    </>
  );
}
