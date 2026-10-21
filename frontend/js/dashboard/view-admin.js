// js/dashboard/view-admin.js — Dashboard Administrator.
// Opsi A: script klasik berurutan. Urutan load di frontend/index.html. Jangan load satuan.
function fvAdminDashboard() {
  const lost = DB.reports.filter((r) => fvInPeriod(r.created_at));
  const found = DB.found.filter((f) => fvInPeriod(f.created_at));
  const rets = fvReturns().filter((r) => fvInPeriod(r.at));
  const approved = lost.filter((r) => ["ACTIVE", "FOUND", "RETURNED", "EXPIRED"].includes(r.status)).length;
  const returned = lost.filter((r) => r.status === "RETURNED").length;
  const rate = approved ? Math.round((returned / approved) * 100) : 0;
  const pendL = DB.reports.filter((r) => r.status === "PENDING").length;
  const pendF = DB.found.filter((f) => f.status === "PENDING_APPROVAL").length;

  const months = fvMonths(FV.months);
  const series = [
    { key: "lost", tab: "Barang Hilang", unit: "laporan", caption: "Laporan barang hilang masuk", data: fvByMonth(DB.reports, (r) => r.created_at, months) },
    { key: "found", tab: "Barang Temuan", unit: "barang", caption: "Barang temuan tercatat", data: fvByMonth(DB.found, (f) => f.created_at, months) },
    { key: "returned", tab: "Pengembalian", unit: "barang", caption: "Barang dikembalikan ke pemilik", data: fvByMonth(fvReturns(), (r) => r.at, months) },
  ];

  $("#main").innerHTML = `<div class="fv">
    <header class="fv-head">
      <div><h1>Dashboard Administrator</h1>
        <p>Pantau laporan barang hilang, barang temuan, dan riwayat pengembalian di satu tempat.</p></div>
      <div class="fv-head-actions">${fvPeriodSelect()}
        <button class="fv-btn" onclick="nav('input_admin')">${fvI(FVP.plus)} Catat Temuan</button></div>
    </header>
    <div class="fv-grid">
      <div class="fv-main">
        <div class="fv-kpis">
          ${fvKpi({ icon: FVP.alert, label: "Laporan Barang Hilang", value: fvNum(lost.length), trend: fvTrend(DB.reports, (r) => r.created_at, false) })}
          ${fvKpi({ icon: FVP.box, label: "Barang Temuan Tercatat", value: fvNum(found.length), trend: fvTrend(DB.found, (f) => f.created_at, true) })}
          ${fvKpi({ icon: FVP.repeat, label: "Barang Dikembalikan", value: fvNum(rets.length), trend: fvTrend(fvReturns(), (r) => r.at, true) })}
          ${fvKpi({ icon: FVP.percent, label: "Tingkat Pengembalian", value: rate + "%", sub: `${fvNum(returned)} dari ${fvNum(approved)} laporan yang disetujui` })}
        </div>
        ${fvBarCard(series, "Aktivitas Bulanan")}
        ${fvQueueCard()}
        ${fvReturnsCard()}
      </div>
      <div class="fv-side">
        ${fvDonutCard({ lostList: lost, foundList: found })}
        <div class="fv-tiles">
          <button class="fv-tile" onclick="nav('masuk')"><span>Hilang menunggu ACC</span><b>${fvNum(pendL)}</b></button>
          <button class="fv-tile" onclick="nav('acc_temuan')"><span>Temuan menunggu ACC</span><b>${fvNum(pendF)}</b></button>
        </div>
        ${fvRecentFoundCard()}
      </div>
    </div></div>`;
}

/* ---------- Dashboard Petugas ---------- */
