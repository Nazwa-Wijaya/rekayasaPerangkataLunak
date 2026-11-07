// js/08-reports.js — Laporan hilang: V.lapor/saya + kirim, detail, ACC, verifikasi & serah terima.
// Opsi A: script klasik berurutan. Urutan load di frontend/index.html. Jangan load satuan.
V.lapor = function () {
    $("#main").innerHTML =
      head(
        "Laporkan Barang Hilang",
        "Laporan akan diperiksa Admin terlebih dahulu sebelum dipublikasikan ke forum (Maksimal aktif 3 hari).",
      ) +
      `
      <div class="info-banner">
        <b>Catatan Penting:</b> Mahasiswa hanya dapat mengunggah <b>Laporan Barang Hilang</b>. Apabila Anda menemukan barang milik orang lain, harap serahkan langsung kepada <b>Petugas Satpam / Admin Kemahasiswaan</b> di kampus.
      </div>
      <form class="card pad form" onsubmit="event.preventDefault();sendR(this)">
        <div class="f">
          <label>Nama barang <span style="color:var(--err)">*</span></label>
          <input name="n" required placeholder="Contoh: Dompet kulit hitam">
        </div>
        <div class="f">
          <label>Kategori <span style="color:var(--err)">*</span></label>
          <select name="c">${opts(CATS)}</select>
        </div>
        <div class="f">
          <label>Warna <span style="color:var(--err)">*</span></label>
          <input name="w" required placeholder="Contoh: Hitam pekat">
        </div>
        <div class="f">
          <label>Merk / Brand (jika ada)</label>
          <input name="b" placeholder="Contoh: Eiger, Casio, Xiaomi">
        </div>
        <div class="f">
          <label>Tanggal perkiraan hilang <span style="color:var(--err)">*</span></label>
          <input type="date" name="d" required value="2026-09-30">
        </div>
        <div class="f">
          <label>Gedung <span style="color:var(--err)">*</span></label>
          <select name="g" onchange="gdg(this)">
            <option>Gedung A</option>
            <option>Gedung B</option>
          </select>
        </div>
        <div class="f">
          <label>Lokasi terakhir terlihat <span style="color:var(--err)">*</span></label>
          <select name="l" onchange="kls(this)">${locOpts("Gedung A")}</select>
        </div>
        <div class="f kn">
          <label>Nomor ruang kelas (4 digit)</label>
          <input name="kn" inputmode="numeric" autocomplete="off" required maxlength="4" minlength="4" pattern="[0-9]{4}" title="Isi 4 digit angka" placeholder="Contoh: 1305" oninput="this.value=this.value.replace(/[^0-9]/g,'')">
        </div>
        <div class="f w">
          <label>Foto barang (opsional)</label>
          <input type="file" name="foto" accept="image/*" onchange="previewImg(this, '#preview-lapor')">
          <img id="preview-lapor" class="img-preview" style="display:none">
        </div>
        <div class="f w">
          <label>Deskripsi & ciri khusus yang hanya diketahui pemilik <span style="color:var(--err)">*</span></label>
          <textarea name="ds" required placeholder="Contoh: Di dalam dompet ada KTM atas nama Rina Marlina, stiker kecil bintang perak di pojok resleting."></textarea>
        </div>
        <div class="w" style="display:flex;gap:12px;align-items:center;margin-top:12px">
          <button class="btn">Kirim Laporan Kehilangan</button>
          <span style="font-size:12.5px;color:var(--mute)">Status laporan akan langsung diset menjadi <b>PENDING</b>.</span>
        </div>
      </form>
    `;
  };

V.saya = function () {
    const l = DB.reports.filter((r) => r.uid === ST.user.id);
    $("#main").innerHTML =
      head(
        "Laporan Saya",
        "Pantau status verifikasi, kecocokan temuan, dan konsultasikan via chat ke Admin.",
        `<button class='btn' onclick="nav('lapor')">Buat Laporan Baru</button>`,
      ) +
      tbl(
        ["Barang", "Lokasi", "Tanggal Lapor", "Status", "Aksi"],
        l.map(
          (r) =>
            `<tr>
              <td>
                <b>${esc(r.name)}</b>
                <div class="meta">${esc(r.cat)} &bull; ${esc(r.color)}</div>
              </td>
              <td>${esc(r.loc)}</td>
              <td>${fmt(r.date)}</td>
              <td>${badge(r.status)}</td>
              <td>
                <div class="act">
                  <button class="btn ghost sm detail-action" onclick="detail(${r.id})">Detail</button>
                  <button class="btn sm" onclick="chatAbout(${r.id})" title="Chat dengan admin mengenai laporan ini">Chat Admin</button>
                </div>
              </td>
            </tr>`,
        ),
      );
  };

async function sendR(f) {
  const btn = f.querySelector("button.btn");
  if (btn) btn.disabled = true;
  try {
    const photoEl = f.foto && f.foto.files[0];
    const photoData = photoEl
      ? await readImageSmall(photoEl, 800, "Foto barang").catch((e) => {
          toast(e.message);
          return null;
        })
      : "";
    if (photoEl && !photoData) return;
    const catName = f.c.value;
    const catIdx = CATS.indexOf(catName);
    if (catIdx < 0) return toast("Kategori tidak dikenal.");
    const fullLoc = locOf(f);
    const building = fullLoc.startsWith("Gedung B") ? "Gedung B" : "Gedung A";
    await API.req("/api/reports", {
      method: "POST",
      body: {
        category_id: catIdx + 1,
        item_name: f.n.value.trim(),
        color: f.w.value.trim(),
        brand: f.b ? f.b.value.trim() : "",
        building,
        lost_location: fullLoc,
        classroom_number: (f.kn && f.kn.value.trim()) || null,
        lost_date: f.d.value,
        description: f.ds.value.trim(),
        photo: photoData,
      },
    });
    toast("Laporan terkirim! Menunggu verifikasi Admin.");
    nav("saya");
  } catch (e) {
    toast(e.message);
  } finally {
    if (btn) btn.disabled = false;
  }
}

// Catat temuan petugas via API (PENDING_APPROVAL). Tanpa localStorage.

async function deleteReport(id) {
  if (!canDelete())
    return toast("Anda tidak memiliki izin untuk menghapus Laporan.");
  const r = DB.reports.find((x) => x.id === id);
  if (
    !confirm(
      `Hapus Laporan "${r ? r.name : id}" secara permanen?\nTindakan ini dicatat di audit log.`,
    )
  )
    return;
  try {
    const res = await API.req(`/api/reports/${id}`, { method: "DELETE" });
    toast(res.message || "Laporan Kehilangan berhasil dihapus");
    if (ST.chatReportId === id) ST.chatReportId = null;
    await refreshStore();
  } catch (e) {
    return toast(e.message);
  }
  closeDlg();
  render();
}

async function takerInfoHtml(reportId) {
  try {
    const r = await API.req(`/api/returns?lost_report_id=${reportId}`);
    const t = (r.data || [])[0];
    if (!t) return "";
    return `
    <h3 class="t" style="margin:16px 0 8px">Data Pengambil Barang</h3>
    <dl class="dl">
      <dt>Nama</dt><dd>${esc(t.taker_name)}</dd>
      <dt>NIM</dt><dd>${esc(t.taker_nim)}</dd>
      <dt>Program studi</dt><dd>${esc(t.taker_prodi)}</dd>
      <dt>No. HP</dt><dd>${esc(t.taker_phone)}</dd>
    </dl>
    ${[
      [t.taker_photo, "Foto KTM"],
      [t.taker_receipt, "Struk pembelian"],
      [t.taker_selfie, "Foto diri pengambil"],
    ]
      .filter((x) => x[0])
      .map(
        ([src, cap]) => `
      <figure style="margin:12px 0 0">
        <a href="${src}" target="_blank" rel="noopener"><img src="${src}" style="display:block;width:100%;max-height:320px;object-fit:contain;background:var(--soft);border-radius:8px;border:1px solid var(--line)"></a>
        <figcaption class="meta" style="margin-top:4px">${cap}</figcaption>
      </figure>`,
      )
      .join("")}`;
  } catch (_) {
    return "";
  }
}

// Galeri laporan: kompatibel dengan photo tunggal dan format photos lama/baru.
function reportImages(r) {
  const raw = Array.isArray(r.photos) && r.photos.length ? r.photos : [r.photo];
  return raw
    .map((item) => {
      const image = typeof item === "string" ? { src: item } : (item || {});
      return image.src
        ? { src: image.src, alt: image.alt || r.name || "Foto barang", title: image.title || r.name || "Foto barang", caption: image.caption || image.title || r.name || "Foto barang", location: image.location || "" }
        : null;
    })
    .filter(Boolean)
    .filter((image, i, all) => all.findIndex((x) => x.src === image.src) === i);
}

let reportGalleryIndex = 0;
let reportGalleryImages = [];

function reportGalleryHtml(r) {
  reportGalleryImages = reportImages(r);
  reportGalleryIndex = 0;
  const count = reportGalleryImages.length;
  const first = reportGalleryImages[0];
  return `<section class="report-gallery" aria-label="Galeri foto ${esc(r.name)}">
    <div class="report-gallery-main">
      ${first ? `<img id="report-gallery-image" src="${esc(first.src)}" alt="${esc(first.alt)}" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><div class="report-gallery-empty" hidden>${ic(IC.photo)}<span>Foto tidak tersedia</span></div>` : `<div class="report-gallery-empty">${ic(IC.photo)}<span>Belum ada foto</span></div>`}
      ${count > 1 ? `<button type="button" class="report-gallery-nav prev" aria-label="Foto sebelumnya" onclick="reportGalleryMove(-1)">‹</button><button type="button" class="report-gallery-nav next" aria-label="Foto berikutnya" onclick="reportGalleryMove(1)">›</button>` : ""}
      <span class="report-gallery-count" aria-live="polite">${count ? `01 / ${String(count).padStart(2, "0")}` : "0 foto"}</span>
    </div>
    ${count > 1 ? `<div class="report-gallery-thumbs" role="list" aria-label="Pilih foto">${reportGalleryImages.map((image, i) => `<button type="button" class="report-gallery-thumb${i === 0 ? " is-active" : ""}" role="listitem" aria-label="Pilih foto ${i + 1}: ${esc(image.title)}" aria-pressed="${i === 0}" onclick="reportGallerySet(${i})"><img src="${esc(image.src)}" alt="${esc(image.alt)}"></button>`).join("")}</div>` : ""}
    <p class="report-gallery-caption" id="report-gallery-caption">${first ? esc(first.caption) : "Foto barang tidak tersedia"}${first?.location ? ` · ${esc(first.location)}` : ""}</p>
  </section>`;
}

function reportGallerySet(index) {
  if (!reportGalleryImages.length) return;
  reportGalleryIndex = (index + reportGalleryImages.length) % reportGalleryImages.length;
  const image = reportGalleryImages[reportGalleryIndex];
  const main = $("#report-gallery-image");
  if (main) { main.src = image.src; main.alt = image.alt; main.hidden = false; }
  document.querySelector(".report-gallery-empty[hidden]")?.setAttribute("hidden", "");
  const count = document.querySelector(".report-gallery-count");
  if (count) count.textContent = `${String(reportGalleryIndex + 1).padStart(2, "0")} / ${String(reportGalleryImages.length).padStart(2, "0")}`;
  const caption = $("#report-gallery-caption");
  if (caption) caption.textContent = `${image.caption}${image.location ? ` · ${image.location}` : ""}`;
  document.querySelectorAll(".report-gallery-thumb").forEach((thumb, i) => { thumb.classList.toggle("is-active", i === reportGalleryIndex); thumb.setAttribute("aria-pressed", String(i === reportGalleryIndex)); });
}
function reportGalleryMove(step) { reportGallerySet(reportGalleryIndex + step); }
document.addEventListener("keydown", (event) => {
  if (!$("dialog")?.open || !reportGalleryImages.length) return;
  if (event.key === "ArrowLeft") { event.preventDefault(); reportGalleryMove(-1); }
  if (event.key === "ArrowRight") { event.preventDefault(); reportGalleryMove(1); }
});

// Modal Detail Laporan Kehilangan

async function detail(id) {
  const r = DB.reports.find((x) => x.id === id);
  if (!r) return;
  const isAdm = ST.user && ST.user.role === "admin";
  const expireDate = exp(r);
  const takerHtml = isAdm ? await takerInfoHtml(r.id) : "";

  dlg(`
    ${reportGalleryHtml(r)}
    <div class="modal-head">
      ${badge(r.status)}
      <h2>${esc(r.name)}</h2>
      <p class="meta">${esc(r.cat)}</p>
    </div>
    <dl class="dl">
      <dt>Warna</dt><dd>${esc(r.color || "-")}</dd>
      <dt>Merk</dt><dd>${esc(r.brand || "-")}</dd>
      <dt>Lokasi hilang</dt><dd>${esc(r.loc)}</dd>
      <dt>Tanggal lapor</dt><dd>${fmt(r.date)}</dd>
      <dt>Ciri & Deskripsi</dt><dd>${esc(r.desc)}</dd>
      ${isAdm ? `<dt>Pelapor</dt><dd>${esc(uname(r.uid))}</dd>` : ""}
      ${expireDate ? `<dt>Masa aktif s/d</dt><dd>${fmt(expireDate)} (Maks. 3 hari)</dd>` : ""}
    </dl>
    ${takerHtml}
    <div class="foot">
      <button type="button" class="btn chat-about" onclick="chatAbout(${r.id})">
        ${isAdm ? `Chat ${esc(uname(r.uid) || "Pelapor")} tentang Barang Ini` : `Chat Admin tentang Barang Ini`}
      </button>
      <button type="button" class="btn ghost" onclick="$('dialog').close()">Tutup</button>
      ${canDelete() ? `<button class="btn bad" onclick="deleteReport(${r.id})">Hapus Laporan</button>` : ""}
      ${isAdm && r.status === "PENDING" ? `<button class="btn sm" onclick="setR(${r.id},'ACTIVE');$('dialog').close();toast('Laporan disetujui');app()">Setujui</button>` : ""}
      ${isAdm && r.status === "FOUND" ? `<button class="btn sm" onclick="$('dialog').close();verif(${r.id})">Verifikasi Kepemilikan</button>` : ""}
    </div>
  `);
}

// Modal Detail Barang Temuan

function verif(id) {
  const r = DB.reports.find((x) => x.id === id);
  if (!r) return;
  const u = uobj(r.uid);

  dlg(`
    <h2>Verifikasi Kepemilikan Barang</h2>
    <p class="meta">${esc(r.name)} &bull; Pemilik: ${esc(u.name)} (NIM: ${esc(u.nim)})</p>
    <div class="info-banner" style="margin:12px 0">
      Admin wajib memeriksa kecocokan fisik barang dan identitas sebelum barang diserahkan.
    </div>
    <div class="f"><label>Nama pengambil <span style="color:var(--err)">*</span></label>
      <input id="vnama" required maxlength="100" value="${esc(u.name)}"></div>
    <div class="f"><label>NIM pengambil <span style="color:var(--err)">*</span></label>
      <input id="vnim" required maxlength="30" value="${esc(u.nim)}"></div>
    <div class="f"><label>Program studi <span style="color:var(--err)">*</span></label>
      <input id="vprodi" required maxlength="80" value="${esc(u.prodi)}"></div>
    <div class="f"><label>Nomor HP / WhatsApp pengambil <span style="color:var(--err)">*</span></label>
      <input id="vhp" required inputmode="tel" maxlength="16" placeholder="Contoh: 081234567890"></div>
    <div class="f"><label>Foto KTM <span style="color:var(--err)">*</span></label>
      <input id="vfoto" type="file" accept="image/jpeg,image/png,image/webp" onchange="previewImg(this,'#pv-verif')">
      <img id="pv-verif" class="img-preview" style="display:none;max-width:100%;max-height:200px;object-fit:contain;margin-top:8px;border-radius:8px"></div>
    <div class="f"><label>Foto struk pembelian <span style="color:var(--mute);font-weight:400">(opsional)</span></label>
      <input id="vstruk" type="file" accept="image/jpeg,image/png,image/webp" onchange="previewImg(this,'#pv-struk')">
      <img id="pv-struk" class="img-preview" style="display:none;max-width:100%;max-height:200px;object-fit:contain;margin-top:8px;border-radius:8px"></div>
    <div class="f"><label>Foto diri pengambil <span style="color:var(--err)">*</span></label>
      <input id="vselfie" type="file" accept="image/jpeg,image/png,image/webp" onchange="previewImg(this,'#pv-selfie')">
      <img id="pv-selfie" class="img-preview" style="display:none;max-width:100%;max-height:200px;object-fit:contain;margin-top:8px;border-radius:8px"></div>
    <div class="chk">
      <label><input type="checkbox"> 1. Detail ciri khusus barang sesuai dengan keterangan pelapor</label>
      <label><input type="checkbox"> 2. Isi dalam barang (jika ada) sesuai dengan keterangan pemilik</label>
      <label><input type="checkbox"> 3. Bukti kepemilikan diperlihatkan (KTM, foto lama, struk, atau pola kunci)</label>
      <label><input type="checkbox"> 4. Identitas mahasiswa sesuai dengan akun pelapor</label>
      <label><input type="checkbox"> 5. Pemilik menandatangani bukti penyerahan barang</label>
    </div>
    <div class="f">
      <label>Catatan penyerahan / nomor bukti</label>
      <textarea id="vnotes" placeholder="Tuliskan catatan verifikasi barang dan tanggal serah terima..."></textarea>
    </div>
    <div class="foot">
      <button class="btn ghost" onclick="$('dialog').close()">Batal</button>
      <button class="btn" onclick="submitVerifReturn(${id})">Serahkan Barang (RETURNED)</button>
    </div>
  `);
}

async function submitVerifReturn(id) {
  const takerName = $("#vnama").value.trim();
  const takerNim = $("#vnim").value.trim();
  const takerProdi = $("#vprodi").value.trim();
  const takerHp = $("#vhp").value.trim().replace(/[\s-]/g, "");
  if (!takerName || !takerNim || !takerProdi)
    return toast("Lengkapi data diri pengambil (nama, NIM, program studi).");
  if (!/^(\+62|62|0)8[0-9]{8,12}$/.test(takerHp))
    return toast("Nomor HP pengambil tidak valid.");
  let takerPhoto,
    takerReceipt = "",
    takerSelfie;
  try {
    takerPhoto = await readImageSmall($("#vfoto").files[0], 800, "Foto KTM");
    const struk = $("#vstruk").files[0];
    if (struk) takerReceipt = await readImageSmall(struk, 800, "Foto struk");
    takerSelfie = await readImageSmall(
      $("#vselfie").files[0],
      800,
      "Foto diri",
    );
  } catch (err) {
    return toast(err.message);
  }
  const chks = [...document.querySelectorAll("dialog input[type=checkbox]")];
  if (!chks.every((c) => c.checked)) {
    return toast(
      "Harap centang semua 5 poin verifikasi kepemilikan terlebih dahulu.",
    );
  }
  const notes = $("#vnotes") ? $("#vnotes").value.trim() : "";
  const r = DB.reports.find((x) => x.id === id);
  if (!r) return toast("Laporan tidak ditemukan.");
  const match = DB.matches
    ? DB.matches.find((m) => m.lost_report_id === id)
    : null;
  const foundId = match ? match.found_item_id : null;
  try {
    const res = await API.req("/api/returns", {
      method: "POST",
      body: {
        lost_report_id: id,
        found_item_id: foundId,
        user_id: r.uid,
        notes: notes || "Barang diserahkan setelah verifikasi 5 poin lengkap.",
        taker_name: takerName,
        taker_nim: takerNim,
        taker_prodi: takerProdi,
        taker_phone: takerHp,
        taker_photo: takerPhoto,
        taker_receipt: takerReceipt,
        taker_selfie: takerSelfie,
        check_1_details: true,
        check_2_contents: true,
        check_3_proof: true,
        check_4_identity: true,
        check_5_signed: true,
      },
    });
    toast(res.message || "Barang telah berhasil diverifikasi dan diserahkan!");
    await refreshStore();
  } catch (e) {
    return toast(e.message);
  }
  $("dialog").close();
  app();
}
