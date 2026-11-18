import { useEffect, useRef, useState } from 'react';
import { makeRef } from './order';

/**
 * Time-dependent and random values start empty and are filled in right after the
 * page loads, so the pre-rendered HTML and the first browser render match.
 */
export function useCountdown(target: string) {
  const end = new Date(target).getTime();
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const ms = now === null ? 0 : Math.max(0, end - now);
  return {
    ready: now !== null,
    done: now !== null && ms === 0,
    d: Math.floor(ms / 86_400_000),
    h: Math.floor(ms / 3_600_000) % 24,
    m: Math.floor(ms / 60_000) % 60,
    s: Math.floor(ms / 1000) % 60,
  };
}

/** A random order reference (EP-####), created once the page has loaded. */
export function useOrderRef() {
  const [ref, setRef] = useState('');
  useEffect(() => {
    setRef(makeRef());
  }, []);
  return ref;
}

/**
 * Adds `.is-in` to every [data-reveal] element as it scrolls into view.
 * Nothing is hidden until this runs (html.rv), so the pre-rendered page is fully
 * visible even before the JavaScript arrives.
 */
export function useRevealOnScroll() {
  useEffect(() => {
    const vh = window.innerHeight;
    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]')).filter((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < vh && r.bottom > 0) {
        el.classList.add('is-in'); // already on screen: keep it visible, no flash
        return false;
      }
      return true;
    });
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-in'));
      return;
    }
    document.documentElement.classList.add('rv');
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            io.unobserve(e.target);
          }
        }),
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/** True while the referenced element is (at least partly) on screen. */
export function useOnScreen<T extends HTMLElement>(margin = '0px') {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: margin });
    io.observe(el);
    return () => io.disconnect();
  }, [margin]);
  return [ref, visible] as const;
}

export const pad = (n: number) => String(n).padStart(2, '0');
