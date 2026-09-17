import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { reduced, qa, debounce } from '../utils.js';

/**
 * One engine for both marquee bands. Tracks are duplicated once and driven
 * by a wrapped x position so speed and direction can be modulated live.
 */
export default function init() {
  const rows = qa('.marquee__row');
  if (!rows.length) return;

  const state = { factor: 1, dir: 1 };
  const units = rows.map(buildRow);

  if (reduced) return;

  // scroll-velocity coupling + direction
  let settle;
  ScrollTrigger.create({
    onUpdate: (self) => {
      const v = self.getVelocity();
      state.dir = self.direction < 0 ? -1 : 1;
      const target = gsap.utils.clamp(1, 4.5, 1 + Math.abs(v) / 900);
      if (target > state.factor) state.factor = target;
      settle && settle.kill();
      settle = gsap.to(state, { factor: 1, duration: 0.8, ease: 'power2.out', delay: 0.05, overwrite: true });
    },
  });

  gsap.ticker.add((_, dt) => {
    const s = dt / 1000;
    for (const u of units) {
      if (!u.active) continue;
      u.pos += u.dir * state.dir * u.speed * state.factor * s;
      u.pos = gsap.utils.wrap(-u.loop, 0, u.pos);
      u.set(u.pos);
    }
  });

  window.addEventListener('resize', debounce(() => units.forEach((u) => u.measure()), 250));
}

function buildRow(row) {
  const track = row.querySelector('.marquee__track');
  const templates = Array.from(track.children).map((n) => n.cloneNode(true));
  const unit = {
    row, track, templates, pos: 0, loop: 0, active: false,
    dir: Number(row.dataset.dir) || -1,
    speed: Number(row.dataset.speed) || 50,
    set: gsap.quickSetter(track, 'x', 'px'),
    measure() {
      // fill one set to > 2x viewport, then duplicate the set so the wrap is seamless
      track.innerHTML = '';
      const set = document.createElement('div');
      set.className = 'marquee__set';
      set.style.display = 'flex';
      set.style.flex = 'none';
      track.appendChild(set);
      const min = window.innerWidth * 2;
      let guard = 0;
      while (set.getBoundingClientRect().width < min && guard++ < 60) {
        templates.forEach((t) => set.appendChild(t.cloneNode(true)));
      }
      this.loop = set.getBoundingClientRect().width;
      track.appendChild(set.cloneNode(true));
      this.speed = (Number(row.dataset.speed) || 50) * (window.innerWidth < 768 ? 0.8 : 1);
      this.pos = gsap.utils.wrap(-this.loop, 0, this.pos);
      this.set(this.pos);
    },
  };
  unit.measure();
  if (!reduced) {
    ScrollTrigger.create({ trigger: row, start: 'top bottom', end: 'bottom top', onToggle: (self) => { unit.active = self.isActive; } });
  }
  return unit;
}
