/* SmashSwing — the only script on the site. No animation, no scroll effects.
   Tabs (the product toggle), the mobile menu, the photo gallery, the forms, and the asset audit flag. */

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
    // the header is not sticky, so open the menu from the top of the page
    if (open) window.scrollTo(0, 0);
    burger.setAttribute('aria-expanded', String(open));
    menu.classList.toggle('is-open', open);
    document.documentElement.classList.toggle('menu-open', open);
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') burger.click(); });
}

// ---- photo gallery: steps instantly, loops, arrows + dots + arrow keys
qa('[data-gallery]').forEach((gal) => {
  const slides = qa('.h-gal__slide', gal);
  const dotsWrap = q('.h-gal__dots', gal);
  const n = slides.length;
  if (!n) return;
  let current = 0;
  const dots = slides.map((_, k) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'h-gal__dot';
    b.setAttribute('aria-label', `Show photo ${k + 1} of ${n}`);
    dotsWrap.appendChild(b);
    return b;
  });
  const go = (k) => {
    current = (k + n) % n;
    slides.forEach((s, j) => { s.style.order = String((j - current + n) % n); });
    dots.forEach((d, j) => d.setAttribute('aria-current', String(j === current)));
  };
  dots.forEach((d, k) => d.addEventListener('click', () => go(k)));
  q('.h-gal__arrow--prev', gal).addEventListener('click', () => go(current - 1));
  q('.h-gal__arrow--next', gal).addEventListener('click', () => go(current + 1));
  gal.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(current - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); go(current + 1); }
  });
  go(0);
});

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

// ---- contact form: client-side only for the preview
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
    form.hidden = true;
    const done = q('#contact-done');
    done.hidden = false;
    done.setAttribute('tabindex', '-1');
    done.focus({ preventScroll: true });
  });
}

// ---- asset audit: ?debug=assets outlines every placeholder
if (new URLSearchParams(location.search).get('debug') === 'assets') document.documentElement.classList.add('debug-assets');
