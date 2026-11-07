// Lost & Found Terintegrasi Kampus
// Berdasarkan Dokumen Spesifikasi Sistem Rekayasa Perangkat Lunak (README.md)

const NOW = new Date(2026, 8, 30); // 30 September 2026

const S = {
  PENDING: "Menunggu verifikasi",
  ACTIVE: "Aktif di forum",
  FOUND: "Barang ditemukan",
  RETURNED: "Sudah dikembalikan",
  REJECTED: "Ditolak",
  EXPIRED: "Kedaluwarsa",
  PENDING_APPROVAL: "Menunggu ACC Admin",
  APPROVED: "Disetujui (Tersimpan)",
  MATCHED: "Dicocokkan",
};

const CATS = [
  "Dompet dan tas",
  "Elektronik",
  "Dokumen dan kartu",
  "Kunci",
  "Pakaian dan aksesori",
  "Alat tulis dan buku",
  "Lainnya",
];

const PRODI_FAKULTAS = [
  {
    fakultas: "Fakultas Teknik & Ilmu Komputer",
    prodi: [
      "S-2 Ilmu Komputer",
      "S-1 Teknik Informatika",
      "S-1 Sistem Informasi",
      "S-1 Rekayasa Perangkat Lunak",
      "S-1 Teknik Industri",
      "S-1 Teknik Sistem Komputer",
      "S-1 Ilmu Komputer",
      "D-3 Sistem Informasi",
    ],
  },
  {
    fakultas: "Fakultas Ekonomi & Bisnis",
    prodi: ["S-1 Manajemen", "S-1 Akuntansi", "S-1 Perbankan Syariah"],
  },
  {
    fakultas: "Fakultas Seni & Desain",
    prodi: [
      "S-1 Desain Komunikasi Visual (DKV)",
      "S-1 Film dan Televisi",
      "S-1 Desain Interior",
    ],
  },
  {
    fakultas: "Fakultas Ilmu Sosial & Kependidikan",
    prodi: ["S-1 Hubungan Internasional", "S-1 Pendidikan Bahasa Inggris"],
  },
  { fakultas: "Fakultas Psikologi", prodi: ["S-1 Psikologi"] },
  { fakultas: "Fakultas Hukum", prodi: ["S-1 Hukum"] },
];

const PRODI_LIST = PRODI_FAKULTAS.flatMap((f) => f.prodi);

const prodiOpts = () =>
  PRODI_FAKULTAS.map(
    (f) =>
      `<optgroup label="${f.fakultas}">${f.prodi.map((p) => `<option value="${p}">${p}</option>`).join("")}</optgroup>`,
  ).join("");

const LOCS = [
  "Gedung A - Ruang kelas",
  "Gedung A - Toilet lantai 1",
  "Gedung A - Toilet lantai 2",
  "Gedung A - Toilet lantai 3",
  "Gedung A - Toilet lantai 4",
  "Gedung A - Musholah lantai 1",
  "Gedung A - Musholah lantai 2",
  "Gedung A - Musholah lantai 3",
  "Gedung A - Musholah lantai 4",
  "Gedung A - Parkiran belakang",
  "Gedung A - Lab 1",
  "Gedung A - Lab 2",
  "Gedung A - Lab 3",
  "Gedung A - Lab 4",
  "Gedung A - Lab Teknik Industri",
  "Gedung A - Ruang pertemuan",
  "Gedung A - Ruang inkubator",
  "Gedung A - Poliklinik",
  "Gedung A - Lainnya",
  "Gedung B - Ruang kelas",
  "Gedung B - Toilet lantai 1",
  "Gedung B - Toilet lantai 2",
  "Gedung B - Toilet lantai 3",
  "Gedung B - Toilet lantai 4",
  "Gedung B - Musholah lantai 1",
  "Gedung B - Musholah lantai 2",
  "Gedung B - Musholah lantai 4",
  "Gedung B - Parkiran",
  "Gedung B - Perpustakaan",
  "Gedung B - Galeri FSD",
  "Gedung B - Ruang pertemuan",
  "Gedung B - Poliklinik",
  "Gedung B - Galeri investasi",
  "Gedung B - Studio FTV",
  "Gedung B - Bank Sumut",
  "Gedung B - Aula",
  "Gedung B - Microteaching",
  "Gedung B - Lab HI",
  "Gedung B - LIFT",
  "Gedung B - Bioskop",
  "Gedung B - Lainnya",
];

const d = (n) => {
  const x = new Date(NOW);
  x.setDate(x.getDate() - n);
  return x;
};

const fmt = (x) =>
  new Date(x).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const fmtT = (x) =>
  new Date(x).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

// ---- Helper khusus tampilan chat ----
const fmtClock = (x) =>
  new Date(x).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });

const dayKey = (x) => {
  const d = new Date(x);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

const fmtDay = (x) => {
  const d = new Date(x);
  const now = new Date();
  const yest = new Date();
  yest.setDate(now.getDate() - 1);
  if (dayKey(d) === dayKey(now)) return "Hari ini";
  if (dayKey(d) === dayKey(yest)) return "Kemarin";
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

// Bangun HTML bubble. Sengaja tanpa newline/indentasi di dalam .msg
// karena .msg memakai white-space: pre-wrap (spasi liar = baris kosong).
function chatBubbles(list, me) {
  let html = "";
  let lastDay = "";
  let prev = null;
  list.forEach((m) => {
    const day = dayKey(m.at);
    if (day !== lastDay) {
      html += `<div class="day-sep"><span>${esc(fmtDay(m.at))}</span></div>`;
      lastDay = day;
      prev = null;
    }
    const mine = m.from === me;
    const grouped = prev && prev.from === m.from;
    const showTag = m.rname && (!grouped || prev.rname !== m.rname);
    const tag = showTag
      ? `<div class="msg-item-tag">Terkait: ${esc(m.rname)}</div>`
      : "";
    html +=
      `<div class="msg${mine ? " out" : ""}${grouped ? " msg-cont" : " msg-first"}">` +
      tag +
      `<span class="msg-text">${esc(m.text)}</span>` +
      `<span class="msg-gap" aria-hidden="true"></span>` +
      `<time datetime="${esc(m.at)}">${fmtClock(m.at)}</time>` +
      `</div>`;
    prev = m;
  });
  return html;
}

// Textarea chat melebar otomatis sesuai jumlah baris (maks. 120px)
function autoGrow(el) {
  el.style.height = "auto";
  el.style.height = Math.min(el.scrollHeight, 120) + "px";
}

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
let DB = {
  users: [],
  reports: [],
  found: [],
  msgs: [],
  matches: [],
  returns: [],
};
let CATS_DYNAMIC = [];

const mapReport = (r) => ({
  id: r.id,
  uid: r.user_id,
  name: r.item_name,
  cat: r.category_name || CATS[(r.category_id || 7) - 1] || "Lainnya",
  category_id: r.category_id,
  color: r.color,
  brand: r.brand,
  loc: r.lost_location || r.loc || "",
  building: r.building,
  lost_location: r.lost_location,
  classroom_number: r.classroom_number,
  date: r.lost_date || r.created_at,
  desc: r.description,
  photo: r.photo || "",
  status: r.status,
  appr: r.approved_at || null,
  expired_at: r.expired_at || null,
  created_at: r.created_at,
  updated_at: r.updated_at,
  user_name: r.user_name,
  nim: r.nim,
  prodi: r.prodi,
});

const mapFound = (f) => ({
  id: f.id,
  name: f.item_name,
  cat: f.category_name || CATS[(f.category_id || 7) - 1] || "Lainnya",
  category_id: f.category_id,
  color: f.color,
  brand: f.brand,
  loc: f.found_location || f.loc || "",
  building: f.building,
  found_location: f.found_location,
  classroom_number: f.classroom_number,
  date: f.found_date || f.created_at,
  desc: f.description,
  photo: f.photo || "",
  status: f.status,
  received_by: f.received_by_name || f.received_by || "",
  received_by_id: f.received_by_id,
  created_at: f.created_at,
});

const mapMsg = (m) => ({
  id: m.id,
  uid: m.user_id,
  from: m.sender_role,
  text: m.message,
  at: m.created_at,
  read: !!m.is_read,
  rid: m.report_id,
  rname: m.report_name || m.rname || null,
});

const safeTime = (x) => {
  if (!x) return 0;
  if (typeof x === "number") return x;
  const iso = String(x).replace(" ", "T");
  const t = new Date(iso).getTime();
  return isNaN(t) ? new Date(x).getTime() || 0 : t;
};

// Urutkan percakapan mahasiswa untuk Admin:
// Mahasiswa dengan pesan terbaru (masuk/keluar) akan selalu berada di paling atas.
function getSortedStudentsForAdmin() {
  const last = (id) => DB.msgs.filter((m) => m.uid === id).slice(-1)[0];
  const un = (id) =>
    DB.msgs.filter((m) => m.uid === id && m.from === "user" && !m.read).length;

  return DB.users
    .filter((u) => u.role === "user")
    .slice()
    .sort((a, b) => {
      const la = last(a.id);
      const lb = last(b.id);
      const ta = la && la.at ? safeTime(la.at) : 0;
      const tb = lb && lb.at ? safeTime(lb.at) : 0;
      // 1. Urutkan berdasarkan waktu pesan terbaru (terbaru di paling atas)
      if (tb !== ta) return tb - ta;
      // 2. Jika waktu sama / belum ada pesan, dahulukan pesan belum dibaca
      const una = un(a.id);
      const unb = un(b.id);
      if (unb !== una) return unb - una;
      // 3. Fallback abjad nama
      return (a.name || "").localeCompare(b.name || "", "id-ID");
    });
}

async function refreshStore() {
  try {
    const [rep, fnd] = await Promise.all([
      API.req("/api/reports"),
      API.req("/api/found"),
    ]);
    DB.reports = (rep.data || []).map(mapReport);
    DB.found = (fnd.data || []).map(mapFound);
    try {
      const cats = await API.req("/api/categories");
      if (Array.isArray(cats.data) && cats.data.length) {
        CATS_DYNAMIC = cats.data.map((c) => c.name);
        if (CATS_DYNAMIC.length) {
          CATS.length = 0;
          CATS_DYNAMIC.forEach((c) => CATS.push(c));
        }
      }
    } catch (_) {}
    if (ST.token && ST.user) {
      if (ST.user.role === "admin") {
        const [us, ms, mt, rt] = await Promise.all([
          API.req("/api/users").catch(() => ({ data: [] })),
          API.req("/api/messages").catch(() => ({ data: [] })),
          API.req("/api/matches").catch(() => ({ data: [] })),
          API.req("/api/returns").catch(() => ({ data: [] })),
        ]);
        DB.users = us.data || [];
        DB.msgs = (ms.data || []).map(mapMsg);
        DB.matches = mt.data || [];
        DB.returns = rt.data || [];
      } else {
        const ms = await API.req("/api/messages").catch(() => ({ data: [] }));
        DB.msgs = (ms.data || []).map(mapMsg);
        if (ST.user.role === "user") {
          try {
            const mine = await API.req("/api/reports?user_id=" + ST.user.id);
            const mineMapped = (mine.data || []).map(mapReport);
            const ids = new Set(mineMapped.map((r) => r.id));
            DB.reports = [
              ...mineMapped,
              ...DB.reports.filter((r) => !ids.has(r.id)),
            ];
          } catch (_) {}
        }
      }
    }
  } catch (e) {
    console.warn("refreshStore gagal:", e.message);
  }
}

// saveDB/resetDB dihapus untuk produksi: tidak ada localStorage/demo.
// Hapus data lewat endpoint DELETE per-item (dicatat audit log).

// Kedaluwarsa 3 hari dihitung backend (approved_at + 3 hari -> expired_at).
function checkExpirations() {}

let ST = {
  user: null,
  token: sessionStorage.getItem("LF_TOKEN") || null, // JWT backend (produksi)
  auth: "login", // 'login' | 'reg' | 'reg-success'
  view: "",
  q: "",
  fc: "",
  fl: "",
  fs: "",
  fg: "",
  chat: null, // target user ID for admin/petugas view
  chatReportId: null, // item context being discussed
  draft: "",
  pendingChat: null, // if user clicked chat before login
};

// API backend (produksi, wajib). Tidak ada mode offline/demo.
const API = {
  base: "",
  async req(path, { method = "GET", body, form } = {}) {
    const headers = {};
    if (ST.token) headers.Authorization = `Bearer ${ST.token}`;
    let payload;
    if (form) {
      payload = form; // FormData (upload KTM): jangan set Content-Type manual
    } else if (body !== undefined) {
      headers["Content-Type"] = "application/json";
      payload = JSON.stringify(body);
    }
    const res = await fetch(`${API.base}${path}`, {
      method,
      headers,
      body: payload,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.success === false) {
      throw new Error(data.message || `Gagal memuat (${res.status})`);
    }
    return data;
  },
};

const useApi = () => true;

function setSession(user, token) {
  ST.user = user;
  ST.token = token || null;
  if (token) sessionStorage.setItem("LF_TOKEN", token);
  else sessionStorage.removeItem("LF_TOKEN");
}

const $ = (s) => document.querySelector(s);
const uname = (id) => (DB.users.find((u) => u.id === id) || {}).name || "-";
const uobj = (id) => DB.users.find((u) => u.id === id) || {};
const badge = (s) => `<span class="badge ${s}">${S[s] || s}</span>`;
const opts = (a) => a.map((c) => `<option>${c}</option>`).join("");

function toast(m) {
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = m;
  document.body.append(t);
  setTimeout(() => {
    t.classList.add("leaving");
    setTimeout(() => t.remove(), 260);
  }, 2800);
}

function setR(id, st) {
  // Ganti set lokal: pakai endpoint approve admin (ACTIVE/REJECTED).
  const approve = st !== "REJECTED";
  API.req(`/api/reports/${id}/approve`, { method: "PATCH", body: { approve } })
    .then((r) => {
      toast(r.message);
      refreshStore().then(() => app());
    })
    .catch((e) => toast(e.message));
}

const exp = (r) => {
  if (r.expired_at) return new Date(r.expired_at);
  if (!r.appr) return null;
  const e = new Date(r.appr);
  e.setDate(e.getDate() + 3);
  return e;
};

const locOf = (f) =>
  f.l.value + (f.kn && f.kn.value.trim() ? " " + f.kn.value.trim() : "");

const locOpts = (g) =>
  LOCS.filter((x) => x.startsWith(g + " - "))
    .map((x) => `<option value="${x}">${x.slice(g.length + 3)}</option>`)
    .join("");

function gdg(e) {
  const f = e.form;
  f.l.innerHTML = locOpts(e.value);
  f.kn.value = "";
  kls(f.l);
}

function kls(e) {
  const f = e.form;
  const on = /Ruang kelas$/.test(e.value);
  const n = e.value.startsWith("Gedung A") ? 4 : 3;
  const knEl = f.querySelector(".kn");
  if (!knEl) return;
  knEl.style.display = on ? "" : "none";
  knEl.querySelector("label").textContent = `Nomor ruang kelas (${n} digit)`;
  f.kn.required = on;
  f.kn.maxLength = n;
  f.kn.minLength = n;
  f.kn.pattern = `[0-9]{${n}}`;
  f.kn.title = `Isi ${n} digit angka`;
  f.kn.placeholder = n === 4 ? "Contoh: 1305" : "Contoh: 305";
  if (!on) f.kn.value = "";
}

const nav = (v) => {
  ST.view = v;
  ST.q = ST.fc = ST.fl = ST.fs = ST.fg = ST.ft = "";
  closeAllDlg();
  render();
};

async function render() {
  if (ST.user) {
    await refreshStore();
    return app();
  }
  // Restore sesi JWT setelah refresh. Gagal -> anggap belum login.
  if (ST.token && !ST._meTried) {
    ST._meTried = true;
    try {
      const r = await API.req("/api/auth/me");
      ST.user = r.user;
      return enterAppByRole(r.user);
    } catch (_) {
      setSession(null, null);
      ST._meTried = false;
    }
  }
  // Halaman publik butuh data forum dari API (tanpa login).
  const h = location.hash;
  // Portal staf lama (#/staff, #/admin, #/petugas) dilebur ke satu pintu masuk #/masuk.
  if (h === "#/admin" || h === "#/petugas" || h === "#/staff") {
    location.hash = "#/masuk";
    ST.auth = "login";
    return auth();
  }
  if (h === "#/masuk") return auth();
  await refreshStore();
  return beranda();
}

function beranda() {
  const activeReports = DB.reports.filter(
    (r) => r.status === "ACTIVE" || r.status === "FOUND",
  ).length;
  const officialFound = DB.found.filter(
    (f) => f.status === "APPROVED" || f.status === "MATCHED",
  ).length;
  const waiting = DB.reports.filter((r) => r.status === "PENDING").length;
  const returned = DB.reports.filter((r) => r.status === "RETURNED").length;

  $("#root").innerHTML = `
    <header class="public-header">
      ${logo}
      <nav class="public-nav" aria-label="Navigasi utama">
        <a class="public-nav-link" href="#" onclick="event.preventDefault();document.querySelector('#main')?.scrollIntoView({behavior:'smooth'});">Forum barang</a>
        <button class="btn sm" onclick="goLogin()">Masuk</button>
      </nav>
    </header>

    <section class="home-hero" aria-labelledby="home-title">
      <div class="home-hero-inner">
        <div class="home-hero-copy">
          <span class="home-eyebrow"><span class="home-eyebrow-dot"></span> LAYANAN RESMI KAMPUS</span>
          <h1 id="home-title">Barang hilang? <span>Mari temukan kembali.</span></h1>
          <p>Temukan informasi barang temuan, laporkan barang yang hilang, dan pantau prosesnya melalui satu layanan kampus yang mudah digunakan.</p>
          <div class="home-actions" aria-label="Pilihan tindakan">
            <button class="btn home-btn-primary" onclick="goLogin('Masuk untuk membuat laporan kehilangan')">${ic(IC.chat)} Laporkan Barang Hilang</button>
            <button class="btn home-btn-secondary" onclick="focusForumSearch()">${ic(IC.logo)} Cari Barang</button>
          </div>
          <p class="home-note">Satu tombol <b>Masuk</b> untuk semua peran: mahasiswa, petugas, dan admin akan otomatis diarahkan ke tampilannya masing-masing setelah masuk. Mahasiswa dapat membuat laporan kehilangan. Barang yang ditemukan wajib diserahkan kepada petugas atau Admin Kemahasiswaan.</p>
        </div>
        <div class="home-hero-art" aria-hidden="true">
          <div class="hero-orbit hero-orbit-one"></div><div class="hero-orbit hero-orbit-two"></div>
          <div class="hero-search-card"><span class="hero-icon-wrap">${ic(IC.logo)}</span><div><b>Lost & Found Kampus</b><small>Satu tempat untuk mencari dan melaporkan</small></div><span class="hero-check">${ic(IC.check)}</span></div>
          <div class="hero-mini-card hero-mini-top"><span class="hero-mini-icon">${ic(IC.photo)}</span><span><b>Barang temuan</b><small>Informasi resmi kampus</small></span></div>
          <div class="hero-mini-card hero-mini-bottom"><span class="hero-mini-icon green">${ic(IC.chat)}</span><span><b>Bantuan admin</b><small>Verifikasi lebih terarah</small></span></div>
        </div>
      </div>
    </section>

    <section class="home-stats-section" aria-label="Ringkasan data layanan">
      <div class="home-stats">
        <div class="home-stat"><span class="home-stat-icon blue">${ic(IC.chat)}</span><div><b>${activeReports}</b><span>Laporan aktif</span></div></div>
        <div class="home-stat"><span class="home-stat-icon green">${ic(IC.check)}</span><div><b>${officialFound}</b><span>Barang temuan resmi</span></div></div>
        <div class="home-stat"><span class="home-stat-icon amber">${ic(IC.eye)}</span><div><b>${waiting}</b><span>Menunggu verifikasi</span></div></div>
        <div class="home-stat"><span class="home-stat-icon purple">${ic(IC.shield)}</span><div><b>${returned}</b><span>Sudah dikembalikan</span></div></div>
      </div>
    </section>

    <section class="home-rules">
      <div class="home-rules-inner"><span class="home-rules-icon">${ic(IC.shield)}</span><div><b>Prosedur barang temuan</b><p>Jika menemukan barang di lingkungan kampus, serahkan langsung kepada Petugas Keamanan atau Admin Kemahasiswaan. Barang akan diperiksa sebelum diumumkan secara resmi.</p></div><span class="home-rule-time">Laporan aktif hingga 3 hari setelah disetujui</span></div>
    </section>

    <main id="main" class="home-main"></main>

    <footer class="public-footer">
      <div class="public-footer-inner">
        <div class="footer-brand">${logo}<p>Layanan informasi barang hilang dan temuan di lingkungan kampus.</p></div>
        <div class="footer-column"><b>Jelajahi</b><a href="#" onclick="event.preventDefault();document.querySelector('#main')?.scrollIntoView({behavior:'smooth'});">Forum barang</a><button onclick="focusForumSearch()">Cari barang</button><button onclick="goLogin('Masuk untuk membuat laporan kehilangan')">Lapor kehilangan</button></div>
        <div class="footer-column"><b>Bantuan & akses</b><button onclick="goLogin()">Masuk ke akun Anda</button><span>Satu tombol Masuk untuk mahasiswa, petugas, dan admin. Barang temuan diproses melalui Petugas Keamanan / Admin Kemahasiswaan.</span></div>
      </div>
      <div class="footer-bottom"><span>© ${new Date().getFullYear()} Lost & Found Kampus</span><span>Gunakan layanan dengan jujur dan bertanggung jawab.</span></div>
    </footer>
  `;
  V.forum();
}

function focusForumSearch() {
  const search = $("#sq");
  if (search) {
    search.focus({ preventScroll: true });
    search.scrollIntoView({ behavior: "smooth", block: "center" });
    search.closest(".fv-search")?.classList.add("search-focused");
    setTimeout(
      () => search.closest(".fv-search")?.classList.remove("search-focused"),
      1100,
    );
  } else {
    $("#main")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function goLogin(m) {
  closeAllDlg();
  ST.auth = "login";
  if (m) toast(m);
  location.hash = "#/masuk";
  render();
}

// Logo diklik: kembali ke halaman awal.
// - Belum login -> Beranda publik (#/)
// - Sudah login -> Dashboard awal sesuai peran (admin/petugas: dash, mahasiswa: forum)
function goHome() {
  closeAllDlg();
  if (!ST.user) {
    location.hash = "#/";
    return render();
  }
  if (ST.user.role === "admin") {
    ST.view = "dash";
  } else if (ST.user.role === "petugas") {
    ST.view = "dash_petugas";
  } else {
    ST.view = "forum";
  }
  ST.q = ST.fc = ST.fl = ST.fs = ST.fg = ST.ft = "";
  return render();
}

window.addEventListener("hashchange", () => {
  if (!ST.user) render();
});

function pw(id) {
  return `<div class="pw"><input id="${id}" type="password" placeholder="Masukkan kata sandi" autocomplete="off"><button type="button" aria-label="Tampilkan kata sandi" onclick="tpw('${id}',this)">${ic(IC.eye)}</button></div>`;
}

function tpw(id, b) {
  const i = $("#" + id);
  if (!i) return;
  const s = i.type === "password";
  i.type = s ? "text" : "password";
  // Ganti ikon tanpa menggeser posisi tombol (ikon selalu 18px, rata tengah).
  b.innerHTML = ic(s ? IC.off : IC.eye);
  b.setAttribute(
    "aria-label",
    s ? "Sembunyikan kata sandi" : "Tampilkan kata sandi",
  );
  // Jaga fokus tetap di input agar tidak ada lompatan layout.
  try {
    i.focus({ preventScroll: true });
  } catch (_) {
    i.focus();
  }
  try {
    const v = i.value;
    i.setSelectionRange(v.length, v.length);
  } catch (_) {}
}

// Satu pintu masuk untuk semua peran (mahasiswa / petugas / admin).
// Peran dibaca dari data akun saat login, lalu otomatis diarahkan ke tampilannya.
// Regist mahasiswa: Cara B (upload KTM + ACC manual admin), tanpa OTP.
function auth() {
  const mode =
    ST.auth === "reg"
      ? "reg"
      : ST.auth === "reg-success"
        ? "reg-success"
        : "login";
  if (mode === "reg-success") return authRegSuccess();
  const reg = mode === "reg";
  $("#root").innerHTML = `
    <div class="auth">
      <div class="hero">
        <div>
          ${logo.replace("<div", "<div style='margin-bottom:48px'")}
          <h1>Barang hilang kembali ke pemilik lewat satu pintu resmi.</h1>
          <p>Satu tombol Masuk untuk semua peran. Mahasiswa, petugas, dan admin masuk dari sini — sistem otomatis mengarahkan sesuai jenis akun.</p>
        </div>
        <ol class="steps">
          <li><em>1</em><span><b>Masuk sesuai akun Anda</b>Mahasiswa memakai NIM, petugas & admin memakai username.</span></li>
          <li><em>2</em><span><b>Diarahkan otomatis</b>Akun admin ke Dashboard Admin, petugas ke Dashboard Petugas, mahasiswa ke Forum.</span></li>
          <li><em>3</em><span><b>Belum punya akun?</b>Daftar sebagai mahasiswa dengan NIM resmi + foto KTM, lalu diverifikasi Admin.</span></li>
        </ol>
      </div>
      <div class="pane">
        <div class="box">
          <button type="button" class="btn ghost sm" style="margin-bottom:16px" onclick="location.hash='#/'">&larr; Kembali ke Beranda</button>
          <div class="tabs">
            <button class="${reg ? "" : "on"}" onclick="ST.auth='login';render()">Masuk</button>
            <button class="${reg ? "on" : ""}" onclick="ST.auth='reg';render()">Daftar Akun</button>
          </div>
          <h2>${reg ? "Pendaftaran Mahasiswa" : "Masuk"}</h2>
          <p class="sub">${reg ? "Gunakan data identitas dan NIM resmi Anda. Wajib upload foto KTM — akun aktif setelah diverifikasi Admin." : "Mahasiswa masuk dengan NIM, petugas & admin masuk dengan username. Kata sandi wajib diisi."}</p>
          <form onsubmit="event.preventDefault();doAuth(this)">
            ${reg ? `<div class="f"><label>Nama lengkap</label><input id="rn" placeholder="Contoh: Rina Marlina" required autocomplete="off"></div>` : ""}
            <div class="f"><label>${reg ? "NIM" : "NIM / Username"}</label><input id="login_id" inputmode="text" placeholder="${reg ? "Contoh: 2211001" : "Contoh: 2211001 / admin / petugas"}" required autocomplete="off"></div>
            ${reg ? `<div class="f"><label>Program studi</label><select id="rp" required><option value="">— Pilih program studi —</option>${prodiOpts()}</select></div>` : ""}
            <div class="f"><label>Kata sandi${reg ? " (min. 6 karakter)" : ""}</label>${pw("pw")}</div>
            ${
              reg
                ? `<div class="f"><label>Konfirmasi kata sandi</label>${pw("pw2")}</div>
            <div class="f"><label>Foto KTM <span style="color:var(--err)">*</span></label><input id="ktm" type="file" accept="image/jpeg,image/png,image/webp" required onchange="previewImg(this,'#preview-ktm')"><img id="preview-ktm" class="img-preview" style="display:none;max-width:100%;max-height:200px;object-fit:contain;margin-top:8px;border-radius:8px"><small class="meta">JPG/PNG/WEBP, maks 15 MB (otomatis dikecilkan). Dipakai Admin untuk verifikasi identitas.</small></div>`
                : ""
            }
            <button class="btn block">${reg ? "Kirim Pendaftaran" : "Masuk"}</button>
          </form>
          <p class="hint">Pendaftaran hanya untuk mahasiswa. Petugas & admin dibuat oleh pengelola sistem. Klik "Lupa Password?" untuk reset via email.</p>
        </div>
      </div>
    </div>
  `;
}

// Layar sukses setelah daftar Cara B: akun PENDING, tanpa auto-login.
function authRegSuccess() {
  $("#root").innerHTML = `
    <div class="auth">
      <div class="hero">
        <div>
          ${logo.replace("<div", "<div style='margin-bottom:48px'")}
          <h1>Pendaftaran diterima.</h1>
          <p>Akun Anda menunggu verifikasi Admin. Anda akan bisa masuk setelah Admin menyetujui foto KTM dan data NIM Anda.</p>
        </div>
        <ol class="steps">
          <li><em>1</em><span><b>Admin memeriksa KTM</b>Pastikan NIM, nama, dan prodi sesuai kartu identitas.</span></li>
          <li><em>2</em><span><b>Jika disetujui</b>Anda bisa masuk dengan NIM + kata sandi.</span></li>
          <li><em>3</em><span><b>Jika ditolak</b>Alasan penolakan tampil saat Anda mencoba masuk.</span></li>
        </ol>
      </div>
      <div class="pane">
        <div class="box">
          <div class="info-banner"><b>Pendaftaran berhasil dikirim.</b><br>Simpan NIM Anda. Coba masuk lagi setelah Admin melakukan verifikasi.</div>
          <button class="btn block" onclick="ST.auth='login';render()">Kembali ke Masuk</button>
          <p class="hint"><a href="#/">Kembali ke Beranda</a></p>
        </div>
      </div>
    </div>
  `;
}

// Kecilkan foto KTM di browser: sisi terpanjang <= 1280px, JPEG, ukuran <= ~450 KB.
// Teks pada KTM tetap terbaca, tetapi aman untuk MySQL (max_allowed_packet).
function shrinkKtm(file, maxSide = 1280, maxBytes = 450 * 1024) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("File bukan gambar yang valid."));
    };
    img.onload = () => {
      URL.revokeObjectURL(url);
      const k = Math.min(1, maxSide / Math.max(img.width, img.height));
      const cv = document.createElement("canvas");
      cv.width = Math.max(1, Math.round(img.width * k));
      cv.height = Math.max(1, Math.round(img.height * k));
      const ctx = cv.getContext("2d");
      ctx.fillStyle = "#fff"; // PNG transparan -> latar putih
      ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.drawImage(img, 0, 0, cv.width, cv.height);
      const tryQ = (q) =>
        cv.toBlob(
          (blob) => {
            if (!blob) return reject(new Error("Gagal memproses foto KTM."));
            if (blob.size <= maxBytes || q <= 0.45) return resolve(blob);
            tryQ(q - 0.1);
          },
          "image/jpeg",
          q,
        );
      tryQ(0.85);
    };
    img.src = url;
  });
}

async function doAuth(form) {
  const idEl = $("#login_id");
  const pwEl = $("#pw");
  const id = idEl ? idEl.value.trim() : "";
  const p = pwEl ? pwEl.value : "";
  if (ST.auth === "reg") {
    const n = $("#rn").value.trim();
    const pr = $("#rp").value;
    const p2 = $("#pw2").value;
    const ktm = $("#ktm").files[0];
    if (!n || !id || !pr || !p || !p2)
      return toast("Lengkapi semua data pendaftaran.");
    if (!/^[0-9]{5,15}$/.test(id))
      return toast("NIM harus berupa angka (5-15 digit).");
    if (!PRODI_LIST.includes(pr))
      return toast("Pilih program studi dari daftar resmi.");
    if (p.length < 6) return toast("Kata sandi minimal 6 karakter.");
    if (p !== p2) return toast("Konfirmasi kata sandi tidak sama.");
    if (!ktm) return toast("Foto KTM wajib diunggah.");
    if (!/^image\/(jpeg|png|webp)$/.test(ktm.type))
      return toast("Foto KTM harus JPG, PNG, atau WEBP.");
    if (ktm.size > 15 * 1024 * 1024) return toast("Foto KTM maksimal 15 MB.");
    // Kirim multipart ke backend (bcrypt + status PENDING + audit).
    try {
      const fd = new FormData();
      fd.append("name", n);
      fd.append("nim", id);
      fd.append("prodi", pr);
      fd.append("password", p);
      fd.append("confirm", p2);
      // Foto KTM dikecilkan dulu (maks ~450 KB) agar muat di batas paket MySQL.
      const ktmSmall = await shrinkKtm(ktm);
      fd.append("ktm", ktmSmall, "ktm.jpg");
      await API.req("/api/auth/register", { method: "POST", form: fd });
      ST.auth = "reg-success";
      toast("Pendaftaran diterima. Menunggu verifikasi Admin.");
      return render();
    } catch (e) {
      return toast(e.message);
    }
  }
  if (!id || !p) return toast("Isi NIM/username dan kata sandi.");
  // Login satu pintu via backend (bcrypt + JWT + cek ACTIVE).
  try {
    const r = await API.req("/api/auth/login", {
      method: "POST",
      body: { identifier: id, password: p },
    });
    setSession(r.user, r.token);
    ST.auth = "login";
    return enterAppByRole(r.user);
  } catch (e) {
    return toast(e.message);
  }
}

// Klasifikasi peran dari data akun: admin -> Dashboard Admin,
// petugas -> Dashboard Petugas, mahasiswa -> Forum (atau chat tertunda).
function enterAppByRole(u) {
  if (ST.pendingChat) return afterLoginCheck();
  if (u.role === "admin") {
    ST.view = "dash";
    toast("Masuk sebagai Admin Kemahasiswaan");
    return render();
  }
  if (u.role === "petugas") {
    ST.view = "dash_petugas";
    toast("Masuk sebagai Petugas Kampus");
    return render();
  }
  toast("Selamat datang, " + u.name);
  return afterLoginCheck();
}

function afterLoginCheck() {
  if (ST.pendingChat) {
    const { rid } = ST.pendingChat;
    ST.pendingChat = null;
    chatAbout(rid);
  } else {
    ST.view = "forum";
    render();
  }
}

function logout() {
  ST.user = null;
  ST.token = null;
  sessionStorage.removeItem("LF_TOKEN");
  ST.view = "";
  ST.chat = null;
  ST.chatReportId = null;
  ST.auth = "login";
  location.hash = "#/";
  render();
}

const esc = (s) =>
  String(s || "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );

function unread() {
  if (!ST.user) return 0;
  const a = ST.user.role === "admin";
  const p = ST.user.role === "petugas";
  if (a) {
    return DB.msgs.filter((m) => !m.read && m.from === "user").length;
  }
  if (p) {
    return 0;
  }
  return DB.msgs.filter(
    (m) => !m.read && m.from === "admin" && m.uid === ST.user.id,
  ).length;
}

function markRead() {
  if (!ST.user) return;
  const a = ST.user.role === "admin";
  const uid = a ? ST.chat : ST.user.id;
  if (!uid) return;
  DB.msgs.forEach((m) => {
    if (m.uid === uid && m.from === (a ? "user" : "admin") && !m.read)
      m.read = true;
  });
  API.req("/api/messages/read", {
    method: "PATCH",
    body: { user_id: uid },
  }).catch(() => {});
}

// Enhanced Chat: Start chat linked to uploaded item
function chatAbout(rid) {
  closeAllDlg();
  const r = DB.reports.find((x) => x.id === rid);
  if (!r) return;

  if (!ST.user) {
    ST.pendingChat = { rid };
    goLogin(
      `Silakan masuk terlebih dahulu untuk berkonsultasi via chat mengenai "${r.name}".`,
    );
    return;
  }

  if (ST.user.role === "admin") {
    ST.chat = r.uid;
    ST.chatReportId = rid;
    ST.draft = `Mengenai laporan "${r.name}": `;
    nav("pesan");
    return;
  }

  if (ST.user.role === "petugas") {
    toast("Sebagai Petugas, koordinasikan langsung dengan Admin");
    return;
  }

  // Student chatting with Admin about this item
  ST.chatReportId = rid;
  ST.draft = "";
  nav("pesan");
}

function chatAboutFound(fid) {
  closeAllDlg();
  const f = DB.found.find((x) => x.id === fid);
  if (!f) return;

  if (!ST.user) {
    ST.pendingFoundChat = { fid };
    goLogin(
      `Silakan masuk terlebih dahulu untuk berkonsultasi mengenai barang temuan "${f.name}".`,
    );
    return;
  }

  if (ST.user.role === "petugas") {
    toast("Sebagai Petugas, koordinasikan langsung dengan Admin");
    return;
  }

  ST.draft = `Halo Admin, saya ingin menanyakan mengenai barang temuan "${f.name}" (Kategori: ${f.cat}) yang ditemukan di ${f.loc}.`;
  nav("pesan");
}

async function sendM(f) {
  const t = f.t.value.trim();
  if (!t) return;
  const a = ST.user.role === "admin";
  if (a && !ST.chat) return toast("Pilih mahasiswa tujuan chat.");
  try {
    await API.req("/api/messages", {
      method: "POST",
      body: a
        ? { user_id: ST.chat, message: t, report_id: ST.chatReportId || null }
        : { message: t, report_id: ST.chatReportId || null },
    });
    f.t.value = "";
    await refreshStore();
  } catch (e) {
    return toast(e.message);
  }
  app();
  const i = $(".cf textarea");
  if (i) i.focus();
}

function quickSend(txt) {
  const tf = $(".cf textarea");
  if (tf) {
    tf.value = txt;
    tf.focus();
    tf.form.requestSubmit();
  }
}

async function app() {
  const role = ST.user.role;
  const a = role === "admin";
  const p = role === "petugas";

  const pendReports = DB.reports.filter((r) => r.status === "PENDING").length;
  const pendFound = DB.found.filter(
    (f) => f.status === "PENDING_APPROVAL",
  ).length;
  const foundItemsCount = DB.reports.filter((r) => r.status === "FOUND").length;
  const unr = unread();

  if (ST.view === "pesan") {
    if (a && (!ST.chat || !DB.users.some((u) => u.id === ST.chat))) {
      const sorted = getSortedStudentsForAdmin();
      if (sorted.length) ST.chat = sorted[0].id;
    }
    markRead();
  }

  let M = [];
  if (a) {
    M = [
      ["Utama"],
      ["dash", "Dashboard"],
      ["pesan", "Pesan / Chat", unr],
      ["Laporan Barang Hilang"],
      ["masuk", "Hilang Masuk — Verifikasi", pendReports],
      ["forum", "Forum Lost & Found"],
      ["Laporan Barang Ditemukan"],
      ["acc_temuan", "Temuan Masuk — ACC", pendFound],
      ["input_admin", "Catat Temuan Langsung"],
      ["Pencocokan & Penyerahan"],
      ["cocok", "Pencocokan Barang"],
      ["kembali", "Pengembalian", foundItemsCount],
      ["Data Master"],
      ["users", "Data Mahasiswa"],
      ["petugas_data", "Data Petugas"],
      ["riwayat", "Riwayat & Arsip"],
    ];
  } else if (p) {
    M = [
      ["Utama"],
      ["dash_petugas", "Dashboard Petugas"],
      ["Barang Temuan"],
      ["input_temuan", "Catat Barang Temuan"],
      ["riwayat_petugas", "Riwayat Barang Diterima"],
      ["Forum & Akun"],
      ["forum", "Forum Lost & Found"],
      ["profil", "Profil Petugas"],
    ];
  } else {
    M = [
      ["forum", "Forum Lost & Found"],
      ["lapor", "Laporkan Kehilangan"],
      ["saya", "Laporan Saya"],
      ["pesan", "Pesan ke Admin", unr],
      ["profil", "Profil"],
    ];
  }

  if (!ST.view) {
    ST.view = M.find((m) => m.length > 1)[0];
  }

  closeSide();

  const roleText = a
    ? "Administrator Kemahasiswaan"
    : p
      ? "Petugas Keamanan / Kampus"
      : "NIM " + ST.user.nim;
  const userInitial = esc((ST.user.name || "?").trim().charAt(0).toUpperCase());
  const logoImg = `<img src="assets/logo.png" alt="Logo Lost & Found Kampus">`;

  $("#root").innerHTML = `
    <div class="app">
      <aside id="side" aria-label="Navigasi utama">
        <div class="logo" onclick="goHome()" style="cursor:pointer" data-tip="Lost & Found Kampus">
          ${logoImg}<span class="logo-txt">Lost & Found Kampus</span>
        </div>
        <button class="side-close" type="button" aria-label="Tutup menu" onclick="closeSide()">${ic(NAV_IC.close)}</button>
        ${M.map((m) =>
          m.length === 1
            ? `<div class="grp">${m[0]}</div>`
            : `<button class="nav ${ST.view === m[0] ? "on" : ""}" data-tip="${esc(m[1] + (m[2] ? " (" + m[2] + ")" : ""))}" aria-label="${esc(m[1])}" onclick="nav('${m[0]}')">
                <span class="nav-ic" aria-hidden="true">${navIcon(m[0])}</span>
                <span class="nav-txt">${m[1]}</span>
                ${m[2] ? `<span class="cnt">${m[2]}</span>` : ""}
              </button>`,
        ).join("")}
        <div class="me">
          <div class="me-info" tabindex="0" data-tip="${esc(ST.user.name)} — ${esc(roleText)}">
            <span class="me-av" aria-hidden="true">${userInitial}</span>
            <span class="me-txt"><b>${esc(ST.user.name)}</b><span class="me-role">${esc(roleText)}</span></span>
          </div>
          <button class="me-out" type="button" data-tip="Keluar Akun" aria-label="Keluar Akun" onclick="closeSide();logout()">
            ${ic(NAV_IC.logout)}<span class="me-out-txt">Keluar Akun</span>
          </button>
        </div>
      </aside>
      <div class="m-bar">
        <button class="m-burger" type="button" aria-label="Buka menu" aria-controls="side" aria-expanded="false" onclick="toggleSide()">${ic(NAV_IC.menu)}</button>
        <div class="m-brand" onclick="goHome()">${logoImg}<span>Lost & Found Kampus</span></div>
      </div>
      <div class="side-overlay" onclick="closeSide()"></div>
      <main id="main"></main>
    </div>
  `;

  if (V[ST.view]) {
    await V[ST.view]();
  } else {
    V.forum();
  }
}

const head = (t, p, x = "") =>
  `<div class="head"><div><h1>${t}</h1><p>${p}</p></div>${x}</div>`;

const sel = (k, arr, ph, lab) =>
  `<select onchange="ST.${k}=this.value;refreshForum()"><option value="">${ph}</option>${arr.map((o) => `<option value="${o}" ${ST[k] === o ? "selected" : ""}>${lab ? lab[o] : o}</option>`).join("")}</select>`;

const locFilter = () =>
  `<select onchange="ST.fg=this.value;ST.fl='';refreshForum()"><option value="">Semua gedung</option>${["Gedung A", "Gedung B"].map((g) => `<option value="${g}" ${ST.fg === g ? "selected" : ""}>${g}</option>`).join("")}</select><select ${ST.fg ? "" : "disabled"} onchange="ST.fl=this.value;refreshForum()"><option value="">Semua lokasi</option>${LOCS.filter(
    (x) => ST.fg && x.startsWith(ST.fg + " - "),
  )
    .map(
      (x) =>
        `<option value="${x}" ${ST.fl === x ? "selected" : ""}>${x.slice(ST.fg.length + 3)}</option>`,
    )
    .join("")}</select>`;

const tbl = (cols, rows) =>
  `<div class="card tw"><table><thead><tr>${cols.map((c) => `<th>${c}</th>`).join("")}</tr></thead><tbody>${rows.length ? rows.join("") : `<tr><td colspan="${cols.length}" class="empty">Belum ada data.</td></tr>`}</tbody></table></div>`;

function refreshForum() {
  const m = $("#main");
  if (m) m.classList.add("no-enter");
  V.forum();
}
function searchForum(value) {
  ST.q = value;
  clearTimeout(window.tm);
  window.tm = setTimeout(() => {
    const box = $("#forum-results");
    if (!box) return;
    $("#main").classList.add("no-enter");
    box.innerHTML = forumResults();
    const clr = $(".fv-search-clear");
    if (clr) clr.hidden = !ST.q;
  }, 150);
}
function clearForumSearch() {
  ST.q = "";
  const input = $("#sq");
  if (input) {
    input.value = "";
    input.focus();
  }
  const box = $("#forum-results");
  if (box) {
    $("#main").classList.add("no-enter");
    box.innerHTML = forumResults();
  }
  const clr = $(".fv-search-clear");
  if (clr) clr.hidden = true;
}
function resetForumFilters() {
  ST.q = "";
  ST.fc = "";
  ST.fg = "";
  ST.fl = "";
  ST.fs = "";
  ST.ft = "";
  refreshForum();
}

// forumResults() kini ada di dashboard-ui.js

const V = {
  // 1. Forum Lost & Found
  forum() {
    renderForum(); // tampilan baru: dashboard-ui.js
  },

  // 2. Mahasiswa: Buat Laporan Kehilangan
  lapor() {
    $("#main").innerHTML =
      head(
        "Laporkan Barang Hilang",
        "Laporan akan diperiksa Admin terlebih dahulu sebelum dipublikasikan ke forum (Maksimal aktif 3 hari).",
      ) +
      `
      <div class="info-banner">
        <b>Catatan Penting:</b> Mahasiswa hanya dapat mengunggah <b>Laporan Barang Hilang</b>. Apabila Anda menemukan barang milik orang lain, harap serahkan langsung kepada <b>Petugas Satpam / Admin Kemahasiswaan</b> di kampus.
      </div>
      <form class="card pad form" onsubmit="event.preventDefault();sendR(this)">
        <div class="f">
          <label>Nama barang <span style="color:var(--err)">*</span></label>
          <input name="n" required placeholder="Contoh: Dompet kulit hitam">
        </div>
        <div class="f">
          <label>Kategori <span style="color:var(--err)">*</span></label>
          <select name="c">${opts(CATS)}</select>
        </div>
        <div class="f">
          <label>Warna <span style="color:var(--err)">*</span></label>
          <input name="w" required placeholder="Contoh: Hitam pekat">
        </div>
        <div class="f">
          <label>Merk / Brand (jika ada)</label>
          <input name="b" placeholder="Contoh: Eiger, Casio, Xiaomi">
        </div>
        <div class="f">
          <label>Tanggal perkiraan hilang <span style="color:var(--err)">*</span></label>
          <input type="date" name="d" required value="2026-09-30">
        </div>
        <div class="f">
          <label>Gedung <span style="color:var(--err)">*</span></label>
          <select name="g" onchange="gdg(this)">
            <option>Gedung A</option>
            <option>Gedung B</option>
          </select>
        </div>
        <div class="f">
          <label>Lokasi terakhir terlihat <span style="color:var(--err)">*</span></label>
          <select name="l" onchange="kls(this)">${locOpts("Gedung A")}</select>
        </div>
        <div class="f kn">
          <label>Nomor ruang kelas (4 digit)</label>
          <input name="kn" inputmode="numeric" autocomplete="off" required maxlength="4" minlength="4" pattern="[0-9]{4}" title="Isi 4 digit angka" placeholder="Contoh: 1305" oninput="this.value=this.value.replace(/[^0-9]/g,'')">
        </div>
        <div class="f w">
          <label>Foto barang (opsional)</label>
          <input type="file" name="foto" accept="image/*" onchange="previewImg(this, '#preview-lapor')">
          <img id="preview-lapor" class="img-preview" style="display:none">
        </div>
        <div class="f w">
          <label>Deskripsi & ciri khusus yang hanya diketahui pemilik <span style="color:var(--err)">*</span></label>
          <textarea name="ds" required placeholder="Contoh: Di dalam dompet ada KTM atas nama Rina Marlina, stiker kecil bintang perak di pojok resleting."></textarea>
        </div>
        <div class="w" style="display:flex;gap:12px;align-items:center;margin-top:12px">
          <button class="btn">Kirim Laporan Kehilangan</button>
          <span style="font-size:12.5px;color:var(--mute)">Status laporan akan langsung diset menjadi <b>PENDING</b>.</span>
        </div>
      </form>
    `;
  },

  // 3. Mahasiswa: Laporan Saya
  saya() {
    const l = DB.reports.filter((r) => r.uid === ST.user.id);
    $("#main").innerHTML =
      head(
        "Laporan Saya",
        "Pantau status verifikasi, kecocokan temuan, dan konsultasikan via chat ke Admin.",
        `<button class='btn' onclick="nav('lapor')">Buat Laporan Baru</button>`,
      ) +
      tbl(
        ["Barang", "Lokasi", "Tanggal Lapor", "Status", "Aksi"],
        l.map(
          (r) =>
            `<tr>
              <td>
                <b>${esc(r.name)}</b>
                <div class="meta">${esc(r.cat)} &bull; ${esc(r.color)}</div>
              </td>
              <td>${esc(r.loc)}</td>
              <td>${fmt(r.date)}</td>
              <td>${badge(r.status)}</td>
              <td>
                <div class="act">
                  <button class="btn ghost sm detail-action" onclick="detail(${r.id})">Detail</button>
                  <button class="btn sm" onclick="chatAbout(${r.id})" title="Chat dengan admin mengenai laporan ini">Chat Admin</button>
                </div>
              </td>
            </tr>`,
        ),
      );
  },

  // 4. Mahasiswa / Admin: Fitur Chat & Pesan Terintegrasi
  pesan() {
    const a = ST.user.role === "admin";
    const me = a ? "admin" : "user";
    const us = a ? getSortedStudentsForAdmin() : [];

    if (a && (!ST.chat || !us.some((u) => u.id === ST.chat)) && us.length > 0) {
      ST.chat = us[0].id;
    }
    const uid = a ? ST.chat : ST.user.id;
    if (a && ST.chat) {
      markRead();
    }

    // Filter message list for active conversation
    const list = DB.msgs.filter((m) => m.uid === uid);
    const last = (id) => DB.msgs.filter((m) => m.uid === id).slice(-1)[0];
    const un = (id) =>
      DB.msgs.filter((m) => m.uid === id && m.from === "user" && !m.read)
        .length;

    // Associated Report if context exists
    const currentReport = ST.chatReportId
      ? DB.reports.find((r) => r.id === ST.chatReportId)
      : null;

    // Sidebar for Admin: mahasiswa dengan pesan terbaru selalu di paling atas
    const side = a
      ? `<div class="clist">
          <div class="clist-header">Percakapan Mahasiswa (${us.length})</div>
          ${us
            .map((u) => {
              const l = last(u.id);
              const n = un(u.id);
              const relatedMsg = DB.msgs
                .filter((m) => m.uid === u.id && m.rname)
                .slice(-1)[0];
              return `
              <button class="cu ${u.id === uid ? "on" : ""}" onclick="ST.chat=${u.id};app()">
                <span class="cu-av" aria-hidden="true">${esc((u.name || "?").trim().charAt(0).toUpperCase())}</span>
                <span class="cu-body">
                  <b>${esc(u.name)}</b>
                  <div class="meta">${esc(u.nim)} &bull; ${esc(u.prodi)}</div>
                  ${relatedMsg ? `<div class="item-tag">${esc(relatedMsg.rname)}</div>` : ""}
                  <div class="meta cu-last">${l ? esc(l.text) : "Belum ada pesan"}${l && l.at ? ` &bull; <time>${fmtClock(l.at)}</time>` : ""}</div>
                </span>
                ${n ? `<span class="cnt">${n}</span>` : ""}
              </button>
            `;
            })
            .join("")}
        </div>`
      : "";

    // Draft / Template Suggestion
    const draft = ST.draft;
    ST.draft = "";

    // Item Context Banner Header inside Chat
    const itemBanner = currentReport
      ? `
      <div class="chat-item-banner">
        <div class="chat-item-info">
          <div class="chat-item-thumb">
            ${currentReport.photo ? `<img src="${currentReport.photo}">` : ic(IC.photo)}
          </div>
          <div class="chat-item-text">
            <b>Membahas Barang: ${esc(currentReport.name)}</b>
            <span>${esc(currentReport.cat)} &bull; ${esc(currentReport.loc)} &bull; ${badge(currentReport.status)}</span>
          </div>
        </div>
        <div class="chat-item-actions">
          <button class="btn ghost sm detail-action" onclick="detail(${currentReport.id})">Lihat Detail Laporan</button>
          <button class="btn ghost sm" style="color:var(--mute)" onclick="ST.chatReportId=null;app()" title="Lepas topik barang">&times; Lepas Topik</button>
        </div>
      </div>
    `
      : "";

    // Quick Chips for Student or Admin
    const quickChips = a
      ? `
      <div class="quick-chips">
        <span class="quick-chip" onclick="quickSend('Halo, laporan Anda sudah kami periksa dan saat ini aktif di forum.')">Laporan diverifikasi</span>
        <span class="quick-chip" onclick="quickSend('Barang temuan yang cocok sudah kami amankan di Kemahasiswaan. Silakan datang membawa KTM.')">Cocok, silakan ambil</span>
        <span class="quick-chip" onclick="quickSend('Mohon sebutkan ciri khusus tambahan atau bukti kepemilikan untuk barang ini.')">Minta ciri khusus</span>
        <span class="quick-chip" onclick="quickSend('Petugas keamanan sedang memeriksa area penemuan terakhir.')">Sedang pencarian</span>
      </div>
    `
      : `
      <div class="quick-chips">
        <span class="quick-chip" onclick="quickSend('Halo Admin, bagaimana perkembangan pencarian barang yang saya upload ini?')">Status barang</span>
        <span class="quick-chip" onclick="quickSend('Halo Admin, saya melihat barang dengan ciri mirip di forum, apakah itu barang saya?')">Tanya kecocokan</span>
        <span class="quick-chip" onclick="quickSend('Halo Admin, saya ingin datang ke kantor untuk verifikasi kepemilikan barang.')">Jadwal verifikasi</span>
        <span class="quick-chip" onclick="quickSend('Halo Admin, saya ingin menambahkan detail ciri khusus pada barang saya.')">Tambah ciri khusus</span>
      </div>
    `;

    const activeUser = a ? uobj(uid) : null;
    const thread = uid
      ? `
      <div class="cth">
        <div class="who">
          <div>
            <b>${esc(a ? activeUser.name + " (" + activeUser.nim + ")" : "Admin Petugas Kemahasiswaan")}</b>
            <div style="font-size:12px;color:var(--mute);font-weight:normal">
              ${a ? esc(activeUser.prodi) : "Pusat Layanan Lost & Found Kampus"}
            </div>
          </div>
          ${currentReport ? `<span class="badge ${currentReport.status}">Topik: ${esc(currentReport.name)}</span>` : ""}
        </div>
        ${itemBanner}
        <div class="cb" id="cb">
          ${
            list.length
              ? chatBubbles(list, me)
              : `<div class="empty">Belum ada percakapan. Mulai chat Anda di bawah ini terkait barang yang di-upload.</div>`
          }
        </div>
        ${quickChips}
        <form class="cf" onsubmit="event.preventDefault();sendM(this)">
          <textarea name="t" rows="1" required placeholder="Ketik pesan Anda untuk Admin mengenai barang yang di-upload..." oninput="autoGrow(this)" onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();this.form.requestSubmit()}">${esc(draft)}</textarea>
          <button class="btn">Kirim</button>
        </form>
      </div>
    `
      : `<div class="empty">Belum ada data mahasiswa terdaftar.</div>`;

    $("#main").innerHTML =
      head(
        "Pesan & Konsultasi Admin",
        a
          ? "Konsultasikan langsung dengan mahasiswa mengenai laporan kehilangan dan barang temuan."
          : "Hubungi Admin Kemahasiswaan mengenai status laporan atau barang yang Anda upload.",
      ) + `<div class="card chat ${a ? "" : "solo"}">${side}${thread}</div>`;

    const cb = $("#cb");
    if (cb) cb.scrollTop = cb.scrollHeight;
    const ta = $(".cf textarea");
    if (ta && ta.value) autoGrow(ta);
  },

  // 5. Admin: Dashboard
  dash() {
    fvAdminDashboard(); // tampilan baru: dashboard-ui.js
  },

  // 6. Admin: Verifikasi Laporan Barang Hilang Masuk
  masuk() {
    const list = DB.reports.filter((r) => r.status === "PENDING");
    $("#main").innerHTML =
      head(
        "Laporan Barang Hilang Masuk — Verifikasi",
        "Laporan kehilangan yang dikirim mahasiswa. Periksa validitasnya sebelum disetujui tayang di forum (maksimal aktif 3 hari).",
      ) +
      tbl(
        [
          "Barang Hilang",
          "Pelapor",
          "Lokasi Hilang",
          "Status",
          "Tindakan Admin",
        ],
        list.map(
          (r) => `
          <tr>
            <td>
              <b>${esc(r.name)}</b>
              <div class="meta">${esc(r.cat)} &bull; ${esc(r.color)}</div>
            </td>
            <td>${esc(uname(r.uid))}</td>
            <td>${esc(r.loc)}</td>
            <td>${badge(r.status)}</td>
            <td>
              <div class="act">
                <button class="btn ghost sm detail-action" onclick="detail(${r.id})">Detail</button>
                <button class="btn sm" onclick="setR(${r.id}, 'ACTIVE');toast('Laporan barang hilang disetujui dan aktif di forum selama 3 hari');app()">Setujui (ACC)</button>
                <button class="btn bad sm" onclick="setR(${r.id}, 'REJECTED');toast('Laporan barang hilang ditolak');app()">Tolak</button>
                <button class="btn ghost sm" onclick="chatAbout(${r.id})">Chat</button>
              </div>
            </td>
          </tr>
        `,
        ),
      );
  },

  // 7. Admin: Verifikasi / ACC Laporan Barang Ditemukan Masuk
  acc_temuan() {
    const list = DB.found.filter((f) => f.status === "PENDING_APPROVAL");
    $("#main").innerHTML =
      head(
        "Laporan Barang Ditemukan Masuk — ACC",
        "Barang temuan yang diserahkan penemu ke petugas/admin. ACC agar tampil di forum sebagai barang temuan resmi.",
      ) +
      tbl(
        [
          "Barang Temuan",
          "Kategori",
          "Lokasi Temuan",
          "Diterima Oleh",
          "Tanggal Diterima",
          "Tindakan Admin",
        ],
        list.map(
          (f) => `
          <tr>
            <td>
              <b>${esc(f.name)}</b>
              <div class="meta">${esc(f.color || "-")} &bull; ${esc(f.brand || "-")}</div>
            </td>
            <td>${esc(f.cat)}</td>
            <td>${esc(f.loc)}</td>
            <td>${esc(f.received_by)}</td>
            <td>${fmt(f.date)}</td>
            <td>
              <div class="act">
                <button class="btn ghost sm detail-action" onclick="detailFound(${f.id})">Detail</button>
                <button class="btn sm" onclick="accFoundItem(${f.id})">Setujui (ACC)</button>
                <button class="btn bad sm" onclick="rejectFoundItem(${f.id})">Tolak</button>
              </div>
            </td>
          </tr>
        `,
        ),
      );
  },

  // 8. Admin: Catat Barang Temuan Langsung
  input_admin() {
    $("#main").innerHTML =
      head(
        "Catat Barang Temuan Langsung (Admin)",
        "Jika mahasiswa penemu menyerahkan barang langsung kepada Admin di kantor kemahasiswaan.",
      ) +
      `
      <form class="card pad form" onsubmit="event.preventDefault();submitFoundDirect(this)">
        <div class="f">
          <label>Nama barang temuan <span style="color:var(--err)">*</span></label>
          <input name="n" required placeholder="Contoh: Kunci motor Honda">
        </div>
        <div class="f">
          <label>Kategori <span style="color:var(--err)">*</span></label>
          <select name="c">${opts(CATS)}</select>
        </div>
        <div class="f">
          <label>Warna</label>
          <input name="w" placeholder="Contoh: Hitam">
        </div>
        <div class="f">
          <label>Merk</label>
          <input name="b" placeholder="Contoh: Honda">
        </div>
        <div class="f">
          <label>Gedung <span style="color:var(--err)">*</span></label>
          <select name="g" onchange="gdg(this)">
            <option>Gedung A</option>
            <option>Gedung B</option>
          </select>
        </div>
        <div class="f">
          <label>Lokasi ditemukan <span style="color:var(--err)">*</span></label>
          <select name="l" onchange="kls(this)">${locOpts("Gedung A")}</select>
        </div>
        <div class="f kn">
          <label>Nomor ruang kelas (4 digit)</label>
          <input name="kn" inputmode="numeric" autocomplete="off" required maxlength="4" minlength="4" pattern="[0-9]{4}" title="Isi 4 digit angka" placeholder="Contoh: 1305" oninput="this.value=this.value.replace(/[^0-9]/g,'')">
        </div>
        <div class="f w">
          <label>Foto barang temuan</label>
          <input type="file" name="foto" accept="image/*" onchange="previewImg(this, '#preview-admin-found')">
          <img id="preview-admin-found" class="img-preview" style="display:none">
        </div>
        <div class="f w">
          <label>Deskripsi & kondisi barang saat diterima</label>
          <textarea name="ds" placeholder="Kondisi barang, isi, dan tempat penyimpanan di kantor kemahasiswaan..."></textarea>
        </div>
        <div class="w">
          <button class="btn">Simpan Barang Temuan (Langsung APPROVED)</button>
        </div>
      </form>
    `;
  },

  // 9. Admin: Pencocokan Barang (Smart Matching)
  cocok() {
    const rs = DB.reports.filter((r) => r.status === "ACTIVE");
    const fs = DB.found.filter((f) => f.status === "APPROVED");
    const ok = rs.length && fs.length;

    // Smart recommendations
    const matchesSuggested = [];
    rs.forEach((r) => {
      fs.forEach((f) => {
        let score = 0;
        if (r.cat === f.cat) score += 2;
        if (
          r.color &&
          f.color &&
          r.color.toLowerCase() === f.color.toLowerCase()
        )
          score += 2;
        if (
          r.brand &&
          f.brand &&
          r.brand.toLowerCase() === f.brand.toLowerCase()
        )
          score += 2;
        if (r.loc && f.loc && r.loc.split(" - ")[0] === f.loc.split(" - ")[0])
          score += 1;
        if (score >= 2) {
          matchesSuggested.push({ r, f, score });
        }
      });
    });

    $("#main").innerHTML =
      head(
        "Pencocokan Barang",
        "Hubungkan barang temuan dengan laporan kehilangan yang sesuai.",
      ) +
      `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px">
        <div class="card pad">
          <h3 class="t">Form Hubungkan Manual</h3>
          <form onsubmit="event.preventDefault();doMatch(this)">
            <div class="f">
              <label>Pilih Barang Temuan (Tersimpan / Approved):</label>
              <select name="f" required>
                ${fs.map((f) => `<option value="${f.id}">${esc(f.name)} (${esc(f.loc)})</option>`).join("")}
              </select>
            </div>
            <div class="f">
              <label>Pilih Laporan Kehilangan (Aktif):</label>
              <select name="r" required>
                ${rs.map((r) => `<option value="${r.id}">${esc(r.name)} - ${esc(uname(r.uid))}</option>`).join("")}
              </select>
            </div>
            <button class="btn" ${ok ? "" : "disabled"}>Hubungkan dan Tandai Ditemukan (FOUND)</button>
            ${ok ? "" : `<p class="hint" style="text-align:left">Butuh minimal satu barang temuan tersimpan dan satu laporan aktif.</p>`}
          </form>
        </div>

        <div class="card pad">
          <h3 class="t">Saran Pencocokan Otomatis (${matchesSuggested.length})</h3>
          <p style="font-size:12.5px;color:var(--mute);margin:-4px 0 12px">Berdasarkan kesamaan kategori, merk, warna, dan lokasi.</p>
          ${
            matchesSuggested.length
              ? matchesSuggested
                  .map(
                    (m) => `
                <div class="match-item">
                  <div>
                    <b>${esc(m.r.name)} &harr; ${esc(m.f.name)}</b>
                    <div class="meta">${esc(m.r.cat)} &bull; ${esc(uname(m.r.uid))}</div>
                  </div>
                  <button class="btn sm" onclick="directMatch(${m.r.id}, ${m.f.id})">Cocokkan</button>
                </div>
              `,
                  )
                  .join("")
              : `<div class="empty" style="padding:20px">Belum ada saran pencocokan otomatis.</div>`
          }
        </div>
      </div>
    `;
  },

  // 10. Admin: Pengembalian Barang & Verifikasi Kepemilikan
  kembali() {
    const list = DB.reports.filter((r) => r.status === "FOUND");
    $("#main").innerHTML =
      head(
        "Pengembalian Barang",
        "Lakukan verifikasi kepemilikan sebelum barang diserahkan resmi kepada pemiliknya.",
      ) +
      tbl(
        ["Pelapor", "Barang Hilang", "Kontak / Chat", "Tindakan Verifikasi"],
        list.map((r) => {
          const u = uobj(r.uid);
          return `
          <tr>
            <td>
              <b>${esc(u.name)}</b>
              <div class="meta">NIM ${esc(u.nim)} &bull; ${esc(u.prodi)}</div>
            </td>
            <td>
              <b>${esc(r.name)}</b>
              <div class="meta">${esc(r.cat)} &bull; ${esc(r.loc)}</div>
            </td>
            <td>
              <button class="btn ghost sm" onclick="chatAbout(${r.id})">Hubungi Pelapor</button>
            </td>
            <td>
              <button class="btn sm" onclick="verif(${r.id})">Verifikasi & Serahkan</button>
            </td>
          </tr>
        `;
        }),
      );
  },

  // 11. Admin: Data Mahasiswa + Verifikasi Regist KTM (Cara B) via API
  async users() {
    $("#main").innerHTML = head(
      "Data Mahasiswa + Verifikasi Regist",
      "Memuat data mahasiswa dari server…",
    );
    try {
      const [p, a, rj] = await Promise.all([
        API.req("/api/users?role=user&status=PENDING").catch(() => ({
          data: [],
        })),
        API.req("/api/users?role=user&status=ACTIVE").catch(() => ({
          data: [],
        })),
        API.req("/api/users?role=user&status=REJECTED").catch(() => ({
          data: [],
        })),
      ]);
      DB.users = [...(p.data || []), ...(a.data || []), ...(rj.data || [])];
    } catch (e) {
      $("#main").innerHTML = head(
        "Data Mahasiswa + Verifikasi Regist",
        "Gagal memuat: " + e.message,
      );
      return;
    }
    const tab = ST.userTab || "pending";
    const pending = DB.users.filter(
      (u) => u.role === "user" && u.verification_status === "PENDING",
    );
    const active = DB.users.filter(
      (u) => u.role === "user" && u.verification_status === "ACTIVE",
    );
    const rejected = DB.users.filter(
      (u) => u.role === "user" && u.verification_status === "REJECTED",
    );
    // KTM: base64 langsung dari DB, atau path lama -> endpoint /uploads/ktm/<file>?token=...
    // (img/link tidak bisa kirim header Authorization, jadi token lewat query)
    const ktmSrc = (u) => {
      if (!u.ktm_photo) return "";
      if (/^data:image\//.test(u.ktm_photo)) return u.ktm_photo;
      if (/^(blob:|https?:)/.test(u.ktm_photo)) return u.ktm_photo;
      const file = String(u.ktm_photo).split("/").pop();
      return `/uploads/ktm/${encodeURIComponent(file)}?token=${encodeURIComponent(ST.token || "")}`;
    };
    const ktmCell = (u) =>
      u.ktm_photo
        ? `<a href="${ktmSrc(u)}" target="_blank" rel="noopener"><img src="${ktmSrc(u)}" alt="KTM ${esc(u.name)}" style="width:72px;height:48px;object-fit:cover;border-radius:6px;border:1px solid var(--line)" onerror="this.outerHTML='<span class=meta>Foto rusak</span>'"></a>`
        : `<span class="meta">Tanpa KTM</span>`;

    const pendingTbl = tbl(
      ["Mahasiswa + KTM", "NIM", "Program Studi", "Tindakan Admin"],
      pending.map(
        (u) => `
        <tr>
          <td><div style="display:flex;gap:10px;align-items:center">${ktmCell(u)}<div><b>${esc(u.name)}</b><div class="meta">Daftar: ${u.created_at ? fmt(u.created_at) : "-"}</div></div></div></td>
          <td>${esc(u.nim)}</td>
          <td>${esc(u.prodi)}</td>
          <td><div class="act">
            <button class="btn ghost sm detail-action" onclick="detailKtm(${u.id})">Lihat KTM</button>
            <button class="btn sm" onclick="verifyReg(${u.id}, true)">Setujui</button>
            <button class="btn bad sm" onclick="verifyReg(${u.id}, false)">Tolak</button>
          </div></td>
        </tr>`,
      ),
    );
    const activeTbl = tbl(
      ["Nama Lengkap", "NIM", "Program Studi", "Total Laporan", "Aksi"],
      active.map(
        (u) => `
        <tr>
          <td><b>${esc(u.name)}</b></td>
          <td>${esc(u.nim)}</td>
          <td>${esc(u.prodi)}</td>
          <td>${DB.reports.filter((r) => r.uid === u.id).length} laporan</td>
          <td><button class="btn ghost sm" onclick="ST.chat=${u.id};ST.chatReportId=null;nav('pesan')">Chat Mahasiswa</button></td>
        </tr>`,
      ),
    );
    const rejectedTbl = tbl(
      ["Nama", "NIM", "Alasan Ditolak", "Aksi"],
      rejected.map(
        (u) => `
        <tr>
          <td><b>${esc(u.name)}</b><div class="meta">${esc(u.prodi)}</div></td>
          <td>${esc(u.nim)}</td>
          <td>${esc(u.rejected_reason || "-")}</td>
          <td><button class="btn sm" onclick="verifyReg(${u.id}, true)">Setujui</button></td>
        </tr>`,
      ),
    );

    $("#main").innerHTML =
      head(
        "Data Mahasiswa + Verifikasi Regist",
        "Pendaftar baru wajib upload KTM. Setujui agar bisa masuk, atau tolak dengan alasan.",
      ) +
      `<div class="tabs" style="max-width:560px;margin-bottom:18px">
        <button class="${tab === "pending" ? "on" : ""}" onclick="ST.userTab='pending';app()">Perlu Verifikasi (${pending.length})</button>
        <button class="${tab === "active" ? "on" : ""}" onclick="ST.userTab='active';app()">Aktif (${active.length})</button>
        <button class="${tab === "rejected" ? "on" : ""}" onclick="ST.userTab='rejected';app()">Ditolak (${rejected.length})</button>
      </div>` +
      (tab === "pending"
        ? pendingTbl
        : tab === "rejected"
          ? rejectedTbl
          : activeTbl);
  },

  // 12. Admin: Data Petugas via API
  async petugas_data() {
    $("#main").innerHTML = head("Data Petugas Kampus", "Memuat…");
    try {
      const r = await API.req("/api/users?role=petugas");
      DB.users = [
        ...DB.users.filter((u) => u.role !== "petugas"),
        ...(r.data || []),
      ];
    } catch (e) {
      $("#main").innerHTML = head(
        "Data Petugas Kampus",
        "Gagal memuat: " + e.message,
      );
      return;
    }
    const list = DB.users.filter((u) => u.role === "petugas");
    $("#main").innerHTML =
      head(
        "Data Petugas Kampus",
        "Petugas yang berwenang menerima barang temuan di lapangan.",
      ) +
      tbl(
        ["Nama Petugas", "Peran / Bagian", "Barang Diterima"],
        list.map(
          (p) => `
          <tr>
            <td><b>${esc(p.name)}</b></td>
            <td>${esc(p.prodi)}</td>
            <td>${DB.found.filter((f) => f.received_by.includes(p.name)).length} barang</td>
          </tr>
        `,
        ),
      );
  },

  // 13. Admin: Riwayat Lengkap & Arsip
  riwayat() {
    $("#main").innerHTML =
      head(
        "Riwayat & Arsip Laporan",
        "Seluruh arsip laporan kehilangan, status kedaluwarsa 3 hari, barang ditolak, dan barang yang sudah kembali.",
      ) +
      tbl(
        ["Barang", "Pelapor", "Tanggal Lapor", "Status", "Aksi"],
        DB.reports.map(
          (r) => `
          <tr>
            <td>
              <b>${esc(r.name)}</b>
              <div class="meta">${esc(r.cat)}</div>
            </td>
            <td>${esc(uname(r.uid))}</td>
            <td>${fmt(r.date)}</td>
            <td>${badge(r.status)}</td>
            <td>
              <button class="btn ghost sm detail-action" onclick="detail(${r.id})">Detail</button>
            </td>
          </tr>
        `,
        ),
      );
  },

  // 14. Petugas: Dashboard Petugas (milik sendiri via received_by_id)
  dash_petugas() {
    fvPetugasDashboard(); // tampilan baru: dashboard-ui.js
  },

  // 15. Petugas: Input Barang Temuan
  input_temuan() {
    $("#main").innerHTML =
      head(
        "Catat Barang Temuan",
        "Barang temuan yang diserahkan mahasiswa penemu kepada petugas keamanan / kampus.",
      ) +
      `
      <form class="card pad form" onsubmit="event.preventDefault();submitFoundPetugas(this)">
        <div class="f">
          <label>Nama barang <span style="color:var(--err)">*</span></label>
          <input name="n" required placeholder="Contoh: Kunci motor Beat">
        </div>
        <div class="f">
          <label>Kategori <span style="color:var(--err)">*</span></label>
          <select name="c">${opts(CATS)}</select>
        </div>
        <div class="f">
          <label>Warna</label>
          <input name="w" placeholder="Contoh: Hitam">
        </div>
        <div class="f">
          <label>Merk</label>
          <input name="b" placeholder="Contoh: Honda">
        </div>
        <div class="f">
          <label>Gedung <span style="color:var(--err)">*</span></label>
          <select name="g" onchange="gdg(this)">
            <option>Gedung A</option>
            <option>Gedung B</option>
          </select>
        </div>
        <div class="f">
          <label>Lokasi ditemukan <span style="color:var(--err)">*</span></label>
          <select name="l" onchange="kls(this)">${locOpts("Gedung A")}</select>
        </div>
        <div class="f kn">
          <label>Nomor ruang kelas (4 digit)</label>
          <input name="kn" inputmode="numeric" autocomplete="off" required maxlength="4" minlength="4" pattern="[0-9]{4}" title="Isi 4 digit angka" placeholder="Contoh: 1305" oninput="this.value=this.value.replace(/[^0-9]/g,'')">
        </div>
        <div class="f w">
          <label>Foto barang temuan</label>
          <input type="file" name="foto" accept="image/*" onchange="previewImg(this, '#preview-petugas-found')">
          <img id="preview-petugas-found" class="img-preview" style="display:none">
        </div>
        <div class="f w">
          <label>Deskripsi & kondisi saat diserahkan</label>
          <textarea name="ds" placeholder="Kondisi barang dan nama penemu yang menyerahkan..."></textarea>
        </div>
        <div class="w" style="margin-top:10px">
          <button class="btn">Simpan Barang Temuan (Kirim ke Admin untuk ACC)</button>
        </div>
      </form>
    `;
  },

  // 16. Petugas: Riwayat Barang Diterima (milik sendiri)
  riwayat_petugas() {
    const list = DB.found.filter(
      (f) =>
        f.received_by_id === ST.user.id ||
        String(f.received_by || "").includes(ST.user.name),
    );
    $("#main").innerHTML =
      head(
        "Riwayat Barang Diterima",
        "Seluruh barang temuan yang pernah Anda terima.",
      ) +
      tbl(
        ["Barang", "Kategori", "Lokasi", "Tanggal", "Status", ""],
        list.map(
          (f) => `
          <tr>
            <td><b>${esc(f.name)}</b></td>
            <td>${esc(f.cat)}</td>
            <td>${esc(f.loc)}</td>
            <td>${fmt(f.date)}</td>
            <td>${badge(f.status)}</td>
            <td><button class="btn ghost sm detail-action" onclick="detailFound(${f.id})">Detail</button></td>
          </tr>
        `,
        ),
      );
  },

  // 17. Profil
  profil() {
    const u = ST.user;
    $("#main").innerHTML =
      head("Profil Akun", "Informasi akun pengguna Anda.") +
      `
      <div class="card pad" style="max-width:540px">
        <dl class="dl">
          <dt>Nama lengkap</dt><dd>${esc(u.name)}</dd>
          <dt>NIM / ID</dt><dd>${esc(u.nim)}</dd>
          <dt>Program studi</dt><dd>${esc(u.prodi)}</dd>
          <dt>Hak akses (Role)</dt><dd><span class="badge ACTIVE">${esc(u.role.toUpperCase())}</span></dd>
        </dl>
        <div style="margin-top:24px;display:flex;gap:10px">
          <button class="btn bad sm" onclick="logout()">Keluar Akun</button>
        </div>
      </div>
    `;
  },
};

// Handlers for Forms & Actions
function previewImg(input, targetSelector) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = $(targetSelector);
      if (img) {
        img.src = e.target.result;
        img.style.display = "block";
      }
    };
    reader.readAsDataURL(input.files[0]);
  }
}

// Kirim laporan kehilangan via API (foto base64 kecil). Tanpa localStorage.
async function sendR(f) {
  const btn = f.querySelector("button.btn");
  if (btn) btn.disabled = true;
  try {
    const photoEl = f.foto && f.foto.files[0];
    const photoData = photoEl
      ? await readImageSmall(photoEl, 800, "Foto barang").catch((e) => {
          toast(e.message);
          return null;
        })
      : "";
    if (photoEl && !photoData) return;
    const catName = f.c.value;
    const catIdx = CATS.indexOf(catName);
    if (catIdx < 0) return toast("Kategori tidak dikenal.");
    const fullLoc = locOf(f);
    const building = fullLoc.startsWith("Gedung B") ? "Gedung B" : "Gedung A";
    await API.req("/api/reports", {
      method: "POST",
      body: {
        category_id: catIdx + 1,
        item_name: f.n.value.trim(),
        color: f.w.value.trim(),
        brand: f.b ? f.b.value.trim() : "",
        building,
        lost_location: fullLoc,
        classroom_number: (f.kn && f.kn.value.trim()) || null,
        lost_date: f.d.value,
        description: f.ds.value.trim(),
        photo: photoData,
      },
    });
    toast("Laporan terkirim! Menunggu verifikasi Admin.");
    nav("saya");
  } catch (e) {
    toast(e.message);
  } finally {
    if (btn) btn.disabled = false;
  }
}

// Catat temuan petugas via API (PENDING_APPROVAL). Tanpa localStorage.
async function submitFoundPetugas(f) {
  const btn = f.querySelector("button.btn");
  if (btn) btn.disabled = true;
  try {
    const photoEl = f.foto && f.foto.files[0];
    const photoData = photoEl
      ? await readImageSmall(photoEl, 800, "Foto temuan").catch((e) => {
          toast(e.message);
          return null;
        })
      : "";
    if (photoEl && !photoData) return;
    const catIdx = CATS.indexOf(f.c.value);
    if (catIdx < 0) return toast("Kategori tidak dikenal.");
    const fullLoc = locOf(f);
    await API.req("/api/found", {
      method: "POST",
      body: {
        category_id: catIdx + 1,
        item_name: f.n.value.trim(),
        color: f.w ? f.w.value.trim() : "",
        brand: f.b ? f.b.value.trim() : "",
        building: fullLoc.startsWith("Gedung B") ? "Gedung B" : "Gedung A",
        found_location: fullLoc,
        classroom_number: (f.kn && f.kn.value.trim()) || null,
        found_date: new Date().toISOString().slice(0, 10),
        description: f.ds ? f.ds.value.trim() : "",
        photo: photoData,
      },
    });
    toast("Barang temuan dicatat! Menunggu verifikasi ACC Admin.");
    nav("riwayat_petugas");
  } catch (e) {
    toast(e.message);
  } finally {
    if (btn) btn.disabled = false;
  }
}

// Catat temuan langsung admin via API (langsung APPROVED). Tanpa localStorage.
async function submitFoundDirect(f) {
  const btn = f.querySelector("button.btn");
  if (btn) btn.disabled = true;
  try {
    const photoEl = f.foto && f.foto.files[0];
    const photoData = photoEl
      ? await readImageSmall(photoEl, 800, "Foto temuan").catch((e) => {
          toast(e.message);
          return null;
        })
      : "";
    if (photoEl && !photoData) return;
    const catIdx = CATS.indexOf(f.c.value);
    if (catIdx < 0) return toast("Kategori tidak dikenal.");
    const fullLoc = locOf(f);
    await API.req("/api/found", {
      method: "POST",
      body: {
        category_id: catIdx + 1,
        item_name: f.n.value.trim(),
        color: f.w ? f.w.value.trim() : "",
        brand: f.b ? f.b.value.trim() : "",
        building: fullLoc.startsWith("Gedung B") ? "Gedung B" : "Gedung A",
        found_location: fullLoc,
        classroom_number: (f.kn && f.kn.value.trim()) || null,
        found_date: new Date().toISOString().slice(0, 10),
        description: f.ds ? f.ds.value.trim() : "",
        photo: photoData,
      },
    });
    toast("Barang temuan berhasil dicatat dan langsung APPROVED.");
    nav("cocok");
  } catch (e) {
    toast(e.message);
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function accFoundItem(id) {
  try {
    const r = await API.req(`/api/found/${id}/approve`, {
      method: "PATCH",
      body: { approve: true },
    });
    toast(r.message || "Barang temuan disetujui (ACC) dan siap dicocokkan.");
    await refreshStore();
  } catch (e) {
    toast(e.message);
  }
  app();
}

async function rejectFoundItem(id) {
  try {
    const r = await API.req(`/api/found/${id}/approve`, {
      method: "PATCH",
      body: { approve: false },
    });
    toast(r.message || "Barang temuan ditolak.");
    await refreshStore();
  } catch (e) {
    toast(e.message);
  }
  app();
}

// Verifikasi regist mahasiswa Cara B (upload KTM + ACC manual admin) via API.
async function verifyReg(id, approve) {
  const u = DB.users.find((x) => x.id === id && x.role === "user");
  if (!u && approve !== false) {
    // Tetap lanjut via API walau cache kosong.
  }
  if (!approve) {
    const label = u ? `${u.name} (${u.nim})` : `ID ${id}`;
    const reason = prompt(
      `Tolak pendaftaran ${label}?\nTulis alasan penolakan:`,
    );
    if (reason === null) return;
    if (!reason.trim()) return toast("Alasan penolakan wajib diisi.");
    try {
      const r = await API.req("/api/auth/verify-registration", {
        method: "POST",
        body: { user_id: id, approve: false, reason: reason.trim() },
      });
      toast(r.message || "Pendaftaran ditolak dengan alasan.");
      await refreshStore();
    } catch (e) {
      return toast(e.message);
    }
    return app();
  }
  const label = u ? `${u.name} (${u.nim}, ${u.prodi})` : `ID ${id}`;
  if (!confirm(`Setujui pendaftaran ${label}?`)) return;
  try {
    const r = await API.req("/api/auth/verify-registration", {
      method: "POST",
      body: { user_id: id, approve: true },
    });
    toast(r.message || "Pendaftaran disetujui. Mahasiswa bisa masuk.");
    await refreshStore();
  } catch (e) {
    return toast(e.message);
  }
  app();
}

function detailKtm(id) {
  const u = DB.users.find((x) => x.id === id && x.role === "user");
  if (!u) return;
  // KTM: base64 dari DB, atau path lama -> endpoint ber-token
  const src = u.ktm_photo
    ? /^data:image\//.test(u.ktm_photo)
      ? u.ktm_photo
      : /^(blob:|https?:)/.test(u.ktm_photo)
        ? u.ktm_photo
        : `/uploads/ktm/${encodeURIComponent(String(u.ktm_photo).split("/").pop())}?token=${encodeURIComponent(ST.token || "")}`
    : "";
  dlg(`
    <div class="modal-head">
      <h2>Verifikasi KTM</h2>
      <p class="meta">${esc(u.name)} &bull; NIM ${esc(u.nim)} &bull; ${esc(u.prodi)}</p>
    </div>
    ${src ? `<a href="${src}" target="_blank" rel="noopener"><img src="${src}" alt="KTM ${esc(u.name)}" style="display:block;width:100%;max-height:380px;object-fit:contain;background:var(--soft);border-radius:8px;border:1px solid var(--line)"></a>` : `<div class="card empty">Tidak ada foto KTM.</div>`}
    <div class="foot">
      <button class="btn ghost" onclick="$('dialog').close()">Tutup</button>
      ${u.verification_status === "PENDING" ? `<button class="btn bad" onclick="$('dialog').close();verifyReg(${u.id}, false)">Tolak</button><button class="btn" onclick="$('dialog').close();verifyReg(${u.id}, true)">Setujui</button>` : ""}
    </div>
  `);
}
const canDelete = () => ST.user && ST.user.role === "admin";

const canDeleteFound = (f) =>
  ST.user &&
  (ST.user.role === "admin" ||
    (ST.user.role === "petugas" &&
      (f.received_by_id === ST.user.id ||
        String(f.received_by || "").includes(ST.user.name))));

function closeDlg() {
  const e = $("dialog");
  if (e && e.open) e.close();
}

async function deleteReport(id) {
  if (!canDelete())
    return toast("Anda tidak memiliki izin untuk menghapus Laporan.");
  const r = DB.reports.find((x) => x.id === id);
  if (
    !confirm(
      `Hapus Laporan "${r ? r.name : id}" secara permanen?\nTindakan ini dicatat di audit log.`,
    )
  )
    return;
  try {
    const res = await API.req(`/api/reports/${id}`, { method: "DELETE" });
    toast(res.message || "Laporan Kehilangan berhasil dihapus");
    if (ST.chatReportId === id) ST.chatReportId = null;
    await refreshStore();
  } catch (e) {
    return toast(e.message);
  }
  closeDlg();
  render();
}

async function deleteFound(id) {
  const f = DB.found.find((x) => x.id === id);
  if (!f) return;
  if (!canDeleteFound(f))
    return toast("Anda tidak memiliki izin untuk menghapus barang temuan ini.");
  if (
    !confirm(
      `Hapus barang temuan "${f.name}" secara permanen?\nTindakan ini dicatat di audit log.`,
    )
  )
    return;
  try {
    const res = await API.req(`/api/found/${id}`, { method: "DELETE" });
    toast(res.message || "Barang temuan berhasil dihapus");
    await refreshStore();
  } catch (e) {
    return toast(e.message);
  }
  closeDlg();
  render();
}

function doMatch(f) {
  const r = +f.r.value;
  const i = +f.f.value;
  directMatch(r, i);
}

async function directMatch(rid, fid) {
  try {
    const res = await API.req("/api/matches", {
      method: "POST",
      body: { lost_report_id: rid, found_item_id: fid },
    });
    toast(
      res.message ||
        "Laporan dan temuan berhasil dihubungkan! Silakan hubungi pelapor.",
    );
    await refreshStore();
  } catch (e) {
    return toast(e.message);
  }
  app();
}

function dlg(h) {
  const e = $("dialog");
  if (e) e.remove();
  document.body.insertAdjacentHTML(
    "beforeend",
    `<dialog><div class="in">${h}</div></dialog>`,
  );
  const d = $("dialog");
  // Klik area gelap (backdrop) = tutup, supaya modal tidak nyangkut.
  d.addEventListener("click", (ev) => {
    if (ev.target === d) d.close();
  });
  d.showModal();
}

// Paksa tutup semua modal (dipakai saat pindah halaman agar tidak nyangkut).
function closeAllDlg() {
  document.querySelectorAll("dialog").forEach((d) => {
    try {
      if (d.open) d.close();
    } catch (_) {}
    d.remove();
  });
}

// Data diri & foto pengambil barang dari API (hanya tampil untuk Admin)
async function takerInfoHtml(reportId) {
  try {
    const r = await API.req(`/api/returns?lost_report_id=${reportId}`);
    const t = (r.data || [])[0];
    if (!t) return "";
    return `
    <h3 class="t" style="margin:16px 0 8px">Data Pengambil Barang</h3>
    <dl class="dl">
      <dt>Nama</dt><dd>${esc(t.taker_name)}</dd>
      <dt>NIM</dt><dd>${esc(t.taker_nim)}</dd>
      <dt>Program studi</dt><dd>${esc(t.taker_prodi)}</dd>
      <dt>No. HP</dt><dd>${esc(t.taker_phone)}</dd>
    </dl>
    ${[
      [t.taker_photo, "Foto KTM"],
      [t.taker_receipt, "Struk pembelian"],
      [t.taker_selfie, "Foto diri pengambil"],
    ]
      .filter((x) => x[0])
      .map(
        ([src, cap]) => `
      <figure style="margin:12px 0 0">
        <a href="${src}" target="_blank" rel="noopener"><img src="${src}" style="display:block;width:100%;max-height:320px;object-fit:contain;background:var(--soft);border-radius:8px;border:1px solid var(--line)"></a>
        <figcaption class="meta" style="margin-top:4px">${cap}</figcaption>
      </figure>`,
      )
      .join("")}`;
  } catch (_) {
    return "";
  }
}

// Modal Detail Laporan Kehilangan
async function detail(id) {
  const r = DB.reports.find((x) => x.id === id);
  if (!r) return;
  const isAdm = ST.user && ST.user.role === "admin";
  const expireDate = exp(r);
  const takerHtml = isAdm ? await takerInfoHtml(r.id) : "";

  dlg(`
    <div class="ph modal-photo">
      ${r.photo ? `<img src="${r.photo}" alt="${esc(r.name)}">` : ic(IC.photo)}
    </div>
    <div class="modal-head">
      ${badge(r.status)}
      <h2>${esc(r.name)}</h2>
      <p class="meta">${esc(r.cat)}</p>
    </div>
    <dl class="dl">
      <dt>Warna</dt><dd>${esc(r.color || "-")}</dd>
      <dt>Merk</dt><dd>${esc(r.brand || "-")}</dd>
      <dt>Lokasi hilang</dt><dd>${esc(r.loc)}</dd>
      <dt>Tanggal lapor</dt><dd>${fmt(r.date)}</dd>
      <dt>Ciri & Deskripsi</dt><dd>${esc(r.desc)}</dd>
      ${isAdm ? `<dt>Pelapor</dt><dd>${esc(uname(r.uid))}</dd>` : ""}
      ${expireDate ? `<dt>Masa aktif s/d</dt><dd>${fmt(expireDate)} (Maks. 3 hari)</dd>` : ""}
    </dl>
    ${takerHtml}
    <div class="foot">
      <button type="button" class="btn chat-about" onclick="chatAbout(${r.id})">
        ${isAdm ? `Chat ${esc(uname(r.uid) || "Pelapor")} tentang Barang Ini` : `Chat Admin tentang Barang Ini`}
      </button>
      <button type="button" class="btn ghost" onclick="$('dialog').close()">Tutup</button>
      ${canDelete() ? `<button class="btn bad" onclick="deleteReport(${r.id})">Hapus Laporan</button>` : ""}
      ${isAdm && r.status === "PENDING" ? `<button class="btn sm" onclick="setR(${r.id},'ACTIVE');$('dialog').close();toast('Laporan disetujui');app()">Setujui</button>` : ""}
      ${isAdm && r.status === "FOUND" ? `<button class="btn sm" onclick="$('dialog').close();verif(${r.id})">Verifikasi Kepemilikan</button>` : ""}
    </div>
  `);
}

// Modal Detail Barang Temuan
function detailFound(id) {
  const f = DB.found.find((x) => x.id === id);
  if (!f) return;
  dlg(`
    <div class="ph modal-photo">
      ${f.photo ? `<img src="${f.photo}" alt="${esc(f.name)}">` : ic(IC.shield)}
    </div>
    <div class="modal-head">
      ${badge(f.status)}
      <h2>${esc(f.name)}</h2>
      <p class="meta">${esc(f.cat)} &bull; Ditemukan di ${esc(f.loc)}</p>
    </div>
    <dl class="dl">
      <dt>Warna</dt><dd>${esc(f.color || "-")}</dd>
      <dt>Merk</dt><dd>${esc(f.brand || "-")}</dd>
      <dt>Lokasi temuan</dt><dd>${esc(f.loc)}</dd>
      <dt>Tanggal temuan</dt><dd>${fmt(f.date)}</dd>
      <dt>Penerima</dt><dd>${esc(f.received_by)}</dd>
      <dt>Kondisi</dt><dd>${esc(f.desc || "Disimpan di kantor kemahasiswaan")}</dd>
    </dl>
    <div class="foot">
      ${!ST.user || ST.user.role === "user" ? `<button type="button" class="btn chat-about" onclick="chatAboutFound(${f.id})">Chat Admin Tanya Barang Ini</button>` : ""}
      <button type="button" class="btn ghost" onclick="$('dialog').close()">Tutup</button>
      ${canDeleteFound(f) ? `<button class="btn bad" onclick="deleteFound(${f.id})">Hapus Temuan</button>` : ""}
      ${ST.user && ST.user.role === "admin" && f.status === "PENDING_APPROVAL" ? `<button class="btn sm" onclick="accFoundItem(${f.id});$('dialog').close()">Setujui (ACC)</button>` : ""}
    </div>
  `);
}

// Modal Verifikasi Kepemilikan (Checklist Sesuai README Section 8.7)
function verif(id) {
  const r = DB.reports.find((x) => x.id === id);
  if (!r) return;
  const u = uobj(r.uid);

  dlg(`
    <h2>Verifikasi Kepemilikan Barang</h2>
    <p class="meta">${esc(r.name)} &bull; Pemilik: ${esc(u.name)} (NIM: ${esc(u.nim)})</p>
    <div class="info-banner" style="margin:12px 0">
      Admin wajib memeriksa kecocokan fisik barang dan identitas sebelum barang diserahkan.
    </div>
    <div class="f"><label>Nama pengambil <span style="color:var(--err)">*</span></label>
      <input id="vnama" required maxlength="100" value="${esc(u.name)}"></div>
    <div class="f"><label>NIM pengambil <span style="color:var(--err)">*</span></label>
      <input id="vnim" required maxlength="30" value="${esc(u.nim)}"></div>
    <div class="f"><label>Program studi <span style="color:var(--err)">*</span></label>
      <input id="vprodi" required maxlength="80" value="${esc(u.prodi)}"></div>
    <div class="f"><label>Nomor HP / WhatsApp pengambil <span style="color:var(--err)">*</span></label>
      <input id="vhp" required inputmode="tel" maxlength="16" placeholder="Contoh: 081234567890"></div>
    <div class="f"><label>Foto KTM <span style="color:var(--err)">*</span></label>
      <input id="vfoto" type="file" accept="image/jpeg,image/png,image/webp" onchange="previewImg(this,'#pv-verif')">
      <img id="pv-verif" class="img-preview" style="display:none;max-width:100%;max-height:200px;object-fit:contain;margin-top:8px;border-radius:8px"></div>
    <div class="f"><label>Foto struk pembelian <span style="color:var(--mute);font-weight:400">(opsional)</span></label>
      <input id="vstruk" type="file" accept="image/jpeg,image/png,image/webp" onchange="previewImg(this,'#pv-struk')">
      <img id="pv-struk" class="img-preview" style="display:none;max-width:100%;max-height:200px;object-fit:contain;margin-top:8px;border-radius:8px"></div>
    <div class="f"><label>Foto diri pengambil <span style="color:var(--err)">*</span></label>
      <input id="vselfie" type="file" accept="image/jpeg,image/png,image/webp" onchange="previewImg(this,'#pv-selfie')">
      <img id="pv-selfie" class="img-preview" style="display:none;max-width:100%;max-height:200px;object-fit:contain;margin-top:8px;border-radius:8px"></div>
    <div class="chk">
      <label><input type="checkbox"> 1. Detail ciri khusus barang sesuai dengan keterangan pelapor</label>
      <label><input type="checkbox"> 2. Isi dalam barang (jika ada) sesuai dengan keterangan pemilik</label>
      <label><input type="checkbox"> 3. Bukti kepemilikan diperlihatkan (KTM, foto lama, struk, atau pola kunci)</label>
      <label><input type="checkbox"> 4. Identitas mahasiswa sesuai dengan akun pelapor</label>
      <label><input type="checkbox"> 5. Pemilik menandatangani bukti penyerahan barang</label>
    </div>
    <div class="f">
      <label>Catatan penyerahan / nomor bukti</label>
      <textarea id="vnotes" placeholder="Tuliskan catatan verifikasi barang dan tanggal serah terima..."></textarea>
    </div>
    <div class="foot">
      <button class="btn ghost" onclick="$('dialog').close()">Batal</button>
      <button class="btn" onclick="submitVerifReturn(${id})">Serahkan Barang (RETURNED)</button>
    </div>
  `);
}

// Baca & kompres foto agar muat di penyimpanan browser
function readImageSmall(file, maxSide = 800, label = "Foto KTM") {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error(label + " wajib diunggah."));
    if (!/^image\/(jpeg|png|webp)$/.test(file.type))
      return reject(new Error(label + ": format harus JPG, PNG, atau WEBP."));
    if (file.size > 5 * 1024 * 1024)
      return reject(new Error(label + ": ukuran maksimal 5 MB."));
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Gagal membaca foto."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("File bukan gambar yang valid."));
      img.onload = () => {
        const k = Math.min(1, maxSide / Math.max(img.width, img.height));
        const cv = document.createElement("canvas");
        cv.width = Math.round(img.width * k);
        cv.height = Math.round(img.height * k);
        cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
        resolve(cv.toDataURL("image/jpeg", 0.7));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

async function submitVerifReturn(id) {
  const takerName = $("#vnama").value.trim();
  const takerNim = $("#vnim").value.trim();
  const takerProdi = $("#vprodi").value.trim();
  const takerHp = $("#vhp").value.trim().replace(/[\s-]/g, "");
  if (!takerName || !takerNim || !takerProdi)
    return toast("Lengkapi data diri pengambil (nama, NIM, program studi).");
  if (!/^(\+62|62|0)8[0-9]{8,12}$/.test(takerHp))
    return toast("Nomor HP pengambil tidak valid.");
  let takerPhoto,
    takerReceipt = "",
    takerSelfie;
  try {
    takerPhoto = await readImageSmall($("#vfoto").files[0], 800, "Foto KTM");
    const struk = $("#vstruk").files[0];
    if (struk) takerReceipt = await readImageSmall(struk, 800, "Foto struk");
    takerSelfie = await readImageSmall(
      $("#vselfie").files[0],
      800,
      "Foto diri",
    );
  } catch (err) {
    return toast(err.message);
  }
  const chks = [...document.querySelectorAll("dialog input[type=checkbox]")];
  if (!chks.every((c) => c.checked)) {
    return toast(
      "Harap centang semua 5 poin verifikasi kepemilikan terlebih dahulu.",
    );
  }
  const notes = $("#vnotes") ? $("#vnotes").value.trim() : "";
  const r = DB.reports.find((x) => x.id === id);
  if (!r) return toast("Laporan tidak ditemukan.");
  const match = DB.matches
    ? DB.matches.find((m) => m.lost_report_id === id)
    : null;
  const foundId = match ? match.found_item_id : null;
  try {
    const res = await API.req("/api/returns", {
      method: "POST",
      body: {
        lost_report_id: id,
        found_item_id: foundId,
        user_id: r.uid,
        notes: notes || "Barang diserahkan setelah verifikasi 5 poin lengkap.",
        taker_name: takerName,
        taker_nim: takerNim,
        taker_prodi: takerProdi,
        taker_phone: takerHp,
        taker_photo: takerPhoto,
        taker_receipt: takerReceipt,
        taker_selfie: takerSelfie,
        check_1_details: true,
        check_2_contents: true,
        check_3_proof: true,
        check_4_identity: true,
        check_5_signed: true,
      },
    });
    toast(res.message || "Barang telah berhasil diverifikasi dan diserahkan!");
    await refreshStore();
  } catch (e) {
    return toast(e.message);
  }
  $("dialog").close();
  app();
}

// Initial Run
render();

/* Motion enhancement only: no API, storage, or business logic is changed. */
(() => {
  const installMotion = () => {
    if (!document.body || !("IntersectionObserver" in window)) return;
    const reveal = (root) => {
      const selectors = ".tw, .stat, .head, #main > .card";
      const nodes = [];
      if (root.matches && root.matches(selectors)) nodes.push(root);
      if (root.querySelectorAll)
        nodes.push(...root.querySelectorAll(selectors));
      nodes.forEach((el, i) => {
        if (el.dataset.motionReady) return;
        el.dataset.motionReady = "1";
        if (el.closest(".no-enter")) return;
        el.classList.add("motion-reveal");
        el.style.setProperty("--motion-delay", `${Math.min(i % 8, 7) * 55}ms`);
        observer.observe(el);
      });
    };
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const t = entry.target;
            t.classList.add("motion-visible");
            observer.unobserve(t);
            // Lepas kelas animasi setelah selesai agar tidak mengganggu efek hover.
            setTimeout(
              () => t.classList.remove("motion-reveal", "motion-visible"),
              900,
            );
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -24px 0px" },
    );
    installMotion.observer = observer;
    reveal(document.body);
    new MutationObserver((records) =>
      records.forEach((record) =>
        record.addedNodes.forEach((node) => {
          if (node.nodeType === 1) reveal(node);
        }),
      ),
    ).observe(document.getElementById("root") || document.body, {
      childList: true,
      subtree: true,
    });
  };
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", installMotion, {
      once: true,
    });
  else installMotion();
})();

/* Small interaction polish: image previews and one-time count-up for numeric dashboard values. */
(() => {
  const initEnhancements = () => {
    const root = document.getElementById("root");
    if (!root) return;
    const previewFile = (input) => {
      if (
        !input ||
        input.dataset.previewBound ||
        input.type !== "file" ||
        input.hasAttribute("onchange")
      )
        return;
      input.dataset.previewBound = "1";
      input.addEventListener("change", () => {
        const file = input.files && input.files[0];
        if (!file || !file.type.startsWith("image/")) return;
        let preview =
          input.parentElement &&
          input.parentElement.querySelector(".motion-image-preview");
        if (!preview) {
          preview = document.createElement("img");
          preview.className = "motion-image-preview";
          preview.alt = "Pratinjau gambar yang dipilih";
          preview.style.cssText =
            "display:block;max-width:180px;max-height:140px;object-fit:cover;border-radius:12px;margin-top:10px;box-shadow:0 6px 18px rgba(16,45,70,.12);animation:content-arrive .28s ease both";
          input.insertAdjacentElement("afterend", preview);
        }
        if (preview.dataset.objectUrl)
          URL.revokeObjectURL(preview.dataset.objectUrl);
        preview.dataset.objectUrl = URL.createObjectURL(file);
        preview.src = preview.dataset.objectUrl;
      });
    };
    const scan = (node) => {
      if (node.nodeType !== 1) return;
      if (node.matches && node.matches('input[type="file"]')) previewFile(node);
      node.querySelectorAll &&
        node.querySelectorAll('input[type="file"]').forEach(previewFile);
    };
    scan(root);
    new MutationObserver((records) =>
      records.forEach((record) => record.addedNodes.forEach(scan)),
    ).observe(root, { childList: true, subtree: true });
  };
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", initEnhancements, {
      once: true,
    });
  else initEnhancements();
})();

/* v11: cursor-aware highlight for buttons. Delegated so dynamically rendered
   buttons also work; does not intercept clicks or change application state. */
(() => {
  if (
    window.matchMedia &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches
  ) {
    document.addEventListener(
      "pointermove",
      (event) => {
        const button =
          event.target.closest && event.target.closest(".btn:not(:disabled)");
        if (!button) return;
        const rect = button.getBoundingClientRect();
        button.style.setProperty(
          "--v11-mx",
          `${((event.clientX - rect.left) / rect.width) * 100}%`,
        );
        button.style.setProperty(
          "--v11-my",
          `${((event.clientY - rect.top) / rect.height) * 100}%`,
        );
      },
      { passive: true },
    );
  }
})();
