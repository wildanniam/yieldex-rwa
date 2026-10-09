'use client';

import { useRef, type PointerEvent } from 'react';
import s from './footer.module.css';

/** Pointer light is decorative; touch and reduced-motion keep the static mark. */
export function FooterBrand() {
  const ref = useRef<HTMLDivElement>(null);
  function move(event: PointerEvent<HTMLDivElement>) {
    if (
      event.pointerType !== 'mouse' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
      return;
    const element = ref.current;
    if (!element) return;
    const box = element.querySelector('span')!.getBoundingClientRect();
    element.style.setProperty('--light-x', `${event.clientX - box.left}px`);
    element.style.setProperty('--light-y', `${event.clientY - box.top}px`);
    element.dataset.lit = 'true';
  }
  function leave() {
    if (ref.current) delete ref.current.dataset.lit;
  }
  return (
    <div
      ref={ref}
      className={s.brand}
      onPointerMove={move}
      onPointerLeave={leave}
      onPointerCancel={leave}
      aria-label="Yieldex"
    >
      <svg className={s.brandMark} viewBox="0 0 170 180" aria-hidden="true">
        <path d="M6 20h80L43 95 2 29Q0 20 6 20Z" fill="#396d44" />
        <path d="M86 20h75q10 0 5 9L122 96Z" fill="#8ebb8b" />
        <path d="m86 20 36 76-44 72H3L43 95Z" fill="#639e69" />
        <path d="m43 95 35 73H6q-6 0-2-8Z" fill="#a0cb94" />
      </svg>
      <span className={s.wordmark} aria-hidden="true">
        Yieldex
      </span>
      <span className={s.brandLight} aria-hidden="true">
        Yieldex
      </span>
    </div>
  );
}
