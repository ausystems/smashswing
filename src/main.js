/* SmashSwing: the only script on the site.
   Tabs (the product toggle), the mobile menu, the photo carousel, the video pop-up, the forms, and the asset audit flag. */

const q = (s, r = document) => r.querySelector(s);
const qa = (s, r = document) => Array.from(r.querySelectorAll(s));
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// ---- tabs: swap in place, no transition
qa('[role="tablist"]').forEach((list) => {
  const tabs = qa('[role="tab"]', list);
  const panels = tabs.map((t) => document.getElementById(t.getAttribute('aria-controls')));
  const select = (i, focus = false) => {
    tabs.forEach((t, k) => {
      const on = k === i;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      if (panels[k]) {
        panels[k].hidden = !on;
        qa('video[autoplay], video[data-autoplay]', panels[k]).forEach((v) => { if (on) v.play().catch(() => {}); else v.pause(); });
      }
    });
    if (focus) tabs[i].focus();
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(i));
    t.addEventListener('keydown', (e) => {
      const map = { ArrowRight: (i + 1) % tabs.length, ArrowLeft: (i - 1 + tabs.length) % tabs.length, Home: 0, End: tabs.length - 1 };
      if (e.key in map) { e.preventDefault(); select(map[e.key], true); }
    });
  });
  // deep link: /products/#range selects the matching tab
  const hash = location.hash.replace('#', '');
  const idx = tabs.findIndex((t) => t.id.endsWith(hash) || (panels[tabs.indexOf(t)] && panels[tabs.indexOf(t)].querySelector(`#${CSS.escape(hash)}`)));
  if (hash && idx >= 0) select(idx);
});

// ---- clips that should play on sight: start when visible, pause when not (keeps page load light)
const lazyClips = qa('video[data-autoplay]');
if (lazyClips.length && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      const v = en.target;
      const panel = v.closest('[role="tabpanel"]');
      if (en.isIntersecting && !(panel && panel.hidden)) v.play().catch(() => {});
      else v.pause();
    });
  }, { rootMargin: '200px' });
  lazyClips.forEach((v) => io.observe(v));
}

// ---- mobile menu
const burger = q('#nav-burger');
const menu = q('#nav-menu');
if (burger && menu) {
  burger.addEventListener('click', () => {
    const open = burger.getAttribute('aria-expanded') !== 'true';
    burger.setAttribute('aria-expanded', String(open));
    menu.classList.toggle('is-open', open);
    document.documentElement.classList.toggle('menu-open', open);
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') burger.click(); });
}

// ---- photo carousel: swipe or scroll it, or use the arrows, dots and arrow keys.
// It moves on its own every few seconds while it is on screen, and stops while someone is using it.
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
qa('[data-gallery]').forEach((gal) => {
  const vp = q('.h-gal__viewport', gal);
  const track = q('.h-gal__track', gal);
  const slides = qa('.h-gal__slide', gal);
  const dotsWrap = q('.h-gal__dots', gal);
  const n = slides.length;
  if (!vp || !n) return;
  const behavior = reduceMotion ? 'auto' : 'smooth';
  const stepW = () => slides[0].getBoundingClientRect().width + (parseFloat(getComputedStyle(track).columnGap) || 0);
  const perView = () => Math.max(1, Math.round((vp.clientWidth + 1) / stepW()));
  const maxScroll = () => vp.scrollWidth - vp.clientWidth;
  let stops = 0;
  let dots = [];
  const current = () => {
    if (vp.scrollLeft >= maxScroll() - 2) return stops - 1;
    return Math.min(stops - 1, Math.round(vp.scrollLeft / stepW()));
  };
  const paint = () => { const c = current(); dots.forEach((d, j) => d.setAttribute('aria-current', String(j === c))); };
  const go = (k) => {
    const i = ((k % stops) + stops) % stops;
    vp.scrollTo({ left: i === stops - 1 ? maxScroll() : i * stepW(), behavior });
  };
  const build = () => {
    const next = n - perView() + 1;
    if (next === stops) return;
    stops = next;
    dotsWrap.textContent = '';
    dots = Array.from({ length: stops }, (_, k) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'h-gal__dot';
      b.setAttribute('aria-label', `Show photo ${k + 1} of ${n}`);
      b.addEventListener('click', () => { hold(); go(k); });
      dotsWrap.appendChild(b);
      return b;
    });
    paint();
  };

  // autoplay: only on screen, only when the tab is visible, never with reduced motion
  let pausedUntil = 0;
  let inView = false;
  let hovering = false;
  let stopped = reduceMotion;
  const hold = () => { pausedUntil = Date.now() + 8000; };
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'h-gal__toggle';
  const setToggle = () => {
    toggle.setAttribute('aria-label', stopped ? 'Play the photos' : 'Pause the photos');
    toggle.classList.toggle('is-paused', stopped);
  };
  toggle.addEventListener('click', () => { stopped = !stopped; setToggle(); });
  setToggle();
  if (!reduceMotion) dotsWrap.after(toggle);

  q('.h-gal__arrow--prev', gal).addEventListener('click', () => { hold(); go(current() - 1); });
  q('.h-gal__arrow--next', gal).addEventListener('click', () => { hold(); go(current() + 1); });
  vp.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); hold(); go(current() - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); hold(); go(current() + 1); }
  });
  ['pointerdown', 'wheel', 'touchstart'].forEach((t) => vp.addEventListener(t, hold, { passive: true }));
  gal.addEventListener('pointerenter', () => { hovering = true; });
  gal.addEventListener('pointerleave', () => { hovering = false; });
  let raf = 0;
  vp.addEventListener('scroll', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(paint); }, { passive: true });
  window.addEventListener('resize', () => { build(); paint(); });
  if ('IntersectionObserver' in window) new IntersectionObserver(([en]) => { inView = en.isIntersecting; }, { threshold: 0.4 }).observe(vp);
  setInterval(() => {
    if (stopped || !inView || hovering || document.hidden || Date.now() < pausedUntil || gal.contains(document.activeElement)) return;
    go(current() + 1);
  }, 3500);
  build();
});

// ---- video pop-up: buttons with data-video open the clip; closing the pop-up stops it
const BASE = import.meta.env.BASE_URL;
const VIDEOS = {
  overview: { title: 'SmashSwing system overview, with TJ Schier', embed: 'https://player.vimeo.com/video/1213445891?h=115773e909&autoplay=1&dnt=1', page: 'https://vimeo.com/1213445891/115773e909', site: 'Vimeo' },
  keynote: { title: 'TJ Schier keynote highlights', embed: 'https://player.vimeo.com/video/278068188?autoplay=1&dnt=1', page: 'https://vimeo.com/278068188', site: 'Vimeo' },
  workshop: { title: 'TJ Schier workshop', embed: 'https://www.youtube-nocookie.com/embed/vTVzdt5Xwp0?autoplay=1&rel=0', page: 'https://www.youtube.com/watch?v=vTVzdt5Xwp0', site: 'YouTube' },
  virtual: { title: 'First look: multiplayer virtual courses, coming 2027', file: `${BASE}video/virtual-courses.mp4` },
  teaser: { title: 'SmashSwing teaser reel', file: `${BASE}video/teaser-reel.mp4` },
  riverclub: { title: 'The River Club of Mequon, in their words', file: `${BASE}video/river-club.mp4` },
};
const dialog = q('#video-dialog');
if (dialog && typeof dialog.showModal === 'function') {
  const frame = q('.s-dialog__frame', dialog);
  const title = q('.s-dialog__title', dialog);
  const open = (key) => {
    const v = VIDEOS[key];
    if (!v) return;
    frame.textContent = '';
    let el;
    if (v.file) {
      el = document.createElement('video');
      el.controls = true;
      el.autoplay = true;
      el.playsInline = true;
      el.src = v.file;
    } else {
      el = document.createElement('iframe');
      el.src = v.embed;
      el.title = v.title;
      el.allow = 'autoplay; fullscreen; picture-in-picture';
      el.allowFullscreen = true;
    }
    frame.appendChild(el);
    title.textContent = '';
    const name = document.createElement('span');
    name.textContent = v.title;
    title.appendChild(name);
    // if the embedded player is blocked, the viewer can still watch it there
    if (v.page) {
      const a = document.createElement('a');
      a.href = v.page;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = `Open on ${v.site}`;
      title.appendChild(a);
    }
    dialog.setAttribute('aria-label', v.title);
    dialog.showModal();
  };
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-video]');
    if (b && VIDEOS[b.dataset.video]) { e.preventDefault(); open(b.dataset.video); }
  });
  q('[data-close-dialog]', dialog).addEventListener('click', () => dialog.close());
  // a click on the dark backdrop closes it too
  dialog.addEventListener('click', (e) => {
    const r = dialog.getBoundingClientRect();
    if (e.target === dialog && (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)) dialog.close();
  });
  dialog.addEventListener('close', () => { frame.textContent = ''; });
}

// ---- teaser email
const teaser = q('#teaser-form');
if (teaser) {
  const input = q('#teaser-email', teaser);
  teaser.addEventListener('submit', (e) => {
    e.preventDefault();
    const ok = EMAIL.test(input.value.trim());
    teaser.classList.toggle('is-error', !ok);
    input.setAttribute('aria-invalid', String(!ok));
    if (ok) { teaser.classList.remove('is-error'); teaser.classList.add('is-done'); }
    else input.focus();
  });
  input.addEventListener('input', () => { if (EMAIL.test(input.value.trim())) { teaser.classList.remove('is-error'); input.removeAttribute('aria-invalid'); } });
}

// ---- contact form: no server, so it opens an email to TJ with the details filled in
const form = q('#contact-form');
if (form) {
  const validate = (field) => {
    const input = q('.field__input', field);
    if (!input) return true;
    let ok = true;
    if (input.required && !input.value.trim()) ok = false;
    if (ok && input.type === 'email' && input.value && !EMAIL.test(input.value.trim())) ok = false;
    field.classList.toggle('is-error', !ok);
    input.setAttribute('aria-invalid', String(!ok));
    return ok;
  };
  qa('.field', form).forEach((f) => { const i = q('.field__input', f); i && i.addEventListener('input', () => f.classList.contains('is-error') && validate(f)); });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fields = qa('.field', form).filter((f) => q('.field__input', f));
    const bad = fields.filter((f) => !validate(f));
    if (bad.length) { q('.field__input', bad[0]).focus(); return; }
    const d = new FormData(form);
    const get = (k) => String(d.get(k) || '').trim();
    const body = [
      `Name: ${get('name')}`,
      `Email: ${get('email')}`,
      get('phone') && `Phone: ${get('phone')}`,
      `Venue or company: ${get('venue')}`,
      get('type') && `Venue type: ${get('type')}`,
      `Interested in: ${get('interest')}`,
      get('message') && `\n${get('message')}`,
    ].filter(Boolean).join('\n');
    const subject = `SmashSwing demo request: ${get('venue')}`;
    window.location.href = `mailto:tj@smashswing.golf?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    form.hidden = true;
    const done = q('#contact-done');
    done.hidden = false;
    done.setAttribute('tabindex', '-1');
    done.focus({ preventScroll: true });
  });
}

// ---- asset audit: ?debug=assets outlines every placeholder
if (new URLSearchParams(location.search).get('debug') === 'assets') document.documentElement.classList.add('debug-assets');
