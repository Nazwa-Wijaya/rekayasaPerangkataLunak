// routes/uploads.js — Foto KTM.
const express = require("express");
const path = require("path");
const fs = require("fs");
const db = require("../config/db");
const { sendErr } = require("../utils/sendErr");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

// ==========================================
// 4f. FOTO KTM
// Baru: base64 di database. Lama: file di backend/uploads/ktm.
// Endpoint ini melayani keduanya agar data lama tidak "Cannot GET".
// - base64 (data:image/...) -> decode langsung dari DB
// - file fisik masih ada di disk -> kirim file
// - keduanya hilang -> placeholder SVG 404 (bukan "Cannot GET")
// Hanya pemilik akun + admin.
// ==========================================
// 1x1 transparent PNG fallback untuk <img> yang KTM-nya hilang
const KTM_PLACEHOLDER = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);
const serveKtmImage = async (req, res) => {
  try {
    const file = path.basename(req.params.file || req.params[0] || "");
    if (!file)
      return res
        .status(400)
        .json({ success: false, message: "Nama file KTM tidak valid." });

    const [rows] = await db.query(
      "SELECT id, ktm_photo FROM users WHERE ktm_photo LIKE ?",
      [`%${file}%`],
    );
    const owner = rows[0];
    if (!owner) {
      // Data sudah tidak ada di DB -> placeholder agar <img> tidak rusak
      if ((req.headers.accept || "").includes("image")) {
        res.set("Content-Type", "image/png");
        res.set("Cache-Control", "no-store");
        return res.send(KTM_PLACEHOLDER);
      }
      return sendErr(
        res,
        404,
        "Foto KTM tidak ditemukan (data lama sudah tidak tersedia).",
      );
    }
    if (req.auth.role !== "admin" && req.auth.id !== owner.id) {
      return sendErr(res, 403, "Anda tidak memiliki izin membuka foto ini.");
    }

    // Kasus baru: base64 data URL di DB -> decode dan kirim sebagai gambar
    const stored = String(owner.ktm_photo || "");
    const m = stored.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/s);
    if (m) {
      const buf = Buffer.from(m[2], "base64");
      res.set("Content-Type", m[1]);
      res.set("Cache-Control", "private, max-age=3600");
      return res.send(buf);
    }

    // Kasus lama: path file -> kirim file fisik bila masih ada di disk.
    // Normalisasi: DB lama berisi "backend/uploads/ktm/xxx" atau "/backend/uploads/ktm/xxx".
    const storedPath = String(owner.ktm_photo || "").replace(/^\/+/, "");
    const candidates = [
      path.join(__dirname, "uploads", "ktm", file),
      path.join(__dirname, "..", "backend", "uploads", "ktm", file),
      path.join(__dirname, "..", storedPath),
      path.resolve(__dirname, "..", "..", storedPath),
    ];
    for (const full of candidates) {
      try {
        if (full && fs.existsSync(full) && fs.statSync(full).isFile()) {
          return res.sendFile(path.resolve(full));
        }
      } catch (_) {}
    }

    // File fisik sudah hilang -> placeholder agar <img> tidak rusak
    if ((req.headers.accept || "").includes("image")) {
      res.set("Content-Type", "image/png");
      res.set("Cache-Control", "no-store");
      return res.send(KTM_PLACEHOLDER);
    }
    return sendErr(
      res,
      404,
      "File KTM lama sudah tidak tersedia di server. Minta mahasiswa daftar ulang.",
    );
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
// Route kanonis
router.get("/uploads/ktm/:file", requireAuth, serveKtmImage);
// Kompatibilitas URL lama yang diawali /backend/... (penyebab "Cannot GET /backend/uploads/ktm/...")
router.get("/backend/uploads/ktm/:file", requireAuth, serveKtmImage);

module.exports = router;
