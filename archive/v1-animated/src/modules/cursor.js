import gsap from 'gsap';
import { reduced, isTouch, q } from '../utils.js';

export default function init() {
  const el = q('#cursor');
  if (reduced || isTouch) { el.remove(); return; }

  const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const target = { x: pos.x, y: pos.y };
  let shown = false;
  const setX = gsap.quickSetter(el, 'x', 'px');
  const setY = gsap.quickSetter(el, 'y', 'px');

  window.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    target.x = e.clientX; target.y = e.clientY;
    if (!shown) { shown = true; pos.x = target.x; pos.y = target.y; gsap.to(el, { opacity: 1, duration: 0.24 }); }
  }, { passive: true });
  document.addEventListener('mouseleave', () => gsap.to(el, { opacity: 0, duration: 0.24 }));
  document.addEventListener('mouseenter', () => shown && gsap.to(el, { opacity: 1, duration: 0.24 }));

  gsap.ticker.add(() => {
    pos.x += (target.x - pos.x) * 0.16;
    pos.y += (target.y - pos.y) * 0.16;
    setX(pos.x); setY(pos.y);
  });

  // states
  const HOVER = 'a, button, [data-cursor]';
  let mode = 'idle';
  const apply = (next) => {
    if (next === mode) return;
    mode = next;
    el.classList.toggle('is-drag', next === 'drag');
    if (next === 'drag') gsap.to(el, { width: 44, height: 44, margin: -22, scale: 1, opacity: 1, duration: 0.24, ease: 'expo.out' });
    else if (next === 'hover') gsap.to(el, { width: 10, height: 10, margin: -5, scale: 2.6, opacity: 0.4, duration: 0.24, ease: 'expo.out' });
    else gsap.to(el, { width: 10, height: 10, margin: -5, scale: 1, opacity: 1, duration: 0.24, ease: 'expo.out' });
  };
  document.addEventListener('pointerover', (e) => {
    const t = e.target.closest(HOVER);
    if (!t) return apply('idle');
    apply(t.dataset.cursor === 'drag' ? 'drag' : 'hover');
  });
  document.addEventListener('pointerout', (e) => {
    const from = e.target.closest(HOVER);
    const to = e.relatedTarget && e.relatedTarget.closest ? e.relatedTarget.closest(HOVER) : null;
    if (from && !to) apply('idle');
  });
}
