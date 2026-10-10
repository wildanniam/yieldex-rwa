import type React from 'react';
import { useCurrentFrame } from 'remotion';

type AiOrbProps = {
  readonly size?: number;
  /** 0 idle .. 1 thinking: faster orbits, brighter core. */
  readonly activity?: number;
  /** Extra pulse 0..1 (e.g. when a card lands). */
  readonly pulse?: number;
};

/** Yieldex AI: a purple sphere with two orbiting lights (purple = intelligence). */
export const AiOrb: React.FC<AiOrbProps> = ({
  size = 300,
  activity = 0,
  pulse = 0,
}) => {
  const f = useCurrentFrame();
  const a = f * 0.045 * (1 + activity * 1.6);
  const orbits = [
    { rx: 0.78, ry: 0.22, rot: -22, phase: 0, color: '#d9d4ff' },
    { rx: 0.7, ry: 0.26, rot: 34, phase: 2.4, color: '#b7f0bb' },
  ];
  const box = size * 2;
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <div
        style={{
          position: 'absolute',
          inset: -size * 0.9,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(124,114,254,${0.38 + activity * 0.18 + pulse * 0.2}) 0%, rgba(84,76,187,0.12) 34%, transparent 62%)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          overflow: 'hidden',
          background:
            'radial-gradient(circle at 34% 28%, #ece9ff 0%, #a59dff 16%, #6B62E0 42%, #2f2685 72%, #120e33 100%)',
          boxShadow: `inset -${size * 0.06}px -${size * 0.08}px ${size * 0.2}px rgba(5,3,25,0.7), 0 0 ${size * (0.25 + pulse * 0.2)}px rgba(124,114,254,0.6)`,
          scale: String(
            1 + pulse * 0.04 + Math.sin(f / 9) * 0.006 * (1 + activity * 2),
          ),
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: '-20%',
            background: `conic-gradient(from ${a * 57}deg, transparent 0deg, rgba(255,255,255,0.28) 40deg, transparent 110deg, rgba(153,227,158,0.18) 190deg, transparent 260deg, rgba(200,195,255,0.3) 320deg, transparent 360deg)`,
            mixBlendMode: 'screen',
            opacity: 0.55 + activity * 0.3,
            filter: `blur(${size * 0.05}px)`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '18%',
            top: '12%',
            width: '34%',
            height: '20%',
            borderRadius: '50%',
            background:
              'radial-gradient(ellipse, rgba(255,255,255,0.75), transparent 70%)',
            rotate: '-28deg',
          }}
        />
      </div>
      <svg
        width={box}
        height={box}
        viewBox={`${-box / 2} ${-box / 2} ${box} ${box}`}
        style={{
          position: 'absolute',
          left: (size - box) / 2,
          top: (size - box) / 2,
          overflow: 'visible',
        }}
      >
        {orbits.map((o, i) => {
          const rx = size * o.rx;
          const ry = size * o.ry;
          const pts = Array.from({ length: 9 }, (_, k) => {
            const ang = a * (i === 0 ? 1 : -0.8) + o.phase - k * 0.07;
            return {
              x: Math.cos(ang) * rx,
              y: Math.sin(ang) * ry,
              k,
              front: Math.sin(ang) > -0.2,
            };
          });
          return (
            <g key={i} transform={`rotate(${o.rot})`}>
              <ellipse
                rx={rx}
                ry={ry}
                fill="none"
                stroke={o.color}
                strokeOpacity={0.12}
                strokeWidth={1.5}
              />
              {pts.map((p) => (
                <circle
                  key={p.k}
                  cx={p.x}
                  cy={p.y}
                  r={
                    (p.k === 0 ? size * 0.024 : size * 0.016 * (1 - p.k / 10)) *
                    (p.front ? 1 : 0.7)
                  }
                  fill={o.color}
                  opacity={
                    (p.k === 0 ? 1 : 0.5 * (1 - p.k / 9)) * (p.front ? 1 : 0.35)
                  }
                  style={
                    p.k === 0
                      ? {
                          filter: `drop-shadow(0 0 ${size * 0.04}px ${o.color})`,
                        }
                      : undefined
                  }
                />
              ))}
            </g>
          );
        })}
      </svg>
    </div>
  );
};
