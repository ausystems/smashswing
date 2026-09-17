import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { reduced, q, reveal, revealLines } from '../utils.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function init() {
  const section = q('#teaser');
  if (!section) return;
  const form = q('#teaser-form');
  const row = q('#teaser-row');
  const input = q('#teaser-email');
  const error = q('#teaser-error');
  const done = q('#teaser-done');
  const still = q('#teaser-still');

  // 48s horizontal drift on the blurred still
  if (!reduced && still) {
    gsap.fromTo(still.parentElement, { xPercent: 0 }, { xPercent: -6, duration: 48, ease: 'none', repeat: -1, yoyo: true });
  }

  let flashing = false;
  const fail = () => {
    error.hidden = false;
    input.setAttribute('aria-invalid', 'true');
    input.setAttribute('aria-describedby', 'teaser-error');
    if (flashing) return;
    flashing = true;
    row.classList.add('is-error');
    setTimeout(() => { row.classList.remove('is-error'); flashing = false; }, 480);
  };
  input.addEventListener('input', () => {
    if (!error.hidden && EMAIL.test(input.value.trim())) { error.hidden = true; input.removeAttribute('aria-invalid'); }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const value = input.value.trim();
    if (!EMAIL.test(value)) { fail(); input.focus(); return; }
    error.hidden = true;
    input.removeAttribute('aria-invalid');
    done.hidden = false;
    if (reduced) {
      row.style.visibility = 'hidden';
      gsap.fromTo(done, { opacity: 0 }, { opacity: 1, duration: 0.2 });
      return;
    }
    gsap.timeline()
      .to(row, { clipPath: 'inset(0 0 100% 0)', duration: 0.32, ease: 'power2.in', onComplete: () => { row.style.visibility = 'hidden'; } }, 0)
      .fromTo(done, { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 0.32, ease: 'expo.out' }, 0.16);
    done.setAttribute('tabindex', '-1');
    done.focus({ preventScroll: true });
  });

  revealLines(q('#teaser-h'), { start: 'top 80%' });
  reveal([q('.teaser__body'), form], { trigger: section, start: 'top 60%', stagger: 0.1 });
}
