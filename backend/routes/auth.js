// routes/auth.js — Auth satu pintu.
const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../config/db");
const { isValidProdi } = require("../config/prodi");
const { signToken, requireAuth, requireRole } = require("../middleware/auth");
const { uploadKtm, fileToBase64 } = require("../middleware/uploadKtm");
const { authLimiter, passwordResetLimiter } = require("../middleware/rateLimit");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { sendErr } = require("../utils/sendErr");
const { audit } = require("../utils/audit");
const { publicUser } = require("../utils/publicUser");

const router = express.Router();

const resetMailTransport = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE).toLowerCase() === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
};
const resetMessage = "Jika email terdaftar, kode OTP akan dikirim.";
const OTP_EXPIRY_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;

// Generate OTP 6 digit angka
function generateOtp() {
  return String(crypto.randomInt(100000, 999999));
}
function hashOtp(otp) {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

// ==========================================
// 5. AUTH SATU PINTU (PRD §6: bcrypt + JWT + status verifikasi)
// identifier = NIM / Email (user) ATAU username (petugas/admin)
// ==========================================
router.post("/api/auth/login", authLimiter, async (req, res) => {
  try {
    const identifier = String(
      req.body.identifier || req.body.nim || req.body.username || "",
    ).trim();
    const password = String(req.body.password || "");
    if (!identifier || !password)
      return sendErr(res, 400, "NIM/email/username dan kata sandi wajib diisi.");

    const key = identifier.toLowerCase();
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(key);

    let rows;
    if (isEmail) {
      // Login via email — cari di semua role
      [rows] = await db.query(
        'SELECT * FROM users WHERE LOWER(email) = ?',
        [key],
      );
    } else {
      // Login via NIM (mahasiswa) atau username (petugas/admin)
      [rows] = await db.query(
        'SELECT * FROM users WHERE (role = "user" AND nim = ?) OR (role IN ("petugas","admin") AND LOWER(username) = ?)',
        [identifier, key],
      );
    }
    if (rows.length === 0)
      return sendErr(
        res,
        401,
        "Akun tidak ditemukan. Periksa NIM/email/username Anda.",
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
router.post("/api/auth/forgot-password", passwordResetLimiter, async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return sendErr(res, 400, "Format email tidak valid.");
  const transport = resetMailTransport();
  if (!transport) return sendErr(res, 503, "Pemulihan password belum aktif. Administrator perlu mengonfigurasi SMTP.");
  try {
    const [users] = await db.query("SELECT id, name, email FROM users WHERE LOWER(email) = ? LIMIT 1", [email]);
    if (users.length) {
      const otp = generateOtp();
      const otpHash = hashOtp(otp);
      // Hapus token lama user ini + token kedaluwarsa
      await db.query("DELETE FROM password_reset_tokens WHERE user_id = ? OR expires_at < NOW()", [users[0].id]);
      await db.query(
        "INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, attempts) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE), 0)",
        [users[0].id, otpHash, OTP_EXPIRY_MINUTES]
      );
      await transport.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: email,
        subject: "Kode OTP Reset Password — Lost & Found Kampus",
        text: `Halo ${users[0].name},\n\nKode OTP untuk reset password Anda:\n\n  ${otp}\n\nKode berlaku selama ${OTP_EXPIRY_MINUTES} menit.\nJangan bagikan kode ini kepada siapa pun.\n\nJika Anda tidak meminta reset password, abaikan email ini.`,
        html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="margin:0 0 8px">Reset Password</h2>
          <p>Halo <b>${users[0].name}</b>,</p>
          <p>Kode OTP untuk reset password Anda:</p>
          <div style="text-align:center;margin:24px 0">
            <span style="font-size:32px;font-weight:bold;letter-spacing:8px;padding:16px 28px;background:#f5f5f5;border-radius:12px;border:2px solid #ddd">${otp}</span>
          </div>
          <p style="color:#666;font-size:14px">Kode berlaku selama <b>${OTP_EXPIRY_MINUTES} menit</b>. Jangan bagikan kode ini kepada siapa pun.</p>
          <p style="color:#999;font-size:13px">Jika Anda tidak meminta reset password, abaikan email ini.</p>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
          <p style="color:#999;font-size:12px;text-align:center">Lost &amp; Found Kampus</p>
        </div>`,
      });
    }
    return res.json({ success: true, message: resetMessage });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Pemulihan password gagal diproses." });
  }
});

// Verifikasi OTP — mengembalikan reset_token jika OTP cocok
router.post("/api/auth/verify-otp", passwordResetLimiter, async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const otp = String(req.body.otp || "").trim();
  if (!email || !otp) return sendErr(res, 400, "Email dan kode OTP wajib diisi.");
  if (!/^[0-9]{6}$/.test(otp)) return sendErr(res, 400, "Kode OTP harus 6 digit angka.");
  try {
    const [users] = await db.query("SELECT id FROM users WHERE LOWER(email) = ? LIMIT 1", [email]);
    if (!users.length) return sendErr(res, 400, "Kode OTP tidak valid atau sudah kedaluwarsa.");

    const [tokens] = await db.query(
      "SELECT id, token_hash, attempts FROM password_reset_tokens WHERE user_id = ? AND used_at IS NULL AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1",
      [users[0].id]
    );
    if (!tokens.length) return sendErr(res, 400, "Kode OTP tidak valid atau sudah kedaluwarsa.");

    const tokenRow = tokens[0];

    // Cek batas percobaan
    if (tokenRow.attempts >= OTP_MAX_ATTEMPTS) {
      await db.query("UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ?", [tokenRow.id]);
      return sendErr(res, 400, "Terlalu banyak percobaan salah. Silakan minta OTP baru.");
    }

    const otpHash = hashOtp(otp);
    if (otpHash !== tokenRow.token_hash) {
      // Tambah hitungan percobaan
      await db.query("UPDATE password_reset_tokens SET attempts = attempts + 1 WHERE id = ?", [tokenRow.id]);
      const remaining = OTP_MAX_ATTEMPTS - tokenRow.attempts - 1;
      return sendErr(res, 400, `Kode OTP salah. ${remaining > 0 ? `Sisa percobaan: ${remaining}` : "Silakan minta OTP baru."}`);
    }

    // OTP cocok — generate reset_token sementara untuk step reset password
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
    // Tandai OTP lama sebagai sudah dipakai, buat token reset baru (berlaku 15 menit)
    await db.query("UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ?", [tokenRow.id]);
    await db.query(
      "INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, attempts) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 15 MINUTE), 0)",
      [users[0].id, resetTokenHash]
    );

    return res.json({ success: true, message: "OTP terverifikasi. Silakan buat password baru.", reset_token: resetToken });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Verifikasi OTP gagal diproses." });
  }
});

router.post("/api/auth/reset-password", passwordResetLimiter, async (req, res) => {
  const token = String(req.body.token || req.body.reset_token || "");
  const password = String(req.body.password || "");
  const confirm = String(req.body.confirm || "");
  if (!/^[a-f0-9]{64}$/.test(token)) return sendErr(res, 400, "Token reset tidak valid.");
  if (password.length < 6) return sendErr(res, 400, "Kata sandi minimal 6 karakter.");
  if (password !== confirm) return sendErr(res, 400, "Konfirmasi kata sandi tidak sama.");
  try {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const [rows] = await db.query("SELECT id, user_id FROM password_reset_tokens WHERE token_hash = ? AND used_at IS NULL AND expires_at > NOW() LIMIT 1", [tokenHash]);
    if (!rows.length) return sendErr(res, 400, "Token reset tidak valid atau sudah kedaluwarsa. Ulangi proses dari awal.");
    const hash = await bcrypt.hash(password, 10);
    await db.query("UPDATE users SET password_hash = ? WHERE id = ?", [hash, rows[0].user_id]);
    await db.query("UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ? AND used_at IS NULL", [rows[0].id]);
    // Hapus semua token lama user setelah reset berhasil
    await db.query("DELETE FROM password_reset_tokens WHERE user_id = ? AND id != ?", [rows[0].user_id, rows[0].id]);
    return res.json({ success: true, message: "Password berhasil diubah. Silakan masuk kembali." });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Password gagal diubah." });
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
      const email = String(req.body.email || "").trim().toLowerCase();
      const password = String(req.body.password || "");
      const confirm = String(
        req.body.confirm || req.body.password_confirm || "",
      );

      if (!name || !nim || !email || !prodi || !password)
        return sendErr(
          res,
          400,
          "Lengkapi nama, NIM, email, prodi, kata sandi, dan foto KTM.",
        );
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        return sendErr(res, 400, "Format email tidak valid.");
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

      const [existing] = await db.query(
        "SELECT nim, email FROM users WHERE nim = ? OR email = ?",
        [nim, email],
      );
      if (existing.length > 0) {
        return sendErr(res, 400, "NIM atau email sudah terdaftar. Silakan masuk.");
      }

      const hash = await bcrypt.hash(password, 10);
      // Simpan foto KTM sebagai base64 data URL langsung ke database
      const ktmBase64 = fileToBase64(req.file);

      const [result] = await db.query(
        'INSERT INTO users (name, nim, email, prodi, password_hash, role, verification_status, ktm_photo) VALUES (?, ?, ?, ?, ?, "user", "PENDING", ?)',
        [name, nim, email, prodi, hash, ktmBase64],
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
        'SELECT id, name, nim, prodi, ktm_photo, verification_status, created_at FROM users WHERE role = "user" AND verification_status = "PENDING" ORDER BY created_at ASC',
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
        'UPDATE users SET verification_status = ?, rejected_reason = ?, verified_by_id = ?, verified_at = ? WHERE id = ? AND role = "user"',
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
