// js/dashboard/charts.js — KPI + grafik batang + donut.
// Opsi A: script klasik berurutan. Urutan load di frontend/index.html. Jangan load satuan.
/* ---------- Komponen: kartu KPI ---------- */
function fvKpi({ icon, label, value, sub, trend }) {
  let chip = "";
  if (trend) {
    const diff = trend.cur - trend.prev;
    const dir = diff > 0 ? "up" : diff < 0 ? "down" : "flat";
    const tone =
      dir === "flat" ? "flat" : (dir === "up") === trend.goodWhenUp ? "good" : "warn";
    const txt =
      dir === "flat"
        ? "Sama seperti bulan lalu"
        : `${diff > 0 ? "+" : "−"}${fvNum(Math.abs(diff))} dari bulan lalu`;
    chip = `<div class="fv-delta ${tone}"><span>${txt}</span><i>${fvI(FVP[dir])}</i></div>`;
  }
  return `<div class="fv-card fv-kpi">
    <div class="fv-kpi-top"><span class="fv-kpi-ico">${fvI(icon)}</span><span class="fv-kpi-label">${label}</span></div>
    <div class="fv-kpi-val">${value}</div>
    ${chip || `<div class="fv-kpi-sub">${sub || ""}</div>`}
  </div>`;
}
const fvTrend = (list, getDate, goodWhenUp) => {
  const now = new Date();
  const k = fvMonthKey(now);
  let cur = 0,
    prev = 0;
  list.forEach((x) => {
    const t = fvDate(getDate(x));
    if (!t) return;
    const mk = fvMonthKey(t);
    if (mk === k) cur++;
    else if (mk === k - 1) prev++;
  });
  return { cur, prev, goodWhenUp };
};

/* ---------- Komponen: grafik batang ---------- */
function fvNiceTicks(max) {
  const step = Math.max(1, Math.ceil(Math.max(max, 1) / 4));
  return [0, 1, 2, 3, 4].map((i) => i * step);
}

function fvBarsHTML() {
  const c = FV.chart;
  const s = c.series.find((x) => x.key === c.active) || c.series[0];
  const ticks = fvNiceTicks(Math.max(...s.data, 0));
  const top = ticks[4];
  const last = c.months.length - 1;
  const total = s.data.reduce((a, b) => a + b, 0);
  const cols = c.months
    .map((m, i) => {
      const v = s.data[i];
      const h = top ? (v / top) * 100 : 0;
      return `<div class="fv-col ${i === last ? "is-hi" : ""}" data-i="${i}" tabindex="0" role="img"
          aria-label="${m.full}: ${v} ${s.unit}" style="--h:${h}%"
          onmouseenter="fvHi(${i})" onfocus="fvHi(${i})">
        <div class="fv-track"><div class="fv-fill ${v ? "" : "is-zero"}" style="height:${h}%"></div>
        <div class="fv-tip"><span><b>${fvNum(v)}</b> ${s.unit}</span><small>${m.full}</small></div></div></div>`;
    })
    .join("");
  const labels = c.months
    .map((m, i) => `<span class="fv-xl ${i === last ? "is-hi" : ""}" data-i="${i}">${m.label}</span>`)
    .join("");
  return {
    total,
    unit: s.unit,
    label: s.caption,
    html: `<div class="fv-yaxis">${[...ticks].reverse().map((t) => `<span>${t}</span>`).join("")}</div>
      <div class="fv-bars" id="fv-bars" style="--n:${c.months.length}" onmouseleave="fvHi(${last})">${cols}</div>
      <span></span>
      <div class="fv-xlabels" style="--n:${c.months.length}">${labels}</div>`,
  };
}

function fvRenderBars() {
  const box = document.getElementById("fv-chart");
  if (!box) return;
  const b = fvBarsHTML();
  box.innerHTML = b.html;
  const n = document.getElementById("fv-bignum");
  if (n) n.innerHTML = `<b>${fvNum(b.total)}</b><span>${b.label}</span>`;
  document.querySelectorAll("[data-fv-series]").forEach((el) =>
    el.classList.toggle("on", el.dataset.fvSeries === FV.chart.active),
  );
}
function fvSetSeries(key) {
  FV.series = key;
  FV.chart.active = key;
  fvRenderBars();
}
function fvHi(i) {
  document.querySelectorAll("#fv-chart .fv-col, #fv-chart .fv-xl").forEach((el) =>
    el.classList.toggle("is-hi", Number(el.dataset.i) === i),
  );
}

function fvBarCard(seriesList, title) {
  const months = fvMonths(FV.months);
  FV.chart = {
    months,
    series: seriesList,
    active: seriesList.some((s) => s.key === FV.series) ? FV.series : seriesList[0].key,
  };
  const b = fvBarsHTML();
  const tabs =
    seriesList.length > 1
      ? `<div class="fv-tabs" role="tablist">${seriesList
          .map(
            (s) =>
              `<button role="tab" class="fv-tab ${s.key === FV.chart.active ? "on" : ""}" data-fv-series="${s.key}" onclick="fvSetSeries('${s.key}')">${s.tab}</button>`,
          )
          .join("")}</div>`
      : "";
  return `<section class="fv-card fv-chart-card">
    <div class="fv-card-head"><h2>${title}</h2>${tabs}</div>
    <div class="fv-chart-top">
      <div class="fv-bignum" id="fv-bignum"><b>${fvNum(b.total)}</b><span>${b.label}</span></div>
      <span class="fv-chart-note">${FV.months} bulan terakhir</span>
    </div>
    <div class="fv-chart" id="fv-chart">${b.html}</div>
  </section>`;
}

/* ---------- Komponen: donut ---------- */
function fvDonutSVG(items, total) {
  const R = 80,
    W = 24,
    GAP = 6,
    C = 2 * Math.PI * R;
  const live = items.filter((i) => i.value > 0);
  let arcs = "";
  if (!total) {
    arcs = `<circle cx="120" cy="120" r="${R}" fill="none" stroke="#ececea" stroke-width="${W}"/>`;
  } else if (live.length === 1) {
    arcs = `<circle cx="120" cy="120" r="${R}" fill="none" stroke="${live[0].color}" stroke-width="${W}"/>`;
  } else {
    let pos = 0;
    live.forEach((it) => {
      const len = (it.value / total) * C;
      const dash = Math.max(0.5, len - W - GAP);
      arcs += `<circle class="fv-arc" cx="120" cy="120" r="${R}" fill="none" stroke="${it.color}" stroke-width="${W}"
        stroke-linecap="round" stroke-dasharray="${dash} ${C - dash}" stroke-dashoffset="${-(pos + (W + GAP) / 2)}"/>`;
      pos += len;
    });
  }
  return `<svg viewBox="0 0 240 240" class="fv-donut-svg" role="img" aria-label="Diagram komposisi">
    <circle cx="120" cy="120" r="108" fill="none" stroke="#c9cbc6" stroke-width="1.5" stroke-dasharray="3 6"/>
    <g transform="rotate(-90 120 120)">${arcs}</g></svg>`;
}

const FV_LOST_STATUS = [
  ["PENDING", "Menunggu ACC", "#f5b52e"],
  ["ACTIVE", "Aktif di forum", "#9be82f"],
  ["FOUND", "Cocok, siap diambil", "#5b7cf0"],
  ["RETURNED", "Sudah dikembalikan", "#0f1110"],
  ["REJECTED", "Ditolak", "#ef6b5b"],
  ["EXPIRED", "Kedaluwarsa", "#c4c6c2"],
];
const FV_FOUND_STATUS = [
  ["PENDING_APPROVAL", "Menunggu ACC", "#f5b52e"],
  ["APPROVED", "Tersimpan resmi", "#9be82f"],
  ["MATCHED", "Dicocokkan", "#5b7cf0"],
  ["RETURNED", "Sudah dikembalikan", "#0f1110"],
  ["REJECTED", "Ditolak", "#ef6b5b"],
];

function fvDonutCard({ lostList, foundList, tabs = true }) {
  const isLost = !!lostList && (FV.donut === "lost" || !foundList);
  const list = isLost ? lostList : foundList;
  const defs = isLost ? FV_LOST_STATUS : FV_FOUND_STATUS;
  const items = defs.map(([k, label, color]) => ({
    label,
    color,
    value: list.filter((x) => x.status === k).length,
  }));
  const total = list.length;
  const tabHTML = tabs
    ? `<div class="fv-tabs sm" role="tablist">
        <button class="fv-tab ${isLost ? "on" : ""}" onclick="fvSetDonut('lost')">Hilang</button>
        <button class="fv-tab ${!isLost ? "on" : ""}" onclick="fvSetDonut('found')">Temuan</button></div>`
    : "";
  return `<section class="fv-card fv-donut-card" id="fv-donut-card">
    <div class="fv-card-head"><h2>Komposisi Status</h2>${tabHTML}</div>
    <p class="fv-card-sub">${isLost ? "Laporan barang hilang dari mahasiswa" : "Barang temuan yang dicatat petugas/admin"}</p>
    <div class="fv-donut">${fvDonutSVG(items, total)}
      <div class="fv-donut-center"><b>${fvNum(total)}</b><span>${isLost ? "Total laporan" : "Total barang"}</span></div></div>
    <ul class="fv-legend">${items
      .map(
        (i) =>
          `<li><span class="dot" style="background:${i.color}"></span><span class="nm">${i.label}</span><b>${fvNum(i.value)}</b><em>${total ? Math.round((i.value / total) * 100) : 0}%</em></li>`,
      )
      .join("")}</ul>
  </section>`;
}
function fvSetDonut(k) {
  FV.donut = k;
  V[ST.user && ST.user.role === "petugas" ? "dash_petugas" : "dash"]();
}

/* ---------- Dashboard Administrator ---------- */
