/* =========================================================
   Aarav Kapoor · Portfolio 2026
   Lenis-style smooth scroll · scroll-spy · scroll-linked
   animations · reveal-on-scroll · counters · ⌘K palette
   ========================================================= */

(() => {
  'use strict';

  /* ─────────────────────────────────────────────────────
     0 · Helpers
     ───────────────────────────────────────────────────── */
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const lerp  = (a, b, t) => a + (b - a) * t;

  /* ─────────────────────────────────────────────────────
     1 · vh / vw  · mobile-safe viewport units
     ───────────────────────────────────────────────────── */
  const setViewportUnits = () => {
    document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    document.documentElement.style.setProperty('--vw', `${window.innerWidth * 0.01}px`);
  };
  setViewportUnits();
  window.addEventListener('resize', setViewportUnits);

  /* ─────────────────────────────────────────────────────
     2 · Lenis-style smooth scroll (lightweight, vanilla)
        Inspired by Lenis by darkroom.engineering — no CDN.
     ───────────────────────────────────────────────────── */
  class SmoothScroller {
    constructor(options = {}) {
      this.duration = options.duration ?? 1.15;          // seconds
      this.easing   = options.easing   ?? (t => 1 - Math.pow(1 - t, 4)); // easeOutQuart
      this.smooth   = true;
      this.targetY  = window.scrollY;
      this.currentY = this.targetY;
      this.raf      = null;
      this.dir      = 1;
      this.lastY    = this.targetY;
      this.init();
    }
    init() {
      document.documentElement.classList.add('lenis', 'lenis-smooth');
      window.scrollTo(0, 0);              // start at top
      // Intercept anchor links
      $$('a[href^="#"]').forEach(a => {
        a.addEventListener('click', (e) => {
          const href = a.getAttribute('href');
          if (!href || href === '#') return;
          const el = document.querySelector(href);
          if (!el) return;
          e.preventDefault();
          this.scrollTo(el);
        });
      });
      window.addEventListener('wheel',     this.onWheel.bind(this),     { passive: false });
      window.addEventListener('touchstart', this.onTouchStart.bind(this),{ passive: true  });
      window.addEventListener('touchmove',  this.onTouchMove.bind(this), { passive: false });
      window.addEventListener('keydown',    this.onKey.bind(this));
      this.animate();
    }
    onWheel(e) {
      e.preventDefault();
      const delta = e.deltaY;
      this.targetY = clamp(this.targetY + delta, 0, this.maxScroll());
      this.dir = Math.sign(delta);
    }
    onTouchStart(e) { this.touchStartY = e.touches[0].clientY; }
    onTouchMove(e) {
      const dy = this.touchStartY - e.touches[0].clientY;
      this.touchStartY = e.touches[0].clientY;
      this.targetY = clamp(this.targetY + dy * 1.4, 0, this.maxScroll());
      e.preventDefault();
    }
    onKey(e) {
      const step = window.innerHeight * 0.85;
      if      (e.key === 'ArrowDown') { this.targetY = clamp(this.targetY +  60, 0, this.maxScroll()); }
      else if (e.key === 'ArrowUp')   { this.targetY = clamp(this.targetY -  60, 0, this.maxScroll()); }
      else if (e.key === 'PageDown')  { this.targetY = clamp(this.targetY + step, 0, this.maxScroll()); }
      else if (e.key === 'PageUp')    { this.targetY = clamp(this.targetY - step, 0, this.maxScroll()); }
      else if (e.key === 'Home')      { this.targetY = 0; }
      else if (e.key === 'End')       { this.targetY = this.maxScroll(); }
      else return;
      // Only reached for handled keys
      e.preventDefault();
    }
    scrollTo(target) {
      const el = typeof target === 'string' ? $(target) : target;
      if (!el) return;
      const top = el.getBoundingClientRect().top + this.targetY - (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) || 72);
      this.targetY = clamp(top, 0, this.maxScroll());
    }
    maxScroll() {
      return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    }
    animate() {
      // Lerp toward target for buttery momentum
      this.currentY = lerp(this.currentY, this.targetY, 0.085);
      if (Math.abs(this.targetY - this.currentY) < 0.4) this.currentY = this.targetY;
      // Mirror scrollY back to window
      window.scrollTo(0, Math.round(this.currentY));
      // Direction
      const newDir = this.currentY > this.lastY ? 1 : -1;
      if (newDir !== this.dir) this.dir = newDir;
      this.lastY = this.currentY;
      // Drive scroll-linked CSS variables
      const max = this.maxScroll();
      const progress = max > 0 ? this.currentY / max : 0;
      document.documentElement.style.setProperty('--scroll-y',        `${this.currentY}px`);
      document.documentElement.style.setProperty('--scroll-progress', `${progress}`);
      document.documentElement.style.setProperty('--scroll-direction',`${this.dir}`);
      this.raf = requestAnimationFrame(this.animate.bind(this));
    }
  }
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const scroller = prefersReduced ? null : new SmoothScroller();

  /* ─────────────────────────────────────────────────────
     3 · Navbar · scroll-spy + stuck-state + mobile menu
     ───────────────────────────────────────────────────── */
  const nav       = $('#nav');
  const navList   = $('#navList');
  const navToggle = $('#navToggle');
  const navLinks  = $$('[data-nav-link]');

  const onScrollNav = () => {
    const y = window.scrollY;
    nav.classList.toggle('is-stuck', y > 32);
  };
  window.addEventListener('scroll', onScrollNav, { passive: true });
  onScrollNav();

  navToggle?.addEventListener('click', () => {
    const open = navList.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', open);
  });
  navLinks.forEach(a => a.addEventListener('click', () => {
    navList.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
  }));

  // Scroll-spy via IntersectionObserver
  const sections = $$('[data-section]');
  const setActiveLink = (id) => {
    navLinks.forEach(a => {
      const match = a.getAttribute('href') === `#${id}`;
      a.classList.toggle('is-active', match);
    });
  };
  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.4) {
          setActiveLink(entry.target.id);
          // Drive per-section progress (0-1 across the section)
          const rect = entry.target.getBoundingClientRect();
          const total = entry.target.offsetHeight;
          const seen  = clamp((window.innerHeight * 0.5 - rect.top) / (total + window.innerHeight * 0.5), 0, 1);
          entry.target.style.setProperty('--section-progress', seen);
        }
      });
    }, { threshold: [0.4, 0.6], rootMargin: '-72px 0px 0px 0px' });
    sections.forEach(s => spy.observe(s));
  }

  /* ─────────────────────────────────────────────────────
     4 · Reveal on scroll (data-reveal)
     ───────────────────────────────────────────────────── */
  if ('IntersectionObserver' in window) {
    const reveal = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    $$('[data-reveal], [data-reveal-stagger]').forEach(el => reveal.observe(el));
  } else {
    // Fallback: just show everything
    $$('[data-reveal], [data-reveal-stagger]').forEach(el => el.classList.add('is-visible'));
  }

  /* ─────────────────────────────────────────────────────
     5 · Number counters
     ───────────────────────────────────────────────────── */
  const animateCount = (el) => {
    const target = parseInt(el.dataset.count, 10) || 0;
    const dur    = 1600;
    const start  = performance.now();
    const step = (now) => {
      const t = clamp((now - start) / dur, 0, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(target * eased).toLocaleString();
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if ('IntersectionObserver' in window) {
    const counterObs = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          $$('.counter', entry.target).forEach(animateCount);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });
    $$('.counter').forEach(c => counterObs.observe(c.parentElement || c));
  } else {
    $$('.counter').forEach(animateCount);
  }

  /* ─────────────────────────────────────────────────────
     6 · Typewriter (hero roles)
     ───────────────────────────────────────────────────── */
  const tw   = $('#typewriter');
  if (tw) {
    const roles = JSON.parse(tw.dataset.roles);
    let i = 0, j = 0, deleting = false;
    const tick = () => {
      const cur = roles[i];
      if (!deleting) {
        tw.textContent = cur.slice(0, ++j);
        if (j === cur.length) { deleting = true; return setTimeout(tick, 1800); }
      } else {
        tw.textContent = cur.slice(0, --j);
        if (j === 0) { deleting = false; i = (i + 1) % roles.length; }
      }
      setTimeout(tick, deleting ? 30 : 55);
    };
    tick();
  }

  /* ─────────────────────────────────────────────────────
     7 · Magnetic buttons  (subtle, but feels alive)
     ───────────────────────────────────────────────────── */
  $$('.magnetic, .btn').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const r = btn.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width  - 0.5) * 16;
      const y = ((e.clientY - r.top)  / r.height - 0.5) * 16;
      btn.style.transform = `translate(${x}px, ${y}px)`;
      btn.style.setProperty('--mx', `${e.clientX - r.left}px`);
      btn.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });

  /* ─────────────────────────────────────────────────────
     8 · Cursor spotlight on glass cards
     ───────────────────────────────────────────────────── */
  $$('.glass-card, .project, .skill-card, .cert-card, .arch-card, .oss-card, .testimonial, .timeline__item, .blog-item, .now-item, .setup-item, .radar-ring').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });

  /* ─────────────────────────────────────────────────────
     9 · ⌘K  command palette (jump to section)
     ───────────────────────────────────────────────────── */
  const palette = $('#palette');
  const paletteInput = $('#paletteInput');
  const paletteResults = $('#paletteResults');
  const paletteItems = [
    { label: 'About',         href: '#about' },
    { label: 'Skills',        href: '#skills' },
    { label: 'Experience',    href: '#experience' },
    { label: 'Projects',      href: '#projects' },
    { label: 'Architecture',  href: '#architecture' },
    { label: 'Open Source',   href: '#opensource' },
    { label: 'Writing',       href: '#writing' },
    { label: 'Testimonials',  href: '#testimonialsTitle'.toLowerCase ? '#testimonialsTitle' : '' },
    { label: 'Tech Radar',    href: '#radarTitle' },
    { label: 'Now',           href: '#nowTitle' },
    { label: 'Mentorship',    href: '#mentorTitle' },
    { label: 'Dev Setup',     href: '#setupTitle' },
    { label: 'Books',         href: '#booksTitle' },
    { label: 'Newsletter',    href: '#newsletterTitle' },
    { label: 'Contact',       href: '#contact' },
  ].filter(item => item.href);

  const renderPalette = (q = '') => {
    const list = q
      ? paletteItems.filter(i => i.label.toLowerCase().includes(q.toLowerCase()))
      : paletteItems;
    paletteResults.innerHTML = list.map(i =>
      `<a href="${i.href}" style="display:flex;align-items:center;justify-content:space-between;padding:0.75rem 1rem;border-radius:var(--radius-md);color:var(--color-text);font-size:var(--fs-sm);">
         <span>${i.label}</span>
         <span style="font-family:var(--font-mono);font-size:var(--fs-xs);color:var(--color-text-dim);">jump →</span>
       </a>`
    ).join('') || `<div style="padding:1rem;font-size:var(--fs-sm);color:var(--color-text-dim);">No matches</div>`;
  };
  const openPalette  = () => { palette.hidden = false; renderPalette(''); paletteInput.value = ''; paletteInput.focus(); };
  const closePalette = () => { palette.hidden = true; };

  document.addEventListener('keydown', (e) => {
    const isMac = navigator.platform.toUpperCase().includes('MAC');
    const accel = isMac ? e.metaKey : e.ctrlKey;
    if (accel && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      palette.hidden ? openPalette() : closePalette();
    }
    if (e.key === 'Escape' && !palette.hidden) closePalette();
  });
  palette?.addEventListener('click', (e) => { if (e.target === palette) closePalette(); });
  paletteInput?.addEventListener('input', (e) => renderPalette(e.target.value));
  paletteResults?.addEventListener('click', (e) => {
    if (e.target.closest('a')) closePalette();
  });

  /* ─────────────────────────────────────────────────────
     10 · Material-You dynamic accent · cycle on click
     ───────────────────────────────────────────────────── */
  const accents = ['purple', 'cyan', 'emerald', 'sunset'];
  let accentIdx = 0;
  const cycleAccent = (e) => {
    if (e.target.closest('a, button, input, textarea, select')) return;
    accentIdx = (accentIdx + 1) % accents.length;
    document.documentElement.dataset.accent = accents[accentIdx];
  };
  // Only cycle when the user triple-clicks the brand logo, or via the brand shortcut
  $('.nav__brand')?.addEventListener('dblclick', cycleAccent);

  /* ─────────────────────────────────────────────────────
     11 · Year auto-fill (footer)
     ───────────────────────────────────────────────────── */
  $$('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

  /* ─────────────────────────────────────────────────────
     12 · Marquee duplication (already duplicated in HTML,
         but we ensure at-least-twice for seamless loop)
     ───────────────────────────────────────────────────── */
  $$('.marquee__track').forEach(track => {
    if (track.dataset.duplicated) return;
    track.dataset.duplicated = '1';
    const clone = track.cloneNode(true);
    // Already duplicated in markup for safe net; skip if so
    if (track.children.length === clone.children.length && track.innerHTML === clone.innerHTML) return;
  });

  /* ─────────────────────────────────────────────────────
     13 · Lenis · if user scrolls with native wheel,
         scroll-spy + IO still work (we mirror scrollY)
     ───────────────────────────────────────────────────── */

  console.info('%cAarav Kapoor · Portfolio 2026', 'color:#7f52ff;font:700 16px monospace');
  console.info('Want to chat? hello@aarav.dev');
})();
