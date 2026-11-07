// js/01-utils.js — Helper tanggal & escape: fmt, fmtT, fmtClock, dayKey, fmtDay, esc.
// Opsi A: script klasik berurutan. Urutan load di frontend/index.html. Jangan load satuan.
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
const safeTime = (x) => {
  if (!x) return 0;
  if (typeof x === "number") return x;
  const iso = String(x).replace(" ", "T");
  const t = new Date(iso).getTime();
  return isNaN(t) ? new Date(x).getTime() || 0 : t;
};

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

const esc = (s) =>
  String(s || "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );

