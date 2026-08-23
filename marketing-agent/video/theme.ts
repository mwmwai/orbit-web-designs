export const FPS = 30;

export const COLORS = {
  bg: '#0b0f1a',
  bgAlt: '#151d33',
  accent: '#ffd60a',
  accent2: '#4cc9f0',
  text: '#ffffff',
  muted: '#93a1bd',
  dark: '#101527'
};

export const FONT = "'Arial Black', 'Segoe UI Black', 'Segoe UI', sans-serif";
export const FONT_BODY = "'Segoe UI', Arial, sans-serif";

export const FRAMES = {
  hook: 105,
  credibility: 90,
  frameworkIntro: 90,
  step: 135,
  example: 105,
  cta: 135,
  transition: 15
};

export type Step = {key: string; title: string; point: string};

export type DraftVideo = {
  hookStat: string;
  hookLine: string;
  credibility: string;
  frameworkName: string;
  steps: Step[];
  example: string;
  ctaQuestion: string;
  ctaOffer: string;
};

export type DraftProps = {
  handle: string;
  video: DraftVideo;
};

export function calcTotalFrames(v: DraftVideo): number {
  const seq = [
    FRAMES.hook,
    FRAMES.credibility,
    FRAMES.frameworkIntro,
    ...v.steps.map(() => FRAMES.step),
    FRAMES.example,
    FRAMES.cta
  ];
  return seq.reduce((a, b) => a + b, 0) - FRAMES.transition * (seq.length - 1);
}
