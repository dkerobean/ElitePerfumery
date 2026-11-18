import { useEffect, useRef, useState } from 'react';
import { DEALS, FOR_OPTIONS, VIBE_OPTIONS, money } from '../config';
import {
  isComplete,
  openWhatsApp,
  orderMessage,
  summarize,
  track,
  validate,
  waLink,
  type Order,
} from '../lib/order';
import { ArrowLeft, Check, WhatsAppIcon } from './Icons';
import { DeliveryForm, focusFirstError } from './DeliveryForm';

const STEPS = ['Who', 'Vibe', 'Boxes', 'Delivery'];

interface Props {
  order: Order;
  setOrder: (fn: (o: Order) => Order) => void;
  step: number;
  setStep: (n: number) => void;
  orderRef: string;
}

export function Builder({ order, setOrder, step, setStep, orderRef }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const first = useRef(true);
  const [sent, setSent] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const s = summarize(order);
  const message = orderMessage(order, orderRef);
  const errors = validate(order);
  const ready = isComplete(order);

  const submit = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!ready) {
      e.preventDefault();
      setShowErrors(true);
      focusFirstError(errors);
      return;
    }
    setSent(true);
    track('Lead', s.total);
    openWhatsApp(waLink(message), e);
  };

  // keep the top of the card in view when the step changes (mobile)
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const el = cardRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top;
    if (top < 0 || top > window.innerHeight * 0.4) {
      window.scrollTo({ top: window.scrollY + top - 76, behavior: 'smooth' });
    }
  }, [step]);

  const pick = <K extends keyof Order>(key: K, value: Order[K], next?: number) => {
    setOrder((o) => ({ ...o, [key]: value }));
    if (next !== undefined) window.setTimeout(() => setStep(next), 260);
  };

  return (
    <section className="section builder" id="build">
      <div className="wrap builder-grid">
        <header className="sec-head builder-head" data-reveal>
          <p className="eyebrow">The 30-second scent picker</p>
          <h2 className="sec-title">
            Build your box.
            <br />
            <em>We’ll do the rest on WhatsApp.</em>
          </h2>
          <p className="sec-sub">
            Four quick taps. When you’re done, WhatsApp opens with your full order and total
            already typed out. Just press send.
          </p>
        </header>

        <div className="b-card" ref={cardRef} data-reveal>
          <ol className="b-progress" aria-label="Steps">
            {STEPS.map((label, i) => (
              <li key={label} className={i === step ? 'is-current' : i < step ? 'is-done' : ''}>
                <button type="button" onClick={() => i <= step && setStep(i)} disabled={i > step}>
                  <span className="b-progress-no">{i < step ? <Check size={12} /> : i + 1}</span>
                  <span className="b-progress-lbl">{label}</span>
                </button>
              </li>
            ))}
          </ol>

          <div className="b-body" key={step}>
            {step === 0 && (
              <fieldset className="b-step">
                <legend className="b-q">Who is the perfume for?</legend>
                <div className="opt-list">
                  {FOR_OPTIONS.map((f) => (
                    <button
                      type="button"
                      key={f.id}
                      className={`opt ${order.forWho === f.id ? 'is-on' : ''}`}
                      aria-pressed={order.forWho === f.id}
                      onClick={() => pick('forWho', f.id, 1)}
                    >
                      <span className="opt-main">
                        <span className="opt-title">{f.label}</span>
                        <span className="opt-note">{f.note}</span>
                      </span>
                      <span className="opt-tick">
                        <Check size={14} />
                      </span>
                    </button>
                  ))}
                </div>
              </fieldset>
            )}

            {step === 1 && (
              <fieldset className="b-step">
                <legend className="b-q">Pick your vibe</legend>
                <div className="vibe-list">
                  {VIBE_OPTIONS.map((v) => (
                    <button
                      type="button"
                      key={v.id}
                      className={`vibe ${order.vibe === v.id ? 'is-on' : ''}`}
                      aria-pressed={order.vibe === v.id}
                      onClick={() => pick('vibe', v.id, 2)}
                    >
                      <span className="vibe-swatch" style={{ background: v.swatch }} />
                      <span className="opt-main">
                        <span className="opt-title">{v.label}</span>
                        <span className="vibe-notes">{v.notes}</span>
                        <span className="opt-note">{v.when}</span>
                      </span>
                      <span className="opt-tick">
                        <Check size={14} />
                      </span>
                    </button>
                  ))}
                </div>
              </fieldset>
            )}

            {step === 2 && (
              <fieldset className="b-step">
                <legend className="b-q">How many boxes?</legend>
                <div className="opt-list">
                  {DEALS.map((d) => (
                    <button
                      type="button"
                      key={d.id}
                      className={`opt deal ${order.deal === d.id ? 'is-on' : ''}`}
                      aria-pressed={order.deal === d.id}
                      onClick={() => {
                        pick('deal', d.id, 3);
                        track('InitiateCheckout', d.price);
                      }}
                    >
                      <span className="opt-main">
                        <span className="opt-title">
                          {d.label}
                          {d.tag && <span className="tag">{d.tag}</span>}
                        </span>
                        <span className="opt-note">
                          {d.note} · {d.boxes * 8} items
                        </span>
                      </span>
                      <span className="deal-price">{money(d.price)}</span>
                    </button>
                  ))}
                </div>
              </fieldset>
            )}

            {step === 3 && (
              <div className="b-step">
                <DeliveryForm
                  value={order}
                  onChange={(patch) => setOrder((o) => ({ ...o, ...patch }))}
                  errors={errors}
                  showErrors={showErrors}
                />

                <div className="receipt">
                  <div className="r-row">
                    <span>
                      {s.deal.boxes} × Combo Box ({s.deal.boxes * 8} items)
                    </span>
                    <span>{money(s.deal.price)}</span>
                  </div>
                  <div className="r-row r-sub">
                    <span>
                      Perfume: {s.forWho?.label ?? '—'} · {s.vibe?.label ?? '—'}
                    </span>
                    <button type="button" className="r-edit" onClick={() => setStep(0)}>
                      Edit
                    </button>
                  </div>
                  <div className="r-row">
                    <span>Delivery{s.zone ? ` · ${s.zone.label}` : ''}</span>
                    <span>{!s.zone ? 'Choose area' : s.fee !== null ? money(s.fee) : 'Confirmed on chat'}</span>
                  </div>
                  <div className="r-row r-total">
                    <span>{s.zone && !s.feeKnown ? 'Subtotal + delivery' : 'Pay on delivery'}</span>
                    <span>{money(s.zone && !s.feeKnown ? s.deal.price : s.total)}</span>
                  </div>
                </div>

                <a
                  className={`btn btn-wa btn-lg btn-block ${ready ? '' : 'is-pending'}`}
                  href={waLink(message)}
                  target="_blank"
                  rel="noopener"
                  onClick={submit}
                >
                  <WhatsAppIcon size={20} />
                  Claim deal on WhatsApp
                </a>
                <p className="b-assure" role="status">
                  {sent
                    ? 'WhatsApp is opening with your order filled in. Just press send.'
                    : showErrors && !ready
                      ? 'Please fill in the highlighted details above.'
                      : 'Nothing to pay now. You pay the rider when your box arrives.'}
                </p>

                <details className="preview">
                  <summary>Preview the order we’ll send</summary>
                  <pre>{message.replace(/\*/g, '')}</pre>
                </details>
              </div>
            )}
          </div>

          {step > 0 && (
            <button type="button" className="b-back" onClick={() => setStep(step - 1)}>
              <ArrowLeft size={16} /> Back
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
