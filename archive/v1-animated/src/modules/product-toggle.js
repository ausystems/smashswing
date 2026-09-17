import gsap from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { reduced, q, qa, fireDot, reveal, revealLines } from '../utils.js';

export default function init() {
  const switchEl = q('#pt-switch');
  if (!switchEl) return;
  const tabs = qa('.pt__tab', switchEl);
  const thumb = q('#pt-thumb');
  const dot = q('#pt-dot');
  const videos = qa('.pt__video');
  const states = qa('.pt__state');
  const inout = CustomEase.create('smashInOut', '0.76,0,0.24,1');
  let current = 0;
  let busy = false;

  const playVideo = (i) => videos.forEach((v, k) => {
    if (k === i) { if (v.dataset.ready) v.play().catch(() => {}); } else v.pause();
  });

  const select = (i, { focus = false } = {}) => {
    if (i === current || busy) return;
    const out = states[current];
    const inn = states[i];
    tabs.forEach((t, k) => {
      t.setAttribute('aria-selected', String(k === i));
      t.tabIndex = k === i ? 0 : -1;
    });
    if (focus) tabs[i].focus();

    const headline = q('.pt__headline', inn);
    const body = q('.pt__body', inn);
    const rowsIn = qa('.pt__row', inn);
    const link = q('.pt__link', inn);
    const prevIndex = current;
    current = i;

    if (reduced) {
      out.classList.remove('is-active'); out.inert = true;
      inn.classList.add('is-active'); inn.inert = false;
      gsap.set(thumb, { xPercent: i * 100 });
      videos[prevIndex].classList.remove('is-active'); videos[i].classList.add('is-active');
      playVideo(i);
      return;
    }

    busy = true;
    gsap.to(thumb, { xPercent: i * 100, duration: 0.44, ease: inout });
    const tl = gsap.timeline({ onComplete: () => { busy = false; } });
    tl.to(out, { clipPath: 'inset(0 0 100% 0)', duration: 0.2, ease: 'power2.in' }, 0)
      .to(videos[prevIndex], { opacity: 0, duration: 0.42, ease: 'none' }, 0)
      .to(videos[i], { opacity: 1, duration: 0.42, ease: 'none', onStart: () => { videos[i].classList.add('is-active'); playVideo(i); } }, 0)
      .add(() => { out.classList.remove('is-active'); out.inert = true; videos[prevIndex].classList.remove('is-active'); }, 0.2)
      .set(out, { clipPath: 'inset(0 0 0% 0)' }, 0.2)
      .set(inn, { clipPath: 'inset(0 0 0% 0)' }, 0.2)
      .add(() => { inn.classList.add('is-active'); inn.inert = false; }, 0.2)
      .fromTo(headline, { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 0.32, ease: 'expo.out' }, 0.20)
      .fromTo(body, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.3, ease: 'expo.out' }, 0.28)
      .fromTo(rowsIn, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.3, ease: 'expo.out', stagger: 0.04 }, 0.34)
      .fromTo(link, { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0.46)
      .add(() => {
        gsap.set(dot, { left: `${i === 0 ? 25 : 75}%`, top: '50%' });
        fireDot(dot, { peak: 1.35, duration: 0.42, live: false });
        gsap.to(dot, { opacity: 0, duration: 0.4, delay: 0.9, onComplete: () => gsap.set(dot, { scale: 0, opacity: 1 }) });
      }, 0.44);
  };

  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(i));
    t.addEventListener('keydown', (e) => {
      const map = { ArrowRight: (i + 1) % tabs.length, ArrowLeft: (i - 1 + tabs.length) % tabs.length, Home: 0, End: tabs.length - 1 };
      if (e.key in map) { e.preventDefault(); select(map[e.key], { focus: true }); }
    });
  });

  // entrance
  reveal([switchEl], { start: 'top 85%' });
  revealLines(q('.pt__headline', states[0]), { start: 'top 88%' });
  reveal(qa('.pt__media, .pt__body, .pt__specs, .pt__link', states[0].parentElement.parentElement), { trigger: q('.pt__panel'), start: 'top 78%', stagger: 0.08 });
}
