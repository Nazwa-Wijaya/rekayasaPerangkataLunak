// js/06-router.js — Router: nav/render/app + beranda publik + wadah V.
// Opsi A: script klasik berurutan. Urutan load di frontend/index.html. Jangan load satuan.
const nav = (v) => {
  if (window._chatPollTimer && v !== "pesan") {
    clearInterval(window._chatPollTimer);
    window._chatPollTimer = null;
  }
  ST.view = v;
  ST.q = ST.fc = ST.fl = ST.fs = ST.fg = ST.ft = "";
  closeAllDlg();
  const m = $("#main");
  if (m) m.classList.remove("chat-page");
  render();
};

async function render() {
  if (ST.user) {
    await refreshStore();
    return app();
  }
  // Restore sesi JWT setelah refresh. Gagal -> anggap belum login.
  if (ST.token && !ST._meTried) {
    ST._meTried = true;
    try {
      const r = await API.req("/api/auth/me");
      ST.user = r.user;
      return enterAppByRole(r.user);
    } catch (_) {
      setSession(null, null);
      ST._meTried = false;
    }
  }
  // Halaman publik butuh data forum dari API (tanpa login).
  const h = location.hash;
  // Portal staf lama (#/staff, #/admin, #/petugas) dilebur ke satu pintu masuk #/masuk.
  if (h === "#/admin" || h === "#/petugas" || h === "#/staff") {
    location.hash = "#/masuk";
    ST.auth = "login";
    return auth();
  }
  if (h === "#/masuk") return auth();
  if (h.startsWith("#/reset-password")) return auth();
  await refreshStore();
  return beranda();
}

function beranda() {
  const activeReports = DB.reports.filter(
    (r) => r.status === "ACTIVE" || r.status === "FOUND",
  ).length;
  const officialFound = DB.found.filter(
    (f) => f.status === "APPROVED" || f.status === "MATCHED",
  ).length;
  const waiting = DB.reports.filter((r) => r.status === "PENDING").length;
  const returned = DB.reports.filter((r) => r.status === "RETURNED").length;

  $("#root").innerHTML = `
    <header class="public-header">
      ${logo}
      <nav class="public-nav" aria-label="Navigasi utama">
        <a class="public-nav-link" href="#" onclick="event.preventDefault();document.querySelector('#main')?.scrollIntoView({behavior:'smooth'});">Forum barang</a>
        <button class="btn sm" onclick="goLogin()">Masuk</button>
      </nav>
    </header>

    <section class="home-hero" aria-labelledby="home-title">
      <div class="home-hero-inner">
        <div class="home-hero-copy">
          <span class="home-eyebrow"><span class="home-eyebrow-dot"></span> LAYANAN RESMI KAMPUS</span>
          <h1 id="home-title">Barang hilang? <span>Mari temukan kembali.</span></h1>
          <p>Temukan informasi barang temuan, laporkan barang yang hilang, dan pantau prosesnya melalui satu layanan kampus yang mudah digunakan.</p>
          <div class="home-actions" aria-label="Pilihan tindakan">
            <button class="btn home-btn-primary" onclick="goLogin('Masuk untuk membuat laporan kehilangan')">${ic(IC.chat)} Laporkan Barang Hilang</button>
            <button class="btn home-btn-secondary" onclick="focusForumSearch()">${ic(IC.logo)} Cari Barang</button>
          </div>
          <p class="home-note">Satu tombol <b>Masuk</b> untuk semua peran: mahasiswa, petugas, dan admin akan otomatis diarahkan ke tampilannya masing-masing setelah masuk. Mahasiswa dapat membuat laporan kehilangan. Barang yang ditemukan wajib diserahkan kepada petugas atau Admin Kemahasiswaan.</p>
        </div>
        <div class="home-hero-art" aria-hidden="true">
          <div class="hero-orbit hero-orbit-one"></div><div class="hero-orbit hero-orbit-two"></div>
          <div class="hero-search-card"><span class="hero-icon-wrap">${ic(IC.logo)}</span><div><b>Lost & Found Kampus</b><small>Satu tempat untuk mencari dan melaporkan</small></div><span class="hero-check">${ic(IC.check)}</span></div>
          <div class="hero-mini-card hero-mini-top"><span class="hero-mini-icon">${ic(IC.photo)}</span><span><b>Barang temuan</b><small>Informasi resmi kampus</small></span></div>
          <div class="hero-mini-card hero-mini-bottom"><span class="hero-mini-icon green">${ic(IC.chat)}</span><span><b>Bantuan admin</b><small>Verifikasi lebih terarah</small></span></div>
        </div>
      </div>
    </section>

    <section class="home-stats-section" aria-label="Ringkasan data layanan">
      <div class="home-stats">
        <div class="home-stat"><span class="home-stat-icon blue">${ic(IC.chat)}</span><div><b>${activeReports}</b><span>Laporan aktif</span></div></div>
        <div class="home-stat"><span class="home-stat-icon green">${ic(IC.check)}</span><div><b>${officialFound}</b><span>Barang temuan resmi</span></div></div>
        <div class="home-stat"><span class="home-stat-icon amber">${ic(IC.eye)}</span><div><b>${waiting}</b><span>Menunggu verifikasi</span></div></div>
        <div class="home-stat"><span class="home-stat-icon purple">${ic(IC.shield)}</span><div><b>${returned}</b><span>Sudah dikembalikan</span></div></div>
      </div>
    </section>

    <section class="home-rules">
      <div class="home-rules-inner"><span class="home-rules-icon">${ic(IC.shield)}</span><div><b>Prosedur barang temuan</b><p>Jika menemukan barang di lingkungan kampus, serahkan langsung kepada Petugas Keamanan atau Admin Kemahasiswaan. Barang akan diperiksa sebelum diumumkan secara resmi.</p></div><span class="home-rule-time">Laporan aktif hingga 3 hari setelah disetujui</span></div>
    </section>

    <main id="main" class="home-main"></main>

    <footer class="public-footer">
      <div class="public-footer-inner">
        <div class="footer-brand">${logo}<p>Layanan informasi barang hilang dan temuan di lingkungan kampus.</p></div>
        <div class="footer-column"><b>Jelajahi</b><a href="#" onclick="event.preventDefault();document.querySelector('#main')?.scrollIntoView({behavior:'smooth'});">Forum barang</a><button onclick="focusForumSearch()">Cari barang</button><button onclick="goLogin('Masuk untuk membuat laporan kehilangan')">Lapor kehilangan</button></div>
        <div class="footer-column"><b>Bantuan & akses</b><button onclick="goLogin()">Masuk ke akun Anda</button><span>Satu tombol Masuk untuk mahasiswa, petugas, dan admin. Barang temuan diproses melalui Petugas Keamanan / Admin Kemahasiswaan.</span></div>
      </div>
      <div class="footer-bottom"><span>© ${new Date().getFullYear()} Lost & Found Kampus</span><span>Gunakan layanan dengan jujur dan bertanggung jawab.</span></div>
    </footer>
  `;
  V.forum();
}

function focusForumSearch() {
  const search = $("#sq");
  if (search) {
    search.focus({ preventScroll: true });
    search.scrollIntoView({ behavior: "smooth", block: "center" });
    search.closest(".fv-search")?.classList.add("search-focused");
    setTimeout(
      () => search.closest(".fv-search")?.classList.remove("search-focused"),
      1100,
    );
  } else {
    $("#main")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function goLogin(m) {
  closeAllDlg();
  ST.auth = "login";
  if (m) toast(m);
  location.hash = "#/masuk";
  render();
}

// Logo diklik: kembali ke halaman awal.
// - Belum login -> Beranda publik (#/)
// - Sudah login -> Dashboard awal sesuai peran (admin/petugas: dash, mahasiswa: forum)

// Logo diklik: kembali ke halaman awal.
// - Belum login -> Beranda publik (#/)
// - Sudah login -> Dashboard awal sesuai peran (admin/petugas: dash, mahasiswa: forum)
function goHome() {
  closeAllDlg();
  if (!ST.user) {
    location.hash = "#/";
    return render();
  }
  if (ST.user.role === "admin") {
    ST.view = "dash";
  } else if (ST.user.role === "petugas") {
    ST.view = "dash_petugas";
  } else {
    ST.view = "forum";
  }
  ST.q = ST.fc = ST.fl = ST.fs = ST.fg = ST.ft = "";
  return render();
}

window.addEventListener("hashchange", () => {
  if (!ST.user) render();
});

async function app() {
  const role = ST.user.role;
  const a = role === "admin";
  const p = role === "petugas";

  const pendReports = DB.reports.filter((r) => r.status === "PENDING").length;
  const pendFound = DB.found.filter(
    (f) => f.status === "PENDING_APPROVAL",
  ).length;
  const foundItemsCount = DB.reports.filter((r) => r.status === "FOUND").length;
  const unr = unread();

  if (ST.view === "pesan") {
    if (a && (!ST.chat || !DB.users.some((u) => u.id === ST.chat))) {
      const sorted = getSortedStudentsForAdmin();
      if (sorted.length) ST.chat = sorted[0].id;
    }
    markRead();
  }

  let M = [];
  if (a) {
    M = [
      ["Utama"],
      ["dash", "Dashboard"],
      ["pesan", "Pesan / Chat", unr],
      ["Laporan Barang Hilang"],
      ["masuk", "Hilang Masuk — Verifikasi", pendReports],
      ["forum", "Forum Lost & Found"],
      ["Laporan Barang Ditemukan"],
      ["acc_temuan", "Temuan Masuk — ACC", pendFound],
      ["input_admin", "Catat Temuan Langsung"],
      ["Pencocokan & Penyerahan"],
      ["cocok", "Pencocokan Barang"],
      ["kembali", "Pengembalian", foundItemsCount],
      ["Data Master"],
      ["users", "Data Mahasiswa"],
      ["petugas_data", "Data Petugas"],
      ["riwayat", "Riwayat & Arsip"],
    ];
  } else if (p) {
    M = [
      ["Utama"],
      ["dash_petugas", "Dashboard Petugas"],
      ["Barang Temuan"],
      ["input_temuan", "Catat Barang Temuan"],
      ["riwayat_petugas", "Riwayat Barang Diterima"],
      ["Forum & Akun"],
      ["forum", "Forum Lost & Found"],
      ["profil", "Profil Petugas"],
    ];
  } else {
    M = [
      ["forum", "Forum Lost & Found"],
      ["lapor", "Laporkan Kehilangan"],
      ["saya", "Laporan Saya"],
      ["pesan", "Pesan ke Admin", unr],
      ["profil", "Profil"],
    ];
  }

  if (!ST.view) {
    ST.view = M.find((m) => m.length > 1)[0];
  }

  closeSide();

  const roleText = a
    ? "Administrator Kemahasiswaan"
    : p
      ? "Petugas Keamanan / Kampus"
      : "NIM " + ST.user.nim;
  const userInitial = esc((ST.user.name || "?").trim().charAt(0).toUpperCase());
  const logoImg = `<img src="assets/logo.png" alt="Logo Lost & Found Kampus">`;

  $("#root").innerHTML = `
    <div class="app">
      <aside id="side" aria-label="Navigasi utama">
        <div class="logo" onclick="goHome()" style="cursor:pointer" data-tip="Lost & Found Kampus">
          ${logoImg}<span class="logo-txt">Lost & Found Kampus</span>
        </div>
        <button class="side-close" type="button" aria-label="Tutup menu" onclick="closeSide()">${ic(NAV_IC.close)}</button>
        ${M.map((m) =>
          m.length === 1
            ? `<div class="grp">${m[0]}</div>`
            : `<button class="nav ${ST.view === m[0] ? "on" : ""}" data-tip="${esc(m[1] + (m[2] ? " (" + m[2] + ")" : ""))}" aria-label="${esc(m[1])}" onclick="nav('${m[0]}')">
                <span class="nav-ic" aria-hidden="true">${navIcon(m[0])}</span>
                <span class="nav-txt">${m[1]}</span>
                ${m[2] ? `<span class="cnt">${m[2]}</span>` : ""}
              </button>`,
        ).join("")}
        <div class="me">
          <div class="me-info" tabindex="0" data-tip="${esc(ST.user.name)} — ${esc(roleText)}">
            <span class="me-av" aria-hidden="true">${userInitial}</span>
            <span class="me-txt"><b>${esc(ST.user.name)}</b><span class="me-role">${esc(roleText)}</span></span>
          </div>
          <button class="me-out" type="button" data-tip="Keluar Akun" aria-label="Keluar Akun" onclick="closeSide();logout()">
            ${ic(NAV_IC.logout)}<span class="me-out-txt">Keluar Akun</span>
          </button>
        </div>
      </aside>
      <div class="m-bar">
        <button class="m-burger" type="button" aria-label="Buka menu" aria-controls="side" aria-expanded="false" onclick="toggleSide()">${ic(NAV_IC.menu)}</button>
        <div class="m-brand" onclick="goHome()">${logoImg}<span>Lost & Found Kampus</span></div>
      </div>
      <div class="side-overlay" onclick="closeSide()"></div>
      <main id="main"></main>
    </div>
  `;

  if (V[ST.view]) {
    await V[ST.view]();
  } else {
    V.forum();
  }
}

// Wadah view; diisi 08-12 (V.lapor = ..., dst).
const V = {};
