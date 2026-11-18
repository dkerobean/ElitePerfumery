import { useEffect, useRef } from 'react';
import { ITEMS } from '../config';

/**
 * Pure-CSS 3D gift box. No WebGL, no libraries — light enough for
 * budget Android phones on mobile data.
 *  - the box and the orbiting products share one animated --spin angle
 *  - each product counter-rotates so it always faces the viewer
 *  - scrolling lifts the lid and raises the perfume out of the box
 */
const ORBIT = ITEMS.filter((i) => i.id !== 'perfume');
const perfume = ITEMS.find((i) => i.id === 'perfume')!;
const LIFT = [-6, 14, -18, 8, -10, 18, -4];

export function GiftBox3D({ paused }: { paused: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // 0 when the stage is low in view, 1 once it has scrolled up past ~ the top third
      const p = Math.min(1, Math.max(0, (vh * 0.75 - r.top) / (vh * 0.6)));
      el.style.setProperty('--open', p.toFixed(3));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={ref} className={`stage ${paused ? 'is-paused' : ''}`} aria-hidden="true">
      <div className="stage-glow" />
      <div className="scene">
        <div className="ring">
          {ORBIT.map((it, i) => (
            <div
              key={it.id}
              className="orbit"
              style={{ '--a': `${(360 / ORBIT.length) * i}deg`, '--y': `${LIFT[i]}px` } as React.CSSProperties}
            >
              <img src={it.img} alt="" width={120} height={120} loading="eager" decoding="async" />
            </div>
          ))}
        </div>

        <div className="hero-bottle">
          <img src={perfume.img} alt="" width={200} height={200} fetchPriority="high" />
        </div>

        <div className="box">
          <div className="face f-front">
            <img className="face-mark" src="/img/mark-light.png" alt="" width={61} height={80} />
            <span className="face-word">ELITE</span>
          </div>
          <div className="face f-back">
            <img className="face-mark" src="/img/mark-light.png" alt="" width={61} height={80} />
            <span className="face-word">PERFUMERY</span>
          </div>
          <div className="face f-left ribbon-v" />
          <div className="face f-right ribbon-v" />
          <div className="face f-bottom" />
          <div className="face f-inner" />
        </div>

        <div className="lid">
          <div className="lface l-top" />
          <div className="lface l-front" />
          <div className="lface l-back" />
          <div className="lface l-left" />
          <div className="lface l-right" />
        </div>
      </div>
      <div className="stage-shadow" />
    </div>
  );
}
