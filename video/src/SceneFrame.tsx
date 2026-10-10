import type React from 'react';
import { AbsoluteFill } from 'remotion';
import { Atmosphere, FilmFinish } from './assets/Atmosphere';

type SceneFrameProps = {
  readonly children: React.ReactNode;
  readonly purple?: number;
  readonly floor?: number;
  readonly trails?: number;
};

/** Standalone scene preview: background + finish, matching the full film. */
export const SceneFrame: React.FC<SceneFrameProps> = ({
  children,
  purple = 0,
  floor = 0,
  trails = 1,
}) => (
  <AbsoluteFill>
    <Atmosphere purple={purple} floor={floor} trails={trails} />
    {children}
    <FilmFinish />
  </AbsoluteFill>
);
