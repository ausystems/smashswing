import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { reduced, qa } from '../utils.js';

let lenis = null;
export const getLenis = () => lenis;

export default function init() {
  if (reduced) return null;
  lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 1, smoothTouch: false, syncTouch: false, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  document.documentElement.classList.add('lenis');

  qa('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: 0, duration: 1.4 });
    });
  });
  return lenis;
}
