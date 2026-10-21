// js/11-admin.js — View admin & petugas: dash, masuk, users, petugas_data, riwayat, dash_petugas, input/riwayat temuan, profil.
// Opsi A: script klasik berurutan. Urutan load di frontend/index.html. Jangan load satuan.
V.dash = function () {
    fvAdminDashboard(); // tampilan baru: dashboard-ui.js
  };

V.masuk = function () {
    const list = DB.reports.filter((r) => r.status === "PENDING");
    $("#main").innerHTML =
      head(
        "Laporan Barang Hilang Masuk — Verifikasi",
        "Laporan kehilangan yang dikirim mahasiswa. Periksa validitasnya sebelum disetujui tayang di forum (maksimal aktif 3 hari).",
      ) +
      tbl(
        [
          "Barang Hilang",
          "Pelapor",
          "Lokasi Hilang",
          "Status",
          "Tindakan Admin",
        ],
        list.map(
          (r) => `
          <tr>
            <td>
              <b>${esc(r.name)}</b>
              <div class="meta">${esc(r.cat)} &bull; ${esc(r.color)}</div>
            </td>
            <td>${esc(uname(r.uid))}</td>
            <td>${esc(r.loc)}</td>
            <td>${badge(r.status)}</td>
            <td>
              <div class="act">
                <button class="btn ghost sm detail-action" onclick="detail(${r.id})">Detail</button>
                <button class="btn sm" onclick="setR(${r.id}, 'ACTIVE');toast('Laporan barang hilang disetujui dan aktif di forum selama 3 hari');app()">Setujui (ACC)</button>
                <button class="btn bad sm" onclick="setR(${r.id}, 'REJECTED');toast('Laporan barang hilang ditolak');app()">Tolak</button>
                <button class="btn ghost sm" onclick="chatAbout(${r.id})">Chat</button>
              </div>
            </td>
          </tr>
        `,
        ),
      );
  };

V.users = async function () {
    $("#main").innerHTML = head(
      "Data Mahasiswa + Verifikasi Regist",
      "Memuat data mahasiswa dari server…",
    );
    try {
      const [p, a, rj] = await Promise.all([
        API.req("/api/users?role=user&status=PENDING").catch(() => ({
          data: [],
        })),
        API.req("/api/users?role=user&status=ACTIVE").catch(() => ({
          data: [],
        })),
        API.req("/api/users?role=user&status=REJECTED").catch(() => ({
          data: [],
        })),
      ]);
      DB.users = [...(p.data || []), ...(a.data || []), ...(rj.data || [])];
    } catch (e) {
      $("#main").innerHTML = head(
        "Data Mahasiswa + Verifikasi Regist",
        "Gagal memuat: " + e.message,
      );
      return;
    }
    const tab = ST.userTab || "pending";
    const pending = DB.users.filter(
      (u) => u.role === "user" && u.verification_status === "PENDING",
    );
    const active = DB.users.filter(
      (u) => u.role === "user" && u.verification_status === "ACTIVE",
    );
    const rejected = DB.users.filter(
      (u) => u.role === "user" && u.verification_status === "REJECTED",
    );
    // KTM: base64 langsung dari DB, atau path lama -> endpoint /uploads/ktm/<file>?token=...
    // (img/link tidak bisa kirim header Authorization, jadi token lewat query)
    const ktmSrc = (u) => {
      if (!u.ktm_photo) return "";
      if (/^data:image\//.test(u.ktm_photo)) return u.ktm_photo;
      if (/^(blob:|https?:)/.test(u.ktm_photo)) return u.ktm_photo;
      const file = String(u.ktm_photo).split("/").pop();
      return `/uploads/ktm/${encodeURIComponent(file)}?token=${encodeURIComponent(ST.token || "")}`;
    };
    const ktmCell = (u) =>
      u.ktm_photo
        ? `<a href="${ktmSrc(u)}" target="_blank" rel="noopener"><img src="${ktmSrc(u)}" alt="KTM ${esc(u.name)}" style="width:72px;height:48px;object-fit:cover;border-radius:6px;border:1px solid var(--line)" onerror="this.outerHTML='<span class=meta>Foto rusak</span>'"></a>`
        : `<span class="meta">Tanpa KTM</span>`;

    const pendingTbl = tbl(
      ["Mahasiswa + KTM", "NIM", "Program Studi", "Tindakan Admin"],
      pending.map(
        (u) => `
        <tr>
          <td><div style="display:flex;gap:10px;align-items:center">${ktmCell(u)}<div><b>${esc(u.name)}</b><div class="meta">Daftar: ${u.created_at ? fmt(u.created_at) : "-"}</div></div></div></td>
          <td>${esc(u.nim)}</td>
          <td>${esc(u.prodi)}</td>
          <td><div class="act">
            <button class="btn ghost sm detail-action" onclick="detailKtm(${u.id})">Lihat KTM</button>
            <button class="btn sm" onclick="verifyReg(${u.id}, true)">Setujui</button>
            <button class="btn bad sm" onclick="verifyReg(${u.id}, false)">Tolak</button>
          </div></td>
        </tr>`,
      ),
    );
    const activeTbl = tbl(
      ["Nama Lengkap", "NIM", "Program Studi", "Total Laporan", "Aksi"],
      active.map(
        (u) => `
        <tr>
          <td><b>${esc(u.name)}</b></td>
          <td>${esc(u.nim)}</td>
          <td>${esc(u.prodi)}</td>
          <td>${DB.reports.filter((r) => r.uid === u.id).length} laporan</td>
          <td><button class="btn ghost sm" onclick="ST.chat=${u.id};ST.chatReportId=null;nav('pesan')">Chat Mahasiswa</button></td>
        </tr>`,
      ),
    );
    const rejectedTbl = tbl(
      ["Nama", "NIM", "Alasan Ditolak", "Aksi"],
      rejected.map(
        (u) => `
        <tr>
          <td><b>${esc(u.name)}</b><div class="meta">${esc(u.prodi)}</div></td>
          <td>${esc(u.nim)}</td>
          <td>${esc(u.rejected_reason || "-")}</td>
          <td><button class="btn sm" onclick="verifyReg(${u.id}, true)">Setujui</button></td>
        </tr>`,
      ),
    );

    $("#main").innerHTML =
      head(
        "Data Mahasiswa + Verifikasi Regist",
        "Pendaftar baru wajib upload KTM. Setujui agar bisa masuk, atau tolak dengan alasan.",
      ) +
      `<div class="tabs" style="max-width:560px;margin-bottom:18px">
        <button class="${tab === "pending" ? "on" : ""}" onclick="ST.userTab='pending';app()">Perlu Verifikasi (${pending.length})</button>
        <button class="${tab === "active" ? "on" : ""}" onclick="ST.userTab='active';app()">Aktif (${active.length})</button>
        <button class="${tab === "rejected" ? "on" : ""}" onclick="ST.userTab='rejected';app()">Ditolak (${rejected.length})</button>
      </div>` +
      (tab === "pending"
        ? pendingTbl
        : tab === "rejected"
          ? rejectedTbl
          : activeTbl);
  };

V.petugas_data = async function () {
    $("#main").innerHTML = head("Data Petugas Kampus", "Memuat…");
    try {
      const r = await API.req("/api/users?role=petugas");
      DB.users = [
        ...DB.users.filter((u) => u.role !== "petugas"),
        ...(r.data || []),
      ];
    } catch (e) {
      $("#main").innerHTML = head(
        "Data Petugas Kampus",
        "Gagal memuat: " + e.message,
      );
      return;
    }
    const list = DB.users.filter((u) => u.role === "petugas");
    $("#main").innerHTML =
      head(
        "Data Petugas Kampus",
        "Petugas yang berwenang menerima barang temuan di lapangan.",
      ) +
      tbl(
        ["Nama Petugas", "Peran / Bagian", "Barang Diterima"],
        list.map(
          (p) => `
          <tr>
            <td><b>${esc(p.name)}</b></td>
            <td>${esc(p.prodi)}</td>
            <td>${DB.found.filter((f) => f.received_by.includes(p.name)).length} barang</td>
          </tr>
        `,
        ),
      );
  };

V.riwayat = function () {
    $("#main").innerHTML =
      head(
        "Riwayat & Arsip Laporan",
        "Seluruh arsip laporan kehilangan, status kedaluwarsa 3 hari, barang ditolak, dan barang yang sudah kembali.",
      ) +
      tbl(
        ["Barang", "Pelapor", "Tanggal Lapor", "Status", "Aksi"],
        DB.reports.map(
          (r) => `
          <tr>
            <td>
              <b>${esc(r.name)}</b>
              <div class="meta">${esc(r.cat)}</div>
            </td>
            <td>${esc(uname(r.uid))}</td>
            <td>${fmt(r.date)}</td>
            <td>${badge(r.status)}</td>
            <td>
              <button class="btn ghost sm detail-action" onclick="detail(${r.id})">Detail</button>
            </td>
          </tr>
        `,
        ),
      );
  };

V.dash_petugas = function () {
    fvPetugasDashboard(); // tampilan baru: dashboard-ui.js
  };

V.input_temuan = function () {
    $("#main").innerHTML =
      head(
        "Catat Barang Temuan",
        "Barang temuan yang diserahkan mahasiswa penemu kepada petugas keamanan / kampus.",
      ) +
      `
      <form class="card pad form" onsubmit="event.preventDefault();submitFoundPetugas(this)">
        <div class="f">
          <label>Nama barang <span style="color:var(--err)">*</span></label>
          <input name="n" required placeholder="Contoh: Kunci motor Beat">
        </div>
        <div class="f">
          <label>Kategori <span style="color:var(--err)">*</span></label>
          <select name="c">${opts(CATS)}</select>
        </div>
        <div class="f">
          <label>Warna</label>
          <input name="w" placeholder="Contoh: Hitam">
        </div>
        <div class="f">
          <label>Merk</label>
          <input name="b" placeholder="Contoh: Honda">
        </div>
        <div class="f">
          <label>Gedung <span style="color:var(--err)">*</span></label>
          <select name="g" onchange="gdg(this)">
            <option>Gedung A</option>
            <option>Gedung B</option>
          </select>
        </div>
        <div class="f">
          <label>Lokasi ditemukan <span style="color:var(--err)">*</span></label>
          <select name="l" onchange="kls(this)">${locOpts("Gedung A")}</select>
        </div>
        <div class="f kn">
          <label>Nomor ruang kelas (4 digit)</label>
          <input name="kn" inputmode="numeric" autocomplete="off" required maxlength="4" minlength="4" pattern="[0-9]{4}" title="Isi 4 digit angka" placeholder="Contoh: 1305" oninput="this.value=this.value.replace(/[^0-9]/g,'')">
        </div>
        <div class="f w">
          <label>Foto barang temuan</label>
          <input type="file" name="foto" accept="image/*" onchange="previewImg(this, '#preview-petugas-found')">
          <img id="preview-petugas-found" class="img-preview" style="display:none">
        </div>
        <div class="f w">
          <label>Deskripsi & kondisi saat diserahkan</label>
          <textarea name="ds" placeholder="Kondisi barang dan nama penemu yang menyerahkan..."></textarea>
        </div>
        <div class="w" style="margin-top:10px">
          <button class="btn">Simpan Barang Temuan (Kirim ke Admin untuk ACC)</button>
        </div>
      </form>
    `;
  };

V.riwayat_petugas = function () {
    const list = DB.found.filter(
      (f) =>
        f.received_by_id === ST.user.id ||
        String(f.received_by || "").includes(ST.user.name),
    );
    $("#main").innerHTML =
      head(
        "Riwayat Barang Diterima",
        "Seluruh barang temuan yang pernah Anda terima.",
      ) +
      tbl(
        ["Barang", "Kategori", "Lokasi", "Tanggal", "Status", ""],
        list.map(
          (f) => `
          <tr>
            <td><b>${esc(f.name)}</b></td>
            <td>${esc(f.cat)}</td>
            <td>${esc(f.loc)}</td>
            <td>${fmt(f.date)}</td>
            <td>${badge(f.status)}</td>
            <td><button class="btn ghost sm detail-action" onclick="detailFound(${f.id})">Detail</button></td>
          </tr>
        `,
        ),
      );
  };

V.profil = function () {
    const u = ST.user;
    $("#main").innerHTML =
      head("Profil Akun", "Informasi akun pengguna Anda.") +
      `
      <div class="card pad" style="max-width:540px">
        <dl class="dl">
          <dt>Nama lengkap</dt><dd>${esc(u.name)}</dd>
          <dt>NIM / ID</dt><dd>${esc(u.nim)}</dd>
          <dt>Program studi</dt><dd>${esc(u.prodi)}</dd>
          <dt>Hak akses (Role)</dt><dd><span class="badge ACTIVE">${esc(u.role.toUpperCase())}</span></dd>
        </dl>
        <div style="margin-top:24px;display:flex;gap:10px">
          <button class="btn bad sm" onclick="logout()">Keluar Akun</button>
        </div>
      </div>
    `;
  };

