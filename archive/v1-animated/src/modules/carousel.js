import gsap from 'gsap';
import { Observer } from 'gsap/Observer';
import { reduced, q, qa, reveal, debounce } from '../utils.js';

export default function init() {
  const root = q('#fc');
  if (!root) return;
  const viewport = q('#fc-viewport');
  const track = q('#fc-track');
  const cards = qa('.fcard', track);
  const prev = q('#fc-prev');
  const next = q('#fc-next');
  const fill = q('#fc-rail-fill');
  const GAP = 20;

  const state = { x: 0 };
  let step = 0, minX = 0, snaps = [0], index = 0, target = 0;

  const measure = () => {
    const cardW = cards[0].getBoundingClientRect().width;
    step = cardW + GAP;
    const padLeft = parseFloat(getComputedStyle(viewport).paddingLeft) || 0;
    const visible = viewport.clientWidth - padLeft;
    const total = cards.length * cardW + (cards.length - 1) * GAP;
    minX = Math.min(0, visible - total);
    snaps = [];
    for (let i = 0; i < cards.length; i++) {
      const x = -i * step;
      if (x <= minX) { snaps.push(minX); break; }
      snaps.push(x);
    }
    state.x = gsap.utils.clamp(minX, 0, state.x);
    apply();
  };

  const apply = () => {
    gsap.set(track, { x: state.x });
    const p = minX === 0 ? 0 : state.x / minX;
    fill.style.width = `${(p * 100).toFixed(2)}%`;
    index = nearestIndex(state.x);
    prev.disabled = state.x >= -1;
    next.disabled = state.x <= minX + 1;
  };

  const nearestIndex = (x) => {
    let best = 0, bd = Infinity;
    snaps.forEach((s, i) => { const d = Math.abs(s - x); if (d < bd) { bd = d; best = i; } });
    return best;
  };

  const snapTo = (i, { duration = 0.6 } = {}) => {
    i = gsap.utils.clamp(0, snaps.length - 1, i);
    target = i;
    gsap.killTweensOf(state);
    gsap.to(state, { x: snaps[i], duration: reduced ? 0 : duration, ease: 'expo.out', onUpdate: apply, overwrite: true });
  };

  // drag with inertia
  Observer.create({
    target: track,
    type: 'touch,pointer',
    dragMinimum: 3,
    lockAxis: true,
    onPress: () => { gsap.killTweensOf(state); target = index; },
    onDragStart: () => { track.classList.add('is-dragging'); },
    onDrag: (self) => {
      if (self.axis === 'y') return;
      let nx = state.x + self.deltaX;
      if (nx > 0) nx = nx * 0.35;
      if (nx < minX) nx = minX + (nx - minX) * 0.35;
      state.x = nx;
      apply();
    },
    onDragEnd: (self) => {
      track.classList.remove('is-dragging');
      if (self.axis === 'y') return;
      const projected = state.x + self.velocityX * 0.22;
      snapTo(nearestIndex(gsap.utils.clamp(minX, 0, projected)));
    },
  });

  // horizontal wheel / trackpad
  track.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    e.preventDefault();
    gsap.killTweensOf(state);
    state.x = gsap.utils.clamp(minX, 0, state.x - e.deltaX);
    apply();
    target = index;
    wheelSettle();
  }, { passive: false });
  const wheelSettle = debounce(() => snapTo(nearestIndex(state.x)), 120);

  // keyboard
  track.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); snapTo(target + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); snapTo(target - 1); }
    if (e.key === 'Home') { e.preventDefault(); snapTo(0); }
    if (e.key === 'End') { e.preventDefault(); snapTo(snaps.length - 1); }
  });
  prev.addEventListener('click', () => snapTo(target - 1));
  next.addEventListener('click', () => snapTo(target + 1));
  // never let a drag start a native image drag
  track.addEventListener('dragstart', (e) => e.preventDefault());

  measure();
  window.addEventListener('resize', debounce(measure, 250));

  // entrance
  reveal(cards, { stagger: 0.06, trigger: root, start: 'top 80%' });
  reveal(qa('.fc__rail, .fc__controls', root), { trigger: q('.fc__rail', root), start: 'top 92%' });
}
