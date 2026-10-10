import type React from 'react';
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { Atmosphere, FilmFinish } from './assets/Atmosphere';
import { keys } from './lib/anim';
import { AssistantScene } from './scenes/AssistantScene';
import { CloseScene } from './scenes/CloseScene';
import { MarketScene, stageCamera } from './scenes/MarketScene';
import { NumbersScene } from './scenes/NumbersScene';
import { OriginScene } from './scenes/OriginScene';
import { C } from './theme';

export const FILM_DURATION = 2626;

/** Global start frame of each scene; neighbours overlap briefly. */
export const SCENE_START = {
  origin: 0,
  market: 456,
  assistant: 1726,
  numbers: 2040,
  close: 2296,
} as const;

/**
 * Scenes overlap by 30 frames; each scene owns its own entrance/exit so
 * transitions read as camera moves rather than slide wipes.
 */
export const YieldexFilm: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const stage = keys(f, [456, 496, 1706, 1746], [0, 1, 1, 0]);
  const cam = stageCamera(Math.max(0, f - SCENE_START.market));

  return (
    <AbsoluteFill style={{ background: C.deep }}>
      <Atmosphere
        camX={cam.x * stage}
        camY={cam.y * stage}
        purple={keys(f, [1700, 1746, 2030, 2070], [0, 1, 1, 0])}
        floor={stage}
        trails={keys(f, [446, 486, 1706, 1746], [1, 0.25, 0.25, 0.5])}
      />
      <Sequence
        name="Origin"
        from={SCENE_START.origin}
        durationInFrames={480}
        premountFor={fps}
      >
        <OriginScene />
      </Sequence>
      <Sequence
        name="Market"
        from={SCENE_START.market}
        durationInFrames={1290}
        premountFor={fps}
      >
        <MarketScene />
      </Sequence>
      <Sequence
        name="Assistant"
        from={SCENE_START.assistant}
        durationInFrames={330}
        premountFor={fps}
      >
        <AssistantScene />
      </Sequence>
      <Sequence
        name="Numbers"
        from={SCENE_START.numbers}
        durationInFrames={270}
        premountFor={fps}
      >
        <NumbersScene />
      </Sequence>
      <Sequence
        name="Close"
        from={SCENE_START.close}
        durationInFrames={330}
        premountFor={fps}
      >
        <CloseScene />
      </Sequence>
      <FilmFinish />
    </AbsoluteFill>
  );
};
