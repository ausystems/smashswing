import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SplitType from 'split-type';
import { reduced, q, qa, reveal, revealLines, debounce } from '../utils.js';

/**
 * Page-wide behaviours: grid overlay theme flip + G key, ?debug=assets,
 * generic headline reveals, lazy video, footer wordmark, content-visibility refresh.
 */
export default function init() {
  gridOverlay();
  debugAssets();
  headlines();
  splitQuotes();
  lazyVideo();
  footerMark();
  closeSection();
  cvRefresh();
}

function gridOverlay() {
  const grid = q('#grid-lines');
  const bands = qa('[data-theme="dark"]').filter((el) => el !== grid);
  // read the real rects on every update: pin-safe, content-visibility-safe, never flickers
  const compute = () => {
    const y = window.innerHeight / 2;
    const dark = bands.some((b) => { const r = b.getBoundingClientRect(); return r.top <= y && r.bottom > y; });
    grid.setAttribute('data-theme', dark ? 'dark' : 'light');
  };
  ScrollTrigger.create({ onUpdate: compute, onRefresh: compute });
  compute();
  window.addEventListener('keydown', (e) => {
    if ((e.key === 'g' || e.key === 'G') && !e.metaKey && !e.ctrlKey && !e.altKey && !/input|textarea/i.test(document.activeElement?.tagName || '')) {
      grid.classList.toggle('is-hi');
    }
  });
}

function debugAssets() {
  if (new URLSearchParams(location.search).get('debug') === 'assets') document.documentElement.classList.add('debug-assets');
}

function headlines() {
  qa('[data-lines]').forEach((h) => revealLines(h));
}

/** Natural-wrapping copy is split by SplitType and re-split on resize. */
function splitQuotes() {
  const targets = qa('[data-split]');
  if (!targets.length) return;
  const build = (el) => {
    const p = el.querySelector('p') || el;
    if (p._split) p._split.revert();
    p._split = new SplitType(p, { types: 'lines', lineClass: 'line' });
    qa('.line', p).forEach((line) => {
      const inner = document.createElement('span');
      inner.className = 'line__in';
      while (line.firstChild) inner.appendChild(line.firstChild);
      line.appendChild(inner);
    });
    return p;
  };
  targets.forEach((el) => {
    const p = build(el);
    revealLines(p, { start: 'top 85%' });
    if (!reduced) {
      window.addEventListener('resize', debounce(() => {
        // once revealed, a re-split only needs to keep the text intact
        const done = ScrollTrigger.getAll().some((t) => t.trigger === p && t.progress === 1);
        const np = build(el);
        if (done) gsap.set(qa('.line__in', np), { yPercent: 0 });
        else revealLines(np, { start: 'top 85%' });
      }, 250));
    }
  });
}

/** Every non-hero video: sources attached and played at rootMargin 250px, paused when gone. */
function lazyVideo() {
  const videos = qa('video[preload="none"]').filter((v) => !v.closest('.lightbox'));
  const attach = (v) => {
    if (v.dataset.ready) return;
    qa('source[data-src]', v).forEach((s) => { s.src = s.dataset.src; });
    v.load();
    v.dataset.ready = '1';
  };
  if (reduced) {
    document.documentElement.classList.add('is-reduced');
    videos.forEach((v) => {
      attach(v);
      // no control for hidden or purely atmospheric loops (the close plate sits under the CTA)
      if (getComputedStyle(v).display === 'none' || v.closest('[data-no-control]')) return;
      const btn = document.createElement('button');
      btn.className = 'vplay';
      btn.type = 'button';
      btn.setAttribute('aria-label', 'Play video');
      btn.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2l10 6-10 6z" fill="currentColor"/></svg>';
      v.parentElement.appendChild(btn);
      btn.addEventListener('click', () => {
        if (v.paused) { v.play(); btn.classList.add('is-playing'); btn.setAttribute('aria-label', 'Pause video'); }
        else { v.pause(); btn.classList.remove('is-playing'); btn.setAttribute('aria-label', 'Play video'); }
      });
    });
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      const v = en.target;
      if (en.isIntersecting) {
        attach(v);
        // product videos: only the active one plays
        if (v.classList.contains('pt__video') && !v.classList.contains('is-active')) return;
        v.play().catch(() => {});
      } else {
        v.pause();
      }
    });
  }, { rootMargin: '250px' });
  videos.forEach((v) => io.observe(v));
}

function footerMark() {
  const mark = q('#footer-mark');
  if (!mark) return;
  const fit = () => {
    const base = window.innerWidth < 768 ? 30 : 22;
    mark.style.fontSize = `${base}vw`;
    const w = mark.scrollWidth;
    const target = mark.clientWidth;
    if (w > 0) mark.style.fontSize = `${(base * target) / w}vw`;
  };
  fit();
  window.addEventListener('resize', debounce(fit, 250));
  if (reduced) return;
  gsap.fromTo(mark, { scaleY: 0.88 }, { scaleY: 1, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: q('#footer'), start: 'bottom 98%', once: true } });
  reveal(qa('.footer__line, .footer__col'), { trigger: q('.footer__grid'), start: 'top 90%', stagger: 0.06 });
}

function closeSection() {
  const s = q('#close');
  if (!s) return;
  reveal(qa('.close__body, .close__cta, .close__address'), { trigger: s, start: 'top 60%', stagger: 0.08 });
}

/** content-visibility: auto sections resize when they render; keep ScrollTrigger honest. */
function cvRefresh() {
  const refresh = debounce(() => ScrollTrigger.refresh(), 120);
  qa('.cv-auto').forEach((el) => el.addEventListener('contentvisibilityautostatechange', (e) => { if (!e.skipped) refresh(); }));
}
