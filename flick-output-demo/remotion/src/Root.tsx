import type {FC} from 'react';
import { Composition } from 'remotion';
import { DemoOrbit } from './scenes/DemoOrbit';

export const RemotionRoot: FC = () => {
  return (
    <>
      <Composition id="DemoOrbit" component={DemoOrbit} durationInFrames={450} fps={30} width={1080} height={1920} />
    </>
  );
};
