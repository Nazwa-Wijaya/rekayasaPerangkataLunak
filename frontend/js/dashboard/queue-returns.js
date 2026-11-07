// js/dashboard/queue-returns.js — Antrean verifikasi + riwayat pengembalian.
// Opsi A: script klasik berurutan. Urutan load di frontend/index.html. Jangan load satuan.
function fvPeriodSelect() {
  const opts = [
    ["all", "Semua waktu"],
    ["30", "30 hari terakhir"],
    ["7", "7 hari terakhir"],
  ];
  const current = opts.find(([v]) => v === FV.period)?.[1] || opts[0][1];
  return `<div class="fv-filter" data-period-menu>
    <button class="fv-filter-trigger" type="button" aria-haspopup="menu" aria-expanded="false" onclick="fvTogglePeriod(event)">
      ${fvI(FVP.filter)}<span>${current}</span>${fvI(FVP.down)}
    </button>
    <div class="fv-filter-menu" role="menu" aria-label="Periode data">
      ${opts.map(([v, l]) => `<button class="fv-filter-option${FV.period === v ? " is-selected" : ""}" type="button" role="menuitem" data-value="${v}" onclick="fvSetPeriod('${v}')">${l}</button>`).join("")}
    </div>
  </div>`;
}
function fvTogglePeriod(e) {
  e.stopPropagation();
  const root = e.currentTarget.closest("[data-period-menu]");
  const open = root.classList.toggle("is-open");
  e.currentTarget.setAttribute("aria-expanded", String(open));
}
function fvSetPeriod(v) {
  FV.period = v;
  V.dash();
}
document.addEventListener("click", (e) => {
  document.querySelectorAll("[data-period-menu].is-open").forEach((menu) => {
    if (!menu.contains(e.target)) menu.classList.remove("is-open");
  });
});

function fvQueueRows(kind) {
  if (kind === "lost") {
    const rows = DB.reports.filter((r) => r.status === "PENDING").slice(0, 5);
    if (!rows.length)
      return fvEmpty("Tidak ada laporan kehilangan yang menunggu verifikasi.");
    return rows
      .map(
        (r) => `<div class="fv-qrow">
        <span class="fv-ico">${fvI(fvCatIcon(r.cat))}</span>
        <div class="fv-qinfo"><b>${esc(r.name)}</b><small>${esc(r.cat)} • ${esc(r.loc)}</small>
          <small>Pelapor: ${esc(uname(r.uid))} • ${fmt(r.date)}</small></div>
        <div class="fv-qact"><button class="fv-btn ghost sm" onclick="fvDetail(${r.id})">Periksa</button>
          <button class="fv-btn lime sm" onclick="nav('masuk')">Buka Verifikasi</button></div></div>`,
      )
      .join("");
  }
  const rows = DB.found
    .filter((f) => f.status === "PENDING_APPROVAL")
    .slice(0, 5);
  if (!rows.length)
    return fvEmpty("Tidak ada barang temuan yang menunggu ACC.");
  return rows
    .map(
      (f) => `<div class="fv-qrow">
      <span class="fv-ico">${fvI(fvCatIcon(f.cat))}</span>
      <div class="fv-qinfo"><b>${esc(f.name)}</b><small>${esc(f.cat)} • ${esc(f.loc)}</small>
        <small>Diterima: ${esc(f.received_by)} • ${fmt(f.date)}</small></div>
      <div class="fv-qact"><button class="fv-btn ghost sm" onclick="fvDetailFound(${f.id})">Periksa</button>
        <button class="fv-btn lime sm" onclick="accFoundItem(${f.id})">ACC</button></div></div>`,
    )
    .join("");
}
const fvEmpty = (t) =>
  `<div class="fv-empty">${fvI(FVP.check)}<span>${t}</span></div>`;

function fvQueueCard() {
  const nl = DB.reports.filter((r) => r.status === "PENDING").length;
  const nf = DB.found.filter((f) => f.status === "PENDING_APPROVAL").length;
  if (FV.queue === "lost" && !nl && nf) FV.queue = "found";
  return `<section class="fv-card" id="fv-queue-card">
    <div class="fv-card-head"><h2>Antrean Verifikasi</h2>
      <div class="fv-tabs sm" role="tablist">
        <button class="fv-tab ${FV.queue === "lost" ? "on" : ""}" onclick="fvSetQueue('lost')">Hilang masuk <em>${nl}</em></button>
        <button class="fv-tab ${FV.queue === "found" ? "on" : ""}" onclick="fvSetQueue('found')">Temuan masuk <em>${nf}</em></button>
      </div></div>
    <p class="fv-card-sub">${FV.queue === "lost" ? "Dikirim mahasiswa lewat “Laporkan Kehilangan”. Setujui agar tayang di forum, atau tolak jika tidak valid." : "Diserahkan penemu ke petugas/admin. ACC agar tampil di forum sebagai barang temuan resmi."}</p>
    <div class="fv-qlist">${fvQueueRows(FV.queue)}</div></section>`;
}
function fvSetQueue(k) {
  FV.queue = k;
  const el = document.getElementById("fv-queue-card");
  if (el) el.outerHTML = fvQueueCard();
}

function fvReturnRows(q) {
  const query = String(q || "")
    .trim()
    .toLocaleLowerCase("id-ID");
  const rows = fvReturns()
    .filter((r) => fvInPeriod(r.at))
    .map((r) => {
      const rep = DB.reports.find((x) => x.id === r.report_id) || {};
      const owner = uobj(r.user_id);
      const ver = r.verified_by_id ? uname(r.verified_by_id) : "-";
      return { r, rep, owner, ver };
    })
    .filter(
      ({ rep, owner, ver, r }) =>
        !query ||
        [rep.name, rep.cat, owner.name, owner.nim, owner.prodi, ver, r.taker]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase("id-ID")
          .includes(query),
    );
  if (!rows.length)
    return fvEmpty(
      query
        ? "Tidak ada riwayat yang cocok dengan pencarian."
        : "Belum ada barang yang dikembalikan kepada pemiliknya.",
    );
  return rows
    .slice(0, 6)
    .map(({ r, rep, owner, ver }) => {
      const other =
        r.taker && r.taker !== owner.name
          ? `<small>Diambil oleh ${esc(r.taker)}</small>`
          : "";
      return `<div class="fv-tr fv-ret" role="row" ${rep.id ? `onclick="detail(${rep.id})" tabindex="0"` : ""}>
        <div class="fv-who" role="cell">${fvAvatar(owner.name)}<div><b>${esc(owner.name || "-")}</b><small>${esc(owner.nim ? "NIM " + owner.nim : "")}${owner.prodi ? " • " + esc(owner.prodi) : ""}</small></div></div>
        <div role="cell"><b>${esc(rep.name || "-")}</b><small>${esc(rep.cat || "")}</small></div>
        <div role="cell"><span>${esc(ver)}</span>${other}</div>
        <div role="cell">${fvDate(r.at) ? fmtT(r.at) : "-"}</div>
        <div role="cell"><span class="fv-chip st-returned">Selesai</span></div></div>`;
    })
    .join("");
}
function fvFilterReturns(v) {
  FV.retQuery = v;
  const box = document.getElementById("fv-ret-rows");
  if (box) box.innerHTML = fvReturnRows(v);
}

function fvReturnsCard() {
  return `<section class="fv-card">
    <div class="fv-card-head"><div><h2>Riwayat Pengembalian Barang</h2>
      <p class="fv-card-sub" style="margin:4px 0 0">Barang yang sudah diverifikasi dan diserahkan kepada pemiliknya.</p></div>
      <label class="fv-searchbox">${fvI(FVP.search)}<input type="search" placeholder="Cari pemilik atau barang…" aria-label="Cari riwayat pengembalian"
        value="${esc(FV.retQuery)}" oninput="fvFilterReturns(this.value)"></label></div>
    <div class="fv-scroll"><div class="fv-table" role="table">
      <div class="fv-tr fv-th" role="row"><span>Pemilik</span><span>Barang</span><span>Diverifikasi oleh</span><span>Waktu serah terima</span><span>Status</span></div>
      <div id="fv-ret-rows">${fvReturnRows(FV.retQuery)}</div></div></div>
    <div class="fv-card-foot"><button class="fv-link" onclick="nav('riwayat')">Lihat seluruh riwayat & arsip ${fvI(FVP.out)}</button></div>
  </section>`;
}

function fvRecentFoundCard() {
  const rows = DB.found.filter((f) => fvInPeriod(f.created_at)).slice(0, 5);
  return `<section class="fv-card">
    <div class="fv-card-head"><h2>Barang Temuan Terbaru</h2>
      <button class="fv-link" onclick="nav('acc_temuan')">Kelola ${fvI(FVP.out)}</button></div>
    ${
      rows.length
        ? `<ul class="fv-list">${rows
            .map(
              (f) => `<li onclick="detailFound(${f.id})" tabindex="0">
          <span class="fv-ico">${fvI(fvCatIcon(f.cat))}</span>
          <div class="fv-li-main"><b>${esc(f.name)}</b><small>${esc(f.loc)}</small></div>
          ${fvChip(f.status)}</li>`,
            )
            .join("")}</ul>`
        : fvEmpty("Belum ada barang temuan tercatat.")
    }
  </section>`;
}
