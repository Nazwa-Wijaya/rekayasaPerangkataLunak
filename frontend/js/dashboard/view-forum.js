// js/dashboard/view-forum.js — Forum: KPI, filter, kartu, hasil.
// Opsi A: script klasik berurutan. Urutan load di frontend/index.html. Jangan load satuan.
/* ==========================================================
   FORUM
   ========================================================== */
function fvForumKpis() {
  const act = DB.reports.filter((r) => r.status === "ACTIVE" || r.status === "FOUND").length;
  const off = DB.found.filter((f) => f.status === "APPROVED" || f.status === "MATCHED").length;
  const ret = DB.reports.filter((r) => r.status === "RETURNED").length;
  const match = DB.reports.filter((r) => r.status === "FOUND").length;
  return `<div class="fv-kpis fv-kpis-sm">
    ${fvKpi({ icon: FVP.alert, label: "Laporan Aktif", value: fvNum(act), sub: "Tayang maksimal 3 hari" })}
    ${fvKpi({ icon: FVP.box, label: "Barang Temuan Resmi", value: fvNum(off), sub: "Tersimpan di Kemahasiswaan" })}
    ${fvKpi({ icon: FVP.check, label: "Cocok, Siap Diambil", value: fvNum(match), sub: "Menunggu verifikasi pemilik" })}
    ${fvKpi({ icon: FVP.repeat, label: "Sudah Dikembalikan", value: fvNum(ret), sub: "Selesai & terverifikasi" })}
  </div>`;
}

function renderForum() {
  const logged = !!ST.user;
  const a = logged && ST.user.role === "admin";
  ST.ft = ST.ft || "";
  const cta = !logged
    ? `<button class="fv-btn" onclick="goLogin('Masuk untuk melaporkan kehilangan')">${fvI(FVP.plus)} Laporkan Barang Hilang</button>`
    : ST.user.role === "user"
      ? `<button class="fv-btn" onclick="nav('lapor')">${fvI(FVP.plus)} Buat Laporan Baru</button>`
      : "";
  const types = [
    ["", "Semua"],
    ["lost", "Barang Hilang"],
    ["found", "Barang Temuan"],
  ];
  $("#main").innerHTML = `<div class="fv fv-forum">
    <header class="fv-head">
      <div><h1>Forum Lost & Found</h1>
        <p>Cari laporan barang hilang yang masih aktif atau barang temuan resmi yang sudah diverifikasi.</p></div>
      <div class="fv-head-actions">${cta}</div>
    </header>
    ${logged ? fvForumKpis() : ""}
    <section class="fv-card fv-filters">
      <div class="fv-filters-top">
        <div class="fv-search">${fvI(FVP.search)}
          <input id="sq" type="search" aria-label="Cari barang" placeholder="Cari nama, merek, kategori, lokasi, atau deskripsi…"
            value="${esc(ST.q)}" oninput="searchForum(this.value)">
          <button type="button" class="fv-search-clear" onclick="clearForumSearch()" aria-label="Hapus pencarian" ${ST.q ? "" : "hidden"}>${fvI(FVP.x)}</button>
        </div>
        <div class="fv-tabs" role="tablist" aria-label="Jenis laporan">${types
          .map(([v, l]) => `<button role="tab" class="fv-tab ${ST.ft === v ? "on" : ""}" onclick="fvSetType('${v}')">${l}</button>`)
          .join("")}</div>
      </div>
      <div class="fv-chips" role="group" aria-label="Kategori">
        <button class="fv-pill ${ST.fc ? "" : "on"}" onclick="fvSetCat(-1)">Semua kategori</button>
        ${CATS.map((c, i) => `<button class="fv-pill ${ST.fc === c ? "on" : ""}" onclick="fvSetCat(${i})">${fvI(fvCatIcon(c))}${esc(c)}</button>`).join("")}
      </div>
      <div class="fv-selects">
        ${fvForumFilters()}
        <button type="button" class="fv-btn ghost sm" onclick="resetForumFilters()">Reset filter</button>
      </div>
    </section>
    <div id="forum-results">${forumResults()}</div>
  </div>`;
}
function fvSetType(v) {
  ST.ft = v;
  refreshForum();
}
function fvSetCat(i) {
  ST.fc = i < 0 ? "" : CATS[i];
  refreshForum();
}

const fvPalette = ["#9be82f", "#5b7cf0", "#f08c1e", "#0f1110", "#e86bb4", "#2bb5a0", "#c4c6c2"];

function fvForumCard(it, kind) {
  const isLost = kind === "lost";
  const click = isLost ? `detail(${it.id})` : `detailFound(${it.id})`;
  const isAdm = ST.user && ST.user.role === "admin";
  const footText = isLost
    ? (isAdm ? "Chat Pelapor" : "Chat Admin")
    : "Tersimpan di Kemahasiswaan";
  const footTitle = isLost
    ? (isAdm ? "Chat dengan pelapor mengenai barang ini" : "Chat dengan admin mengenai barang ini")
    : "Tersimpan di Kemahasiswaan";

  return `<article class="fv-item" onclick="${click}" tabindex="0" onkeydown="if(event.key==='Enter')${click}">
    <div class="fv-photo">
      ${it.photo ? `<img src="${esc(it.photo)}" alt="${esc(it.name)}" loading="lazy">` : `<span class="fv-ph-ico">${fvI(fvCatIcon(it.cat))}</span>`}
      ${Array.isArray(it.photos) && it.photos.length > 1 ? `<span class="fv-photo-count">${it.photos.length} foto</span>` : ""}
      ${fvChip(it.status)}
      <span class="fv-type ${isLost ? "lost" : "found"}">${isLost ? "Hilang" : "Temuan"}</span>
    </div>
    <div class="fv-item-body">
      <h3>${esc(it.name)}</h3>
      <span class="fv-cat">${fvI(fvCatIcon(it.cat))}${esc(it.cat)}</span>
      <div class="fv-meta">${fvI(FVP.pin)}<span>${esc(it.loc)}</span></div>
      <div class="fv-meta">${fvI(FVP.cal)}<span>${isLost ? "Hilang" : "Ditemukan"} ${fmt(it.date)}</span></div>
      ${isLost ? "" : `<div class="fv-meta">${fvI(FVP.user)}<span>${esc(it.received_by)}</span></div>`}
      <div class="fv-item-foot" ${isLost ? `onclick="event.stopPropagation();chatAbout(${it.id})"` : ""} role="button" tabindex="0" title="${footTitle}" onkeydown="if(event.key==='Enter'){event.stopPropagation();${isLost ? `chatAbout(${it.id})` : click};}"><small>${footText}</small>
        <span class="fv-go" aria-hidden="true">${fvI(FVP.out)}</span></div>
    </div></article>`;
}

function fvForumSection(title, n, sub, body) {
  return `<section class="fv-sec"><div class="fv-sec-head"><h2>${title} <span>${n}</span></h2><small>${sub}</small></div>${body}</section>`;
}

function fvAsideCards(shown) {
  // Sebaran kategori dari item yang sedang tampil
  const counts = {};
  shown.forEach((i) => (counts[i.cat] = (counts[i.cat] || 0) + 1));
  const items = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([label, value], i) => ({ label, value, color: fvPalette[Math.min(i, fvPalette.length - 1)] }));
  const total = shown.length;
  const returned = DB.reports
    .filter((r) => r.status === "FOUND")
    .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
    .slice(0, 4);
  return `
    <section class="fv-card fv-donut-card">
      <div class="fv-card-head"><h2>Sebaran Kategori</h2></div>
      <p class="fv-card-sub">Dari barang yang sedang ditampilkan</p>
      <div class="fv-donut">${fvDonutSVG(items, total)}
        <div class="fv-donut-center"><b>${fvNum(total)}</b><span>Barang</span></div></div>
      <ul class="fv-legend">${
        items.length
          ? items.map((i) => `<li><span class="dot" style="background:${i.color}"></span><span class="nm">${esc(i.label)}</span><b>${fvNum(i.value)}</b><em>${Math.round((i.value / total) * 100)}%</em></li>`).join("")
          : `<li class="fv-legend-empty">Belum ada data untuk ditampilkan.</li>`
      }</ul>
    </section>
    <section class="fv-card">
      <div class="fv-card-head"><h2>Pengembalian Terbaru</h2></div>
      ${
        returned.length
          ? `<ul class="fv-list">${returned
              .map(
                (r) => `<li ${r.id ? `onclick="detail(${r.id})" tabindex="0"` : ""}>
            ${r.photo ? `<img class="fv-return-photo" src="${esc(r.photo)}" alt="${esc(r.name)}" onerror="this.remove()">` : `<span class="fv-ico lime">${fvI(FVP.check)}</span>`}
            <div class="fv-li-main"><b>${esc(r.name)}</b><small>${esc(r.cat)} • ${esc(r.building || r.loc || "Lokasi tidak diketahui")}</small><small>Ditemukan • ${fmt(r.updated_at || r.created_at)}</small></div>
            <span class="fv-chip st-found">Ditemukan</span></li>`,
              )
              .join("")}</ul>`
          : fvEmpty("Belum ada barang yang dikembalikan.")
      }
    </section>
    <section class="fv-card fv-promo">
      <span class="fv-ico lime">${fvI(FVP.shield)}</span>
      <h3>Menemukan barang?</h3>
      <p>Serahkan langsung kepada <b>Petugas Keamanan</b> atau <b>Admin Kemahasiswaan</b>. Barang akan diperiksa sebelum diumumkan secara resmi.</p>
    </section>`;
}

// Hasil pencarian dipisah agar bisa diperbarui tanpa membangun ulang kolom pencarian.
function forumResults() {
  const query = String(ST.q || "").trim().toLocaleLowerCase("id-ID");
  const matchesQuery = (item) => {
    const hay = [item.name, item.brand, item.desc, item.cat, item.loc, item.color]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase("id-ID");
    return !query || hay.includes(query);
  };
  const matchesLocation = (item) =>
    (!ST.fg || item.building === ST.fg) &&
    (!ST.fl || item.loc === ST.fl);

  const matchesStatus = (item) =>
    !ST.fs || item.status === ST.fs;

  const lost = DB.reports
    .filter((r) => (ST.fs ? matchesStatus(r) : ["ACTIVE", "FOUND", "RETURNED"].includes(r.status)))
    .filter((r) => matchesQuery(r) && (!ST.fc || r.cat === ST.fc) && matchesLocation(r));
  const found = DB.found.filter(
    (f) =>
      (!ST.fs || (ST.fs === "FOUND" && ["APPROVED", "MATCHED"].includes(f.status)) || (ST.fs === "RETURNED" && f.status === "RETURNED")) &&
      (ST.fs || ["APPROVED", "MATCHED"].includes(f.status)) &&
      matchesQuery(f) &&
      (!ST.fc || f.cat === ST.fc) &&
      matchesLocation(f),
  );

  const showL = ST.ft !== "found";
  const showF = ST.ft !== "lost";
  const shown = [...(showL ? lost : []), ...(showF ? found : [])];

  const lostBody = lost.length
    ? `<div class="fv-cards">${lost.map((r) => fvForumCard(r, "lost")).join("")}</div>`
    : `<div class="fv-card fv-empty-big">${fvI(FVP.search)}<b>Tidak ada laporan kehilangan yang cocok</b><span>Coba ubah kata kunci atau reset filter.</span></div>`;
  const foundBody = found.length
    ? `<div class="fv-cards">${found.map((f) => fvForumCard(f, "found")).join("")}</div>`
    : `<div class="fv-card fv-empty-big">${fvI(FVP.box)}<b>Belum ada barang temuan yang dipublikasikan</b><span>Barang temuan tampil setelah di-ACC Admin.</span></div>`;

  const isAdm = ST.user && ST.user.role === "admin";
  const lostSubtitle = isAdm
    ? "Klik kartu untuk detail & chat pelapor"
    : "Klik kartu untuk detail & chat admin";

  return `<div class="fv-forum-grid">
    <div class="fv-results">
      ${showL ? fvForumSection("Laporan Barang Hilang", lost.length, lostSubtitle, lostBody) : ""}
      ${showF ? fvForumSection("Barang Temuan Resmi", found.length, "Sudah diserahkan ke Petugas/Admin dan disetujui untuk diumumkan", foundBody) : ""}
    </div>
    <div class="fv-side fv-forum-side">${fvAsideCards(shown)}</div>
  </div>`;
}
