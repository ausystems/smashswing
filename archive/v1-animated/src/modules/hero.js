import gsap from 'gsap';
import { reduced, q, qa, lineInners, fireDot } from '../utils.js';

export default function init() {
  const hero = q('#hero');
  const videoWrap = q('.hero__video');
  const video = q('#hero-video');
  const plate = q('#hero-plate');
  const content = q('#hero-content');
  const lines = lineInners(q('#hero-h'));
  const lead = q('#hero-lead');
  const btns = qa('#hero-actions .btn');
  const rule = q('#hero-rule');
  const specs = qa('#hero-specs li');
  const margin = q('#hero-margin');
  const control = q('#hero-control');
  const dot = q('#hero-dot');

  // video control
  let paused = false;
  const setPaused = (v) => {
    paused = v;
    control.setAttribute('aria-pressed', String(v));
    control.setAttribute('aria-label', v ? 'Play video' : 'Pause video');
    if (v) video.pause(); else video.play().catch(() => {});
  };
  control.addEventListener('click', () => setPaused(!paused));

  if (reduced) {
    hero.classList.remove('is-pre');
    video.removeAttribute('autoplay');
    video.pause();
    setPaused(true);
    gsap.set(dot, { scale: 1 });
    dot.classList.add('is-live');
    return { play: () => {} };
  }

  // set every start value inline first, then drop the CSS pre-state — no visible jump
  gsap.set(video, { opacity: 0 });
  gsap.set(plate, { scale: 1.06 });
  gsap.set(lines, { yPercent: 108 });
  gsap.set([lead, ...btns, ...specs, margin, control], { opacity: 0 });
  gsap.set(rule, { scaleX: 0 });
  hero.classList.remove('is-pre');

  const tl = gsap.timeline({ paused: true });
  tl.to(video, { opacity: 1, duration: 1.4, ease: 'expo.out' }, 0)
    .to(plate, { scale: 1, duration: 1.4, ease: 'expo.out' }, 0)
    .to(lines, { yPercent: 0, duration: 1.05, ease: 'expo.out', stagger: 0.075 }, 0.25)
    .fromTo(lead, { y: 12 }, { y: 0, opacity: 1, duration: 0.8, ease: 'expo.out' }, 0.55)
    .fromTo(btns, { y: 10 }, { y: 0, opacity: 1, duration: 0.7, ease: 'expo.out', stagger: 0.06 }, 0.70)
    .to(rule, { scaleX: 1, duration: 0.9, ease: 'expo.out' }, 0.80)
    .to(specs, { opacity: 1, duration: 0.5, stagger: 0.05 }, 0.90)
    .to([margin, control], { opacity: 1, duration: 0.6 }, 0.95)
    .add(() => fireDot(dot, { peak: 1.35, duration: 0.42, live: true }), 2.2);

  // exit: video scales, content lifts, nothing fades (except the margin type)
  gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } })
    .fromTo(videoWrap, { scale: 1 }, { scale: 1.12, ease: 'none' }, 0)
    .fromTo(content, { yPercent: 0 }, { yPercent: -18, ease: 'none' }, 0)
    .to(margin, { opacity: 0, ease: 'none' }, 0);

  return { play: () => tl.play(0) };
}
