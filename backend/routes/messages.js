// routes/messages.js — Chat.
const express = require("express");
const db = require("../config/db");
const { sendErr } = require("../utils/sendErr");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

// ==========================================
// 4d. CHAT / PESAN (ganti mock localStorage + auto-reply palsu)
// ==========================================
router.get("/api/messages", requireAuth, async (req, res) => {
  try {
    const { user_id } = req.query;
    let q = `SELECT m.*, r.item_name AS report_name FROM messages m LEFT JOIN lost_reports r ON m.report_id = r.id WHERE 1=1`;
    const params = [];
    if (req.auth.role === "user") {
      q += " AND m.user_id = ?";
      params.push(req.auth.id);
    } else if (user_id) {
      q += " AND m.user_id = ?";
      params.push(user_id);
    }
    q += " ORDER BY m.created_at ASC";
    const [rows] = await db.query(q, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
router.post(
  "/api/messages",
  requireAuth,
  requireRole("user", "admin"),
  async (req, res) => {
    try {
      const text = String(req.body.message || req.body.text || "").trim();
      const reportId = req.body.report_id || req.body.rid || null;
      let uid = req.body.user_id || null;
      if (req.auth.role === "user") uid = req.auth.id;
      if (!uid) return sendErr(res, 400, "Pilih mahasiswa tujuan chat.");
      if (!text) return sendErr(res, 400, "Pesan tidak boleh kosong.");
      const [r] = await db.query(
        "INSERT INTO messages (user_id, sender_role, sender_id, report_id, message) VALUES (?, ?, ?, ?, ?)",
        [
          uid,
          req.auth.role === "admin" ? "admin" : "user",
          req.auth.id,
          reportId,
          text,
        ],
      );
      res.status(201).json({ success: true, id: r.insertId });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
);
router.patch("/api/messages/read", requireAuth, async (req, res) => {
  try {
    const { user_id } = req.body;
    const uid = req.auth.role === "admin" ? user_id : req.auth.id;
    if (!uid) return sendErr(res, 400, "user_id wajib diisi.");
    const other = req.auth.role === "admin" ? "user" : "admin";
    await db.query(
      "UPDATE messages SET is_read = TRUE WHERE user_id = ? AND sender_role = ?",
      [uid, other],
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
