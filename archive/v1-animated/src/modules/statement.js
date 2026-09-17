import gsap from 'gsap';
import { reduced, q, lineInners } from '../utils.js';

export default function init() {
  const section = q('#statement');
  if (!section) return;
  const one = lineInners(q('#statement-h'));
  const two = lineInners(q('#statement-two'));
  const rule = q('#statement-rule');
  const note = q('#statement-note');

  if (reduced) return;

  gsap.set([...one, ...two], { yPercent: 108 });
  gsap.set(rule, { scaleX: 0 });
  gsap.set(note, { opacity: 0, y: 10 });

  gsap.timeline({ scrollTrigger: { trigger: section, start: 'top 62%', once: true } })
    .to(one, { yPercent: 0, duration: 1.05, ease: 'expo.out', stagger: 0.075 }, 0)
    // 0.55 hold — the pause is the section
    .to(rule, { scaleX: 1, duration: 0.9, ease: 'expo.out' }, 0.85)
    .to(two, { yPercent: 0, duration: 1.05, ease: 'expo.out', stagger: 0.075 }, 1.15)
    .to(note, { opacity: 1, y: 0, duration: 0.8, ease: 'expo.out' }, 1.60);
}
