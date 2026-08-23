import React from 'react';
import {Composition} from 'remotion';
import {MarketingVideo} from './MarketingVideo';
import {DraftProps, FPS, calcTotalFrames, DraftVideo} from './theme';

const sample: DraftProps = {
  handle: '@orbitwebdesigns',
  video: {
    hookStat: '16 hrs',
    hookLine: 'a week lost to work an AI agent could do for you.',
    credibility: 'We automated our own studio before selling this to clients.',
    frameworkName: 'AIM',
    steps: [
      {key: 'A', title: 'Aim', point: 'Pick one task you repeat every week.'},
      {key: 'I', title: 'Instruct', point: 'Describe the outcome, not every step.'},
      {key: 'M', title: 'Monitor', point: 'Check its work weekly and tighten it.'}
    ],
    example: 'Our quote follow-ups now go out while we sleep.',
    ctaQuestion: 'Which task would you hand over first?',
    ctaOffer: 'Follow for the full walkthrough.'
  }
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="MarketingVideo"
      component={MarketingVideo}
      width={1080}
      height={1920}
      fps={FPS}
      durationInFrames={calcTotalFrames(sample.video)}
      defaultProps={sample}
      calculateMetadata={({props}) => ({
        durationInFrames: calcTotalFrames(props.video)
      })}
    />
  );
};
