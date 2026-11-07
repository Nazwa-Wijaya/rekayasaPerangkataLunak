// js/dashboard/icons.js — Ikon SVG FVP + chip status.
// Opsi A: script klasik berurutan. Urutan load di frontend/index.html. Jangan load satuan.
/* ---------- Ikon ---------- */
const fvI = (p, cls = "") =>
  `<svg class="fv-i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;

const FVP = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  filter:
    '<path d="M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3M14 2v4M8 10v4M16 18v4"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  cal: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  out: '<path d="M7 17 17 7M7 7h10v10"/>',
  up: '<path d="M12 19V5M5 12l7-7 7 7"/>',
  down: '<path d="M12 5v14M19 12l-7 7-7-7"/>',
  flat: '<path d="M5 12h14"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  box: '<path d="M21 8 12 3 3 8v8l9 5 9-5V8Z"/><path d="m3 8 9 5 9-5M12 13v8"/>',
  wallet:
    '<path d="M20 7H5a2 2 0 0 1 0-4h13v4"/><path d="M3 5v14a2 2 0 0 0 2 2h15V7"/><circle cx="16.5" cy="14" r="1"/>',
  phone: '<rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M11 18h2"/>',
  card: '<rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="8" cy="12" r="2"/><path d="M13 10h5M13 14h4"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M16 7l3 3"/>',
  shirt:
    '<path d="M8 3 3 6l2 5 3-1v11h8V10l3 1 2-5-5-3a4 4 0 0 1-8 0Z"/>',
  book: '<path d="M4 4a2 2 0 0 1 2-2h14v17H6a2 2 0 0 0-2 2V4Z"/><path d="M4 21a2 2 0 0 1 2-2h14"/>',
  check: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  alert:
    '<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/>',
  repeat:
    '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14M7 22l-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  inbox:
    '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5h13L22 12v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6l3.5-7Z"/>',
  percent: '<path d="M19 5 5 19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
};

const fvCatIcon = (name) => {
  const n = String(name || "").toLowerCase();
  if (n.includes("dompet") || n.includes("tas")) return FVP.wallet;
  if (n.includes("elektronik")) return FVP.phone;
  if (n.includes("dokumen") || n.includes("kartu")) return FVP.card;
  if (n.includes("kunci")) return FVP.key;
  if (n.includes("pakaian") || n.includes("aksesori")) return FVP.shirt;
  if (n.includes("alat tulis") || n.includes("buku")) return FVP.book;
  return FVP.box;
};

/* ---------- Label status (bahasa singkat untuk chip & legenda) ---------- */
const FVS = {
  PENDING: "Menunggu verifikasi",
  ACTIVE: "Aktif di forum",
  FOUND: "Ditemukan",
  RETURNED: "Dikembalikan",
  REJECTED: "Ditolak",
  EXPIRED: "Kedaluwarsa",
  PENDING_APPROVAL: "Menunggu ACC",
  APPROVED: "Tersimpan",
  MATCHED: "Dicocokkan",
};
const fvChip = (s) =>
  `<span class="fv-chip st-${String(s).toLowerCase()}">${FVS[s] || s}</span>`;

/* Pembungkus: style.css punya aturan global untuk button[onclick^="detail("] (tombol biru),
   jadi tombol di tampilan baru memanggil lewat fungsi ini agar tidak ikut terkena. */
const fvDetail = (id) => detail(id);
const fvDetailFound = (id) => detailFound(id);

