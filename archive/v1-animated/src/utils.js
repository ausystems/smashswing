import gsap from 'gsap';

export const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
export const q = (s, r = document) => r.querySelector(s);
export const qa = (s, r = document) => Array.from(r.querySelectorAll(s));
export const lineInners = (el) => qa('.line > .line__in', el);

/** The impact dot. scale 0 → peak → 1. Optionally keeps the infinite ring afterwards. */
export function fireDot(dot, { peak = 1.35, duration = 0.42, live = true } = {}) {
  if (!dot) return;
  dot.classList.remove('is-live');
  gsap.killTweensOf(dot);
  if (reduced) {
    gsap.set(dot, { scale: 1, opacity: 1 });
    if (live) dot.classList.add('is-live');
    return;
  }
  gsap.timeline()
    .fromTo(dot, { scale: 0, opacity: 1 }, { scale: peak, duration: duration * 0.55, ease: 'power2.out' })
    .to(dot, { scale: 1, duration: duration * 0.45, ease: 'power2.inOut', onComplete: () => { if (live) dot.classList.add('is-live'); } });
}

export function debounce(fn, ms = 250) {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

/** Standard reveal — 3.4 in the spec. Use sparingly. */
export function reveal(targets, { stagger = 0.06, start = 'top 82%', trigger } = {}) {
  const els = typeof targets === 'string' ? qa(targets) : targets;
  if (!els || !els.length) return;
  if (reduced) { gsap.set(els, { opacity: 1 }); return; }
  gsap.from(els, {
    yPercent: 8, opacity: 0, duration: 0.8, ease: 'expo.out', stagger,
    scrollTrigger: { trigger: trigger || els[0], start, once: true },
  });
}

/** Headline reveal — 3.5 in the spec. Lines are already masked in markup. */
export function revealLines(headline, { start = 'top 85%', delay = 0 } = {}) {
  const lines = lineInners(headline);
  if (!lines.length) return;
  if (reduced) { gsap.set(lines, { yPercent: 0 }); return; }
  gsap.set(lines, { yPercent: 108 });
  gsap.to(lines, {
    yPercent: 0, duration: 1.05, ease: 'expo.out', stagger: 0.075, delay,
    scrollTrigger: { trigger: headline, start, once: true },
  });
}
