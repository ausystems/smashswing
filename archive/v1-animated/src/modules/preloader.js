import gsap from 'gsap';
import { reduced, q } from '../utils.js';
import { getLenis } from './lenis.js';

export default function init({ onReveal = () => {} } = {}) {
  const el = q('#preloader');
  let visited = false;
  try { visited = !!sessionStorage.getItem('smashVisited'); sessionStorage.setItem('smashVisited', '1'); } catch (_) { /* private mode */ }

  if (reduced || visited) {
    el.classList.add('is-done');
    onReveal();
    return;
  }

  const html = document.documentElement;
  html.classList.add('is-loading');
  getLenis()?.stop();
  const count = q('#preloader-count');
  const fill = q('#preloader-fill');
  const state = { n: 0 };

  gsap.timeline({
    onComplete: () => { el.classList.add('is-done'); },
  })
    .to(state, { n: 100, duration: 1.4, ease: 'power2.inOut', onUpdate: () => { count.textContent = String(Math.round(state.n)).padStart(3, '0'); } }, 0)
    .to(fill, { scaleX: 1, duration: 1.4, ease: 'power2.inOut' }, 0)
    .add(() => { html.classList.remove('is-loading'); getLenis()?.start(); }, 1.58)
    .to(el, { clipPath: 'inset(0 0 100% 0)', duration: 0.9, ease: 'expo.out' }, 1.58)
    .add(onReveal, 1.58 + 0.5);
}
