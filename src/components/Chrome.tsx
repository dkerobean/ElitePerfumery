import type { ReactNode } from 'react';
import { BRAND, OFFER, money } from '../config';

export function Announce() {
  return (
    <div className="announce" role="note">
      <p>
        <span>Black Friday Combo · {money(OFFER.unitPrice)} for all 8 items</span>
        <span className="announce-sep">·</span>
        <span>Pay on delivery</span>
      </p>
    </div>
  );
}

export function Nav({
  links,
  homeHref = '/',
  action,
}: {
  links: { href: string; label: string; current?: boolean }[];
  homeHref?: string;
  action: ReactNode;
}) {
  return (
    <header className="nav">
      <div className="wrap nav-inner">
        <a href={homeHref} className="nav-logo" aria-label={`${BRAND.name} home`}>
          <img src="/img/mark-dark.png" alt="" width={24} height={32} />
          <img src="/img/wordmark-dark.png" alt={BRAND.name} width={70} height={48} className="nav-word" />
        </a>
        <nav className="nav-links" aria-label="Main">
          {links.map((l) => (
            <a key={l.href} href={l.href} aria-current={l.current ? 'page' : undefined}>
              {l.label}
            </a>
          ))}
        </nav>
        {action}
      </div>
    </header>
  );
}
