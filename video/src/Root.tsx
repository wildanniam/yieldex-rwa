import { Composition, Folder, Still } from 'remotion';
import {
  ASSETS,
  AssetSheetInterface,
  AssetSheetObjects,
  AssetStill,
  type AssetName,
} from './AssetSheet';
import { FILM_DURATION, YieldexFilm } from './Film';
import { SceneFrame } from './SceneFrame';
import { ASSISTANT_DURATION, AssistantScene } from './scenes/AssistantScene';
import { CLOSE_DURATION, CloseScene } from './scenes/CloseScene';
import { MARKET_DURATION, MarketScene } from './scenes/MarketScene';
import { NUMBERS_DURATION, NumbersScene } from './scenes/NumbersScene';
import { ORIGIN_DURATION, OriginScene } from './scenes/OriginScene';

const Origin = () => (
  <SceneFrame>
    <OriginScene />
  </SceneFrame>
);
const Market = () => (
  <SceneFrame floor={1} trails={0.25}>
    <MarketScene />
  </SceneFrame>
);
const Assistant = () => (
  <SceneFrame purple={1}>
    <AssistantScene />
  </SceneFrame>
);
const Numbers = () => (
  <SceneFrame>
    <NumbersScene />
  </SceneFrame>
);
const Close = () => (
  <SceneFrame>
    <CloseScene />
  </SceneFrame>
);

export const RemotionRoot = () => (
  <>
    <Composition
      id="YieldexFilm"
      component={YieldexFilm}
      width={1920}
      height={1080}
      fps={30}
      durationInFrames={FILM_DURATION}
    />
    <Folder name="Scenes">
      <Composition
        id="Origin"
        component={Origin}
        width={1920}
        height={1080}
        fps={30}
        durationInFrames={ORIGIN_DURATION}
      />
      <Composition
        id="Market"
        component={Market}
        width={1920}
        height={1080}
        fps={30}
        durationInFrames={MARKET_DURATION}
      />
      <Composition
        id="Assistant"
        component={Assistant}
        width={1920}
        height={1080}
        fps={30}
        durationInFrames={ASSISTANT_DURATION}
      />
      <Composition
        id="Numbers"
        component={Numbers}
        width={1920}
        height={1080}
        fps={30}
        durationInFrames={NUMBERS_DURATION}
      />
      <Composition
        id="Close"
        component={Close}
        width={1920}
        height={1080}
        fps={30}
        durationInFrames={CLOSE_DURATION}
      />
    </Folder>
    <Folder name="AssetKit">
      <Still
        id="AssetSheetObjects"
        component={AssetSheetObjects}
        width={1920}
        height={1080}
      />
      <Still
        id="AssetSheetInterface"
        component={AssetSheetInterface}
        width={1920}
        height={1080}
      />
      {/* One template for every transparent export; edit assets in AssetSheet.tsx. */}
      {(Object.keys(ASSETS) as AssetName[]).map((name) => (
        <Still
          key={name}
          id={`asset-${name}`}
          component={AssetStill}
          width={ASSETS[name].w}
          height={ASSETS[name].h}
          defaultProps={{ name }}
        />
      ))}
    </Folder>
  </>
);
