import type React from 'react';
import {
  AbsoluteFill,
  interpolateColors,
  random,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { C } from '../theme';

type AtmosphereProps = {
  /** Camera position of the active world, used for parallax. */
  readonly camX?: number;
  readonly camY?: number;
  /** 0 = brand green atmosphere, 1 = AI purple atmosphere. */
  readonly purple?: number;
  /** Opacity of the perspective floor grid. */
  readonly floor?: number;
  /** Opacity of the orbital light trails. */
  readonly trails?: number;
  /** Global brightness of glows. */
  readonly energy?: number;
};

const DUST = Array.from({ length: 90 }, (_, i) => ({
  x: random(`dx${i}`),
  y: random(`dy${i}`),
  z: 0.25 + random(`dz${i}`) * 0.75,
  phase: random(`dp${i}`) * Math.PI * 2,
  tint: random(`dt${i}`),
}));

const wrap = (v: number, size: number) => ((v % size) + size) % size;

const Glow: React.FC<{
  x: number;
  y: number;
  r: number;
  color: string;
  opacity: number;
}> = ({ x, y, r, color, opacity }) => (
  <div
    style={{
      position: 'absolute',
      left: x - r,
      top: y - r,
      width: r * 2,
      height: r * 2,
      borderRadius: '50%',
      opacity,
      background: `radial-gradient(circle, ${color} 0%, transparent 68%)`,
    }}
  />
);

export const Atmosphere: React.FC<AtmosphereProps> = ({
  camX = 0,
  camY = 0,
  purple = 0,
  floor = 0,
  trails = 1,
  energy = 1,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const deepTone = interpolateColors(purple, [0, 1], ['#0b2619', '#1a1446']);
  const glowA = interpolateColors(purple, [0, 1], ['#1f5a35', '#3b2f9a']);
  const glowB = interpolateColors(purple, [0, 1], ['#163c2a', '#5a3fd0']);
  const drift = Math.sin(frame / 110);

  return (
    <AbsoluteFill style={{ background: C.deep, overflow: 'hidden' }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(120% 85% at 50% 115%, ${deepTone} 0%, ${C.canvas} 52%, ${C.deep} 100%)`,
        }}
      />
      <Glow
        x={width * 0.22 - camX * 0.06}
        y={height * 0.28 + drift * 40 - camY * 0.05}
        r={760}
        color={glowA}
        opacity={0.32 * energy}
      />
      <Glow
        x={width * 0.84 - camX * 0.1}
        y={height * 0.72 - drift * 50 - camY * 0.08}
        r={680}
        color={glowB}
        opacity={0.26 * energy}
      />
      <Glow
        x={width * 0.5}
        y={height * 1.05}
        r={900}
        color={interpolateColors(purple, [0, 1], ['#2b7a45', '#4a3bc4'])}
        opacity={0.22 * energy}
      />
      {floor > 0 ? <Floor camX={camX} camY={camY} opacity={floor} /> : null}
      {trails > 0 ? <Trails opacity={trails} purple={purple} /> : null}
      {DUST.map((d, i) => {
        const size = 1.4 + d.z * 3.2;
        const x =
          wrap(d.x * width * 1.3 - camX * d.z * 0.35, width * 1.3) -
          width * 0.15;
        const y =
          wrap(
            d.y * height - frame * 0.35 * d.z - camY * d.z * 0.2,
            height + 40,
          ) - 20;
        const twinkle = 0.55 + 0.45 * Math.sin(frame / 24 + d.phase);
        const color =
          d.tint > 0.8
            ? interpolateColors(purple, [0, 1], ['#b9b3ff', '#c9c4ff'])
            : interpolateColors(purple, [0, 1], ['#bff0c3', '#c9c4ff']);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: size,
              height: size,
              borderRadius: '50%',
              background: color,
              opacity: (0.12 + 0.5 * d.z) * twinkle,
              boxShadow: d.z > 0.8 ? `0 0 ${size * 4}px ${color}` : undefined,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

const Floor: React.FC<{ camX: number; camY: number; opacity: number }> = ({
  camX,
  camY,
  opacity,
}) => (
  <div
    style={{
      position: 'absolute',
      left: '50%',
      top: '60%',
      width: 7200,
      height: 2600,
      marginLeft: -3600,
      transformOrigin: '50% 0%',
      transform: 'perspective(1000px) rotateX(74deg)',
      opacity,
      backgroundImage:
        'linear-gradient(rgba(153,227,158,0.11) 2px, transparent 2px), linear-gradient(90deg, rgba(153,227,158,0.11) 2px, transparent 2px)',
      backgroundSize: '140px 140px',
      backgroundPosition: `${-camX * 1.4}px ${-camY * 1.4}px`,
      maskImage:
        'radial-gradient(ellipse 34% 46% at 50% 8%, #000 0%, rgba(0,0,0,0.5) 45%, transparent 100%)',
      WebkitMaskImage:
        'radial-gradient(ellipse 34% 46% at 50% 8%, #000 0%, rgba(0,0,0,0.5) 45%, transparent 100%)',
    }}
  />
);

const Trails: React.FC<{ opacity: number; purple: number }> = ({
  opacity,
  purple,
}) => {
  const frame = useCurrentFrame();
  const stroke = interpolateColors(purple, [0, 1], ['#99E39E', '#9d95ff']);
  const orbits = [
    { rx: 980, ry: 250, rot: -9, speed: 2.2, dash: 140 },
    { rx: 1180, ry: 330, rot: 7, speed: -1.6, dash: 90 },
    { rx: 760, ry: 190, rot: -3, speed: 1.3, dash: 60 },
  ];
  return (
    <svg
      width={1920}
      height={1080}
      viewBox="0 0 1920 1080"
      style={{
        position: 'absolute',
        inset: 0,
        opacity,
        // Keep orbit trails away from the caption bands.
        maskImage:
          'linear-gradient(180deg, transparent 0%, transparent 22%, #000 40%, #000 72%, transparent 88%)',
        WebkitMaskImage:
          'linear-gradient(180deg, transparent 0%, transparent 22%, #000 40%, #000 72%, transparent 88%)',
      }}
    >
      {orbits.map((o, i) => (
        <g key={i} transform={`rotate(${o.rot} 960 540)`}>
          <ellipse
            cx={960}
            cy={540}
            rx={o.rx}
            ry={o.ry}
            fill="none"
            stroke={stroke}
            strokeOpacity={0.06}
            strokeWidth={1.5}
          />
          <ellipse
            cx={960}
            cy={540}
            rx={o.rx}
            ry={o.ry}
            fill="none"
            stroke={stroke}
            strokeOpacity={0.55}
            strokeWidth={2}
            strokeLinecap="round"
            pathLength={1000}
            strokeDasharray={`${o.dash} ${1000 - o.dash}`}
            strokeDashoffset={-frame * o.speed}
          />
        </g>
      ))}
    </svg>
  );
};

/** Grain + vignette layered above every scene. */
export const FilmFinish: React.FC = () => {
  const frame = useCurrentFrame();
  const ox = Math.floor(random(`gx${frame}`) * 256);
  const oy = Math.floor(random(`gy${frame}`) * 256);
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse 75% 70% at 50% 50%, transparent 55%, rgba(0,3,8,0.6) 100%)',
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage: `url(${staticFile('textures/grain.png')})`,
          backgroundPosition: `${ox}px ${oy}px`,
          opacity: 0.075,
          mixBlendMode: 'overlay',
        }}
      />
    </AbsoluteFill>
  );
};
