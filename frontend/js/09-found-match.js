// js/09-found-match.js — Barang temuan + pencocokan: view ACC/input/cocok/kembali + aksi API.
// Opsi A: script klasik berurutan. Urutan load di frontend/index.html. Jangan load satuan.
V.acc_temuan = function () {
    const list = DB.found.filter((f) => f.status === "PENDING_APPROVAL");
    $("#main").innerHTML =
      head(
        "Laporan Barang Ditemukan Masuk — ACC",
        "Barang temuan yang diserahkan penemu ke petugas/admin. ACC agar tampil di forum sebagai barang temuan resmi.",
      ) +
      tbl(
        [
          "Barang Temuan",
          "Kategori",
          "Lokasi Temuan",
          "Diterima Oleh",
          "Tanggal Diterima",
          "Tindakan Admin",
        ],
        list.map(
          (f) => `
          <tr>
            <td>
              <b>${esc(f.name)}</b>
              <div class="meta">${esc(f.color || "-")} &bull; ${esc(f.brand || "-")}</div>
            </td>
            <td>${esc(f.cat)}</td>
            <td>${esc(f.loc)}</td>
            <td>${esc(f.received_by)}</td>
            <td>${fmt(f.date)}</td>
            <td>
              <div class="act">
                <button class="btn ghost sm detail-action" onclick="detailFound(${f.id})">Detail</button>
                <button class="btn sm" onclick="accFoundItem(${f.id})">Setujui (ACC)</button>
                <button class="btn bad sm" onclick="rejectFoundItem(${f.id})">Tolak</button>
              </div>
            </td>
          </tr>
        `,
        ),
      );
  };

V.input_admin = function () {
    $("#main").innerHTML =
      head(
        "Catat Barang Temuan Langsung (Admin)",
        "Jika mahasiswa penemu menyerahkan barang langsung kepada Admin di kantor kemahasiswaan.",
      ) +
      `
      <form class="card pad form" onsubmit="event.preventDefault();submitFoundDirect(this)">
        <div class="f">
          <label>Nama barang temuan <span style="color:var(--err)">*</span></label>
          <input name="n" required placeholder="Contoh: Kunci motor Honda">
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
          <input type="file" name="foto" accept="image/*" onchange="previewImg(this, '#preview-admin-found')">
          <img id="preview-admin-found" class="img-preview" style="display:none">
        </div>
        <div class="f w">
          <label>Deskripsi & kondisi barang saat diterima</label>
          <textarea name="ds" placeholder="Kondisi barang, isi, dan tempat penyimpanan di kantor kemahasiswaan..."></textarea>
        </div>
        <div class="w">
          <button class="btn">Simpan Barang Temuan (Langsung APPROVED)</button>
        </div>
      </form>
    `;
  };

V.cocok = function () {
    const rs = DB.reports.filter((r) => r.status === "ACTIVE");
    const fs = DB.found.filter((f) => f.status === "APPROVED");
    const ok = rs.length && fs.length;

    // Smart recommendations
    const matchesSuggested = [];
    rs.forEach((r) => {
      fs.forEach((f) => {
        let score = 0;
        if (r.cat === f.cat) score += 2;
        if (
          r.color &&
          f.color &&
          r.color.toLowerCase() === f.color.toLowerCase()
        )
          score += 2;
        if (
          r.brand &&
          f.brand &&
          r.brand.toLowerCase() === f.brand.toLowerCase()
        )
          score += 2;
        if (r.loc && f.loc && r.loc.split(" - ")[0] === f.loc.split(" - ")[0])
          score += 1;
        if (score >= 2) {
          matchesSuggested.push({ r, f, score });
        }
      });
    });

    $("#main").innerHTML =
      head(
        "Pencocokan Barang",
        "Hubungkan barang temuan dengan laporan kehilangan yang sesuai.",
      ) +
      `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px">
        <div class="card pad">
          <h3 class="t">Form Hubungkan Manual</h3>
          <form onsubmit="event.preventDefault();doMatch(this)">
            <div class="f">
              <label>Pilih Barang Temuan (Tersimpan / Approved):</label>
              <select name="f" required>
                ${fs.map((f) => `<option value="${f.id}">${esc(f.name)} (${esc(f.loc)})</option>`).join("")}
              </select>
            </div>
            <div class="f">
              <label>Pilih Laporan Kehilangan (Aktif):</label>
              <select name="r" required>
                ${rs.map((r) => `<option value="${r.id}">${esc(r.name)} - ${esc(uname(r.uid))}</option>`).join("")}
              </select>
            </div>
            <button class="btn" ${ok ? "" : "disabled"}>Hubungkan dan Tandai Ditemukan (FOUND)</button>
            ${ok ? "" : `<p class="hint" style="text-align:left">Butuh minimal satu barang temuan tersimpan dan satu laporan aktif.</p>`}
          </form>
        </div>

        <div class="card pad">
          <h3 class="t">Saran Pencocokan Otomatis (${matchesSuggested.length})</h3>
          <p style="font-size:12.5px;color:var(--mute);margin:-4px 0 12px">Berdasarkan kesamaan kategori, merk, warna, dan lokasi.</p>
          ${
            matchesSuggested.length
              ? matchesSuggested
                  .map(
                    (m) => `
                <div class="match-item">
                  <div>
                    <b>${esc(m.r.name)} &harr; ${esc(m.f.name)}</b>
                    <div class="meta">${esc(m.r.cat)} &bull; ${esc(uname(m.r.uid))}</div>
                  </div>
                  <button class="btn sm" onclick="directMatch(${m.r.id}, ${m.f.id})">Cocokkan</button>
                </div>
              `,
                  )
                  .join("")
              : `<div class="empty" style="padding:20px">Belum ada saran pencocokan otomatis.</div>`
          }
        </div>
      </div>
    `;
  };

V.kembali = function () {
    const list = DB.reports.filter((r) => r.status === "FOUND");
    $("#main").innerHTML =
      head(
        "Pengembalian Barang",
        "Lakukan verifikasi kepemilikan sebelum barang diserahkan resmi kepada pemiliknya.",
      ) +
      tbl(
        ["Pelapor", "Barang Hilang", "Kontak / Chat", "Tindakan Verifikasi"],
        list.map((r) => {
          const u = uobj(r.uid);
          return `
          <tr>
            <td>
              <b>${esc(u.name)}</b>
              <div class="meta">NIM ${esc(u.nim)} &bull; ${esc(u.prodi)}</div>
            </td>
            <td>
              <b>${esc(r.name)}</b>
              <div class="meta">${esc(r.cat)} &bull; ${esc(r.loc)}</div>
            </td>
            <td>
              <button class="btn ghost sm" onclick="chatAbout(${r.id})">Hubungi Pelapor</button>
            </td>
            <td>
              <button class="btn sm" onclick="verif(${r.id})">Verifikasi & Serahkan</button>
            </td>
          </tr>
        `;
        }),
      );
  };

async function submitFoundPetugas(f) {
  const btn = f.querySelector("button.btn");
  if (btn) btn.disabled = true;
  try {
    const photoEl = f.foto && f.foto.files[0];
    const photoData = photoEl
      ? await readImageSmall(photoEl, 800, "Foto temuan").catch((e) => {
          toast(e.message);
          return null;
        })
      : "";
    if (photoEl && !photoData) return;
    const catIdx = CATS.indexOf(f.c.value);
    if (catIdx < 0) return toast("Kategori tidak dikenal.");
    const fullLoc = locOf(f);
    await API.req("/api/found", {
      method: "POST",
      body: {
        category_id: catIdx + 1,
        item_name: f.n.value.trim(),
        color: f.w ? f.w.value.trim() : "",
        brand: f.b ? f.b.value.trim() : "",
        building: fullLoc.startsWith("Gedung B") ? "Gedung B" : "Gedung A",
        found_location: fullLoc,
        classroom_number: (f.kn && f.kn.value.trim()) || null,
        found_date: new Date().toISOString().slice(0, 10),
        description: f.ds ? f.ds.value.trim() : "",
        photo: photoData,
      },
    });
    toast("Barang temuan dicatat! Menunggu verifikasi ACC Admin.");
    nav("riwayat_petugas");
  } catch (e) {
    toast(e.message);
  } finally {
    if (btn) btn.disabled = false;
  }
}

// Catat temuan langsung admin via API (langsung APPROVED). Tanpa localStorage.

async function submitFoundDirect(f) {
  const btn = f.querySelector("button.btn");
  if (btn) btn.disabled = true;
  try {
    const photoEl = f.foto && f.foto.files[0];
    const photoData = photoEl
      ? await readImageSmall(photoEl, 800, "Foto temuan").catch((e) => {
          toast(e.message);
          return null;
        })
      : "";
    if (photoEl && !photoData) return;
    const catIdx = CATS.indexOf(f.c.value);
    if (catIdx < 0) return toast("Kategori tidak dikenal.");
    const fullLoc = locOf(f);
    await API.req("/api/found", {
      method: "POST",
      body: {
        category_id: catIdx + 1,
        item_name: f.n.value.trim(),
        color: f.w ? f.w.value.trim() : "",
        brand: f.b ? f.b.value.trim() : "",
        building: fullLoc.startsWith("Gedung B") ? "Gedung B" : "Gedung A",
        found_location: fullLoc,
        classroom_number: (f.kn && f.kn.value.trim()) || null,
        found_date: new Date().toISOString().slice(0, 10),
        description: f.ds ? f.ds.value.trim() : "",
        photo: photoData,
      },
    });
    toast("Barang temuan berhasil dicatat dan langsung APPROVED.");
    nav("cocok");
  } catch (e) {
    toast(e.message);
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function accFoundItem(id) {
  try {
    const r = await API.req(`/api/found/${id}/approve`, {
      method: "PATCH",
      body: { approve: true },
    });
    toast(r.message || "Barang temuan disetujui (ACC) dan siap dicocokkan.");
    await refreshStore();
  } catch (e) {
    toast(e.message);
  }
  app();
}

async function rejectFoundItem(id) {
  try {
    const r = await API.req(`/api/found/${id}/approve`, {
      method: "PATCH",
      body: { approve: false },
    });
    toast(r.message || "Barang temuan ditolak.");
    await refreshStore();
  } catch (e) {
    toast(e.message);
  }
  app();
}

// Verifikasi regist mahasiswa Cara B (upload KTM + ACC manual admin) via API.

async function deleteFound(id) {
  const f = DB.found.find((x) => x.id === id);
  if (!f) return;
  if (!canDeleteFound(f))
    return toast("Anda tidak memiliki izin untuk menghapus barang temuan ini.");
  if (
    !confirm(
      `Hapus barang temuan "${f.name}" secara permanen?\nTindakan ini dicatat di audit log.`,
    )
  )
    return;
  try {
    const res = await API.req(`/api/found/${id}`, { method: "DELETE" });
    toast(res.message || "Barang temuan berhasil dihapus");
    await refreshStore();
  } catch (e) {
    return toast(e.message);
  }
  closeDlg();
  render();
}

function doMatch(f) {
  const r = +f.r.value;
  const i = +f.f.value;
  directMatch(r, i);
}

async function directMatch(rid, fid) {
  try {
    const res = await API.req("/api/matches", {
      method: "POST",
      body: { lost_report_id: rid, found_item_id: fid },
    });
    toast(
      res.message ||
        "Laporan dan temuan berhasil dihubungkan! Silakan hubungi pelapor.",
    );
    await refreshStore();
  } catch (e) {
    return toast(e.message);
  }
  app();
}

function detailFound(id) {
  const f = DB.found.find((x) => x.id === id);
  if (!f) return;
  dlg(`
    <div class="ph modal-photo">
      ${f.photo ? `<img src="${f.photo}" alt="${esc(f.name)}">` : ic(IC.shield)}
    </div>
    <div class="modal-head">
      ${badge(f.status)}
      <h2>${esc(f.name)}</h2>
      <p class="meta">${esc(f.cat)} &bull; Ditemukan di ${esc(f.loc)}</p>
    </div>
    <dl class="dl">
      <dt>Warna</dt><dd>${esc(f.color || "-")}</dd>
      <dt>Merk</dt><dd>${esc(f.brand || "-")}</dd>
      <dt>Lokasi temuan</dt><dd>${esc(f.loc)}</dd>
      <dt>Tanggal temuan</dt><dd>${fmt(f.date)}</dd>
      <dt>Penerima</dt><dd>${esc(f.received_by)}</dd>
      <dt>Kondisi</dt><dd>${esc(f.desc || "Disimpan di kantor kemahasiswaan")}</dd>
    </dl>
    <div class="foot">
      ${!ST.user || ST.user.role === "user" ? `<button type="button" class="btn chat-about" onclick="chatAboutFound(${f.id})">Chat Admin Tanya Barang Ini</button>` : ""}
      <button type="button" class="btn ghost" onclick="$('dialog').close()">Tutup</button>
      ${canDeleteFound(f) ? `<button class="btn bad" onclick="deleteFound(${f.id})">Hapus Temuan</button>` : ""}
      ${ST.user && ST.user.role === "admin" && f.status === "PENDING_APPROVAL" ? `<button class="btn sm" onclick="accFoundItem(${f.id});$('dialog').close()">Setujui (ACC)</button>` : ""}
    </div>
  `);
}

// Modal Verifikasi Kepemilikan (Checklist Sesuai README Section 8.7)

