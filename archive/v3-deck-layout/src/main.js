/* SmashSwing — the only script on the site.
   Mobile menu, the photo carousel, click-to-play videos, the "Watch the video" pop-up,
   clips that play when seen, and the contact form. */

const q = (s, r = document) => r.querySelector(s);
const qa = (s, r = document) => Array.from(r.querySelectorAll(s));
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---- mobile menu (the header is sticky, so it opens in place)
const burger = q('#nav-burger');
const menu = q('#nav-menu');
if (burger && menu) {
  const setOpen = (open) => {
    burger.setAttribute('aria-expanded', String(open));
    menu.classList.toggle('is-open', open);
    document.documentElement.classList.toggle('menu-open', open);
  };
  burger.addEventListener('click', () => setOpen(burger.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') { setOpen(false); burger.focus(); } });
  qa('a', menu).forEach((a) => a.addEventListener('click', () => setOpen(false)));
  window.matchMedia('(min-width: 1180px)').addEventListener('change', (e) => { if (e.matches) setOpen(false); });
}

// ---- short clips: play while on screen, pause when not (keeps pages light)
const clips = qa('video[data-autoplay]');
if (clips.length && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      const v = en.target;
      if (en.isIntersecting && !reduceMotion) { v.play().catch(() => {}); } else { v.pause(); }
    });
  }, { rootMargin: '150px' });
  clips.forEach((v) => io.observe(v));
}

// ---- photo carousel: swipe, scroll, arrows, dots, keyboard, and it moves on its own
qa('[data-gallery]').forEach((gal) => {
  const viewport = q('.h-gal__viewport', gal);
  const slides = qa('.h-gal__slide', gal);
  const dotsWrap = q('.h-gal__dots', gal);
  if (!viewport || !slides.length) return;
  const step = () => slides[0].getBoundingClientRect().width + parseFloat(getComputedStyle(q('.h-gal__track', gal)).columnGap || 10);
  const maxIndex = () => Math.max(0, Math.round((viewport.scrollWidth - viewport.clientWidth) / step()));
  const current = () => Math.round(viewport.scrollLeft / step());
  const go = (i) => {
    const last = maxIndex();
    const n = i > last ? 0 : i < 0 ? last : i;
    viewport.scrollTo({ left: n * step(), behavior: reduceMotion ? 'auto' : 'smooth' });
  };
  const dots = slides.map((_, k) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'h-gal__dot';
    b.setAttribute('aria-label', `Show photo ${k + 1} of ${slides.length}`);
    b.addEventListener('click', () => { go(k); pause(); });
    dotsWrap.appendChild(b);
    return b;
  });
  const sync = () => { const c = Math.min(current(), slides.length - 1); dots.forEach((d, j) => d.setAttribute('aria-current', String(j === c))); };
  let raf = 0;
  viewport.addEventListener('scroll', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(sync); }, { passive: true });
  q('.h-gal__arrow--prev', gal)?.addEventListener('click', () => { go(current() - 1); pause(); });
  q('.h-gal__arrow--next', gal)?.addEventListener('click', () => { go(current() + 1); pause(); });
  viewport.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(current() - 1); pause(); }
    if (e.key === 'ArrowRight') { e.preventDefault(); go(current() + 1); pause(); }
  });
  // autoplay: every 3.5 s while visible, stops for good once someone takes control
  let timer = 0, visible = false, hovering = false, stopped = reduceMotion;
  const tick = () => { if (visible && !hovering && !stopped && !document.hidden) go(current() + 1); };
  const pause = () => { stopped = true; clearInterval(timer); };
  if (!stopped) timer = setInterval(tick, 3500);
  gal.addEventListener('mouseenter', () => { hovering = true; });
  gal.addEventListener('mouseleave', () => { hovering = false; });
  gal.addEventListener('focusin', () => { hovering = true; });
  gal.addEventListener('focusout', () => { hovering = false; });
  viewport.addEventListener('pointerdown', pause, { passive: true });
  viewport.addEventListener('touchstart', pause, { passive: true });
  if ('IntersectionObserver' in window) new IntersectionObserver(([en]) => { visible = en.isIntersecting; }, { threshold: 0.4 }).observe(gal);
  else visible = true;
  sync();
});

// ---- click-to-play embeds (Vimeo / YouTube load only when asked)
qa('[data-embed]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const { embed, id, h } = btn.dataset;
    const src = embed === 'vimeo'
      ? `https://player.vimeo.com/video/${id}?${h ? `h=${h}&` : ''}autoplay=1&dnt=1&title=0&byline=0&portrait=0`
      : `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`;
    const f = document.createElement('iframe');
    f.src = src;
    f.title = btn.getAttribute('aria-label') || 'Video';
    f.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media';
    f.allowFullscreen = true;
    btn.replaceWith(f);
  });
});

// ---- "Watch the video" pop-up
qa('[data-open-video]').forEach((btn) => {
  const dlg = document.getElementById(btn.dataset.openVideo);
  if (!dlg || typeof dlg.showModal !== 'function') return;
  const vid = q('video', dlg);
  const close = () => { vid?.pause(); dlg.close(); };
  btn.addEventListener('click', () => { dlg.showModal(); vid?.play().catch(() => {}); });
  q('[data-close-dialog]', dlg)?.addEventListener('click', close);
  dlg.addEventListener('click', (e) => { if (e.target === dlg) close(); });
  dlg.addEventListener('close', () => vid?.pause());
});

// ---- contact form: checks the fields, then opens an email to TJ with the note filled in
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
    const lines = [
      `Name: ${d.get('name')}`, `Email: ${d.get('email')}`, d.get('phone') ? `Phone: ${d.get('phone')}` : null,
      `Venue or company: ${d.get('venue')}`, d.get('type') ? `Type of venue: ${d.get('type')}` : null,
      `Interested in: ${d.get('interest')}`, '', d.get('message') || '',
    ].filter((l) => l !== null);
    const subject = `SmashSwing demo request: ${d.get('venue')}`;
    window.location.href = `mailto:tj@smashswing.golf?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
    form.hidden = true;
    const done = q('#contact-done');
    done.hidden = false;
    done.setAttribute('tabindex', '-1');
    done.focus({ preventScroll: true });
  });
}

// ---- asset audit: ?debug=assets outlines every placeholder
if (new URLSearchParams(location.search).get('debug') === 'assets') document.documentElement.classList.add('debug-assets');
