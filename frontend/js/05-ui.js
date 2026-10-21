// js/05-ui.js — Primitif UI: $, badge, toast, head/tbl, form lokasi, dialog, preview, izin hapus.
// Opsi A: script klasik berurutan. Urutan load di frontend/index.html. Jangan load satuan.
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

function closeDlg() {
  const e = $("dialog");
  if (e && e.open) e.close();
}

const canDelete = () => ST.user && ST.user.role === "admin";

const canDeleteFound = (f) =>
  ST.user &&
  (ST.user.role === "admin" ||
    (ST.user.role === "petugas" &&
      (f.received_by_id === ST.user.id ||
        String(f.received_by || "").includes(ST.user.name))));

