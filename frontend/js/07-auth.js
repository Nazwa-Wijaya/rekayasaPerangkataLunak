// js/07-auth.js — Auth satu pintu + registrasi KTM + verifikasi regist + util foto.
// Opsi A: script klasik berurutan. Urutan load di frontend/index.html. Jangan load satuan.
function pw(id) {
  return `<div class="pw"><input id="${id}" type="password" placeholder="Masukkan kata sandi" autocomplete="off"><button type="button" aria-label="Tampilkan kata sandi" onclick="tpw('${id}',this)">${ic(IC.eye)}</button></div>`;
}

function tpw(id, b) {
  const i = $("#" + id);
  if (!i) return;
  const s = i.type === "password";
  i.type = s ? "text" : "password";
  // Ganti ikon tanpa menggeser posisi tombol (ikon selalu 18px, rata tengah).
  b.innerHTML = ic(s ? IC.off : IC.eye);
  b.setAttribute(
    "aria-label",
    s ? "Sembunyikan kata sandi" : "Tampilkan kata sandi",
  );
  // Jaga fokus tetap di input agar tidak ada lompatan layout.
  try {
    i.focus({ preventScroll: true });
  } catch (_) {
    i.focus();
  }
  try {
    const v = i.value;
    i.setSelectionRange(v.length, v.length);
  } catch (_) {}
}

// Satu pintu masuk untuk semua peran (mahasiswa / petugas / admin).
// Peran dibaca dari data akun saat login, lalu otomatis diarahkan ke tampilannya.
// Regist mahasiswa: Cara B (upload KTM + ACC manual admin), tanpa OTP.
function auth() {
  const mode =
    ST.auth === "reg"
      ? "reg"
      : ST.auth === "reg-success"
        ? "reg-success"
        : "login";
  if (mode === "reg-success") return authRegSuccess();
  const reg = mode === "reg";
  $("#root").innerHTML = `
    <div class="auth">
      <div class="hero">
        <div>
          ${logo.replace("<div", "<div style='margin-bottom:48px'")}
          <h1>Barang hilang kembali ke pemilik lewat satu pintu resmi.</h1>
          <p>Satu tombol Masuk untuk semua peran. Mahasiswa, petugas, dan admin masuk dari sini — sistem otomatis mengarahkan sesuai jenis akun.</p>
        </div>
        <ol class="steps">
          <li><em>1</em><span><b>Masuk sesuai akun Anda</b>Mahasiswa memakai NIM, petugas & admin memakai username.</span></li>
          <li><em>2</em><span><b>Diarahkan otomatis</b>Akun admin ke Dashboard Admin, petugas ke Dashboard Petugas, mahasiswa ke Forum.</span></li>
          <li><em>3</em><span><b>Belum punya akun?</b>Daftar sebagai mahasiswa dengan NIM resmi + foto KTM, lalu diverifikasi Admin.</span></li>
        </ol>
      </div>
      <div class="pane">
        <div class="box">
          <button type="button" class="btn ghost sm" style="margin-bottom:16px" onclick="location.hash='#/'">&larr; Kembali ke Beranda</button>
          <div class="tabs">
            <button class="${reg ? "" : "on"}" onclick="ST.auth='login';render()">Masuk</button>
            <button class="${reg ? "on" : ""}" onclick="ST.auth='reg';render()">Daftar Akun</button>
          </div>
          <h2>${reg ? "Pendaftaran Mahasiswa" : "Masuk"}</h2>
          <p class="sub">${reg ? "Gunakan data identitas dan NIM resmi Anda. Wajib upload foto KTM — akun aktif setelah diverifikasi Admin." : "Mahasiswa masuk dengan NIM, petugas & admin masuk dengan username. Kata sandi wajib diisi."}</p>
          <form onsubmit="event.preventDefault();doAuth(this)">
            ${reg ? `<div class="f"><label>Nama lengkap</label><input id="rn" placeholder="Contoh: Rina Marlina" required autocomplete="off"></div>` : ""}
            <div class="f"><label>${reg ? "NIM" : "NIM / Username"}</label><input id="login_id" inputmode="text" placeholder="${reg ? "Contoh: 2211001" : "Contoh: 2211001 / admin / petugas"}" required autocomplete="off"></div>
            ${reg ? `<div class="f"><label>Program studi</label><select id="rp" required><option value="">— Pilih program studi —</option>${prodiOpts()}</select></div>` : ""}
            <div class="f"><label>Kata sandi${reg ? " (min. 6 karakter)" : ""}</label>${pw("pw")}</div>
            ${
              reg
                ? `<div class="f"><label>Konfirmasi kata sandi</label>${pw("pw2")}</div>
            <div class="f"><label>Foto KTM <span style="color:var(--err)">*</span></label><input id="ktm" type="file" accept="image/jpeg,image/png,image/webp" required onchange="previewImg(this,'#preview-ktm')"><img id="preview-ktm" class="img-preview" style="display:none;max-width:100%;max-height:200px;object-fit:contain;margin-top:8px;border-radius:8px"><small class="meta">JPG/PNG/WEBP, maks 15 MB (otomatis dikecilkan). Dipakai Admin untuk verifikasi identitas.</small></div>`
                : ""
            }
            <button class="btn block">${reg ? "Kirim Pendaftaran" : "Masuk"}</button>
          </form>
          <p class="hint">Pendaftaran hanya untuk mahasiswa. Petugas & admin dibuat oleh pengelola sistem. Hubungi Admin Kemahasiswaan jika lupa kata sandi.</p>
        </div>
      </div>
    </div>
  `;
}

// Layar sukses setelah daftar Cara B: akun PENDING, tanpa auto-login.
function authRegSuccess() {
  $("#root").innerHTML = `
    <div class="auth">
      <div class="hero">
        <div>
          ${logo.replace("<div", "<div style='margin-bottom:48px'")}
          <h1>Pendaftaran diterima.</h1>
          <p>Akun Anda menunggu verifikasi Admin. Anda akan bisa masuk setelah Admin menyetujui foto KTM dan data NIM Anda.</p>
        </div>
        <ol class="steps">
          <li><em>1</em><span><b>Admin memeriksa KTM</b>Pastikan NIM, nama, dan prodi sesuai kartu identitas.</span></li>
          <li><em>2</em><span><b>Jika disetujui</b>Anda bisa masuk dengan NIM + kata sandi.</span></li>
          <li><em>3</em><span><b>Jika ditolak</b>Alasan penolakan tampil saat Anda mencoba masuk.</span></li>
        </ol>
      </div>
      <div class="pane">
        <div class="box">
          <div class="info-banner"><b>Pendaftaran berhasil dikirim.</b><br>Simpan NIM Anda. Coba masuk lagi setelah Admin melakukan verifikasi.</div>
          <button class="btn block" onclick="ST.auth='login';render()">Kembali ke Masuk</button>
          <p class="hint"><a href="#/">Kembali ke Beranda</a></p>
        </div>
      </div>
    </div>
  `;
}

// Kecilkan foto KTM di browser: sisi terpanjang <= 1280px, JPEG, ukuran <= ~450 KB.
// Teks pada KTM tetap terbaca, tetapi aman untuk MySQL (max_allowed_packet).
function shrinkKtm(file, maxSide = 1280, maxBytes = 450 * 1024) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("File bukan gambar yang valid."));
    };
    img.onload = () => {
      URL.revokeObjectURL(url);
      const k = Math.min(1, maxSide / Math.max(img.width, img.height));
      const cv = document.createElement("canvas");
      cv.width = Math.max(1, Math.round(img.width * k));
      cv.height = Math.max(1, Math.round(img.height * k));
      const ctx = cv.getContext("2d");
      ctx.fillStyle = "#fff"; // PNG transparan -> latar putih
      ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.drawImage(img, 0, 0, cv.width, cv.height);
      const tryQ = (q) =>
        cv.toBlob(
          (blob) => {
            if (!blob) return reject(new Error("Gagal memproses foto KTM."));
            if (blob.size <= maxBytes || q <= 0.45) return resolve(blob);
            tryQ(q - 0.1);
          },
          "image/jpeg",
          q,
        );
      tryQ(0.85);
    };
    img.src = url;
  });
}

async function doAuth(form) {
  const idEl = $("#login_id");
  const pwEl = $("#pw");
  const id = idEl ? idEl.value.trim() : "";
  const p = pwEl ? pwEl.value : "";
  if (ST.auth === "reg") {
    const n = $("#rn").value.trim();
    const pr = $("#rp").value;
    const p2 = $("#pw2").value;
    const ktm = $("#ktm").files[0];
    if (!n || !id || !pr || !p || !p2)
      return toast("Lengkapi semua data pendaftaran.");
    if (!/^[0-9]{5,15}$/.test(id))
      return toast("NIM harus berupa angka (5-15 digit).");
    if (!PRODI_LIST.includes(pr))
      return toast("Pilih program studi dari daftar resmi.");
    if (p.length < 6) return toast("Kata sandi minimal 6 karakter.");
    if (p !== p2) return toast("Konfirmasi kata sandi tidak sama.");
    if (!ktm) return toast("Foto KTM wajib diunggah.");
    if (!/^image\/(jpeg|png|webp)$/.test(ktm.type))
      return toast("Foto KTM harus JPG, PNG, atau WEBP.");
    if (ktm.size > 15 * 1024 * 1024) return toast("Foto KTM maksimal 15 MB.");
    // Kirim multipart ke backend (bcrypt + status PENDING + audit).
    try {
      const fd = new FormData();
      fd.append("name", n);
      fd.append("nim", id);
      fd.append("prodi", pr);
      fd.append("password", p);
      fd.append("confirm", p2);
      // Foto KTM dikecilkan dulu (maks ~450 KB) agar muat di batas paket MySQL.
      const ktmSmall = await shrinkKtm(ktm);
      fd.append("ktm", ktmSmall, "ktm.jpg");
      await API.req("/api/auth/register", { method: "POST", form: fd });
      ST.auth = "reg-success";
      toast("Pendaftaran diterima. Menunggu verifikasi Admin.");
      return render();
    } catch (e) {
      return toast(e.message);
    }
  }
  if (!id || !p) return toast("Isi NIM/username dan kata sandi.");
  // Login satu pintu via backend (bcrypt + JWT + cek ACTIVE).
  try {
    const r = await API.req("/api/auth/login", {
      method: "POST",
      body: { identifier: id, password: p },
    });
    setSession(r.user, r.token);
    ST.auth = "login";
    return enterAppByRole(r.user);
  } catch (e) {
    return toast(e.message);
  }
}

// Klasifikasi peran dari data akun: admin -> Dashboard Admin,
// petugas -> Dashboard Petugas, mahasiswa -> Forum (atau chat tertunda).
function enterAppByRole(u) {
  if (ST.pendingChat) return afterLoginCheck();
  if (u.role === "admin") {
    ST.view = "dash";
    toast("Masuk sebagai Admin Kemahasiswaan");
    return render();
  }
  if (u.role === "petugas") {
    ST.view = "dash_petugas";
    toast("Masuk sebagai Petugas Kampus");
    return render();
  }
  toast("Selamat datang, " + u.name);
  return afterLoginCheck();
}

function afterLoginCheck() {
  if (ST.pendingChat) {
    const { rid } = ST.pendingChat;
    ST.pendingChat = null;
    chatAbout(rid);
  } else {
    ST.view = "forum";
    render();
  }
}

function logout() {
  ST.user = null;
  ST.token = null;
  sessionStorage.removeItem("LF_TOKEN");
  ST.view = "";
  ST.chat = null;
  ST.chatReportId = null;
  ST.auth = "login";
  location.hash = "#/";
  render();
}

async function verifyReg(id, approve) {
  const u = DB.users.find((x) => x.id === id && x.role === "user");
  if (!u && approve !== false) {
    // Tetap lanjut via API walau cache kosong.
  }
  if (!approve) {
    const label = u ? `${u.name} (${u.nim})` : `ID ${id}`;
    const reason = prompt(
      `Tolak pendaftaran ${label}?\nTulis alasan penolakan:`,
    );
    if (reason === null) return;
    if (!reason.trim()) return toast("Alasan penolakan wajib diisi.");
    try {
      const r = await API.req("/api/auth/verify-registration", {
        method: "POST",
        body: { user_id: id, approve: false, reason: reason.trim() },
      });
      toast(r.message || "Pendaftaran ditolak dengan alasan.");
      await refreshStore();
    } catch (e) {
      return toast(e.message);
    }
    return app();
  }
  const label = u ? `${u.name} (${u.nim}, ${u.prodi})` : `ID ${id}`;
  if (!confirm(`Setujui pendaftaran ${label}?`)) return;
  try {
    const r = await API.req("/api/auth/verify-registration", {
      method: "POST",
      body: { user_id: id, approve: true },
    });
    toast(r.message || "Pendaftaran disetujui. Mahasiswa bisa masuk.");
    await refreshStore();
  } catch (e) {
    return toast(e.message);
  }
  app();
}

function detailKtm(id) {
  const u = DB.users.find((x) => x.id === id && x.role === "user");
  if (!u) return;
  // KTM: base64 dari DB, atau path lama -> endpoint ber-token
  const src = u.ktm_photo
    ? /^data:image\//.test(u.ktm_photo)
      ? u.ktm_photo
      : /^(blob:|https?:)/.test(u.ktm_photo)
        ? u.ktm_photo
        : `/uploads/ktm/${encodeURIComponent(String(u.ktm_photo).split("/").pop())}?token=${encodeURIComponent(ST.token || "")}`
    : "";
  dlg(`
    <div class="modal-head">
      <h2>Verifikasi KTM</h2>
      <p class="meta">${esc(u.name)} &bull; NIM ${esc(u.nim)} &bull; ${esc(u.prodi)}</p>
    </div>
    ${src ? `<a href="${src}" target="_blank" rel="noopener"><img src="${src}" alt="KTM ${esc(u.name)}" style="display:block;width:100%;max-height:380px;object-fit:contain;background:var(--soft);border-radius:8px;border:1px solid var(--line)"></a>` : `<div class="card empty">Tidak ada foto KTM.</div>`}
    <div class="foot">
      <button class="btn ghost" onclick="$('dialog').close()">Tutup</button>
      ${u.verification_status === "PENDING" ? `<button class="btn bad" onclick="$('dialog').close();verifyReg(${u.id}, false)">Tolak</button><button class="btn" onclick="$('dialog').close();verifyReg(${u.id}, true)">Setujui</button>` : ""}
    </div>
  `);
}

// Baca & kompres foto barang/identitas agar muat di penyimpanan.
function readImageSmall(file, maxSide = 800, label = "Foto KTM") {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error(label + " wajib diunggah."));
    if (!/^image\/(jpeg|png|webp)$/.test(file.type))
      return reject(new Error(label + ": format harus JPG, PNG, atau WEBP."));
    if (file.size > 5 * 1024 * 1024)
      return reject(new Error(label + ": ukuran maksimal 5 MB."));
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Gagal membaca foto."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("File bukan gambar yang valid."));
      img.onload = () => {
        const k = Math.min(1, maxSide / Math.max(img.width, img.height));
        const cv = document.createElement("canvas");
        cv.width = Math.round(img.width * k);
        cv.height = Math.round(img.height * k);
        cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
        resolve(cv.toDataURL("image/jpeg", 0.7));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
