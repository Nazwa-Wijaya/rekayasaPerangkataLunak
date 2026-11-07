// js/02-icons-nav.js — Ikon SVG, logo, sidebar (tooltip + drawer).
// Opsi A: script klasik berurutan. Urutan load di frontend/index.html. Jangan load satuan.
const ic = (p) => `<svg class="i" viewBox="0 0 24 24">${p}</svg>`;

const IC = {
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  off: '<path d="M3 3l18 18M10.6 6.1A10 10 0 0112 6c6.5 0 10 6 10 6a17 17 0 01-3.2 3.9M6.5 6.6C3.7 8.4 2 12 2 12s3.5 7 10 7c1.6 0 3-.4 4.3-1M9.9 9.9a3 3 0 004.2 4.2"/>',
  photo:
    '<path d="M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6"/><circle cx="9" cy="9.5" r="1"/>',
  logo: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>',
  chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
};

const logo = `<div class="logo" onclick="goHome()" style="cursor:pointer" title="Kembali ke halaman awal"><img src="assets/logo.png" alt="Logo Lost & Found Kampus">Lost & Found Kampus</div>`;

// ===== Ikon & perilaku sidebar (ikon di layar besar/sedang, hamburger di layar kecil) =====

// ===== Ikon & perilaku sidebar (ikon di layar besar/sedang, hamburger di layar kecil) =====
const NAV_IC = {
  dash: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
  pesan: IC.chat,
  masuk:
    '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
  forum:
    '<path d="M4 4h12a2 2 0 0 1 2 2v14H6a2 2 0 0 1-2-2z"/><path d="M18 8h2v10a2 2 0 0 1-2 2"/><path d="M8 8h6M8 12h6M8 16h4"/>',
  acc_temuan:
    '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>',
  input_admin: '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
  cocok:
    '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  kembali:
    '<path d="M16 16l2 2 4-4"/><path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14"/><path d="M3.3 7L12 12l8.7-5M12 22V12"/>',
  users:
    '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  petugas_data:
    '<rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="8" cy="11" r="2"/><path d="M5.5 16c.6-1.3 1.6-2 2.5-2s1.9.7 2.5 2M14 10h4M14 14h4"/>',
  riwayat:
    '<rect x="2" y="3" width="20" height="5" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8M10 12h4"/>',
  riwayat_petugas:
    '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l4 2"/>',
  profil:
    '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/>',
  lapor:
    '<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
  saya: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
  logout:
    '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  close: '<path d="M18 6L6 18M6 6l12 12"/>',
};
NAV_IC.dash_petugas = NAV_IC.dash;
NAV_IC.input_temuan = NAV_IC.input_admin;
const navIcon = (k) => ic(NAV_IC[k] || '<circle cx="12" cy="12" r="3"/>');

function setSideOpen(open) {
  document.body.classList.toggle("side-open", !!open);
  const b = document.querySelector(".m-burger");
  if (b) {
    b.setAttribute("aria-expanded", open ? "true" : "false");
    b.setAttribute("aria-label", open ? "Tutup menu" : "Buka menu");
  }
}
const openSide = () => setSideOpen(true);
const closeSide = () => setSideOpen(false);
const toggleSide = () =>
  setSideOpen(!document.body.classList.contains("side-open"));

// Tooltip ikon sidebar (layar >= 761px) + penutup drawer (layar kecil). Dipasang sekali saja.
(function initSideUi() {
  if (window.__sideUiReady) return;
  window.__sideUiReady = true;
  const wide = window.matchMedia("(min-width: 761px)");
  let tip = null;
  const hide = () => tip && tip.classList.remove("on");
  const show = (el) => {
    if (!wide.matches || !el.dataset.tip) return hide();
    if (!tip) {
      tip = document.createElement("div");
      tip.className = "side-tip";
      tip.setAttribute("role", "tooltip");
      document.body.append(tip);
    }
    const r = el.getBoundingClientRect();
    tip.textContent = el.dataset.tip;
    tip.style.top = r.top + r.height / 2 + "px";
    tip.style.left = r.right + 12 + "px";
    tip.classList.add("on");
  };
  const pick = (e) =>
    e.target.closest ? e.target.closest("aside [data-tip]") : null;
  document.addEventListener("mouseover", (e) => {
    const el = pick(e);
    el ? show(el) : hide();
  });
  document.addEventListener("focusin", (e) => {
    const el = pick(e);
    el ? show(el) : hide();
  });
  document.addEventListener("focusout", hide);
  document.addEventListener("mouseout", (e) => {
    if (!e.relatedTarget) hide();
  });
  document.addEventListener("click", hide);
  document.addEventListener("scroll", hide, true);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      hide();
      closeSide();
    }
  });
  window.addEventListener("resize", () => {
    hide();
    if (wide.matches) closeSide();
  });
})();

// Store API-only (produksi). Tidak ada mock localStorage / INITIAL_DB / password demo.
// Seluruh data diambil dari backend via JWT. Tidak ada fallback offline.

