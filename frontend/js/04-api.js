// js/04-api.js — Klien API backend + sesi JWT.
// Opsi A: script klasik berurutan. Urutan load di frontend/index.html. Jangan load satuan.
/* DEADCODE DIBUANG: useApi() selalu-true dan tak pernah dipakai. */
// API backend (produksi, wajib). Tidak ada mode offline/demo.
const API = {
  base: "",
  async req(path, { method = "GET", body, form } = {}) {
    const headers = {};
    if (ST.token) headers.Authorization = `Bearer ${ST.token}`;
    let payload;
    if (form) {
      payload = form; // FormData (upload KTM): jangan set Content-Type manual
    } else if (body !== undefined) {
      headers["Content-Type"] = "application/json";
      payload = JSON.stringify(body);
    }
    const res = await fetch(`${API.base}${path}`, {
      method,
      headers,
      body: payload,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.success === false) {
      throw new Error(data.message || `Gagal memuat (${res.status})`);
    }
    return data;
  },
};

function setSession(user, token) {
  ST.user = user;
  ST.token = token || null;
  if (token) sessionStorage.setItem("LF_TOKEN", token);
  else sessionStorage.removeItem("LF_TOKEN");
}

