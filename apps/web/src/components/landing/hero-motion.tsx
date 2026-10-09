'use client';

import { useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useReducedMotion } from 'motion/react';
import s from './landing.module.css';

gsap.registerPlugin(useGSAP);
const subscribeHydration = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

/** Separate float/pointer wrappers preserve the original artwork orientation. */
export function HeroMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLElement>(null);
  const [paused, setPaused] = useState(false);
  const reduced = useReducedMotion();
  const hydrated = useSyncExternalStore(
    subscribeHydration,
    clientSnapshot,
    serverSnapshot,
  );
  useGSAP(
    () => {
      const element = root.current;
      if (!element || !hydrated || paused || reduced !== false) return;
      const media = gsap.matchMedia();
      media.add(
        {
          fine: '(hover: hover) and (pointer: fine)',
          coarse: '(hover: none), (pointer: coarse)',
        },
        (context) => {
          const fine = Boolean(context.conditions?.fine);
          const floats = Array.from(
            element.querySelectorAll<HTMLElement>('[data-eth-float]'),
          );
          const movers = Array.from(
            element.querySelectorAll<HTMLElement>('[data-eth-pointer]'),
          );
          const ambient = floats.map((target, i) =>
            gsap.to(target, {
              y: (i % 2 ? 1 : -1) * (fine ? 15 : 6),
              rotation: (i % 2 ? -1 : 1) * (fine ? 5 : 2),
              duration: 2.8 + i * 0.35,
              repeat: -1,
              yoyo: true,
              ease: 'sine.inOut',
              paused: true,
            }),
          );
          element.querySelectorAll('[data-orbit]').forEach((target, i) => {
            ambient.push(
              gsap.to(target, {
                rotation: i % 2 ? -360 : 360,
                duration: 38 + i * 13,
                repeat: -1,
                ease: 'none',
                paused: true,
              }),
            );
          });
          const controls = fine
            ? movers.map((target) => ({
                target,
                x: gsap.quickTo(target, 'x', {
                  duration: 0.65,
                  ease: 'power3.out',
                }),
                y: gsap.quickTo(target, 'y', {
                  duration: 0.65,
                  ease: 'power3.out',
                }),
                rotation: gsap.quickTo(target, 'rotation', {
                  duration: 0.7,
                  ease: 'power3.out',
                }),
                scaleX: gsap.quickTo(target, 'scaleX', {
                  duration: 0.6,
                  ease: 'power3.out',
                }),
                scaleY: gsap.quickTo(target, 'scaleY', {
                  duration: 0.6,
                  ease: 'power3.out',
                }),
              }))
            : [];
          let visible = false;
          const reset = () =>
            controls.forEach(({ x, y, rotation, scaleX, scaleY }) => {
              x(0);
              y(0);
              rotation(0);
              scaleX(1);
              scaleY(1);
            });
          const sync = () => {
            const running = visible && !document.hidden;
            ambient.forEach((tween) =>
              running ? tween.resume() : tween.pause(),
            );
            controls.forEach(({ x, y, rotation, scaleX, scaleY }) => {
              for (const quick of [x, y, rotation, scaleX, scaleY]) {
                if (!running) quick.tween.pause();
              }
            });
          };
          const move = (event: PointerEvent) => {
            if (!visible || document.hidden || event.pointerType !== 'mouse')
              return;
            // Read stable outer bounds together before writing transforms.
            const bounds = controls.map(({ target }) =>
              target.parentElement!.getBoundingClientRect(),
            );
            controls.forEach(({ x, y, rotation, scaleX, scaleY }, i) => {
              const box = bounds[i]!;
              const dx = event.clientX - (box.left + box.width / 2);
              const dy = event.clientY - (box.top + box.height / 2);
              const proximity = Math.max(0, 1 - Math.hypot(dx, dy) / 440);
              x(Math.max(-28, Math.min(28, dx * 0.13)) * proximity);
              y(Math.max(-24, Math.min(24, dy * 0.13)) * proximity);
              rotation(Math.max(-12, Math.min(12, dx * 0.09)) * proximity);
              scaleX(1 + proximity * 0.1);
              scaleY(1 + proximity * 0.1);
            });
          };
          const observer = new IntersectionObserver(
            ([entry]) => {
              visible = Boolean(entry?.isIntersecting);
              sync();
            },
            { threshold: 0.05 },
          );
          observer.observe(element);
          document.addEventListener('visibilitychange', sync);
          if (fine) {
            element.addEventListener('pointermove', move, { passive: true });
            element.addEventListener('pointerleave', reset);
          }
          return () => {
            observer.disconnect();
            document.removeEventListener('visibilitychange', sync);
            element.removeEventListener('pointermove', move);
            element.removeEventListener('pointerleave', reset);
          };
        },
      );
      return () => media.revert();
    },
    {
      scope: root,
      dependencies: [paused, reduced, hydrated],
      revertOnUpdate: true,
    },
  );
  return (
    <section
      ref={root}
      className={s.hero}
      aria-labelledby="hero-title"
      data-hero-paused={!hydrated || paused || reduced !== false}
    >
      <div className={s.orbitalField} aria-hidden="true">
        <div className={s.orbitPlane}>
          <div className={s.orbitTrack} data-orbit>
            <i />
            <b />
          </div>
        </div>
        <div className={`${s.orbitPlane} ${s.orbitPlaneTwo}`}>
          <div className={s.orbitTrack} data-orbit>
            <i />
            <b />
          </div>
        </div>
        <div className={`${s.orbitPlane} ${s.orbitPlaneThree}`}>
          <div className={s.orbitTrack} data-orbit>
            <i />
          </div>
        </div>
        <div className={s.starField} />
      </div>
      {children}
      {hydrated && reduced === false && (
        <button
          type="button"
          className={s.motionToggle}
          aria-label="Pause hero motion"
          aria-pressed={paused}
          onClick={() => setPaused((value) => !value)}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="currentColor"
            aria-hidden="true"
          >
            {paused ? (
              <path d="M3 1.5 10 6l-7 4.5Z" />
            ) : (
              <path d="M2 2h3v8H2zm5 0h3v8H7z" />
            )}
          </svg>
          {paused ? 'Motion paused' : 'Pause motion'}
        </button>
      )}
    </section>
  );
}
