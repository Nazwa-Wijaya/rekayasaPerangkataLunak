// js/dashboard/view-petugas.js — Dashboard Petugas.
// Opsi A: script klasik berurutan. Urutan load di frontend/index.html. Jangan load satuan.
function fvPetugasDashboard() {
  const mine = DB.found.filter(
    (f) => f.received_by_id === ST.user.id || String(f.received_by || "").includes(ST.user.name),
  );
  const pend = mine.filter((f) => f.status === "PENDING_APPROVAL").length;
  const ok = mine.filter((f) => f.status === "APPROVED" || f.status === "MATCHED").length;
  const done = mine.filter((f) => f.status === "RETURNED").length;
  const months = fvMonths(FV.months);
  const series = [
    { key: "mine", tab: "Barang Diterima", unit: "barang", caption: "Barang yang Anda terima & catat", data: fvByMonth(mine, (f) => f.created_at, months) },
  ];
  $("#main").innerHTML = `<div class="fv">
    <header class="fv-head">
      <div><h1>Dashboard Petugas</h1>
        <p>Catat barang temuan dari penemu. Setiap catatan akan diperiksa Admin Kemahasiswaan sebelum tayang di forum.</p></div>
      <div class="fv-head-actions"><button class="fv-btn" onclick="nav('input_temuan')">${fvI(FVP.plus)} Catat Barang Temuan</button></div>
    </header>
    <div class="fv-grid">
      <div class="fv-main">
        <div class="fv-kpis">
          ${fvKpi({ icon: FVP.inbox, label: "Total Diterima", value: fvNum(mine.length), trend: fvTrend(mine, (f) => f.created_at, true) })}
          ${fvKpi({ icon: FVP.clock, label: "Menunggu ACC Admin", value: fvNum(pend), sub: "Belum tayang di forum" })}
          ${fvKpi({ icon: FVP.check, label: "Disetujui Admin", value: fvNum(ok), sub: "Tersimpan & siap dicocokkan" })}
          ${fvKpi({ icon: FVP.repeat, label: "Sudah Dikembalikan", value: fvNum(done), sub: "Sampai ke pemilik" })}
        </div>
        ${fvBarCard(series, "Barang yang Anda Terima")}
        <section class="fv-card">
          <div class="fv-card-head"><h2>Barang Terakhir yang Anda Terima</h2>
            <button class="fv-link" onclick="nav('riwayat_petugas')">Lihat semua ${fvI(FVP.out)}</button></div>
          ${
            mine.length
              ? `<ul class="fv-list">${mine
                  .slice(0, 6)
                  .map(
                    (f) => `<li onclick="detailFound(${f.id})" tabindex="0">
                <span class="fv-ico">${fvI(fvCatIcon(f.cat))}</span>
                <div class="fv-li-main"><b>${esc(f.name)}</b><small>${esc(f.loc)} • ${fmt(f.date)}</small></div>
                ${fvChip(f.status)}</li>`,
                  )
                  .join("")}</ul>`
              : fvEmpty("Belum ada barang yang Anda catat.")
          }
        </section>
      </div>
      <div class="fv-side">
        ${fvDonutCard({ lostList: null, foundList: mine, tabs: false })}
        <section class="fv-card fv-promo">
          <span class="fv-ico lime">${fvI(FVP.shield)}</span>
          <h3>Pedoman Petugas</h3>
          <p>Barang temuan yang Anda catat berstatus <b>Menunggu ACC</b> sampai diperiksa Admin. Petugas tidak dapat melakukan ACC.</p>
        </section>
      </div>
    </div></div>`;
}

