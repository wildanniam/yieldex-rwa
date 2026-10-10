import type React from 'react';
import type { Point } from '../lib/anim';

type SmearProps = {
  readonly frame: number;
  /** Position at a (fractional) frame. */
  readonly path: (f: number) => Point;
  readonly render: (f: number) => React.ReactNode;
  /** Number of trailing ghosts. */
  readonly samples?: number;
  /** Frames between ghosts. */
  readonly step?: number;
  readonly opacity?: number;
};

/** Motion smear: trailing ghost copies sampled along the object's own path. */
export const Smear: React.FC<SmearProps> = ({
  frame,
  path,
  render,
  samples = 5,
  step = 0.7,
  opacity = 1,
}) => {
  const head = path(frame);
  const back = path(frame - samples * step);
  const moving = Math.hypot(head.x - back.x, head.y - back.y) > 6;
  const items = moving ? samples : 0;
  return (
    <>
      {Array.from({ length: items }, (_, k) => {
        const i = items - k;
        const f = frame - i * step;
        const p = path(f);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: p.x,
              top: p.y,
              translate: '-50% -50%',
              opacity: opacity * 0.32 * (1 - i / (items + 1)),
              filter: 'blur(3px)',
            }}
          >
            {render(f)}
          </div>
        );
      })}
      <div
        style={{
          position: 'absolute',
          left: head.x,
          top: head.y,
          translate: '-50% -50%',
          opacity,
        }}
      >
        {render(frame)}
      </div>
    </>
  );
};

/** Soft contact shadow + glossy floor reflection under an object. */
export const Reflect: React.FC<{
  readonly children: React.ReactNode;
  /** Distance from the element's box center to its base line. */
  readonly base: number;
  readonly width: number;
  /** Reflection fade length in px. */
  readonly fade?: number;
  readonly strength?: number;
}> = ({ children, base, width, fade = width * 0.5, strength = 1 }) => {
  // Mask is in the unflipped local space: keep the band just above the base line.
  const mask = `linear-gradient(0deg, transparent calc(50% - ${base}px - 1px), #000 calc(50% - ${base}px), transparent calc(50% - ${base}px + ${fade}px))`;
  return (
    <div style={{ position: 'relative' }}>
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: `calc(50% + ${base}px)`,
          width: width * 1.1,
          height: width * 0.2,
          translate: '-50% -50%',
          borderRadius: '50%',
          background:
            'radial-gradient(ellipse, rgba(0,0,0,0.55), transparent 70%)',
          opacity: strength,
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          transformOrigin: `50% calc(50% + ${base}px)`,
          transform: 'scaleY(-1)',
          opacity: 0.22 * strength,
          filter: 'blur(2px)',
          maskImage: mask,
          WebkitMaskImage: mask,
        }}
      >
        {children}
      </div>
      <div style={{ position: 'relative' }}>{children}</div>
    </div>
  );
};
