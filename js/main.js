/* The Times of Palestine: front-end behaviour.
   One file, no dependencies, loaded with `defer` on every page. Each part looks
   for its own markup and does nothing when the page does not have it. */
(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const header = $('.site-header');

  /* ── Time: the newsroom keeps Palestine time ───────────────────────────── */
  const inPalestine = (options) => new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Hebron', ...options });
  const hourMinute = inPalestine({ hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const dayLong = inPalestine({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const dayShort = inPalestine({ weekday: 'short', day: 'numeric', month: 'short' });
  const noCommas = (text) => text.replace(/,/g, '');

  function updateClock() {
    const now = new Date();
    $$('[data-now]').forEach((el) => {
      el.dateTime = now.toISOString();
      const long = $('.hdr__date-long', el);
      const short = $('.hdr__date-short', el);
      if (long) long.textContent = noCommas(dayLong.format(now));
      if (short) short.textContent = noCommas(dayShort.format(now));
    });
    $$('[data-clock]').forEach((el) => { el.textContent = hourMinute.format(now); });
    setTimeout(updateClock, 60000 - (Date.now() % 60000) + 50);   // on the minute
  }
  updateClock();

  // Demo content: story times are written as "minutes before the page loaded", so
  // the theme always reads as today. A CMS prints real times and drops data-ago.
  const loadedAt = Date.now();
  $$('time[data-ago]').forEach((el) => {
    const at = new Date(loadedAt - Number(el.dataset.ago) * 60000);
    el.dateTime = at.toISOString();
    el.textContent = hourMinute.format(at);
  });

  // Preview the header's three moods with ?news=calm | live | breaking
  const mood = new URLSearchParams(location.search).get('news');
  if (header && ['calm', 'live', 'breaking'].includes(mood)) header.dataset.news = mood;

  /* ── Menu: the mark is the button; open, it turns into the triskelion ───── */
  const menu = $('#site-menu');
  const menuButtons = $$('[data-menu-toggle]');
  let opener = null;

  function setMenu(open, button) {
    if (!menu) return;
    menu.dataset.open = String(open);
    menuButtons.forEach((b) => {
      b.setAttribute('aria-expanded', String(open));
      const label = $('.tool__label', b);
      if (label) label.textContent = open ? 'Close' : 'Menu';
    });
    if (open) opener = button;
  }

  menuButtons.forEach((button) => {
    button.addEventListener('click', () => setMenu(menu.dataset.open !== 'true', button));
  });
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !menu || menu.dataset.open !== 'true') return;
    setMenu(false);
    if (opener) opener.focus();
  });
  document.addEventListener('click', (event) => {
    if (!menu || menu.dataset.open !== 'true') return;
    if (menu.contains(event.target) || event.target.closest('[data-menu-toggle]')) return;
    setMenu(false);
  });

  /* ── Condensed bar: once the masthead scrolls away ─────────────────────── */
  const bar = $('.minibar');
  const masthead = $('.hdr');
  if (bar && masthead && 'IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      const show = !entry.isIntersecting && entry.boundingClientRect.top < 0;
      bar.dataset.show = String(show);
      bar.inert = !show;
      if (show) bar.removeAttribute('aria-hidden');
      else bar.setAttribute('aria-hidden', 'true');
      header.classList.toggle('is-condensed', show);
    }).observe(masthead);
  }

  /* ── Toast: one quiet line of confirmation ─────────────────────────────── */
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.setAttribute('role', 'status');
  document.body.append(toast);
  let toastTimer;

  function say(message) {
    toast.innerHTML = '<span class="lf" aria-hidden="true"></span>';
    toast.append(message);
    toast.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-on'), 2600);
  }

  /* ── Sharing ───────────────────────────────────────────────────────────── */
  const pageUrl = () => location.href.split('#')[0];
  const shareTargets = {
    x: (url, title) => `https://x.com/intent/post?url=${url}&text=${title}`,
    whatsapp: (url, title) => `https://wa.me/?text=${title}%20${url}`,
    facebook: (url) => `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    telegram: (url, title) => `https://t.me/share/url?url=${url}&text=${title}`,
  };
  const pageTitle = encodeURIComponent(document.title.split(' | ')[0]);
  $$('[data-share]').forEach((link) => {
    const make = shareTargets[link.dataset.share];
    if (make) link.href = make(encodeURIComponent(pageUrl()), pageTitle);
  });

  async function copy(text) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const field = document.createElement('textarea');   // older browsers, plain http
    field.value = text;
    field.setAttribute('readonly', '');
    field.style.cssText = 'position:fixed;opacity:0';
    document.body.append(field);
    field.select();
    const ok = document.execCommand('copy');
    field.remove();
    if (!ok) throw new Error('copy failed');
  }

  document.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-copy-link]');
    if (!button) return;
    try {
      await copy(pageUrl() + (button.dataset.copyLink || ''));
      say('Link copied');
    } catch {
      say('Could not copy the link');
    }
  });

  /* ── Gallery: work through the pictures in place ───────────────────────── */
  $$('[data-gallery]').forEach((gallery) => {
    const pictures = JSON.parse($('[data-gal-data]', gallery)?.textContent || '[]');
    const img = $('[data-gal-img]', gallery);
    const caption = $('[data-gal-cap]', gallery);
    const credit = $('[data-gal-credit]', gallery);
    const count = $('[data-gal-n]', gallery);
    const picks = $$('[data-gal-pick]', gallery);
    if (!pictures.length || !img) return;
    const sizes = img.sizes.replace(/^auto,\s*/, '');
    let current = 0;

    function warm(index) {
      const next = new Image();
      next.sizes = sizes;
      next.srcset = pictures[index].srcset;
    }

    function show(index) {
      current = (index + pictures.length) % pictures.length;
      const picture = pictures[current];
      img.srcset = picture.srcset;
      img.src = picture.src;
      img.alt = picture.alt;
      caption.textContent = picture.cap;
      credit.textContent = picture.credit;
      count.textContent = String(current + 1).padStart(2, '0');
      picks.forEach((button) => button.setAttribute('aria-current', String(Number(button.dataset.galPick) === current)));
      warm((current + 1) % pictures.length);
    }

    picks.forEach((button) => button.addEventListener('click', () => show(Number(button.dataset.galPick))));
    $$('[data-gal-step]', gallery).forEach((button) => {
      button.addEventListener('click', () => show(current + Number(button.dataset.galStep)));
    });
    gallery.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
      event.preventDefault();
      show(current + (event.key === 'ArrowRight' ? 1 : -1));
    });
    gallery.addEventListener('pointerenter', () => warm(1), { once: true });
  });

  /* ── Live page: new and older updates ──────────────────────────────────── */
  const feed = $('[data-live-feed]');
  if (feed) {
    const fresh = $$('[data-new]', feed);
    const older = $$('[data-older]', feed);
    const newBar = $('.newbar', feed);
    const moreBar = $('.feed__more', feed);
    const behaviour = () => (reducedMotion.matches ? 'auto' : 'smooth');
    fresh.forEach((post) => { post.hidden = true; });
    older.forEach((post) => { post.hidden = true; });

    const revealOlder = () => {
      older.forEach((post) => { post.hidden = false; });
      if (moreBar) moreBar.hidden = true;
    };

    if (fresh.length && newBar) {
      $('[data-new-count]', newBar).textContent = `${fresh.length} new update${fresh.length > 1 ? 's' : ''}`;
      newBar.hidden = false;
      $('[data-show-new]', newBar).addEventListener('click', () => {
        fresh.forEach((post) => { post.hidden = false; });
        newBar.hidden = true;
        $('.post__title', fresh[0]).focus({ preventScroll: true });
        fresh[0].scrollIntoView({ behavior: behaviour(), block: 'start' });
      });
    }
    if (older.length && moreBar) {
      moreBar.hidden = false;
      $('[data-show-older]', moreBar).addEventListener('click', () => {
        revealOlder();
        $('.post__title', older[0]).focus();
      });
    }

    // a key event that points at an older update opens the older updates first
    document.addEventListener('click', (event) => {
      const link = event.target.closest('a[href^="#post-"]');
      const target = link && document.getElementById(link.hash.slice(1));
      if (target && target.hidden) revealOlder();
    });
    const linked = location.hash.startsWith('#post-') && document.getElementById(location.hash.slice(1));
    if (linked && linked.hidden) {
      revealOlder();
      linked.scrollIntoView();
    }

    // on wide screens the key events are a sticky column and always open
    const keyEvents = $('.keyev');
    const wide = window.matchMedia('(min-width: 1100px)');
    const keepOpen = () => { if (keyEvents && wide.matches) keyEvents.open = true; };
    wide.addEventListener('change', keepOpen);
    keepOpen();
  }

  /* ── Forms: newsletter and contact ─────────────────────────────────────── */
  // Front end only: connect each form's action to the mailing service or inbox.
  function confirmInPlace(form, done, message) {
    if (!done) return;
    done.textContent = message;
    done.tabIndex = -1;
    done.hidden = false;
    form.hidden = true;
    done.focus();
  }
  $$('[data-newsletter]').forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      confirmInPlace(form, form.parentElement.querySelector('.nlbar__done'), 'Thank you. Check your inbox to confirm your address.');
    });
  });
  $$('[data-contact]').forEach((form) => {
    const subject = form.querySelector('select[name="subject"]');
    const wanted = new URLSearchParams(location.search).get('subject');
    if (subject && wanted && [...subject.options].some((o) => o.value === wanted)) subject.value = wanted;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      confirmInPlace(form, form.parentElement.querySelector('.contact__done'), 'Thank you. Your message is with the newsroom, and we will reply by email.');
    });
  });

  /* ── Topic: follow ─────────────────────────────────────────────────────── */
  // Demo: the choice is kept in this browser only.
  $$('[data-follow]').forEach((button) => {
    const key = `tot-follow:${button.dataset.follow}`;
    const label = $('[data-follow-label]', button);
    const render = (on) => {
      button.setAttribute('aria-pressed', String(on));
      if (label) label.textContent = on ? 'Following' : 'Follow this topic';
    };
    let on = false;
    try { on = localStorage.getItem(key) === '1'; } catch { /* storage blocked */ }
    render(on);
    button.addEventListener('click', () => {
      on = !on;
      render(on);
      try { localStorage.setItem(key, on ? '1' : '0'); } catch { /* storage blocked */ }
      say(on ? 'Following this topic' : 'No longer following');
    });
  });

  /* ── Contents list: mark the section being read ────────────────────────── */
  $$('[data-toc]').forEach((toc) => {
    const links = $$('a[href*="#"]', toc);
    const targets = links.map((a) => document.getElementById(a.hash.slice(1))).filter(Boolean);
    if (!targets.length || !('IntersectionObserver' in window)) return;
    const mark = (id) => links.forEach((a) => {
      if (a.hash === `#${id}`) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
    // a heading counts as current once it reaches the band just below the condensed bar
    const observer = new IntersectionObserver((entries) => {
      const seen = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (seen.length) mark(seen[0].target.id);
    }, { rootMargin: '-20% 0px -70% 0px' });
    targets.forEach((el) => observer.observe(el));
    mark(targets[0].id);
  });
})();
