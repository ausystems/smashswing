import gsap from 'gsap';
import { reduced, q, qa, reveal, revealLines } from '../utils.js';
import { getLenis } from './lenis.js';

export default function init() {
  const media = q('#founder-media');
  if (!media) return;
  const play = q('#founder-play');
  const box = q('#lightbox');
  const close = q('#lightbox-close');
  const video = q('#lightbox-video');
  const src = media.dataset.videoSrc;

  if (src) {
    play.disabled = false;
    play.removeAttribute('aria-disabled');
    media.removeAttribute('data-placeholder');
    q('.founder__note', media)?.remove();
    video.src = src;
  }

  let open = false;
  let lastFocus = null;
  const setOpen = (v) => {
    open = v;
    box.setAttribute('aria-hidden', String(!v));
    if (v) {
      lastFocus = document.activeElement;
      box.classList.add('is-open');
      getLenis()?.stop();
      document.documentElement.classList.add('is-loading');
      video.controls = true;
      gsap.timeline()
        .fromTo(box, { opacity: 0 }, { opacity: 1, duration: reduced ? 0.2 : 0.32, ease: 'power2.out' }, 0)
        .fromTo(video, { scale: reduced ? 1 : 0.94 }, { scale: 1, duration: 0.5, ease: 'expo.out' }, 0);
      video.play().catch(() => {});
      close.focus();
    } else {
      video.pause();
      gsap.to(box, { opacity: 0, duration: reduced ? 0.2 : 0.32, onComplete: () => box.classList.remove('is-open') });
      getLenis()?.start();
      document.documentElement.classList.remove('is-loading');
      lastFocus?.focus();
    }
  };
  play.addEventListener('click', () => { if (!play.disabled) setOpen(true); });
  close.addEventListener('click', () => setOpen(false));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) setOpen(false); });
  box.addEventListener('click', (e) => { if (e.target === box) setOpen(false); });

  // entrance
  reveal([media], { start: 'top 80%' });
  reveal(qa('.founder__attr, .founder__thumb'), { trigger: q('.founder__text'), start: 'top 80%', stagger: 0.08 });
}
