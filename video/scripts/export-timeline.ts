// Export timing for the audio builder: pnpm exec tsx scripts/export-timeline.ts
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { CUES, MUSIC } from '../src/cues';
import { FILM_DURATION, FPS, SCENES, VOICE } from '../src/timeline';

const durations: Record<string, number> = JSON.parse(
  readFileSync('public/audio/vo/durations.json', 'utf8'),
).durations;

const voice = VOICE.map((v) => {
  const start = (SCENES[v.scene].start + v.at) / FPS;
  const length = durations[v.id];
  if (length === undefined) throw new Error(`Missing VO line ${v.id}`);
  const pauses = v.pauses ?? [];
  let previousAt = 0;
  for (const pause of pauses) {
    if (
      !Number.isFinite(pause.at) ||
      !Number.isFinite(pause.duration) ||
      pause.at <= previousAt ||
      pause.at >= length ||
      pause.duration <= 0
    ) {
      throw new Error(`Invalid source pause in VO ${v.id}`);
    }
    previousAt = pause.at;
  }
  return {
    id: v.id,
    start,
    end:
      start + length + pauses.reduce((sum, pause) => sum + pause.duration, 0),
    pauses,
  };
}).sort((x, y) => x.start - y.start);

// Lines must not overlap; keep a short breath between them.
for (let i = 1; i < voice.length; i++) {
  const gap = voice[i]!.start - voice[i - 1]!.end;
  if (gap < 0.15) {
    throw new Error(
      `VO ${voice[i - 1]!.id} overlaps ${voice[i]!.id} (gap ${gap.toFixed(2)}s)`,
    );
  }
}
const last = voice[voice.length - 1]!;
if (last.end > FILM_DURATION / FPS - 0.3)
  throw new Error(`VO ${last.id} runs past the end`);

const out = {
  fps: FPS,
  duration: FILM_DURATION / FPS,
  voice,
  cues: CUES.map((c) => ({
    ...c,
    at: c.at / FPS,
    dur: c.dur === undefined ? undefined : c.dur / FPS,
  })),
  music: Object.fromEntries(
    Object.entries(MUSIC).map(([k, v]) => [k, v / FPS]),
  ),
};
mkdirSync('out/audio', { recursive: true });
writeFileSync(
  path.join('out/audio', 'timeline.json'),
  JSON.stringify(out, null, 2),
);
console.log(
  `timeline: ${out.duration.toFixed(2)}s, ${voice.length} VO lines, ${out.cues.length} cues`,
);
