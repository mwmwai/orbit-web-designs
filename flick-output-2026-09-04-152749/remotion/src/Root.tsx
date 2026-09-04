import {Composition} from 'remotion';
import {WastedFirstImpression} from './scenes/WastedFirstImpression';
import {ThreeSecondExit} from './scenes/ThreeSecondExit';
import {OrbitBuildsBetter} from './scenes/OrbitBuildsBetter';
import {DesignSpeedSeo} from './scenes/DesignSpeedSeo';
import {OrbitOutro} from './scenes/OrbitOutro';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="wasted-first-impression" component={WastedFirstImpression} durationInFrames={120} fps={30} width={1080} height={1920} />
      <Composition id="three-second-exit" component={ThreeSecondExit} durationInFrames={120} fps={30} width={1080} height={1920} />
      <Composition id="orbit-builds-better" component={OrbitBuildsBetter} durationInFrames={150} fps={30} width={1080} height={1920} />
      <Composition id="design-speed-seo" component={DesignSpeedSeo} durationInFrames={120} fps={30} width={1080} height={1920} />
      <Composition id="orbit-outro" component={OrbitOutro} durationInFrames={150} fps={30} width={1080} height={1920} />
    </>
  );
};
