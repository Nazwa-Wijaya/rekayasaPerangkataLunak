// js/03-store.js — State global DB/ST + mapper + refreshStore().
// Opsi A: script klasik berurutan. Urutan load di frontend/index.html. Jangan load satuan.
/* DEADCODE DIBUANG: checkExpirations() kosong (kedaluwarsa dihitung backend via expired_at). */
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
  photos: Array.isArray(r.photos) ? r.photos : [],
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
