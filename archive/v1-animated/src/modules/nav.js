import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { reduced, q, qa } from '../utils.js';
import { getLenis } from './lenis.js';

export default function init() {
  const nav = q('#nav');
  const burger = q('#nav-burger');
  const menu = q('#nav-menu');

  // scrolled state after 92vh
  ScrollTrigger.create({
    start: () => window.innerHeight * 0.92,
    end: 'max',
    onToggle: (self) => nav.classList.toggle('is-scrolled', self.isActive),
    onRefresh: (self) => nav.classList.toggle('is-scrolled', self.isActive),
  });

  // theme flip — probe the band under the nav on every scroll update. Class toggles only, no tweens.
  const bands = qa('[data-theme="dark"]').filter((el) => !el.classList.contains('grid-lines'));
  const theme = () => {
    const y = 38;
    const dark = bands.some((b) => { const r = b.getBoundingClientRect(); return r.top <= y && r.bottom > y; });
    const next = dark ? 'dark' : 'light';
    if (nav.getAttribute('data-nav-theme') !== next) nav.setAttribute('data-nav-theme', next);
  };
  ScrollTrigger.create({ onUpdate: theme, onRefresh: theme });
  theme();

  // mobile menu
  const links = qa('.menu__links .line__in');
  const cta = q('.menu__cta');
  let open = false;
  const tl = gsap.timeline({ paused: true });
  if (!reduced) {
    tl.fromTo(menu, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 0.6, ease: 'expo.out' }, 0)
      .fromTo(links, { yPercent: 108 }, { yPercent: 0, duration: 0.8, ease: 'expo.out', stagger: 0.07 }, 0.15)
      .fromTo(cta, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, ease: 'expo.out' }, 0.35);
  } else {
    tl.fromTo(menu, { opacity: 0 }, { opacity: 1, duration: 0.2 }, 0);
  }

  const setOpen = (v) => {
    open = v;
    burger.setAttribute('aria-expanded', String(v));
    menu.setAttribute('aria-hidden', String(!v));
    nav.classList.toggle('is-open', v);
    if (v) {
      menu.classList.add('is-open');
      getLenis()?.stop();
      document.documentElement.classList.add('is-loading');
      tl.timeScale(1).play(0);
    } else {
      tl.timeScale(1.8).reverse();
      tl.eventCallback('onReverseComplete', () => { menu.classList.remove('is-open'); tl.eventCallback('onReverseComplete', null); });
      getLenis()?.start();
      document.documentElement.classList.remove('is-loading');
    }
  };
  burger.addEventListener('click', () => setOpen(!open));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) setOpen(false); });
  qa('a', menu).forEach((a) => a.addEventListener('click', () => open && setOpen(false)));
  window.matchMedia('(min-width: 1024px)').addEventListener('change', (e) => { if (e.matches && open) setOpen(false); });
}
