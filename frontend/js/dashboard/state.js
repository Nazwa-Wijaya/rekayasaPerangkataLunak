// js/dashboard/state.js — State tampilan FV.
// Opsi A: script klasik berurutan. Urutan load di frontend/index.html. Jangan load satuan.
const FV = {
  period: "all", // all | 30 | 7  (filter periode dashboard)
  series: "lost", // tab grafik batang: lost | found | returned
  donut: "lost", // tab donut: lost | found
  queue: "lost", // tab antrean verifikasi: lost | found
  retQuery: "", // pencarian riwayat pengembalian
  months: 8, // jumlah bulan pada grafik batang
  chart: null, // data grafik yang sedang tampil
};

/* ---------- Ikon ---------- */

