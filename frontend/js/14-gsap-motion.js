// js/14-gsap-motion.js — Animasi GSAP (gsap-core + gsap-timeline + gsap-scrolltrigger skill).
// Prinsip: transform+opacity only (compositor), ScrollTrigger.batch untuk stagger kartu,
// timeline untuk page-enter sequence, reduced-motion dihormati.
// ponytail: tidak pakai ScrollSmoother / SplitText (club-only), cukup untuk produksi.

(function () {
  if (!window.gsap || !window.ScrollTrigger) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  gsap.registerPlugin(ScrollTrigger);

  /* ── Defaults global ─────────────────────────────────────── */
  gsap.defaults({ ease: 'power2.out' });

  /* ── 1. Page-enter: nav + judul + bar ─────────────────────
     Paralel dengan animasi CSS yang sudah ada di motion.css;
     GSAP mengambil alih hanya elemen yang belum dianimasikan CSS
     supaya tidak double-animate. Gunakan autoAlpha (opacity+visibility). */
  const runPageEnter = () => {
    const nav = document.querySelector('#root > header');
    const h1  = document.querySelector('#main .head h1');
    const sub = document.querySelectorAll('#main .head p, #main .bar, .info-banner');

    // Sudah punya animasi CSS — GSAP tidak doubly-animate, skip jika ada .no-enter.
    if (nav && !nav.closest('.no-enter')) {
      gsap.from(nav, { y: -12, autoAlpha: 0, duration: 0.5, clearProps: 'all' });
    }
    if (h1 && !h1.closest('.no-enter')) {
      gsap.from(h1, { y: 14, autoAlpha: 0, duration: 0.55, clearProps: 'all' });
    }
    if (sub.length) {
      gsap.from([...sub], { y: 10, autoAlpha: 0, duration: 0.55, delay: 0.1, stagger: 0.07, clearProps: 'all' });
    }
  };

  /* ── 2. Stat cards: stagger masuk saat scroll ─────────────── */
  const initStatBatch = () => {
    const stats = document.querySelectorAll('.stat');
    if (!stats.length) return;
    gsap.set([...stats], { y: 20, autoAlpha: 0 });
    ScrollTrigger.batch('.stat', {
      once: true,
      start: 'top 88%',
      onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.08, clearProps: 'all' }),
    });
  };

  /* ── 3. Kartu laporan (.item): batch reveal ───────────────── */
  const initItemBatch = () => {
    ScrollTrigger.batch('#main .item', {
      once: true,
      start: 'top 90%',
      interval: 0.08,
      batchMax: 6,
      onEnter: (batch) =>
        gsap.from(batch, { y: 18, autoAlpha: 0, duration: 0.45, stagger: 0.07, clearProps: 'all' }),
    });
  };

  /* ── 4. Hero halaman publik (auth/home): timeline masuk ───── */
  const initHeroTimeline = () => {
    const hero = document.querySelector('.hero, .home-hero');
    if (!hero) return;
    const tl = gsap.timeline({ defaults: { ease: 'power2.out', clearProps: 'all' } });
    const eyebrow = hero.querySelector('.home-eyebrow, .eyebrow');
    const heading = hero.querySelector('h1, h2');
    const body    = hero.querySelectorAll('p, .btn, .steps');
    if (eyebrow) tl.from(eyebrow, { y: -10, autoAlpha: 0, duration: 0.4 });
    if (heading)  tl.from(heading, { y: 16,  autoAlpha: 0, duration: 0.55 }, eyebrow ? '<0.15' : 0);
    if (body.length) tl.from([...body], { y: 10, autoAlpha: 0, duration: 0.45, stagger: 0.1 }, '>-0.1');
  };

  /* ── 5. Tombol: micro lift on hover (delegated, satu listener) */
  const initBtnHover = () => {
    document.addEventListener('pointerenter', (e) => {
      const btn = e.target.closest && e.target.closest('.btn:not(:disabled)');
      if (!btn || btn._gsapHover) return;
      btn._gsapHover = true;
      gsap.to(btn, { y: -2, duration: 0.18, ease: 'power1.out', overwrite: 'auto' });
    }, true);
    document.addEventListener('pointerleave', (e) => {
      const btn = e.target.closest && e.target.closest('.btn:not(:disabled)');
      if (!btn) return;
      gsap.to(btn, { y: 0, duration: 0.22, ease: 'power2.out', overwrite: 'auto' });
    }, true);
  };

  /* ── 6. Kartu KPI dashboard (.fv-kpi): batch reveal ─────── */
  const initKpiBatch = () => {
    ScrollTrigger.batch('.fv-kpi', {
      once: true,
      start: 'top 88%',
      onEnter: (batch) =>
        gsap.from(batch, { scale: 0.96, autoAlpha: 0, duration: 0.4, stagger: 0.07, ease: 'back.out(1.4)', clearProps: 'all' }),
    });
  };

  /* ── 7. Re-run saat router ganti halaman (MutationObserver) ─ */
  const onRouteChange = () => {
    // Bunuh semua ScrollTrigger lama lalu re-init
    ScrollTrigger.getAll().forEach(t => t.kill());
    initStatBatch();
    initItemBatch();
    initKpiBatch();
    initHeroTimeline();
    runPageEnter();
    ScrollTrigger.refresh();
  };

  /* ── Boot ───────────────────────────────────────────────── */
  const boot = () => {
    runPageEnter();
    initStatBatch();
    initItemBatch();
    initKpiBatch();
    initHeroTimeline();
    initBtnHover();

    // Pantau pergantian konten #root (SPA router inject DOM baru)
    const root = document.getElementById('root');
    if (!root) return;
    let debounce;
    new MutationObserver(() => {
      clearTimeout(debounce);
      debounce = setTimeout(onRouteChange, 80);
    }).observe(root, { childList: true });
  };

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
