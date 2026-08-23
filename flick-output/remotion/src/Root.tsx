import {Composition} from 'remotion';
import {WastedFirstImpression} from './scenes/WastedFirstImpression';
import {ThreeSecondExit} from './scenes/ThreeSecondExit';
import {OrbitBuildsBetter} from './scenes/OrbitBuildsBetter';
import {DesignSpeedSeo} from './scenes/DesignSpeedSeo';
import {OrbitOutro} from './scenes/OrbitOutro';

export type SceneProps = {
  title?: string;
  label?: string;
  brand?: string;
  hero?: string;
  cta?: string;
  location?: string;
  wordmark?: string;
  wordSub?: string;
  tagline?: string;
  url?: string;
  caption?: string;
};

const Caption: React.FC<{text?: string}> = ({text}) => {
  if (!text) return null;
  return (
    <div style={{position: 'absolute', left: 70, right: 70, bottom: 90, textAlign: 'center'}}>
      <span
        style={{
          display: 'inline',
          backgroundColor: 'rgba(7,11,28,0.78)',
          color: '#FFFFFF',
          fontSize: 46,
          fontWeight: 700,
          lineHeight: '68px',
          padding: '10px 22px',
          borderRadius: 14,
          boxDecorationBreak: 'clone',
          WebkitBoxDecorationBreak: 'clone',
        }}
      >
        {text}
      </span>
    </div>
  );
};

const S1: React.FC<SceneProps> = (p) => (
  <>
    <WastedFirstImpression title={p.title} />
    <Caption text={p.caption} />
  </>
);
const S2: React.FC<SceneProps> = (p) => (
  <>
    <ThreeSecondExit label={p.label} />
    <Caption text={p.caption} />
  </>
);
const S3: React.FC<SceneProps> = (p) => (
  <>
    <OrbitBuildsBetter brand={p.brand} hero={p.hero} cta={p.cta} />
    <Caption text={p.caption} />
  </>
);
const S4: React.FC<SceneProps> = (p) => (
  <>
    <DesignSpeedSeo location={p.location} />
    <Caption text={p.caption} />
  </>
);
const S5: React.FC<SceneProps> = (p) => (
  <>
    <OrbitOutro wordmark={p.wordmark} wordSub={p.wordSub} tagline={p.tagline} url={p.url} />
    <Caption text={p.caption} />
  </>
);

export const RemotionRoot = () => {
  return (
    <>
      <Composition id="wasted-first-impression" component={S1} durationInFrames={120} fps={30} width={1080} height={1920}
        defaultProps={{title: 'Your first impression', caption: ''}} />
      <Composition id="three-second-exit" component={S2} durationInFrames={120} fps={30} width={1080} height={1920}
        defaultProps={{label: '3 SECONDS', caption: ''}} />
      <Composition id="orbit-builds-better" component={S3} durationInFrames={150} fps={30} width={1080} height={1920}
        defaultProps={{brand: 'ORBIT', hero: 'Websites that work.', cta: 'Get started', caption: ''}} />
      <Composition id="design-speed-seo" component={S4} durationInFrames={120} fps={30} width={1080} height={1920}
        defaultProps={{location: 'NAIROBI', caption: ''}} />
      <Composition id="orbit-outro" component={S5} durationInFrames={150} fps={30} width={1080} height={1920}
        defaultProps={{wordmark: 'ORBIT', wordSub: 'WEB DESIGNS', tagline: 'Your brand, in motion.', url: 'orbitwebdesigns.co.ke', caption: ''}} />
    </>
  );
};
