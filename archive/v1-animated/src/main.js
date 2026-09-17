import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Observer } from 'gsap/Observer';
import { CustomEase } from 'gsap/CustomEase';

import initLenis from './modules/lenis.js';
import initPreloader from './modules/preloader.js';
import initNav from './modules/nav.js';
import initHero from './modules/hero.js';
import initMarquee from './modules/marquee.js';
import initStatement from './modules/statement.js';
import initContact from './modules/contact-sequence.js';
import initCarousel from './modules/carousel.js';
import initProductToggle from './modules/product-toggle.js';
import initFounder from './modules/founder.js';
import initTeaser from './modules/teaser.js';
import initFacilities from './modules/facilities.js';
import initCursor from './modules/cursor.js';
import initReveal from './modules/reveal.js';

gsap.registerPlugin(ScrollTrigger, Observer, CustomEase);
ScrollTrigger.config({ ignoreMobileResize: true });

async function boot() {
  await document.fonts.ready;
  document.documentElement.classList.add('is-ready');

  initLenis();
  initNav();
  const hero = initHero();
  initMarquee();
  initStatement();
  initContact();
  initCarousel();
  initProductToggle();
  initFounder();
  initTeaser();
  initFacilities();
  initReveal();
  initCursor();
  // last, so it is never load-bearing
  initPreloader({ onReveal: () => hero.play() });

  window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
