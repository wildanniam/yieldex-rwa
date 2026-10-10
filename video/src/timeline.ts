/**
 * Single source of timing for picture, voice-over and sound design.
 * Scene beats are local frames; SCENES holds each scene's global start.
 * scripts/export-timeline.ts writes this to JSON for the audio builder.
 */

export const FPS = 30;

export const SCENES = {
  origin: { start: 0, duration: 540 },
  market: { start: 500, duration: 1390 },
  assistant: { start: 1860, duration: 340 },
  numbers: { start: 2172, duration: 306 },
  close: { start: 2434, duration: 398 },
} as const;

export type SceneName = keyof typeof SCENES;

export const FILM_DURATION = SCENES.close.start + SCENES.close.duration;

export const ORIGIN = {
  earn: [12, 76],
  slow: [84, 134],
  need: [140, 232],
  sell: [186, 232],
  whatIf: [248, 330],
  flare: 18,
  dollyOut: [70, 108],
  drops: 96,
  dollyBack: [228, 262],
  soldOut: [188, 214],
  soldBack: [236, 262],
  peel: [262, 300],
  split: [300, 338],
  labels: 300,
  term: [330, 356],
  logo: 336,
  definition: 352,
  exit: [462, 490],
  ringCenter: [462, 500],
  portal: [496, 540],
} as const;

export const MARKET = {
  coinsFly: 38,
  coinGap: 11,
  coinFlight: 22,
  lidClose: 108,
  lock: 126,
  ringRise: 146,
  ringFly: 176,
  ticketOpen: 186,
  rows: [196, 226, 258, 282],
  status: 300,
  bobIn: 330,
  button: 342,
  cursorIn: 348,
  click: 380,
  capsule: 386,
  xfer: 404,
  xferEnd: 470,
  settled: 476,
  termStart: 520,
  lapse1: 604,
  lapse1End: 650,
  event1: 682,
  split1: 722,
  split1End: 780,
  claims: 800,
  camToCarol: [916, 964],
  carolIn: 930,
  resaleCard: 962,
  carolClick: 1000,
  resaleXfer: 1012,
  resaleEnd: 1072,
  sameDeadline: 1106,
  earnedStays: 1140,
  wide: [1196, 1244],
  lapse2: 1196,
  lapse2End: 1232,
  event2: 1246,
  split2: 1266,
  split2End: 1320,
  exit: [1352, 1390],
  captions: {
    lock: [24, 140],
    terms: [156, 322],
    buy: [344, 474],
    clock: [488, 598],
    income: [664, 790],
    claim: [800, 910],
    resale: [930, 1062],
    deadline: [1076, 1192],
    summary: [1286, 1350],
  },
} as const;

export const ASSISTANT = {
  headline: [10, 300],
  typing: [56, 100],
  dots: [100, 124],
  answer: 124,
  listings: [130, 138, 146],
  highlight: 160,
  scroll: [162, 180, 196, 212],
  explain: 168,
  explainLines: [176, 184, 192],
  preview: 200,
  chip: 236,
  confirm: 240,
  exit: [304, 340],
} as const;

export const NUMBERS = {
  headline: [8, 262],
  paid: 20,
  net: 50,
  fine: 60,
  higher: [96, 126],
  lower: [146, 166],
  zero: [188, 208],
  exit: [246, 306],
  portal: [262, 302],
} as const;

export const CLOSE = {
  line: [10, 94],
  blocks: 4,
  blockGap: 15,
  headline: [28, 176],
  chips: 120,
  address: 150,
  converge: [180, 212],
  boom: 212,
  logo: 214,
  sweep: [236, 286],
  tagline: 262,
  taglineSecond: 306,
  cta: 334,
  fine: 340,
  end: [384, 398],
} as const;

/** Voice-over placement: line id (src/audio/voiceover.json) → local start frame. */
export const VOICE: readonly {
  id: string;
  scene: SceneName;
  at: number;
  /** Insert silence at a quiet boundary in the source FLAC, in seconds. */
  pauses?: readonly { at: number; duration: number }[];
}[] = [
  { id: 'hook_earn', scene: 'origin', at: 15 },
  { id: 'hook_slow', scene: 'origin', at: 84 },
  { id: 'problem_cash', scene: 'origin', at: 138 },
  { id: 'idea_income', scene: 'origin', at: 252 },
  { id: 'intro_yieldex', scene: 'origin', at: 336 },
  { id: 'lock_vault', scene: 'market', at: 30 },
  { id: 'set_terms', scene: 'market', at: 150 },
  { id: 'bob_buys', scene: 'market', at: 352 },
  { id: 'clock_starts', scene: 'market', at: 540 },
  { id: 'dividend_split', scene: 'market', at: 668 },
  { id: 'claim_anytime', scene: 'market', at: 800 },
  { id: 'resale_carol', scene: 'market', at: 936 },
  { id: 'same_deadline', scene: 'market', at: 1080 },
  { id: 'summary_accounted', scene: 'market', at: 1290 },
  { id: 'ask_ai', scene: 'assistant', at: 20 },
  { id: 'ai_does', scene: 'assistant', at: 124 },
  { id: 'wallet_final', scene: 'assistant', at: 238 },
  { id: 'price_fixed', scene: 'numbers', at: 14 },
  { id: 'could_higher', scene: 'numbers', at: 100 },
  { id: 'could_lower', scene: 'numbers', at: 150 },
  { id: 'could_nothing', scene: 'numbers', at: 190 },
  { id: 'proof_contracts', scene: 'close', at: 20 },
  {
    id: 'close_tagline',
    scene: 'close',
    at: 222,
    pauses: [{ at: 0.644, duration: 0.65 }],
  },
];

export const global = (scene: SceneName, local: number) =>
  SCENES[scene].start + local;
