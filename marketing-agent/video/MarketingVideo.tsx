import React from 'react';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {fade} from '@remotion/transitions/fade';
import {slide} from '@remotion/transitions/slide';
import {DraftProps, FRAMES} from './theme';
import {
  Backdrop,
  CredibilityScene,
  CtaScene,
  ExampleScene,
  FrameworkIntroScene,
  HookScene,
  StepScene
} from './scenes';

export const MarketingVideo: React.FC<DraftProps> = ({handle, video}) => {
  const t = () => (
    <TransitionSeries.Transition
      presentation={fade()}
      timing={linearTiming({durationInFrames: FRAMES.transition})}
    />
  );
  const seq = (durationInFrames: number, children: React.ReactNode) => (
    <TransitionSeries.Sequence durationInFrames={durationInFrames}>{children}</TransitionSeries.Sequence>
  );

  return (
    <TransitionSeries>
      {seq(FRAMES.hook, <HookScene stat={video.hookStat} line={video.hookLine} />)}
      {t()}
      {seq(FRAMES.credibility, <CredibilityScene text={video.credibility} />)}
      {t()}
      {seq(FRAMES.frameworkIntro, <FrameworkIntroScene name={video.frameworkName} />)}
      {video.steps.map((s, i) => (
        <React.Fragment key={s.key}>
          {t()}
          {seq(
            FRAMES.step,
            <StepScene step={s} index={i} total={video.steps.length} />
          )}
        </React.Fragment>
      ))}
      {t()}
      {seq(FRAMES.example, <ExampleScene text={video.example} />)}
      {t()}
      {seq(
        FRAMES.cta,
        <CtaScene question={video.ctaQuestion} offer={video.ctaOffer} handle={handle} />
      )}
    </TransitionSeries>
  );
};

export {Backdrop};
