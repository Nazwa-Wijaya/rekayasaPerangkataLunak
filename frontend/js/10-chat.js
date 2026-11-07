// js/10-chat.js — Chat mahasiswa-admin: bubble, kirim, tanda baca, V.pesan.
// Opsi A: script klasik berurutan. Urutan load di frontend/index.html. Jangan load satuan.
function chatBubbles(list, me) {
  let html = "";
  let lastDay = "";
  let prev = null;
  list.forEach((m) => {
    const day = dayKey(m.at);
    if (day !== lastDay) {
      html += `<div class="day-sep"><span>${esc(fmtDay(m.at))}</span></div>`;
      lastDay = day;
      prev = null;
    }
    const mine = m.from === me;
    const grouped = prev && prev.from === m.from;
    const showTag = m.rname && (!grouped || prev.rname !== m.rname);
    const tag = showTag
      ? `<div class="msg-item-tag">Terkait: ${esc(m.rname)}</div>`
      : "";
    html +=
      `<div class="msg${mine ? " out" : ""}${grouped ? " msg-cont" : " msg-first"}">` +
      tag +
      `<span class="msg-text">${esc(m.text)}</span>` +
      `<span class="msg-gap" aria-hidden="true"></span>` +
      `<time datetime="${esc(m.at)}">${fmtClock(m.at)}</time>` +
      `</div>`;
    prev = m;
  });
  return html;
}

// Textarea chat melebar otomatis sesuai jumlah baris (maks. 120px)

function autoGrow(el) {
  el.style.height = "auto";
  el.style.height = Math.min(el.scrollHeight, 120) + "px";
}

function unread() {
  if (!ST.user) return 0;
  const a = ST.user.role === "admin";
  const p = ST.user.role === "petugas";
  if (a) {
    return DB.msgs.filter((m) => !m.read && m.from === "user").length;
  }
  if (p) {
    return 0;
  }
  return DB.msgs.filter(
    (m) => !m.read && m.from === "admin" && m.uid === ST.user.id,
  ).length;
}

function markRead() {
  if (!ST.user) return;
  const a = ST.user.role === "admin";
  const uid = a ? ST.chat : ST.user.id;
  if (!uid) return;
  DB.msgs.forEach((m) => {
    if (m.uid === uid && m.from === (a ? "user" : "admin") && !m.read)
      m.read = true;
  });
  API.req("/api/messages/read", {
    method: "PATCH",
    body: { user_id: uid },
  }).catch(() => {});
}

// Mulai chat terkait item yang diunggah (mahasiswa wajib login dulu).
function chatAbout(rid) {
  closeAllDlg();
  const r = DB.reports.find((x) => x.id === rid);
  if (!r) return;

  if (!ST.user) {
    ST.pendingChat = { rid };
    goLogin(
      `Silakan masuk terlebih dahulu untuk berkonsultasi via chat mengenai "${r.name}".`,
    );
    return;
  }

  if (ST.user.role === "admin") {
    ST.chat = r.uid;
    ST.chatReportId = rid;
    ST.draft = `Mengenai laporan "${r.name}": `;
    nav("pesan");
    return;
  }

  if (ST.user.role === "petugas") {
    toast("Sebagai Petugas, koordinasikan langsung dengan Admin");
    return;
  }

  // Student chatting with Admin about this item
  ST.chatReportId = rid;
  ST.draft = "";
  nav("pesan");
}

function chatAboutFound(fid) {
  closeAllDlg();
  const f = DB.found.find((x) => x.id === fid);
  if (!f) return;

  if (!ST.user) {
    ST.pendingFoundChat = { fid };
    goLogin(
      `Silakan masuk terlebih dahulu untuk berkonsultasi mengenai barang temuan "${f.name}".`,
    );
    return;
  }

  if (ST.user.role === "petugas") {
    toast("Sebagai Petugas, koordinasikan langsung dengan Admin");
    return;
  }

  ST.draft = `Halo Admin, saya ingin menanyakan mengenai barang temuan "${f.name}" (Kategori: ${f.cat}) yang ditemukan di ${f.loc}.`;
  nav("pesan");
}

async function sendM(f) {
  const t = f.t.value.trim();
  if (!t) return;
  const a = ST.user.role === "admin";
  if (a && !ST.chat) return toast("Pilih mahasiswa tujuan chat.");
  try {
    await API.req("/api/messages", {
      method: "POST",
      body: a
        ? { user_id: ST.chat, message: t, report_id: ST.chatReportId || null }
        : { message: t, report_id: ST.chatReportId || null },
    });
    f.t.value = "";
    await refreshStore();
  } catch (e) {
    return toast(e.message);
  }
  app();
  const i = $(".cf textarea");
  if (i) i.focus();
}

function quickSend(txt) {
  const tf = $(".cf textarea");
  if (tf) {
    tf.value = txt;
    tf.focus();
    tf.form.requestSubmit();
  }
}

V.pesan = function () {
    const a = ST.user.role === "admin";
    const me = a ? "admin" : "user";
    const us = a ? getSortedStudentsForAdmin() : [];

    if (a && (!ST.chat || !us.some((u) => u.id === ST.chat)) && us.length > 0) {
      ST.chat = us[0].id;
    }
    const uid = a ? ST.chat : ST.user.id;
    if (a && ST.chat) {
      markRead();
    }

    // Filter message list for active conversation
    const list = DB.msgs.filter((m) => m.uid === uid);
    const last = (id) => DB.msgs.filter((m) => m.uid === id).slice(-1)[0];
    const un = (id) =>
      DB.msgs.filter((m) => m.uid === id && m.from === "user" && !m.read)
        .length;

    // Associated Report if context exists
    const currentReport = ST.chatReportId
      ? DB.reports.find((r) => r.id === ST.chatReportId)
      : null;

    // Sidebar for Admin: mahasiswa dengan pesan terbaru selalu di paling atas
    const side = a
      ? `<div class="clist">
          <div class="clist-header">Percakapan Mahasiswa (${us.length})</div>
          ${us
            .map((u) => {
              const l = last(u.id);
              const n = un(u.id);
              const relatedMsg = DB.msgs
                .filter((m) => m.uid === u.id && m.rname)
                .slice(-1)[0];
              return `
              <button class="cu ${u.id === uid ? "on" : ""}" onclick="ST.chat=${u.id};app()">
                <span class="cu-av" aria-hidden="true">${esc((u.name || "?").trim().charAt(0).toUpperCase())}</span>
                <span class="cu-body">
                  <b>${esc(u.name)}</b>
                  <div class="meta">${esc(u.nim)} &bull; ${esc(u.prodi)}</div>
                  ${relatedMsg ? `<div class="item-tag">${esc(relatedMsg.rname)}</div>` : ""}
                  <div class="meta cu-last">${l ? esc(l.text) : "Belum ada pesan"}${l && l.at ? ` &bull; <time>${fmtClock(l.at)}</time>` : ""}</div>
                </span>
                ${n ? `<span class="cnt">${n}</span>` : ""}
              </button>
            `;
            })
            .join("")}
        </div>`
      : "";

    // Draft / Template Suggestion
    const draft = ST.draft;
    ST.draft = "";

    // Item Context Banner Header inside Chat
    const itemBanner = currentReport
      ? `
      <div class="chat-item-banner">
        <div class="chat-item-info">
          <div class="chat-item-thumb">
            ${currentReport.photo ? `<img src="${currentReport.photo}">` : ic(IC.photo)}
          </div>
          <div class="chat-item-text">
            <b>Membahas Barang: ${esc(currentReport.name)}</b>
            <span>${esc(currentReport.cat)} &bull; ${esc(currentReport.loc)} &bull; ${badge(currentReport.status)}</span>
          </div>
        </div>
        <div class="chat-item-actions">
          <button class="btn ghost sm detail-action" onclick="detail(${currentReport.id})">Lihat Detail Laporan</button>
          <button class="btn ghost sm" style="color:var(--mute)" onclick="ST.chatReportId=null;app()" title="Lepas topik barang">&times; Lepas Topik</button>
        </div>
      </div>
    `
      : "";

    // Quick Chips for Student or Admin
    const quickChips = a
      ? `
      <div class="quick-chips">
        <span class="quick-chip" onclick="quickSend('Halo, laporan Anda sudah kami periksa dan saat ini aktif di forum.')">Laporan diverifikasi</span>
        <span class="quick-chip" onclick="quickSend('Barang temuan yang cocok sudah kami amankan di Kemahasiswaan. Silakan datang membawa KTM.')">Cocok, silakan ambil</span>
        <span class="quick-chip" onclick="quickSend('Mohon sebutkan ciri khusus tambahan atau bukti kepemilikan untuk barang ini.')">Minta ciri khusus</span>
        <span class="quick-chip" onclick="quickSend('Petugas keamanan sedang memeriksa area penemuan terakhir.')">Sedang pencarian</span>
      </div>
    `
      : `
      <div class="quick-chips">
        <span class="quick-chip" onclick="quickSend('Halo Admin, bagaimana perkembangan pencarian barang yang saya upload ini?')">Status barang</span>
        <span class="quick-chip" onclick="quickSend('Halo Admin, saya melihat barang dengan ciri mirip di forum, apakah itu barang saya?')">Tanya kecocokan</span>
        <span class="quick-chip" onclick="quickSend('Halo Admin, saya ingin datang ke kantor untuk verifikasi kepemilikan barang.')">Jadwal verifikasi</span>
        <span class="quick-chip" onclick="quickSend('Halo Admin, saya ingin menambahkan detail ciri khusus pada barang saya.')">Tambah ciri khusus</span>
      </div>
    `;

    const activeUser = a ? uobj(uid) : null;
    const activeUserName = activeUser && activeUser.name
      ? activeUser.name + (activeUser.nim ? " (" + activeUser.nim + ")" : "")
      : "Mahasiswa";
    const activeUserProdi = activeUser && activeUser.prodi ? activeUser.prodi : "Mahasiswa";

    const thread = uid
      ? `
      <div class="cth">
        <div class="who">
          <div>
            <b>${esc(a ? activeUserName : "Admin Petugas Kemahasiswaan")}</b>
            <div style="font-size:12px;color:var(--mute);font-weight:normal">
              ${a ? esc(activeUserProdi) : "Pusat Layanan Lost & Found Kampus"}
            </div>
          </div>
          ${currentReport ? `<span class="badge ${currentReport.status}">Topik: ${esc(currentReport.name)}</span>` : ""}
        </div>
        ${itemBanner}
        <div class="cb" id="cb">
          ${
            list.length
              ? chatBubbles(list, me)
              : `<div class="empty">Belum ada percakapan. Mulai chat Anda di bawah ini terkait barang yang di-upload.</div>`
          }
        </div>
        ${quickChips}
        <form class="cf" onsubmit="event.preventDefault();sendM(this)">
          <textarea name="t" rows="1" required placeholder="${a ? "Ketik pesan Anda untuk mahasiswa..." : "Ketik pesan Anda untuk Admin mengenai barang yang di-upload..."}" oninput="autoGrow(this)" onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();this.form.requestSubmit()}">${esc(draft)}</textarea>
          <button class="btn">Kirim</button>
        </form>
      </div>
    `
      : `<div class="empty">Belum ada data mahasiswa terdaftar.</div>`;

    const mainEl = $("#main");
    if (mainEl) {
      mainEl.classList.add("chat-page");
      mainEl.innerHTML =
        head(
          "Pesan & Konsultasi Admin",
          a
            ? "Konsultasikan langsung dengan mahasiswa mengenai laporan kehilangan dan barang temuan."
            : "Hubungi Admin Kemahasiswaan mengenai status laporan atau barang yang Anda upload.",
        ) + `<div class="card chat ${a ? "" : "solo"}">${side}${thread}</div>`;
    }

    const cb = $("#cb");
    if (cb) cb.scrollTop = cb.scrollHeight;
    const ta = $(".cf textarea");
    if (ta && ta.value) autoGrow(ta);

    startChatPolling();
  };

// Auto polling pesan masuk saat di halaman chat (2.5 detik)
// Memperbarui list percakapan secara realtime tanpa mengganggu fokus/ketikan admin
function startChatPolling() {
  if (window._chatPollTimer) return;
  window._chatPollTimer = setInterval(async () => {
    if (!ST.user || ST.view !== "pesan") {
      if (window._chatPollTimer) {
        clearInterval(window._chatPollTimer);
        window._chatPollTimer = null;
      }
      return;
    }
    try {
      const res = await API.req("/api/messages");
      const fresh = (res.data || []).map(mapMsg);
      const prevLast = DB.msgs.length ? DB.msgs[DB.msgs.length - 1] : null;
      const freshLast = fresh.length ? fresh[fresh.length - 1] : null;
      const changed =
        fresh.length !== DB.msgs.length ||
        (freshLast &&
          (!prevLast ||
            freshLast.id !== prevLast.id ||
            freshLast.read !== prevLast.read));

      if (changed) {
        DB.msgs = fresh;
        if (ST.chat) {
          markRead();
        }

        const ta = document.querySelector(".cf textarea");
        const isFocused = ta && document.activeElement === ta;
        const currentVal = ta ? ta.value : "";
        const selStart = ta ? ta.selectionStart : 0;
        const selEnd = ta ? ta.selectionEnd : 0;

        V.pesan();

        if (currentVal) {
          const newTa = document.querySelector(".cf textarea");
          if (newTa) {
            newTa.value = currentVal;
            if (isFocused) {
              newTa.focus();
              newTa.setSelectionRange(selStart, selEnd);
            }
            autoGrow(newTa);
          }
        }
      }
    } catch (_) {}
  }, 2500);
}

