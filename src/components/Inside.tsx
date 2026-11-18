import { ITEMS, OFFER, money } from '../config';
import { ArrowRight } from './Icons';

export function Marquee() {
  const words = ITEMS.map((i) => i.name);
  const row = [...words, ...words];
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        {row.map((w, i) => (
          <span key={i}>
            {w}
            <i>✦</i>
          </span>
        ))}
      </div>
    </div>
  );
}

export function Inside({ onBuild }: { onBuild: () => void }) {
  const [hero, ...rest] = ITEMS;
  return (
    <section className="section inside" id="inside">
      <div className="wrap">
        <header className="sec-head" data-reveal>
          <p className="eyebrow">What’s inside</p>
          <h2 className="sec-title">
            Everything on the flyer.
            <br />
            <em>All in one box.</em>
          </h2>
          <p className="sec-sub">
            Eight things you actually use every day, from your morning shower to your last
            spray before you step out.
          </p>
        </header>

        <article className="feature" data-reveal>
          <div className="feature-media">
            <span className="feature-no">{hero.no}</span>
            <img src={hero.img} alt="Gloria Perfume Wanted No. 279, 55ml eau de parfum box" width={720} height={720} loading="lazy" />
          </div>
          <div className="feature-body">
            <p className="eyebrow">The centrepiece</p>
            <h3>{hero.name}</h3>
            <p>
              A 55ml eau de parfum, the star of the box. Tell us who it’s for and the vibe
              you love, and we’ll match the scent before we pack it.
            </p>
            <ul className="chips">
              <li>Eau de parfum</li>
              <li>55ml / 1.85 fl oz</li>
              <li>Matched to you</li>
            </ul>
          </div>
        </article>

        <ul className="items-grid">
          {rest.map((it, i) => (
            <li className="item" key={it.id} data-reveal style={{ '--d': `${(i % 2) * 80}ms` } as React.CSSProperties}>
              <div className="item-media">
                <span className="item-no">{it.no}</span>
                <img src={it.img} alt={it.name} width={720} height={720} loading="lazy" decoding="async" />
              </div>
              <h3 className="item-name">{it.name}</h3>
              <p className="item-detail">{it.detail}</p>
            </li>
          ))}
          <li className="item item-cta" data-reveal style={{ '--d': '80ms' } as React.CSSProperties}>
            <button type="button" onClick={onBuild}>
              <span className="item-cta-lbl">All 8 for</span>
              <span className="item-cta-num">{money(OFFER.unitPrice)}</span>
              <span className="item-cta-go">
                Build my box <ArrowRight size={16} />
              </span>
            </button>
          </li>
        </ul>
      </div>
    </section>
  );
}
