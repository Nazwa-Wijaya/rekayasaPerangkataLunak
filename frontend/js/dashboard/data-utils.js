// js/dashboard/data-utils.js — Util tanggal/agregasi/avatar.
// Opsi A: script klasik berurutan. Urutan load di frontend/index.html. Jangan load satuan.
/* ---------- Util data ---------- */
const fvNum = (n) => Number(n || 0).toLocaleString("id-ID");
const fvDate = (x) => {
  if (!x) return null;
  const t = new Date(x);
  return isNaN(t) ? null : t;
};
const fvInPeriod = (x) => {
  if (FV.period === "all") return true;
  const t = fvDate(x);
  if (!t) return true;
  return Date.now() - t.getTime() <= Number(FV.period) * 864e5;
};
const fvMonthKey = (t) => t.getFullYear() * 12 + t.getMonth();

function fvMonths(n) {
  const now = new Date();
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({
      key: fvMonthKey(d),
      label: d.toLocaleDateString("id-ID", { month: "short" }),
      full: d.toLocaleDateString("id-ID", { month: "long", year: "numeric" }),
    });
  }
  return out;
}
const fvByMonth = (list, getDate, months) =>
  months.map(
    (m) =>
      list.filter((x) => {
        const t = fvDate(getDate(x));
        return t && fvMonthKey(t) === m.key;
      }).length,
  );

/* Riwayat pengembalian: pakai tabel `returns`; jika kosong, turunkan dari laporan RETURNED. */
function fvReturns() {
  const rows = (DB.returns || []).map((r) => ({
    report_id: r.lost_report_id,
    found_id: r.found_item_id,
    user_id: r.user_id,
    verified_by_id: r.verified_by_id,
    at: r.returned_at,
    taker: r.taker_name || "",
  }));
  if (rows.length) return rows;
  return DB.reports
    .filter((r) => r.status === "RETURNED")
    .map((r) => ({
      report_id: r.id,
      found_id: null,
      user_id: r.uid,
      verified_by_id: null,
      at: r.updated_at || r.created_at,
      taker: "",
    }));
}

const fvInitials = (name) =>
  String(name || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
const fvAvatar = (name) => {
  const tones = ["#e6f8c6", "#dfe8ff", "#ffe6c7", "#f5ddf0", "#d9f1ec"];
  let h = 0;
  for (const c of String(name || "")) h = (h * 31 + c.charCodeAt(0)) % 997;
  return `<span class="fv-avatar" style="background:${tones[h % tones.length]}">${esc(fvInitials(name))}</span>`;
};

