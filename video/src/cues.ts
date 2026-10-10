import { ASSISTANT, CLOSE, MARKET, NUMBERS, ORIGIN, global } from './timeline';

export type Sfx =
  | 'glint'
  | 'whoosh'
  | 'whooshLow'
  | 'whooshBig'
  | 'riser'
  | 'impact'
  | 'impactSoft'
  | 'boom'
  | 'pop'
  | 'click'
  | 'tick'
  | 'clink'
  | 'coinLand'
  | 'lock'
  | 'thunk'
  | 'shimmer'
  | 'chime'
  | 'sparkle'
  | 'swish'
  | 'hum'
  | 'timelapse'
  | 'drop'
  | 'aiTone'
  | 'typing'
  | 'thinking'
  | 'swell'
  | 'dialUp'
  | 'dialDown'
  | 'subDrop'
  | 'zap'
  | 'block';

export type Cue = {
  /** Global frame. */
  readonly at: number;
  readonly sfx: Sfx;
  /** Stereo position -1 (left) .. 1 (right). */
  readonly pan?: number;
  /** Pan at the end of a moving sound. */
  readonly panTo?: number;
  /** Linear gain multiplier. */
  readonly gain?: number;
  /** Duration in frames for sustained sounds. */
  readonly dur?: number;
  /** Pitch multiplier for variation. */
  readonly pitch?: number;
  /** Camera shake strength 0..1 at the same frame. */
  readonly shake?: number;
};

const o = (at: number) => global('origin', at);
const m = (at: number) => global('market', at);
const a = (at: number) => global('assistant', at);
const n = (at: number) => global('numbers', at);
const c = (at: number) => global('close', at);

export const CUES: readonly Cue[] = [
  // Origin
  { at: o(ORIGIN.flare), sfx: 'glint', gain: 0.8 },
  {
    at: o(ORIGIN.dollyOut[0]),
    sfx: 'whoosh',
    pan: 0.3,
    panTo: -0.4,
    gain: 0.5,
    dur: 38,
  },
  ...[0, 1, 2, 3, 4, 5].map((i) => ({
    at: o(ORIGIN.drops + i * 7),
    sfx: 'pop' as const,
    pan: -0.3 + i * 0.15,
    gain: 0.35,
    pitch: 1 + i * 0.06,
  })),
  {
    at: o(ORIGIN.soldOut[0]),
    sfx: 'whooshLow',
    pan: 0,
    panTo: 0.9,
    gain: 0.8,
    dur: 26,
  },
  {
    at: o(ORIGIN.soldBack[0]),
    sfx: 'whoosh',
    pan: 0.9,
    panTo: 0,
    gain: 0.5,
    dur: 26,
  },
  { at: o(ORIGIN.peel[0]), sfx: 'shimmer', gain: 0.7, dur: 40 },
  { at: o(ORIGIN.split[0]), sfx: 'swish', pan: 0, gain: 0.5 },
  { at: o(ORIGIN.labels), sfx: 'pop', pan: -0.4, gain: 0.35 },
  { at: o(ORIGIN.labels + 10), sfx: 'pop', pan: 0.4, gain: 0.35, pitch: 1.2 },
  { at: o(ORIGIN.logo), sfx: 'impactSoft', gain: 0.6, shake: 0.12 },
  { at: o(ORIGIN.logo + 4), sfx: 'sparkle', gain: 0.5 },
  { at: o(ORIGIN.ringCenter[0] - 16), sfx: 'riser', gain: 0.75, dur: 52 },
  { at: o(ORIGIN.portal[0]), sfx: 'whooshBig', gain: 0.9, dur: 30 },
  { at: o(ORIGIN.portal[0] + 6), sfx: 'impact', gain: 0.8, shake: 0.7 },

  // Market
  ...[0, 1, 2, 3, 4].flatMap((k) => [
    {
      at: m(MARKET.coinsFly + k * MARKET.coinGap),
      sfx: 'swish' as const,
      pan: -0.5,
      panTo: 0.1,
      gain: 0.25,
    },
    {
      at: m(MARKET.coinsFly + k * MARKET.coinGap + MARKET.coinFlight),
      sfx: 'clink' as const,
      pan: 0.15,
      gain: 0.45,
      pitch: 1 - k * 0.04,
    },
  ]),
  { at: m(MARKET.lidClose + 8), sfx: 'thunk', gain: 0.6 },
  { at: m(MARKET.lock), sfx: 'lock', gain: 0.85, shake: 0.3 },
  { at: m(MARKET.ringRise), sfx: 'shimmer', gain: 0.55, dur: 30 },
  { at: m(MARKET.ringFly), sfx: 'swish', pan: 0, panTo: -0.5, gain: 0.5 },
  { at: m(MARKET.ticketOpen), sfx: 'whoosh', pan: -0.4, gain: 0.35, dur: 18 },
  ...MARKET.rows.map((r, i) => ({
    at: m(r),
    sfx: 'tick' as const,
    pan: -0.4,
    gain: 0.45,
    pitch: 1 + i * 0.08,
  })),
  { at: m(MARKET.status), sfx: 'pop', pan: -0.3, gain: 0.4 },
  { at: m(MARKET.bobIn), sfx: 'pop', pan: 0.6, gain: 0.4, pitch: 0.9 },
  { at: m(MARKET.click), sfx: 'click', pan: -0.3, gain: 0.8 },
  { at: m(MARKET.capsule), sfx: 'hum', gain: 0.5, dur: 90 },
  {
    at: m(MARKET.xfer),
    sfx: 'whooshLow',
    pan: 0.8,
    panTo: -0.8,
    gain: 0.7,
    dur: 66,
  },
  {
    at: m(MARKET.xfer + 4),
    sfx: 'shimmer',
    pan: -0.4,
    panTo: 0.8,
    gain: 0.45,
    dur: 62,
  },
  { at: m(MARKET.xferEnd), sfx: 'coinLand', pan: -0.8, gain: 0.7 },
  { at: m(MARKET.settled), sfx: 'chime', gain: 0.7, shake: 0.25 },
  { at: m(MARKET.termStart), sfx: 'tick', pan: 0.6, gain: 0.6, pitch: 0.8 },
  { at: m(MARKET.lapse1), sfx: 'timelapse', pan: 0.5, gain: 0.55, dur: 46 },
  { at: m(MARKET.event1), sfx: 'drop', gain: 0.6, dur: 10 },
  { at: m(MARKET.event1 + 10), sfx: 'impactSoft', gain: 0.65, shake: 0.22 },
  {
    at: m(MARKET.split1),
    sfx: 'whoosh',
    pan: 0,
    panTo: -0.7,
    gain: 0.4,
    dur: 56,
  },
  {
    at: m(MARKET.split1),
    sfx: 'whoosh',
    pan: 0,
    panTo: 0.7,
    gain: 0.4,
    dur: 56,
  },
  { at: m(MARKET.split1End), sfx: 'coinLand', pan: -0.7, gain: 0.5 },
  {
    at: m(MARKET.split1End + 2),
    sfx: 'coinLand',
    pan: 0.7,
    gain: 0.5,
    pitch: 1.1,
  },
  { at: m(MARKET.claims), sfx: 'sparkle', gain: 0.4 },
  {
    at: m(MARKET.camToCarol[0]),
    sfx: 'whoosh',
    pan: -0.5,
    panTo: 0.6,
    gain: 0.45,
    dur: 48,
  },
  { at: m(MARKET.carolIn), sfx: 'pop', pan: 0.6, gain: 0.4, pitch: 1.1 },
  { at: m(MARKET.resaleCard), sfx: 'whoosh', pan: 0.3, gain: 0.35, dur: 18 },
  { at: m(MARKET.carolClick), sfx: 'click', pan: 0.4, gain: 0.8 },
  {
    at: m(MARKET.resaleXfer),
    sfx: 'whooshLow',
    pan: 0.7,
    panTo: -0.5,
    gain: 0.6,
    dur: 60,
  },
  {
    at: m(MARKET.resaleXfer + 4),
    sfx: 'shimmer',
    pan: -0.4,
    panTo: 0.7,
    gain: 0.45,
    dur: 56,
  },
  { at: m(MARKET.resaleEnd), sfx: 'coinLand', pan: -0.5, gain: 0.6 },
  {
    at: m(MARKET.resaleEnd + 4),
    sfx: 'chime',
    pan: 0.3,
    gain: 0.5,
    pitch: 1.12,
    shake: 0.18,
  },
  { at: m(MARKET.sameDeadline), sfx: 'glint', pan: 0.5, gain: 0.6 },
  { at: m(MARKET.earnedStays), sfx: 'pop', pan: -0.3, gain: 0.45 },
  {
    at: m(MARKET.wide[0]),
    sfx: 'whoosh',
    pan: 0.4,
    panTo: -0.2,
    gain: 0.45,
    dur: 48,
  },
  { at: m(MARKET.lapse2), sfx: 'timelapse', pan: 0.2, gain: 0.45, dur: 36 },
  { at: m(MARKET.event2), sfx: 'drop', gain: 0.55, dur: 8 },
  { at: m(MARKET.event2 + 8), sfx: 'impactSoft', gain: 0.6, shake: 0.18 },
  {
    at: m(MARKET.split2),
    sfx: 'whoosh',
    pan: 0,
    panTo: -0.8,
    gain: 0.35,
    dur: 54,
  },
  {
    at: m(MARKET.split2),
    sfx: 'whoosh',
    pan: 0,
    panTo: 0.8,
    gain: 0.35,
    dur: 54,
  },
  { at: m(MARKET.split2End), sfx: 'sparkle', gain: 0.45 },
  { at: m(MARKET.exit[0] - 6), sfx: 'swell', gain: 0.7, dur: 44 },

  // Assistant
  {
    at: a(0),
    sfx: 'impactSoft',
    pan: -0.4,
    gain: 0.5,
    shake: 0.15,
    pitch: 1.3,
  },
  { at: a(4), sfx: 'aiTone', pan: -0.3, gain: 0.7 },
  { at: a(ASSISTANT.typing[0]), sfx: 'typing', pan: 0.3, gain: 0.45, dur: 44 },
  { at: a(ASSISTANT.dots[0]), sfx: 'thinking', pan: 0.2, gain: 0.45, dur: 24 },
  ...ASSISTANT.listings.map((at, i) => ({
    at: a(at),
    sfx: 'pop' as const,
    pan: 0.3,
    gain: 0.4,
    pitch: 1 + i * 0.1,
  })),
  { at: a(ASSISTANT.highlight), sfx: 'glint', pan: 0.3, gain: 0.45 },
  { at: a(ASSISTANT.explain), sfx: 'whoosh', pan: 0.3, gain: 0.3, dur: 16 },
  ...ASSISTANT.explainLines.map((at, i) => ({
    at: a(at),
    sfx: 'tick' as const,
    pan: 0.3,
    gain: 0.35,
    pitch: 1.1 + i * 0.08,
  })),
  { at: a(ASSISTANT.preview), sfx: 'whoosh', pan: 0.3, gain: 0.3, dur: 16 },
  { at: a(ASSISTANT.chip), sfx: 'pop', gain: 0.4 },
  { at: a(ASSISTANT.confirm), sfx: 'glint', pan: 0.4, gain: 0.5 },
  { at: a(ASSISTANT.exit[0]), sfx: 'whooshBig', gain: 0.6, dur: 30 },

  // Numbers
  { at: n(2), sfx: 'impactSoft', gain: 0.45, shake: 0.12 },
  { at: n(NUMBERS.paid), sfx: 'pop', pan: -0.6, gain: 0.4 },
  { at: n(NUMBERS.net), sfx: 'pop', pan: 0.6, gain: 0.4, pitch: 1.1 },
  { at: n(NUMBERS.higher[0]), sfx: 'dialUp', gain: 0.55, dur: 30 },
  { at: n(NUMBERS.lower[0]), sfx: 'dialDown', gain: 0.5, dur: 20 },
  { at: n(NUMBERS.zero[0]), sfx: 'dialDown', gain: 0.5, dur: 20, pitch: 0.8 },
  { at: n(NUMBERS.zero[0] + 2), sfx: 'subDrop', gain: 0.7, shake: 0.15 },
  { at: n(NUMBERS.exit[0]), sfx: 'zap', gain: 0.6 },

  // Close
  { at: c(CLOSE.line[0]), sfx: 'hum', gain: 0.35, dur: 80 },
  ...[0, 1, 2, 3, 4, 5].map((i) => ({
    at: c(CLOSE.blocks + i * CLOSE.blockGap),
    sfx: 'block' as const,
    pan: -0.6 + i * 0.24,
    gain: 0.55,
    pitch: 1 + i * 0.05,
  })),
  ...[0, 1, 2].map((i) => ({
    at: c(CLOSE.chips + i * 10),
    sfx: 'pop' as const,
    pan: -0.4 + i * 0.4,
    gain: 0.35,
  })),
  { at: c(CLOSE.converge[0] - 30), sfx: 'riser', gain: 0.8, dur: 62 },
  { at: c(CLOSE.converge[0]), sfx: 'whooshBig', gain: 0.7, dur: 32 },
  { at: c(CLOSE.boom), sfx: 'boom', gain: 1, shake: 1 },
  { at: c(CLOSE.logo + 2), sfx: 'sparkle', gain: 0.6 },
  { at: c(CLOSE.sweep[0]), sfx: 'glint', gain: 0.55 },
  { at: c(CLOSE.cta), sfx: 'chime', gain: 0.5, pitch: 1.2 },
];

/** Music arrangement markers (global frames). */
export const MUSIC = {
  problem: global('origin', 138),
  idea: global('origin', 252),
  reveal: global('origin', ORIGIN.logo),
  marketStart: global('market', 0),
  purchase: global('market', MARKET.click),
  lapse: global('market', MARKET.lapse1),
  event1: global('market', MARKET.event1),
  wide: global('market', MARKET.wide[0]),
  aiStart: global('assistant', 0),
  numbersStart: global('numbers', 0),
  zero: global('numbers', NUMBERS.zero[0]),
  closeStart: global('close', 0),
  boom: global('close', CLOSE.boom),
} as const;
