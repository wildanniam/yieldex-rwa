import type React from 'react';
import { Audio } from '@remotion/media';
import {
  AbsoluteFill,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { Atmosphere, FilmFinish } from './assets/Atmosphere';
import { CameraRig } from './fx/Camera';
import { Bloom, Bokeh, LightLeaks, Warp } from './fx/Light';
import { keys } from './lib/anim';
import { AssistantScene } from './scenes/AssistantScene';
import { CloseScene } from './scenes/CloseScene';
import { MarketScene, stageCamera } from './scenes/MarketScene';
import {
  DIAL_CENTER,
  NumbersScene,
  proofPortalRadius,
} from './scenes/NumbersScene';
import { OriginScene, portalRadius } from './scenes/OriginScene';
import { C } from './theme';
import { FILM_DURATION as DURATION, NUMBERS, ORIGIN, SCENES } from './timeline';

export const FILM_DURATION = DURATION;

const S = SCENES;
const peak = (f: number, at: number, rise: number, fall: number) =>
  keys(f, [at - rise, at, at + fall], [0, 1, 0], (t) => t);

/**
 * Scenes overlap briefly; each owns its entrance/exit so transitions read as
 * camera moves: through the ring, into purple light, through the AI, and
 * a circular camera push from the allocation dial into the onchain ledger.
 */
export const YieldexFilm: React.FC<{ readonly audio?: boolean }> = ({
  audio = true,
}) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const mStart = S.market.start;
  const aStart = S.assistant.start;
  const nStart = S.numbers.start;
  const stage = keys(
    f,
    [mStart, mStart + 40, aStart - 10, aStart + 30],
    [0, 1, 1, 0],
  );
  const cam = stageCamera(Math.max(0, f - mStart));
  const purple = keys(
    f,
    [aStart - 12, aStart + 24, nStart - 4, nStart + 30],
    [0, 1, 1, 0],
  );
  const portalOpen = f >= ORIGIN.portal[0] && f < ORIGIN.portal[1];

  return (
    <AbsoluteFill style={{ background: C.deep }}>
      <Atmosphere
        camX={cam.x * stage}
        camY={cam.y * stage}
        purple={purple}
        floor={stage}
        trails={keys(
          f,
          [mStart - 10, mStart + 30, aStart - 10, aStart + 30],
          [1, 0.25, 0.25, 0.5],
        )}
        energy={1 + peak(f, S.close.start + 212, 6, 40) * 0.8}
      />
      <LightLeaks
        purple={purple}
        amount={
          0.55 +
          peak(f, mStart + 10, 30, 50) +
          peak(f, aStart, 20, 40) +
          peak(f, S.close.start + 214, 10, 90) * 0.8
        }
      />
      <CameraRig>
        <Sequence
          name="Origin"
          from={S.origin.start}
          durationInFrames={S.origin.duration}
          premountFor={fps}
        >
          <OriginScene />
        </Sequence>
        <Sequence
          name="Market"
          from={mStart}
          durationInFrames={S.market.duration}
          premountFor={fps}
        >
          <AbsoluteFill
            style={{
              clipPath: portalOpen
                ? `circle(${portalRadius(f)}px at 960px 540px)`
                : undefined,
            }}
          >
            <MarketScene />
          </AbsoluteFill>
        </Sequence>
        <Sequence
          name="Assistant"
          from={aStart}
          durationInFrames={S.assistant.duration}
          premountFor={fps}
        >
          <AssistantScene />
        </Sequence>
        <Sequence
          name="Numbers"
          from={nStart}
          durationInFrames={S.numbers.duration}
          premountFor={fps}
        >
          <NumbersScene />
        </Sequence>
        <Sequence
          name="Close"
          from={S.close.start}
          durationInFrames={S.close.duration}
          premountFor={fps}
        >
          <AbsoluteFill
            style={{
              clipPath:
                f < nStart + NUMBERS.portal[1]
                  ? `circle(${Math.max(0, proofPortalRadius(f - nStart) - 8)}px at ${DIAL_CENTER.x}px ${DIAL_CENTER.y}px)`
                  : undefined,
            }}
          >
            <CloseScene />
          </AbsoluteFill>
        </Sequence>
      </CameraRig>

      {/* transition light */}
      <Warp amount={peak(f, ORIGIN.portal[0] + 26, 26, 22)} />
      <Bloom amount={peak(f, ORIGIN.portal[0] + 34, 14, 26) * 0.7} />
      <Warp
        amount={peak(f, aStart, 20, 18) * 0.8}
        x={450}
        y={650}
        color="190, 180, 255"
      />
      <Bloom
        amount={peak(f, aStart + 2, 14, 30)}
        x={450}
        y={650}
        color="124, 114, 254"
      />
      <Warp amount={peak(f, nStart, 16, 16) * 0.7} />
      <Bloom amount={peak(f, nStart + 2, 10, 22) * 0.5} />
      <Bloom
        amount={peak(f, S.close.start + 24, 16, 20) * 0.18}
        x={DIAL_CENTER.x}
        y={DIAL_CENTER.y}
      />

      <Bokeh
        camX={cam.x * stage}
        camY={cam.y * stage}
        purple={purple}
        amount={0.8}
      />
      <FilmFinish />
      {audio ? (
        <Audio src={staticFile('audio/mix.wav')} premountFor={fps} />
      ) : null}
    </AbsoluteFill>
  );
};
