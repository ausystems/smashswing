import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { reduced, q, qa, lineInners, fireDot } from '../utils.js';

const FRAMES = 120;
const IMPACT = 54;
const FW = 1920;
const FH = 1080;
const HIT = { x: 1010, y: 590 };
const FPS = 24;

export default function init() {
  const section = q('#contact');
  if (!section) return;
  const stage = q('#contact-stage');
  const canvas = q('#contact-canvas');
  const poster = q('#contact-poster');
  const video = q('#contact-video');
  const dot = q('#contact-dot');
  const ring = q('#contact-ring');
  const fill = q('#contact-progress-fill');
  const frameLabel = q('#contact-frame');
  const rows = {
    v: q('#ro-velocity'), a: q('#ro-angle'), x: q('#ro-x'), y: q('#ro-y'), t: q('#ro-t'),
  };
  const desktop = window.matchMedia('(min-width: 1024px)').matches;

  // ---- headline + copy entrance (lines already masked in markup)
  const lines = lineInners(q('#contact-h'));
  const copy = [q('.contact__index'), q('.contact__body'), q('.contact__link')];
  if (!reduced) {
    gsap.set(lines, { yPercent: 108 });
    gsap.set(copy, { opacity: 0, y: 12 });
    gsap.timeline({ scrollTrigger: { trigger: section, start: desktop ? 'top 40%' : 'top 70%', once: true } })
      .to(lines, { yPercent: 0, duration: 1.05, ease: 'expo.out', stagger: 0.075 }, 0)
      .to(copy, { opacity: 1, y: 0, duration: 0.8, ease: 'expo.out', stagger: 0.08 }, 0.3);
  }

  // ---- readout + dot, shared by every mode
  let resolved = false;
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  const placeDot = () => {
    const r = stage.getBoundingClientRect();
    const scale = Math.max(r.width / FW, r.height / FH);
    const dx = (r.width - FW * scale) / 2;
    const dy = (r.height - FH * scale) / 2;
    const x = HIT.x * scale + dx;
    const y = HIT.y * scale + dy;
    gsap.set([dot, ring], { left: x, top: y });
  };
  const setUnresolved = () => {
    resolved = false;
    rows.x.textContent = '—'; rows.y.textContent = '—'; rows.t.textContent = '—';
    gsap.killTweensOf([dot, ring]);
    gsap.set(dot, { scale: 0 });
    gsap.set(ring, { opacity: 0, scale: 1 });
  };
  const resolve = () => {
    if (resolved) return;
    resolved = true;
    // one 60ms step, no counting
    setTimeout(() => {
      rows.x.textContent = rows.x.dataset.final;
      rows.y.textContent = rows.y.dataset.final;
      rows.t.textContent = rows.t.dataset.final;
    }, 60);
    rows.v.textContent = rows.v.dataset.final;
    rows.a.textContent = rows.a.dataset.final;
    placeDot();
    fireDot(dot, { peak: 1.4, duration: 0.26, live: false });
    if (!reduced) gsap.fromTo(ring, { scale: 1, opacity: 0.6 }, { scale: 5, opacity: 0, duration: 0.9, ease: 'power2.out' });
  };
  const applyFrame = (frame) => {
    if (frame >= IMPACT) { resolve(); return; }
    if (resolved) setUnresolved();
    const p = ease(frame / IMPACT);
    rows.v.textContent = `${Math.round(147 * p)} MPH`;
    rows.a.textContent = `${(12.4 * p).toFixed(1)}°`;
  };

  // ---- reduced motion: static poster at the impact frame, dot present
  if (reduced) {
    section.classList.add('is-static');
    poster.src = '/img/contact-poster.webp';
    poster.classList.remove('is-hidden');
    canvas.style.display = 'none';
    resolve();
    window.addEventListener('resize', placeDot);
    return;
  }

  // ---- below 1024: autoplaying video, readout follows the video clock
  if (!desktop) {
    let raf = 0;
    const tick = () => {
      const f = Math.floor(video.currentTime * FPS);
      applyFrame(f);
      raf = requestAnimationFrame(tick);
    };
    video.addEventListener('play', () => { cancelAnimationFrame(raf); tick(); });
    video.addEventListener('pause', () => cancelAnimationFrame(raf));
    window.addEventListener('resize', placeDot);
    return;
  }

  // ---- desktop: scroll-scrubbed frame sequence on canvas
  const ctx = canvas.getContext('2d', { alpha: false });
  const images = new Array(FRAMES).fill(null);
  let loaded = 0;
  let dpr = 1;
  const state = { frame: 0 };
  let lastDrawn = -1;

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = stage.getBoundingClientRect();
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
    lastDrawn = -1;
    placeDot();
    render();
  };

  const nearest = (f) => {
    for (let i = f; i >= 0; i--) if (images[i]) return i;
    for (let i = f + 1; i < FRAMES; i++) if (images[i]) return i;
    return -1;
  };

  function render() {
    const want = Math.round(state.frame);
    const have = nearest(want);
    if (have < 0 || have === lastDrawn) return;
    lastDrawn = have;
    const img = images[have];
    const cw = canvas.width, ch = canvas.height;
    const scale = Math.max(cw / FW, ch / FH);
    const w = FW * scale, h = FH * scale;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, cw, ch);
    ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
  }

  // preload: begins when section 03 enters the viewport, 8 at a time, never before
  let started = false;
  const preload = () => {
    if (started) return;
    started = true;
    const queue = Array.from({ length: FRAMES }, (_, i) => i);
    const worker = () => {
      const i = queue.shift();
      if (i === undefined) return;
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        images[i] = img;
        loaded++;
        if (i === 40 || (loaded > 40 && !poster.classList.contains('is-hidden') && images[40])) poster.classList.add('is-hidden');
        render();
        worker();
      };
      img.onerror = () => { worker(); };
      img.src = `/seq/frame_${String(i).padStart(3, '0')}.webp`;
    };
    for (let k = 0; k < 8; k++) worker();
  };
  ScrollTrigger.create({ trigger: '#statement', start: 'top bottom', once: true, onEnter: preload });
  // safety: if the visitor lands mid-page, start anyway
  ScrollTrigger.create({ trigger: section, start: 'top 150%', once: true, onEnter: preload });

  resize();
  window.addEventListener('resize', resize);

  gsap.to(state, {
    frame: FRAMES - 1,
    snap: 'frame',
    ease: 'none',
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: '+=250%',
      pin: true,
      scrub: 0.4,
      anticipatePin: 1,
      onUpdate: (self) => {
        fill.style.height = `${(self.progress * 100).toFixed(2)}%`;
      },
    },
    onUpdate: () => {
      const f = Math.round(state.frame);
      frameLabel.textContent = String(f).padStart(3, '0');
      applyFrame(f);
      render();
    },
  });

  setUnresolved();
}
