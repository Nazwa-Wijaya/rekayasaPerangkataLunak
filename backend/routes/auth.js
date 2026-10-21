// routes/auth.js — Auth satu pintu.
const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../config/db");
const { isValidProdi } = require("../config/prodi");
const { signToken, requireAuth, requireRole } = require("../middleware/auth");
const { uploadKtm, fileToBase64 } = require("../middleware/uploadKtm");
const { authLimiter } = require("../middleware/rateLimit");
const { sendErr } = require("../utils/sendErr");
const { audit } = require("../utils/audit");
const { publicUser } = require("../utils/publicUser");

const router = express.Router();

// ==========================================
// 5. AUTH SATU PINTU (PRD §6: bcrypt + JWT + status verifikasi)
// identifier = NIM (user) ATAU username (petugas/admin)
// ==========================================
router.post("/api/auth/login", authLimiter, async (req, res) => {
  try {
    const identifier = String(
      req.body.identifier || req.body.nim || req.body.username || "",
    ).trim();
    const password = String(req.body.password || "");
    if (!identifier || !password)
      return sendErr(res, 400, "NIM/username dan kata sandi wajib diisi.");

    const key = identifier.toLowerCase();
    const [rows] = await db.query(
      `SELECT * FROM users WHERE (role = 'user' AND nim = ?) OR (role IN ('petugas','admin') AND LOWER(username) = ?)`,
      [identifier, key],
    );
    if (rows.length === 0)
      return sendErr(
        res,
        401,
        "Akun tidak ditemukan. Periksa NIM/username Anda.",
      );

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash || "");
    if (!ok) return sendErr(res, 401, "Kata sandi salah.");

    // Mahasiswa wajib sudah ACTIVE (Cara B). Staf selalu ACTIVE dari seed.
    if (user.role === "user" && user.verification_status !== "ACTIVE") {
      if (user.verification_status === "PENDING") {
        return sendErr(
          res,
          403,
          "Akun menunggu verifikasi Admin. Tunggu ACC setelah upload KTM.",
        );
      }
      return sendErr(
        res,
        403,
        `Pendaftaran ditolak Admin${user.rejected_reason ? `: ${user.rejected_reason}` : "."}`,
      );
    }

    const token = signToken(user);
    res.json({
      success: true,
      message: "Login berhasil.",
      token,
      user: publicUser(user),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
// Regist mahasiswa Cara B: multipart (data + file ktm), status PENDING, tanpa auto-login
router.post("/api/auth/register", authLimiter, (req, res) => {
  uploadKtm(req, res, async (upErr) => {
    try {
      if (upErr) return sendErr(res, 400, upErr.message);
      const name = String(req.body.name || "").trim();
      const nim = String(req.body.nim || "").trim();
      const prodi = String(req.body.prodi || "").trim();
      const password = String(req.body.password || "");
      const confirm = String(
        req.body.confirm || req.body.password_confirm || "",
      );

      if (!name || !nim || !prodi || !password)
        return sendErr(
          res,
          400,
          "Lengkapi nama, NIM, prodi, kata sandi, dan foto KTM.",
        );
      if (!/^[0-9]{5,15}$/.test(nim))
        return sendErr(res, 400, "NIM harus berupa angka (5-15 digit).");
      if (!isValidProdi(prodi))
        return sendErr(
          res,
          400,
          "Program studi tidak dikenal. Pilih dari daftar resmi.",
        );
      if (password.length < 6)
        return sendErr(res, 400, "Kata sandi minimal 6 karakter.");
      if (confirm && confirm !== password)
        return sendErr(res, 400, "Konfirmasi kata sandi tidak sama.");
      if (!req.file)
        return sendErr(
          res,
          400,
          "Foto KTM wajib diunggah (JPG/PNG/WEBP, maks 2 MB).",
        );

      const [existing] = await db.query("SELECT id FROM users WHERE nim = ?", [
        nim,
      ]);
      if (existing.length > 0) {
        return sendErr(res, 400, "NIM sudah terdaftar. Silakan masuk.");
      }

      const hash = await bcrypt.hash(password, 10);
      // Simpan foto KTM sebagai base64 data URL langsung ke database
      const ktmBase64 = fileToBase64(req.file);

      const [result] = await db.query(
        `INSERT INTO users (name, nim, prodi, password_hash, role, verification_status, ktm_photo) VALUES (?, ?, ?, ?, 'user', 'PENDING', ?)`,
        [name, nim, prodi, hash, ktmBase64],
      );
      await audit(
        null,
        "regist.pending",
        "users",
        result.insertId,
        `NIM ${nim}`,
      );

      res.status(201).json({
        success: true,
        message: "Pendaftaran diterima. Akun menunggu verifikasi Admin.",
        user: {
          id: result.insertId,
          name,
          nim,
          prodi,
          role: "user",
          verification_status: "PENDING",
        },
      });
    } catch (err) {
      if (
        err &&
        (err.code === "ER_NET_PACKET_TOO_LARGE" ||
          /max_allowed_packet/i.test(err.message || ""))
      ) {
        return sendErr(
          res,
          413,
          "Foto KTM terlalu besar untuk database. Gunakan foto yang lebih kecil, atau naikkan max_allowed_packet MySQL (mis. 16M).",
        );
      }
      res.status(500).json({ success: false, message: err.message });
    }
  });
});
// Antrian regist PENDING (admin)
router.get(
  "/api/auth/pending-registrations",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    try {
      const [rows] = await db.query(
        `SELECT id, name, nim, prodi, ktm_photo, verification_status, created_at FROM users WHERE role = 'user' AND verification_status = 'PENDING' ORDER BY created_at ASC`,
      );
      res.json({ success: true, data: rows });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
);
// ACC / tolak regist (admin)
router.post(
  "/api/auth/verify-registration",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { user_id, approve, reason } = req.body;
      if (!user_id) return sendErr(res, 400, "user_id wajib diisi.");
      if (approve === false && !String(reason || "").trim()) {
        return sendErr(res, 400, "Alasan penolakan wajib diisi.");
      }
      const status = approve === false ? "REJECTED" : "ACTIVE";
      await db.query(
        `UPDATE users SET verification_status = ?, rejected_reason = ?, verified_by_id = ?, verified_at = ? WHERE id = ? AND role = 'user'`,
        [
          status,
          approve === false ? String(reason).trim() : null,
          req.auth.id,
          new Date(),
          user_id,
        ],
      );
      await audit(
        req.auth.id,
        approve === false ? "regist.reject" : "regist.approve",
        "users",
        user_id,
        reason || null,
      );
      res.json({
        success: true,
        message:
          approve === false
            ? "Pendaftaran ditolak."
            : "Pendaftaran disetujui. Mahasiswa bisa masuk.",
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
);
// Profil akun dari token (untuk restore sesi setelah refresh)
router.get("/api/auth/me", requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM users WHERE id = ?", [
      req.auth.id,
    ]);
    if (rows.length === 0) return sendErr(res, 401, "Akun tidak ditemukan.");
    res.json({ success: true, user: publicUser(rows[0]) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
